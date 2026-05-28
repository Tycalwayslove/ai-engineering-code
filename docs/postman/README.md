# Postman 接口集合

本目录包含 AI Code Backend 的 Postman 导入文件。

## 文件

- `ai-code-backend.postman_collection.json`：接口集合，包含请求说明、参数注释、示例 body 和自动提取变量脚本。
- `ai-code-backend.postman_environment.json`：本地环境变量，默认 `baseUrl=http://127.0.0.1:8000`。

## 使用步骤

1. 在 Postman 中点击 `Import`。
2. 导入 `ai-code-backend.postman_collection.json`。
3. 再导入 `ai-code-backend.postman_environment.json`。
4. 右上角环境选择 `AI Code Backend Local`。
5. 启动后端：

```bash
pnpm dev:api
```

或同时启动 H5 和 API：

```bash
pnpm dev:full
```

如果想在手动逐条跑 Postman 之前先确认当前运行中的 API 主路径，可以执行：

```bash
pnpm validate:product-smoke:live
```

该命令会真实写入当前后端连接的数据库，并覆盖自然语言管理已有日程 / 费用 / 提醒的 8 个核心动作、会话历史恢复、待确认卡恢复确认，以及附件 `upload`、`intake` 和 `list` 路径；不要指向生产库。
如果后端没有启动或 `baseUrl` 写错，命令会输出当前 `AI_CODE_API_BASE_URL` 和启动建议。

6. 先运行 `基础检查 / 健康检查`。
7. 运行 `Agent 对话 / 提交对话 - 创建提醒` 或 `提交对话 - 多动作计划`。
8. 上一步会自动保存 `planId` 和 `confirmToken`，再运行 `执行计划 / 确认执行计划`。
9. 如果要恢复或排查当前对话 transcript，运行 `Agent 对话 / 查看对话历史`。
10. 如果要恢复仍未处理的确认卡，运行 `Agent 对话 / 查看待确认计划`；它会签发新的恢复用 `confirmToken` 并自动保存到变量，可继续运行 `执行计划 / 确认执行计划`。
11. 如果要排查识别、追问或 LLM fallback，运行 `Agent 对话 / 查看对话调试信息`。
12. 如需测试原生照片/文件入口，运行 `附件资源 / 接收附件元数据`。
13. 如需测试附件票据后续处理，继续运行 `Agent 对话 / 提交对话 - 附件票据追问`，再运行 `提交对话 - 补全费用金额`。
14. 如需测试附件日程材料后续处理，继续运行 `Agent 对话 / 提交对话 - 附件日程材料追问`，再运行 `提交对话 - 补全日程时间`。
15. 如需测试自然语言只读查询，先在同一个 `conversationId` 下创建并确认对应事项，再运行 `Agent 对话 / 提交对话 - 查询明天安排` 或 `提交对话 - 查询费用`；这类请求返回 `assistant_message` 和 `summary-list` 结构化元素，不会生成确认卡。
16. 如需测试自然语言管理已有事项，先在同一个 `conversationId` 下创建并确认对应事项，再运行 `Agent 对话` 中的 8 条管理请求：取消 / 完成 / 修改刚才的提醒，提交 / 取消 / 修改刚才的费用，取消 / 修改明天会议。
17. 自然语言管理请求会自动校验返回的 `actionType` 和 `payload.target_id`，并保存新的 `planId` 与 `confirmToken`；随后继续运行 `执行计划 / 确认执行计划`。
   目标歧义追问响应会保留旧字段 `quickReplies`，并额外返回 `quickReplyOptions`；如果候选文案重复，Postman 或 H5 应优先把 `quickReplyOptions[n].value` 作为下一轮 `input`，并可把 `quickReplyOptions[n].label` 作为 `displayInput`，不要只回传展示文案。
18. 最后用 `领域数据查询` 和 `执行计划 / 查询执行日志` 检查执行结果；这些查询默认带 `conversationId`，只看当前会话产生的事项。
19. 如需测试日程编辑或状态，先运行 `领域数据查询 / 查询日程列表` 自动保存 `calendarEventId`，再运行 `编辑日程` 或 `取消日程`。
20. 如需测试费用编辑或状态，先运行 `领域数据查询 / 查询费用草稿列表` 自动保存 `expenseId`，再运行 `编辑费用草稿`、`提交费用草稿` 或 `取消费用草稿`。
21. 如需测试提醒编辑或状态，先运行 `领域数据查询 / 查询提醒列表` 自动保存 `reminderId`，再运行 `编辑提醒`、`完成提醒` 或 `取消提醒`。

## 常用变量

- `baseUrl`：后端地址。模拟器或本机 Postman 通常用 `http://127.0.0.1:8000`；局域网设备可改成 `http://192.168.x.x:8000`。
- `conversationId`：测试会话 ID。
- `now`：客户端当前时间，影响“明天”“昨天”等相对时间解析。
- `timezone`：时区，默认 `Asia/Shanghai`。
- `planId`：由提交对话接口自动保存。
- `confirmToken`：由提交对话接口自动保存。
- `calendarEventId`：由 `查询日程列表` 自动保存，供 `编辑日程` 和 `取消日程` 使用。
- `expenseId`：由 `查询费用草稿列表` 自动保存，供 `编辑费用草稿`、`提交费用草稿` 和 `取消费用草稿` 使用。
- `reminderId`：由 `查询提醒列表` 自动保存，供 `编辑提醒`、`完成提醒` 和 `取消提醒` 使用。
- `attachmentId`：附件 intake 示例使用的原生附件 ID。

## 调试接口

- `Agent 对话` 已包含 8 条自然语言管理请求，用来验证对话直接生成管理计划：`reminder.cancel_reminder`、`reminder.complete_reminder`、`reminder.update_reminder`、`expense.submit_reimbursement`、`expense.cancel_reimbursement`、`expense.update_reimbursement`、`calendar.cancel_event`、`calendar.update_event`。
- `Agent 对话 / 提交对话 - 查询明天安排` 和 `提交对话 - 查询费用` 用来验证只读查询：后端基于当前会话摘要组织回答，并通过 `structuredElements` 返回 `summary-list`；泛化“安排”合并日程和提醒，专问日程 / 提醒 / 费用时按领域过滤，费用可按相对日期过滤。它不创建执行计划，也不需要确认。
- `Agent 对话 / 查看对话历史` 会调用 `GET /agent/conversations/{conversationId}/turns`，用于按时间恢复用户和助手 turn；历史里的确认令牌会被 redacted，只能用于 transcript 展示，不应直接用于确认执行。
- `Agent 对话 / 查看待确认计划` 会调用 `GET /agent/conversations/{conversationId}/pending-confirmations`，只返回仍在等待确认的计划，并为每个 pending confirmation 签发新的短期恢复 token；可以用该 token 继续运行 `执行计划 / 确认执行计划`，确认或拒绝后再次查询不应再返回该计划。
- `Agent 对话 / 查看对话调试信息` 会调用 `GET /agent/conversations/{conversationId}/debug`。
- `执行计划 / 查询执行日志` 默认调用 `GET /execution-ledger?conversationId={{conversationId}}`，用于查看当前会话的执行流水；删除 query 参数可查看全局流水。
- `领域数据查询` 里的日程、费用、提醒列表默认都会带 `conversationId={{conversationId}}`，与 iOS/H5 当前会话的 Timeline 读取方式一致。
- `领域数据查询` 里的编辑 / 取消 / 提交 / 完成等直接 UI 变更请求必须带 `conversationId={{conversationId}}`；后端会据此校验目标事项确实来自当前会话，并把直接操作写入执行流水。
- `events` 用来查看每轮后端是否进入规划、是否触发追问、是否生成执行计划。
- `decisionTraces` 用来查看 planner mode、上下文分段、候选工具、选中工具、缺失字段、策略结论和 fallback 原因。
- `pendingClarifications` 用来查看当前会话保存过的追问上下文，例如缺少日程开始时间或费用金额。
- `quickReplyOptions` 是 `quickReplies` 的兼容增强字段：`label` 用于展示，`value` 用于提交下一轮 `/agent/turns`。普通补时间 / 补金额场景里二者通常相同；管理目标选择场景里 `value` 可以是稳定 `target_id`，用于避免多个候选显示同一文案时选错目标。
- `/agent/turns` 请求支持可选 `displayInput`：当 `input` 是 `quickReplyOptions[n].value` 这类内部稳定值时，用 `displayInput` 传用户看到的 `label`。后端会用 `displayInput` 恢复对话历史，同时在 `rawContent.submittedInput` 保留真实提交值，便于排查。

## 附件接口

- `附件资源 / 接收附件元数据` 会调用 `POST /attachments/intake`。
- `附件资源 / 查询当前会话附件列表` 会调用 `GET /attachments?conversationId={{conversationId}}`，用于回看当前会话已接收的附件资源。
- 该接口只保存 Native 选择器提交的附件元数据，例如 `attachmentId`、`attachmentKind`、`attachmentName`、`attachmentSizeBytes`、`attachmentType`、`conversationId`、`source` 和可读 `text`。
- 当前不会上传文件二进制、不会传 base64，也不会直接触发 Agent 执行。
- 同一会话继续发送“把 receipt.jpg 作为费用票据处理”时，如果最近附件 `text` 已包含类似 `88.5 元` 的金额，会直接生成费用草稿确认卡；如果文本没有日期，会使用客户端当前日期作为费用发生日期；如果没有金额，则发起费用金额追问，用户补充金额后才进入费用草稿确认计划。
- 同一会话继续发送“把 receipt.jpg 作为日程材料处理”会基于最近附件发起日程时间追问；用户补充时间后才进入日程确认计划。
- 后续 OCR、票据解析或附件归档应基于返回的附件资源和可读 `text` 继续扩展。

## 注意事项

- 不带 `DATABASE_URL` 启动时，后端会使用内存存储，服务重启后数据会丢。
- `pnpm dev:api` 和 `pnpm dev:full` 会自动执行 `pnpm db:migrate`；如果只想单独补齐数据库结构，可以先运行 `pnpm db:migrate`。
- 带 Postgres 启动时，需要确保 `ai_code` 数据库可连接；迁移 runner 会记录到 `schema_migrations`，并会 baseline 已经手动建好的旧表。
- `拒绝执行计划` 只能用于仍在 `awaiting_confirmation` 的计划；已经确认执行的计划会返回 `400`。
- `编辑日程`、`编辑费用草稿` 和 `编辑提醒` 只修改业务内容字段，不修改 `status` 或 `sourceActionId`；缺少 `conversationId` 会返回 `400`。
- `取消日程` 会修改日程事实状态；H5 会在刷新后把非 `scheduled` 日程从 Native 系统日历同步列表中排除；缺少 `conversationId` 会返回 `400`。
- `提交费用草稿` 和 `取消费用草稿` 会修改费用事实状态；H5 费用列表会在刷新后只给 `draft` 草稿展示可点击动作；缺少 `conversationId` 会返回 `400`。
- `完成提醒` 和 `取消提醒` 会修改提醒事实状态；H5 会在刷新后把非 `scheduled` 提醒从 Native 本地通知同步列表中排除；缺少 `conversationId` 会返回 `400`。
