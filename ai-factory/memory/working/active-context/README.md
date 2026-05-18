# Active Context Memory

## Purpose

This directory stores temporary active context needed to resume current work.

## Source Of Truth

Active context memory owns the near-term state that would otherwise live only in conversation.

## Boundaries

Do not store secrets, credentials, or broad workspace dumps here.

## Evolution

Prune stale context aggressively and promote only durable facts to durable memory.
