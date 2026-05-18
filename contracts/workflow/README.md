# Workflow Contracts

## Ownership
- Workflow owners maintain manifest shape with review from runtime, memory, and product consumers.
- Each workflow must declare ownership before it becomes executable infrastructure.

## Source Of Truth
- `workflow-manifest.schema.json` is the source of truth for workflow metadata.
- Runtime registries and documentation must derive from manifest files that validate against this schema.

## Dependency Boundaries
- Workflow contracts describe inputs, outputs, states, and memory domains.
- They must not depend on orchestration engines, UI flows, prompt internals, or queue providers.

## Evolution
- Extend manifests only after real workflow execution or review needs appear.
- Add runtime-specific fields through new contracts or versioned schemas, not ad hoc manifest keys.
