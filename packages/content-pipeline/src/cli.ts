import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { AUDIENCES, type Audience } from "@tracker/entity-model";
import { serializeCanonical } from "./canonical.ts";
import { confinedPath } from "./load.ts";
import { compileContent, normalizeBasePath } from "./project.ts";
import { dueReport, reports } from "./reports.ts";
import { reconcileContent } from "./reconcile.ts";
import { loadCorpus, validateContent } from "./validate.ts";

export function parseArgs(args: string[]) {
  const command = args[0];
  if (!command || !["validate", "compile", "due", "reports", "reconcile"].includes(command))
    throw new Error("Usage: cli <validate|compile|due|reports|reconcile> [strict options]");
  const permitted: Record<string, string[]> = {
    validate: ["--root"],
    compile: ["--root", "--target", "--base-path"],
    due: ["--root", "--as-of"],
    reports: ["--root", "--as-of"],
    reconcile: ["--root", "--proposal", "--dry-run", "--apply"],
  };
  const options = new Map<string, string>();
  for (let i = 1; i < args.length; i++) {
    const flag = args[i]!;
    if (!permitted[command]!.includes(flag) || options.has(flag))
      throw new Error(`Unknown or duplicate option: ${flag}`);
    if (flag === "--dry-run" || flag === "--apply") options.set(flag, "true");
    else {
      const value = args[++i];
      if (!value || value.startsWith("--")) throw new Error(`Missing value: ${flag}`);
      options.set(flag, value);
    }
  }
  if ((command === "due" || command === "reports") && !options.has("--as-of"))
    throw new Error("--as-of is required");
  if (command === "reconcile" && !options.has("--proposal"))
    throw new Error("--proposal is required");
  if (options.has("--dry-run") && options.has("--apply"))
    throw new Error("--dry-run and --apply are mutually exclusive");
  const target = options.get("--target") ?? "local";
  if (!AUDIENCES.includes(target as Audience)) throw new Error(`Unknown audience: ${target}`);
  return {
    command,
    options,
    target: target as Audience,
    basePath: normalizeBasePath(options.get("--base-path") ?? "/"),
  };
}

export async function main(args: string[]): Promise<void> {
  const { command, options, target, basePath } = parseArgs(args);
  const root = resolve(
    options.get("--root") ?? fileURLToPath(new URL("../../../", import.meta.url)),
  );
  switch (command) {
    case "validate":
      await validateContent(root);
      console.log("Content valid.");
      break;
    case "compile": {
      const manifest = await compileContent(root, { target, basePath });
      const directory = await confinedPath(root, `apps/site/.generated/${target}`, true);
      await mkdir(directory, { recursive: true });
      const staging = `${directory}/manifest.json.stage-${process.pid}`;
      try {
        await writeFile(staging, serializeCanonical(manifest), { flag: "wx" });
        await rename(staging, `${directory}/manifest.json`);
      } finally {
        await rm(staging, { force: true });
      }
      console.log(`Compiled ${target}: ${manifest.contentDigest} (network publication disabled)`);
      break;
    }
    case "due":
      console.log(serializeCanonical(dueReport(await loadCorpus(root), options.get("--as-of")!)));
      break;
    case "reports":
      console.log(serializeCanonical(await reports(root, options.get("--as-of")!)));
      break;
    case "reconcile":
      console.log(
        serializeCanonical(
          await reconcileContent(root, options.get("--proposal")!, {
            apply: options.has("--apply"),
          }),
        ),
      );
      break;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Content operation failed");
    process.exitCode = 1;
  });
}
