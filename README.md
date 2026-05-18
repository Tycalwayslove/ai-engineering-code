# AI Code

## Purpose

- Define the repository as a polyglot AI-native software factory.
- Keep product code, contracts, AI factory assets, and governance docs in one monorepo.
- Make ownership and source-of-truth decisions explicit before runtime code grows.

## Rules

- Use `docs/adr` for major architectural decisions.
- Use `contracts/` for cross-runtime API, event, memory, and workflow agreements.
- Use `ai-factory/` for specs, prompts, memory, workflows, agents, playbooks, and design-system inputs.
- Keep `services/*` as ownership boundaries until operational pressure justifies runtime extraction.
- Follow the repository conventions in `docs/conventions/` before adding new packages, services, workflows, or memory systems.

## Evolution

- Add runtime infrastructure only when a concrete workflow or service needs it.
- Update governance docs in the same change that changes repository structure.
- Record major direction changes with an ADR before implementation spreads across the monorepo.
