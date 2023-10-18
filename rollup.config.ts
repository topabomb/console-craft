import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import { cleandir } from "rollup-plugin-cleandir";
import json from "@rollup/plugin-json";
export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/index.esm.js",
      format: "es",
    },
    {
      file: "dist/index.umd.js",
      format: "umd",
      name: "index.umd.js",
    },
  ],
  plugins: [cleandir("./dist"), commonjs(), typescript(), json()],
};
