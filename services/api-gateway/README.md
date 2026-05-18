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

- 出现独立扩缩容压力。
- 需要独立部署节奏。
- API 契约成熟且存在真实运营需求。

## 非触发条件

- 命名偏好。
- 推测性规模。
- 组织结构洁癖。
- 追求对称目录结构。
