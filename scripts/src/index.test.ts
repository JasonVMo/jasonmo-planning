import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { addTopic, discoverTopics } from "./index.ts";

test("discoverTopics returns only sorted topic packages", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "planning-topics-"));
  await Promise.all(
    ["topic-zebra", "common", "topic-alpha"].map((name) => mkdir(path.join(directory, name))),
  );

  assert.deepEqual(await discoverTopics(directory), ["topic-alpha", "topic-zebra"]);
});

test("addTopic scaffolds and registers a topic package", async () => {
  const rootDirectory = await mkdtemp(path.join(tmpdir(), "planning-add-topic-"));
  await mkdir(path.join(rootDirectory, "packages"));
  await mkdir(path.join(rootDirectory, "site", "src"), { recursive: true });
  await writeFile(
    path.join(rootDirectory, "site", "package.json"),
    '{"dependencies":{"react":"19.2.8"}}',
  );

  await addTopic(rootDirectory, "summer-travel");

  const topicDirectory = path.join(rootDirectory, "packages", "topic-summer-travel");
  const packageJson = JSON.parse(await readFile(path.join(topicDirectory, "package.json"), "utf8"));
  const source = await readFile(path.join(topicDirectory, "src", "index.tsx"), "utf8");
  const registry = await readFile(
    path.join(rootDirectory, "site", "src", "generated-topics.ts"),
    "utf8",
  );
  const sitePackage = JSON.parse(
    await readFile(path.join(rootDirectory, "site", "package.json"), "utf8"),
  );

  assert.equal(packageJson.name, "@jasonmo/topic-summer-travel");
  assert.match(source, /title: "Summer Travel"/);
  assert.match(registry, /@jasonmo\/topic-summer-travel/);
  assert.equal(sitePackage.dependencies["@jasonmo/topic-summer-travel"], "workspace:*");
});

test("addTopic rejects invalid and existing topic names", async () => {
  const rootDirectory = await mkdtemp(path.join(tmpdir(), "planning-invalid-topic-"));
  await mkdir(path.join(rootDirectory, "packages"));

  await assert.rejects(() => addTopic(rootDirectory, "Not Valid"), /lowercase letters/);
  await mkdir(path.join(rootDirectory, "packages", "topic-existing"));
  await assert.rejects(() => addTopic(rootDirectory, "existing"), { code: "EEXIST" });
});
