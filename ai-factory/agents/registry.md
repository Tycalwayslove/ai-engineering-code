# Agent 注册表

第一阶段不包含自主 agent。

未来 agent 条目必须声明：

- id
- purpose
- inputs
- outputs
- allowed tools
- allowed memory domains
- escalation path

Agent 不得被自动加载。运行时代码必须通过显式配置加载具名 agent。
