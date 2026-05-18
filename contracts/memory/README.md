# Memory Contracts

## Ownership
- Memory system owners maintain document metadata contracts with review from workflows and runtime consumers.
- Domain additions require agreement from the teams that retrieve or author memory.

## Source Of Truth
- `memory-document.schema.json` is the source of truth for memory document metadata.
- Markdown files may carry content, but this schema defines the portable record shape.

## Dependency Boundaries
- Memory contracts may be consumed by agents, workflows, and services.
- They must not depend on storage engines, vector indexes, prompt templates, or retrieval implementations.

## Evolution
- Add optional metadata only after repeated retrieval or governance needs appear.
- Tighten validation or add new schemas when manual conventions create drift.
