"use strict";

import Foretell from "../../../src/promise";

Foretell.suppressUncaughtExceptions = true;

const resolved = Foretell.resolve;
const rejected = Foretell.reject;
const deferred = () => {
  let resolve: (arg?: any) => void, reject: (reason: any) => void;
  const promise = new Foretell<any>((success, fail) => {
    resolve = success;
    reject = fail;
  });
  return {
    resolve: resolve!,
    reject: reject!,
    promise,
  };
};

export { resolved, rejected, deferred };
