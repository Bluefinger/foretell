import { UNDEF } from "./constants";

export const scheduler = (flush: () => void) => {
  // Modern Micro-task scheduling for browsers
  if (typeof queueMicrotask !== UNDEF) {
    return () => queueMicrotask(flush);
  }

  // Fallback Micro-task scheduling for browsers
  if (typeof MutationObserver !== UNDEF) {
    const div = document.createElement("div");
    const observer = new MutationObserver(flush);
    observer.observe(div, { attributes: true });
    return () => div.setAttribute("a", "0");
  }

  // Micro-task scheduling for Node
  if (typeof process !== UNDEF) {
    return () => process.nextTick(flush);
  }

  // Micro-task scheduling for MSIE
  if (typeof setImmediate !== UNDEF) {
    return () => {
      setImmediate(flush);
    };
  }

  // Slow fallback for things that simply can't
  return () => {
    setTimeout(flush, 0);
  };
};
