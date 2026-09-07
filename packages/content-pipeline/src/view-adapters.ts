import type {
  CardViewModel,
  FullViewModel,
  LabelViewModel,
  RenderContext,
  TileViewModel,
  ViewType,
} from "@tracker/entity-model";
import { VIEW_TYPES } from "@tracker/entity-model";
import { assertSchema } from "./schema.ts";

export interface ViewModelMap {
  label: LabelViewModel;
  tile: TileViewModel;
  card: CardViewModel;
  full: FullViewModel;
}

// Adapters receive a publication-safe projection, never a canonical entity.
export interface Presentation {
  title: string;
  summary: string;
  href: string;
  body: string;
  badges: string[];
}

export type AdapterRegistry = ReadonlyMap<
  string,
  Partial<{ [V in ViewType]: (value: Presentation) => ViewModelMap[V] }>
>;
export interface DataTypeRegistration {
  version: number;
  fallbackView: ViewType;
}
export const DATA_TYPES: ReadonlyMap<string, DataTypeRegistration> = new Map([
  ["markdown", { version: 1, fallbackView: "full" }],
]);
export const VIEW_REGISTRY: Readonly<
  Record<
    ViewType,
    {
      schema: "LabelViewModel" | "TileViewModel" | "CardViewModel" | "FullViewModel";
      contexts: readonly RenderContext[];
    }
  >
> = {
  label: {
    schema: "LabelViewModel",
    contexts: ["navigation", "collection", "relationship", "search", "detail"],
  },
  tile: {
    schema: "TileViewModel",
    contexts: ["navigation", "collection", "relationship", "search", "detail"],
  },
  card: {
    schema: "CardViewModel",
    contexts: ["navigation", "collection", "relationship", "search", "detail"],
  },
  full: { schema: "FullViewModel", contexts: ["collection", "detail"] },
};
export const ADAPTERS: AdapterRegistry = new Map([
  [
    "markdown",
    {
      label: (p: Presentation): LabelViewModel => ({ title: p.title, href: p.href }),
      tile: (p: Presentation): TileViewModel => ({
        title: p.title,
        summary: p.summary,
        href: p.href,
      }),
      card: (p: Presentation): CardViewModel => ({
        title: p.title,
        summary: p.summary,
        href: p.href,
        badges: [...p.badges],
      }),
      full: (p: Presentation): FullViewModel => ({
        title: p.title,
        summary: p.summary,
        href: p.href,
        body: p.body,
      }),
    },
  ],
]);

export function adaptView<V extends ViewType>(
  dataType: string,
  viewType: V,
  input: Presentation,
  adapters: AdapterRegistry = ADAPTERS,
): ViewModelMap[V] {
  const adapter = adapters.get(dataType)?.[viewType];
  if (!adapter) throw new Error(`No registered adapter for ${dataType}:${viewType}`);
  const output = adapter(input);
  assertSchema<ViewModelMap[V]>(VIEW_REGISTRY[viewType].schema, output, `${dataType}:${viewType}`);
  return output;
}

export function supportedViews(dataType: string, adapters: AdapterRegistry = ADAPTERS): ViewType[] {
  return VIEW_TYPES.filter((view) => Boolean(adapters.get(dataType)?.[view]));
}
