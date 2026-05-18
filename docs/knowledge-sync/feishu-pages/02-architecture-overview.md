# 02 架构总览

## 总体结构

项目采用多生态 monorepo：

```text
apps/         前端应用入口
packages/     TypeScript 共享包、SDK、UI 和配置
python/       FastAPI、编排器和 agent runtime 基础
contracts/    跨运行时契约
ai-factory/   规格、记忆、提示词、工作流、设计系统和 playbook
services/     服务边界定义，不做早期运行时重复
docs/         架构、约定、ADR 和知识同步规则
```

## 运行时责任

| 区域                   | 当前职责                 | 未来演进                            |
| ---------------------- | ------------------------ | ----------------------------------- |
| `apps/h5`              | 面向用户的轻量入口       | 后续承载移动端 Web 或用户体验       |
| `apps/admin`           | 工厂状态面板和内部工作台 | 演进为 AI 工厂操作台                |
| `python/backend`       | FastAPI HTTP 入口        | 保持统一入口，按压力扩展模块        |
| `python/orchestrator`  | 显式工作流注册位置       | 后续接入真实工作流执行              |
| `python/agent-runtime` | Agent 执行原语位置       | 后续接入 LangGraph 或自定义 runtime |
| `packages/sdk`         | 前端唯一 API 访问层      | 统一重试、鉴权和传输策略            |

## 依赖边界

- 前端应用只依赖 TypeScript packages。
- 前端访问后端必须经过 `packages/sdk`。
- Python 不直接 import TypeScript 源码。
- `services/` 只定义边界和职责，不被运行时代码 import。
- `ai-factory/` 不被隐式扫描，运行时需要通过显式路径或注册表读取。

## 通信模式

当前采用最简单的本地 HTTP：

```text
Next.js apps
  -> packages/sdk
  -> FastAPI backend
  -> services / explicit registries
```

没有消息队列、服务网格或 Kubernetes。这样可以保证本地开发路径透明，也方便 AI 和人类检查调用链。

## 第一条薄切片

已经实现的 `/factory/status` 是项目的第一个端到端能力：

- OpenAPI 契约定义接口。
- `packages/shared-types` 定义前端类型。
- `packages/sdk` 提供 `getFactoryStatus()`。
- FastAPI 暴露 `/factory/status`。
- 后端通过显式能力注册表返回状态。
- Admin 页面展示工厂能力、状态和下一步行动。

这条薄切片证明了项目不是只有目录骨架，而是已经具备跨生态协作的最小闭环。
