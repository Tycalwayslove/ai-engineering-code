# Local Development

## Purpose

- Provide the local development entry point for the monorepo.
- Keep setup expectations visible before apps, Python runtimes, and Docker services are added.
- Avoid inventing commands before the relevant tooling exists.

## Rules

- Use the root workspace commands once `package.json` exists.
- Use Python commands from the root once `pyproject.toml` exists.
- Use Docker Compose only after `docker-compose.yml` is added.
- Keep local environment values in `.env.example`; do not document secrets.
- Update this file when setup commands or required tool versions change.

## Evolution

- Add exact install, run, test, and lint commands as each runtime foundation lands.
- Keep this file focused on local setup; put architecture decisions in ADRs.
- Remove obsolete commands in the same change that removes the underlying tooling.
