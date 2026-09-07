import { afterEach, describe, expect, it } from "vitest";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { stringify } from "yaml";
import type {
  Entity,
  EventData,
  EventSchedule,
  PublicationApproval,
  Taxonomy,
} from "@tracker/entity-model";
import { isEventSchedule, RENDER_CONTEXTS, VIEW_TYPES } from "@tracker/entity-model";
import { serializeCanonical } from "../src/canonical.ts";
import { approvalDigests, compileContent, projectCorpus } from "../src/project.ts";
import { reconcileContent } from "../src/reconcile.ts";
import { assertSchema } from "../src/schema.ts";
import { loadCorpus, validateContent } from "../src/validate.ts";
import { adaptView, supportedViews, type Presentation } from "../src/view-adapters.ts";
import { resolveView } from "../src/view-selection.ts";
import {
  BODY_PATH,
  CANARY,
  cleanup,
  editEntity,
  ENTITY_ID,
  ENTITY_PATH,
  fixture,
  proposal,
  read,
  write,
} from "./fixtures.ts";

afterEach(cleanup);

const allDay: EventSchedule = {
  allDay: true,
  startDate: "2026-09-07",
  endDate: "2026-09-08",
};
const timed: EventSchedule = {
  allDay: false,
  startAt: "2026-09-08T01:30:00Z",
  endAt: "2026-09-08T03:00:00Z",
  timeZone: "America/Los_Angeles",
};
const data: EventData = {
  bodyPath: "body.md",
  kind: "appointment",
  status: "confirmed",
  schedule: allDay,
  location: "Synthetic room",
};
const input: Presentation = {
  title: "Synthetic appointment",
  summary: "Calendar contract fixture",
  href: "#/entities/synthetic-event",
  body: "# Safe body\n",
  badges: ["fixture"],
  event: {
    kind: data.kind,
    status: data.status,
    schedule: allDay,
    location: data.location!,
  },
};

async function eventFixture(): Promise<string> {
  const root = await fixture();
  await editEntity(root, (entity) => {
    entity.dataType = "event";
    entity.data = structuredClone(data);
    entity.view = { permittedTypes: [...VIEW_TYPES] };
  });
  return root;
}

describe("strict event schedules and data schemas", () => {
  it.each([
    allDay,
    timed,
    { allDay: true, startDate: "2000-02-29", endDate: "2000-03-01" },
    { allDay: true, startDate: "2024-02-29", endDate: "2024-03-01" },
    { allDay: true, startDate: "0100-01-01", endDate: "0100-01-02" },
    { allDay: true, startDate: "9998-12-30", endDate: "9998-12-31" },
    {
      allDay: false,
      startAt: "2026-09-07T23:30:00-07:00",
      endAt: "2026-09-08T00:00:00-07:00",
      timeZone: "America/Los_Angeles",
    },
    {
      allDay: false,
      startAt: "2026-11-01T01:30:00-07:00",
      endAt: "2026-11-01T01:30:00-08:00",
      timeZone: "America/Los_Angeles",
    },
    {
      allDay: false,
      startAt: "2026-09-07T12:00:00.0001Z",
      endAt: "2026-09-07T12:00:00.0002Z",
      timeZone: "UTC",
    },
  ])("accepts valid dates, midnight, exclusive ranges and offset instants: %j", (schedule) => {
    expect(() => assertSchema("EventSchedule", schedule, "event")).not.toThrow();
    expect(isEventSchedule(schedule)).toBe(true);
  });

  it.each([
    "2026-02-30",
    "2026-02-29",
    "1900-02-29",
    "2024-04-31",
    "2026-00-01",
    "2026-13-01",
    "2026-01-00",
    "2026-1-01",
    "2026-09-07T00:00:00Z",
    "2026-09-07\n",
    "0099-12-31",
    "9999-01-01",
    "0000-01-01",
  ])("rejects impossible or non-date-only values %s with a field diagnostic", (startDate) => {
    expect(() =>
      assertSchema("EventData", { ...data, schedule: { ...allDay, startDate } }, "event.yaml"),
    ).toThrow("/schedule/startDate");
  });

  it.each([
    "2026-02-30T12:00:00Z",
    "2026-09-07T12:00:00",
    "2026-09-07T24:00:00Z",
    "2026-09-07T12:60:00Z",
    "2026-09-07T12:00:60Z",
    "2026-09-07T12:00:00+24:00",
    "2026-09-07T12:00:00+01:60",
    "2026-09-07T12:00:00Z\n",
    "0099-09-07T12:00:00Z",
    "9999-09-07T12:00:00Z",
  ])("rejects invalid or offset-free event timestamps %s", (startAt) => {
    expect(() => assertSchema("EventSchedule", { ...timed, startAt }, "event")).toThrow("/startAt");
  });

  it.each(["", "+01:00", "-07:00", "Mars/Olympus", " America/Los_Angeles", "UTC\n"])(
    "rejects non-IANA time zones %s",
    (timeZone) => {
      expect(() => assertSchema("EventSchedule", { ...timed, timeZone }, "event")).toThrow(
        "/timeZone",
      );
    },
  );

  it.each([
    [{ ...allDay, endDate: "2026-09-07" }, "/endDate"],
    [{ ...allDay, endDate: "2026-09-06" }, "/endDate"],
    [{ ...timed, endAt: "2026-09-07T18:30:00-07:00" }, "/endAt"],
    [{ ...timed, endAt: "2026-09-08T01:29:59Z" }, "/endAt"],
    [
      {
        ...timed,
        startAt: "2026-09-07T12:00:00.0002Z",
        endAt: "2026-09-07T12:00:00.0001Z",
      },
      "/endAt",
    ],
  ])("rejects empty/reversed ranges independently of format checks %j", (schedule, field) => {
    expect(() => assertSchema("EventSchedule", schedule, "event.yaml")).toThrow(field as string);
    expect(() => assertSchema("EventData", { ...data, schedule }, "event.yaml")).toThrow(
      `/schedule${field}`,
    );
    expect(isEventSchedule(schedule)).toBe(false);
  });

  it("keeps timed endpoints within the supported years in their declared zone", () => {
    const schedule = {
      allDay: false,
      startAt: "0100-01-01T00:00:00Z",
      endAt: "0100-01-01T01:00:00Z",
      timeZone: "Etc/GMT+1",
    };
    expect(() => assertSchema("EventSchedule", schedule, "event")).toThrow("/startAt");
    expect(() =>
      assertSchema("EventSchedule", { ...schedule, timeZone: "UTC" }, "event"),
    ).not.toThrow();
  });

  it.each([
    { ...allDay, startAt: timed.startAt },
    { ...allDay, timeZone: "UTC" },
    { ...timed, endDate: allDay.endDate },
    { allDay: false, startAt: timed.startAt, endAt: timed.endAt },
  ])("does not mix date-only and timed schedules %j", (schedule) => {
    expect(() => assertSchema("EventSchedule", schedule, "event")).toThrow();
    expect(isEventSchedule(schedule)).toBe(false);
  });

  it("rejects event/markdown payload mismatches without changing version-1 Markdown", async () => {
    const root = await fixture();
    const entity = await read<Entity>(root, ENTITY_PATH);
    expect(() => assertSchema("Entity", entity, ENTITY_PATH)).not.toThrow();
    expect(() => assertSchema("Entity", { ...entity, data }, ENTITY_PATH)).toThrow();
    expect(() => assertSchema("Entity", { ...entity, dataType: "event" }, ENTITY_PATH)).toThrow();
    expect(() =>
      assertSchema("Entity", { ...entity, dataType: "event", data }, ENTITY_PATH),
    ).not.toThrow();
    for (const field of ["bodyPath", "kind", "status", "schedule"]) {
      const incomplete = { ...data } as Record<string, unknown>;
      delete incomplete[field];
      expect(() => assertSchema("EventData", incomplete, ENTITY_PATH)).toThrow();
    }
    for (const extra of [{ recurrence: "daily" }, { attendees: ["synthetic"] }])
      expect(() => assertSchema("EventData", { ...data, ...extra }, ENTITY_PATH)).toThrow(
        "additional",
      );
    for (const location of ["<b>HTML</b>", "x".repeat(501), "control\u0001"])
      expect(() => assertSchema("EventData", { ...data, location }, ENTITY_PATH)).toThrow(
        "/location",
      );
  });
});

describe("calendar adapters and context selection", () => {
  it("validates every registered pair and preserves generic Markdown adapters", () => {
    expect(supportedViews("event")).toEqual(VIEW_TYPES);
    expect(supportedViews("markdown")).toEqual(["label", "tile", "card", "full"]);
    for (const view of VIEW_TYPES) expect(adaptView("event", view, input).title).toBe(input.title);
    for (const view of ["label", "tile", "card", "full"] as const)
      expect(adaptView("event", view, input)).toEqual(adaptView("markdown", view, input));
    expect(adaptView("event", "event", input).body).toBe(input.body);
    expect(() => adaptView("markdown", "event", input)).toThrow("No registered adapter");
    const withoutEvent = { ...input };
    delete withoutEvent.event;
    expect(() => adaptView("event", "event", withoutEvent)).toThrow("audience-safe event");
  });

  it.each(["calendar-month", "calendar-day", "timeline"] as const)(
    "%s is a body-free singleton anchored to the schedule's own calendar day",
    (view) => {
      const result = adaptView("event", view, input);
      expect(result).toMatchObject({ date: "2026-09-07", timeZone: "UTC" });
      expect(result.events).toHaveLength(1);
      expect(result.events[0]).not.toHaveProperty("body");
      expect(result.events[0]).not.toHaveProperty("bodyPath");
      expect(result.events[0]!.schedule).toEqual(allDay);
      expect(result.events[0]!.schedule).not.toBe(allDay);
      expect(
        adaptView("event", view, { ...input, event: { ...input.event!, schedule: timed } }),
      ).toMatchObject({ date: "2026-09-07", timeZone: "America/Los_Angeles" });
      expect(() =>
        assertSchema(
          view === "calendar-month"
            ? "CalendarMonthViewModel"
            : view === "calendar-day"
              ? "CalendarDayViewModel"
              : "TimelineViewModel",
          { ...result, events: [{ ...result.events[0], body: "forbidden" }] },
          "view",
        ),
      ).toThrow("additional");
    },
  );

  it("defaults event details/collections without weakening explicit resolution", () => {
    const entity: Pick<Entity, "id" | "dataType" | "view"> = {
      id: "synthetic-event",
      dataType: "event",
      view: { permittedTypes: [...VIEW_TYPES] },
    };
    expect(resolveView(entity, "detail")).toBe("event");
    expect(resolveView(entity, "collection")).toBe("event");
    expect(resolveView(entity, "navigation")).toBe("label");
    expect(resolveView(entity, "detail", "calendar-day")).toBe("calendar-day");
    entity.view.defaultType = "card";
    expect(resolveView(entity, "detail")).toBe("card");
    entity.view.contextOverrides = { detail: "full" };
    expect(resolveView(entity, "detail")).toBe("full");
    expect(resolveView(entity, "detail", "event")).toBe("event");
    for (const [view, contexts] of [
      ["event", ["navigation", "search"]],
      ["calendar-month", ["navigation", "search", "relationship"]],
      ["calendar-day", ["navigation", "search", "relationship"]],
      ["timeline", ["search", "relationship"]],
    ] as const)
      for (const context of contexts)
        expect(() => resolveView(entity, context, view)).toThrow("explicit");
    entity.view.permittedTypes = ["label", "card", "full"];
    expect(() => resolveView(entity, "detail", "event")).toThrow("explicit");
    delete entity.view.contextOverrides;
    delete entity.view.defaultType;
    expect(resolveView(entity, "detail")).toBe("full");
    expect(resolveView(entity, "collection")).toBe("card");
  });
});

describe("event loading, reconciliation and audience-safe projection", () => {
  it("loads event bodies through existing confined Markdown checks and compiles deterministically", async () => {
    const root = await eventFixture();
    await expect(validateContent(root)).resolves.toBeUndefined();
    const before = await readFile(join(root, ENTITY_PATH));
    const first = await compileContent(root, { target: "local", basePath: "/tracker" });
    expect(
      serializeCanonical(await compileContent(root, { target: "local", basePath: "/tracker/" })),
    ).toBe(serializeCanonical(first));
    const event = first.entities.find((entity) => entity.id === ENTITY_ID)!;
    expect(event.view.byContext.detail).toBe("event");
    expect(event.view.byContext.collection).toBe("event");
    expect(event.viewModels.event?.schedule).toEqual(allDay);
    expect(event.viewModels.event?.body).not.toContain("AGENT-MANAGED");
    expect(event.viewModels.full).toBeUndefined();
    expect(first.deployable).toBe(false);
    expect(await readFile(join(root, ENTITY_PATH))).toEqual(before);
    await editEntity(root, (entity) => {
      entity.data.bodyPath = "missing.md";
    });
    await expect(validateContent(root)).rejects.toThrow("ENOENT");
    await editEntity(root, (entity) => {
      entity.data.bodyPath = "../outside.md";
    });
    await expect(validateContent(root)).rejects.toThrow();
  });

  it("reports semantic schedule fields during loading and isolated reconciliation", async () => {
    const root = await eventFixture();
    const entity = await read<Entity>(root, ENTITY_PATH);
    (entity.data as EventData).schedule = { ...allDay, endDate: allDay.startDate };
    const before = await readFile(join(root, ENTITY_PATH));
    const path = await proposal(root, { [ENTITY_PATH]: stringify(entity) });
    await expect(reconcileContent(root, path, { apply: true })).rejects.toThrow(
      "/data/schedule/endDate",
    );
    expect(await readFile(join(root, ENTITY_PATH))).toEqual(before);
    await write(root, ENTITY_PATH, entity);
    await expect(validateContent(root)).rejects.toThrow("/data/schedule/endDate");
  });

  it("uses event permission for Calendar reachability, never calendar permission alone", async () => {
    const root = await eventFixture();
    await editEntity(root, (entity) => {
      entity.view = { defaultType: "label", permittedTypes: ["label", "tile", "event"] };
    });
    const permitted = await compileContent(root, { target: "local", basePath: "/" });
    expect(
      permitted.entities.find((entity) => entity.id === ENTITY_ID)!.viewModels.event,
    ).toBeDefined();
    await editEntity(root, (entity) => {
      entity.view.permittedTypes = ["label", "tile", "calendar-day"];
      entity.view.contextOverrides = { detail: "calendar-day" };
    });
    const restricted = await compileContent(root, { target: "local", basePath: "/" });
    const models = restricted.entities.find((entity) => entity.id === ENTITY_ID)!.viewModels;
    expect(models.event).toBeUndefined();
    expect(models.full).toBeUndefined();
    expect(models["calendar-day"]!.events[0]).not.toHaveProperty("body");
    await editEntity(root, (entity) => {
      entity.view = { defaultType: "label", permittedTypes: ["label", "tile"] };
    });
    const labelOnly = await compileContent(root, { target: "local", basePath: "/" });
    expect(
      labelOnly.entities.find((entity) => entity.id === ENTITY_ID)!.viewModels,
    ).not.toHaveProperty("event");
  });

  it("projects each explicit calendar context and rejects incompatible occurrences", async () => {
    const root = await eventFixture();
    await editEntity(root, (entity) => {
      entity.view.contextOverrides = {
        navigation: "timeline",
        collection: "calendar-month",
        detail: "calendar-day",
        relationship: "event",
        search: "label",
      };
    });
    const manifest = await compileContent(root, { target: "local", basePath: "/" });
    const event = manifest.entities.find((entity) => entity.id === ENTITY_ID)!;
    for (const context of RENDER_CONTEXTS)
      expect(event.viewModels[event.view.byContext[context]]).toBeDefined();
    expect(event.viewModels.event).toBeDefined();
    await editEntity(root, (entity) => {
      entity.view.contextOverrides!.search = "timeline";
    });
    await expect(validateContent(root)).rejects.toThrow("/view/search");
  });

  it("filters hidden schedules, locations and reference labels before every public event projection", async () => {
    const root = await eventFixture();
    await editEntity(root, (entity) => {
      entity.sensitivity = { classification: "public", containsPersonalData: false };
      entity.publication = { eligibility: "public", requestedTargets: ["public", "private-group"] };
      entity.view.contextOverrides = {
        navigation: "timeline",
        collection: "calendar-month",
        detail: "calendar-day",
      };
    });
    const hiddenId = "tracker-data-view-architecture";
    const hiddenPath = `content/entities/${hiddenId}/entity.yaml`;
    const hidden = await read<Entity>(root, hiddenPath);
    hidden.dataType = "event";
    hidden.data = {
      ...data,
      schedule: { ...timed, startAt: "2088-03-14T12:34:00Z", endAt: "2088-03-14T13:34:00Z" },
      location: CANARY,
    };
    hidden.view = { permittedTypes: [...VIEW_TYPES] };
    hidden.title = CANARY;
    await write(root, hiddenPath, hidden);
    const body = await readFile(join(root, BODY_PATH), "utf8");
    await writeFile(join(root, BODY_PATH), `${body}\n[${CANARY}](#/entities/${hiddenId})\n`);
    const taxonomy = await read<Taxonomy>(root, "references/taxonomy.yaml");
    for (const node of taxonomy.nodes) {
      node.sensitivity = { classification: "public", containsPersonalData: false };
      node.publication = { eligibility: "public", requestedTargets: ["public", "private-group"] };
    }
    await write(root, "references/taxonomy.yaml", taxonomy);
    const corpus = await loadCorpus(root);
    for (const target of ["public", "private-group"] as const) {
      const manifest = projectCorpus(corpus, { target, basePath: "/" }, false);
      const bytes = serializeCanonical(manifest);
      expect(bytes).not.toContain(CANARY);
      expect(bytes).not.toContain(hiddenId);
      expect(bytes).not.toContain("2088-03-14");
      expect(manifest.entities[0]!.viewModels.event!.body).not.toContain(CANARY);
      expect(manifest.entities[0]!.relationships).toHaveLength(0);
      expect(manifest.deployable).toBe(false);
    }
    const local = serializeCanonical(projectCorpus(corpus, { target: "local", basePath: "/" }));
    expect(local).toContain(CANARY);
    expect(local).toContain("2088-03-14");
  });

  it("binds publication approval to schedules and locations", async () => {
    const corpus = await loadCorpus(await eventFixture());
    for (const { entity } of corpus.entities) {
      entity.sensitivity = { classification: "public", containsPersonalData: false };
      entity.publication = { eligibility: "public", requestedTargets: ["public"] };
    }
    for (const node of corpus.taxonomy.nodes) {
      node.sensitivity = { classification: "public", containsPersonalData: false };
      node.publication = { eligibility: "public", requestedTargets: ["public"] };
    }
    const options = { target: "public" as const, basePath: "/" };
    const manifest = projectCorpus(corpus, options, false);
    const approval: PublicationApproval = {
      schemaVersion: 1,
      target: "public",
      deploymentId: "synthetic-only",
      ...approvalDigests(manifest),
      policyVersion: corpus.publication.policyVersion,
      reviewer: "synthetic-owner",
      approvedAt: "2026-09-07T00:00:00Z",
    };
    corpus.approvals = [approval];
    expect(projectCorpus(corpus, options)).toEqual(manifest);
    const event = corpus.entities.find((item) => item.entity.id === ENTITY_ID)!.entity
      .data as EventData;
    event.location = "Changed location";
    expect(() => projectCorpus(corpus, options)).toThrow("exact");
    event.location = data.location!;
    event.schedule = { ...allDay, endDate: "2026-09-09" };
    expect(() => projectCorpus(corpus, options)).toThrow("exact");
  });

  it("preserves central field ownership and event-body reconciliation semantics", async () => {
    const root = await eventFixture();
    const entity = await read<Entity>(root, ENTITY_PATH);
    const before = await readFile(join(root, BODY_PATH), "utf8");
    const after = before.replace("Initial state:", "Updated synthetic event notes:");
    entity.timestamps.updatedAt = "2026-09-08T10:30:00-07:00";
    const path = await proposal(root, { [ENTITY_PATH]: stringify(entity), [BODY_PATH]: after });
    expect((await reconcileContent(root, path)).status).toBe("validated");
    expect((await reconcileContent(root, path, { apply: true })).status).toBe("applied");
    expect(await readFile(join(root, BODY_PATH), "utf8")).toBe(after);
    (entity.data as EventData).location = "Agent cannot self-authorize event fields";
    const forbidden = await proposal(
      root,
      { [ENTITY_PATH]: stringify(entity) },
      {
        runId: "forbidden-calendar-edit",
        asOf: "2026-09-09T10:30:00-07:00",
      },
    );
    await expect(reconcileContent(root, forbidden, { apply: true })).rejects.toThrow(
      "owner-controlled",
    );
    expect((await read<Entity>(root, ENTITY_PATH)).data).toHaveProperty("location", data.location);
  });
});
