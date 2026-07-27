import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import babel from "vite-plugin-babel";
import wasm from "vite-plugin-wasm";

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    wasm(),
    babel({
      filter: /\.[jt]sx?$/,
      exclude: /node_modules/, // 👈 关键：跳过 node_modules
      babelConfig: {
        presets: ["@babel/preset-typescript"],
        plugins: [["babel-plugin-react-compiler", { target: "19" }]],
      },
    }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  optimizeDeps: {
    // include: ["@blocknote/shadcn", "@blocknote/react", "@blocknote/core"],
  },
});
