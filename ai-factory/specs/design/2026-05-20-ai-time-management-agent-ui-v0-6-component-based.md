# AI 时间管理 Agent UI v0.6：基于组件库的新版画板

## 元数据

- id: ui-ai-time-management-agent-003
- kind: ui-redraw
- status: generated
- lifecycle id: ai-time-management-agent-2026-05-18
- linkedRequirement: `ai-factory/specs/requirements/2026-05-19-ai-time-management-agent-execution-workbench-revision.md`
- linkedDesign: `ai-factory/specs/design/2026-05-19-ai-time-management-agent-ui-revision.md`
- linkedDesignSystem: `ai-factory/specs/design/2026-05-19-ai-time-management-agent-design-system-v0-5-plan.md`
- created: 2026-05-20
- figmaFileKey: `HkZQagTFqRtGaoxwOGcriy`
- figmaV06Page: `AI 时间管理 Agent v0.6 Component-Based UI`
- figmaV06Node: `63:2`
- figmaV06Url: <https://www.figma.com/design/HkZQagTFqRtGaoxwOGcriy?node-id=63-2>

## 目标

v0.6 的目标是把 v0.5 设计系统真正用于新版 UI 落图。

这次不新增产品功能，也不重开需求讨论，而是验证一件事：当前设计系统是否能支撑 AI 日程执行 Agent 的核心界面。

## 输入约束

- 首页仍以 AI 执行流为主舞台。
- Timeline Drawer 只负责日期上下文和结果检查，不放连接器。
- 执行状态栏固定在输入框上方，不能随对话滚动消失。
- 高风险操作必须结构化确认。
- 完整日历只做检查和定位，不作为主要创建入口。
- 事项详情只在用户主动点开时出现，默认流程仍在对话中完成。

## 画板清单

| 画板                                   | 说明                                                     |
| -------------------------------------- | -------------------------------------------------------- |
| `00 v0.6 Cover / Component-Based UI`   | 说明本版与 v0.5 设计系统的关系。                         |
| `01 首页默认态 / AI 执行流`            | 用户输入、AI 追问、补全卡片、固定状态栏和底部输入。      |
| `02 Timeline Drawer / Timepage 日期轴` | Timepage 风格日期轴，展示日期上下文和关键事项摘要。      |
| `03 信息补全后 / 单项确认`             | 用户补充时间后，展示单项创建确认卡片。                   |
| `04 批量操作 / 高风险确认`             | 清空日程和请假这类高风险操作的结构化确认。               |
| `05 执行记录 / AI 操作账本`            | 展示待确认、执行中、已完成、失败、可撤销等 AI 操作记录。 |
| `06 完整日历 / 结果检查`               | 作为结果检查工具展示月视图和选中日期事项。               |
| `07 事项详情 / 主动点开`               | 展示用户主动查看单个事项时的详情层。                     |
| `08 Interaction Map / v0.6`            | 展示页面关系和交互原则。                                 |

## 设计判断

v0.6 相比 v0.4 更强调组件化。

视觉层继续沿用深色背景、执行绿、信息蓝、警告黄、危险红和轻量玻璃控制层，但不把玻璃效果当装饰。主界面里的信息密度更接近真实 App：顶部只保留稳定入口，中间承载 AI 执行流，底部输入和固定状态栏保持可达。

Timeline Drawer 继续参考 Timepage 的纵向日期轴，但只承担日期上下文，不再混入菜单、连接器或设置入口。

## 验证

- Figma metadata 验证 v0.6 页面存在。
- Figma metadata 验证 9 个画板结构存在。
- Figma screenshot 验证首页、Timeline Drawer、完整日历和交互关系图可渲染。
- 完整日历初版出现超过 31 的占位数字，已修正为下月日期并弱化显示。

## 后续

如果用户认可 v0.6 的方向，下一步不应马上开发业务功能，而应进入工程规格阶段：

- 明确 H5 页面拆分。
- 明确 shared-ui 哪些组件需要升级为真实业务可用组件。
- 明确前后端契约草案。
- 明确后端 AI 执行流水线的最小接口。
