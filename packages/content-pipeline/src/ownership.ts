import type { Entity, OwnershipPolicy } from "@planning/entity-model";
import { serializeCanonical } from "./canonical.ts";
import { fail } from "./diagnostics.ts";

export type Policy = OwnershipPolicy["policies"][number];
const marker = /^<!-- (BEGIN|END) AGENT-MANAGED: ([a-z][a-z0-9-]*) -->$/;

export function managedRegions(body: string, policy: Policy, file: string): Map<string, string> {
  const regions = new Map<string, string>();
  let active: string | undefined;
  let contents = "";
  for (const line of body.split(/(?<=\n)/)) {
    const token = line.replace(/\r?\n$/, "");
    const match = marker.exec(token);
    if (!match) {
      if (/AGENT-MANAGED|<!--\s*(?:BEGIN|END)/.test(line))
        fail(file, "", "modified ownership marker");
      if (active) contents += line;
      continue;
    }
    const name = match[2]!;
    if (!policy.managedRegions.includes(name))
      fail(file, "", `marker ${name} not authorized by central policy`);
    if (match[1] === "BEGIN") {
      if (active || regions.has(name)) fail(file, "", "nested or duplicate ownership markers");
      active = name;
      contents = "";
    } else {
      if (active !== name) fail(file, "", "unmatched ownership marker");
      regions.set(name, contents);
      active = undefined;
    }
  }
  if (active || policy.managedRegions.some((name) => !regions.has(name)))
    fail(file, "", "missing ownership markers");
  return regions;
}

export function manualSkeleton(body: string, policy: Policy, file: string): string {
  managedRegions(body, policy, file);
  let active = false;
  return body
    .split(/(?<=\n)/)
    .filter((line) => {
      const match = marker.exec(line.replace(/\r?\n$/, ""));
      if (match) {
        active = match[1] === "BEGIN";
        return true;
      }
      return !active;
    })
    .join("");
}

export function validateEntityEdit(
  before: Entity,
  after: Entity,
  policy: Policy,
  file: string,
): void {
  const allowed = policy.entityPointers;
  function compare(a: unknown, b: unknown, pointer: string): void {
    if (
      serializeCanonical(a) === serializeCanonical(b) ||
      allowed.includes(pointer as Policy["entityPointers"][number])
    )
      return;
    if (
      a &&
      b &&
      typeof a === "object" &&
      typeof b === "object" &&
      !Array.isArray(a) &&
      !Array.isArray(b)
    ) {
      const left = a as Record<string, unknown>,
        right = b as Record<string, unknown>;
      for (const key of new Set([...Object.keys(left), ...Object.keys(right)]))
        compare(
          left[key] ?? null,
          right[key] ?? null,
          `${pointer}/${key.replace(/~/g, "~0").replace(/\//g, "~1")}`,
        );
      return;
    }
    fail(file, pointer, "owner-controlled field may not be changed by reconciliation");
  }
  compare(before, after, "");
  if (Date.parse(after.timestamps.updatedAt) < Date.parse(before.timestamps.updatedAt))
    fail(file, "/timestamps/updatedAt", "timestamp cannot move backwards");
}
