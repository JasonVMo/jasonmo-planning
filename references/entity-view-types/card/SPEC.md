# Card view, version 1

Schema: `CardViewModel` — exactly `title`, `summary`, entity-route `href`, and
plain-text `badges`. Permitted in every render context; collection default.
Badges must not be the sole means of conveying essential information.

The renderer takes only the common safe DTO. Fixtures cover empty badges,
long text, narrow layouts, keyboard access, dark theme, and forced colors.
Adding a data type that uses cards does not add another card renderer.
