import istanbul from "rollup-plugin-istanbul";
import typescript from "rollup-plugin-typescript2";

export default {
  input: ["./src/promise.ts"],
  plugins: [
    typescript({
      cacheRoot: "./.cache",
      tsconfig: "./tsconfig.json",
      tsconfigOverride: {
        removeComments: false,
      },
    }),
    istanbul(),
  ],
  output: {
    file: "./test/generated/foretell.js",
    format: "umd",
    name: "Foretell",
    sourcemap: true,
  },
};
