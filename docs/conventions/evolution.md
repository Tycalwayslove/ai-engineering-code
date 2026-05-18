# Evolution

## Purpose

- Define when the repository may grow new runtimes, abstractions, indexing, or enforcement.
- Keep early implementation direct until repeated pressure proves a need.
- Make architecture changes deliberate and reviewable.

## Rules

- Extract services only after operational pressure and mature contracts exist.
- Add abstractions only after repeated implementation patterns stabilize.
- Turn workflows into runtimes only after real execution, state, replay, or review needs exist.
- Index memory only after Markdown file retrieval becomes insufficient.
- Enforce contracts only after manual contracts create drift or integration risk.
- Record major architectural shifts with an ADR.

## Evolution

- Recheck this document before adding infrastructure that changes how code is built, run, or reviewed.
- Tighten rules when the repository shows repeated drift.
- Move stable exceptions into ADRs instead of leaving them as tribal knowledge.
