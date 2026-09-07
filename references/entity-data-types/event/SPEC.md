# Event data contract, version 1

Authority: `packages/entity-model/schemas/contracts.schema.json`, definitions
`EventData` and `EventSchedule`; named entry point:
`packages/entity-model/schemas/data-types/event.schema.json`. The base envelope
remains `schemaVersion: 1`; select `dataType: event` and `dataVersion: 1`.
The envelope rejects an event payload under `markdown`, and vice versa.

## Payload and calendar semantics

Required fields:

- `bodyPath`: confined `.md` path, with the same file limits, Markdown
  sanitization, audience-link filtering, and central managed-region checks as
  Markdown entities. Event bodies are not optional.
- `kind`: `event`, `appointment`, `deadline`, or `reminder`.
- `status`: `confirmed`, `tentative`, or `cancelled`. Cancellation is a
  presentation status, not deletion or a publication decision.
- `schedule`: exactly one of the following closed shapes.

Optional `location` is plain text, at most 500 characters; HTML and non-text
control characters are forbidden. All payloads reject unknown fields.

```yaml
schedule:
  allDay: true
  startDate: "2026-09-07"
  endDate: "2026-09-08"
```

All-day dates are Gregorian `YYYY-MM-DD` values, never timestamps. `endDate`
is **exclusive** and must be later than `startDate`: this example occupies
September 7 only. Multi-day events use a later exclusive end. Date-only values
are preserved verbatim and never shifted by the viewer's time zone.

```yaml
schedule:
  allDay: false
  startAt: "2026-09-07T09:00:00-07:00"
  endAt: "2026-09-07T10:00:00-07:00"
  timeZone: America/Los_Angeles
```

Timed intervals require explicit-offset timestamps (`Z` or `±HH:MM`) and a
named IANA time zone, including `UTC`. Numeric offset-only zone identifiers
are not accepted. Offsets define the absolute instants; `timeZone` defines
their calendar presentation. Offsets can differ across a daylight-saving
transition. `endAt` is exclusive and must be strictly later as an instant,
not just lexically later. Fractional seconds retain timestamp precision for
range validation. Midnight ends do not occupy the next day.

Calendar dates and timestamp years are bounded to **0100–9998**, including
the dates of timed endpoints in their declared zone. Impossible dates
(including invalid leap days), invalid clock/offset components, leap seconds,
missing offsets, empty/reversed intervals, mixed all-day/timed fields, and
unknown zones fail with field diagnostics. The compiler registers the
`calendar-date`, `calendar-timestamp`, and `iana-time-zone` formats and the
`eventRange` semantic keyword. A generic JSON Schema validator must implement
these checks too; accepting format annotations alone is insufficient.
Browser consumers can import `isCalendarDate`, `isTimeZone`, and
`isEventSchedule` from `@tracker/entity-model`; these dependency-free runtime
guards share the compiler's semantic validation and reject unknown schedule
fields.

Recurrence and attendees are deliberately absent and rejected, not silently
ignored. A reminder is a dated item, not a scheduled notification.

## Views, privacy, and publication

Event data reuses `label`, `tile`, `card`, and `full` adapters. Its additional
`event` adapter emits `EventViewModel`, including only audience-safe Markdown
in `body`. Collection/detail default to `event` when permitted; generic
defaults remain available when it is not. Explicit occurrence, context, and
entity defaults retain their precedence and fail if incompatible. In
particular, `defaultType: event` needs explicit compatible navigation/search
overrides; omitting a default avoids that requirement.

The site Calendar route is an additional reachable `event` presentation
**only when `event` is permitted**. Permitting a month/day/timeline view alone
does not opt an entity into that route or expose its Markdown body.
Audience filtering happens before event projection.

`calendar-month`, `calendar-day`, and `timeline` adapters emit singleton
collections of body-free `CalendarEvent` records. Their `date` is the start
day in the event's named zone; all-day schedules use the unchanged start date
and `UTC`. Site-level aggregation consumes already audience-safe permitted
event models, never canonical content or research state.

Schedules and locations are part of the approval-bound projection digest.
Hidden entities, relationship targets, and hidden Markdown link labels do
not enter broader-audience event models. Event fields do not grant write
authority: the current central ownership policy does not authorize agents
to edit schedule, kind, status, location, or body path. Existing authorized
managed-body edits and reconciliation checks still apply.

## Complete synthetic authoring example

Check for an existing stable ID before authoring. The following is an opt-in
example, not a request to create or publish canonical content. It uses an
existing taxonomy node and ownership policy. Adapt actual dates and evidence
deliberately; do not manufacture verification history.

`content/entities/example-appointment/entity.yaml`:

```yaml
schemaVersion: 1
id: example-appointment
dataType: event
dataVersion: 1
title: Example planning appointment
summary: A synthetic local appointment demonstrating the event contract.
lifecycle: draft
taxonomy:
  primaryTopicId: tracker-foundations
  relatedTopicIds: []
  tags: [planning]
relationships: []
view:
  permittedTypes: [label, tile, card, full, event, calendar-month, calendar-day, timeline]
data:
  bodyPath: body.md
  kind: appointment
  status: tentative
  schedule:
    allDay: false
    startAt: "2026-09-08T09:00:00-07:00"
    endAt: "2026-09-08T10:00:00-07:00"
    timeZone: America/Los_Angeles
  location: Synthetic meeting room
provenance:
  sources: []
  claims: []
sensitivity:
  classification: private
  containsPersonalData: false
capturePolicy: summary-allowed
publication:
  eligibility: local
  requestedTargets: []
ownershipPolicyId: mixed-research-summary-v1
refresh:
  workflow: manual
  cadence: P30D
  stateId: example-appointment
timestamps:
  createdAt: "2026-09-07T12:00:00-07:00"
  updatedAt: "2026-09-07T12:00:00-07:00"
review:
  nextReviewAt: "2026-09-08T08:00:00-07:00"
```

`content/entities/example-appointment/body.md`:

```markdown
# Example planning appointment

This owner-maintained introduction is a synthetic example, not a real booking.

<!-- BEGIN AGENT-MANAGED: research-summary -->

Unverified example. Confirm the time and location with the owner.

<!-- END AGENT-MANAGED: research-summary -->
```

As with every entity, private continuation files are required.
`research/topics/example-appointment/state.yaml`:

```yaml
schemaVersion: 1
entityId: example-appointment
objective: Keep this synthetic example clearly distinguished from a real appointment.
status: paused
completedSubtopics: []
remainingSubtopics: []
sourceCursors: []
openQuestions: []
contradictions: []
nextAction: Owner review before replacing synthetic details.
nextHumanReviewAt: "2026-09-08T08:00:00-07:00"
```

`research/topics/example-appointment/sources.yaml`:

```yaml
schemaVersion: 1
entityId: example-appointment
sources: []
```

Also provide `research/topics/example-appointment/evidence.md` containing
`Synthetic example only; no source verification has occurred.` No successful
run or verification timestamp is needed or implied. After owner-authorized
authoring, run `corepack yarn content:validate` and compile the local target.

## Migration decision

This is a new, opt-in version-1 data type, not a schema-version migration.
Existing Markdown descriptors and canonical entities are unchanged. No
research timestamp is inferred to be a calendar event. Existing IDs, manual
regions, and provenance stay stable; an intentional owner-controlled data
type change must satisfy the complete event contract.

New content defaults to private/local as shown above. This extension changes
neither central ownership nor publication policy, destinations, approvals,
hosting gates, or upload authorization. Recurrence, attendees, calendar
imports/synchronization, notifications, and browser editing remain out of
scope.
