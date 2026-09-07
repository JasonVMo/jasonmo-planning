import { compileFromFile } from "json-schema-to-typescript";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
if (args.length > 1 || (args.length === 1 && args[0] !== "--check")) {
  throw new Error("Usage: generate-types.mts [--check]");
}
const root = fileURLToPath(new URL("../", import.meta.url));
const output = `${root}packages/entity-model/src/generated/types.ts`;
const source = await compileFromFile(`${root}packages/entity-model/schemas/contracts.schema.json`, {
  bannerComment:
    "/* Generated from JSON Schema draft-07 by json-schema-to-typescript 16.0.0.\n * Normalized with pinned Oxfmt. Run yarn schemas:generate; do not edit. */",
  unreachableDefinitions: true,
  additionalProperties: false,
  format: false,
  maxItems: -1,
});
const result = spawnSync("corepack", ["yarn", "oxfmt", "--stdin-filepath", "contracts.ts"], {
  cwd: root,
  input: source,
  encoding: "utf8",
  maxBuffer: 5_000_000,
});
if (result.status !== 0) throw new Error(`Oxfmt failed: ${result.stderr}`);
if (args[0] === "--check") {
  if ((await readFile(output, "utf8")) !== result.stdout)
    throw new Error("Generated schema types drifted; run yarn schemas:generate.");
} else {
  await writeFile(output, result.stdout);
}
