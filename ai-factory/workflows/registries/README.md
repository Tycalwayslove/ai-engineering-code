# 工作流注册表

## 目的

该目录将在引入可执行工作流时记录具名工作流声明。

## 单一事实来源

第一阶段不包含可执行工作流注册表。

未来工作流必须声明：

- id
- owner
- trigger
- inputs
- outputs
- states
- memory domains

## 边界

工作流不得被自动发现。运行时代码必须通过显式配置加载具名工作流。

## 当前注册项

| id                            | manifest                                                                      |
| ----------------------------- | ----------------------------------------------------------------------------- |
| idea-to-product-understanding | `ai-factory/workflows/registries/idea-to-product-understanding.manifest.json` |
| requirement-capture           | `ai-factory/workflows/registries/requirement-capture.manifest.json`           |
| prd-draft                     | `ai-factory/workflows/registries/prd-draft.manifest.json`                     |
| design-brief-draft            | `ai-factory/workflows/registries/design-brief-draft.manifest.json`            |
| ui-design-draft               | `ai-factory/workflows/registries/ui-design-draft.manifest.json`               |
| memory-review                 | `ai-factory/workflows/registries/memory-review.manifest.json`                 |
| process-audit                 | `ai-factory/workflows/registries/process-audit.manifest.json`                 |
| spec-to-implementation-plan   | `ai-factory/workflows/registries/spec-to-implementation-plan.manifest.json`   |
| ui-to-code-implementation     | `ai-factory/workflows/registries/ui-to-code-implementation.manifest.json`     |
| component-library-maintenance | `ai-factory/workflows/registries/component-library-maintenance.manifest.json` |

## 演进

只有工作流所有权、评审预期和运行时加载规则都定义清楚后，才添加注册表结构。
