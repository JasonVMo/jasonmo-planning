# Label view, version 1

Schema: `LabelViewModel` — exactly `title` and entity-route `href`.
Use for compact navigation/search links; permitted in every render context.
The renderer is selected by `viewType: label`, never data type. Link text
must remain accessible with keyboard focus and forced colors.

Requires a validated adapter and synthetic story. No body, arbitrary props,
component names, private fields, or HTML are accepted.
