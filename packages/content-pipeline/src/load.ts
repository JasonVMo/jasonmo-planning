import { constants } from "node:fs";
import { lstat, open, readdir, realpath } from "node:fs/promises";
import { isAbsolute, join, posix, relative, resolve, sep } from "node:path";
import { isAlias, isMap, isScalar, parseDocument, visit } from "yaml";
import { fail } from "./diagnostics.ts";

export const MAX_FILE_BYTES = 262_144;
export const MAX_CORPUS_FILES = 10_000;
export type Overlay = ReadonlyMap<string, Buffer>;

export function safeRelative(path: string): string {
  if (
    !path ||
    isAbsolute(path) ||
    /[\\:]/.test(path) ||
    [...path].some((char) => char.charCodeAt(0) < 32) ||
    path.includes("%") ||
    path.split("/").some((part) => !part || part === "." || part === "..") ||
    posix.normalize(path) !== path
  ) {
    fail(path, "", "expected a normalized confined repository-relative path");
  }
  return path;
}

export async function confinedPath(
  root: string,
  path: string,
  allowMissing = false,
): Promise<string> {
  safeRelative(path);
  const base = await realpath(root);
  const target = resolve(base, path);
  const rel = relative(base, target);
  if (rel.startsWith(`..${sep}`) || rel === ".." || isAbsolute(rel))
    fail(path, "", "path escapes repository");
  let current = base;
  for (const part of path.split("/")) {
    current = join(current, part);
    try {
      const entry = await lstat(current);
      if (entry.isSymbolicLink()) fail(path, "", "symlinks are not allowed in canonical paths");
    } catch (error) {
      if (allowMissing && (error as NodeJS.ErrnoException).code === "ENOENT") continue;
      throw error;
    }
  }
  return target;
}

export class RepositoryReader {
  private count = 0;
  constructor(
    public readonly root: string,
    private readonly overlay: Overlay = new Map(),
  ) {}

  async exists(path: string): Promise<boolean> {
    if (this.overlay.has(safeRelative(path))) return true;
    try {
      await confinedPath(this.root, path);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
      throw error;
    }
  }

  async files(directory: string): Promise<string[]> {
    const result = new Set<string>();
    if (await this.exists(directory)) {
      const absolute = await confinedPath(this.root, directory);
      for (const entry of await readdir(absolute, { withFileTypes: true })) {
        if (entry.isSymbolicLink())
          fail(`${directory}/${entry.name}`, "", "symlinks are forbidden");
        if (!entry.isDirectory() && !entry.isFile())
          fail(
            `${directory}/${entry.name}`,
            "",
            "only ordinary files and directories are supported",
          );
        result.add(entry.name);
      }
    }
    for (const path of this.overlay.keys()) {
      if (path.startsWith(`${directory}/`))
        result.add(path.slice(directory.length + 1).split("/")[0]!);
    }
    return [...result].sort();
  }

  async bytes(path: string): Promise<Buffer> {
    safeRelative(path);
    if (++this.count > MAX_CORPUS_FILES) fail(path, "", "corpus read limit exceeded");
    const candidate = this.overlay.get(path);
    if (candidate) {
      if (candidate.length > MAX_FILE_BYTES) fail(path, "", "file exceeds 256 KiB limit");
      return candidate;
    }
    const absolute = await confinedPath(this.root, path);
    const file = await open(absolute, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      const stat = await file.stat();
      if (!stat.isFile() || stat.size > MAX_FILE_BYTES)
        fail(path, "", "expected regular file at most 256 KiB");
      const bytes = Buffer.alloc(MAX_FILE_BYTES + 1);
      let length = 0;
      while (length < bytes.length) {
        const read = await file.read(bytes, length, bytes.length - length, null);
        if (!read.bytesRead) break;
        length += read.bytesRead;
      }
      if (length > MAX_FILE_BYTES) fail(path, "", "file exceeds 256 KiB limit");
      return bytes.subarray(0, length);
    } finally {
      await file.close();
    }
  }

  async text(path: string): Promise<string> {
    const bytes = await this.bytes(path);
    let text: string;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      fail(path, "", "invalid UTF-8");
    }
    if (text.includes("\0")) fail(path, "", "NUL bytes are forbidden");
    return text;
  }

  async document(path: string): Promise<unknown> {
    return parseStrict(await this.text(path), path);
  }
}

export function parseStrict(text: string, file: string): unknown {
  if (Buffer.byteLength(text) > MAX_FILE_BYTES) fail(file, "", "file exceeds 256 KiB limit");
  const json = file.endsWith(".json");
  if (!json && !/\.ya?ml$/.test(file)) fail(file, "", "expected JSON or YAML descriptor");
  if (json) {
    try {
      JSON.parse(text);
    } catch {
      fail(file, "", "invalid JSON syntax");
    }
  }
  const document = parseDocument(text, {
    version: "1.2",
    uniqueKeys: true,
    strict: true,
    merge: false,
    schema: json ? "json" : "core",
  });
  if (document.errors.length || document.warnings.length)
    fail(
      file,
      "",
      [...document.errors, ...document.warnings].map((error) => error.message).join("; "),
    );
  visit(document, {
    Node(_key, node) {
      if (isAlias(node) || ("anchor" in node && node.anchor) || node.tag)
        fail(file, "", "aliases, anchors, and explicit tags are forbidden");
      if (isMap(node)) {
        for (const pair of node.items) {
          if (!isScalar(pair.key) || typeof pair.key.value !== "string")
            fail(file, "", "mapping keys must be strings");
          if (["<<", "__proto__", "prototype", "constructor"].includes(pair.key.value))
            fail(file, "", "merge and prototype keys are forbidden");
        }
      }
      if (isScalar(node) && typeof node.value === "number" && !Number.isFinite(node.value))
        fail(file, "", "non-finite numbers are forbidden");
    },
  });
  return document.toJS({ maxAliasCount: 0 });
}
