# iOS

## Purpose

This directory reserves ownership for a future native iOS surface.

## Ownership

No native app is scaffolded in Phase 1. The directory exists only to document the intended boundary.

## Dependency Boundaries

- Do not add native runtime code until there is a real product requirement.
- Future native code must use explicit shared contracts or SDKs.
- Native code must not read `services/*` or `ai-factory/*` directly.

## Evolution

Create the native project only after the H5 and admin surfaces expose a clear workflow that requires native capabilities.
