import { createHash, randomUUID } from "node:crypto";
import { createServer } from "node:http";
import type { ServerResponse } from "node:http";
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { build } from "esbuild";
import { watch } from "chokidar";
import type { Audience, SiteManifest } from "../packages/entity-model/src/index.ts";
import { compileContent, serializeCanonical } from "../packages/content-pipeline/src/index.ts";
import { auditSiteArtifact } from "./audit-artifact.mts";

export const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const audiences = ["local", "private-owner", "private-group", "public"] as const;

export function normalizeBasePath(value: string): string {
  const normalized = value === "/" ? value : `/${value.replace(/^\/|\/$/g, "")}/`;
  if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(normalized)) {
    throw new Error(`Invalid base path: ${value}`);
  }
  return normalized;
}

function targetFrom(value: string): Audience {
  const target = audiences.find((candidate) => candidate === value);
  if (!target) throw new Error(`Unknown audience: ${value}`);
  return target;
}

export async function artifactFiles(directory: string): Promise<Map<string, Buffer>> {
  const files = new Map<string, Buffer>();
  async function visit(current: string): Promise<void> {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const file = path.join(current, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Artifact symlink is forbidden: ${file}`);
      if (entry.isDirectory()) await visit(file);
      else if (entry.isFile()) {
        const name = path.relative(directory, file).split(path.sep).join("/");
        files.set(name, await readFile(file));
      } else throw new Error(`Artifact contains a non-regular file: ${file}`);
    }
  }
  await visit(directory);
  return files;
}

function outputDirectory(root: string, target: Audience, configured?: string): string {
  const destination = path.resolve(root, configured ?? path.join("dist", target));
  const distRoot = path.join(root, "dist");
  const relativeToDist = path.relative(distRoot, destination);
  const isDistArtifact =
    relativeToDist !== "" &&
    relativeToDist !== ".staging" &&
    !relativeToDist.startsWith(`.staging${path.sep}`) &&
    !relativeToDist.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativeToDist);
  if (destination !== path.join(root, "docs") && !isDistArtifact) {
    throw new Error("Output directory must be docs or a child of dist");
  }
  return destination;
}

export async function buildSite(
  root: string,
  target: Audience,
  basePath: string,
  configuredOutputDirectory?: string,
): Promise<SiteManifest> {
  basePath = normalizeBasePath(basePath);
  const manifest = await compileContent(root, { target, basePath });
  const stageRoot = path.join(root, "dist", ".staging");
  await mkdir(stageRoot, { recursive: true });
  const stage = path.join(stageRoot, `site-${randomUUID()}`);
  await mkdir(stage);
  const destination = outputDirectory(root, target, configuredOutputDirectory);
  const backup = path.join(stageRoot, `previous-${randomUUID()}`);
  let backupExists = false;
  try {
    const result = await build({
      absWorkingDir: root,
      entryPoints: ["apps/site/src/main.tsx"],
      outdir: stage,
      bundle: true,
      format: "esm",
      platform: "browser",
      target: ["es2022"],
      jsx: "automatic",
      loader: { ".md": "text", ".woff2": "file" },
      minify: true,
      sourcemap: false,
      metafile: true,
      entryNames: "assets/[name]-[hash]",
      chunkNames: "assets/[name]-[hash]",
      assetNames: "assets/[name]-[hash]",
      splitting: true,
      define: { "process.env.NODE_ENV": '"production"' },
      logLevel: "warning",
    });
    for (const input of Object.keys(result.metafile.inputs)) {
      if (/^(content|research|proposals|references|packages\/content-pipeline)\//.test(input)) {
        throw new Error(`Canonical/private file entered browser bundle: ${input}`);
      }
    }
    const entry = Object.entries(result.metafile.outputs).find(
      ([, output]) => output.entryPoint === "apps/site/src/main.tsx",
    );
    if (!entry) throw new Error("esbuild did not emit the site entry point");
    const toUrl = (output: string): string =>
      `${basePath}${path.relative(stage, path.resolve(root, output)).split(path.sep).join("/")}`;
    let html = await readFile(path.join(root, "apps/site/index.template.html"), "utf8");
    html = html
      .replaceAll("{{BASE_PATH}}", basePath)
      .replaceAll("{{SCRIPT}}", toUrl(entry[0]))
      .replaceAll("{{STYLE}}", entry[1].cssBundle ? toUrl(entry[1].cssBundle) : "");
    if (/\{\{[A-Z_]+\}\}/.test(html)) throw new Error("Unresolved HTML template placeholder");
    await writeFile(path.join(stage, "index.html"), html);
    await writeFile(path.join(stage, "manifest.json"), serializeCanonical(manifest));
    await writeFile(path.join(stage, ".nojekyll"), "");
    await auditSiteArtifact(stage, manifest);
    const inventory = Object.fromEntries(
      [...(await artifactFiles(stage)).entries()].map(([name, bytes]) => [
        name,
        createHash("sha256").update(bytes).digest("hex"),
      ]),
    );
    await writeFile(
      path.join(stage, "artifact.json"),
      serializeCanonical({
        audience: target,
        contentDigest: manifest.contentDigest,
        files: inventory,
      }),
    );
    try {
      await stat(destination);
      backupExists = true;
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    }
    if (backupExists) await rename(destination, backup);
    try {
      await rename(stage, destination);
    } catch (error) {
      if (backupExists) await rename(backup, destination);
      throw error;
    }
    if (backupExists) await rm(backup, { recursive: true });
    return manifest;
  } finally {
    await rm(stage, { recursive: true, force: true });
  }
}

const contentTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".woff2": "font/woff2",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

async function serve(target: Audience, basePath: string, port: number, development: boolean) {
  if (target !== "local")
    throw new Error("The local server only serves the non-deployable local target");
  let files = await artifactFiles(path.join(repositoryRoot, "dist", target));
  const descriptor = files.get("manifest.json");
  if (!descriptor) throw new Error("No built manifest; run yarn build:site first");
  const metadata: unknown = JSON.parse(descriptor.toString());
  if (
    !metadata ||
    typeof metadata !== "object" ||
    !("audience" in metadata) ||
    metadata.audience !== "local" ||
    !("deployable" in metadata) ||
    metadata.deployable !== false ||
    !("basePath" in metadata) ||
    metadata.basePath !== basePath
  ) {
    throw new Error(
      "Built manifest is not a local artifact for the requested base path; rebuild with matching flags",
    );
  }
  let buildFailed = false;
  const clients = new Set<ServerResponse>();
  const server = createServer((request, response) => {
    const host = request.headers.host;
    if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) {
      response.writeHead(403).end("Host denied");
      return;
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" }).end();
      return;
    }
    const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("X-Tracker-Build-Status", buildFailed ? "failed" : "valid");
    response.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
    );
    if (basePath !== "/" && url.pathname === basePath.slice(0, -1)) {
      response.writeHead(308, { Location: basePath }).end();
      return;
    }
    if (!url.pathname.startsWith(basePath)) {
      response.writeHead(404).end("Not found");
      return;
    }
    const name = url.pathname.slice(basePath.length) || "index.html";
    if (development && name === "__events") {
      response.writeHead(200, { "Content-Type": "text/event-stream" });
      if (request.method === "HEAD") {
        response.end();
        return;
      }
      response.write(": connected\n\n");
      if (buildFailed) response.write("event: build-error\ndata: failed\n\n");
      clients.add(response);
      request.on("close", () => clients.delete(response));
      return;
    }
    if (development && name === "__dev.js") {
      response.setHeader("Content-Type", "text/javascript; charset=utf-8");
      response.end(`const events = new EventSource(${JSON.stringify(`${basePath}__events`)});
events.addEventListener("reload", () => location.reload());
events.addEventListener("build-error", () => {
  if (!document.getElementById("build-error")) {
    const banner = document.createElement("div");
    banner.id = "build-error";
    banner.setAttribute("role", "alert");
    banner.textContent = "Build failed. Showing the last valid preview. See the terminal.";
    document.body.prepend(banner);
  }
});`);
      return;
    }
    const bytes = files.get(name);
    if (!bytes) {
      response.writeHead(404).end("Not found");
      return;
    }
    response.setHeader(
      "Content-Type",
      contentTypes[path.extname(name)] ?? "application/octet-stream",
    );
    if (request.method === "HEAD") response.end();
    else if (development && name === "index.html") {
      response.end(
        bytes.toString().replace("</body>", `<script src="${basePath}__dev.js"></script></body>`),
      );
    } else response.end(bytes);
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  console.log(
    `Tracker ${development ? "development" : "preview"}: http://127.0.0.1:${port}${basePath}`,
  );
  let pending = Promise.resolve();
  const watcher = development
    ? watch(
        [
          "apps/site/src",
          "apps/site/index.template.html",
          "packages",
          "content",
          "research/topics",
          "references",
        ].map((name) => path.join(repositoryRoot, name)),
        {
          ignoreInitial: true,
          ignored: /(^|[/\\])(node_modules|\.generated|\.local|dist)([/\\]|$)/,
          awaitWriteFinish: { stabilityThreshold: 200 },
        },
      )
    : undefined;
  watcher?.on("all", () => {
    pending = pending.then(async () => {
      try {
        await buildSite(repositoryRoot, target, basePath);
        files = await artifactFiles(path.join(repositoryRoot, "dist", target));
        buildFailed = false;
        for (const client of clients) client.write("event: reload\ndata: ready\n\n");
        console.log("Tracker rebuilt");
      } catch (error) {
        buildFailed = true;
        console.error("Build failed; preserving the last valid preview:", error);
        for (const client of clients) client.write("event: build-error\ndata: failed\n\n");
      }
    });
  });
  const shutdown = async () => {
    await watcher?.close();
    for (const client of clients) client.end();
    server.close();
    await pending;
  };
  process.once("SIGINT", () => void shutdown());
  process.once("SIGTERM", () => void shutdown());
}

async function main() {
  const { values, positionals } = parseArgs({
    options: {
      target: { type: "string", default: "local" },
      "base-path": { type: "string", default: "/" },
      "output-dir": { type: "string" },
      port: { type: "string", default: "4173" },
    },
    allowPositionals: true,
  });
  const command = positionals[0];
  if (positionals.length !== 1 || !["build", "dev", "preview"].includes(command ?? "")) {
    throw new Error(
      "Usage: site.mts build|dev|preview [--target local] [--base-path /repository/] [--output-dir docs] [--port 4173]",
    );
  }
  const target = targetFrom(values.target);
  if (command !== "build" && target !== "local")
    throw new Error("The local server only serves the non-deployable local target");
  if (command !== "build" && values["output-dir"])
    throw new Error("--output-dir is available only for production builds");
  const basePath = normalizeBasePath(values["base-path"]);
  const port = Number(values.port);
  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error("Port must be between 1024 and 65535");
  if (command !== "preview") {
    const manifest = await buildSite(repositoryRoot, target, basePath, values["output-dir"]);
    console.log(
      `Built ${manifest.entities.length} entities for ${target}: ${manifest.contentDigest}`,
    );
  }
  if (command !== "build") await serve(target, basePath, port, command === "dev");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
