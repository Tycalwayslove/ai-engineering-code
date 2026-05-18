# AI-Native Software Factory Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap a polyglot AI-native software factory monorepo with runnable TypeScript frontend foundations, a runnable Python/FastAPI backend foundation, explicit AI factory infrastructure, stable contracts, local Docker development, CI quality gates, and repository governance documentation.

**Architecture:** Use a thin polyglot skeleton: TypeScript/pnpm/Turborepo for frontend apps and shared packages, Python/FastAPI for backend and AI runtime foundations, `/contracts` for cross-runtime agreements, and `/ai-factory` for memory, prompts, workflows, playbooks, specs, and design-system infrastructure. Keep `services/*` as ownership boundaries only during Phase 1; do not create premature microservice runtimes.

**Tech Stack:** pnpm, Turborepo, TypeScript, Next.js, React, FastAPI, Pydantic, Uvicorn, pytest, ruff, mypy, Docker Compose, GitHub Actions, Markdown, JSON Schema, OpenAPI.

---

## File Map

Create or modify these areas:

- Root workspace: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `.gitignore`, `.env.example`, `.python-version`, `pyproject.toml`, `docker-compose.yml`
- Apps: `apps/README.md`, `apps/h5`, `apps/admin`, `apps/ios/README.md`, `apps/android/README.md`
- Packages: `packages/shared-ui`, `packages/shared-types`, `packages/config`, `packages/sdk`
- Python: `python/README.md`, `python/backend`, `python/agent-runtime`, `python/orchestrator`
- Boundaries: `services/api-gateway`, `services/conversation-service`, `services/memory-service`, `services/profile-service`
- Contracts: `contracts/openapi`, `contracts/events`, `contracts/memory`, `contracts/workflow`
- AI factory: `ai-factory/agents`, `ai-factory/workflows`, `ai-factory/memory`, `ai-factory/specs`, `ai-factory/prompts`, `ai-factory/design-system`, `ai-factory/playbooks`
- Infrastructure: `infra/docker`
- Documentation: `docs/architecture`, `docs/adr`, `docs/conventions`, `docs/onboarding`
- CI: `.github/workflows/ci.yml`

## Task 1: Repository Governance Documentation

**Files:**
- Create: `README.md`
- Create: `docs/README.md`
- Create: `docs/architecture/README.md`
- Create: `docs/architecture/overview.md`
- Create: `docs/adr/README.md`
- Create: `docs/adr/0001-polyglot-ai-native-monorepo.md`
- Create: `docs/conventions/README.md`
- Create: `docs/conventions/ai-readability.md`
- Create: `docs/conventions/naming.md`
- Create: `docs/conventions/source-of-truth.md`
- Create: `docs/conventions/anti-patterns.md`
- Create: `docs/conventions/evolution.md`
- Create: `docs/onboarding/README.md`
- Create: `docs/onboarding/local-development.md`

- [ ] **Step 1: Create governance docs**

Use `apply_patch` to add the files above. Each file uses its subject as the H1 and includes concrete `Purpose`, `Rules`, and `Evolution` sections. Use short bullets. Do not add aspirational prose without a rule attached.

`docs/conventions/ai-readability.md` must require explicit naming, shallow call chains, predictable ownership, low hidden behavior, and low indirection.

`docs/conventions/naming.md` must require kebab-case directories, scoped package names under `@ai-code/*`, Python package names that use underscores, and service boundary names that end in `-service` only when they describe a domain boundary.

`docs/conventions/source-of-truth.md` must map `contracts/`, `ai-factory/specs`, `ai-factory/memory`, `ai-factory/prompts`, `ai-factory/workflows`, `ai-factory/design-system`, `packages/`, `python/`, `services/`, and `docs/adr` to their authoritative responsibilities.

`docs/conventions/anti-patterns.md` must explicitly prohibit:

```markdown
- premature microservices
- hidden runtime discovery
- prompt duplication
- context duplication
- magical abstractions
- frontend business orchestration
- direct memory access from random modules
- dynamic auto-loading of agents, workflows, prompts, tools, or memory
- LangGraph integration before the first real workflow
- vector infrastructure before memory retrieval pressure exists
```

`docs/conventions/evolution.md` must state:

```markdown
- Extract services only after operational pressure and mature contracts exist.
- Add abstractions only after repeated implementation patterns stabilize.
- Turn workflows into runtimes only after real execution, state, replay, or review needs exist.
- Index memory only after Markdown file retrieval becomes insufficient.
- Enforce contracts only after manual contracts create drift or integration risk.
- Record major architectural shifts with an ADR.
```

- [ ] **Step 2: Verify governance docs exist**

Run:

```bash
test -f docs/conventions/anti-patterns.md
test -f docs/conventions/evolution.md
test -f docs/adr/0001-polyglot-ai-native-monorepo.md
```

Expected: all commands exit with status `0`.

- [ ] **Step 3: Commit governance docs**

```bash
git add README.md docs
git commit -m "docs: add repository governance"
```

## Task 2: Root Workspace Configuration

**Files:**
- Create: `.gitignore`
- Create: `.env.example`
- Create: `.python-version`
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `pyproject.toml`

- [ ] **Step 1: Create root JavaScript workspace files**

`package.json` must include these scripts:

```json
{
  "name": "ai-code",
  "private": true,
  "packageManager": "pnpm@9.15.0",
  "scripts": {
    "dev": "turbo dev --filter=@ai-code/h5 --filter=@ai-code/admin",
    "dev:h5": "pnpm --filter @ai-code/h5 dev",
    "dev:admin": "pnpm --filter @ai-code/admin dev",
    "dev:api": "printf 'Run: uvicorn backend.app.main:app --app-dir python/backend --reload\\n'",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "test": "turbo test",
    "format": "prettier --write ."
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "prettier": "^3.4.2",
    "turbo": "^2.3.3",
    "typescript": "^5.7.2"
  }
}
```

`pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

`turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "lint": {},
    "typecheck": {},
    "test": {}
  }
}
```

- [ ] **Step 2: Create root Python configuration**

`.python-version`:

```text
3.12
```

`pyproject.toml` must include:

```toml
[project]
name = "ai-code"
version = "0.1.0"
description = "AI-native software factory monorepo"
requires-python = ">=3.12"
dependencies = [
  "fastapi>=0.115.0",
  "pydantic>=2.10.0",
  "uvicorn[standard]>=0.32.0"
]

[project.optional-dependencies]
dev = [
  "mypy>=1.13.0",
  "pytest>=8.3.0",
  "ruff>=0.8.0"
]

[tool.ruff]
line-length = 100
target-version = "py312"

[tool.ruff.lint]
select = ["E", "F", "I", "UP", "B"]

[tool.mypy]
python_version = "3.12"
strict = true
packages = ["backend", "agent_runtime", "orchestrator"]
explicit_package_bases = true
mypy_path = ["python/backend", "python/agent-runtime", "python/orchestrator"]

[tool.pytest.ini_options]
testpaths = ["python"]
pythonpath = ["python/backend", "python/agent-runtime", "python/orchestrator"]
```

- [ ] **Step 3: Verify root config syntax**

Run:

```bash
python - <<'PY'
import pathlib
import tomllib

tomllib.loads(pathlib.Path("pyproject.toml").read_text())
PY
pnpm -v
```

Expected: `tomllib` exits `0`; `pnpm -v` prints a version.

- [ ] **Step 4: Commit root workspace config**

```bash
git add .gitignore .env.example .python-version package.json pnpm-workspace.yaml turbo.json tsconfig.base.json pyproject.toml
git commit -m "chore: add root workspace configuration"
```

## Task 3: Contracts Layer

**Files:**
- Create: `contracts/README.md`
- Create: `contracts/openapi/README.md`
- Create: `contracts/openapi/api-gateway.yaml`
- Create: `contracts/events/README.md`
- Create: `contracts/memory/README.md`
- Create: `contracts/memory/memory-document.schema.json`
- Create: `contracts/workflow/README.md`
- Create: `contracts/workflow/workflow-manifest.schema.json`

- [ ] **Step 1: Add minimal OpenAPI contract**

`contracts/openapi/api-gateway.yaml` must define `GET /health` and `GET /version`:

```yaml
openapi: 3.1.0
info:
  title: AI Code API Gateway
  version: 0.1.0
paths:
  /health:
    get:
      operationId: getHealth
      responses:
        "200":
          description: Service health
          content:
            application/json:
              schema:
                type: object
                required: [status]
                properties:
                  status:
                    type: string
                    enum: [ok]
  /version:
    get:
      operationId: getVersion
      responses:
        "200":
          description: Service version
          content:
            application/json:
              schema:
                type: object
                required: [name, version]
                properties:
                  name:
                    type: string
                  version:
                    type: string
```

- [ ] **Step 2: Add memory document schema**

`contracts/memory/memory-document.schema.json` must define:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://ai-code.local/contracts/memory/memory-document.schema.json",
  "title": "MemoryDocument",
  "type": "object",
  "required": ["id", "domain", "scope", "title", "sourcePath"],
  "properties": {
    "id": { "type": "string" },
    "domain": {
      "type": "string",
      "enum": ["architecture", "product", "design", "decisions", "api", "tasks", "iterations", "active-context", "retrospectives"]
    },
    "scope": {
      "type": "string",
      "enum": ["durable", "working"]
    },
    "title": { "type": "string" },
    "sourcePath": { "type": "string" },
    "tags": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "additionalProperties": false
}
```

- [ ] **Step 3: Add workflow manifest schema**

`contracts/workflow/workflow-manifest.schema.json` must define:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://ai-code.local/contracts/workflow/workflow-manifest.schema.json",
  "title": "WorkflowManifest",
  "type": "object",
  "required": ["id", "name", "owner", "inputs", "outputs", "states", "memoryDomains"],
  "properties": {
    "id": { "type": "string" },
    "name": { "type": "string" },
    "owner": { "type": "string" },
    "inputs": {
      "type": "array",
      "items": { "type": "string" }
    },
    "outputs": {
      "type": "array",
      "items": { "type": "string" }
    },
    "states": {
      "type": "array",
      "items": { "type": "string" }
    },
    "memoryDomains": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "additionalProperties": false
}
```

- [ ] **Step 4: Commit contracts**

```bash
git add contracts
git commit -m "chore: add cross-runtime contracts"
```

## Task 4: AI Factory Skeleton

**Files:**
- Create all directories listed under `ai-factory/` in the design spec.
- Create `README.md` in every major directory.
- Create: `ai-factory/agents/registry.md`
- Create: `ai-factory/workflows/registries/README.md`
- Create: `ai-factory/workflows/states/README.md`
- Create: `ai-factory/workflows/templates/README.md`

- [ ] **Step 1: Create AI factory directories**

Run:

```bash
mkdir -p ai-factory/{agents,workflows/{registries,states,templates},memory/{durable/{architecture,product,design,decisions,api},working/{tasks,iterations,active-context,retrospectives}},specs/{active,archived,templates},prompts/{system,roles,workflows,tasks,evaluation,goal-mode},design-system/{tokens,components,patterns,figma,prompts},playbooks/{feature-development,bugfix,review,release}}
```

Expected: command exits `0`.

- [ ] **Step 2: Add AI factory READMEs**

Use this README pattern for each major AI factory area. Replace the H1 with the actual directory subject, such as `# Memory`, `# Prompts`, or `# Design System`.

```markdown
# Memory

## Purpose

This directory stores explicit AI factory memory for human and agent collaboration.

## Source Of Truth

Durable memory owns stable project knowledge. Working memory owns temporary execution context.

## Boundaries

Runtime code must not read arbitrary memory files directly. Future runtime access must use explicit loaders or repositories.

## Evolution

Add indexing only after Markdown retrieval becomes insufficient for real work.
```

For non-memory directories, keep the same headings and adapt the ownership sentence to the directory's actual responsibility: agents, workflows, specs, prompts, design-system, or playbooks.

- [ ] **Step 3: Add explicit registry notes**

`ai-factory/agents/registry.md`:

```markdown
# Agent Registry

Phase 1 has no autonomous agents.

Future agent entries must declare:

- id
- purpose
- inputs
- outputs
- allowed tools
- allowed memory domains
- escalation path

Agents must not be auto-loaded. Runtime code must load named agents through explicit configuration.
```

`ai-factory/workflows/registries/README.md`:

```markdown
# Workflow Registries

Phase 1 has no executable workflow registry.

Future workflows must declare:

- id
- owner
- trigger
- inputs
- outputs
- states
- memory domains

Workflows must not be auto-discovered.
```

- [ ] **Step 4: Commit AI factory skeleton**

```bash
git add ai-factory
git commit -m "chore: add AI factory skeleton"
```

## Task 5: Service Boundary Documentation

**Files:**
- Create: `services/README.md`
- Create: `services/api-gateway/README.md`
- Create: `services/conversation-service/README.md`
- Create: `services/memory-service/README.md`
- Create: `services/profile-service/README.md`

- [ ] **Step 1: Create service boundary READMEs**

Each service README must include this concrete structure, with the H1 changed to the exact boundary name.

```markdown
# api-gateway

## Purpose

This boundary defines the public backend entrypoint.

## Responsibilities

- Own public HTTP API shape with `contracts/openapi/api-gateway.yaml`.
- Route frontend-facing capabilities through the centralized Python backend during Phase 1.

## Non-Responsibilities

- Does not own a separate runtime in Phase 1.
- Does not own duplicated Docker, dependency, or deployment configuration.

## Contracts

- Owns: `contracts/openapi/api-gateway.yaml`

## Extraction Triggers

- Independent scaling pressure.
- Separate deployment cadence.
- Mature API contract and operational need.

## Non-Triggers

- Naming preference.
- Speculative scale.
- Organizational neatness.
- Desire for symmetric folder structures.
```

Adapt the responsibility bullets for `conversation-service`, `memory-service`, and `profile-service` while preserving the same extraction and non-trigger rules.

- [ ] **Step 2: Verify no runtime files exist under services**

Run:

```bash
find services -type f ! -name README.md
```

Expected: no output.

- [ ] **Step 3: Commit service boundaries**

```bash
git add services
git commit -m "docs: add service boundary definitions"
```

## Task 6: TypeScript Packages

**Files:**
- Create package files under `packages/shared-types`, `packages/shared-ui`, `packages/config`, and `packages/sdk`.

- [ ] **Step 1: Create shared type package**

`packages/shared-types/src/index.ts`:

```ts
export type HealthStatus = {
  status: "ok";
};

export type VersionInfo = {
  name: string;
  version: string;
};
```

- [ ] **Step 2: Create SDK package**

`packages/sdk/src/index.ts`:

```ts
import type { HealthStatus, VersionInfo } from "@ai-code/shared-types";

export type ApiClientOptions = {
  baseUrl: string;
  getAuthToken?: () => string | Promise<string>;
};

export class ApiClient {
  private readonly baseUrl: string;
  private readonly getAuthToken?: () => string | Promise<string>;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.getAuthToken = options.getAuthToken;
  }

  async getHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>("/health");
  }

  async getVersion(): Promise<VersionInfo> {
    return this.request<VersionInfo>("/version");
  }

  private async request<T>(path: string): Promise<T> {
    const headers: Record<string, string> = {
      Accept: "application/json"
    };

    const token = await this.getAuthToken?.();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, { headers });
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }
}
```

- [ ] **Step 3: Create shared UI package**

`packages/shared-ui/src/primitives/Button.tsx`:

```tsx
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function Button({ children, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} {...props}>
      {children}
    </button>
  );
}
```

`packages/shared-ui/src/index.ts`:

```ts
export { Button } from "./primitives/Button";
export type { ButtonProps } from "./primitives/Button";
```

- [ ] **Step 4: Verify package typecheck**

Run:

```bash
pnpm install
pnpm typecheck
```

Expected: install succeeds and typecheck exits `0`.

- [ ] **Step 5: Commit TypeScript packages**

```bash
git add packages pnpm-lock.yaml
git commit -m "feat: add TypeScript shared packages"
```

## Task 7: Thin Next.js Apps

**Files:**
- Create minimal Next.js apps under `apps/h5` and `apps/admin`.
- Create placeholder READMEs under `apps/ios` and `apps/android`.

- [ ] **Step 1: Create h5 and admin app pages**

Each app should expose a single page that imports shared UI and does not call backend endpoints directly.

`apps/h5/src/app/page.tsx`:

```tsx
import { Button } from "@ai-code/shared-ui";

export default function HomePage() {
  return (
    <main>
      <h1>AI Code H5</h1>
      <p>Mobile-first web surface for the AI-native software factory.</p>
      <Button>Ready</Button>
    </main>
  );
}
```

`apps/admin/src/app/page.tsx`:

```tsx
import { Button } from "@ai-code/shared-ui";

export default function AdminPage() {
  return (
    <main>
      <h1>AI Code Admin</h1>
      <p>Operator surface for the AI-native software factory.</p>
      <Button>Ready</Button>
    </main>
  );
}
```

- [ ] **Step 2: Verify frontend build**

Run:

```bash
pnpm build
pnpm lint
pnpm typecheck
```

Expected: all commands exit `0`.

- [ ] **Step 3: Commit apps**

```bash
git add apps
git commit -m "feat: add thin Next.js app foundations"
```

## Task 8: Python Backend And AI Runtime Foundations

**Files:**
- Create: `python/README.md`
- Create: `python/backend/README.md`
- Create: `python/backend/backend/app/main.py`
- Create: `python/backend/backend/app/routes/health.py`
- Create: `python/backend/backend/app/routes/version.py`
- Create: `python/backend/tests/test_health.py`
- Create: `python/agent-runtime/README.md`
- Create: `python/agent-runtime/agent_runtime/__init__.py`
- Create: `python/orchestrator/README.md`
- Create: `python/orchestrator/orchestrator/__init__.py`

- [ ] **Step 1: Add FastAPI app**

`python/backend/backend/app/main.py`:

```python
from fastapi import FastAPI

from backend.app.routes.health import router as health_router
from backend.app.routes.version import router as version_router

app = FastAPI(title="AI Code API Gateway", version="0.1.0")
app.include_router(health_router)
app.include_router(version_router)
```

`python/backend/backend/app/routes/health.py`:

```python
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def get_health() -> dict[str, str]:
    return {"status": "ok"}
```

`python/backend/backend/app/routes/version.py`:

```python
from fastapi import APIRouter

router = APIRouter()


@router.get("/version")
def get_version() -> dict[str, str]:
    return {"name": "ai-code-api", "version": "0.1.0"}
```

- [ ] **Step 2: Add backend health test**

`python/backend/tests/test_health.py`:

```python
from fastapi.testclient import TestClient

from backend.app.main import app


def test_health_returns_ok() -> None:
    client = TestClient(app)
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

- [ ] **Step 3: Verify Python checks**

Run:

```bash
ruff check python
ruff format --check python
mypy python
pytest python
```

Expected: all commands exit `0`.

- [ ] **Step 4: Commit Python foundations**

```bash
git add python
git commit -m "feat: add Python backend foundation"
```

## Task 9: Docker And Local Infrastructure

**Files:**
- Create: `docker-compose.yml`
- Create: `infra/README.md`
- Create: `infra/docker/README.md`
- Create: `infra/docker/backend.Dockerfile`
- Create: `infra/docker/frontend.Dockerfile`

- [ ] **Step 1: Add Docker Compose baseline**

`docker-compose.yml` must define only:

```yaml
services:
  frontend:
    build:
      context: .
      dockerfile: infra/docker/frontend.Dockerfile
    command: pnpm dev:h5
    ports:
      - "3000:3000"
    depends_on:
      - backend

  backend:
    build:
      context: .
      dockerfile: infra/docker/backend.Dockerfile
    command: uvicorn backend.app.main:app --app-dir python/backend --host 0.0.0.0 --port 8000 --reload
    ports:
      - "8000:8000"

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ai_code
      POSTGRES_PASSWORD: ai_code
      POSTGRES_DB: ai_code
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

- [ ] **Step 2: Verify Compose syntax**

Run:

```bash
docker compose config
```

Expected: Compose renders the four services and exits `0`.

- [ ] **Step 3: Commit local infrastructure**

```bash
git add docker-compose.yml infra
git commit -m "chore: add local Docker infrastructure"
```

## Task 10: CI Baseline

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Add CI workflow**

`.github/workflows/ci.yml` must run:

```yaml
name: CI

on:
  push:
    branches: ["master", "main"]
  pull_request:

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9.15.0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pip install -e ".[dev]"
      - run: ruff check python
      - run: ruff format --check python
      - run: mypy python
      - run: pytest python
      - run: docker compose config
```

- [ ] **Step 2: Commit CI**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add baseline quality gates"
```

## Task 11: Final Verification

**Files:**
- Modify only if verification reveals a concrete defect.

- [ ] **Step 1: Run complete local verification**

Run:

```bash
pnpm install
pnpm build
pnpm lint
pnpm typecheck
pnpm test
ruff check python
ruff format --check python
mypy python
pytest python
docker compose config
```

Expected: all commands exit `0`.

- [ ] **Step 2: Confirm no unintended service runtimes exist**

Run:

```bash
find services -type f ! -name README.md
```

Expected: no output.

- [ ] **Step 3: Confirm no hidden AI runtime registries exist**

Run:

```bash
find ai-factory -type f \( -name "*.py" -o -name "*.ts" -o -name "*.js" \)
```

Expected: no output.

- [ ] **Step 4: Commit verification fixes if needed**

If fixes were required:

```bash
git add .
git commit -m "fix: stabilize bootstrap verification"
```

If no fixes were required, do not create an empty commit.

## Self-Review

Spec coverage:

- Top-level repository structure: Task 1, Task 2, Task 4, Task 5
- TypeScript workspace: Task 2, Task 6, Task 7
- Python workspace: Task 2, Task 8
- Contracts: Task 3
- AI factory: Task 4
- Service boundaries: Task 5
- Docker/local development: Task 9
- CI quality gates: Task 10
- Documentation and governance: Task 1
- Final validation: Task 11

Placeholder scan:

- No red-flag placeholder language remains.
- Every code-producing task includes concrete file paths and starter contents.

Overengineering controls:

- `services/*` remains README-only.
- `ai-factory/*` remains Markdown-only.
- No LangGraph dependency is installed.
- No vector database is introduced.
- No Kubernetes files are created.
- No dynamic runtime discovery is introduced.
