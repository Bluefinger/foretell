import ts from "@wessberg/rollup-plugin-ts";
import { terser } from "rollup-plugin-terser";

const mangleConfig = {
  mangle: {
    properties: {
      regex: /^(_|\$\$)/,
    },
  },
  compress: {
    passes: 3,
  },
};

const esmPlugins = [
  ts({
    tsconfig: "./config/tsconfig.esm.json",
  }),
  terser({
    ...mangleConfig,
    output: {
      ecma: 8,
    },
  }),
];

const umdPlugins = [
  ts({
    tsconfig: "./config/tsconfig.umd.json",
  }),
  terser({
    ...mangleConfig,
    output: {
      ecma: 5,
    },
  }),
];

export default [
  {
    input: ["./src/promise.ts"],
    plugins: esmPlugins,
    output: {
      file: "./dist/esm/foretell.min.js",
      format: "esm",
      sourcemap: true,
    },
  },
  {
    input: ["./src/promise.ts"],
    plugins: umdPlugins,
    output: {
      file: "./dist/umd/foretell.min.js",
      format: "umd",
      name: "Foretell",
      sourcemap: true,
    },
  },
  {
    input: ["./src/polyfill.js"],
    plugins: umdPlugins,
    output: {
      file: "./dist/umd/foretell.polyfill.js",
      format: "umd",
      name: "Foretell",
      sourcemap: true,
    },
  },
];
