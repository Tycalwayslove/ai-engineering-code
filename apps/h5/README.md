# H5

## 目的

`@ai-code/h5` 是 AI 原生软件工厂移动优先的 Web 界面。

## 所有权

该应用拥有小屏幕和响应式 Web 入口的浏览器展示层。

## 依赖边界

- 可以从 `packages/` 导入共享 UI 和共享类型。
- 不得导入 `services/*` 或 `ai-factory/*`。
- 数据访问必须使用 `@ai-code/sdk` 的显式 SDK 边界。
- Native Bridge 只传递宿主事件和用户输入，H5 不实现业务事实写入。

## 本地 API 连接

H5 默认按当前页面地址推导 API：

- `http://localhost:3000` -> `http://localhost:8000`
- `http://192.168.1.238:3000` -> `http://192.168.1.238:8000`

如需覆盖，设置 `NEXT_PUBLIC_API_BASE_URL`。

Xcode / 真机调试时使用：

```bash
pnpm dev:full
```

`pnpm dev:full` 会让 H5 监听 `0.0.0.0:3000`，API 监听 `0.0.0.0:8000`，并默认连接本地 Docker Compose Postgres。

## 演进

围绕已验证的移动端工作流扩展该应用。编排和后端协调保持在应用壳之外。
