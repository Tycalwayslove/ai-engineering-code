# OpenAPI Contracts

## Ownership
- API gateway owners maintain these contracts with input from backend and client consumers.
- Each operation must have a stable `operationId`.

## Source Of Truth
- `api-gateway.yaml` is the source of truth for public HTTP API shape.
- Generated clients and server stubs must derive from this file.

## Dependency Boundaries
- OpenAPI files describe transport shape only.
- They must not encode framework routing details, database models, or frontend view concerns.

## Evolution
- Add endpoints and response fields only when at least one consumer needs them.
- Version or migrate contracts before removing fields, changing response types, or renaming operation IDs.
