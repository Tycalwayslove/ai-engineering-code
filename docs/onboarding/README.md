# Onboarding

## Purpose

- Help new maintainers and agents find the documents that govern repository changes.
- Keep setup instructions separate from architectural decisions.
- Point first-time contributors toward the source-of-truth map before implementation.

## Rules

- Read the root `README.md` before adding top-level areas.
- Read `docs/conventions/source-of-truth.md` before creating or moving contracts, prompts, memory, workflows, packages, or services.
- Read `docs/conventions/anti-patterns.md` before adding infrastructure or orchestration.
- Read `docs/adr/` before changing architecture or service boundaries.
- Use `local-development.md` for local setup commands once runtime foundations exist.

## Evolution

- Add onboarding steps only when they are required to make the repository run or stay governable.
- Remove stale setup commands when tooling changes.
- Link to task-specific guides instead of duplicating them here.
