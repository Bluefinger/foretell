"use strict";

import assert from "assert";
import { resolved, rejected } from "./helpers/adapter";

const dummy = { dummy: "dummy" }; // we fulfill or reject with this when we don't intend to test against it

describe("2.3.1: If `promise` and `x` refer to the same object, reject `promise` with a `TypeError' as the reason.", () => {
  specify("via return from a fulfilled promise", (done) => {
    const promise: any = resolved(dummy).then(() => {
      return promise;
    });

    promise.then(null, (reason: any) => {
      assert(reason instanceof TypeError);
      done();
    });
  });

  specify("via return from a rejected promise", (done) => {
    const promise: any = rejected(dummy).then(null, () => {
      return promise;
    });

    promise.then(null, (reason: any) => {
      assert(reason instanceof TypeError);
      done();
    });
  });
});
