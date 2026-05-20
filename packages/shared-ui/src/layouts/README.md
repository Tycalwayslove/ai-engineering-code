# 布局

共享应用布局组件。

当前组件：

- `HybridHostShell`：H5 / iOS / Android 宿主预览壳，管理宿主外框、安全区变量和开发态布局差异。
- `MobileAgentShell`：Hybrid H5 主界面壳，固定顶部控制区、滚动内容区、固定状态栏和底部输入区。

约束：

- 布局组件只管理屏幕区域和 safe area。
- 宿主差异只能影响外框、安全区、预览 chrome 和容器尺寸。
- 不决定产品路由。
- 不实现原生 Bridge。
- 不承载业务状态机。
