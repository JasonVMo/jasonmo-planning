import type {
  Entity,
  EventSchedule,
  EventStatus,
  FlightViewModel,
  TripData,
} from "@planning/entity-model";
import { exclusiveTripEnd } from "@planning/entity-model";
import { fail } from "./diagnostics.ts";
import type { LoadedEntity } from "./validate.ts";
import type { Presentation } from "./view-adapters.ts";

export function tripData(entity: Entity): TripData | undefined {
  return entity.dataType === "trip" && "children" in entity.data ? entity.data : undefined;
}

export function validateTripComposition(items: readonly LoadedEntity[]): void {
  const byId = new Map(items.map((item) => [item.entity.id, item]));
  const parents = new Map<string, string[]>();
  for (const { entity, descriptorPath } of items) {
    const data = tripData(entity);
    if (!data) continue;
    const orders = new Set<number>();
    const targets = new Set<string>();
    for (const child of data.children) {
      if (orders.has(child.order))
        fail(descriptorPath, "/data/children/order", "child order must be unique per parent");
      orders.add(child.order);
      if (targets.has(child.targetId))
        fail(descriptorPath, "/data/children/targetId", "duplicate trip child target");
      targets.add(child.targetId);
      const target = byId.get(child.targetId)?.entity;
      if (!target)
        fail(descriptorPath, "/data/children/targetId", `missing trip child ${child.targetId}`);
      const targetTrip = tripData(target);
      if (targetTrip?.kind === "trip")
        fail(descriptorPath, "/data/children", "root trip cannot be a child of a trip or segment");
      const expectedType = ["segment", "flight", "reservation"].includes(child.role)
        ? child.role === "segment"
          ? "trip"
          : child.role
        : "markdown";
      if (target.dataType !== expectedType)
        fail(
          descriptorPath,
          "/data/children/role",
          `role ${child.role} requires ${expectedType} data`,
        );
      if (targetTrip) parents.set(target.id, [...(parents.get(target.id) ?? []), entity.id]);
    }
  }
  const visited = new Set<string>();
  const visiting = new Set<string>();
  function visit(id: string): void {
    if (visiting.has(id)) fail(id, "/data/children", "trip child graph must be acyclic");
    if (visited.has(id)) return;
    visiting.add(id);
    const data = tripData(byId.get(id)!.entity);
    for (const child of data?.children ?? [])
      if (tripData(byId.get(child.targetId)!.entity)) visit(child.targetId);
    visiting.delete(id);
    visited.add(id);
  }
  for (const { entity } of items) visit(entity.id);
  for (const { entity, descriptorPath } of items) {
    if (tripData(entity)?.kind !== "segment") continue;
    let id = entity.id;
    while (tripData(byId.get(id)!.entity)?.kind === "segment") {
      const owners = parents.get(id) ?? [];
      if (owners.length !== 1)
        fail(
          descriptorPath,
          "/data/kind",
          "each segment must belong to exactly one trip root through one parent",
        );
      id = owners[0]!;
    }
  }
}

// A visible segment must not disclose a child of an audience-hidden trip root.
export function filterTripParentClosure(
  items: readonly LoadedEntity[],
  selected: LoadedEntity[],
): LoadedEntity[] {
  const parents = new Map<string, string>();
  for (const { entity } of items)
    for (const child of tripData(entity)?.children ?? []) parents.set(child.targetId, entity.id);
  let result = selected;
  while (true) {
    const ids = new Set(result.map((item) => item.entity.id));
    const next = result.filter(
      ({ entity }) => tripData(entity)?.kind !== "segment" || ids.has(parents.get(entity.id) ?? ""),
    );
    if (next.length === result.length) return next;
    result = next;
  }
}

function scheduleProjection(schedule: EventSchedule): EventSchedule {
  return schedule.allDay
    ? { allDay: true, startDate: schedule.startDate, endDate: schedule.endDate }
    : {
        allDay: false,
        startAt: schedule.startAt,
        endAt: schedule.endAt,
        timeZone: schedule.timeZone,
      };
}

function calendarStatus(status: string): EventStatus {
  return status === "cancelled"
    ? "cancelled"
    : ["planned", "tentative", "needs-booking"].includes(status)
      ? "tentative"
      : "confirmed";
}

export function projectTravel(
  entity: Entity,
  selected: ReadonlyMap<string, LoadedEntity>,
  presentation: Presentation,
): void {
  const data = entity.data;
  if (entity.dataType === "trip" && "children" in data) {
    presentation.trip = {
      kind: data.kind,
      status: data.status,
      startDate: data.startDate,
      endDate: data.endDate,
      destination: data.destination,
      timeZone: data.timeZone,
      children: [...data.children]
        .sort((a, b) => a.order - b.order)
        .flatMap((child) => {
          const target = selected.get(child.targetId)?.entity;
          return target
            ? [
                {
                  title: target.title,
                  summary: target.summary,
                  href: `#/entities/${target.id}`,
                  role: child.role,
                  order: child.order,
                },
              ]
            : [];
        }),
    };
    presentation.event = {
      kind: "event",
      status: calendarStatus(data.status),
      schedule: {
        allDay: true,
        startDate: data.startDate,
        endDate: exclusiveTripEnd(data.endDate),
      },
      location: data.destination,
    };
  } else if (entity.dataType === "flight" && "legs" in data) {
    presentation.flight = {
      status: data.status,
      legs: data.legs.map((leg) => ({
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
    const first = data.legs[0]!;
    const last = data.legs.at(-1)!;
    presentation.event = {
      kind: "event",
      status: calendarStatus(data.status),
      schedule: {
        allDay: false,
        startAt: first.departAt,
        endAt: last.arriveAt,
        timeZone: first.departureTimeZone,
      },
    };
  } else if (entity.dataType === "reservation" && "provider" in data) {
    presentation.event = {
      kind: "appointment",
      status: calendarStatus(data.status),
      schedule: scheduleProjection(data.schedule),
    };
    if (data.location !== undefined) presentation.event.location = data.location;
  } else if (entity.dataType === "event" && "schedule" in data && !("provider" in data)) {
    presentation.event = {
      kind: data.kind,
      status: data.status,
      schedule: scheduleProjection(data.schedule),
    };
    if (data.location !== undefined) presentation.event.location = data.location;
  }
}
