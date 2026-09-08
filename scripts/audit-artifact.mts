import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import type { Audience, SiteManifest } from "../packages/entity-model/src/index.ts";
import { compileContent, serializeCanonical } from "../packages/content-pipeline/src/index.ts";

export async function auditSiteArtifact(directory: string, manifest: SiteManifest): Promise<void> {
  if (manifest.audience === "local" && manifest.deployable)
    throw new Error("Local artifacts cannot be deployable");
  const descriptor = await readFile(path.join(directory, "manifest.json"), "utf8");
  if (descriptor !== serializeCanonical(manifest))
    throw new Error("Artifact manifest differs from validated projection");
  async function inspect(current: string): Promise<void> {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const file = path.join(current, entry.name);
      const name = path.relative(directory, file);
      if (entry.isSymbolicLink()) throw new Error(`Artifact contains a symlink: ${name}`);
      if (
        /(^|[/\\])(?:research|content|proposals|references|node_modules|\.git|\.env)(?:[/\\.]|$)|\.map$|\.ya?ml$/i.test(
          name,
        )
      ) {
        throw new Error(`Forbidden artifact path: ${name}`);
      }
      if (entry.isDirectory()) await inspect(file);
      else if (entry.isFile()) {
        const text = await readFile(file, "utf8");
        if (
          /\/Users\/[A-Za-z0-9_-]+\/|\/home\/[A-Za-z0-9_-]+\/|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{30,}/.test(
            text,
          )
        ) {
          throw new Error(`Artifact contains a machine path or credential pattern: ${name}`);
        }
        if (
          manifest.audience === "public" &&
          /TRACKER_PRIVATE_CANARY|https?:\/\/(?:[^/\s"]+\.)?(?:sharepoint\.com|visualstudio\.com|dev\.azure\.com)(?:[/:]|$)/i.test(
            text,
          )
        ) {
          throw new Error(`Public artifact contains a private marker or internal URL: ${name}`);
        }
      } else throw new Error(`Artifact contains a non-regular file: ${name}`);
    }
  }
  await inspect(directory);
}

export async function auditArtifactInventory(
  directory: string,
  manifest: SiteManifest,
): Promise<void> {
  await auditSiteArtifact(directory, manifest);
  const inventory: unknown = JSON.parse(
    await readFile(path.join(directory, "artifact.json"), "utf8"),
  );
  if (
    !inventory ||
    typeof inventory !== "object" ||
    !("audience" in inventory) ||
    inventory.audience !== manifest.audience ||
    !("contentDigest" in inventory) ||
    inventory.contentDigest !== manifest.contentDigest ||
    !("files" in inventory) ||
    !inventory.files ||
    typeof inventory.files !== "object" ||
    Array.isArray(inventory.files)
  ) {
    throw new Error("Invalid artifact inventory");
  }
  for (const [name, digest] of Object.entries(inventory.files)) {
    if (
      name.includes("..") ||
      path.isAbsolute(name) ||
      name.includes("\\") ||
      name === "artifact.json"
    )
      throw new Error("Unsafe artifact inventory path");
    if (typeof digest !== "string" || !/^[a-f0-9]{64}$/.test(digest))
      throw new Error(`Invalid artifact hash: ${name}`);
    const actual = createHash("sha256")
      .update(await readFile(path.join(directory, name)))
      .digest("hex");
    if (actual !== digest) throw new Error(`Artifact changed after build: ${name}`);
  }
  const actualFiles: string[] = [];
  async function collect(current: string): Promise<void> {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const file = path.join(current, entry.name);
      if (entry.isDirectory()) await collect(file);
      else actualFiles.push(path.relative(directory, file).split(path.sep).join("/"));
    }
  }
  await collect(directory);
  const expectedFiles = [...Object.keys(inventory.files), "artifact.json"].sort();
  if (serializeCanonical(actualFiles.sort()) !== serializeCanonical(expectedFiles)) {
    throw new Error("Artifact contains files not covered by its validated inventory");
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      target: { type: "string", default: "local" },
      "base-path": { type: "string", default: "/" },
      directory: { type: "string" },
    },
  });
  const target = (["local", "private-owner", "private-group", "public"] as const).find(
    (audience) => audience === values.target,
  );
  if (!target) throw new Error(`Unknown audience: ${values.target}`);
  const root = fileURLToPath(new URL("../", import.meta.url));
  const manifest = await compileContent(root, {
    target: target satisfies Audience,
    basePath: values["base-path"],
  });
  const directory = path.resolve(root, values.directory ?? path.join("dist", target));
  const relative = path.relative(root, directory);
  if (
    !relative ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative) ||
    (relative !== "docs" && !relative.startsWith(`dist${path.sep}`))
  ) {
    throw new Error("Artifact directory must be docs or a child of dist");
  }
  await auditArtifactInventory(directory, manifest);
  console.log(`Artifact matches current ${target} projection and inventory`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
