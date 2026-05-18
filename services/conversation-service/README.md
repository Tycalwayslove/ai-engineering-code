# conversation-service

## Purpose

This boundary defines the conversation and session domain.

## Responsibilities

- Own conversation lifecycle, session state, and message-thread semantics.
- Define conversation-facing domain contracts used by the centralized Python backend during Phase 1.
- Coordinate with `api-gateway` for public HTTP exposure without becoming a separate runtime.

## Non-Responsibilities

- Does not own a separate runtime in Phase 1.
- Does not own public HTTP API shape.
- Does not own durable memory storage, profile records, or duplicated deployment configuration.

## Contracts

- Owns: conversation and session domain contracts when they are added under `contracts/`.

## Extraction Triggers

- Independent scaling pressure.
- Separate deployment cadence.
- Mature API contract and operational need.

## Non-Triggers

- Naming preference.
- Speculative scale.
- Organizational neatness.
- Desire for symmetric folder structures.
