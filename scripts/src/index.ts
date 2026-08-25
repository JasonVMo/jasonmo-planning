import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import mdx from "@mdx-js/esbuild";
import { build, context } from "esbuild";
import remarkGfm from "remark-gfm";

const topicNamePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function topicTitle(name: string): string {
  return name
    .split("-")
    .map((word) => `${word[0]?.toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

export async function addTopic(rootDirectory: string, name: string): Promise<void> {
  if (!topicNamePattern.test(name)) {
    throw new Error(
      "Topic names must contain only lowercase letters, numbers, and single hyphens.",
    );
  }

  const packageName = `topic-${name}`;
  const topicDirectory = path.join(rootDirectory, "packages", packageName);
  const sourceDirectory = path.join(topicDirectory, "src");
  const title = topicTitle(name);

  await mkdir(topicDirectory);
  await mkdir(sourceDirectory);

  const packageJson = {
    name: `@jasonmo/${packageName}`,
    version: "0.0.0",
    private: true,
    type: "module",
    exports: "./src/index.tsx",
    scripts: {
      build: "tsc",
      lint: "oxlint src",
      test: "node --test",
    },
    dependencies: {
      "@jasonmo/common": "workspace:*",
      react: "19.2.8",
    },
    devDependencies: {
      "@types/react": "19.2.18",
      typescript: "7.0.2",
    },
  };
  const indexSource = `import type { TopicDefinition } from "@jasonmo/common";
import Overview from "./overview.md";

export const topic: TopicDefinition = {
  id: "${name}",
  title: "${title}",
  header: {
    title: "${title}",
    description: "${title} planning and research",
  },
  rootPage: {
    id: "overview",
    title: "Overview",
    component: Overview,
  },
};
`;
  const contentTypes = `declare module "*.md" {
  import type { ComponentType } from "react";
  const Content: ComponentType;
  export default Content;
}
`;

  await Promise.all([
    writeFile(
      path.join(topicDirectory, "package.json"),
      `${JSON.stringify(packageJson, null, 2)}\n`,
      {
        flag: "wx",
      },
    ),
    writeFile(
      path.join(topicDirectory, "tsconfig.json"),
      '{\n  "extends": "../../tsconfig.base.json",\n  "include": ["src"]\n}\n',
      { flag: "wx" },
    ),
    writeFile(path.join(sourceDirectory, "content.d.ts"), contentTypes, { flag: "wx" }),
    writeFile(path.join(sourceDirectory, "index.tsx"), indexSource, { flag: "wx" }),
    writeFile(path.join(sourceDirectory, "overview.md"), `# ${title}\n\nAdd your content here.\n`, {
      flag: "wx",
    }),
  ]);

  const sitePackagePath = path.join(rootDirectory, "site", "package.json");
  const sitePackage = JSON.parse(await readFile(sitePackagePath, "utf8")) as {
    dependencies: Record<string, string>;
  };
  sitePackage.dependencies[`@jasonmo/${packageName}`] = "workspace:*";
  sitePackage.dependencies = Object.fromEntries(
    Object.entries(sitePackage.dependencies).toSorted(),
  );
  await writeFile(sitePackagePath, `${JSON.stringify(sitePackage, null, 2)}\n`);

  await generateTopicIndex(rootDirectory);
  console.log(`Created ${packageName} and added it to the site.`);
}

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
  const production = !serve;
  console.log(`Bundling site in ${production ? "production" : "development"} mode...`);
  // GitHub Pages is configured to publish this repository's /docs directory.
  // Keep assets relative in site/public/index.html so the result also works when
  // Pages serves it below the repository name rather than at the domain root.
  const outputDirectory = path.join(rootDirectory, "docs");
  await rm(outputDirectory, { recursive: true, force: true });
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
    plugins: [mdx({ mdExtensions: [".md"], remarkPlugins: [remarkGfm] })],
    sourcemap: true,
    minify: production,
  };

  if (serve) {
    const buildContext = await context(options);
    await buildContext.watch();
    await buildContext.serve({ servedir: outputDirectory });
    return;
  }

  await build(options);
}
