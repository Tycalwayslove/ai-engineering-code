# AI-Native Software Factory Monorepo Design

Date: 2026-05-18
Status: Approved for implementation planning

## Purpose

This repository is a long-term foundation for an AI-native software factory. It must support product applications, backend and AI runtimes, durable memory, workflow orchestration, design-system infrastructure, and stable cross-runtime contracts.

Phase 1 intentionally bootstraps a lightweight skeleton. The goal is a stable, runnable, inspectable foundation, not production sophistication or autonomous agent behavior.

## Design Principles

- Optimize for AI readability, deterministic navigation, predictable ownership, and low cognitive load.
- Prefer explicit structure over hidden abstractions.
- Keep local development simple and transparent.
- Keep workflows manual-first during Phase 1.
- Treat specs, memory, prompts, workflows, contracts, and design-system files as first-class infrastructure.
- Implement before abstracting. Do not add plugin systems, generators, event systems, framework adapters, infrastructure layers, or registries beyond necessity until real pressure exists.
- Preserve human inspectability. Humans must be able to inspect contracts, prompts, memory, orchestration paths, and workflow state.
- Record major architectural shifts with ADRs, migration reasoning, source-of-truth updates, and dependency impact review.

## Top-Level Structure

```text
/
  apps/
  services/
  python/
  packages/
  contracts/
  ai-factory/
  infra/
  docs/
  scripts/
  .github/
```

`apps/` contains user-facing clients.

`services/` contains service boundary definitions, not separate runtimes in Phase 1.

`python/` contains executable backend and AI runtime foundations.

`packages/` contains TypeScript packages shared by frontend apps and tooling.

`contracts/` contains machine-readable cross-runtime agreements.

`ai-factory/` contains AI-native operating infrastructure.

`infra/` contains local development and deployment scaffolding.

`docs/` contains human-facing architecture, conventions, onboarding, and ADRs.

`scripts/` contains explicit automation entrypoints.

`.github/` contains CI/CD workflow baselines.

Every major directory must include a `README.md` that states ownership purpose, runtime responsibility, dependency boundaries, and intended evolution path.

## Workspace And Runtime Setup

The repository uses two clean ecosystems under one monorepo.

TypeScript workspace:

```text
package.json
pnpm-workspace.yaml
turbo.json
tsconfig.base.json
```

Python workspace:

```text
pyproject.toml
.python-version
```

`uv.lock` should be generated only after dependencies resolve.

Local development must remain transparent:

```bash
pnpm dev
pnpm dev:h5
pnpm dev:admin
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm format
```

Python runtime commands remain visible:

```bash
uvicorn backend.app.main:app --app-dir python/backend --reload
ruff check python
ruff format python
mypy python
pytest python
```

`pnpm dev` starts frontend workspaces. Python runtime commands stay explicit and visible. Early bootstrap should avoid hidden orchestration wrappers.

## Applications

```text
apps/
  README.md
  h5/
    README.md
    src/
    public/
  admin/
    README.md
    src/
    public/
  ios/
    README.md
  android/
    README.md
```

`apps/h5` is the mobile-first web surface.

`apps/admin` is the internal operator/admin surface.

`apps/ios` and `apps/android` are ownership placeholders only during Phase 1.

Frontend apps must stay thin. Business logic should move toward `packages/sdk`, backend services, orchestrator interfaces, and workflow-driven backend behavior. Apps must not contain frontend orchestration logic, duplicated state machines, scattered business logic, direct endpoint calls, service imports, or direct AI factory reads.

## TypeScript Packages

```text
packages/
  README.md
  shared-ui/
    README.md
    src/
      primitives/
      composites/
      layouts/
  shared-types/
    README.md
    src/
  config/
    README.md
    eslint/
    typescript/
  sdk/
    README.md
    src/
```

`packages/shared-ui` owns reusable UI primitives, composites, and layouts.

`packages/shared-types` owns TypeScript-facing types. It may mirror `/contracts`, but it is not the cross-runtime source of truth.

`packages/config` owns shared TypeScript tooling configuration.

`packages/sdk` owns frontend API access. It is the only approved frontend path to backend capabilities.

The SDK owns request handling, retry policy, auth token handling, API typing, and transport abstraction. Apps must not implement custom networking behavior.

Dependency direction:

```text
apps/* -> packages/sdk
apps/* -> packages/shared-ui
apps/* -> packages/shared-types
apps/* -> packages/config
packages/sdk -> packages/shared-types
packages/shared-ui -> packages/shared-types when needed
```

No package should import from an app.

## Python Runtime

```text
python/
  README.md
  backend/
    README.md
    app/
      routes/
      services/
  agent-runtime/
    README.md
    agent_runtime/
  orchestrator/
    README.md
    orchestrator/
```

`python/backend` owns the first runnable FastAPI application. It exposes health and version routes at bootstrap.

`python/agent-runtime` owns agent execution primitives. It remains framework-light until real workflow needs justify LangGraph or similar tooling.

`python/orchestrator` owns explicit workflow execution, named registrations, declared inputs, and visible state transitions.

Backend layering:

```text
routes
  -> services
    -> orchestrator interfaces
      -> agent-runtime or memory interfaces
```

Routes must not call workflows directly, load prompts directly, or access memory files directly.

Python dependency direction:

```text
backend -> orchestrator
orchestrator -> agent-runtime
orchestrator -> explicit workflow definitions
agent-runtime -> explicit prompt and memory inputs
```

Avoid circular imports, runtime magic, implicit dependency injection, deep inheritance, and dynamic discovery.

## Service Boundaries

```text
services/
  README.md
  api-gateway/
    README.md
  conversation-service/
    README.md
  memory-service/
    README.md
  profile-service/
    README.md
```

`services/*` are ownership and contract boundaries during Phase 1. They are not independent runtimes, and they must not duplicate configs, infra, Dockerfiles, dependency trees, or hidden service scaffolds.

Each service README must define:

- why the boundary exists
- responsibilities
- non-responsibilities
- contracts it owns or consumes
- pressure that would justify extraction
- pressure that should not justify extraction

Initial boundaries:

- `api-gateway`: public backend entry boundary
- `conversation-service`: conversation and session domain boundary
- `memory-service`: durable and working memory access boundary
- `profile-service`: user, profile, and context boundary

Extraction is allowed only after clear operational pressure exists, such as independent scaling needs, separate data ownership, separate deployment cadence, mature contracts, or a real operational requirement.

## Contracts

```text
contracts/
  README.md
  openapi/
    README.md
    api-gateway.yaml
  events/
    README.md
  memory/
    README.md
    memory-document.schema.json
  workflow/
    README.md
    workflow-manifest.schema.json
```

`contracts/` owns machine-readable cross-runtime agreements.

Source-of-truth rules:

- `/contracts/openapi` defines HTTP API shape.
- `/contracts/events` defines event payloads when events exist.
- `/contracts/memory` defines durable and working memory metadata.
- `/contracts/workflow` defines workflow manifest shape.
- `packages/shared-types` may mirror contracts for TypeScript use.
- Python models may mirror contracts for backend use.
- Runtime code must not silently redefine contracts.

Contracts should start minimal and readable. Enforcement can grow later.

## AI Factory

```text
ai-factory/
  README.md
  agents/
    README.md
    registry.md
  workflows/
    README.md
    registries/
    states/
    templates/
  memory/
    README.md
    durable/
      architecture/
      product/
      design/
      decisions/
      api/
    working/
      tasks/
      iterations/
      active-context/
      retrospectives/
  specs/
    README.md
    active/
    archived/
    templates/
  prompts/
    README.md
    system/
    roles/
    workflows/
    tasks/
    evaluation/
    goal-mode/
  design-system/
    README.md
    tokens/
    components/
    patterns/
    figma/
    prompts/
  playbooks/
    README.md
    feature-development/
    bugfix/
    review/
    release/
```

`ai-factory/` is structured operating context for AI-native development.

`agents/` stores explicit agent definitions: purpose, inputs, outputs, allowed tools, memory access rules, and escalation paths.

`workflows/` stores workflow definitions, templates, states, and registries. Workflows must declare inputs, outputs, state transitions, and memory domains used.

`memory/` separates durable memory from working memory.

Durable memory stores stable project knowledge:

```text
memory/durable/architecture
memory/durable/product
memory/durable/design
memory/durable/decisions
memory/durable/api
```

Working memory stores temporary execution context:

```text
memory/working/tasks
memory/working/iterations
memory/working/active-context
memory/working/retrospectives
```

`specs/` stores implementation intent.

`prompts/` stores layered prompt infrastructure. Avoid giant universal prompts. Use system prompts, role prompts, workflow prompts, task prompts, evaluation prompts, and Goal Mode prompts separately.

`design-system/` stores UI generation rules, design rationale, tokens, component guidance, patterns, Figma references, and design prompts.

`playbooks/` stores operational guidance for humans and agents.

Markdown remains the source of truth during Phase 1. Do not introduce databases, registries, vector infrastructure, schema engines, or automation until operational pressure exists.

Runtime code may read AI factory files only through explicit paths, loaders, or registries. No dynamic auto-loading of agents, workflows, prompts, tools, or memory.

## Source Of Truth

```text
contracts/                  runtime agreements
ai-factory/specs            implementation intent
ai-factory/memory           historical and execution memory
ai-factory/prompts          prompt infrastructure
ai-factory/workflows        workflow operating model
ai-factory/design-system    UI generation rules
ai-factory/playbooks        operational guidance
packages/                   TypeScript implementation
python/                     backend and AI runtime implementation
services/                   service ownership boundaries
docs/adr                    architectural reasoning
```

Runtime code must not silently redefine source-of-truth content.

## Workflow Discipline

Phase 1 workflows are manual-first. There are no autonomous loops, self-modifying workflows, auto-executing agents, hidden prompt injection, magical runtime scanning, or invisible workflow behavior.

Workflow execution should eventually support logging, state inspection, replayability, and deterministic tracing. Bootstrap only needs the directory and convention foundation.

## Memory Discipline

Memory access should eventually flow through explicit interfaces, repositories, and loaders. Avoid arbitrary file access across the system.

Human-readable Markdown remains the source of truth. Indexed memory or RAG systems can appear later only when needed.

## Design-System Discipline

`ai-factory/design-system` owns design intent and AI generation rules.

`packages/shared-ui` owns implemented UI code.

Design tokens may later emit CSS variables, Tailwind configuration, or platform tokens, but bootstrap should keep this readable and explicit.

## Local Development Infrastructure

```text
docker-compose.yml
infra/
  README.md
  docker/
    README.md
    backend.Dockerfile
    frontend.Dockerfile
```

Initial Docker Compose services:

- `frontend`
- `backend`
- `postgres`
- `redis`

No Kubernetes. No vector database until memory/RAG implementation needs one. No separate service containers for `services/*` during Phase 1.

## CI/CD Baseline

```text
.github/
  workflows/
    ci.yml
```

Initial CI quality gates:

- install pnpm dependencies
- TypeScript lint
- TypeScript typecheck
- TypeScript test placeholder
- Python ruff check
- Python format check
- Python mypy
- Python pytest placeholder
- Docker Compose syntax check when feasible

CI validates skeleton health. It does not simulate production.

## Documentation

```text
docs/
  README.md
  architecture/
    README.md
    overview.md
  adr/
    README.md
    0001-polyglot-ai-native-monorepo.md
  conventions/
    README.md
    ai-readability.md
    naming.md
    source-of-truth.md
    anti-patterns.md
    evolution.md
  onboarding/
    README.md
    local-development.md
```

`docs/architecture` explains the system shape.

`docs/adr` records architectural decisions and reasoning.

`docs/conventions` defines stable rules for humans and agents.

`docs/onboarding` explains how to run the repo.

`docs/conventions/anti-patterns.md` must prohibit premature microservices, hidden runtime discovery, prompt duplication, context duplication, magical abstractions, frontend business orchestration, and direct memory access from random modules.

`docs/conventions/evolution.md` must define when extraction is allowed, when abstraction is justified, when workflows become runtimes, when memory becomes indexed, and when contracts become enforced.

## Anti-Patterns

Avoid:

- premature microservices
- hidden runtime discovery
- prompt duplication
- context duplication
- magical abstractions
- frontend business orchestration
- direct memory access from random modules
- dynamic auto-loading of agents, workflows, prompts, tools, or memory
- production infrastructure before product pressure
- LangGraph integration before the first real workflow
- event systems before real event pressure
- deep inheritance and meta-programming
- hidden dependency injection
- duplicate source-of-truth definitions

## Evolution Rules

Abstraction is justified only when implementation shows repeated, stable patterns.

Service extraction is justified only by operational pressure and mature contracts.

Workflow definitions become runtimes only after real workflows need execution, state, logging, replay, or human review.

Memory becomes indexed only after file-based memory becomes insufficient for real retrieval tasks.

Contracts become enforced after hand-maintained contracts begin creating drift or integration risk.

Every major architectural shift requires an ADR, migration reasoning, source-of-truth updates, and dependency impact review.

## Implementation Scope

Phase 1 should produce:

- stable repository skeleton
- runnable frontend foundations
- runnable FastAPI foundation
- explicit AI factory directories
- explicit service boundary READMEs
- minimal contracts
- Docker Compose baseline
- CI baseline
- architecture and convention documentation

Phase 1 should not produce:

- production distributed systems
- Kubernetes
- autonomous agents
- self-modifying workflows
- vector memory infrastructure
- workflow automation
- premature microservice runtimes
- LangGraph integration without a real workflow

## Open Risks To Watch

The design includes many first-class directories. Implementation must keep each directory shallow and purposeful so the skeleton remains readable.

The AI factory structure can become ceremonial if files do not state ownership and evolution paths clearly.

The contract layer can drift from implementation unless later work adds deliberate validation or generation.

The service boundary layer can invite premature extraction unless service READMEs explicitly define non-triggers.

The SDK boundary can erode if apps are allowed to add ad hoc networking.

## Self-Review Findings

No placeholders remain in this spec.

No contradiction remains between the service boundary model and the Phase 1 runtime model. `services/*` defines ownership and contracts only; `python/backend` remains the centralized runnable backend.

No contradiction remains between workflow readiness and framework-light implementation. The repository reserves workflow, state, and registry locations, but it does not install orchestration frameworks before a real workflow exists.

No contradiction remains between machine-readable contracts and Markdown-first operation. `/contracts` holds minimal schemas and OpenAPI files; AI factory memory, prompts, playbooks, and specs remain readable Markdown sources of truth.

The largest overengineering risk is directory count. The implementation plan must create shallow READMEs and minimal placeholder files rather than deep scaffolds.

The second overengineering risk is accidental runtime duplication. The implementation plan must avoid separate service dependency trees, per-service Dockerfiles, and premature framework adapters.

The third overengineering risk is ceremonial AI infrastructure. Each AI factory README must explain when the directory is used and what should not live there.
