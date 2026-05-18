# Agent Runtime

## Purpose

- Reserves the Python package boundary for future agent execution primitives.
- Keeps runtime ownership explicit before any AI workflow framework is introduced.

## Ownership

- `agent_runtime` will own agent execution helpers, tool adapters, and runtime state models when they become necessary.
- Prompt, workflow, and memory source files remain under `ai-factory/`.

## Dependency Boundaries

- This package has no workflow framework dependency today.
- Do not add LangGraph or agent framework code before the first real workflow requires it.
- Import contracts and configuration explicitly rather than using dynamic auto-loading.

## Evolution Path

- Start with simple typed helpers when repeated agent execution patterns appear.
- Add framework integrations only after execution, state, replay, or review needs are concrete.
- Keep each new runtime primitive tied to an actual workflow requirement.
