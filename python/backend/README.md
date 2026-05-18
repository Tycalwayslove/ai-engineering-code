# 后端 API 网关

## 目的

- 承载 AI Code 的 Python FastAPI 网关。
- 暴露本地开发、CI 和服务契约使用的健康检查与版本端点。

## 所有权

- `backend.app.main` 拥有应用组装。
- `backend.app.routes` 拥有 HTTP 路由模块。
- `backend.app.services` 拥有路由背后的轻量业务编排。
- `python/backend/tests` 下的测试验证网关行为。

## 依赖边界

- 路由模块委托 service 层返回显式响应字典，并避免隐藏式运行时发现。
- 在契约和所有权边界成熟之前，业务编排不进入网关。
- 只有多个模块需要时，共享行为才移动到具名 Python 包。

## 演进路径

- 随匹配的 OpenAPI 契约变更一起添加路由。
- 只有稳定契约边界存在后，才引入服务客户端。
- 保持网关很薄；只有出现运营压力后才抽取领域服务。

## 端点

- `GET /factory/status` 返回工厂状态、版本和当前能力清单。
- `GET /health` 返回服务健康状态。
- `GET /version` 返回 API 名称和版本。
