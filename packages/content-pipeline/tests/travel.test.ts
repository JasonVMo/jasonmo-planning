import { afterEach, describe, expect, it } from "vitest";
import type {
  Entity,
  FlightData,
  ReservationData,
  TripData,
  ViewType,
} from "@planning/entity-model";
import { serializeCanonical } from "../src/canonical.ts";
import { assertSchema } from "../src/schema.ts";
import { loadCorpus } from "../src/validate.ts";
import { projectCorpus, compileContent } from "../src/project.ts";
import { projectTravel, validateTripComposition } from "../src/travel.ts";
import { adaptView, supportedViews, type Presentation } from "../src/view-adapters.ts";
import { cleanup, editEntity, fixture, ENTITY_ID, ENTITY_PATH, CANARY } from "./fixtures.ts";
import { parseSiteManifest } from "../../../apps/site/src/manifest.ts";

afterEach(cleanup);

const trip: TripData = {
  bodyPath: "body.md",
  kind: "trip",
  status: "planned",
  startDate: "2026-10-01",
  endDate: "2026-10-03",
  destination: "Example Coast",
  timeZone: "America/Los_Angeles",
  children: [],
};
const flight: FlightData = {
  bodyPath: "body.md",
  status: "scheduled",
  legs: [
    {
      carrier: "Example Air",
      flightNumber: "EX 101",
      origin: "SEA",
      destination: "BOS",
      departAt: "2026-10-01T08:00:00-07:00",
      departureTimeZone: "America/Los_Angeles",
      arriveAt: "2026-10-01T16:15:00-04:00",
      arrivalTimeZone: "America/New_York",
    },
  ],
};
const reservation: ReservationData = {
  bodyPath: "body.md",
  kind: "lodging",
  status: "needs-booking",
  provider: "Example Lodge",
  schedule: { allDay: true, startDate: "2026-10-01", endDate: "2026-10-04" },
  location: "Example public visitor area",
  bookingUrl: "https://example.com/lodge",
};

async function travelFixture(dataType: "trip" | "flight" | "reservation", data: Entity["data"]) {
  const root = await fixture();
  await editEntity(root, (entity) => {
    entity.dataType = dataType;
    entity.data = structuredClone(data);
    entity.view = { permittedTypes: supportedViews(dataType) as [ViewType, ...ViewType[]] };
  });
  return root;
}

describe("strict travel contracts", () => {
  it.each([
    ["trip", trip],
    ["flight", flight],
    ["reservation", reservation],
  ] as const)(
    "loads %s and preserves confined Markdown bodies and deterministic compilation",
    async (type, data) => {
      const root = await travelFixture(type, data);
      const first = await compileContent(root, { target: "local", basePath: "/" });
      expect(parseSiteManifest(first)).toEqual(first);
      expect(
        serializeCanonical(await compileContent(root, { target: "local", basePath: "/" })),
      ).toBe(serializeCanonical(first));
      expect(first.deployable).toBe(false);
      expect(first.entities.find((entity) => entity.id === ENTITY_ID)!.view.byContext.detail).toBe(
        type === "reservation" ? "event" : type,
      );
      await editEntity(root, (entity) => {
        entity.data.bodyPath = "../outside.md";
      });
      await expect(loadCorpus(root)).rejects.toThrow();
    },
  );
  it.each([
    ["TripData", trip],
    ["FlightData", flight],
    ["ReservationData", reservation],
  ] as const)("rejects unknown sensitive fields and missing body for %s", (schema, data) => {
    for (const field of ["confirmationCode", "bookingLocator", "loyaltyNumber", "privateAddress"]) {
      expect(() => assertSchema(schema, { ...data, [field]: CANARY }, "travel")).toThrow(
        "additional",
      );
    }
    const incomplete = { ...data } as Record<string, unknown>;
    delete incomplete.bodyPath;
    expect(() => assertSchema(schema, incomplete, "travel")).toThrow("bodyPath");
  });
  it("validates travel ranges, text, statuses, URLs and nested legs", () => {
    expect(() => assertSchema("TripData", { ...trip, endDate: "2026-09-30" }, "trip")).toThrow(
      "/endDate",
    );
    expect(() =>
      assertSchema("TripData", { ...trip, destination: "<script>bad</script>" }, "trip"),
    ).toThrow("/destination");
    expect(() => assertSchema("TripData", { ...trip, timeZone: "+01:00" }, "trip")).toThrow(
      "/timeZone",
    );
    expect(() => assertSchema("FlightData", { ...flight, legs: [] }, "flight")).toThrow("legs");
    expect(() =>
      assertSchema("FlightData", { ...flight, legs: [flight.legs[0], flight.legs[0]] }, "flight"),
    ).toThrow("/1/departAt");
    expect(() =>
      assertSchema(
        "FlightData",
        { ...flight, legs: [{ ...flight.legs[0], arriveAt: flight.legs[0].departAt }] },
        "flight",
      ),
    ).toThrow("/0/arriveAt");
    expect(() =>
      assertSchema(
        "ReservationData",
        { ...reservation, bookingUrl: "javascript:alert(1)" },
        "reservation",
      ),
    ).toThrow("bookingUrl");
    expect(() =>
      assertSchema("ReservationData", { ...reservation, status: "scheduled" }, "reservation"),
    ).toThrow("status");
    expect(() =>
      assertSchema(
        "ReservationData",
        { ...reservation, schedule: { ...reservation.schedule, endDate: "2026-10-01" } },
        "reservation",
      ),
    ).toThrow("endDate");
  });
  it("rejects mismatched envelopes", async () => {
    const corpus = await loadCorpus(await travelFixture("trip", trip));
    const entity = corpus.entities.find((item) => item.entity.id === ENTITY_ID)!.entity;
    for (const dataType of ["markdown", "event", "flight", "reservation"])
      expect(() => assertSchema("Entity", { ...entity, dataType }, ENTITY_PATH)).toThrow();
  });
  it("checks composition and credential-free reservation links during corpus loading", async () => {
    const root = await travelFixture("trip", {
      ...trip,
      children: [{ targetId: "missing-target", role: "flight", order: 0 }],
    });
    await expect(loadCorpus(root)).rejects.toThrow("missing trip child");
    const reservationRoot = await travelFixture("reservation", {
      ...reservation,
      bookingUrl: "https://synthetic-user@example.com/lodge",
    });
    await expect(loadCorpus(reservationRoot)).rejects.toThrow("/data/bookingUrl");
  });
});

describe("trip composition and audience closure", () => {
  async function composition() {
    const corpus = await loadCorpus(await travelFixture("trip", trip));
    const root = corpus.entities.find((item) => item.entity.id === ENTITY_ID)!;
    const segment = corpus.entities.find((item) => item.entity.id !== ENTITY_ID)!;
    segment.entity.dataType = "trip";
    segment.entity.data = { ...trip, kind: "segment", children: [] };
    segment.entity.view = { permittedTypes: ["label", "tile", "trip", "event"] };
    (root.entity.data as TripData).children = [
      { targetId: segment.entity.id, role: "segment", order: 2 },
    ];
    return { corpus, root, segment };
  }
  it("permits rooted segments but rejects dangling children, role mismatch, duplicate order and roots as children", async () => {
    const { corpus, root, segment } = await composition();
    expect(() => validateTripComposition(corpus.entities)).not.toThrow();
    const rootData = root.entity.data as TripData;
    rootData.children.push({ targetId: "missing", role: "flight", order: 3 });
    expect(() => validateTripComposition(corpus.entities)).toThrow("missing trip child");
    rootData.children.pop();
    rootData.children.push({ targetId: "missing", role: "flight", order: 2 });
    expect(() => validateTripComposition(corpus.entities)).toThrow("order");
    rootData.children.pop();
    rootData.children[0]!.role = "flight";
    expect(() => validateTripComposition(corpus.entities)).toThrow("role");
    rootData.children[0]!.role = "segment";
    (segment.entity.data as TripData).children = [
      { targetId: root.entity.id, role: "segment", order: 0 },
    ];
    expect(() => validateTripComposition(corpus.entities)).toThrow("root trip");
  });
  it("rejects unowned, multiply-owned, and cyclic segments", async () => {
    const { corpus, root, segment } = await composition();
    (root.entity.data as TripData).children = [];
    expect(() => validateTripComposition(corpus.entities)).toThrow("exactly one trip root");
    (root.entity.data as TripData).children = [
      { targetId: segment.entity.id, role: "segment", order: 0 },
    ];
    const secondRoot = structuredClone(root);
    secondRoot.entity.id = "synthetic-second-root";
    expect(() => validateTripComposition([...corpus.entities, secondRoot])).toThrow(
      "exactly one trip root",
    );
    (segment.entity.data as TripData).children = [
      { targetId: segment.entity.id, role: "segment", order: 0 },
    ];
    expect(() => validateTripComposition(corpus.entities)).toThrow("acyclic");
  });
  it("projects sorted allowlisted children without changing canonical order", async () => {
    const { corpus, root, segment } = await composition();
    const research = structuredClone(segment);
    research.entity.id = "synthetic-research";
    research.entity.dataType = "markdown";
    research.entity.data = { bodyPath: "body.md" };
    research.entity.view = { permittedTypes: ["label", "tile", "full"] };
    corpus.entities.push(research);
    const data = root.entity.data as TripData;
    data.children.push({ targetId: research.entity.id, role: "things-to-do", order: 1 });
    Object.assign(data.children[1]!, { bookingLocator: CANARY });
    validateTripComposition(corpus.entities);
    const result = projectCorpus(corpus, { target: "local", basePath: "/" });
    const children = result.entities.find((entity) => entity.id === root.entity.id)!.viewModels
      .trip!.children;
    expect(children.map((child) => child.order)).toEqual([1, 2]);
    expect(data.children.map((child) => child.order)).toEqual([2, 1]);
    expect(JSON.stringify(children)).not.toContain(CANARY);
    expect(children[0]).not.toHaveProperty("targetId");
  });
  it("filters hidden child labels, nested metadata, and visible segments under hidden roots", async () => {
    const { corpus, root, segment } = await composition();
    for (const node of corpus.taxonomy.nodes) {
      node.sensitivity = { classification: "public", containsPersonalData: false };
      node.publication = { eligibility: "public", requestedTargets: ["public"] };
    }
    root.entity.sensitivity = { classification: "public", containsPersonalData: false };
    root.entity.publication = { eligibility: "public", requestedTargets: ["public"] };
    segment.entity.title = CANARY;
    Object.assign(root.entity.data, { bookingLocator: CANARY });
    const options = { target: "public" as const, basePath: "/" };
    const manifest = projectCorpus(corpus, options, false);
    expect(serializeCanonical(manifest)).not.toContain(CANARY);
    expect(manifest.entities[0]!.viewModels.trip!.children).toEqual([]);
    segment.entity.sensitivity = root.entity.sensitivity;
    segment.entity.publication = root.entity.publication;
    const visible = projectCorpus(corpus, options, false);
    expect(
      visible.entities.find((entity) => entity.id === root.entity.id)!.viewModels.trip!.children,
    ).toEqual([
      {
        title: CANARY,
        summary: segment.entity.summary,
        href: `#/entities/${segment.entity.id}`,
        role: "segment",
        order: 2,
      },
    ]);
    root.entity.publication = { eligibility: "local", requestedTargets: [] };
    expect(projectCorpus(corpus, options, false).entities).toHaveLength(0);
  });
});

describe("travel calendar projections and browser guards", () => {
  it("validates every travel adapter and keeps extra canonical flight fields out", async () => {
    for (const [type, data] of [
      ["trip", trip],
      ["flight", flight],
      ["reservation", reservation],
    ] as const) {
      const corpus = await loadCorpus(await travelFixture(type, data));
      const entity = corpus.entities.find((item) => item.entity.id === ENTITY_ID)!.entity;
      if ("legs" in entity.data) Object.assign(entity.data.legs[0], { bookingLocator: CANARY });
      const presentation: Presentation = {
        title: entity.title,
        summary: entity.summary,
        href: `#/entities/${entity.id}`,
        body: "Safe synthetic Markdown",
        badges: [],
      };
      projectTravel(
        entity,
        new Map(corpus.entities.map((item) => [item.entity.id, item])),
        presentation,
      );
      for (const view of supportedViews(type)) {
        const model = adaptView(type, view, presentation);
        expect(model.title).toBe(entity.title);
        expect(JSON.stringify(model)).not.toContain(CANARY);
      }
    }
  });
  it("spans connecting flights from first departure to final arrival and preserves cancelled status", async () => {
    const data: FlightData = {
      ...flight,
      status: "cancelled",
      legs: [
        flight.legs[0],
        {
          ...flight.legs[0],
          origin: "BOS",
          destination: "LHR",
          departAt: "2026-10-01T20:00:00-04:00",
          departureTimeZone: "America/New_York",
          arriveAt: "2026-10-02T08:00:00+01:00",
          arrivalTimeZone: "Europe/London",
        },
      ],
    };
    const result = await compileContent(await travelFixture("flight", data), {
      target: "local",
      basePath: "/",
    });
    const models = result.entities.find((entity) => entity.id === ENTITY_ID)!.viewModels;
    expect(models.flight!.legs).toEqual(data.legs);
    expect(models.event).toMatchObject({
      status: "cancelled",
      schedule: {
        allDay: false,
        startAt: data.legs[0].departAt,
        endAt: data.legs[1]!.arriveAt,
        timeZone: data.legs[0].departureTimeZone,
      },
    });
  });
  it.each([
    ["trip", trip, "tentative", { allDay: true, startDate: trip.startDate, endDate: "2026-10-04" }],
    [
      "flight",
      flight,
      "confirmed",
      {
        allDay: false,
        startAt: flight.legs[0].departAt,
        endAt: flight.legs[0].arriveAt,
        timeZone: flight.legs[0].departureTimeZone,
      },
    ],
    ["reservation", reservation, "tentative", reservation.schedule],
  ] as const)(
    "projects %s to safe generic event and body-free calendars",
    async (type, data, status, schedule) => {
      const root = await travelFixture(type, data);
      await editEntity(root, (entity) => {
        entity.view.contextOverrides = {
          collection: "calendar-month",
          detail: "calendar-day",
          navigation: "timeline",
        };
      });
      const manifest = await compileContent(root, { target: "local", basePath: "/" });
      const models = manifest.entities.find((entity) => entity.id === ENTITY_ID)!.viewModels;
      expect(models.event).toMatchObject({ status, schedule });
      expect(models.event!.kind).toBe(type === "reservation" ? "appointment" : "event");
      for (const view of ["calendar-month", "calendar-day", "timeline"] as const) {
        expect(models[view]!.events[0]!.schedule).toEqual(schedule);
        expect(models[view]!.events[0]).not.toHaveProperty("body");
        expect(models[view]!.events[0]).not.toHaveProperty("bookingUrl");
      }
    },
  );
  it("strictly rejects private and malformed browser models", async () => {
    for (const [type, data] of [
      ["trip", trip],
      ["flight", flight],
    ] as const) {
      const manifest = await compileContent(await travelFixture(type, data), {
        target: "local",
        basePath: "/",
      });
      const model = manifest.entities.find((entity) => entity.id === ENTITY_ID)!.viewModels[type]!;
      expect(() => parseSiteManifest(manifest)).not.toThrow();
      Object.assign(model, { bookingLocator: CANARY });
      expect(() => parseSiteManifest(manifest)).toThrow("browser-safe");
      delete (model as unknown as Record<string, unknown>).bookingLocator;
      if ("children" in model) {
        model.children = [
          { title: "bad", summary: "bad", href: "https://example.com", role: "segment", order: 0 },
        ];
      } else {
        model.legs[0].arriveAt = model.legs[0].departAt;
      }
      expect(() => parseSiteManifest(manifest)).toThrow("browser-safe");
    }
  });
});
