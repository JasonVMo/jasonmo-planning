import type { CalendarEvent, EventViewModel } from "@tracker/entity-model";
import { Badge } from "@fluentui/react-components";
import { SafeMarkdown } from "../markdown.tsx";
import { calendarHref, eventDateRange, eventStartDate, eventTime } from "../calendar.ts";

export function EventBadges({ kind, status }: Pick<CalendarEvent, "kind" | "status">) {
  return (
    <div className="tracker-event__badges">
      <Badge appearance="tint">{kind}</Badge>
      <Badge appearance="outline">{status}</Badge>
    </div>
  );
}

export function EventView({ compact = false, ...model }: EventViewModel & { compact?: boolean }) {
  const timeZone = model.schedule.allDay ? "UTC" : model.schedule.timeZone;
  const Heading = compact ? "h3" : "h1";
  return (
    <article className="tracker-event" data-view-type="event" data-status={model.status}>
      <header className="tracker-event__header">
        <EventBadges {...model} />
        <Heading>
          <a href={model.href}>{model.title}</a>
        </Heading>
        <p>{model.summary}</p>
      </header>
      <dl className="tracker-event__details">
        <div>
          <dt>When</dt>
          <dd>
            {eventDateRange(model, timeZone)}
            <br />
            {eventTime(model, timeZone)}
          </dd>
        </div>
        {!model.schedule.allDay ? (
          <div>
            <dt>Time zone</dt>
            <dd>{timeZone}</dd>
          </div>
        ) : null}
        {model.location ? (
          <div>
            <dt>Where</dt>
            <dd>{model.location}</dd>
          </div>
        ) : null}
      </dl>
      <a
        className="tracker-calendar__link"
        href={calendarHref("day", eventStartDate(model, timeZone), timeZone)}
      >
        View this day
      </a>
      {!compact && model.body ? <SafeMarkdown>{model.body}</SafeMarkdown> : null}
    </article>
  );
}
