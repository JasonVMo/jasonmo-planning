import assert from "node:assert/strict";
import test from "node:test";
import { topicPath } from "./index.ts";

test("topicPath creates a stable navigation key", () => {
  assert.equal(topicPath("welcome", "research"), "welcome/research");
});
