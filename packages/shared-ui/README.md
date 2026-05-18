# Shared UI

## Purpose

- Provides reusable React UI primitives for TypeScript apps.
- Starts with a minimal button primitive that apps can style at the call site.

## Ownership

- Design system maintainers own exported components and prop compatibility.
- Product app teams may propose additions after repeated UI patterns appear.

## Dependency Boundaries

- May depend on React as a peer dependency.
- Must not depend on apps, SDK clients, backend services, or AI factory runtime files.
- Primitives must stay lower-level than composites and layouts.

## Evolution Path

- Add primitives first, then promote repeated assemblies into composites.
- Add layouts only after app shells repeat across products.
- Move design tokens here after `ai-factory/design-system` defines stable token names.
