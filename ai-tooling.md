# AI Tooling

This project was built with the help of AI code-generation tools at two stages.

## Tools used

- **Codex** — used to bootstrap the project: interpret the SRS and rubric,
  draft the architecture/MVC plan, scaffold the Docker-based structure, and
  generate the initial React frontend, Flask backend, PostgreSQL schema, and
  Nginx ingress configuration.
- **Claude (Claude Code)** — used to iterate on that foundation: build out the
  five pages (chef's-pick banner, Awards & Reviews showcase, owner backstories,
  expanded menu, gallery lightbox), add live reservation availability, harden
  the reservation logic (open-hours/date validation, stronger email and party-
  size validation, a concurrency-safe table-assignment retry), enrich the
  confirmation experience, localize the menu images, add light/dark theming and
  responsive breakpoints, and add a best-effort confirmation email.

## How it was used

Each improvement was made as a small, self-contained commit so it could be
reviewed and reverted independently. AI output was treated as a draft: every
change was read, adjusted to match the existing code style, syntax-checked, and
verified against the rubric and SRS before committing.

## What worked well

- Scaffolding a complete, runnable full-stack starting point quickly.
- Producing consistent, idiomatic React components and CSS that matched the
  established conventions.
- Reasoning through the trickier reservation requirements — live availability
  and the concurrent-booking race on `UNIQUE (time_slot, table_number)`.

## What still needed human judgment

- Final styling, copy, and UX decisions (tone, layout, what to feature).
- Choosing royalty-free imagery and confirming local hosting.
- Testing against real Docker runs and the PostgreSQL database, demo
  preparation, and any deployment-specific configuration.
