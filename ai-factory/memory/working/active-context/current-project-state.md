# 当前项目状态

## 记忆类型

- domain: working
- area: active-context
- status: current
- last_updated: 2026-05-23
- sourcePath: `ai-factory/memory/working/active-context/current-project-state.md`

## 新窗口必读摘要

本文件是新 Codex 窗口恢复上下文的第一入口。进入 `/Users/mac/person_code/ai-code` 后，先读本文件，再结合 `git status --short --branch` 和最近提交判断当前状态。

当前主线是 **AI 时间管理 Agent 的原生 iOS -> H5 -> FastAPI 后端 -> Postgres 数据库** 全链路打通。项目选择的是“包边界优先的模块化后端”：`python/backend` 保持 FastAPI 网关，`python/orchestrator` 负责计划与确认执行，`python/agent-runtime` 负责解析器/Agent 原语，领域事实通过 repository 写入 Postgres。

## 最近关键提交

- `a1024e9 fix(h5): 避免重复确认导致状态栏报错`
- `6f4b864 feat(h5): 打通原生到数据库日程链路`
- `09ea11d feat(db): 接入后端 Postgres 存储`
- `f96cefb feat(db): 增加 Agent 执行工作流首版迁移`
- `caca1c8 chore(dev): 增加前后端一键启动脚本`

这些提交已推送到 `origin/codex/ai-native-factory-bootstrap`。

## 当前已完成

- Postgres 本地容器已能运行，数据库名 `ai_code`，用户 `ai_code`。
- 第一版 migration 已建立：`conversation_turns`、`execution_plans`、`domain_actions`、`confirmations`、`execution_ledger`、`calendar_events`、`expense_records`、`reminders` 等表。
- 后端设置 `DATABASE_URL` 后使用 Postgres repository；未设置时仍可使用 in-memory repository 便于测试。
- H5 收到 iOS 的 `native.inputSubmitted` 后，通过 `@ai-code/sdk` 调用 `/agent/turns`。
- H5 渲染后端返回的确认卡；点击确认后调用 `/execution-plans/{id}/confirm`。
- 确认成功后会刷新 `/calendar/events` 与 `/execution-ledger`，并移除已确认的确认卡，避免重复提交。
- 后端对“已成功计划 + 同一 confirmToken 的重复确认”做幂等返回，不再产生 `400 Bad Request`。
- 解析器已支持“明天下午三点安排一个新年业务规划会，时间一个半小时”，标题为“新年业务规划会”，时长 90 分钟。
- API 已允许本地和局域网 H5 origin 的 CORS 预检，适配 Xcode 真机/模拟器访问。
- 根目录 `pnpm dev:full` 现在同时启动 H5 `0.0.0.0:3000` 和 API `0.0.0.0:8000`，API 默认连接本地 Postgres。

## 当前本机服务状态

最近一次调试中：

- H5 可通过 `http://192.168.1.238:3000` 访问。
- API 可通过 `http://192.168.1.238:8000` 访问。
- API 可能运行在 `screen` 会话 `ai-code-api` 中；新窗口必须用 `screen -ls`、`lsof -nP -iTCP:8000 -sTCP:LISTEN` 和 `/health` 重新确认，不要假设仍然存活。
- Xcode 的 H5 地址由 `apps/ios/AIEngineeringCode/Info.plist` 的 `H5DevServerURL` 控制。该文件经常包含本地机器 IP，默认视为用户本地配置，不要随意提交。

## 当前已验证

全量验证曾在 2026-05-23 通过：

```bash
PATH=.venv/bin:$PATH pytest python/backend/tests -v
PATH=.venv/bin:$PATH ruff check python
PATH=.venv/bin:$PATH mypy python
pnpm --filter @ai-code/h5 typecheck
pnpm --filter @ai-code/sdk typecheck
pnpm --filter @ai-code/shared-types typecheck
pnpm validate:contracts
```

现场链路验证曾通过：

```text
POST /agent/turns -> 200
POST /execution-plans/{id}/confirm -> 200
重复 POST /confirm -> 200
Postgres: calendar_events=1, execution_ledger=3
```

## 已知注意事项

- EasyQuery 必须连接 `ai_code` 数据库，不是默认 `postgres` 数据库。
- Postgres `timestamptz` 在 psql/EasyQuery 中可能按 UTC 显示，例如 `15:00+08:00` 会显示成 `07:00+00`，这不是写错时间。
- 如果 H5 底部状态栏出现 `API request failed: 400 Bad Request`，先看 API 日志是否是重复确认、旧 API 进程、或打到了未带 `DATABASE_URL` 的后端。
- 如果“数据库没有数据”，先确认 EasyQuery 连接信息、目标 database、schema 和当前 API 进程环境变量。
- `apps/ios/AIEngineeringCode/Info.plist` 目前有未提交的本地 H5 地址改动，属于用户环境配置，默认不要纳入提交。

## 知识同步状态

- 仓库事实来源已更新到本文件。
- Obsidian 已写入 `Projects/AI Engineering Code/阶段成果/2026-05-23 新窗口上下文恢复协议.md`。
- 飞书已同步 `03 阶段演进记录` 和 `05 工作流与 AI 协作体系`，并用 outline fetch 验证可读取。
- 飞书同步不是自动的；需要先更新 `docs/knowledge-sync/feishu-pages/` 源稿，再用 `lark-cli docs +update --api-version v2` 同步对应页面。
- 如果新窗口没有执行 Obsidian 或飞书写入，就不能声称外部知识库已经更新。

## 下一步建议

1. 固化一个命令级“上下文同步”脚本，自动检查并提示：memory、Obsidian、飞书源稿、实际飞书是否一致。
2. 将 `current-project-state.md` 纳入每次阶段性提交的检查项。
3. 继续补费用、提醒领域的真实 repository 和端到端场景。
4. 后续再考虑把确认执行拆成异步 worker；当前 V1 仍保持同步执行。
