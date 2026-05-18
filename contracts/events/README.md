# Event Contracts

## Ownership
- Event producers own event shape proposals and consumers review changes that affect processing.
- Shared event naming and envelope rules belong here before any runtime-specific bus exists.

## Source Of Truth
- This directory is the source of truth for cross-runtime event contracts.
- Runtime publishers and subscribers must reference these contracts instead of local copies.

## Dependency Boundaries
- Event contracts describe payloads and delivery assumptions only.
- They must not depend on queue providers, retry libraries, or service implementation details.

## Evolution
- Start with documented envelopes before adding schema files.
- Add schema validation when event drift or integration risk appears.
