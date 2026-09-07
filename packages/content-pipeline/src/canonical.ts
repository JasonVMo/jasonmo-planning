import { createHash } from "node:crypto";

export function serializeCanonical(value: unknown): string {
  const ancestors = new Set<object>();
  function normalize(input: unknown): unknown {
    if (input === null || typeof input === "boolean") return input;
    if (typeof input === "string") return input.replace(/\r\n?/g, "\n");
    if (typeof input === "number" && Number.isFinite(input)) return input;
    if (typeof input !== "object" || !input)
      throw new TypeError("Canonical values must be JSON-compatible");
    if (ancestors.has(input)) throw new TypeError("Canonical values must not contain cycles");
    ancestors.add(input);
    let result: unknown;
    if (Array.isArray(input)) {
      if (Object.keys(input).length !== input.length)
        throw new TypeError("Sparse or decorated arrays are not canonical");
      result = input.map(normalize);
    } else {
      if (![Object.prototype, null].includes(Object.getPrototypeOf(input) as object | null))
        throw new TypeError("Only plain JSON objects are canonical");
      result = Object.fromEntries(
        Object.keys(input)
          .sort()
          .map((key) => [key, normalize((input as Record<string, unknown>)[key])]),
      );
    }
    ancestors.delete(input);
    return result;
  }
  return `${JSON.stringify(normalize(value), null, 2)}\n`;
}

export function hashBytes(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

export function digest(value: unknown): string {
  return hashBytes(serializeCanonical(value));
}
