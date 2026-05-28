# 本地开发

## 目的

- 提供 monorepo 的本地开发入口。
- 在添加应用、Python 运行时和 Docker 服务之前，保持设置预期可见。
- 避免在相关工具存在前发明命令。

## 规则

- `package.json` 存在后，使用根工作区命令。
- `pyproject.toml` 存在后，从仓库根目录运行 Python 命令。
- 只有添加 `docker-compose.yml` 后，才使用 Docker Compose。
- 本地环境值模板保留在 `.env.example`；真实密钥写入根目录 `.env.local`，不要记录或提交密钥。
- 设置命令或所需工具版本变化时更新此文件。

## 本地密钥

后端启动时会自动读取仓库根目录的 `.env.local`，并且不会覆盖终端里已经 `export` 的变量。

推荐使用 DeepSeek：

```bash
cp .env.example .env.local
```

然后编辑 `.env.local`：

```bash
AI_PLANNER_MODE=llm_first
AI_PLANNER_PROVIDER=deepseek
AI_PLANNER_MODEL=deepseek-v4-flash
DEEPSEEK_API_KEY=你的_deepseek_key
```

如果使用 OpenAI：

```bash
AI_PLANNER_MODE=llm_first
AI_PLANNER_PROVIDER=openai
AI_PLANNER_MODEL=gpt-4.1-mini
OPENAI_API_KEY=你的_openai_key
```

`.env.local` 已被 `.gitignore` 忽略，适合保存本机密钥。

## LLM 调试日志

每次 LLM provider 调用都会在后端日志里输出安全摘要：

```text
LLM planner provider call completed provider=DeepSeekLlmProvider model=deepseek-v4-flash mode=llm duration_ms=1234 prompt_chars=5678 response_chars=901 prompt_sha256=...
```

如果需要查看完整 prompt，在 `.env.local` 中临时开启：

```bash
AI_PLANNER_LOG_PROMPT=1
```

如果需要查看模型原始响应：

```bash
AI_PLANNER_LOG_RESPONSE=1
```

完整 prompt 和响应可能包含用户输入和上下文，调试结束后应改回 `0`。

## 本地数据库迁移

启动本地 Postgres 后，使用迁移 runner 补齐结构：

```bash
pnpm db:migrate
```

`pnpm dev:api` 和 `pnpm dev:full` 会在启动后端前自动执行该命令。默认连接：

```text
postgresql://ai_code:ai_code@127.0.0.1:5432/ai_code
```

需要覆盖时可显式传入：

```bash
DATABASE_URL=postgresql://ai_code:ai_code@127.0.0.1:5432/ai_code pnpm db:migrate
```

迁移状态记录在 `schema_migrations` 表中；如果检测到旧阶段表已经手动创建但没有迁移记录，runner 会自动 baseline 对应版本。

## 产品级 smoke 验证

快速确认第一版核心链路是否还能连续跑通：

```bash
pnpm validate:product-smoke
```

该命令使用 FastAPI `TestClient`、in-memory runtime 和 rule planner，不依赖本地 `.env.local`、LLM key 或 Postgres。它覆盖日程追问补全、确认写入、日程编辑、费用确认与提交、提醒确认与完成、自然语言管理已有日程 / 费用 / 提醒的 8 个核心动作、只读查询、execution ledger、Agent debug、会话历史恢复和 pending confirmations 清空；同时用独立会话覆盖待确认卡恢复 token 确认，以及附件资源的 `upload`、`intake` 和 `list` 路径，避免附件摘要污染主 Agent 对话路径。

如果已经用 `pnpm dev:api` 或 `pnpm dev:full` 启动了后端，可以直接验证真实运行中的 API：

```bash
pnpm validate:product-smoke:live
```

默认连接 `http://127.0.0.1:8000`。需要验证局域网地址或其他端口时：

```bash
AI_CODE_API_BASE_URL=http://192.168.1.238:8000 pnpm validate:product-smoke:live
```

live smoke 不会启动服务、不会执行 migration，也不会强制切换 planner mode；它会真实写入当前后端连接的数据库，并使用唯一 `conversationId` 避免影响已有会话判断。想做稳定回归时，建议先用规则模式启动后端；想观察 DeepSeek/OpenAI 行为时，可以保留 `.env.local` 中的 `llm_first` 配置。

如果后端没有启动或地址写错，live smoke 会明确提示当前 `base URL`，并提醒先运行 `pnpm dev:api` / `pnpm dev:full`，或通过 `AI_CODE_API_BASE_URL` 覆盖地址。

## 演进

- 每个运行时基础落地时，添加准确的安装、运行、测试和 lint 命令。
- 让本文档专注本地设置；架构决策放入 ADR。
- 删除底层工具时，在同一变更中移除废弃命令。
