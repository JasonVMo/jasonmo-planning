import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const run = (...args: string[]) =>
  execFileSync("corepack", ["yarn", ...args], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, NX_DAEMON: "false", STORYBOOK_DISABLE_TELEMETRY: "1" },
  }).trim();
assert.match(process.version, /^v24\./, "Node 24 is required");
assert.equal(run("--version"), "4.18.0");
assert.equal(run("config", "get", "nodeLinker"), "pnpm");
assert.match(run("tsc", "--version"), /Version 7\.0\.2/);
assert.match(run("tsc6", "--version"), /Version 6\.0\./);
for (const [binary, expected] of [
  ["esbuild", "0.28.2"],
  ["oxlint", "1.81.0"],
  ["oxfmt", "0.66.0"],
]) {
  assert(binary && expected);
  assert(run(binary, "--version").includes(expected), `${binary} version drift`);
}
const projects: unknown = JSON.parse(run("nx", "show", "projects", "--json"));
assert(Array.isArray(projects));
assert.deepEqual(
  [...projects].sort(),
  [
    "@planning/content-pipeline",
    "@planning/entity-model",
    "@planning/entity-ui",
    "@planning/site",
    "@planning/storybook",
  ].sort(),
);
const manager: { packageManager: string } = JSON.parse(
  await readFile(path.join(root, "package.json"), "utf8"),
);
assert.equal(manager.packageManager, "yarn@4.18.0");
console.log("Toolchain and five-project workspace ready.");
console.log(
  "Platform gates: Pages artifacts are built but deployment and unattended agents are not configured.",
);
