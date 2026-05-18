# profile-service

## Purpose

This boundary defines user, profile, and context ownership.

## Responsibilities

- Own user profile, preference, and context domain semantics.
- Define profile-facing contracts used by the centralized Python backend during Phase 1.
- Coordinate profile context with conversation and memory boundaries through explicit contracts.

## Non-Responsibilities

- Does not own a separate runtime in Phase 1.
- Does not create a premature auth platform.
- Does not own conversation lifecycle, memory storage, or duplicated deployment configuration.

## Contracts

- Owns: profile and context domain contracts when they are added under `contracts/`.

## Extraction Triggers

- Independent scaling pressure.
- Separate deployment cadence.
- Mature API contract and operational need.

## Non-Triggers

- Naming preference.
- Speculative scale.
- Organizational neatness.
- Desire for symmetric folder structures.
