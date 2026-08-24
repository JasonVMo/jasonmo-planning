#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { bundleSite, generateTopicIndex } from "./index.ts";

const rootDirectory = path.resolve(import.meta.dirname, "../..");
const command = process.argv[2];

switch (command) {
  case "bundle":
    await bundleSite(rootDirectory);
    break;
  case "dev":
    await bundleSite(rootDirectory, true);
    await new Promise(() => {});
    break;
  case "generate-topic-index":
    await generateTopicIndex(rootDirectory);
    break;
  default:
    console.error("Usage: scripts <bundle|dev|generate-topic-index>");
    process.exitCode = 1;
}
