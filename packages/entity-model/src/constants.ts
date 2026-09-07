import type { Audience, RenderContext, ViewType } from "./generated/types.ts";

export const AUDIENCES = [
  "local",
  "private-owner",
  "private-group",
  "public",
] as const satisfies readonly Audience[];
export const VIEW_TYPES = [
  "label",
  "tile",
  "card",
  "full",
  "event",
  "calendar-month",
  "calendar-day",
  "timeline",
] as const satisfies readonly ViewType[];
export const RENDER_CONTEXTS = [
  "navigation",
  "collection",
  "relationship",
  "search",
  "detail",
] as const satisfies readonly RenderContext[];
