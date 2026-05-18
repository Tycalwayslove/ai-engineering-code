# AI Readability

## Purpose

- Make repository code and artifacts easy for humans and AI agents to inspect, modify, and verify.
- Reduce hidden behavior that forces broad searches before safe edits.
- Keep ownership and execution flow visible from names and file locations.

## Rules

- Use explicit naming for files, modules, functions, workflows, prompts, and memory documents.
- Keep call chains shallow; avoid routing simple behavior through several helper layers.
- Preserve predictable ownership; put behavior near the package, service boundary, or AI factory area that owns it.
- Keep hidden behavior low; avoid implicit side effects in imports, decorators, registries, and module initialization.
- Keep indirection low; introduce wrappers only when they remove repeated, stable complexity.
- Prefer direct imports from known modules over runtime discovery.
- Name orchestration code by the business process it coordinates.

## Evolution

- Add indirection only after repeated implementation patterns stabilize.
- Split files when ownership or scanability becomes unclear.
- Remove clever helpers when they hide behavior that reviewers need to verify.
