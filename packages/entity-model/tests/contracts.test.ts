import { describe, expect, it } from "vitest";
import { AUDIENCES, RENDER_CONTEXTS, VIEW_TYPES } from "../src/index.ts";
import contracts from "../schemas/contracts.schema.json";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

describe("browser-safe generated model surface", () => {
  it("keeps closed code constants aligned to authoritative draft-07 enums", () => {
    expect(contracts.$schema).toBe("http://json-schema.org/draft-07/schema#");
    expect(AUDIENCES).toEqual(contracts.definitions.Audience.enum);
    expect(VIEW_TYPES).toEqual(contracts.definitions.ViewType.enum);
    expect(RENDER_CONTEXTS).toEqual(contracts.definitions.RenderContext.enum);
  });
  it("owns independent strict data/view contracts and safe Markdown string body", () => {
    expect(contracts.definitions.Entity.properties.dataType.const).toBe("markdown");
    expect(contracts.definitions.FullViewModel.properties.body.type).toBe("string");
    for (const name of [
      "LabelViewModel",
      "TileViewModel",
      "CardViewModel",
      "FullViewModel",
      "SiteManifest",
    ] as const)
      expect(contracts.definitions[name].additionalProperties).toBe(false);
  });
  it("allows only in-package references in every schema entry point", async () => {
    const directory = fileURLToPath(new URL("../schemas/", import.meta.url));
    const walk = async (path: string): Promise<void> => {
      for (const entry of await readdir(path, { withFileTypes: true })) {
        const filename = join(path, entry.name);
        if (entry.isDirectory()) {
          await walk(filename);
          continue;
        }
        const schema = JSON.parse(await readFile(filename, "utf8")) as {
          $schema: string;
          $ref?: string;
        };
        expect(schema.$schema).toBe("http://json-schema.org/draft-07/schema#");
        if (schema.$ref) {
          const [target, pointer] = schema.$ref.split("#");
          expect(resolve(path, target!)).toBe(join(directory, "contracts.schema.json"));
          expect(pointer).toMatch(/^\/definitions\//);
          expect(contracts.definitions).toHaveProperty(pointer!.split("/")[2]!);
        }
      }
    };
    await walk(directory);
  });
});
