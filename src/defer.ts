import { QUEUE_SIZE, UNDEF } from "./constants";

let pointer = 0;
let queue: (() => any)[] = [];

const flushQueue = () => {
  let old: (() => any)[];
  while (queue.length - pointer) {
    queue[pointer]();
    queue[pointer++] = undefined as any;
    if (pointer === QUEUE_SIZE) {
      old = queue;
      queue = old.slice(QUEUE_SIZE);
      old.length = pointer = 0;
    }
  }
};

const schedule = (() => {
  // Micro-task scheduling for browsers
  if (typeof MutationObserver !== UNDEF) {
    const div = document.createElement("div");
    const observer = new MutationObserver(flushQueue);
    observer.observe(div, { attributes: true });
    return () => div.setAttribute("a", "0");
  }

  // Micro-task scheduling for Node
  if (typeof process !== UNDEF) {
    return () => process.nextTick(flushQueue);
  }

  // Micro-task scheduling for MSIE
  if (typeof setImmediate !== UNDEF)
    return () => {
      setImmediate(flushQueue);
    };

  // Slow fallback for things that simply can't
  return () => {
    setTimeout(flushQueue, 0);
  };
})();

export const defer = (fn: () => any) => {
  if (queue.push(fn) - pointer === 1) schedule();
};
