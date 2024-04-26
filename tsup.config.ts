import { defineConfig } from "tsup";

export default defineConfig((options) => [
  {
    entry: ["src/**/*.ts", "!src/**/*.spec.ts"],
    outDir: "dist",
    splitting: false,
    minify: !options.watch,
    format: "esm",
    treeshake: true,
    sourcemap: false,
    clean: true,
    dts: true,
    platform: "node",
    target: "node20", // Sync with `runs.using` in action.yml
  },
]);
