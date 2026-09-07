import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import remarkGfm from "remark-gfm";
import { isSafeMarkdownUrl as safeUrl } from "@planning/entity-model";
import type { Root, RootContent } from "mdast";
import { fail } from "./diagnostics.ts";

export interface MarkdownAudience {
  entityIds: ReadonlySet<string>;
  topicIds: ReadonlySet<string>;
  allowExternal: (url: string) => boolean;
}
const parser = unified().use(remarkParse).use(remarkGfm);
const writer = unified().use(remarkGfm).use(remarkStringify, { bullet: "-", fences: true });

export { safeUrl };

function allowedLink(url: string, audience?: MarkdownAudience): boolean {
  if (!safeUrl(url)) return false;
  if (!audience) return true;
  const match = /^#\/(entities|topics)\/(.+)$/.exec(url);
  if (match)
    return (match[1] === "entities" ? audience.entityIds : audience.topicIds).has(match[2]!);
  if (url.startsWith("#")) return true;
  return audience.allowExternal(url);
}

export function projectMarkdown(
  body: string,
  file: string,
  audience?: MarkdownAudience,
): { markdown: string; text: string } {
  if (/^(?:---|\+\+\+)\r?\n/.test(body))
    fail(file, "/body", "Markdown frontmatter is not supported");
  const tree: Root = parser.parse(body);
  const definitions = new Map<string, string>();
  function collectDefinitions(nodes: RootContent[]): void {
    for (const node of nodes) {
      if (node.type === "definition") {
        const id = node.identifier.toLowerCase();
        if (definitions.has(id))
          fail(file, "/body", "duplicate Markdown link definitions are forbidden");
        definitions.set(id, node.url);
      }
      if ("children" in node) collectDefinitions(node.children as RootContent[]);
    }
  }
  collectDefinitions(tree.children);
  const text: string[] = [];
  function walk(nodes: RootContent[]): RootContent[] {
    const result: RootContent[] = [];
    for (const node of nodes) {
      if (node.type === "html") {
        if (!/^<!-- (?:BEGIN|END) AGENT-MANAGED: [a-z][a-z0-9-]* -->$/.test(node.value.trim()))
          fail(file, "/body", "raw HTML, MDX, and JSX are forbidden");
        continue;
      }
      if (node.type === "image" || node.type === "imageReference")
        fail(
          file,
          "/body",
          "images/assets are not enabled; remote images and unapproved local assets are forbidden",
        );
      if (node.type === "definition") {
        if (!safeUrl(node.url)) fail(file, "/body", "unsafe or unvalidated link destination");
        if (!allowedLink(node.url, audience)) continue;
      }
      if (node.type === "link" || node.type === "linkReference") {
        const url =
          node.type === "link" ? node.url : definitions.get(node.identifier.toLowerCase());
        if (!url || !safeUrl(url)) fail(file, "/body", "unsafe or unresolved Markdown link");
        if (!allowedLink(url, audience)) continue;
      }
      if ("children" in node) {
        const children = walk(node.children as RootContent[]);
        // The allowed tree remains Markdown; no executable node types are introduced.
        result.push({ ...node, children } as RootContent);
      } else {
        if (node.type === "text" || node.type === "code" || node.type === "inlineCode")
          text.push(node.value);
        result.push(node);
      }
    }
    return result;
  }
  tree.children = walk(tree.children);
  return {
    markdown: writer.stringify(tree).replace(/\r\n?/g, "\n"),
    text: text.join(" ").replace(/\s+/g, " ").trim(),
  };
}
