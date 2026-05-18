# Architecture Overview

## Purpose

- Establish the initial monorepo structure for the AI-native software factory.
- Keep frontend, backend, shared packages, contracts, and AI factory assets coordinated.
- Avoid premature runtime separation while boundaries are still forming.

## Rules

- TypeScript apps live under `apps/` and shared TypeScript packages live under `packages/`.
- Python runtimes and libraries live under `python/`.
- `services/` names domain ownership boundaries before they become independently deployed services.
- `contracts/` defines cross-runtime agreements that TypeScript and Python code must honor.
- `ai-factory/` stores agent, prompt, workflow, memory, spec, playbook, and design-system assets.
- Architecture docs must not become a second copy of contract or prompt content.

## Evolution

- Extract deployable services only after ownership, contracts, and operational needs are clear.
- Add orchestration runtime code only after real workflow execution needs exist.
- Promote stable architecture decisions into ADRs when they affect multiple areas.
