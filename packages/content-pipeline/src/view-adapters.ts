import type {
  CalendarDayViewModel,
  CalendarEvent,
  CalendarMonthViewModel,
  CardViewModel,
  EventViewModel,
  FullViewModel,
  LabelViewModel,
  RenderContext,
  TileViewModel,
  TimelineViewModel,
  ViewType,
} from "@tracker/entity-model";
import { calendarStart, VIEW_TYPES } from "@tracker/entity-model";
import { assertSchema } from "./schema.ts";

export interface ViewModelMap {
  label: LabelViewModel;
  tile: TileViewModel;
  card: CardViewModel;
  full: FullViewModel;
  event: EventViewModel;
  "calendar-month": CalendarMonthViewModel;
  "calendar-day": CalendarDayViewModel;
  timeline: TimelineViewModel;
}

// Adapters receive a publication-safe projection, never a canonical entity.
export interface Presentation {
  title: string;
  summary: string;
  href: string;
  body: string;
  badges: string[];
  event?: Pick<CalendarEvent, "kind" | "status" | "schedule" | "location">;
}

export type AdapterRegistry = ReadonlyMap<
  string,
  Partial<{ [V in ViewType]: (value: Presentation) => ViewModelMap[V] }>
>;
export interface DataTypeRegistration {
  version: number;
  fallbackView: ViewType;
  contextDefaults?: Partial<Record<RenderContext, ViewType>>;
}
export const DATA_TYPES: ReadonlyMap<string, DataTypeRegistration> = new Map<
  string,
  DataTypeRegistration
>([
  ["markdown", { version: 1, fallbackView: "full" }],
  [
    "event",
    {
      version: 1,
      fallbackView: "event",
      contextDefaults: { collection: "event", detail: "event" },
    },
  ],
]);
export const VIEW_REGISTRY: Readonly<
  Record<
    ViewType,
    {
      schema:
        | "LabelViewModel"
        | "TileViewModel"
        | "CardViewModel"
        | "FullViewModel"
        | "EventViewModel"
        | "CalendarMonthViewModel"
        | "CalendarDayViewModel"
        | "TimelineViewModel";
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
  event: { schema: "EventViewModel", contexts: ["collection", "relationship", "detail"] },
  "calendar-month": { schema: "CalendarMonthViewModel", contexts: ["collection", "detail"] },
  "calendar-day": { schema: "CalendarDayViewModel", contexts: ["collection", "detail"] },
  timeline: { schema: "TimelineViewModel", contexts: ["navigation", "collection", "detail"] },
};
const commonAdapters = {
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
};

function calendarEvent(p: Presentation): CalendarEvent {
  if (!p.event) throw new Error("Event adapter requires an audience-safe event presentation");
  const result: CalendarEvent = {
    title: p.title,
    summary: p.summary,
    href: p.href,
    kind: p.event.kind,
    status: p.event.status,
    schedule: { ...p.event.schedule },
  };
  if (p.event.location !== undefined) result.location = p.event.location;
  assertSchema<CalendarEvent>("CalendarEvent", result, "event:presentation");
  return result;
}

function calendarCollection(p: Presentation): CalendarMonthViewModel {
  const event = calendarEvent(p);
  return { title: p.title, ...calendarStart(event.schedule), events: [event] };
}

export const ADAPTERS: AdapterRegistry = new Map<
  string,
  Partial<{ [V in ViewType]: (value: Presentation) => ViewModelMap[V] }>
>([
  ["markdown", commonAdapters],
  [
    "event",
    {
      ...commonAdapters,
      event: (p: Presentation): EventViewModel => ({ ...calendarEvent(p), body: p.body }),
      "calendar-month": calendarCollection,
      "calendar-day": calendarCollection,
      timeline: calendarCollection,
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
