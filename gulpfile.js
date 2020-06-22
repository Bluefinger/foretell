const { series } = require("gulp");
const del = require("del");
const { rollup } = require("rollup");
const ts = require("@wessberg/rollup-plugin-ts");
const { terser } = require("rollup-plugin-terser");
const { exec } = require("child_process");

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

const esmInput = [
  ts({
    tsconfig: "./config/tsconfig.esm.json",
  }),
];

const esmOutput = [
  terser({
    ...mangleConfig,
    output: {
      ecma: 8,
    },
  }),
];

const umdInput = [
  ts({
    tsconfig: "./config/tsconfig.umd.json",
  }),
];

const esmOptions = { input: ["./src/promise.ts"], plugins: esmInput };
const umdOptions = { input: ["./src/promise.ts"], plugins: umdInput };
const polyfillOptions = { input: ["./src/polyfill.js"], plugins: umdInput };

const umdOutput = [
  terser({
    ...mangleConfig,
    output: {
      ecma: 5,
    },
  }),
];

const esmOutputOptions = {
  file: "./dist/esm/foretell.min.js",
  format: "esm",
  sourcemap: true,
  plugins: esmOutput,
};

const umdOutputOptions = {
  file: "./dist/umd/foretell.min.js",
  format: "umd",
  name: "Foretell",
  sourcemap: true,
  plugins: umdOutput,
};

const polyOutputOptions = {
  ...umdOutputOptions,
  file: "./dist/umd/foretell.polyfill.js",
};

const linkChildOutput = (childProcess) => {
  childProcess.stdout.pipe(process.stdout);
  childProcess.stderr.pipe(process.stderr);
  return childProcess;
};

const createChildTask = (cmd) => linkChildOutput(exec(cmd));

const clean = () => del("./dist/*");

const build = async () => {
  const esm = rollup(esmOptions).then((esmBuild) =>
    esmBuild.write(esmOutputOptions)
  );
  const umd = rollup(umdOptions).then((umdBuild) =>
    umdBuild.write(umdOutputOptions)
  );
  const poly = rollup(polyfillOptions).then((polyBuild) =>
    polyBuild.write(polyOutputOptions)
  );
  await Promise.all([esm, umd, poly]);
};

const lint = () => createChildTask('eslint "./+(src|test)/**/*.{js,ts}"');
const specTests = () =>
  createChildTask("cross-env TS_NODE_PROJECT=test/tsconfig.json nyc mocha");

exports.clean = clean;
exports.build = series(clean, build);
exports.ci = series(lint, specTests);
