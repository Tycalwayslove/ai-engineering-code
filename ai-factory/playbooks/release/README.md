# Release Playbook

## 适用场景

用于阶段性发布、tag、提交、飞书展示更新和 Obsidian 阶段记录。

## 输入

- 版本或阶段名称。
- 变更摘要。
- 验证结果。
- 已知风险。
- 是否需要 tag。

## 步骤

1. 确认候选范围。
2. 运行质量门禁。
3. 更新仓库源稿或报告。
4. 写 Obsidian 阶段记录。
5. 提炼飞书展示内容并更新索引。
6. 提交并推送。
7. 必要时创建并推送 tag。
8. 记录下一阶段建议。

## 检查清单

- `pnpm validate:contracts` 是否通过。
- `pnpm validate:factory` 是否通过。
- 必要 lint/typecheck/test 是否通过。
- Obsidian 是否记录阶段结果。
- 飞书是否更新展示内容。
- tag 名称是否符合约定。
- 工作区是否干净。

## 产出

- 阶段提交。
- 可选 tag。
- Obsidian 记录。
- 飞书页面更新。
- 发布或阶段总结。
