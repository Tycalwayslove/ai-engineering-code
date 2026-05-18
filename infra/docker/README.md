# Docker Infrastructure

This directory owns Dockerfiles used by local Docker Compose development.
The images are development-oriented and deliberately minimal: they install the
existing Node or Python dependencies, copy the repository, and run the commands
declared in `docker-compose.yml`.

Ownership:

- `frontend.Dockerfile` supports the `frontend` Compose service and the
  `pnpm dev:h5` workflow.
- `backend.Dockerfile` supports the `backend` Compose service and the FastAPI
  `uvicorn` workflow.

Dependency boundaries:

- Dockerfiles may install repository dependencies from `package.json`,
  `pnpm-lock.yaml`, and `pyproject.toml`.
- Dockerfiles should not define application behavior that belongs in source
  packages, service modules, or contract files.
- This directory must not introduce containers for `services/*`; those folders
  are domain boundaries, not local infrastructure processes yet.

Evolution path:

1. Keep Dockerfiles suitable for local development first.
2. Add build stages only when production image requirements are defined.
3. Move shared image conventions into this directory if multiple runtime images
   start to repeat the same setup.
