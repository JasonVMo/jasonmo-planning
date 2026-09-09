import type { FlightViewModel, SiteEntity, TripViewModel } from "@planning/entity-model";

export const singleTrip: TripViewModel = {
  title: "Synthetic coastal weekend",
  summary: "A fictional trip demonstrating a single landing page with research sections.",
  href: "#/entities/synthetic-coast",
  kind: "trip",
  status: "planned",
  startDate: "2026-10-03",
  endDate: "2026-10-05",
  destination: "Example Coast",
  timeZone: "America/Los_Angeles",
  body: "## Plan\n\nKeep the first afternoon flexible. **No bookings have been made.**",
  children: [
    {
      title: "Coastal walks",
      summary: "Synthetic short walks near the coast.",
      href: "#/entities/synthetic-walks",
      role: "hikes-walks",
      order: 0,
    },
    {
      title: "Getting ready",
      summary: "Check the weather and pack layers.",
      href: "#/entities/synthetic-packing",
      role: "getting-ready",
      order: 1,
    },
  ],
};

export const multiTrip: TripViewModel = {
  ...singleTrip,
  title: "Synthetic coast and city journey",
  href: "#/entities/synthetic-journey",
  endDate: "2026-10-09",
  status: "confirmed",
  children: [
    {
      title: "Coast segment",
      summary: "Three quiet days by the sea.",
      href: "#/entities/synthetic-coast-segment",
      role: "segment",
      order: 0,
    },
    {
      title: "City segment",
      summary: "Four days of museums and parks.",
      href: "#/entities/synthetic-city-segment",
      role: "segment",
      order: 1,
    },
    {
      title: "Outbound flight",
      summary: "A synthetic flight to the coast.",
      href: "#/entities/synthetic-flight",
      role: "flight",
      order: 2,
    },
    {
      title: "Example lodge",
      summary: "Tentative public-safe lodging details.",
      href: "#/entities/synthetic-lodging",
      role: "reservation",
      order: 3,
    },
  ],
};

export const directFlight: FlightViewModel = {
  title: "Synthetic west-to-east flight",
  summary: "A fictional direct flight, with each airport's local time shown explicitly.",
  href: "#/entities/synthetic-flight",
  status: "scheduled",
  body: "## Before departure\n\nCheck the carrier's current departure information.",
  legs: [
    {
      carrier: "American Airlines",
      flightNumber: "1872",
      origin: "SEA",
      destination: "BOS",
      departAt: "2026-10-03T08:00:00-07:00",
      departureTimeZone: "America/Los_Angeles",
      arriveAt: "2026-10-03T16:15:00-04:00",
      arrivalTimeZone: "America/New_York",
    },
  ],
};

export const connectingFlight: FlightViewModel = {
  ...directFlight,
  title: "Synthetic connecting journey",
  legs: [
    {
      ...directFlight.legs[0],
      destination: "ORD",
      arriveAt: "2026-10-03T14:00:00-05:00",
      arrivalTimeZone: "America/Chicago",
    },
    {
      carrier: "American Airlines",
      flightNumber: "3683",
      origin: "ORD",
      destination: "BOS",
      departAt: "2026-10-03T15:30:00-05:00",
      departureTimeZone: "America/Chicago",
      arriveAt: "2026-10-03T18:45:00-04:00",
      arrivalTimeZone: "America/New_York",
    },
  ],
};

export function travelEntity(model: TripViewModel | FlightViewModel): SiteEntity {
  const view = "children" in model ? "trip" : "flight";
  return {
    id: model.href.slice("#/entities/".length),
    dataType: "synthetic-travel",
    dataVersion: 1,
    title: model.title,
    summary: model.summary,
    route: model.href,
    primaryTopicId: "synthetic",
    tags: [],
    relationships: [],
    citations: [],
    view: {
      defaultType: view,
      byContext: {
        navigation: "label",
        collection: view,
        relationship: "tile",
        search: "label",
        detail: view,
      },
    },
    viewModels: {
      label: { title: model.title, href: model.href },
      tile: { title: model.title, summary: model.summary, href: model.href },
      ...("children" in model ? { trip: model } : { flight: model }),
    },
  };
}
