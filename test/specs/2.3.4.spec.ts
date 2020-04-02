"use strict";

import assert from "assert";
import { testFulfilled, testRejected } from "./helpers/threeCases";

const dummy = { dummy: "dummy" }; // we fulfill or reject with this when we don't intend to test against it

describe("2.3.4: If `x` is not an object or function, fulfill `promise` with `x`", () => {
  const testValue = (
    expectedValue: any,
    stringRepresentation: string,
    beforeEachHook?: () => void,
    afterEachHook?: () => void
  ) => {
    describe("The value is " + stringRepresentation, () => {
      if (typeof beforeEachHook === "function") {
        beforeEach(beforeEachHook);
      }
      if (typeof afterEachHook === "function") {
        afterEach(afterEachHook);
      }

      testFulfilled(dummy, (promise1, done) => {
        const promise2 = promise1.then(() => {
          return expectedValue;
        });

        promise2.then((actualValue) => {
          assert.strictEqual(actualValue, expectedValue);
          done();
        });
      });
      testRejected(dummy, (promise1, done) => {
        const promise2 = promise1.then(null, () => {
          return expectedValue;
        });

        promise2.then((actualValue) => {
          assert.strictEqual(actualValue, expectedValue);
          done();
        });
      });
    });
  };

  testValue(undefined, "`undefined`");
  testValue(null, "`null`");
  testValue(false, "`false`");
  testValue(true, "`true`");
  testValue(0, "`0`");

  testValue(
    true,
    "`true` with `Boolean.prototype` modified to have a `then` method",
    () => {
      (Boolean.prototype as any).then = () => {};
    },
    () => {
      delete (Boolean.prototype as any).then;
    }
  );

  testValue(
    1,
    "`1` with `Number.prototype` modified to have a `then` method",
    () => {
      (Number.prototype as any).then = () => {};
    },
    () => {
      delete (Number.prototype as any).then;
    }
  );
});
