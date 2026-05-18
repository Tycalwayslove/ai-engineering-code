# Conventions

## Purpose

- Define repository-wide rules that apply across apps, packages, Python code, services, contracts, and AI factory assets.
- Make the codebase readable to humans and AI agents.
- Reduce drift by naming authoritative locations for common responsibilities.

## Rules

- Follow `ai-readability.md` for code and workflow shape.
- Follow `naming.md` before creating packages, directories, modules, or service boundaries.
- Follow `source-of-truth.md` before copying contracts, prompts, memory, or workflow definitions.
- Follow `anti-patterns.md` when evaluating new infrastructure or abstractions.
- Follow `evolution.md` before extracting services, adding runtimes, indexing memory, or enforcing contracts.

## Evolution

- Add conventions when repeated review comments expose a stable rule.
- Keep conventions short enough to enforce during normal code review.
- Prefer updating an existing convention over creating overlapping guidance.
