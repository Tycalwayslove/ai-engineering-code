# Orchestrator

## Purpose

- Reserves the Python package boundary for future workflow coordination.
- Documents where orchestration code will live once real workflow pressure exists.

## Ownership

- `orchestrator` will own workflow coordination, review handoffs, and replay entry points when needed.
- Workflow definitions and playbooks remain under `ai-factory/workflows` and `ai-factory/playbooks`.

## Dependency Boundaries

- This package has no workflow framework dependency today.
- Do not add orchestration runtimes until manual workflow execution creates drift or review risk.
- Keep API gateway routes separate from orchestration internals.

## Evolution Path

- Add small coordination functions after repeated workflow steps stabilize.
- Introduce durable state only when replay or audit requirements appear.
- Record major orchestration shifts with an ADR.
