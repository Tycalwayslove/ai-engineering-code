# 发布与 Tag

## 目的

定义阶段性 tag、提交和知识同步的最小规则，让项目演进可以被回溯。

## Tag 命名

推荐格式：

```text
v<major>.<minor>.<patch>-<stage>
```

当前示例：

- `v0.1.0-skeleton`：AI 工厂雏形基线。
- `v0.1.1-process-foundation`：Phase 1.1 流程稳定化完成后可使用。

## 创建条件

只有满足以下条件才创建 tag：

- 当前阶段有明确成果。
- 工作区干净。
- 必要校验已通过。
- Obsidian 和飞书阶段记录已同步。
- tag 含义能用一句话解释。

## 提交规则

继续使用中文 Conventional Commit：

```text
docs(process): 增加 Phase Gate
feat(factory): 增加工厂资产校验
chore(release): 标记流程稳定化基线
```

## 发布说明

每次阶段性 tag 应说明：

- 阶段名称。
- 基线提交。
- 已完成内容。
- 未完成内容。
- 下一阶段建议。

## 同步顺序

阶段结束时按以下顺序操作：

1. 更新仓库源稿或报告。
2. 写 Obsidian 阶段记录。
3. 提炼飞书展示内容。
4. 更新飞书索引。
5. 运行本地校验。
6. 提交并推送。
7. 如有必要创建并推送 tag。
