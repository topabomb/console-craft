import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
export default [
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/index.umd.cjs",
        format: "umd",
        name: "index.umd.cjs",
      },
    ],
    plugins: [
      nodeResolve({
        extensions: [".ts", ".mjs", ".js", ".json", ".node"],
        exportConditions: ["node"],
        preferBuiltins: false,
      }),
      commonjs(),
      typescript(),
      json(),
    ],
  },
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/index.esm.mjs",
        format: "es",
      },
    ],
    plugins: [commonjs(), typescript(), json()],
  },
];
