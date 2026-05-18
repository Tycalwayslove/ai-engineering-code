# Services

## Purpose

This directory defines service ownership boundaries for the AI-native software factory.

## Rules

- Service directories are boundary definitions only during Phase 1.
- Runtime implementation stays in the centralized Python backend unless extraction triggers are met.
- Cross-runtime agreements live in `contracts/`.
- Do not add Docker, dependency, deployment, worker, queue, or server files here during Phase 1.

## Boundaries

- `api-gateway`: public backend entrypoint and HTTP API contract boundary.
- `conversation-service`: conversation and session domain boundary.
- `memory-service`: durable and working memory access boundary.
- `profile-service`: user, profile, and context boundary.

## Extraction

- Extract a boundary only after operational pressure and mature contracts exist.
- Prefer explicit ownership documentation before runtime separation.
- Record major boundary changes with an ADR.
