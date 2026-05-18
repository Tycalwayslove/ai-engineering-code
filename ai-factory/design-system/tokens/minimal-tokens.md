# 最小设计令牌

## 目的

Phase 1.1 只定义设计令牌的记录方式，不生成正式设计系统。

## 颜色

| Token                   | 用途           |
| ----------------------- | -------------- |
| `color.background`      | 页面背景       |
| `color.surface`         | 面板和卡片背景 |
| `color.text.primary`    | 主要文本       |
| `color.text.secondary`  | 次级文本       |
| `color.border`          | 边界线         |
| `color.status.ready`    | 可用状态       |
| `color.status.planned`  | 计划状态       |
| `color.status.degraded` | 降级状态       |

## 间距

| Token     | 用途 |
| --------- | ---- |
| `space.1` | 4px  |
| `space.2` | 8px  |
| `space.3` | 12px |
| `space.4` | 16px |
| `space.6` | 24px |
| `space.8` | 32px |

## 圆角

| Token            | 用途                 |
| ---------------- | -------------------- |
| `radius.control` | 按钮、输入框         |
| `radius.card`    | 独立卡片，不超过 8px |
| `radius.panel`   | 工作台面板           |

## 规则

- Phase 1.1 不把 Markdown token 当作运行时 token。
- 正式 UI 设计图进入 Phase 1.2 后，再决定是否输出 CSS 变量或 Figma Variables。
