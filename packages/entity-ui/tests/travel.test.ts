import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EntityRenderer } from "../src/EntityRenderer.tsx";
import { TripView } from "../src/views/TripView.tsx";
import { FlightView } from "../src/views/FlightView.tsx";
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
    expect(html).toContain("America/Chicago");
    expect(html).toContain("Connection: 1h 30m");
    expect(html.indexOf("EX 101")).toBeLessThan(html.indexOf("EX 202"));
    expect(renderToStaticMarkup(createElement(FlightView, directFlight))).not.toContain(
      "Connection:",
    );
  });
  it("dispatches by view only and keeps compact body text out of collections", () => {
    for (const model of [singleTrip, directFlight]) {
      const entity = travelEntity(model);
      const html = renderToStaticMarkup(
        createElement(EntityRenderer, { entity, context: "collection" }),
      );
      expect(html).toContain("<h3>");
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
