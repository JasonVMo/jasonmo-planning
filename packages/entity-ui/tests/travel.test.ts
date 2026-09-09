import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EntityRenderer } from "../src/EntityRenderer.tsx";
import { CardView } from "../src/views/CardView.tsx";
import { EventView } from "../src/views/EventView.tsx";
import { TripView } from "../src/views/TripView.tsx";
import { FlightView } from "../src/views/FlightView.tsx";
import { appointment } from "../../../apps/storybook/fixtures/calendar.ts";
import {
  directFlight,
  connectingFlight,
  multiTrip,
  singleTrip,
  travelEntity,
} from "../../../apps/storybook/fixtures/travel.ts";
import { viewRegistry } from "../src/view-registry.tsx";
import { VIEW_TYPES } from "@planning/entity-model";

describe("travel renderers", () => {
  it("registers every closed view type", () => {
    expect(Object.keys(viewRegistry).sort()).toEqual([...VIEW_TYPES].sort());
  });
  it("renders semantic inclusive dates and ordered child links", () => {
    const html = renderToStaticMarkup(createElement(TripView, multiTrip));
    expect(html).toContain('data-view-type="trip"');
    expect(html).toContain('dateTime="2026-10-09"');
    expect(html.indexOf("Coast segment")).toBeLessThan(html.indexOf("City segment"));
    expect(html).toContain('href="#/entities/synthetic-coast-segment"');
    expect(html).toContain(">Itinerary<");
    const singleHtml = renderToStaticMarkup(createElement(TripView, singleTrip));
    expect(singleHtml).toContain(">Research<");
    expect(singleHtml).toContain(">Getting Ready<");
    expect(singleHtml).not.toContain(">Packing notes<");
    expect(html).not.toContain("2026-10-10");
  });
  it("renders airport-local times and connection duration", () => {
    const html = renderToStaticMarkup(createElement(FlightView, connectingFlight));
    expect(html).toContain('aria-label="Flight legs"');
    expect(html).toContain("American 1872");
    expect(html).toContain("CDT");
    expect(html).not.toContain("America/Chicago");
    expect(html).not.toContain("American Airlines 1872");
    expect(html).toContain("Connection: 1h 30m");
    expect(html.indexOf("1872")).toBeLessThan(html.indexOf("3683"));
    expect(renderToStaticMarkup(createElement(FlightView, directFlight))).not.toContain(
      "Connection:",
    );
  });
  it("uses Fluent cards for compact events, reservations, flights, and hike summaries", () => {
    const flight = renderToStaticMarkup(
      createElement(FlightView, { ...directFlight, compact: true }),
    );
    const event = renderToStaticMarkup(createElement(EventView, { ...appointment, compact: true }));
    const hike = renderToStaticMarkup(
      createElement(CardView, {
        title: "Hikes & Walks",
        summary: "Region-grouped hikes.",
        href: "#/entities/hikes",
        badges: ["hikes"],
      }),
    );
    expect(flight).toContain("fui-Card");
    expect(flight).toContain("tracker-flight-card__graphic");
    expect(flight).toContain("American 1872");
    expect(flight).not.toContain("America/Los_Angeles");
    expect(event).toContain("fui-Card");
    expect(event).toContain("tracker-event--card");
    expect(event).not.toContain("Preparation");
    expect(hike).toContain("fui-Card");
    expect(hike).toContain("tracker-card");
  });
  it("dispatches by view only and keeps compact body text out of collections", () => {
    for (const model of [singleTrip, directFlight]) {
      const entity = travelEntity(model);
      const html = renderToStaticMarkup(
        createElement(EntityRenderer, { entity, context: "collection" }),
      );
      expect(html).toContain("<h3>");
      if ("legs" in model) expect(html).toContain("fui-Card");
      expect(html).not.toContain("tracker-markdown");
      expect(html).not.toContain("View unavailable");
      delete entity.viewModels.trip;
      delete entity.viewModels.flight;
      expect(renderToStaticMarkup(createElement(EntityRenderer, { entity }))).toContain(
        "View unavailable",
      );
    }
  });
  it("expresses cancellation in text and escapes plain-text fields", () => {
    const html = renderToStaticMarkup(
      createElement(TripView, { ...singleTrip, status: "cancelled", destination: "<unsafe>" }),
    );
    expect(html).toContain(">cancelled<");
    expect(html).toContain("&lt;unsafe&gt;");
    expect(html).not.toContain("<unsafe>");
  });
});
