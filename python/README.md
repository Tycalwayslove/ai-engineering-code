# Python Runtime

## Purpose

- Owns the Python services and AI runtime packages for the monorepo.
- Provides the FastAPI API gateway foundation and empty package boundaries for future agent execution and orchestration.

## Ownership

- Backend API code lives under `python/backend`.
- Agent runtime primitives belong under `python/agent-runtime`.
- Workflow coordination code belongs under `python/orchestrator`.

## Dependency Boundaries

- Backend code may depend on FastAPI, Pydantic, and runtime packages only through explicit imports.
- Agent runtime and orchestrator stay framework-free until a real workflow needs execution, state, replay, or review.
- Cross-runtime contracts remain in `contracts/`; Python packages consume them but do not redefine them.

## Evolution Path

- Add backend routes when OpenAPI contracts or product flows require them.
- Add agent runtime abstractions only after repeated agent execution patterns stabilize.
- Add orchestration frameworks only after concrete workflow pressure exists.
