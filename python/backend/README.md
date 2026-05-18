# Backend API Gateway

## Purpose

- Hosts the Python FastAPI gateway for AI Code.
- Exposes health and version endpoints used by local development, CI, and service contracts.

## Ownership

- `backend.app.main` owns application assembly.
- `backend.app.routes` owns HTTP route modules.
- Tests under `python/backend/tests` verify gateway behavior.

## Dependency Boundaries

- Route modules return explicit response dictionaries and avoid hidden runtime discovery.
- Business orchestration stays out of the gateway until contracts and ownership boundaries are mature.
- Shared behavior should move to a named Python package only when multiple modules need it.

## Evolution Path

- Add routers alongside matching OpenAPI contract changes.
- Introduce service clients only after stable contract boundaries exist.
- Keep the gateway thin; extract domain services only after operational pressure appears.
