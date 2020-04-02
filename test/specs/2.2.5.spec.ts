import assert from "assert";
import { rejected, resolved } from "./helpers/adapter";

const dummy = { dummy: "dummy" };

describe("2.2.5 `onFulfilled` and `onRejected` must be called as functions (i.e. with no `this` value).", () => {
  describe("strict mode", () => {
    "use strict";
    specify("fulfilled", (done) => {
      resolved(dummy)
        .then(function onFulfilled(this: undefined) {
          assert.strictEqual(this, undefined);
        })
        .then(done, done);
    });

    specify("rejected", (done) => {
      rejected(dummy)
        .then(null, function onRejected(this: undefined) {
          assert.strictEqual(this, undefined);
        })
        .then(done, done);
    });
  });

  describe("sloppy mode", () => {
    specify("fulfilled", (done) => {
      resolved(dummy)
        .then(function onFulfilled(this: any) {
          assert.strictEqual(this, global);
        })
        .then(done, done);
    });

    specify("rejected", (done) => {
      rejected(dummy)
        .then(null, function onRejected(this: any) {
          assert.strictEqual(this, global);
        })
        .then(done, done);
    });
  });
});
