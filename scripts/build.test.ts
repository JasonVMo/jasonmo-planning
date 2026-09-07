import { cp, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, expect, it } from "vitest";
import { artifactFiles, buildSite, repositoryRoot } from "./site.mts";

const directories: string[] = [];
afterEach(async () => {
  for (const directory of directories.splice(0))
    await rm(directory, { recursive: true, force: true });
});

it("builds byte-identical artifacts and preserves the last valid output on failure", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "tracker-build-test-"));
  directories.push(root);
  for (const name of ["apps/site", "packages", "content", "research", "references"]) {
    await cp(path.join(repositoryRoot, name), path.join(root, name), { recursive: true });
  }
  await cp(path.join(repositoryRoot, "tsconfig.base.json"), path.join(root, "tsconfig.base.json"));
  await buildSite(root, "local", "/nested/");
  const original = await artifactFiles(path.join(root, "dist/local"));
  await buildSite(root, "local", "/nested/");
  expect(await artifactFiles(path.join(root, "dist/local"))).toEqual(original);
  await writeFile(path.join(root, "references/taxonomy.yaml"), "invalid: [");
  await expect(buildSite(root, "local", "/nested/")).rejects.toThrow();
  expect(await artifactFiles(path.join(root, "dist/local"))).toEqual(original);
}, 30_000);
