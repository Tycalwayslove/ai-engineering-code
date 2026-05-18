# SDK

## Purpose

- Provides a small TypeScript client for AI Code HTTP APIs.
- Centralizes base URL handling, authentication headers, and response error handling.

## Ownership

- Platform maintainers own client behavior and public method names.
- API consumers may request new methods after the related endpoint exists in `contracts/openapi`.

## Dependency Boundaries

- May depend on `@ai-code/shared-types` for response types.
- Must not depend on apps, UI packages, service internals, or backend implementation files.

## Evolution Path

- Add endpoint methods one at a time as API contracts stabilize.
- Introduce generated clients only after manual methods create drift or maintenance pressure.
