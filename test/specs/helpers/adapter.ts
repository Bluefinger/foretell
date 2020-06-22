"use strict";

import Foretell from "../../../src/promise";

Foretell.suppressUncaughtExceptions = true;

interface Deferred<T> {
  resolve: (arg?: any) => void;
  reject: (arg?: any) => void;
  promise: Foretell<T>;
}

const resolved = Foretell.resolve;
const rejected = Foretell.reject;
const deferred = <T extends any>(): Deferred<T> => {
  let resolve: (arg?: any) => void, reject: (reason: any) => void;
  const promise = new Foretell<T>((success, fail) => {
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
