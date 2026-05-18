# Packages

## Purpose

- Holds shared TypeScript packages for apps and service clients.
- Keeps reusable contracts, UI primitives, SDK code, and configuration helpers outside app ownership.

## Ownership

- Platform maintainers own package boundaries, exports, and dependency policy.
- App teams may propose additions when two or more consumers need the same capability.

## Dependency Boundaries

- Packages may depend on lower-level shared packages.
- Packages must not depend on apps, Python runtimes, service internals, or AI factory runtime files.
- Keep cross-runtime contracts in `contracts/`; mirror only TypeScript convenience types here.

## Evolution Path

- Start with small explicit exports.
- Add modules after repeated usage appears in apps or SDK consumers.
- Split packages only when ownership, release cadence, or dependency pressure makes the current package unclear.
