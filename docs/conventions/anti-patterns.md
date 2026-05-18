# Anti-Patterns

## Purpose

- Name decisions that are prohibited during the bootstrap phase.
- Keep the monorepo simple until real pressure justifies infrastructure.
- Give reviewers concrete reasons to reject complexity early.

## Rules

- Prohibit premature microservices.
- Prohibit hidden runtime discovery.
- Prohibit prompt duplication.
- Prohibit context duplication.
- Prohibit magical abstractions.
- Prohibit frontend business orchestration.
- Prohibit direct memory access from random modules.
- Prohibit dynamic auto-loading of agents, workflows, prompts, tools, or memory.
- Prohibit LangGraph integration before the first real workflow.
- Prohibit vector infrastructure before memory retrieval pressure exists.

## Evolution

- Remove an anti-pattern only with an ADR that explains the pressure that changed.
- Add new anti-patterns when repeated review comments identify avoidable drift.
- Keep each prohibited pattern tied to a concrete repository risk.
