import type { CalendarEvent, EventViewModel } from "@planning/entity-model";
import { Badge } from "@fluentui/react-components";
import { ActivityCard } from "../ActivityCard.tsx";
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
  if (compact) {
    const activityKind = model.activity?.kind ?? model.kind;
    const subtitle = {
      lodging: "Lodging",
      "rental-car": "Rental car",
      ticket: "Ticket",
      tour: "Tour",
      transit: "Transit",
      event: "Event",
      appointment: "Appointment",
      deadline: "Deadline",
      reminder: "Reminder",
      flight: "Flight",
    }[activityKind];
    return (
      <article data-view-type="event" data-status={model.status}>
        <ActivityCard
          className="tracker-event tracker-event--card"
          kind={activityKind}
          title={model.title}
          subtitle={subtitle}
          href={model.href}
          footer={
            <div className="tracker-event-card__footer">
              <EventBadges {...model} />
              <a
                className="tracker-calendar__link"
                href={calendarHref("day", eventStartDate(model, timeZone), timeZone)}
              >
                View this day
              </a>
            </div>
          }
        >
          <p className="tracker-event-card__summary">{model.summary}</p>
          <dl className="tracker-event-card__details">
            <div>
              <dt>When</dt>
              <dd>
                {eventDateRange(model, timeZone)}
                {!model.schedule.allDay ? ` · ${eventTime(model, timeZone)}` : null}
              </dd>
            </div>
            {model.location ? (
              <div>
                <dt>Where</dt>
                <dd>{model.location}</dd>
              </div>
            ) : null}
          </dl>
        </ActivityCard>
      </article>
    );
  }
  return (
    <article className="tracker-event" data-view-type="event" data-status={model.status}>
      <header className="tracker-event__header">
        <EventBadges {...model} />
        <h1>
          <a href={model.href}>{model.title}</a>
        </h1>
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
