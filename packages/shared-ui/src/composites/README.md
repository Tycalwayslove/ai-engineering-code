# 组合组件

由基础组件组合而成的可复用 UI 模式。

当前组件：

- `ComposerBar`：底部输入区，语音优先，保留键盘切换入口。
- `ExecutionStatusBar`：固定执行状态栏，放在输入框上方。
- `MessageBubble`：用户、AI、系统消息气泡。
- `ConfirmationCard`：执行前确认卡片，支持单项和批量操作。
- `TimelineDrawer`：Timepage 风格日期时间线抽屉。

约束：

- 不直接请求 API。
- 不读取业务 memory。
- 不调用 AI workflow。
- 不拥有业务最终决策。
