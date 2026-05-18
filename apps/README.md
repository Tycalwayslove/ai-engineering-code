# Apps

## Purpose

`apps/` contains user-facing product surfaces for the AI-native software factory.

## Ownership

- `h5` owns the mobile-first web surface.
- `admin` owns the operator web surface.
- `ios` and `android` are placeholders for future native surfaces.

## Dependency Boundaries

- Apps may depend on shared packages under `packages/`.
- Apps must not import `services/*` or `ai-factory/*`.
- Apps must not call backend endpoints directly or implement custom networking.
- Future backend access must flow through an explicit SDK or gateway package.

## Evolution

Add app-specific features only after contracts and shared package ownership are clear. Native apps should start from a real product need, not placeholder scaffolding.
