import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const acceptancePath = "docs/qa/ios-v1-system-acceptance.md";
const acceptanceFile = path.join(rootDir, acceptancePath);
const failures = [];

function assertIncludes(content, expected) {
  if (!content.includes(expected)) {
    failures.push(`${acceptancePath}: expected to include "${expected}"`);
  }
}

if (!fs.existsSync(acceptanceFile)) {
  console.error(`iOS manual acceptance validation failed: ${acceptancePath} is missing.`);
  process.exit(1);
}

const content = fs.readFileSync(acceptanceFile, "utf8");

for (const expected of [
  "H5 地址覆盖",
  "会话持久 ID",
  "键盘输入",
  "语音输入",
  "照片附件",
  "文件附件",
  "PDF 文本提取",
  "本地通知",
  "通知点击回流",
  "系统日历写入",
  "系统日历取消清理",
  "后端事实确认",
  "系统同步降级",
  "验收证据",
  "不能由自动 smoke 替代",
  "source=native.composer.voice",
  "source=native.composer.keyboard",
  "inputKind=attachment",
  "attachmentKind=image",
  "base64Content",
  "ai-code.reminder.{id}",
  "source=native.notifications.reminders.opened",
  "AI_CODE_EVENT_ID:{id}",
  "AI_CODE_ACTION_ID:{sourceActionId}",
  "pnpm validate:ios-build",
  "pnpm validate:ios-simulator-smoke",
  "pnpm validate:h5-click-smoke",
  "pnpm validate:ios-manual-evidence-record",
  "manual-evidence-record.template.json",
  "passed",
  "failed",
  "blocked",
  "automationCanReplaceManualAcceptance=false",
]) {
  assertIncludes(content, expected);
}

if (failures.length > 0) {
  console.error("iOS manual acceptance validation failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("iOS manual acceptance validation passed.");
