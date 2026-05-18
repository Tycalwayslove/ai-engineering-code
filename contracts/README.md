# Contracts

## Ownership
- Contracts are owned by the runtime boundary they describe and reviewed by every consumer before breaking changes land.
- `contracts/openapi` owns HTTP API shapes, `contracts/events` owns event envelopes, `contracts/memory` owns memory records, and `contracts/workflow` owns workflow manifests.

## Source Of Truth
- Files in this directory are the source of truth for cross-runtime agreements.
- Runtime code may generate clients, validators, or docs from these files, but must not redefine the same shape elsewhere.

## Dependency Boundaries
- Applications, packages, Python services, and AI factory workflows may depend on contracts.
- Contracts must not depend on runtime implementations, framework internals, generated clients, or environment-specific settings.

## Evolution
- Additive changes can land with updated docs and consumers.
- Breaking changes require a migration path, versioned contract file, or ADR when the impact crosses ownership boundaries.
