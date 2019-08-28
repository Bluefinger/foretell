// const Benchmark = require("benchmark");
const Foretell = require("../dist/umd/foretell.min");

const { log } = require("./util");

// const suite1 = new Benchmark.Suite();

log("Accumulate Async\n");

const values = (() => {
  const data = [];
  const total = 256;
  data.length = total;
  const count = 256;
  for (let n = 0; n < data.length; n += 1) {
    const value = (Math.random() * 100) | 0;
    data[n] = value;
    //if (value > 50) count++;
  }
  log(`${count} values out of ${total} will become delayed in this run`);
  return data;
})();

const accumulateDataAsync = p => (promise, value) => {
  return promise.then(acc => {
    return p.resolve().then(() => acc + value);
  });
};

const work = [];
work.length = 1000;
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

// suite1
//   .add("Foretell", {
//     async: true,
//     defer: true,
//     fn: deferred => {
//       values
//         .reduce(accumulateDataAsync(Foretell), Foretell.resolve(0))
//         .then(val => deferred.resolve(val));
//     }
//   })
//   .on("cycle", ev => log(ev.target.toString()))
//   .on("complete", () => log("Benchmark over!"))
//   .run();
