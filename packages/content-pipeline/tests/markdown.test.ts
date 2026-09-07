import { afterEach, describe, expect, it } from "vitest";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { projectMarkdown } from "../src/markdown.ts";
import { compileContent } from "../src/index.ts";
import { BODY_PATH, ENTITY_ID, cleanup, fixture } from "./fixtures.ts";

afterEach(cleanup);
const source = `## Embedded details

| Topic | Status |
| --- | --- |
| Markdown | **Ready** |

- [x] Completed item
- [ ] Pending item

~~Old plan~~ New plan

https://example.com/source

\`\`\`ts
const example = "<script>inert code</script>";
\`\`\``;

describe("file and string Markdown projection", () => {
  it("preserves GFM features through string projection and repeated compilation", () => {
    const result = projectMarkdown(source, "<synthetic-string>");
    expect(result.markdown).toContain("| Topic");
    expect(result.markdown).toContain("- [x] Completed item");
    expect(result.markdown).toContain("~~Old plan~~");
    expect(result.markdown).toContain("https://example.com/source");
    expect(result.text).toContain("Ready");
    expect(projectMarkdown(result.markdown, "<synthetic-roundtrip>")).toEqual(result);
  });
  it("embeds a confined Markdown file in the manifest rather than exposing its path", async () => {
    const root = await fixture();
    const path = join(root, BODY_PATH);
    const original = await readFile(path, "utf8");
    await writeFile(path, `${original}\n\n${source}\n`);
    const manifest = await compileContent(root, { target: "local", basePath: "/nested/" });
    const entity = manifest.entities.find((item) => item.id === ENTITY_ID)!;
    expect(entity.viewModels.full?.body).toContain("- [x] Completed item");
    expect(entity.viewModels.full?.body).toContain("~~Old plan~~");
    expect(manifest.searchDocuments.find((item) => item.id === ENTITY_ID)?.body).toContain(
      "Pending item",
    );
    expect(JSON.stringify(manifest)).not.toContain("bodyPath");
    expect(await readFile(path, "utf8")).toBe(`${original}\n\n${source}\n`);
  });
  it("filters audience-hidden links from GFM cells, lists, and nested definitions", () => {
    const result = projectMarkdown(
      `| Link |
| --- |
| [CELL-CANARY](#/entities/hidden) |

- [ ] [TASK-CANARY](#/entities/hidden)

> [REFERENCE-CANARY][hidden]
>
> [hidden]: #/entities/hidden

https://private.example.com/URL-CANARY`,
      "<synthetic>",
      {
        entityIds: new Set(),
        topicIds: new Set(),
        allowExternal: () => false,
      },
    );
    expect(JSON.stringify(result)).not.toMatch(/CANARY|private\.example|entities\/hidden/);
  });
  it.each([
    "<script>bad()</script>",
    "![remote](https://example.com/pixel.png)",
    "[relative](../private.md)",
    "[unsafe](javascript:alert(1))",
    "[credentials](https://user:pass@example.com)",
  ])("keeps unsafe Markdown out of the compiler: %s", (markdown) => {
    expect(() => projectMarkdown(markdown, "<synthetic>")).toThrow();
  });
});
