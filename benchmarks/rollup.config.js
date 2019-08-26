import commonjs from "rollup-plugin-commonjs";
import nodeResolve from "rollup-plugin-node-resolve";
import serve from "rollup-plugin-serve";

export default {
  input: ["./serial.js"],
  plugins: [
    nodeResolve({
      // pass custom options to the resolve plugin
      mainFields: ["browser", "module", "main"]
    }),
    commonjs(),
    serve("public")
  ],
  output: {
    file: "./public/dist/test.js",
    format: "iife",
    name: "Bench",
    sourcemap: true,
    globals: {
      benchmark: "Benchmark"
    }
  },
  external: ["lodash", "benchmark"]
};
