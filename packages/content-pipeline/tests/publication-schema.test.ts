import { describe, expect, it } from "vitest";
import { assertSchema } from "../src/schema.ts";

const policy = {
  schemaVersion: 1,
  policyVersion: 1,
  reviewers: [],
  destinations: [],
  publicSourceHosts: [],
};

describe("explicit network publication policy flag", () => {
  it.each([false, true])("accepts the explicit boolean %s", (networkPublicationEnabled) => {
    expect(() =>
      assertSchema("PublicationPolicy", { ...policy, networkPublicationEnabled }, "policy"),
    ).not.toThrow();
  });

  it.each(["true", "false", 0, 1, null])("rejects non-boolean %s", (networkPublicationEnabled) => {
    expect(() =>
      assertSchema("PublicationPolicy", { ...policy, networkPublicationEnabled }, "policy"),
    ).toThrow("networkPublicationEnabled");
  });

  it("requires an explicit policy decision rather than supplying a default", () => {
    expect(() => assertSchema("PublicationPolicy", policy, "policy")).toThrow(
      "networkPublicationEnabled",
    );
  });
});
