import typescript from "rollup-plugin-typescript2";
import { terser } from "rollup-plugin-terser";

export default {
  input: ["./src/promise.ts"],
  plugins: [
    typescript({
      cacheRoot: "./.cache",
      tsconfig: "./config/tsconfig.esm.json"
    }),
    terser({
      output: {
        ecma: 8
      },
      mangle: {
        properties: {
          regex: /^(_|\$\$)/
        }
      }
    })
  ],
  output: {
    file: "./dist/esm/foretell.min.js",
    format: "esm",
    name: "Foretell",
    sourcemap: true
  }
};
