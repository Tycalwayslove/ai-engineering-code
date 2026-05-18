# Shared Types

## Purpose

- Exposes TypeScript types shared by apps, SDKs, and package consumers.
- Provides stable convenience types for common API responses.

## Ownership

- Platform maintainers own exported type names and compatibility.
- Contract changes should begin in `contracts/` before package types grow.

## Dependency Boundaries

- Must not depend on app packages, UI packages, SDK packages, or runtime implementations.
- May be imported by any TypeScript workspace package.

## Evolution Path

- Add types only when they represent stable cross-package concepts.
- Prefer generated or contract-backed types once API contracts mature.
