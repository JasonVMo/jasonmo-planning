import { cp, mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import mdx from "@mdx-js/esbuild";
import { build, context } from "esbuild";

export async function discoverTopics(packagesDirectory: string): Promise<readonly string[]> {
  const entries = await readdir(packagesDirectory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("topic-"))
    .map((entry) => entry.name)
    .toSorted();
}

export async function generateTopicIndex(rootDirectory: string): Promise<void> {
  const topicPackages = await discoverTopics(path.join(rootDirectory, "packages"));
  const imports = topicPackages
    .map((name, index) => `import { topic as topic${index} } from "@jasonmo/${name}";`)
    .join("\n");
  const topics = topicPackages.map((_, index) => `topic${index}`).join(", ");
  const source = `${imports}\n\nexport const topics = [${topics}];\n`;
  await writeFile(path.join(rootDirectory, "site/src/generated-topics.ts"), source);
}

export async function bundleSite(rootDirectory: string, serve = false): Promise<void> {
  const siteDirectory = path.join(rootDirectory, "site");
  const outputDirectory = path.join(siteDirectory, "dist");
  await mkdir(outputDirectory, { recursive: true });
  await cp(path.join(siteDirectory, "public"), outputDirectory, { recursive: true });

  const options = {
    bundle: true,
    entryPoints: [path.join(siteDirectory, "src/main.tsx")],
    format: "esm" as const,
    jsx: "automatic" as const,
    loader: {
      ".png": "file" as const,
      ".svg": "file" as const,
    },
    outdir: outputDirectory,
    plugins: [mdx({ mdExtensions: [".md"] })],
    sourcemap: true,
  };

  if (serve) {
    const buildContext = await context(options);
    await buildContext.watch();
    await buildContext.serve({ servedir: outputDirectory });
    return;
  }

  await build(options);
}
