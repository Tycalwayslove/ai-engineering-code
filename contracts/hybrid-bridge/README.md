# Hybrid Bridge 契约

## 目的

`contracts/hybrid-bridge` 定义 H5 产品层与原生 iOS 壳之间的显式通信协议。

当前阶段只实现 iOS。Android 保留后续计划，不在本阶段继续编码。

## 边界划分

- H5 拥有后端返回元素的渲染表面，以及由后端接口状态驱动的页面内执行状态条。
- H5 不拥有 App 头部、底部输入、菜单 Drawer 或 Timepage 日期轴。
- iOS 拥有 WebView 宿主、加载态、错误态、头部 Header、底部输入框、Timepage Drawer、系统能力入口和 NativeBridge。
- iOS 不渲染页面内执行状态条；如果未来需要 Live Activity、通知、锁屏等系统级状态，必须另行定义系统状态同步契约。
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
- `input.voice.start`：用户在 H5 侧触发语音输入，Native 应启动系统语音识别入口并返回 ACK。
- `input.voice.stop`：用户在 H5 侧停止语音输入，Native 应提交当前识别文本并返回 ACK。
- `calendar.events.sync`：H5 将已确认的日程事实同步给 Native，由 Native 写入系统日历。
- `notifications.reminders.sync`：H5 将已确认的提醒事实同步给 Native，由 Native 调度本地通知。
- `input.keyboard.open`：用户触发键盘输入，Native 应切到底部原生文本输入模式并聚焦输入框。

Native 发往 H5：

- `native.hostContext`：原生宿主上下文。
- `native.viewChanged`：原生壳切换当前视图，H5 根据视图渲染后端元素；系统提醒通知点击可携带 `reminderId`，H5 应切到提醒视图并高亮对应提醒行。
- `native.inputRequested`：原生壳触发语音、键盘或附件输入入口，H5 可展示对应后端元素或等待态。
- `native.inputSubmitted`：原生输入框提交键盘文本、语音识别文本或附件入口文本，H5 调用后端 Agent 接口并渲染返回元素。
- `native.themeChanged`：原生壳切换深色 / 浅色主题，H5 同步主题 token。
- `native.ack`：原生已收到 H5 消息。
- `native.error`：原生无法处理消息。

## 原生附件输入

当前附件入口复用 `native.inputSubmitted`，表示“选择附件后提交给对话”。Native 必须传附件元数据和可读文本；照片和 Files 中的图片可在 Native 侧用系统 OCR 能力把识别文本追加到 `text` 字段，PDF 文件可用系统 PDF 文本抽取能力追加可读文本。当照片或文件原始内容不超过 `5 * 1024 * 1024` bytes 时，可额外传 `base64Content`，由 H5 调用后端 `/attachments/upload`。超过 5MB 时不得传 `base64Content`，H5 仍按现有元数据路径登记附件并展示后续处理快捷回复。

```json
{
  "id": "native_20260527_003",
  "type": "native.inputSubmitted",
  "payload": {
    "attachmentId": "native_attachment_001",
    "attachmentKind": "image",
    "attachmentName": "照片附件",
    "attachmentSizeBytes": "245678",
    "attachmentType": "public.jpeg",
    "base64Content": "<base64 encoded content when <= 5MB>",
    "inputKind": "attachment",
    "source": "native.composer.attachment.photo",
    "text": "已选择附件：照片附件（image，245678 bytes）。请根据附件继续处理日程、费用或提醒。\n识别文本：发票 金额 88.5 元",
    "view": "conversation"
  },
  "sentAt": "2026-05-27T14:00:00.000Z"
}
```

H5 v1 不会把附件描述文本直接提交到 `/agent/turns`。在没有 OCR 或文件解析能力前，后端只确认“已接收附件元数据”，不假装已经理解了图片或文件内容；后续如果用户选择“作为费用票据处理”等快捷回复，再进入 Agent 对话和追问流程。

## 提醒通知点击回流

系统提醒通知由 Native 响应点击，但业务定位仍交给 H5 消费 `reminderId`。Native 不修改提醒事实，只负责打开提醒视图并发送明确的路由事件。

```json
{
  "id": "native_20260527_004",
  "type": "native.viewChanged",
  "payload": {
    "reminderId": "reminder_001",
    "source": "native.notifications.reminders.opened",
    "view": "reminders"
  },
  "sentAt": "2026-05-27T14:30:00.000Z"
}
```

H5 收到 `view=reminders` 和 `reminderId` 后，应刷新提醒快照并高亮对应提醒行；刷新过程不应再次触发 Native 提醒或日历同步，避免通知点击形成重复系统写入。

## 提醒通知同步

`notifications.reminders.sync` 只同步后端已经确认写入的提醒事实，不允许 H5 或 Native 绕过确认卡直接创建业务提醒。

```json
{
  "id": "msg_20260527_001",
  "type": "notifications.reminders.sync",
  "payload": {
    "reminders": [
      {
        "id": "reminder_001",
        "title": "带电脑",
        "dueAt": "2026-05-28T09:00:00+08:00",
        "status": "scheduled"
      }
    ]
  },
  "sentAt": "2026-05-27T14:00:00.000Z"
}
```

Native 应使用 `reminder.id` 作为本地通知标识的一部分，重复同步时覆盖同一提醒；过期提醒、非 `scheduled` 提醒或解析失败的提醒不得调度系统通知。

## 系统日历同步

`calendar.events.sync` 只同步后端已经确认写入的日程事实，不允许 H5 或 Native 绕过确认卡直接创建业务日程。

```json
{
  "id": "msg_20260527_002",
  "type": "calendar.events.sync",
  "payload": {
    "events": [
      {
        "id": "calendar_event_001",
        "title": "业务规划会",
        "startAt": "2026-05-28T15:00:00+08:00",
        "endAt": "2026-05-28T16:30:00+08:00",
        "timezone": "Asia/Shanghai",
        "status": "scheduled",
        "sourceActionId": "action_001"
      }
    ]
  },
  "sentAt": "2026-05-27T14:00:00.000Z"
}
```

Native 应用稳定 marker 关联系统日历事件和后端 `event.id`，重复同步时更新同一日程；非 `scheduled` 日程不得写入系统日历，且如果本地已存在同一 marker 的系统日历事件，必须删除该旧事件，避免后端取消后系统日历残留。解析失败的日程不得写入系统日历。

## 演进原则

- 所有新增消息必须先更新本目录契约，再更新 H5 和 iOS。
- 消息必须带 `id`，方便后续追踪、重放和日志定位。
- 文本输入、主题切换和页面跳转都通过显式消息传递，不做隐式全局状态读取。
- 原生能力未实现时，Native 应返回 `native.ack` 或 `native.error`，不得静默失败。
- 后续 Android 实现必须兼容同一契约，不得另起一套消息命名。
