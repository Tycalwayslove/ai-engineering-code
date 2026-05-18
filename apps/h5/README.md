# H5

## Purpose

`@ai-code/h5` is the mobile-first web surface for the AI-native software factory.

## Ownership

This app owns browser presentation for small screens and responsive web entry points.

## Dependency Boundaries

- May import shared UI and shared types from `packages/`.
- Must not import `services/*` or `ai-factory/*`.
- Must not call backend endpoints directly or implement custom networking.
- Future data access must use an explicit SDK boundary.

## Evolution

Grow this app around validated mobile workflows. Keep orchestration and backend coordination outside the app shell.
