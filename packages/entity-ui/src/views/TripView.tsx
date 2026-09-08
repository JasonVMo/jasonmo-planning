import type { TripChildRole, TripViewModel } from "@planning/entity-model";
import { Badge } from "@fluentui/react-components";
import { SafeMarkdown } from "../markdown.tsx";
import { formatCalendarDate } from "../calendar.ts";

const roleLabels: Record<TripChildRole, string> = {
  segment: "Segment",
  flight: "Flight",
  reservation: "Reservation",
  "things-to-do": "Things to Do",
  "hikes-walks": "Hikes & Walks",
  restaurants: "Restaurants",
  "getting-ready": "Getting Ready",
};

export function TripView({ compact = false, ...model }: TripViewModel & { compact?: boolean }) {
  const Heading = compact ? "h3" : "h1";
  return (
    <article className="tracker-travel" data-view-type="trip" data-status={model.status}>
      <header className="tracker-travel__header">
        <div className="tracker-travel__badges">
          <Badge appearance="tint">{model.kind}</Badge>
          <Badge appearance="outline">{model.status}</Badge>
        </div>
        <Heading>
          <a href={model.href}>{model.title}</a>
        </Heading>
        <p>{model.summary}</p>
      </header>
      <dl className="tracker-travel__details">
        <div>
          <dt>Destination</dt>
          <dd>{model.destination}</dd>
        </div>
        <div>
          <dt>Dates (inclusive)</dt>
          <dd>
            <time dateTime={model.startDate}>{formatCalendarDate(model.startDate)}</time>
            {model.endDate !== model.startDate ? (
              <>
                {" "}
                – <time dateTime={model.endDate}>{formatCalendarDate(model.endDate)}</time>
              </>
            ) : null}
          </dd>
        </div>
        <div>
          <dt>Time zone</dt>
          <dd>{model.timeZone}</dd>
        </div>
      </dl>
      {!compact ? (
        <>
          {model.body ? <SafeMarkdown>{model.body}</SafeMarkdown> : null}
          <section aria-label="Itinerary and research">
            <h2>Itinerary and research</h2>
            {model.children.length ? (
              <ol className="tracker-travel__list">
                {model.children.map((child) => (
                  <li key={child.order}>
                    <span className="tracker-travel__eyebrow">{roleLabels[child.role]}</span>
                    <h3>
                      <a href={child.href}>{child.title}</a>
                    </h3>
                    <p>{child.summary}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p>No itinerary sections yet.</p>
            )}
          </section>
        </>
      ) : null}
    </article>
  );
}
