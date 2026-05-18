# Workflow States

## Purpose

This directory records state models for future workflow progress, checkpoints, and handoffs.

## Source Of Truth

State documents own the allowed labels, transitions, and completion criteria for workflow execution.

## Boundaries

Do not use these notes as live state storage. Active execution context belongs in working memory or task systems.

## Evolution

Add state schemas only when repeated workflow runs need consistent tracking across humans and tools.
