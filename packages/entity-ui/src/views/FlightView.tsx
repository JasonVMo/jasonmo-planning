import type { FlightViewModel } from "@planning/entity-model";
import { Badge } from "@fluentui/react-components";
import { SafeMarkdown } from "../markdown.tsx";

function localTime(timestamp: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en", {
    timeZone,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(timestamp));
}

function duration(start: string, end: string): string {
  const minutes = Math.round((Date.parse(end) - Date.parse(start)) / 60_000);
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function FlightView({ compact = false, ...model }: FlightViewModel & { compact?: boolean }) {
  const Heading = compact ? "h3" : "h1";
  const LegHeading = compact ? "h4" : "h2";
  return (
    <article className="tracker-travel" data-view-type="flight" data-status={model.status}>
      <header className="tracker-travel__header">
        <div className="tracker-travel__badges">
          <Badge appearance="tint">
            {model.legs.length === 1 ? "Direct flight" : "Connecting flight"}
          </Badge>
          <Badge appearance="outline">{model.status}</Badge>
        </div>
        <Heading>
          <a href={model.href}>{model.title}</a>
        </Heading>
        <p>{model.summary}</p>
      </header>
      <ol className="tracker-travel__list" aria-label="Flight legs">
        {model.legs.map((leg, index) => (
          <li key={`${index}-${leg.flightNumber}`}>
            <LegHeading>
              {leg.carrier} {leg.flightNumber}: {leg.origin} to {leg.destination}
            </LegHeading>
            <dl className="tracker-travel__details">
              <div>
                <dt>Departure · {leg.origin}</dt>
                <dd>
                  <time dateTime={leg.departAt}>
                    {localTime(leg.departAt, leg.departureTimeZone)}
                  </time>
                  <span className="tracker-travel__zone">{leg.departureTimeZone}</span>
                </dd>
              </div>
              <div>
                <dt>Arrival · {leg.destination}</dt>
                <dd>
                  <time dateTime={leg.arriveAt}>
                    {localTime(leg.arriveAt, leg.arrivalTimeZone)}
                  </time>
                  <span className="tracker-travel__zone">{leg.arrivalTimeZone}</span>
                </dd>
              </div>
              <div>
                <dt>Flight duration</dt>
                <dd>{duration(leg.departAt, leg.arriveAt)}</dd>
              </div>
            </dl>
            {model.legs[index + 1] ? (
              <p>
                Connection: {duration(leg.arriveAt, model.legs[index + 1]!.departAt)} before the
                next leg.
              </p>
            ) : null}
          </li>
        ))}
      </ol>
      {!compact && model.body ? <SafeMarkdown>{model.body}</SafeMarkdown> : null}
    </article>
  );
}
