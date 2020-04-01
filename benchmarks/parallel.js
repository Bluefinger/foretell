const Benchmark = require("benchmark");
const Foretell = require("../dist/umd/foretell.min");
const Zousan = require("zousan");
const Bluebird = require("bluebird");
const { log } = require("./util");

const suite2 = new Benchmark.Suite();

log("Parallel mixed delay/immediate resolve\n");

const values = (() => {
  const data = [];
  const total = 128;
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

const asyncValues = (promise) => {
  const data = values.slice();
  for (let n = 0; n < data.length; n += 1) {
    const value = data[n];
    data[n] = value > 50 ? promise.resolve(value).then() : value;
  }
  return data;
};

suite2
  .add("Native Promise Parallel", {
    async: true,
    defer: true,
    fn: (deferred) => {
      Promise.all(asyncValues(Promise)).then((val) => deferred.resolve(val));
    },
  })
  .add("Foretell Parallel", {
    async: true,
    defer: true,
    fn: (deferred) => {
      Foretell.all(asyncValues(Foretell)).then((val) => deferred.resolve(val));
    },
  })
  .add("Zousan Parallel", {
    async: true,
    defer: true,
    fn: (deferred) => {
      Zousan.all(asyncValues(Zousan)).then((val) => deferred.resolve(val));
    },
  })
  .add("Bluebird Parallel", {
    async: true,
    defer: true,
    fn: (deferred) => {
      Bluebird.all(asyncValues(Bluebird)).then((val) => deferred.resolve(val));
    },
  })
  .on("cycle", (ev) => log(ev.target.toString()))
  .on("complete", () => log("Benchmark over!"))
  .run();
