const Benchmark = require("benchmark");
const Foretell = require("../dist/umd/foretell.min");
const Zousan = require("zousan");
const Bluebird = require("bluebird");
const { log } = require("./util");

const suite1 = new Benchmark.Suite();

log("Accumulate Async\n");

const values = (() => {
  const data = [];
  const total = 256;
  data.length = total;
  let count = 0;
  for (let n = 0; n < data.length; n += 1) {
    const value = (Math.random() * 100) | 0;
    data[n] = value;
    if (value > 50) count++;
  }
  log(`${count} values out of ${total} will become delayed in this run`);
  return data;
})();

const accumulateDataAsync = p => (promise, value) => {
  if (value > 50) {
    promise.then(() => 50 - value);
    promise.then(acc => "hot " + acc);
  }
  return promise.then(acc => {
    return p.resolve(acc + value);
  });
};

suite1
  .add("Native Promise", {
    async: true,
    defer: true,
    fn: deferred => {
      values
        .reduce(accumulateDataAsync(Promise), Promise.resolve(0))
        .then(val => deferred.resolve(val));
    }
  })
  .add("Foretell", {
    async: true,
    defer: true,
    fn: deferred => {
      values
        .reduce(accumulateDataAsync(Foretell), Foretell.resolve(0))
        .then(val => deferred.resolve(val));
    }
  })
  .add("Zousan", {
    async: true,
    defer: true,
    fn: deferred => {
      values
        .reduce(accumulateDataAsync(Zousan), Zousan.resolve(0))
        .then(val => deferred.resolve(val));
    }
  })
  .add("Bluebird", {
    async: true,
    defer: true,
    fn: deferred => {
      values
        .reduce(accumulateDataAsync(Bluebird), Bluebird.resolve(0))
        .then(val => deferred.resolve(val));
    }
  })
  .on("cycle", ev => log(ev.target.toString()))
  .on("complete", () => log("Benchmark over!"))
  .run();
