const Benchmark = require("benchmark");
const Foretell = require("../dist/umd/foretell.min");
const Zousan = require("zousan");
const Bluebird = require("bluebird");
const { log, defer } = require("./util");

const suite1 = new Benchmark.Suite();

log("Create & Resolve Async\n");

suite1
  .add("Native Promise", {
    async: true,
    defer: true,
    fn: deferred => {
      const promise = new Promise(resolve => defer(resolve));
      promise.then(() => "value");
      promise.then(() => deferred.resolve());
    }
  })
  .add("Foretell", {
    async: true,
    defer: true,
    fn: deferred => {
      const promise = new Foretell(resolve => defer(resolve));
      promise.then(() => "value");
      promise.then(() => deferred.resolve());
    }
  })
  .add("Zousan", {
    async: true,
    defer: true,
    fn: deferred => {
      const promise = new Zousan(resolve => defer(resolve));
      promise.then(() => "value");
      promise.then(() => deferred.resolve());
    }
  })
  .add("Bluebird", {
    async: true,
    defer: true,
    fn: deferred => {
      const promise = new Bluebird(resolve => defer(resolve));
      promise.then(() => "value");
      promise.then(() => deferred.resolve());
    }
  })
  .on("cycle", ev => log(ev.target.toString()))
  .on("complete", () => log("Benchmark over!"))
  .run();
