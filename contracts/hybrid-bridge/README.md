# Hybrid Bridge 契约

## 目的

`contracts/hybrid-bridge` 定义 H5 产品层与原生 iOS 壳之间的显式通信协议。

当前阶段只实现 iOS。Android 保留后续计划，不在本阶段继续编码。

## 边界划分

- H5 拥有后端返回元素的渲染表面，不拥有 App 头部、底部输入、菜单 Drawer 或 Timepage 日期轴。
- iOS 拥有 WebView 宿主、加载态、错误态、头部 Header、底部输入框、固定执行状态、Timepage Drawer、系统能力入口和 NativeBridge。
- 后端仍是未来业务解析、日程写入、计划执行和跨领域编排的归属。
- 原生层不得实现日程业务状态机。

## 消息方向

### H5 -> Native

H5 通过 `window.webkit.messageHandlers.NativeBridge.postMessage(envelope)` 发送消息。

```json
{
  "id": "msg_20260520_001",
  "type": "ui.openCalendar",
  "payload": {
    "source": "header"
  },
  "sentAt": "2026-05-20T08:00:00.000Z"
}
```

### Native -> H5

Native 通过 WebView 执行 JavaScript，派发 `ai-native-message` 事件。

```json
{
  "id": "native_20260520_001",
  "type": "native.hostContext",
  "payload": {
    "platform": "ios",
    "bridgeVersion": "0.1.0"
  },
  "sentAt": "2026-05-20T08:00:00.000Z"
}
```

## 当前消息类型

H5 发往 Native：

- `h5.ready`：H5 已加载，可接收宿主上下文。
- `ui.openTimeline`：用户打开 Timeline。
- `ui.openCalendar`：用户打开完整日历。
- `ui.openExecutionLedger`：用户打开执行记录。
- `input.voice.start`：用户触发语音输入。
- `input.keyboard.open`：用户触发键盘输入。

Native 发往 H5：

- `native.hostContext`：原生宿主上下文。
- `native.viewChanged`：原生壳切换当前视图，H5 根据视图渲染后端元素。
- `native.inputRequested`：原生壳触发语音、键盘或附件输入入口，H5 可展示对应后端元素或等待态。
- `native.ack`：原生已收到 H5 消息。
- `native.error`：原生无法处理消息。

## 演进原则

- 所有新增消息必须先更新本目录契约，再更新 H5 和 iOS。
- 消息必须带 `id`，方便后续追踪、重放和日志定位。
- 原生能力未实现时，Native 应返回 `native.ack` 或 `native.error`，不得静默失败。
- 后续 Android 实现必须兼容同一契约，不得另起一套消息命名。
