import type {
  CalendarDayViewModel,
  CalendarEvent,
  CalendarMonthViewModel,
  CardViewModel,
  EventViewModel,
  TripViewModel,
  FlightViewModel,
  FullViewModel,
  LabelViewModel,
  RenderContext,
  TileViewModel,
  TimelineViewModel,
  ViewType,
} from "@planning/entity-model";
import { calendarStart, VIEW_TYPES } from "@planning/entity-model";
import { assertSchema } from "./schema.ts";

export interface ViewModelMap {
  label: LabelViewModel;
  tile: TileViewModel;
  card: CardViewModel;
  full: FullViewModel;
  event: EventViewModel;
  trip: TripViewModel;
  flight: FlightViewModel;
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
  trip?: Omit<TripViewModel, "title" | "summary" | "href" | "body">;
  flight?: Pick<FlightViewModel, "status" | "legs">;
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
  [
    "trip",
    { version: 1, fallbackView: "trip", contextDefaults: { collection: "trip", detail: "trip" } },
  ],
  [
    "flight",
    {
      version: 1,
      fallbackView: "flight",
      contextDefaults: { collection: "flight", detail: "flight" },
    },
  ],
  [
    "reservation",
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
        | "TripViewModel"
        | "FlightViewModel"
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
  trip: { schema: "TripViewModel", contexts: ["collection", "relationship", "detail"] },
  flight: { schema: "FlightViewModel", contexts: ["collection", "relationship", "detail"] },
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
  return {
    title: p.title,
    ...calendarStart(event.schedule),
    ...(p.trip ? { timeZone: p.trip.timeZone } : {}),
    events: [event],
  };
}

const eventAdapters = {
  ...commonAdapters,
  event: (p: Presentation): EventViewModel => ({ ...calendarEvent(p), body: p.body }),
  "calendar-month": calendarCollection,
  "calendar-day": calendarCollection,
  timeline: calendarCollection,
};

export const ADAPTERS: AdapterRegistry = new Map<
  string,
  Partial<{ [V in ViewType]: (value: Presentation) => ViewModelMap[V] }>
>([
  ["markdown", commonAdapters],
  ["event", eventAdapters],
  ["reservation", eventAdapters],
  [
    "trip",
    {
      ...eventAdapters,
      trip: (p: Presentation): TripViewModel => {
        if (!p.trip) throw new Error("Trip adapter requires an audience-safe trip presentation");
        return {
          title: p.title,
          summary: p.summary,
          href: p.href,
          body: p.body,
          kind: p.trip.kind,
          status: p.trip.status,
          startDate: p.trip.startDate,
          endDate: p.trip.endDate,
          destination: p.trip.destination,
          timeZone: p.trip.timeZone,
          children: p.trip.children.map((child) => ({
            title: child.title,
            summary: child.summary,
            href: child.href,
            role: child.role,
            order: child.order,
          })),
        };
      },
    },
  ],
  [
    "flight",
    {
      ...eventAdapters,
      flight: (p: Presentation): FlightViewModel => {
        if (!p.flight)
          throw new Error("Flight adapter requires an audience-safe flight presentation");
        return {
          title: p.title,
          summary: p.summary,
          href: p.href,
          body: p.body,
          status: p.flight.status,
          legs: p.flight.legs.map((leg) => ({
            carrier: leg.carrier,
            flightNumber: leg.flightNumber,
            origin: leg.origin,
            destination: leg.destination,
            departAt: leg.departAt,
            departureTimeZone: leg.departureTimeZone,
            arriveAt: leg.arriveAt,
            arrivalTimeZone: leg.arrivalTimeZone,
          })) as FlightViewModel["legs"],
        };
      },
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
