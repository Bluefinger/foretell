"use strict";

import { resolved, rejected, deferred } from "./adapter";
import type Foretell from "src/promise";

export const testFulfilled = (
  value: any,
  test: (promise: Foretell<any>, done: Mocha.Done) => void
) => {
  specify("already-fulfilled", (done) => {
    test(resolved(value), done);
  });

  specify("immediately-fulfilled", (done) => {
    const d = deferred();
    test(d.promise, done);
    d.resolve(value);
  });

  specify("eventually-fulfilled", (done) => {
    const d = deferred();
    test(d.promise, done);
    setTimeout(() => {
      d.resolve(value);
    }, 5);
  });
};

export const testRejected = (
  reason: any,
  test: (promise: Foretell<any>, done: Mocha.Done) => void
) => {
  specify("already-rejected", (done) => {
    test(rejected(reason), done);
  });

  specify("immediately-rejected", (done) => {
    const d = deferred();
    test(d.promise, done);
    d.reject(reason);
  });

  specify("eventually-rejected", (done) => {
    const d = deferred();
    test(d.promise, done);
    setTimeout(() => {
      d.reject(reason);
    }, 5);
  });
};
