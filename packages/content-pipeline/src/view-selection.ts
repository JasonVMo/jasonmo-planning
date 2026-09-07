import type { Entity, RenderContext, ViewType } from "@tracker/entity-model";
import {
  ADAPTERS,
  DATA_TYPES,
  VIEW_REGISTRY,
  type AdapterRegistry,
  type DataTypeRegistration,
} from "./view-adapters.ts";
import { fail } from "./diagnostics.ts";

const CONTEXT_DEFAULTS: Readonly<Record<RenderContext, ViewType>> = {
  navigation: "label",
  collection: "card",
  relationship: "tile",
  search: "label",
  detail: "full",
};
export function validateDefaultView(
  entity: Pick<Entity, "id" | "dataType" | "view">,
  file = entity.id,
  adapters: AdapterRegistry = ADAPTERS,
): void {
  const selected = entity.view.defaultType;
  if (
    selected &&
    (!Object.hasOwn(VIEW_REGISTRY, selected) ||
      !entity.view.permittedTypes.includes(selected) ||
      !adapters.get(entity.dataType)?.[selected])
  )
    fail(
      file,
      "/view/defaultType",
      `explicit default ${selected} view is not registered, permitted, or adapted`,
    );
}

export function resolveView(
  entity: Pick<Entity, "id" | "dataType" | "view">,
  context: RenderContext,
  occurrence?: ViewType,
  adapters: AdapterRegistry = ADAPTERS,
  dataTypes: ReadonlyMap<string, DataTypeRegistration> = DATA_TYPES,
): ViewType {
  validateDefaultView(entity, entity.id, adapters);
  const registration = dataTypes.get(entity.dataType);
  if (!registration) fail(entity.id, "/dataType", "unknown data type");
  const compatible = (view: ViewType) =>
    entity.view.permittedTypes.includes(view) &&
    VIEW_REGISTRY[view]?.contexts.includes(context) &&
    Boolean(adapters.get(entity.dataType)?.[view]);
  const selected = occurrence ?? entity.view.contextOverrides?.[context] ?? entity.view.defaultType;
  if (selected) {
    if (!compatible(selected))
      fail(
        entity.id,
        `/view/${context}`,
        `explicit ${selected} view is not registered, permitted, context-compatible, or adapted`,
      );
    return selected;
  }
  for (const fallback of [CONTEXT_DEFAULTS[context], registration.fallbackView])
    if (compatible(fallback)) return fallback;
  fail(entity.id, `/view/${context}`, "no compatible site default or data-type fallback");
}
