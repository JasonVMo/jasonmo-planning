# Hybrid Website and Research Repository

This repository will be a website for tracking various things going on in my work life, using agents to update and refresh the research, then having it produce a static website which can be published so I can reference it online.

## Website Concepts

### Technology Stack

The site should use react.js with fluent-v9 components and themes.

### Site Organization

The site should use a standard side navigation panel with has topics which may or may not have sub-sections within.
- It should adapt its views for mobile in standard ways
- Pages should render a collection of entities

### Entities

These are the discrete items that can be rendered in the site.
- entities should be renderable in various forms which may include a label/tag, a tile, a card, or fully expanded
- entities should have a defined data format, representable in yaml or json, which will be passed to the components for rendering.
- entities can contain links to other entity types or can compose other entity types
- entitty data should have additional data required to let agents know how to refresh it and work with it
- Various types of entities should show up in the storybook app so they can be modifie
- Markdown content should be a type of entity
- Once entities are defined a SPEC.md should be created for that entity type

## Tools and setup

This repository should use the following tools
- package manager: yarn v4 berry, running in pnpm mode
- task runner: nx
- typescript 7
- oxlint for linting
- oxfmt for formatting
- esbuild for bundling

Repository structure
- apps/storybook - storybook for various entity types
- apps/site - site production
- packages/* - packages
- references/* - agent rules for the repository, taxonomy, external references, etc.
- research/* - research materials
- scripts - common build scripts, referenced via cli

## Agent activities

While website generation should happen via build commands, most of the contents will be collected and organized by agents. Here are some workflows that will be needed:

- **research-topic** - research a topic, either as a single entry or a hierarchy of entries. Results should be visible in the website. If research on the topic already exists it should be aware of where it left off and know how to update it.
- **refine-website** - look for places where markdown should be turned into defined entities with better visuals, look for places where one topic should have links to another, look for places where there is duplication or redundancy.
- **organize-site** - look at the various information in the site and refine the taxonomy and high level organization.

