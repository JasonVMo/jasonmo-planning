import type {
  CalendarEvent,
  CalendarMonthViewModel,
  EventViewModel,
  SiteEntity,
  SiteManifest,
} from "@tracker/entity-model";

export const appointment: EventViewModel = {
  title: "Design review",
  summary: "Review the synthetic calendar layouts and agree on next steps.",
  href: "#/entities/synthetic-design-review",
  kind: "appointment",
  status: "confirmed",
  location: "Studio 2",
  schedule: {
    allDay: false,
    startAt: "2026-09-07T09:00:00-07:00",
    endAt: "2026-09-07T10:30:00-07:00",
    timeZone: "America/Los_Angeles",
  },
  body: "## Preparation\n\nBring the **month**, day, and timeline sketches.\n\n## Agenda\n\n- Review accessibility\n- Agree on next steps",
};

const { body: _body, ...appointmentSummary } = appointment;

export const calendarEvents: CalendarEvent[] = [
  {
    title: "Planning retreat",
    summary: "Two days reserved for synthetic planning.",
    href: "#/entities/synthetic-retreat",
    kind: "event",
    status: "confirmed",
    location: "North campus",
    schedule: { allDay: true, startDate: "2026-09-07", endDate: "2026-09-09" },
  },
  appointmentSummary,
  {
    title: "Roadmap check-in",
    summary: "A tentative appointment overlapping the review.",
    href: "#/entities/synthetic-roadmap",
    kind: "appointment",
    status: "tentative",
    schedule: {
      allDay: false,
      startAt: "2026-09-07T10:00:00-07:00",
      endAt: "2026-09-07T11:00:00-07:00",
      timeZone: "America/Los_Angeles",
    },
  },
  {
    title: "Submit proposal",
    summary: "Submit the synthetic proposal before the end of the day.",
    href: "#/entities/synthetic-proposal",
    kind: "deadline",
    status: "confirmed",
    schedule: {
      allDay: false,
      startAt: "2026-09-07T16:00:00-07:00",
      endAt: "2026-09-07T16:15:00-07:00",
      timeZone: "America/Los_Angeles",
    },
  },
  {
    title: "Evening reminder",
    summary: "A cancelled reminder remains visible with its status.",
    href: "#/entities/synthetic-reminder",
    kind: "reminder",
    status: "cancelled",
    schedule: {
      allDay: false,
      startAt: "2026-09-07T18:00:00-07:00",
      endAt: "2026-09-07T18:10:00-07:00",
      timeZone: "America/Los_Angeles",
    },
  },
  {
    title: "Overnight maintenance",
    summary: "A synthetic event that continues across midnight.",
    href: "#/entities/synthetic-overnight",
    kind: "event",
    status: "confirmed",
    schedule: {
      allDay: false,
      startAt: "2026-09-06T23:00:00-07:00",
      endAt: "2026-09-07T01:00:00-07:00",
      timeZone: "America/Los_Angeles",
    },
  },
];

export const calendarModel: CalendarMonthViewModel = {
  title: "September 2026",
  date: "2026-09-07",
  timeZone: "America/Los_Angeles",
  events: calendarEvents,
};

export const appointmentEntity: SiteEntity = {
  id: "synthetic-design-review",
  dataType: "event",
  dataVersion: 1,
  title: appointment.title,
  summary: appointment.summary,
  route: appointment.href,
  primaryTopicId: "synthetic-calendar",
  tags: ["synthetic"],
  relationships: [],
  citations: [],
  view: {
    defaultType: "event",
    byContext: {
      navigation: "label",
      collection: "event",
      relationship: "event",
      search: "label",
      detail: "event",
    },
  },
  viewModels: {
    label: { title: appointment.title, href: appointment.href },
    event: appointment,
    "calendar-month": calendarModel,
    "calendar-day": { ...calendarModel, title: "Day at a glance" },
    timeline: { ...calendarModel, title: "Around this day" },
  },
};

export const calendarManifest: SiteManifest = {
  schemaVersion: 1,
  audience: "local",
  basePath: "/",
  contentDigest: "c".repeat(64),
  deployable: false,
  taxonomy: [
    {
      id: "synthetic-calendar",
      title: "Synthetic calendar",
      description: "Test events only.",
      order: 1,
    },
  ],
  entities: calendarEvents.map((event) => ({
    ...appointmentEntity,
    id: event.href.split("/").at(-1)!,
    title: event.title,
    summary: event.summary,
    route: event.href,
    viewModels: {
      label: { title: event.title, href: event.href },
      event: { ...event, body: event.href === appointment.href ? appointment.body : "" },
    },
  })),
  searchDocuments: [],
};
