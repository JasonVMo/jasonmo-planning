import assert from "node:assert/strict";
import { mkdtemp, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { discoverTopics } from "./index.ts";

test("discoverTopics returns only sorted topic packages", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "planning-topics-"));
  await Promise.all(
    ["topic-zebra", "common", "topic-alpha"].map((name) => mkdir(path.join(directory, name))),
  );

  assert.deepEqual(await discoverTopics(directory), ["topic-alpha", "topic-zebra"]);
});
