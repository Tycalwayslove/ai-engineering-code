# ADR 0001: Polyglot AI-Native Monorepo

## Status

- Accepted

## Purpose

- Establish one monorepo for TypeScript applications, Python services, shared contracts, and AI factory assets.
- Keep early development coordinated while product, runtime, and AI workflows are still forming.
- Avoid premature service extraction before contracts and operational needs mature.

## Rules

- Use TypeScript for frontend apps and shared web-facing packages.
- Use Python for backend APIs, agent runtime foundations, orchestration, and AI-adjacent services.
- Use `contracts/` as the shared agreement layer between runtimes.
- Use `ai-factory/` as the source for specs, prompts, workflows, memory, agents, playbooks, and design-system inputs.
- Keep `services/*` as domain ownership boundaries during Phase 1.
- Do not introduce independent deployment boundaries until contracts and operational pressure justify them.

## Consequences

- Repository governance must be explicit because multiple runtimes share one workspace.
- Cross-runtime changes must start from contracts instead of direct implementation coupling.
- AI assets must have stable ownership so prompts, memory, and workflows do not drift.

## Evolution

- Revisit this decision when service boundaries need independent scaling, deployment, or ownership.
- Record runtime extraction decisions in follow-up ADRs.
- Keep the monorepo unless coordination cost exceeds the benefit of shared contracts and governance.
