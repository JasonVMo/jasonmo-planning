import { describe, expect, it } from "vitest";
import type { Entity } from "@tracker/entity-model";
import {
  adaptView,
  ADAPTERS,
  type AdapterRegistry,
  type Presentation,
} from "../src/view-adapters.ts";
import { resolveView } from "../src/view-selection.ts";
import { projectMarkdown } from "../src/markdown.ts";

const input: Presentation = {
  title: "Synthetic data",
  summary: "Common views",
  href: "#/entities/synthetic",
  body: "# Safe text\n",
  badges: ["fixture"],
};
const entity: Pick<Entity, "id" | "dataType" | "view"> = {
  id: "synthetic",
  dataType: "markdown",
  view: {
    defaultType: "card",
    permittedTypes: ["label", "tile", "card", "full"],
    contextOverrides: { relationship: "tile" },
  },
};

describe("independent data/view contracts", () => {
  it("validates the full production adapter matrix", () => {
    for (const view of ["label", "tile", "card", "full"] as const)
      expect(adaptView("markdown", view, input).title).toBe(input.title);
  });
  it("adapts a synthetic second data type into the same common card without another renderer", () => {
    const adapters: AdapterRegistry = new Map([
      ...ADAPTERS,
      [
        "synthetic-status",
        {
          card: (presentation: Presentation) => ({
            title: presentation.title,
            summary: presentation.summary,
            href: presentation.href,
            badges: presentation.badges,
          }),
        },
      ],
    ]);
    const syntheticPayload = { serviceName: "Synthetic data", status: "Common views" };
    const projected: Presentation = {
      ...input,
      title: syntheticPayload.serviceName,
      summary: syntheticPayload.status,
    };
    expect(adaptView("synthetic-status", "card", projected, adapters)).toEqual(
      adaptView("markdown", "card", input),
    );
    expect(() => adaptView("synthetic-status", "full", projected, adapters)).toThrow(
      "No registered adapter",
    );
  });
  it("rejects adapter leakage using the independent view schema", () => {
    const adapters: AdapterRegistry = new Map([
      [
        "synthetic",
        { label: () => ({ title: "test", href: "#/entities/test", privateData: "not allowed" }) },
      ],
    ]);
    expect(() => adaptView("synthetic", "label", input, adapters)).toThrow("additional");
  });
  it("resolves occurrence then context then entity defaults", () => {
    expect(resolveView(entity, "relationship", "label")).toBe("label");
    expect(resolveView(entity, "relationship")).toBe("tile");
    expect(resolveView(entity, "collection")).toBe("card");
  });
  it("uses site defaults and then compatible registered data fallback only for implicit selections", () => {
    const implicit = { ...entity, view: { permittedTypes: ["tile"] as const } };
    const registry = new Map([["markdown", { version: 1, fallbackView: "tile" as const }]]);
    expect(
      resolveView(
        { ...implicit, view: { permittedTypes: ["tile"] } },
        "navigation",
        undefined,
        ADAPTERS,
        registry,
      ),
    ).toBe("tile");
    expect(() => resolveView(entity, "navigation", "full")).toThrow("explicit");
    expect(() =>
      resolveView(
        { ...entity, view: { defaultType: "full", permittedTypes: ["full"] } },
        "navigation",
      ),
    ).toThrow("explicit");
  });
  it.each([
    "[unsafe](javascript:alert%281%29)",
    "[unsafe](jav&#x61;script:alert%281%29)",
    "<script>alert(1)</script>",
    "<Component />",
    "![remote](https://example.com/image.png)",
    "[file](../research/state.yaml)",
    "[link](https://user:password@example.com)",
    "[unsafe][ref]\n\n[ref]: data:text/html,unsafe",
    "---\nmetadata: unsupported\n---\n",
    "[label][ref]\n\n[ref]: #/entities/hidden\n\n[ref]: #/entities/visible",
  ])("rejects executable or unapproved Markdown %s", (body) => {
    expect(() => projectMarkdown(body, "body.md")).toThrow();
  });
  it("drops hidden link labels/definitions before full models and search text", () => {
    const result = projectMarkdown(
      "[SECRET](#/entities/hidden) [safe](#/entities/visible)",
      "body.md",
      { entityIds: new Set(["visible"]), topicIds: new Set(), allowExternal: () => false },
    );
    expect(result.markdown).not.toContain("SECRET");
    expect(result.text).toBe("safe");
  });
});
