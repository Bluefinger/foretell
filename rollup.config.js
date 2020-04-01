import typescript from "rollup-plugin-typescript2";
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

const basePlugins = [
  typescript({
    cacheRoot: "./.cache",
    tsconfig: "./config/tsconfig.esm.json",
  }),
];

const umdPlugins = [
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
    plugins: basePlugins,
    output: [
      {
        file: "./dist/esm/foretell.min.js",
        format: "esm",
        name: "Foretell",
        sourcemap: true,
        plugins: [
          terser({
            ...mangleConfig,
            output: {
              ecma: 8,
            },
          }),
        ],
      },
      {
        file: "./dist/umd/foretell.min.js",
        format: "umd",
        name: "Foretell",
        sourcemap: true,
        plugins: umdPlugins,
      },
    ],
  },
  {
    input: ["./src/polyfill.js"],
    plugins: basePlugins,
    output: {
      file: "./dist/umd/foretell.polyfill.js",
      format: "umd",
      name: "Foretell",
      sourcemap: true,
      plugins: umdPlugins,
    },
  },
];
