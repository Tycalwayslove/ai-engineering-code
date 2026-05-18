# Config

## Purpose

- Provides a small home for shared TypeScript configuration helpers.
- Starts with explicit runtime environment names instead of a framework.

## Ownership

- Platform maintainers own exported names and cross-package configuration conventions.
- Consumers should keep application-specific settings inside their app package.

## Dependency Boundaries

- Must not depend on apps, SDK clients, UI packages, service internals, or runtime files.
- May be imported by TypeScript workspace packages that need shared configuration constants.

## Evolution Path

- Add only stable configuration primitives shared by multiple packages.
- Move toward schema validation only after repeated configuration drift appears.
