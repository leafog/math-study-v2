import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import babel from "vite-plugin-babel";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    wasm(),
    babel({
      filter: /\.[jt]sx?$/,
      babelConfig: {
        presets: ["@babel/preset-typescript"],
        plugins: [["babel-plugin-react-compiler", { target: "19" }]],
      },
    }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
});
