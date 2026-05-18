# Memory

## Purpose

This directory stores explicit AI factory memory for human and agent collaboration.

## Source Of Truth

Durable memory owns stable project knowledge. Working memory owns temporary execution context.

## Boundaries

Runtime code must not read arbitrary memory files directly. Future runtime access must use explicit loaders or repositories.

## Evolution

Add indexing only after Markdown retrieval becomes insufficient for real work.
