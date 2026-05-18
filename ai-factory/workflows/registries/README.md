# Workflow Registries

## Purpose

This directory will document named workflow declarations when executable workflows are introduced.

## Source Of Truth

Phase 1 has no executable workflow registry.

Future workflows must declare:

- id
- owner
- trigger
- inputs
- outputs
- states
- memory domains

## Boundaries

Workflows must not be auto-discovered. Runtime code must load named workflows through explicit configuration.

## Evolution

Add registry structure only when workflow ownership, review expectations, and runtime loading rules are defined.
