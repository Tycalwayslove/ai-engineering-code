# Documentation

## Purpose

- Keep repository governance, architecture, conventions, and onboarding material in one place.
- Separate stable decisions from task plans and temporary implementation notes.
- Give future agents and maintainers a small map before they modify the monorepo.

## Rules

- Put architecture summaries in `docs/architecture/`.
- Put accepted architectural decisions in `docs/adr/`.
- Put repository-wide working rules in `docs/conventions/`.
- Put setup and first-run instructions in `docs/onboarding/`.
- Do not duplicate contract, prompt, workflow, or memory content here; link to the authoritative source.

## Evolution

- Update this index when a new documentation area is created.
- Prefer short documents with clear ownership over broad catch-all guides.
- Move repeated setup or governance explanations into conventions when they become stable.
