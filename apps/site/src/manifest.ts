import {
  AUDIENCES,
  RENDER_CONTEXTS,
  VIEW_TYPES,
  isCalendarDate,
  isTimeZone,
  isEventSchedule,
  isFlightLegs,
  isTravelText,
  tripRangeError,
  orderedChildrenError,
  TRIP_CHILD_ROLES,
  type TripViewModel,
  type FlightViewModel,
  type CalendarEvent,
  type EventViewModel,
  type CalendarMonthViewModel,
  type CardViewModel,
  type FullViewModel,
  type LabelViewModel,
  type SearchDocument,
  type SiteEntity,
  type SiteManifest,
  type TileViewModel,
  type TopicView,
  type ViewModels,
} from "@planning/entity-model";

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function onlyKeys(value: JsonObject, keys: readonly string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isHashRoute(value: unknown): value is string {
  return typeof value === "string" && /^#\/(?:[A-Za-z0-9_-]+\/?)*$/.test(value);
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isBasePath(value: unknown): value is string {
  return typeof value === "string" && /^\/(?:[A-Za-z0-9_-]+\/)*$/.test(value);
}

function isStringUnion<const Values extends readonly string[]>(
  value: unknown,
  values: Values,
): value is Values[number] {
  return typeof value === "string" && values.some((candidate) => candidate === value);
}

function isLabelModel(value: unknown): value is LabelViewModel {
  return (
    isObject(value) &&
    onlyKeys(value, ["title", "href"]) &&
    typeof value.title === "string" &&
    isHashRoute(value.href)
  );
}

function isTileModel(value: unknown): value is TileViewModel {
  return (
    isObject(value) &&
    onlyKeys(value, ["title", "summary", "href"]) &&
    typeof value.title === "string" &&
    typeof value.summary === "string" &&
    isHashRoute(value.href)
  );
}

function isCardModel(value: unknown): value is CardViewModel {
  return (
    isObject(value) &&
    onlyKeys(value, ["title", "summary", "href", "badges"]) &&
    typeof value.title === "string" &&
    typeof value.summary === "string" &&
    isHashRoute(value.href) &&
    isStringArray(value.badges)
  );
}

function isFullModel(value: unknown): value is FullViewModel {
  return (
    isObject(value) &&
    onlyKeys(value, ["title", "summary", "href", "body"]) &&
    typeof value.title === "string" &&
    typeof value.summary === "string" &&
    isHashRoute(value.href) &&
    typeof value.body === "string"
  );
}

function isTravelHeader(value: JsonObject): boolean {
  return (
    typeof value.title === "string" &&
    value.title.length <= 240 &&
    typeof value.summary === "string" &&
    value.summary.length <= 2000 &&
    typeof value.href === "string" &&
    /^#\/entities\/[a-z0-9-]+$/.test(value.href) &&
    typeof value.body === "string" &&
    value.body.length <= 262144
  );
}

function isTripModel(value: unknown): value is TripViewModel {
  return (
    isObject(value) &&
    onlyKeys(value, [
      "title",
      "summary",
      "href",
      "body",
      "kind",
      "status",
      "startDate",
      "endDate",
      "destination",
      "timeZone",
      "children",
    ]) &&
    isTravelHeader(value) &&
    isStringUnion(value.kind, ["trip", "segment"]) &&
    isStringUnion(value.status, ["planned", "confirmed", "active", "completed", "cancelled"]) &&
    isCalendarDate(value.startDate) &&
    isCalendarDate(value.endDate) &&
    !tripRangeError(value) &&
    isTravelText(value.destination) &&
    isTimeZone(value.timeZone) &&
    Array.isArray(value.children) &&
    value.children.length <= 200 &&
    value.children.every(
      (child) =>
        isObject(child) &&
        onlyKeys(child, ["title", "summary", "href", "role", "order"]) &&
        typeof child.title === "string" &&
        child.title.length <= 240 &&
        typeof child.summary === "string" &&
        child.summary.length <= 2000 &&
        typeof child.href === "string" &&
        /^#\/entities\/[a-z0-9-]+$/.test(child.href) &&
        isStringUnion(child.role, TRIP_CHILD_ROLES) &&
        typeof child.order === "number" &&
        Number.isInteger(child.order) &&
        child.order >= 0,
    ) &&
    !orderedChildrenError(value.children)
  );
}

function isFlightModel(value: unknown): value is FlightViewModel {
  return (
    isObject(value) &&
    onlyKeys(value, ["title", "summary", "href", "body", "status", "legs"]) &&
    isTravelHeader(value) &&
    isStringUnion(value.status, ["scheduled", "delayed", "cancelled", "completed"]) &&
    isFlightLegs(value.legs)
  );
}

function isViewModels(value: unknown): value is ViewModels {
  if (
    !isObject(value) ||
    !onlyKeys(value, VIEW_TYPES) ||
    (value.label !== undefined && !isLabelModel(value.label)) ||
    (value.tile !== undefined && !isTileModel(value.tile)) ||
    (value.card !== undefined && !isCardModel(value.card)) ||
    (value.full !== undefined && !isFullModel(value.full)) ||
    (value.event !== undefined && !isEventModel(value.event)) ||
    (value.trip !== undefined && !isTripModel(value.trip)) ||
    (value.flight !== undefined && !isFlightModel(value.flight)) ||
    (value["calendar-month"] !== undefined && !isCalendarModel(value["calendar-month"])) ||
    (value["calendar-day"] !== undefined && !isCalendarModel(value["calendar-day"])) ||
    (value.timeline !== undefined && !isCalendarModel(value.timeline))
  ) {
    return false;
  }

  function isCalendarEvent(value: unknown, withBody = false): value is CalendarEvent {
    return (
      isObject(value) &&
      onlyKeys(value, [
        "title",
        "summary",
        "href",
        "kind",
        "status",
        "schedule",
        "location",
        ...(withBody ? ["body"] : []),
      ]) &&
      typeof value.title === "string" &&
      value.title.length <= 240 &&
      typeof value.summary === "string" &&
      value.summary.length <= 2000 &&
      typeof value.href === "string" &&
      /^#\/entities\/[a-z0-9-]+$/.test(value.href) &&
      isStringUnion(value.kind, ["event", "appointment", "deadline", "reminder"]) &&
      isStringUnion(value.status, ["confirmed", "tentative", "cancelled"]) &&
      isEventSchedule(value.schedule) &&
      (value.location === undefined ||
        (typeof value.location === "string" && value.location.length <= 500))
    );
  }

  function isEventModel(value: unknown): value is EventViewModel {
    return (
      isObject(value) &&
      isCalendarEvent(value, true) &&
      typeof value.body === "string" &&
      value.body.length <= 262144
    );
  }

  function isCalendarModel(value: unknown): value is CalendarMonthViewModel {
    return (
      isObject(value) &&
      onlyKeys(value, ["title", "date", "timeZone", "events"]) &&
      typeof value.title === "string" &&
      value.title.length <= 240 &&
      isCalendarDate(value.date) &&
      isTimeZone(value.timeZone) &&
      Array.isArray(value.events) &&
      value.events.every((event) => isCalendarEvent(event))
    );
  }
  return true;
}

function isTopic(value: unknown): value is TopicView {
  return (
    isObject(value) &&
    onlyKeys(value, ["id", "title", "description", "order", "parentId"]) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    typeof value.order === "number" &&
    (value.parentId === undefined || typeof value.parentId === "string")
  );
}

function isSearchDocument(value: unknown): value is SearchDocument {
  return (
    isObject(value) &&
    onlyKeys(value, ["id", "title", "summary", "body", "tags", "primaryTopicId", "route"]) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.summary === "string" &&
    typeof value.body === "string" &&
    isStringArray(value.tags) &&
    typeof value.primaryTopicId === "string" &&
    isHashRoute(value.route)
  );
}

function isEntity(value: unknown): value is SiteEntity {
  if (
    !isObject(value) ||
    !onlyKeys(value, [
      "id",
      "dataType",
      "dataVersion",
      "lifecycle",
      "title",
      "summary",
      "route",
      "primaryTopicId",
      "tags",
      "relationships",
      "citations",
      "lastVerifiedAt",
      "view",
      "viewModels",
    ]) ||
    typeof value.id !== "string" ||
    typeof value.dataType !== "string" ||
    typeof value.dataVersion !== "number" ||
    (value.lifecycle !== undefined &&
      !isStringUnion(value.lifecycle, ["draft", "active", "archived"] as const)) ||
    typeof value.title !== "string" ||
    typeof value.summary !== "string" ||
    !isHashRoute(value.route) ||
    typeof value.primaryTopicId !== "string" ||
    !isStringArray(value.tags) ||
    (value.lastVerifiedAt !== undefined && typeof value.lastVerifiedAt !== "string") ||
    !isViewModels(value.viewModels)
  ) {
    return false;
  }
  const view = value.view;
  if (
    !isObject(view) ||
    !onlyKeys(view, ["defaultType", "byContext"]) ||
    !isStringUnion(view.defaultType, VIEW_TYPES) ||
    !isObject(view.byContext)
  ) {
    return false;
  }
  const byContext = view.byContext;
  if (
    !Array.isArray(value.relationships) ||
    !value.relationships.every(
      (relationship) =>
        isObject(relationship) &&
        onlyKeys(relationship, ["kind", "targetId", "viewType"]) &&
        isStringUnion(relationship.kind, ["related-to", "depends-on", "supersedes"] as const) &&
        typeof relationship.targetId === "string" &&
        isStringUnion(relationship.viewType, VIEW_TYPES),
    ) ||
    !Array.isArray(value.citations) ||
    !value.citations.every(
      (citation) =>
        isObject(citation) &&
        onlyKeys(citation, ["title", "url"]) &&
        typeof citation.title === "string" &&
        isHttpUrl(citation.url),
    ) ||
    !onlyKeys(byContext, RENDER_CONTEXTS) ||
    !RENDER_CONTEXTS.every((context) => isStringUnion(byContext[context], VIEW_TYPES))
  ) {
    return false;
  }
  return true;
}

export function parseSiteManifest(value: unknown): SiteManifest {
  if (
    !isObject(value) ||
    !onlyKeys(value, [
      "schemaVersion",
      "audience",
      "basePath",
      "contentDigest",
      "deployable",
      "taxonomy",
      "entities",
      "searchDocuments",
    ]) ||
    value.schemaVersion !== 1 ||
    !isStringUnion(value.audience, AUDIENCES) ||
    !isBasePath(value.basePath) ||
    typeof value.contentDigest !== "string" ||
    typeof value.deployable !== "boolean" ||
    !Array.isArray(value.taxonomy) ||
    !value.taxonomy.every(isTopic) ||
    !Array.isArray(value.entities) ||
    !value.entities.every(isEntity) ||
    !Array.isArray(value.searchDocuments) ||
    !value.searchDocuments.every(isSearchDocument)
  ) {
    throw new Error("manifest.json is not a valid browser-safe SiteManifest");
  }
  if (value.audience === "local" && value.deployable) {
    throw new Error("A local SiteManifest must be explicitly non-deployable");
  }
  return {
    schemaVersion: value.schemaVersion,
    audience: value.audience,
    basePath: value.basePath,
    contentDigest: value.contentDigest,
    deployable: value.deployable,
    taxonomy: value.taxonomy,
    entities: value.entities,
    searchDocuments: value.searchDocuments,
  };
}
