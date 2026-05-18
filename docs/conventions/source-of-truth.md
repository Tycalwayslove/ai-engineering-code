# Source Of Truth

## Purpose

- Prevent duplicate definitions of contracts, specs, prompts, memory, workflows, packages, and service boundaries.
- Tell maintainers where authoritative changes must start.
- Keep docs as guidance instead of shadow copies of executable assets.

## Rules

- `contracts/` is authoritative for cross-runtime API, event, memory, and workflow agreements.
- `ai-factory/specs` is authoritative for product, agent, and workflow specifications before implementation.
- `ai-factory/memory` is authoritative for durable AI-readable memory documents.
- `ai-factory/prompts` is authoritative for reusable prompt templates and prompt policy.
- `ai-factory/workflows` is authoritative for workflow definitions, manifests, and process steps.
- `ai-factory/design-system` is authoritative for AI-readable design-system inputs and generated design guidance.
- `packages/` is authoritative for shared TypeScript libraries and SDK-facing TypeScript types.
- `python/` is authoritative for Python runtime code, backend modules, agent runtime code, and orchestrator foundations.
- `services/` is authoritative for domain ownership boundaries before service extraction.
- `docs/adr` is authoritative for accepted architectural decisions and their consequences.
- Do not copy authoritative content into another area; link or generate from the source instead.

## Evolution

- Move source-of-truth ownership with the code or asset it governs.
- Add a convention entry when a new top-level area becomes authoritative.
- Record major source-of-truth changes with an ADR.
