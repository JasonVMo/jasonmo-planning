import { describe, expect, it } from "vitest";
import { isSafeMarkdownUrl } from "../src/index.ts";

describe("shared Markdown URL policy", () => {
  it.each([
    "https://example.com/path",
    "http://example.com",
    "mailto:reader@example.com",
    "#/",
    "#/entities/example",
    "#/topics/example",
    "#section-one",
  ])("allows %s", (url) => {
    expect(isSafeMarkdownUrl(url)).toBe(true);
  });
  it.each([
    "javascript:alert(1)",
    "data:text/html,bad",
    "//example.com",
    "/private.md",
    "../private.md",
    "file:///private.md",
    "https://user:pass@example.com",
    "https://user@example.com",
    "https:\\\\example.com",
    "https://example.com\n",
    " https://example.com",
    "",
  ])("rejects %s", (url) => {
    expect(isSafeMarkdownUrl(url)).toBe(false);
  });
});
