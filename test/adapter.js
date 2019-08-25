/* eslint-disable @typescript-eslint/no-var-requires */
const Foretell = require("./generated/foretell");

Foretell.suppressUncaughtExceptions = true;

module.exports = {
  resolved: value => Foretell.resolve(value),
  rejected: reason => Foretell.reject(reason),
  deferred: () => {
    let resolve, reject;
    const promise = new Foretell((success, fail) => {
      resolve = success;
      reject = fail;
    });
    return {
      resolve,
      reject,
      promise
    };
  }
};
