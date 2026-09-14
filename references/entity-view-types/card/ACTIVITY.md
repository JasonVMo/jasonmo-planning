# Activity card header

`ActivityCardHeader` is a code-owned Fluent UI card header shared by compact
flight and event-family cards. It renders:

- a rounded Google Material Symbol font glyph on the left, except for trip
  segments where the image spans the full header;
- a bold title on the right;
- a smaller unbolded subtitle below the title;
- either a code-owned dark gradient or an optional code-owned image background.

When an entity route is present, a native link covers the card so pointer,
keyboard, context-menu, and open-in-new-tab navigation work from the full card
surface. The heading itself is not a link. Secondary links and controls render
above the primary link surface and retain their independent behavior.

Semantic activity kind selects the default treatment:

| Kind         | Material Symbol       | Default background   |
| ------------ | --------------------- | -------------------- |
| Event        | `event`               | Dark warm gradient   |
| Appointment  | `event_available`     | Dark teal gradient   |
| Deadline     | `event_busy`          | Dark red gradient    |
| Reminder     | `notifications`       | Dark amber gradient  |
| Trip         | `travel_explore`      | Dark forest gradient |
| Trip segment | None                  | Dark slate gradient  |
| Flight       | `flight`              | Dark blue gradient   |
| Lodging      | `hotel`               | Deep green gradient  |
| Rental car   | `directions_car`      | Dark purple gradient |
| Ticket       | `confirmation_number` | Dark indigo gradient |
| Tour         | `tour`                | Dark cyan gradient   |
| Transit      | `directions_transit`  | Dark slate gradient  |

The rounded weight-400 variable font is bundled locally from
`@material-symbols/font-400`; the public site does not depend on a Google
Fonts request. The header receives only browser-safe view data and never
dispatches on persisted data type.

White text and any icon treatment must retain contrast over every code-owned image.
When `backgroundImage` is present, the card automatically blends a translucent
dark mask over the image behind the text. Stories cover gradient
variants, a synthetic image background, narrow widths, and dark mode.
