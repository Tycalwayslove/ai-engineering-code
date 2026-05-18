# Infrastructure

The `infra` tree owns local and future deployment infrastructure for this monorepo.
It is intentionally small today: Docker Compose gives contributors a predictable
way to run the H5 frontend, FastAPI backend, Postgres, and Redis on one machine.

Application code stays in `apps/`, `python/`, `packages/`, and `services/`.
Infrastructure should reference those projects but should not duplicate their
runtime configuration, package metadata, contracts, or business logic.

Dependency boundaries:

- `docker-compose.yml` defines local process wiring and published ports.
- `infra/docker/` owns development container images.
- Service source directories own their own application dependencies and commands.
- Deployment platforms such as Kubernetes or hosted databases are out of scope
  until the repository needs production environment definitions.

Evolution path:

1. Keep local development infrastructure minimal and easy to rebuild.
2. Add environment-specific configuration only when a real environment exists.
3. Promote repeated operational patterns into documented templates before adding
   platform-specific automation.
