# Naming

## Purpose

- Keep repository names predictable across TypeScript, Python, services, contracts, and AI factory assets.
- Make ownership clear from paths and package names.
- Avoid names that imply runtime maturity before it exists.

## Rules

- Use kebab-case for directories.
- Use scoped TypeScript package names under `@ai-code/*`.
- Use Python package names with underscores.
- Use `-service` suffixes only when the name describes a domain boundary.
- Do not use `-service` for generic utilities, SDKs, UI packages, or infrastructure folders.
- Name contracts by the boundary they govern.
- Name prompts, workflows, and memory documents by their domain and task.

## Evolution

- Rename early when a name misstates ownership or runtime status.
- Prefer specific domain names over generic platform names.
- Record large naming changes in an ADR when they affect multiple areas.
