import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
await build({
  absWorkingDir: root,
  entryPoints: ["packages/content-pipeline/src/cli.ts"],
  outdir: "dist/tools",
  platform: "node",
  format: "esm",
  target: "node24",
  bundle: true,
  banner: {
    js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);',
  },
  sourcemap: false,
  logLevel: "warning",
});
console.log("Bundled dist/tools/cli.js; run with --root <repository>");
