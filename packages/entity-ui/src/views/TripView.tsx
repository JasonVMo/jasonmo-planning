import type { TripChildRole, TripViewModel } from "@planning/entity-model";
import { Badge } from "@fluentui/react-components";
import { ActivityCard } from "../ActivityCard.tsx";
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

const researchRoles = new Set<TripChildRole>([
  "things-to-do",
  "hikes-walks",
  "restaurants",
  "getting-ready",
]);

export function TripView({
  compact = false,
  showChildren = true,
  ...model
}: TripViewModel & { compact?: boolean; showChildren?: boolean }) {
  const itinerary = model.children.filter((child) => !researchRoles.has(child.role));
  const research = model.children.filter((child) => researchRoles.has(child.role));
  const details = (
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
  );
  if (compact)
    return (
      <article data-view-type="trip" data-status={model.status}>
        <ActivityCard
          className="tracker-trip-card"
          kind={model.kind}
          title={model.title}
          subtitle={model.kind === "segment" ? "Trip segment" : "Trip"}
          href={model.href}
          backgroundImage={model.banner ? `url("${model.banner.src}")` : undefined}
          footer={
            <>
              <Badge appearance="tint">{model.kind}</Badge>
              <Badge appearance="outline">{model.status}</Badge>
            </>
          }
        >
          <p>{model.summary}</p>
          {details}
        </ActivityCard>
      </article>
    );
  return (
    <article className="tracker-travel" data-view-type="trip" data-status={model.status}>
      <header className="tracker-travel__header">
        <div className="tracker-travel__badges">
          <Badge appearance="tint">{model.kind}</Badge>
          <Badge appearance="outline">{model.status}</Badge>
        </div>
        <h1>
          <a href={model.href}>{model.title}</a>
        </h1>
        <p>{model.summary}</p>
      </header>
      {details}
      {model.body ? <SafeMarkdown>{model.body}</SafeMarkdown> : null}
      {showChildren && itinerary.length ? (
        <section aria-labelledby={`${model.href.slice(2)}-itinerary`}>
          <h2 id={`${model.href.slice(2)}-itinerary`}>Itinerary</h2>
          <ol className="tracker-travel__list">
            {itinerary.map((child) => (
              <li key={child.order}>
                <span className="tracker-travel__eyebrow">{roleLabels[child.role]}</span>
                <h3>
                  <a href={child.href}>{child.title}</a>
                </h3>
                <p>{child.summary}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      {showChildren && research.length ? (
        <section aria-labelledby={`${model.href.slice(2)}-research`}>
          <h2 id={`${model.href.slice(2)}-research`}>Research</h2>
          <ol className="tracker-travel__list">
            {research.map((child) => (
              <li key={child.order}>
                <h3>
                  <a href={child.href}>{roleLabels[child.role]}</a>
                </h3>
                <p>{child.summary}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      {showChildren && !itinerary.length && !research.length ? (
        <p>No itinerary or research yet.</p>
      ) : null}
    </article>
  );
}
