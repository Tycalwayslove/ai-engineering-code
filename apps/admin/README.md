# Admin

## Purpose

`@ai-code/admin` is the operator surface for the AI-native software factory.

## Ownership

This app owns browser presentation for operational workflows and factory oversight.

## Dependency Boundaries

- May import shared UI and shared types from `packages/`.
- Must not import `services/*` or `ai-factory/*`.
- Must not call backend endpoints directly or implement custom networking.
- Future data access must use an explicit SDK boundary.

## Evolution

Grow this app around real operator workflows. Keep business orchestration in backend or workflow-owned packages, not page components.
