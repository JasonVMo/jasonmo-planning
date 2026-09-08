/**
 * Archive threshold rules (NEXT.md section 4.3) and small pure helpers built directly on the real
 * `TripViewModel`/`FlightViewModel`/`EventSchedule` contracts from `@planning/entity-model`, plus a
 * safe calendar-event aggregator for trip/flight/reservation/event entities.
 *
 * Deliberately depends only on `@planning/entity-model` (pure data), not `@planning/entity-ui`:
 * the latter's package entry point imports its stylesheet as a side effect, which is fine in the
 * browser bundle but breaks plain Node-based unit tests of this module. `addCalendarDaysUtc`/
 * `calendarDateAt` below are minimal, behavior-identical re-implementations of `@planning/entity-ui`'s
 * `addCalendarDays`/`dateAt` for that reason.
 */
import type {
  CalendarEvent,
  EventSchedule,
  SiteEntity,
  TripViewModel,
} from "@planning/entity-model";
import { isCalendarDate } from "@planning/entity-model";

/** Evaluation zone for the Archive threshold (section 4.3 of NEXT.md). */
export const ARCHIVE_TIME_ZONE = "America/Los_Angeles";
/** Grace period, in whole calendar days, before an ended trip or event is archived. */
export const ARCHIVE_GRACE_DAYS = 35;

function addCalendarDaysUtc(date: string, days: number): string | null {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  const result = value.toISOString().slice(0, 10);
  return isCalendarDate(result) ? result : null;
}

function calendarDateAt(instant: number | string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(instant));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((value) => value.type === type)?.value ?? "";
  return `${part("year").padStart(4, "0")}-${part("month")}-${part("day")}`;
}

/** True only for a root trip (not one of its segments). */
export function isRootTrip(trip: TripViewModel): boolean {
  return trip.kind === "trip";
}

/**
 * Effective (inclusive) last calendar date for a trip, from its inclusive `TripViewModel.endDate`.
 * Named for symmetry with `eventEffectiveEndDate`; trips need no adjustment since `endDate` is
 * already inclusive.
 */
export function tripEffectiveEndDate(trip: Pick<TripViewModel, "endDate">): string {
  return trip.endDate;
}

function requireCalendarDate(date: string | null, context: string): string {
  if (!date) throw new Error(`Cannot resolve a calendar date ${context}`);
  return date;
}

/**
 * Effective (inclusive) last calendar date for an event schedule. All-day `EventSchedule.endDate`
 * is exclusive, so the previous day is used. Timed schedules resolve to the calendar date of the
 * end instant, rendered in the schedule's own time zone.
 */
export function eventEffectiveEndDate(schedule: EventSchedule): string {
  if (schedule.allDay) {
    return requireCalendarDate(
      addCalendarDaysUtc(schedule.endDate, -1),
      `before ${schedule.endDate}`,
    );
  }
  return calendarDateAt(schedule.endAt, schedule.timeZone);
}

/** First calendar date (inclusive) on which an item with the given effective end date is archived. */
export function archiveThresholdDate(effectiveEndDate: string): string {
  return requireCalendarDate(
    addCalendarDaysUtc(effectiveEndDate, ARCHIVE_GRACE_DAYS),
    `after ${effectiveEndDate}`,
  );
}

/**
 * Whether an item with the given effective end date is archived as of `asOf` (defaults to now),
 * evaluated at calendar-day granularity in `America/Los_Angeles`. `asOf` accepts a `Date`, an
 * epoch-millisecond instant, or an ISO/calendar-timestamp string so tests can inject a fixed clock;
 * it is only read when this function runs, never at module load.
 */
export function isArchivedAsOf(
  effectiveEndDate: string,
  asOf: Date | number | string = Date.now(),
): boolean {
  const instant =
    asOf instanceof Date ? asOf.getTime() : typeof asOf === "number" ? asOf : Date.parse(asOf);
  const today = calendarDateAt(instant, ARCHIVE_TIME_ZONE);
  return today >= archiveThresholdDate(effectiveEndDate);
}

/** Applies an explicit owner lifecycle override before the derived date threshold. */
export function isEntityArchived(
  entity: Pick<SiteEntity, "lifecycle">,
  effectiveEndDate: string,
  asOf: Date | number | string = Date.now(),
): boolean {
  return entity.lifecycle === "archived" || isArchivedAsOf(effectiveEndDate, asOf);
}

/** Finds the trip entity (root or segment) whose projected children include the given route. */
function immediateTripParent(
  entities: readonly SiteEntity[],
  route: string,
): { entity: SiteEntity; trip: TripViewModel } | undefined {
  for (const candidate of entities) {
    const trip = candidate.viewModels.trip;
    if (trip && trip.children.some((child) => child.href === route)) {
      return { entity: candidate, trip };
    }
  }
  return undefined;
}

/**
 * Infers the chain of ancestor trip entities for a route, root-first, by walking projected
 * `TripViewModel.children` links rather than any canonical parent pointer. A root trip's own route
 * returns an empty chain; a segment returns `[root]`; a flight or reservation attached to a segment
 * returns `[root, segment]`. A bounded walk guards against a malformed cyclical projection.
 */
export function tripAncestryOf(entities: readonly SiteEntity[], route: string): SiteEntity[] {
  const chain: SiteEntity[] = [];
  const seenRoutes = new Set<string>();
  let currentRoute = route;
  for (let depth = 0; depth < 8; depth += 1) {
    const parent = immediateTripParent(entities, currentRoute);
    if (!parent || seenRoutes.has(parent.entity.route)) break;
    seenRoutes.add(parent.entity.route);
    chain.unshift(parent.entity);
    currentRoute = parent.entity.route;
  }
  return chain;
}

/**
 * Calendar spans contributed by one entity. Trip, flight, reservation, and standalone event
 * entities all project a `viewModels.event` (see `packages/content-pipeline/src/travel.ts`), so the
 * safe `event` model is reused as-is rather than recomputed from raw canonical fields. Trip segments
 * are excluded: a root trip's own span already covers its segments' combined date range, so
 * including segment spans too would duplicate the same period on the calendar.
 */
export function calendarEventsForEntity(entity: SiteEntity): CalendarEvent[] {
  if (entity.viewModels.trip && !isRootTrip(entity.viewModels.trip)) return [];
  const event = entity.viewModels.event;
  if (!event) return [];
  return [
    {
      title: event.title,
      summary: event.summary,
      href: event.href,
      kind: event.kind,
      status: event.status,
      schedule: event.schedule,
      ...(event.location === undefined ? {} : { location: event.location }),
    },
  ];
}

/** Detects the explicit public-safe tag used for reservations that still need booking. */
export function isPossibleNeedsBookingReservation(entity: SiteEntity): boolean {
  return entity.dataType === "reservation" && entity.tags.includes("needs-booking");
}
