const adapter = require("./adapter");

describe("Promise/A+ 1.1 Test suite", () =>
  require("promises-aplus-tests").mocha(adapter));
