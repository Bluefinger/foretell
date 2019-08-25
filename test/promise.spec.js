const assert = require("assert");
const Foretell = require("./generated/foretell");

describe("Foretell methods", () => {
  describe("constructor", () => {
    it("rejects when given auto-failing function", () =>
      new Foretell(() => {
        throw new Error("fail");
      }).then(
        () => assert.fail("Unexpected success"),
        error =>
          assert.equal(error.message, "fail", "Error message didn't match")
      ));
    it("errors when given a non-function parameter", () => {
      try {
        new Foretell(1);
        assert.fail("Unexpected success");
      } catch (error) {
        assert.equal(
          error.message,
          "1 is not a function",
          "Error not expected type failure"
        );
      }
    });
    it("returns an unresolved promise when given no parameters", () => {
      const promise = new Foretell();
      assert.equal(
        promise instanceof Foretell,
        true,
        "Promise is not a Foretell instance"
      );
    });
  });
  describe(".catch()", () => {
    it("catches rejected promises", () =>
      Foretell.reject("Rejected").catch(msg =>
        assert.equal(msg, "Rejected", "Reject message is not the same")
      ));
    it("returns a new promise after catching an error", () =>
      Foretell.reject(new Error("bad"))
        .catch(error => {
          if (error.message === "bad") {
            return { msg: "handled" };
          } else {
            assert.fail("Didn't receive error");
          }
        })
        .then(result =>
          assert.equal(
            result.msg,
            "handled",
            "Didn't receive correct handled message"
          )
        ));
    it("automatically rejects if passed no function", () =>
      Foretell.reject(new Error("bad"))
        .catch()
        .then(
          () => assert.fail("Unexpected success"),
          error =>
            assert.equal(
              error.message,
              "bad",
              "Error wasn't automatically propogated"
            )
        ));
    it("automatically rejects if passed undefined", () =>
      Foretell.reject(new Error("bad"))
        .catch(undefined)
        .then(
          () => assert.fail("Unexpected success"),
          error =>
            assert.equal(
              error.message,
              "bad",
              "Error wasn't automatically propagated"
            )
        ));
    it("automatically rejects if passed null", () =>
      Foretell.reject(new Error("bad"))
        .catch(null)
        .then(
          () => assert.fail("Unexpected success"),
          error =>
            assert.equal(
              error.message,
              "bad",
              "Error wasn't automatically propagated"
            )
        ));
    it("automatically rejects if returning a rejected Promise", () =>
      Foretell.reject(new Error("bad"))
        .catch(error => Promise.reject(error))
        .then(
          () => assert.fail("Unexpected success"),
          error =>
            assert.equal(
              error.message,
              "bad",
              "Error wasn't automatically propagated"
            )
        ));
  });
  describe(".finally()", () => {
    it("always runs even when the Promise is resolved", () =>
      Foretell.resolve("good")
        .then(msg => msg + " stuff")
        .finally(() =>
          assert.ok("Finally ran successfully after resolved Promise")
        ));
    it("always runs even when the Promise is rejected", () =>
      Foretell.resolve("bad")
        .then(msg => {
          return Foretell.reject(msg);
        })
        .finally(() =>
          assert.ok("Finally ran successfully after rejected Promise")
        ));
  });
  describe(".all()", () => {
    it("resolves an array of promises in parallel", () => {
      const toResolve = [
        Foretell.resolve("things").then(value => ({ msg: value })),
        new Foretell(resolve => setTimeout(resolve, 0, { msg: "stuff" }))
      ];
      return Foretell.all(toResolve).then(results =>
        assert.deepStrictEqual(
          results,
          [{ msg: "things" }, { msg: "stuff" }],
          "Results did not match in the same order"
        )
      );
    });
    it("resolves non promise values in the array", () => {
      const toResolve = [
        new Foretell(resolve => setTimeout(resolve, 0, "promise value")),
        "non promise value"
      ];
      return Foretell.all(toResolve).then(results =>
        assert.deepStrictEqual(
          results,
          ["promise value", "non promise value"],
          "Results did not match in the same order"
        )
      );
    });
    it("resolves immediately when all values in array are not promises", () => {
      const toResolve = ["non promise value 1", "non promise value 2"];
      return Foretell.all(toResolve).then(results =>
        assert.deepStrictEqual(
          results,
          ["non promise value 1", "non promise value 2"],
          "Results did not match in the same order"
        )
      );
    });
    it("rejects immediately if one of the promises rejects", () => {
      const toResolve = [
        Foretell.reject(new Error("bad stuff")),
        new Foretell(resolve => setTimeout(resolve, 0, "promise value"))
      ];
      return Foretell.all(toResolve).then(
        () => assert.fail("Unexpected success"),
        error =>
          assert.equal(
            error.message,
            "bad stuff",
            "Error message from all() did not match"
          )
      );
    });
    it("immediately resolves when given an empty array", () =>
      Foretell.all([]).then(results =>
        assert.deepStrictEqual(results, [], "Result is not an empty array")
      ));
    it("immediately rejects when not given an array", () =>
      Foretell.all(9).then(
        () => assert.fail("Unexpected success"),
        error =>
          assert.equal(
            error.message,
            "Can't convert 9 to an array",
            "Error message didn't match expected"
          )
      ));
  });
  describe(".race()", () => {
    it("returns the first value to resolve/reject from an array of promises", () => {
      const toResolve = [
        new Foretell(resolve => setTimeout(resolve, 5, "one")),
        new Foretell(resolve => setTimeout(resolve, 0, "two")),
        new Foretell((_, reject) => setTimeout(reject, 10, "three"))
      ];
      return Foretell.race(toResolve).then(result =>
        assert.equal(result, "two", "Result from race() did not match expected")
      );
    });
    it("returns the first non-promise value immediately it encounters in the array", () => {
      const toResolve = [
        new Foretell(resolve => setTimeout(resolve, 5, "one")),
        "two",
        Foretell.reject("three")
      ];
      return Foretell.race(toResolve).then(result =>
        assert.equal(
          result,
          "two",
          "Resolved result from race() did not match expected"
        )
      );
    });
    it("rejects if the first promise to settle is rejected", () => {
      const toResolve = [
        new Foretell(resolve => setTimeout(resolve, 5, "one")),
        new Foretell(resolve => setTimeout(resolve, 10, "two")),
        Foretell.reject("three")
      ];
      return Foretell.race(toResolve).then(
        () => assert.fail("race() unexpectedly succeeded"),
        result =>
          assert.equal(
            result,
            "three",
            "Rejected result from race() did not match expected"
          )
      );
    });
    it("rejects if not given an array as input", () =>
      Foretell.race(9).then(
        () => assert.fail("Unexpected success"),
        error =>
          assert.equal(
            error.message,
            "Can't convert 9 to an array",
            "Error message didn't match expected"
          )
      ));
  });
});
