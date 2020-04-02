"use strict";

import assert from "assert";
import { deferred } from "./helpers/adapter";
import { testFulfilled } from "./helpers/threeCases";

const dummy = { dummy: "dummy" }; // we fulfill or reject with this when we don't intend to test against it

describe("2.1.2.1: When fulfilled, a promise: must not transition to any other state.", () => {
  testFulfilled(dummy, (promise, done) => {
    let onFulfilledCalled = false;

    promise.then(
      () => {
        onFulfilledCalled = true;
      },
      () => {
        assert.strictEqual(onFulfilledCalled, false);
        done();
      }
    );

    setTimeout(done, 5);
  });

  specify("trying to fulfill then immediately reject", (done) => {
    const d = deferred();
    let onFulfilledCalled = false;

    d.promise.then(
      () => {
        onFulfilledCalled = true;
      },
      () => {
        assert.strictEqual(onFulfilledCalled, false);
        done();
      }
    );

    d.resolve(dummy);
    d.reject(dummy);
    setTimeout(done, 5);
  });

  specify("trying to fulfill then reject, delayed", (done) => {
    const d = deferred();
    let onFulfilledCalled = false;

    d.promise.then(
      () => {
        onFulfilledCalled = true;
      },
      () => {
        assert.strictEqual(onFulfilledCalled, false);
        done();
      }
    );

    setTimeout(() => {
      d.resolve(dummy);
      d.reject(dummy);
    }, 5);
    setTimeout(done, 10);
  });

  specify("trying to fulfill immediately then reject delayed", (done) => {
    const d = deferred();
    let onFulfilledCalled = false;

    d.promise.then(
      () => {
        onFulfilledCalled = true;
      },
      () => {
        assert.strictEqual(onFulfilledCalled, false);
        done();
      }
    );

    d.resolve(dummy);
    setTimeout(() => {
      d.reject(dummy);
    }, 5);
    setTimeout(done, 10);
  });
});
