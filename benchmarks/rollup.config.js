import commonjs from "rollup-plugin-commonjs";
import nodeResolve from "rollup-plugin-node-resolve";
import staticSite from "rollup-plugin-static-site";
import serve from "rollup-plugin-serve";

export default {
  input: ["./serial.js"],
  plugins: [
    nodeResolve({
      // pass custom options to the resolve plugin
      mainFields: ["browser", "module", "main"]
    }),
    commonjs(),
    staticSite({
      dir: "dist",
      moreScripts: [
        "https://cdn.jsdelivr.net/npm/lodash@4.17.15/lodash.min.js",
        "https://cdn.jsdelivr.net/npm/benchmark@2.1.4/benchmark.min.js"
      ]
    }),
    serve("dist")
  ],
  output: {
    file: "./dist/test.js",
    format: "iife",
    name: "Bench",
    sourcemap: true,
    globals: {
      benchmark: "Benchmark"
    }
  },
  external: ["lodash", "benchmark"]
};
