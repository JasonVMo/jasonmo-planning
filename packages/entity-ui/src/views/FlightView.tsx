import type { FlightViewModel } from "@planning/entity-model";
import { Badge, Card, CardFooter, CardHeader } from "@fluentui/react-components";
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

function carrierName(carrier: string): string {
  return carrier.replace(/\s+(?:Airlines?|Air Lines)$/i, "");
}

function duration(start: string, end: string): string {
  const minutes = Math.round((Date.parse(end) - Date.parse(start)) / 60_000);
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function AirplaneGraphic() {
  return (
    <div className="tracker-flight-card__graphic" aria-hidden="true">
      <svg viewBox="0 0 64 64" role="presentation">
        <path d="M55 29 36 18V8c0-4-2-7-4-7s-4 3-4 7v10L9 29l-7-4v6l7 5 19-5v14l-7 6v5l11-3 11 3v-5l-7-6V31l19 5 7-5v-6z" />
      </svg>
    </div>
  );
}

function FlightCard(model: FlightViewModel) {
  return (
    <article data-view-type="flight" data-status={model.status}>
      <Card className="tracker-flight-card" appearance="outline">
        <AirplaneGraphic />
        <CardHeader
          header={
            <h3>
              <a href={model.href}>{model.title}</a>
            </h3>
          }
          description={
            <p>{model.legs.length === 1 ? "Direct flight" : `${model.legs.length}-leg flight`}</p>
          }
        />
        <ol className="tracker-flight-card__legs" aria-label="Flight legs">
          {model.legs.map((leg, index) => (
            <li key={`${index}-${leg.flightNumber}`}>
              <p className="tracker-flight-card__carrier">
                {carrierName(leg.carrier)} {leg.flightNumber}
              </p>
              <div
                className="tracker-flight-card__route"
                aria-label={`${leg.origin} to ${leg.destination}`}
              >
                <strong>{leg.origin}</strong>
                <span aria-hidden="true">→</span>
                <strong>{leg.destination}</strong>
              </div>
              <div className="tracker-flight-card__times">
                <time dateTime={leg.departAt}>
                  {localTime(leg.departAt, leg.departureTimeZone)}
                </time>
                <time dateTime={leg.arriveAt}>{localTime(leg.arriveAt, leg.arrivalTimeZone)}</time>
              </div>
              {model.legs[index + 1] ? (
                <p className="tracker-flight-card__connection">
                  {duration(leg.arriveAt, model.legs[index + 1]!.departAt)} connection
                </p>
              ) : null}
            </li>
          ))}
        </ol>
        <CardFooter>
          <Badge appearance="tint">
            {model.legs.length === 1 ? "Direct" : `${model.legs.length} legs`}
          </Badge>
          <Badge appearance="outline">{model.status}</Badge>
        </CardFooter>
      </Card>
    </article>
  );
}

export function FlightView({ compact = false, ...model }: FlightViewModel & { compact?: boolean }) {
  if (compact) return <FlightCard {...model} />;
  return (
    <article className="tracker-travel" data-view-type="flight" data-status={model.status}>
      <header className="tracker-travel__header">
        <div className="tracker-travel__badges">
          <Badge appearance="tint">
            {model.legs.length === 1 ? "Direct flight" : "Connecting flight"}
          </Badge>
          <Badge appearance="outline">{model.status}</Badge>
        </div>
        <h1>
          <a href={model.href}>{model.title}</a>
        </h1>
        <p>{model.summary}</p>
      </header>
      <ol className="tracker-travel__list" aria-label="Flight legs">
        {model.legs.map((leg, index) => (
          <li key={`${index}-${leg.flightNumber}`}>
            <h2>
              {carrierName(leg.carrier)} {leg.flightNumber}: {leg.origin} to {leg.destination}
            </h2>
            <dl className="tracker-travel__details">
              <div>
                <dt>{leg.origin}</dt>
                <dd>
                  <time dateTime={leg.departAt}>
                    {localTime(leg.departAt, leg.departureTimeZone)}
                  </time>
                </dd>
              </div>
              <div>
                <dt>{leg.destination}</dt>
                <dd>
                  <time dateTime={leg.arriveAt}>
                    {localTime(leg.arriveAt, leg.arrivalTimeZone)}
                  </time>
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
