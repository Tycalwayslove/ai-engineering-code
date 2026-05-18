# AI 原生软件工厂启动实施计划

> **给智能体工作者：** 必须使用子技能：`superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans`，按任务逐步执行本计划。步骤使用复选框（`- [ ]`）语法跟踪。

**目标：** 启动一个多语言 AI 原生软件工厂 monorepo，包含可运行的 TypeScript 前端基础、Python/FastAPI 后端基础、显式 AI 工厂基础设施、稳定契约、本地 Docker 开发、CI 质量门禁和仓库治理文档。

**架构：** 使用薄多语言骨架：TypeScript/pnpm/Turborepo 负责前端应用和共享包，Python/FastAPI 负责后端与 AI 运行时基础，`/contracts` 负责跨运行时协议，`/ai-factory` 负责记忆、提示词、工作流、作战手册、规格和设计系统基础设施。`services/*` 在第一阶段只作为所有权边界，不创建过早的微服务运行时。

**技术栈：** pnpm, Turborepo, TypeScript, Next.js, React, FastAPI, Pydantic, Uvicorn, pytest, ruff, mypy, Docker Compose, GitHub Actions, Markdown, JSON Schema, OpenAPI.

---

## 文件清单

创建或修改以下区域：

- 根工作区： `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `.gitignore`, `.env.example`, `.python-version`, `pyproject.toml`, `docker-compose.yml`
- 应用： `apps/README.md`, `apps/h5`, `apps/admin`, `apps/ios/README.md`, `apps/android/README.md`
- 包： `packages/shared-ui`, `packages/shared-types`, `packages/config`, `packages/sdk`
- Python： `python/README.md`, `python/backend`, `python/agent-runtime`, `python/orchestrator`
- 边界： `services/api-gateway`, `services/conversation-service`, `services/memory-service`, `services/profile-service`
- 契约： `contracts/openapi`, `contracts/events`, `contracts/memory`, `contracts/workflow`
- AI 工厂： `ai-factory/agents`, `ai-factory/workflows`, `ai-factory/memory`, `ai-factory/specs`, `ai-factory/prompts`, `ai-factory/design-system`, `ai-factory/playbooks`
- 基础设施： `infra/docker`
- 文档： `docs/architecture`, `docs/adr`, `docs/conventions`, `docs/onboarding`
- CI： `.github/workflows/ci.yml`

## 任务 1：仓库治理文档

**文件：**
- 创建： `README.md`
- 创建： `docs/README.md`
- 创建： `docs/architecture/README.md`
- 创建： `docs/architecture/overview.md`
- 创建： `docs/adr/README.md`
- 创建： `docs/adr/0001-polyglot-ai-native-monorepo.md`
- 创建： `docs/conventions/README.md`
- 创建： `docs/conventions/ai-readability.md`
- 创建： `docs/conventions/naming.md`
- 创建： `docs/conventions/source-of-truth.md`
- 创建： `docs/conventions/anti-patterns.md`
- 创建： `docs/conventions/evolution.md`
- 创建： `docs/onboarding/README.md`
- 创建： `docs/onboarding/local-development.md`

- [ ] **步骤 1：创建治理文档**

使用 `apply_patch` 添加上述文件。每个文件使用自身主题作为 H1，并包含具体的“目的”“规则”“演进”章节。使用短条目，不要添加没有规则支撑的愿景式文字。

`docs/conventions/ai-readability.md` 必须要求显式命名、浅调用链、可预测所有权、低隐藏行为和低间接层。

`docs/conventions/naming.md` 必须要求目录使用 kebab-case，包名使用 `@ai-code/*` 作用域，Python 包名使用下划线，并且只有描述领域边界的服务边界名称才以 `-service` 结尾。

`docs/conventions/source-of-truth.md` 必须将 `contracts/`、`ai-factory/specs`、`ai-factory/memory`、`ai-factory/prompts`、`ai-factory/workflows`、`ai-factory/design-system`、`packages/`、`python/`、`services/` 和 `docs/adr` 映射到各自权威职责。

`docs/conventions/anti-patterns.md` 必须明确禁止：

```markdown
- 过早微服务化
- 隐藏式运行时发现
- 提示词重复
- 上下文重复
- 魔法式抽象
- 前端业务编排
- 随机模块直接访问记忆
- 动态自动加载 agent、工作流、提示词、工具或记忆
- 在第一个真实工作流之前集成 LangGraph
- 在出现记忆检索压力之前引入向量基础设施
```

`docs/conventions/evolution.md` 必须说明：

```markdown
- 只有出现运营压力且契约成熟后，才拆分服务。
- 只有重复实现模式稳定后，才添加抽象。
- 只有出现真实执行、状态、重放或评审需求后，才把工作流升级为运行时。
- 只有 Markdown 文件检索不足时，才索引记忆。
- 只有人工维护契约造成漂移或集成风险后，才强制契约校验。
- 重大架构变化必须用 ADR 记录。
```

- [ ] **步骤 2：验证治理文档存在**

运行：

```bash
test -f docs/conventions/anti-patterns.md
test -f docs/conventions/evolution.md
test -f docs/adr/0001-polyglot-ai-native-monorepo.md
```

预期：所有命令均以状态码 `0` 退出。

- [ ] **步骤 3：提交治理文档**

```bash
git add README.md docs
git commit -m "docs: add repository governance"
```

## 任务 2：根工作区配置

**文件：**
- 创建： `.gitignore`
- 创建： `.env.example`
- 创建： `.python-version`
- 创建： `package.json`
- 创建： `pnpm-workspace.yaml`
- 创建： `turbo.json`
- 创建： `tsconfig.base.json`
- 创建： `pyproject.toml`

- [ ] **步骤 1：创建根 JavaScript 工作区文件**

`package.json` 必须包含这些脚本：

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

- [ ] **步骤 2：创建根 Python 配置**

`.python-version`:

```text
3.12
```

`pyproject.toml` 必须包含：

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

- [ ] **步骤 3：验证根配置语法**

运行：

```bash
python - <<'PY'
import pathlib
import tomllib

tomllib.loads(pathlib.Path("pyproject.toml").read_text())
PY
pnpm -v
```

预期：`tomllib` 以 `0` 退出；`pnpm -v` 打印版本号。

- [ ] **步骤 4：提交根工作区配置**

```bash
git add .gitignore .env.example .python-version package.json pnpm-workspace.yaml turbo.json tsconfig.base.json pyproject.toml
git commit -m "chore: add root workspace configuration"
```

## 任务 3：契约层

**文件：**
- 创建： `contracts/README.md`
- 创建： `contracts/openapi/README.md`
- 创建： `contracts/openapi/api-gateway.yaml`
- 创建： `contracts/events/README.md`
- 创建： `contracts/memory/README.md`
- 创建： `contracts/memory/memory-document.schema.json`
- 创建： `contracts/workflow/README.md`
- 创建： `contracts/workflow/workflow-manifest.schema.json`

- [ ] **步骤 1：添加最小 OpenAPI 契约**

`contracts/openapi/api-gateway.yaml` 必须定义 `GET /health` 和 `GET /version`：

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

- [ ] **步骤 2：添加记忆文档 schema**

`contracts/memory/memory-document.schema.json` 必须定义：

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

- [ ] **步骤 3：添加工作流 manifest schema**

`contracts/workflow/workflow-manifest.schema.json` 必须定义：

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

- [ ] **步骤 4：提交契约**

```bash
git add contracts
git commit -m "chore: add cross-runtime contracts"
```

## 任务 4：AI 工厂骨架

**文件：**
- 创建设计规格中 `ai-factory/` 下列出的所有目录。
- 在每个主要目录中创建 `README.md`。
- 创建： `ai-factory/agents/registry.md`
- 创建： `ai-factory/workflows/registries/README.md`
- 创建： `ai-factory/workflows/states/README.md`
- 创建： `ai-factory/workflows/templates/README.md`

- [ ] **步骤 1：创建 AI 工厂目录**

运行：

```bash
mkdir -p ai-factory/{agents,workflows/{registries,states,templates},memory/{durable/{architecture,product,design,decisions,api},working/{tasks,iterations,active-context,retrospectives}},specs/{active,archived,templates},prompts/{system,roles,workflows,tasks,evaluation,goal-mode},design-system/{tokens,components,patterns,figma,prompts},playbooks/{feature-development,bugfix,review,release}}
```

预期：命令以状态码 `0` 退出。

- [ ] **步骤 2：添加 AI 工厂 README**

每个主要 AI 工厂区域使用该 README 模式。将 H1 替换为实际目录主题，例如 `# Memory`、`# Prompts` 或 `# Design System`。

```markdown
# Memory

## 目的

该目录存放人类和 agent 协作所需的显式 AI 工厂记忆。

## 单一事实来源

持久记忆拥有稳定项目知识。工作记忆拥有临时执行上下文。

## 边界

运行时代码不得随意直接读取记忆文件。未来运行时访问必须使用显式加载器或仓储。

## 演进

只有 Markdown 检索不足以支撑真实工作后，才添加索引。
```

对于非记忆目录，保留相同标题，并按目录的实际职责调整所有权描述：agents、workflows、specs、prompts、design-system 或 playbooks。

- [ ] **步骤 3：添加显式注册说明**

`ai-factory/agents/registry.md`:

```markdown
# Agent 注册表

第一阶段不包含自主 agent。

未来 agent 条目必须声明：

- id
- 目的
- 输入
- 输出
- 允许的工具
- 允许的记忆领域
- 升级路径

Agent 不得被自动加载。运行时代码必须通过显式配置加载具名 agent。
```

`ai-factory/workflows/registries/README.md`:

```markdown
# 工作流注册表

第一阶段不包含可执行工作流注册表。

未来工作流必须声明：

- id
- 所有者
- 触发方式
- 输入
- 输出
- 状态
- 记忆领域

工作流不得被自动发现。
```

- [ ] **步骤 4：提交 AI 工厂骨架**

```bash
git add ai-factory
git commit -m "chore: add AI factory skeleton"
```

## 任务 5：服务边界文档

**文件：**
- 创建： `services/README.md`
- 创建： `services/api-gateway/README.md`
- 创建： `services/conversation-service/README.md`
- 创建： `services/memory-service/README.md`
- 创建： `services/profile-service/README.md`

- [ ] **步骤 1：创建服务边界 README**

每个服务 README 必须包含该具体结构，并将 H1 改为准确的边界名称。

```markdown
# api-gateway

## 目的

该边界定义公共后端入口。

## 职责

- 拥有 `contracts/openapi/api-gateway.yaml` 中的公共 HTTP API 形态。
- 第一阶段中，面向前端的能力通过集中式 Python 后端路由。

## 非职责

- 第一阶段中不拥有独立运行时。
- 不拥有重复的 Docker、依赖或部署配置。

## 契约

- 拥有：`contracts/openapi/api-gateway.yaml`

## 拆分触发条件

- 独立扩缩容压力。
- 独立部署节奏。
- 成熟 API 契约和运营需求。

## 非触发条件

- 命名偏好。
- 推测性规模。
- 组织结构整齐感。
- 追求对称目录结构。
```

为 `conversation-service`、`memory-service` 和 `profile-service` 调整职责条目，同时保留相同的拆分触发与非触发规则。

- [ ] **步骤 2：验证 services 下不存在运行时文件**

运行：

```bash
find services -type f ! -name README.md
```

预期：无输出。

- [ ] **步骤 3：提交服务边界**

```bash
git add services
git commit -m "docs: add service boundary definitions"
```

## 任务 6：TypeScript 包

**文件：**
- 在 `packages/shared-types`、`packages/shared-ui`、`packages/config` 和 `packages/sdk` 下创建包文件。

- [ ] **步骤 1：创建共享类型包**

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

- [ ] **步骤 2：创建 SDK 包**

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

- [ ] **步骤 3：创建共享 UI 包**

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

- [ ] **步骤 4：验证包类型检查**

运行：

```bash
pnpm install
pnpm typecheck
```

预期：安装成功，类型检查以 `0` 退出。

- [ ] **步骤 5：提交 TypeScript 包**

```bash
git add packages pnpm-lock.yaml
git commit -m "feat: add TypeScript shared packages"
```

## 任务 7：薄 Next.js 应用

**文件：**
- 在 `apps/h5` 和 `apps/admin` 下创建最小 Next.js 应用。
- 在 `apps/ios` 和 `apps/android` 下创建占位 README。

- [ ] **步骤 1：创建 h5 和 admin 应用页面**

每个应用应暴露一个单页，导入共享 UI，且不直接调用后端端点。

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

- [ ] **步骤 2：验证前端构建**

运行：

```bash
pnpm build
pnpm lint
pnpm typecheck
```

预期：所有命令以 `0` 退出。

- [ ] **步骤 3：提交应用**

```bash
git add apps
git commit -m "feat: add thin Next.js app foundations"
```

## 任务 8：Python 后端与 AI 运行时基础

**文件：**
- 创建： `python/README.md`
- 创建： `python/backend/README.md`
- 创建： `python/backend/backend/app/main.py`
- 创建： `python/backend/backend/app/routes/health.py`
- 创建： `python/backend/backend/app/routes/version.py`
- 创建： `python/backend/tests/test_health.py`
- 创建： `python/agent-runtime/README.md`
- 创建： `python/agent-runtime/agent_runtime/__init__.py`
- 创建： `python/orchestrator/README.md`
- 创建： `python/orchestrator/orchestrator/__init__.py`

- [ ] **步骤 1：添加 FastAPI 应用**

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

- [ ] **步骤 2：添加后端健康检查测试**

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

- [ ] **步骤 3：验证 Python 检查**

运行：

```bash
ruff check python
ruff format --check python
mypy python
pytest python
```

预期：所有命令以 `0` 退出。

- [ ] **步骤 4：提交 Python 基础**

```bash
git add python
git commit -m "feat: add Python backend foundation"
```

## 任务 9：Docker 与本地基础设施

**文件：**
- 创建： `docker-compose.yml`
- 创建： `infra/README.md`
- 创建： `infra/docker/README.md`
- 创建： `infra/docker/backend.Dockerfile`
- 创建： `infra/docker/frontend.Dockerfile`

- [ ] **步骤 1：添加 Docker Compose 基线**

`docker-compose.yml` 只应定义：

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

- [ ] **步骤 2：验证 Compose 语法**

运行：

```bash
docker compose config
```

预期：Compose 渲染四个服务并以 `0` 退出。

- [ ] **步骤 3：提交本地基础设施**

```bash
git add docker-compose.yml infra
git commit -m "chore: add local Docker infrastructure"
```

## 任务 10：CI 基线

**文件：**
- 创建： `.github/workflows/ci.yml`

- [ ] **步骤 1：添加 CI 工作流**

`.github/workflows/ci.yml`必须run:

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

- [ ] **步骤 2：提交 CI**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add baseline quality gates"
```

## 任务 11：最终验证

**文件：**
- 只有验证发现具体缺陷时才修改。

- [ ] **步骤 1：运行完整本地验证**

运行：

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

预期：所有命令以 `0` 退出。

- [ ] **步骤 2：确认不存在非预期服务运行时**

运行：

```bash
find services -type f ! -name README.md
```

预期：无输出。

- [ ] **步骤 3：确认不存在隐藏 AI 运行时注册表**

运行：

```bash
find ai-factory -type f \( -name "*.py" -o -name "*.ts" -o -name "*.js" \)
```

预期：无输出。

- [ ] **步骤 4：按需提交验证修复**

如果需要修复：

```bash
git add .
git commit -m "fix: stabilize bootstrap verification"
```

如果不需要修复，不要创建空提交。

## 自检

规格覆盖：

- 顶层仓库结构：任务 1、任务 2、任务 4、任务 5
- TypeScript 工作区：任务 2、任务 6、任务 7
- Python 工作区：任务 2、任务 8
- 契约：任务 3
- AI 工厂：任务 4
- 服务边界：任务 5
- Docker/本地开发：任务 9
- CI 质量门禁：任务 10
- 文档和治理：任务 1
- 最终验证：任务 11

占位内容扫描：

- 不遗留红旗占位语言。
- 每个产出代码的任务都包含具体文件路径和起始内容。

过度工程化控制：

- `services/*` 保持为仅 README。
- `ai-factory/*` 保持为仅 Markdown。
- 不安装 LangGraph 依赖。
- 不引入向量数据库。
- 不创建 Kubernetes 文件。
- 不引入动态运行时发现。
