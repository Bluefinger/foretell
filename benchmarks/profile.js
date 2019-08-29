const Foretell = require("../dist/umd/foretell.min");

const { log } = require("./util");

log("Accumulate Async\n");

const values = (() => {
  const data = [];
  const total = 256;
  data.length = total;
  for (let n = 0; n < data.length; n += 1) {
    const value = (Math.random() * 100) | 0;
    data[n] = value;
  }
  log(`Profiling a serial run of async value processing`);
  return data;
})();

const accumulateDataAsync = p => (promise, value) =>
  promise.then(acc => p.resolve(acc + value));

const work = [];
work.length = 2000;
work.fill(0);

setTimeout(() => {
  work
    .reduce(
      (_, val) =>
        values.reduce(accumulateDataAsync(Foretell), Foretell.resolve(val)),
      {}
    )
    .then(() => log("Benchmark over!"));
}, 100);
