# api-gateway

## Purpose

This boundary defines the public backend entrypoint.

## Responsibilities

- Own public HTTP API shape with `contracts/openapi/api-gateway.yaml`.
- Route frontend-facing capabilities through the centralized Python backend during Phase 1.

## Non-Responsibilities

- Does not own a separate runtime in Phase 1.
- Does not own duplicated Docker, dependency, or deployment configuration.

## Contracts

- Owns: `contracts/openapi/api-gateway.yaml`

## Extraction Triggers

- Independent scaling pressure.
- Separate deployment cadence.
- Mature API contract and operational need.

## Non-Triggers

- Naming preference.
- Speculative scale.
- Organizational neatness.
- Desire for symmetric folder structures.
