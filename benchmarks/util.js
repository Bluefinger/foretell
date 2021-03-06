const UNDEF = "undefined";
const QUEUE_SIZE = 2048;

let pointer = 0;
let queue = [];

const flushQueue = () => {
  let old;
  while (queue.length - pointer) {
    queue[pointer]();
    queue[pointer++] = undefined;
    if (pointer === QUEUE_SIZE) {
      old = queue;
      queue = old.slice(QUEUE_SIZE);
      old.length = pointer = 0;
    }
  }
};

const schedule = (() => {
  if (typeof queueMicrotask !== UNDEF) {
    return () => queueMicrotask(flushQueue);
  }
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

module.exports = {
  log: function (msg) {
    if (typeof document !== "undefined") {
      const div = document.createElement("div");
      div.innerText = msg;
      document.body.append(div);
    }
    console.log(msg);
  },
  defer: function (fn) {
    if (queue.push(fn) - pointer === 1) schedule();
  },
};
