import typescript from "rollup-plugin-typescript2";
import { terser } from "rollup-plugin-terser";

export default {
  input: ["./src/promise.ts"],
  plugins: [
    typescript({
      cacheRoot: "./.cache",
      tsconfig: "./config/tsconfig.umd.json"
    }),
    terser({
      output: {
        ecma: 5
      },
      mangle: {
        properties: {
          regex: /^(_|\$\$)/
        }
      }
    })
  ],
  output: {
    file: "./dist/umd/foretell.min.js",
    format: "umd",
    name: "Foretell",
    sourcemap: true
  }
};
