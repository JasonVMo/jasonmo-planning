import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { SiteManifest } from "../packages/entity-model/src/index.ts";
import { serializeCanonical } from "../packages/content-pipeline/src/index.ts";
import { artifactFiles, normalizeBasePath } from "./site.mts";
import { auditArtifactInventory, auditSiteArtifact } from "./audit-artifact.mts";

const directories: string[] = [];
afterEach(async () => {
  for (const directory of directories.splice(0))
    await rm(directory, { recursive: true, force: true });
});

const manifest: SiteManifest = {
  schemaVersion: 1,
  audience: "local",
  basePath: "/",
  contentDigest: "a".repeat(64),
  deployable: false,
  taxonomy: [],
  entities: [],
  searchDocuments: [],
};

async function fixture(value = manifest): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), "tracker-artifact-test-"));
  directories.push(directory);
  await writeFile(path.join(directory, "manifest.json"), serializeCanonical(value));
  await writeFile(path.join(directory, "index.html"), "<!doctype html><title>Tracker</title>");
  return directory;
}

describe("static site boundary", () => {
  it("normalizes root and nested base paths without accepting traversal or injection", () => {
    expect(normalizeBasePath("/")).toBe("/");
    expect(normalizeBasePath("tracker")).toBe("/tracker/");
    expect(normalizeBasePath("/team/tracker/")).toBe("/team/tracker/");
    for (const value of [
      "/../",
      "/foo//bar/",
      "/foo%2fbar/",
      '"/><script>',
      "https://example.com",
    ]) {
      expect(() => normalizeBasePath(value)).toThrow("Invalid base path");
    }
  });

  it("accepts only the exact validated manifest", async () => {
    const directory = await fixture();
    await expect(auditSiteArtifact(directory, manifest)).resolves.toBeUndefined();
    await writeFile(path.join(directory, "manifest.json"), "{}");
    await expect(auditSiteArtifact(directory, manifest)).rejects.toThrow("differs");
  });

  it("rejects canonical files and source maps in static output", async () => {
    const directory = await fixture();
    await mkdir(path.join(directory, "research"));
    await writeFile(path.join(directory, "research/state.json"), "{}");
    await expect(auditSiteArtifact(directory, manifest)).rejects.toThrow("Forbidden artifact path");
    await rm(path.join(directory, "research"), { recursive: true });
    await writeFile(path.join(directory, "app.js.map"), "{}");
    await expect(auditSiteArtifact(directory, manifest)).rejects.toThrow("Forbidden artifact path");
  });

  it("refuses deployable local artifacts", async () => {
    const invalid = { ...manifest, deployable: true };
    await expect(auditSiteArtifact(await fixture(invalid), invalid)).rejects.toThrow(
      "cannot be deployable",
    );
  });

  it("checks private canaries in all public files, not only the manifest", async () => {
    const publicManifest: SiteManifest = { ...manifest, audience: "public", deployable: true };
    const directory = await fixture(publicManifest);
    await writeFile(path.join(directory, "app.js"), 'console.log("TRACKER_PRIVATE_CANARY")');
    await expect(auditSiteArtifact(directory, publicManifest)).rejects.toThrow("private marker");
  });

  it("detects unlisted output files and modified inventory entries", async () => {
    const directory = await fixture();
    const files = Object.fromEntries(
      [...(await artifactFiles(directory))].map(([name, bytes]) => [
        name,
        createHash("sha256").update(bytes).digest("hex"),
      ]),
    );
    await writeFile(
      path.join(directory, "artifact.json"),
      serializeCanonical({
        audience: manifest.audience,
        contentDigest: manifest.contentDigest,
        files,
      }),
    );
    await expect(auditArtifactInventory(directory, manifest)).resolves.toBeUndefined();
    await writeFile(path.join(directory, "extra.js"), "unexpected");
    await expect(auditArtifactInventory(directory, manifest)).rejects.toThrow("not covered");
    await rm(path.join(directory, "extra.js"));
    await writeFile(path.join(directory, "index.html"), "modified");
    await expect(auditArtifactInventory(directory, manifest)).rejects.toThrow(
      "changed after build",
    );
  });
});
