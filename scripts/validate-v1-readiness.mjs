import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const readinessPath = "docs/qa/v1-readiness-audit.md";
const readinessFile = path.join(rootDir, readinessPath);
const failures = [];

function assertIncludes(content, expected) {
  if (!content.includes(expected)) {
    failures.push(`${readinessPath}: expected to include "${expected}"`);
  }
}

if (!fs.existsSync(readinessFile)) {
  console.error(`v1 readiness validation failed: ${readinessPath} is missing.`);
  process.exit(1);
}

const content = fs.readFileSync(readinessFile, "utf8");

for (const expected of [
  "当前结论",
  "Goal 不能标记 complete",
  "自动化证据",
  "人工证据缺口",
  "后端产品主路径",
  "Postgres 持久化主路径",
  "H5 可点击主链路",
  "H5 到 Native payload",
  "iOS 编译",
  "iOS Simulator 安装启动",
  "iOS 系统能力人工验收",
  "真实 LLM provider",
  "Postman / OpenAPI / SDK 契约",
  "上下文与知识同步",
  "pnpm validate:product-smoke",
  "pnpm validate:product-smoke:postgres",
  "pnpm validate:h5-click-smoke",
  "pnpm validate:ios-build",
  "pnpm validate:ios-keyboard-ui-test",
  "pnpm validate:ios-simulator-smoke",
  "pnpm validate:ios-manual-acceptance",
  "pnpm validate:ios-manual-evidence-record",
  "pnpm validate:ios-acceptance-evidence",
  "pnpm validate:llm-smoke",
  "pnpm validate:contracts",
  "pnpm validate:native-shells",
  "pnpm validate:context-sync",
  "pnpm collect:v1-completion-audit",
  "externalKnowledgeSync",
  "--external-knowledge-status",
  "git diff --check",
  "未完成证据",
  "完成判定门槛",
]) {
  assertIncludes(content, expected);
}

if (failures.length > 0) {
  console.error("v1 readiness validation failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("v1 readiness validation passed.");
