# memory-service

## Purpose

This boundary defines durable and working memory access.

## Responsibilities

- Own durable memory and working memory access patterns.
- Own memory contract usage with `contracts/memory`.
- Provide explicit memory access paths that discourage arbitrary file access from unrelated modules.
- Route memory capabilities through the centralized Python backend during Phase 1.

## Non-Responsibilities

- Does not own a separate runtime in Phase 1.
- Does not permit random modules to read or write memory files directly.
- Does not own profile records, conversation lifecycle, or duplicated deployment configuration.

## Contracts

- Owns: `contracts/memory`

## Extraction Triggers

- Independent scaling pressure.
- Separate deployment cadence.
- Mature API contract and operational need.

## Non-Triggers

- Naming preference.
- Speculative scale.
- Organizational neatness.
- Desire for symmetric folder structures.
