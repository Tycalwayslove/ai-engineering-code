import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import process from "node:process";

import {
  buildManualReviewHtmlPack,
  buildManualReviewPack,
} from "./generate-ios-manual-review-pack.mjs";
import { buildV1CompletionAudit } from "./collect-v1-completion-audit.mjs";

const rootDir = process.cwd();
const defaultManualRecordRoot = path.join(".tmp", "ios-acceptance-evidence");
const evidenceCategories = [
  "screenshots",
  "recordings",
  "apiSummaries",
  "bridgeMarkers",
  "systemArtifacts",
];

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function evidenceText(value) {
  return typeof value === "string" ? value : JSON.stringify(value);
}

function hasEvidence(actualValues, expected) {
  return asArray(actualValues).some((value) => evidenceText(value).includes(expected));
}

function missingEvidenceEntries(item) {
  const requiredEvidence = item?.requiredEvidence ?? {};
  const evidence = item?.evidence ?? {};
  const missing = [];
  for (const category of evidenceCategories) {
    for (const expected of asArray(requiredEvidence[category])) {
      if (!hasEvidence(evidence[category], expected)) {
        missing.push(`${category}: ${expected}`);
      }
    }
  }
  return missing;
}

function missingEvidenceFocusItems(items) {
  return asArray(items)
    .map((item) => ({
      id: item?.id ?? "",
      missing: missingEvidenceEntries(item),
      title: item?.title ?? item?.item ?? item?.id ?? "未命名项目",
    }))
    .filter((item) => item.missing.length > 0);
}

function currentGitHeadSha() {
  const result = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
    cwd: rootDir,
    encoding: "utf8",
  });
  return result.status === 0 ? result.stdout.trim() : null;
}

function postRecordChangedFilesBetweenHeads(recordHeadSha, currentHeadSha) {
  if (!recordHeadSha || !currentHeadSha || recordHeadSha === currentHeadSha) {
    return [];
  }
  const result = spawnSync(
    "git",
    ["diff", "--name-only", `${recordHeadSha}..${currentHeadSha}`],
    {
      cwd: rootDir,
      encoding: "utf8",
    }
  );
  if (result.status !== 0) {
    return null;
  }
  return result.stdout.split("\n").map((line) => line.trim()).filter(Boolean);
}

function reviewedItemIds(items) {
  return asArray(items).map((item) => item?.id).filter(Boolean);
}

function statusCountsText(statusCounts = {}) {
  return [
    `passed=${statusCounts.passed ?? 0}`,
    `pending=${statusCounts.pending ?? 0}`,
    `failed=${statusCounts.failed ?? 0}`,
    `blocked=${statusCounts.blocked ?? 0}`,
    `other=${statusCounts.other ?? 0}`,
  ].join(", ");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function itemAnchorId(itemId) {
  const safeId = String(itemId || "unknown").replace(/[^A-Za-z0-9_-]/g, "-");
  return `item-${safeId}`;
}

function commandSet({
  auditOutputDir,
  filledRecordPath,
  gapsReportPath,
  htmlReviewPackPath,
  manualRecordPath,
  notificationReviewRecordPath,
  notificationUiTestMetadataPath,
  reviewedItemsPath,
}) {
  return {
    attachNotificationUiTestMetadata: `pnpm prepare:ios-manual-evidence-record -- --record ${manualRecordPath} --output ${notificationReviewRecordPath} --attach-notification-ui-test-metadata ${notificationUiTestMetadataPath}`,
    openReviewPack: `open ${htmlReviewPackPath}`,
    prepareNotificationHandoff: `pnpm prepare:ios-manual-handoff -- --record ${notificationReviewRecordPath}`,
    runNotificationUiTest: "pnpm validate:ios-notification-ui-test",
    signFilledRecord: `pnpm prepare:ios-manual-evidence-record -- --record ${manualRecordPath} --output ${filledRecordPath} --mark-passed --operator <name> --confirmed-at <iso8601> --reviewed-items-file ${reviewedItemsPath}`,
    validateFilledRecord: `node scripts/validate-ios-manual-evidence-record.mjs --record ${filledRecordPath} --require-complete --report ${gapsReportPath}`,
    runCompletionAudit: `pnpm collect:v1-completion-audit -- --run-automated-commands --manual-record ${filledRecordPath} --output-dir ${auditOutputDir} --external-knowledge-status not_synced`,
  };
}

function handoffContext(record, options = {}) {
  const audit = options.audit ?? {};
  const manualEvidence = audit.manualEvidence ?? {};
  const packageFreshness = manualEvidence.packageFreshness ?? {};
  const manualRecordPath = options.manualRecordPath ?? "manual-evidence-record.review.json";
  const reviewPackPath = options.reviewPackPath ?? path.join(path.dirname(manualRecordPath), "manual-evidence-review-pack.md");
  const htmlReviewPackPath =
    options.htmlReviewPackPath ?? reviewPackPath.replace(/\.md$/i, ".html");
  const reviewedItemsPath =
    options.reviewedItemsPath ?? path.join(path.dirname(manualRecordPath), "manual-evidence-reviewed-items.json");
  const filledRecordPath =
    options.filledRecordPath ?? path.join(path.dirname(manualRecordPath), "manual-evidence-record.filled.json");
  const gapsReportPath =
    options.gapsReportPath ?? path.join(path.dirname(manualRecordPath), "manual-evidence-gaps.md");
  const notificationReviewRecordPath =
    options.notificationReviewRecordPath ??
    path.join(path.dirname(manualRecordPath), "manual-evidence-record.notification-review.json");
  const notificationUiTestMetadataPath =
    options.notificationUiTestMetadataPath ??
    path.join(".tmp", "ios-notification-ui-test", "notification-ui-test.json");
  const auditOutputDir =
    options.auditOutputDir ?? path.join(".tmp", "v1-completion-audit", "manual-acceptance-final");
  const items = asArray(record?.items);
  return {
    audit,
    auditOutputDir,
    filledRecordPath,
    gapsReportPath,
    htmlReviewPackPath,
    items,
    manualEvidence,
    manualRecordPath,
    notificationReviewRecordPath,
    notificationUiTestMetadataPath,
    packageFreshness,
    recordHeadSha: record?.headSha ?? "unknown",
    reviewPackPath,
    reviewedItemsPath,
    statusCounts: statusCountsText(manualEvidence.statusCounts),
  };
}

function reviewedItemChecklistHtml(items, reviewHref) {
  if (items.length === 0) {
    return "<li>无验收项目</li>";
  }
  return items
    .map((item, index) => {
      const itemId = item?.id ?? "";
      const title = item?.title ?? item?.item ?? itemId ?? `项目 ${index + 1}`;
      const itemHref = `${reviewHref}#${itemAnchorId(itemId)}`;
      return `<li><label><input type="checkbox" class="reviewed-item" data-item-id="${escapeHtml(itemId)}"> ${index + 1}. ${escapeHtml(title)} <code>${escapeHtml(itemId)}</code></label> <a href="${escapeHtml(itemHref)}">查看证据</a></li>`;
    })
    .join("\n");
}

function commandBlockHtml(command) {
  return `<div class="command-block"><button type="button" class="copy-command" data-copy-text="${escapeHtml(command)}">复制</button><pre><code>${escapeHtml(command)}</code></pre></div>`;
}

function notificationFocusNeeded(focusItems) {
  return focusItems.some((item) =>
    ["local_notification", "notification_click_backflow"].includes(item.id)
  );
}

function missingEvidenceFocusMarkdown(items, commands) {
  const focusItems = missingEvidenceFocusItems(items);
  const lines = ["## 当前补证重点", ""];
  if (focusItems.length === 0) {
    lines.push("当前没有缺少的候选证据；仍需真实操作者逐项复核后才能签署。");
    return lines;
  }
  lines.push("以下只是候选证据缺口提示，不代表其它项目已经验收通过。");
  lines.push("");
  for (const item of focusItems) {
    lines.push(`- ${item.title} \`${item.id}\``);
    for (const missing of item.missing) {
      lines.push(`  - \`${missing}\``);
    }
  }
  if (notificationFocusNeeded(focusItems)) {
    lines.push(
      "",
      "### 通知 UI test 补证辅助",
      "",
      "如果本机已能跑 iOS notification UI test，可以先生成通知候选证据草稿；该命令只补候选 evidence，仍保持 pending/not_evaluated。",
      "",
      "```bash",
      commands.runNotificationUiTest,
      commands.attachNotificationUiTestMetadata,
      commands.prepareNotificationHandoff,
      "```"
    );
  }
  return lines;
}

function missingEvidenceFocusHtml(items, commands) {
  const focusItems = missingEvidenceFocusItems(items);
  if (focusItems.length === 0) {
    return `<section class="panel">
    <h2>当前补证重点</h2>
    <p>当前没有缺少的候选证据；仍需真实操作者逐项复核后才能签署。</p>
  </section>`;
  }
  const itemHtml = focusItems
    .map(
      (item) => `<li data-missing-evidence-item-id="${escapeHtml(item.id)}">${escapeHtml(item.title)} <code>${escapeHtml(item.id)}</code><ul>${item.missing
        .map((missing) => `<li><code>${escapeHtml(missing)}</code></li>`)
        .join("\n")}</ul></li>`
    )
    .join("\n");
  return `<section class="panel">
    <h2>当前补证重点</h2>
    <p>以下只是候选证据缺口提示，不代表其它项目已经验收通过。</p>
    <ul>${itemHtml}</ul>
    ${notificationFocusNeeded(focusItems) ? `<h3>通知 UI test 补证辅助</h3>
    <p>如果本机已能跑 iOS notification UI test，可以先生成通知候选证据草稿；该命令只补候选 evidence，仍保持 pending/not_evaluated。</p>
    ${commandBlockHtml(commands.runNotificationUiTest)}
    ${commandBlockHtml(commands.attachNotificationUiTestMetadata)}
    ${commandBlockHtml(commands.prepareNotificationHandoff)}` : ""}
  </section>`;
}

export function buildManualAcceptanceHandoff(record, options = {}) {
  const context = handoffContext(record, options);
  const commands = commandSet(context);
  const lines = [
    "# iOS 人工验收 Handoff",
    "",
    "本文件不代表验收通过。它只把当前 review record、复核页面、签署命令和最终 audit 命令集中到一个入口。",
    "",
    "## 当前状态",
    "",
    `- record: \`${context.manualRecordPath}\``,
    `- Markdown Review Pack: \`${context.reviewPackPath}\``,
    `- HTML Review Pack: \`${context.htmlReviewPackPath}\``,
    `- reviewed items: \`${context.reviewedItemsPath}\``,
    `- filled output: \`${context.filledRecordPath}\``,
    `- gaps report: \`${context.gapsReportPath}\``,
    `- recordHeadSha: \`${context.recordHeadSha}\``,
    `- currentHeadSha: \`${context.packageFreshness.currentHeadSha ?? "unknown"}\``,
    `- packageFreshness: \`${context.packageFreshness.status ?? "unknown"}\``,
    `- acceptanceVerdict: \`${record?.acceptanceVerdict ?? "missing"}\``,
    `- auditVerdict: \`${context.audit.verdict ?? "unknown"}\``,
    `- missingEvidenceCount: \`${context.manualEvidence.missingEvidenceCount ?? "unknown"}\``,
    `- statusCounts: \`${context.statusCounts}\``,
    `- totalItems: \`${context.items.length}\``,
    "",
    ...missingEvidenceFocusMarkdown(context.items, commands),
    "",
    "## 操作步骤",
    "",
    "1. 打开 HTML Review Pack，逐项查看截图、录屏、API 摘要、Bridge marker 和系统证据。",
    "",
    "```bash",
    commands.openReviewPack,
    "```",
    "",
    "2. 如果每个 item 都由真实操作者确认通过，生成 signed filled 记录。",
    "",
    "```bash",
    commands.signFilledRecord,
    "```",
    "",
    "3. 校验 filled 记录并输出缺口报告。",
    "",
    "```bash",
    commands.validateFilledRecord,
    "```",
    "",
    "4. 重新运行正式 completion audit。",
    "",
    "```bash",
    commands.runCompletionAudit,
    "```",
    "",
    "## 边界",
    "",
    "- 只有真实操作者逐项复核后，才允许运行 `--mark-passed`。",
    "- `manual-evidence-reviewed-items.json` 只证明签署确认列表完整且绑定 record HEAD，不证明验收通过。",
    "- 如果 filled 记录或 completion audit 未通过，继续根据 `manual-evidence-gaps.md` 补证。",
  ];
  return `${lines.join("\n")}\n`;
}

export function buildManualAcceptanceHtmlHandoff(record, options = {}) {
  const context = handoffContext(record, options);
  const commands = commandSet(context);
  const reviewHref = escapeHtml(options.htmlReviewPackHref ?? context.htmlReviewPackPath);
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>iOS 人工验收 Handoff</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 32px; color: #17201b; background: #f7f8f5; }
    h1, h2 { margin: 0 0 12px; }
    code { background: #eef1ec; padding: 2px 5px; border-radius: 4px; }
    pre { background: #17201b; color: #f7f8f5; padding: 14px; border-radius: 8px; overflow-x: auto; }
    button { border: 1px solid #b9c2b6; background: #eef1ec; color: #17201b; border-radius: 6px; padding: 7px 10px; font: inherit; cursor: pointer; }
    button:hover { background: #e3e9df; }
    .warning { border: 1px solid #b45309; background: #fff7ed; padding: 14px 16px; border-radius: 8px; }
    .panel { background: #fff; border: 1px solid #dde2da; border-radius: 8px; padding: 18px; margin: 18px 0; }
    .command-block { display: grid; gap: 8px; margin: 10px 0 16px; }
    .command-block button { justify-self: start; }
    .field-row { display: flex; flex-wrap: wrap; gap: 12px; margin: 12px 0; }
    .field-row label { display: grid; gap: 4px; min-width: 260px; }
    input[type="text"] { border: 1px solid #cdd5ca; border-radius: 6px; padding: 8px 10px; font: inherit; }
    textarea { border: 1px solid #cdd5ca; border-radius: 6px; padding: 10px; font: 13px ui-monospace, SFMono-Regular, Menlo, monospace; min-height: 104px; width: 100%; box-sizing: border-box; }
    a { color: #0f766e; }
    li { margin: 6px 0; overflow-wrap: anywhere; }
  </style>
</head>
<body>
  <h1>iOS 人工验收 Handoff</h1>
  <p class="warning">本文件不代表验收通过。它只把当前 review record、复核页面、签署命令和最终 audit 命令集中到一个入口。</p>
  <section class="panel">
    <h2>当前状态</h2>
    <ul>
      <li>record: <code>${escapeHtml(context.manualRecordPath)}</code></li>
      <li>HTML Review Pack: <a href="${reviewHref}">${escapeHtml(context.htmlReviewPackPath)}</a></li>
      <li>reviewed items: <code>${escapeHtml(context.reviewedItemsPath)}</code></li>
      <li>filled output: <code>${escapeHtml(context.filledRecordPath)}</code></li>
      <li>gaps report: <code>${escapeHtml(context.gapsReportPath)}</code></li>
      <li>recordHeadSha: <code>${escapeHtml(context.recordHeadSha)}</code></li>
      <li>currentHeadSha: <code>${escapeHtml(context.packageFreshness.currentHeadSha ?? "unknown")}</code></li>
      <li>packageFreshness: <code>${escapeHtml(context.packageFreshness.status ?? "unknown")}</code></li>
      <li>acceptanceVerdict: <code>${escapeHtml(record?.acceptanceVerdict ?? "missing")}</code></li>
      <li>auditVerdict: <code>${escapeHtml(context.audit.verdict ?? "unknown")}</code></li>
      <li>missingEvidenceCount: <code>${escapeHtml(context.manualEvidence.missingEvidenceCount ?? "unknown")}</code></li>
      <li>statusCounts: <code>${escapeHtml(context.statusCounts)}</code></li>
      <li>totalItems: <code>${context.items.length}</code></li>
    </ul>
  </section>
  ${missingEvidenceFocusHtml(context.items, commands)}
  <section class="panel">
    <h2>操作步骤</h2>
    <p>1. 打开 HTML Review Pack，逐项查看截图、录屏、API 摘要、Bridge marker 和系统证据。</p>
    ${commandBlockHtml(commands.openReviewPack)}
    <p>2. 如果每个 item 都由真实操作者确认通过，生成 signed filled 记录。</p>
    ${commandBlockHtml(commands.signFilledRecord)}
    <p>3. 校验 filled 记录并输出缺口报告。</p>
    ${commandBlockHtml(commands.validateFilledRecord)}
    <p>4. 重新运行正式 completion audit。</p>
    ${commandBlockHtml(commands.runCompletionAudit)}
  </section>
  <section class="panel">
    <h2>签署命令生成器</h2>
    <p>逐项打开 Review Pack 证据并确认通过后，勾选对应项目；填入操作者和时间后，下方会生成签署命令。</p>
    <ul>${reviewedItemChecklistHtml(context.items, reviewHref)}</ul>
    <div class="field-row">
      <label>operator
        <input id="operator-name" type="text" placeholder="例如 QA 或你的名字">
      </label>
      <label>confirmedAt
        <input id="confirmed-at" type="text" placeholder="2026-06-01T09:00:00.000Z">
      </label>
    </div>
    <p id="sign-command-status">请先逐项勾选全部验收项目，并填写 operator 与 confirmedAt。</p>
    <textarea id="generated-sign-command" readonly></textarea>
    <p><button type="button" id="copy-generated-sign-command" class="copy-command" data-copy-target="generated-sign-command">复制生成的签署命令</button></p>
    <p id="copy-command-status"></p>
  </section>
  <section class="panel">
    <h2>边界</h2>
    <ul>
      <li>只有真实操作者逐项复核后，才允许运行 <code>--mark-passed</code>。</li>
      <li><code>manual-evidence-reviewed-items.json</code> 只证明签署确认列表完整且绑定 record HEAD，不证明验收通过。</li>
      <li>如果 filled 记录或 completion audit 未通过，继续根据 <code>manual-evidence-gaps.md</code> 补证。</li>
    </ul>
  </section>
  <script>
    const signCommandParts = {
      record: ${JSON.stringify(context.manualRecordPath)},
      output: ${JSON.stringify(context.filledRecordPath)},
      reviewedItemsFile: ${JSON.stringify(context.reviewedItemsPath)}
    };
    function shellQuote(value) {
      return "'" + String(value).replaceAll("'", "'\\\\''") + "'";
    }
    function fallbackCopy(text) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      const copied = document.execCommand("copy");
      document.body.removeChild(textArea);
      return copied;
    }
    async function copyCommand(event) {
      const button = event.currentTarget;
      const targetId = button.dataset.copyTarget;
      const target = targetId ? document.getElementById(targetId) : null;
      const text = (target ? target.value || target.textContent : button.dataset.copyText || "").trim();
      const status = document.getElementById("copy-command-status");
      if (!text) {
        if (status) status.textContent = "没有可复制的命令。";
        return;
      }
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else if (!fallbackCopy(text)) {
          throw new Error("copy failed");
        }
        if (status) status.textContent = "命令已复制。运行前请再次确认人工复核结论。";
      } catch {
        if (status) status.textContent = "复制失败，请手动选择命令文本复制。";
      }
    }
    function updateSignCommand() {
      const reviewedItems = Array.from(document.querySelectorAll(".reviewed-item"));
      const allItemsReviewed = reviewedItems.length > 0 && reviewedItems.every((item) => item.checked);
      const operator = document.getElementById("operator-name").value.trim();
      const confirmedAt = document.getElementById("confirmed-at").value.trim();
      const output = document.getElementById("generated-sign-command");
      const status = document.getElementById("sign-command-status");
      if (!allItemsReviewed || !operator || !confirmedAt) {
        output.value = "";
        status.textContent = "请先逐项勾选全部验收项目，并填写 operator 与 confirmedAt。";
        return;
      }
      output.value = [
        "pnpm prepare:ios-manual-evidence-record --",
        "--record", shellQuote(signCommandParts.record),
        "--output", shellQuote(signCommandParts.output),
        "--mark-passed",
        "--operator", shellQuote(operator),
        "--confirmed-at", shellQuote(confirmedAt),
        "--reviewed-items-file", shellQuote(signCommandParts.reviewedItemsFile)
      ].join(" ");
      status.textContent = "签署命令已生成。运行前请确认每项证据已经人工复核。";
    }
    for (const element of document.querySelectorAll(".reviewed-item, #operator-name, #confirmed-at")) {
      element.addEventListener("input", updateSignCommand);
      element.addEventListener("change", updateSignCommand);
    }
    for (const element of document.querySelectorAll(".copy-command")) {
      element.addEventListener("click", copyCommand);
    }
    document.getElementById("confirmed-at").value = new Date().toISOString();
    updateSignCommand();
  </script>
</body>
</html>
`;
}

function parseArgs(argv) {
  const args = {
    manualRecordPath: "best",
    manualRecordRoot: defaultManualRecordRoot,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--") {
      continue;
    } else if (arg === "--record") {
      args.manualRecordPath = argv[index + 1];
      index += 1;
    } else if (arg === "--manual-record-root") {
      args.manualRecordRoot = argv[index + 1];
      index += 1;
    } else if (arg === "--output") {
      args.outputPath = argv[index + 1];
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function printUsage() {
  console.log(`Usage:
  node scripts/prepare-ios-manual-acceptance-handoff.mjs [--record <path|best|latest>] [--manual-record-root <dir>] [--output <manual-acceptance-handoff.md>]

The handoff file is an operator aid only. It does not mark acceptance as passed.`);
}

function runCli() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`iOS manual acceptance handoff failed: ${error.message}`);
    process.exit(1);
  }

  if (args.help) {
    printUsage();
    return;
  }

  const currentHeadSha = currentGitHeadSha();
  const audit = buildV1CompletionAudit({
    currentHeadSha,
    externalKnowledgeStatus: "not_synced",
    manualRecordPath: args.manualRecordPath,
    manualRecordRoot: args.manualRecordRoot,
  });
  const selectedRecordPath = audit.manualEvidence?.recordPath;
  if (!selectedRecordPath) {
    console.error("iOS manual acceptance handoff failed: no manual evidence record found");
    process.exit(1);
  }

  const absoluteRecordPath = path.resolve(rootDir, selectedRecordPath);
  const record = JSON.parse(fs.readFileSync(absoluteRecordPath, "utf8"));
  const outputPath = path.resolve(
    rootDir,
    args.outputPath ?? path.join(path.dirname(absoluteRecordPath), "manual-acceptance-handoff.md")
  );
  const htmlHandoffPath = outputPath.replace(/\.md$/i, ".html");
  const reviewPackPath = path.join(path.dirname(outputPath), "manual-evidence-review-pack.md");
  const htmlReviewPackPath = reviewPackPath.replace(/\.md$/i, ".html");
  const reviewedItemsPath = path.join(path.dirname(outputPath), "manual-evidence-reviewed-items.json");
  const filledRecordPath = path.join(path.dirname(outputPath), "manual-evidence-record.filled.json");
  const gapsReportPath = path.join(path.dirname(outputPath), "manual-evidence-gaps.md");
  const auditOutputDir = path.join(
    ".tmp",
    "v1-completion-audit",
    `manual-acceptance-final-${record?.headSha ?? "unknown"}`
  );
  const postRecordChangedFiles = postRecordChangedFilesBetweenHeads(
    record?.headSha,
    currentHeadSha
  );

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    reviewPackPath,
    buildManualReviewPack(record, {
      currentHeadSha,
      outputPath: path.relative(rootDir, reviewPackPath),
      postRecordChangedFiles,
      recordPath: path.relative(rootDir, absoluteRecordPath),
      reviewedItemsPath: path.relative(rootDir, reviewedItemsPath),
    })
  );
  fs.writeFileSync(
    htmlReviewPackPath,
    buildManualReviewHtmlPack(record, {
      currentHeadSha,
      outputPath: path.relative(rootDir, htmlReviewPackPath),
      postRecordChangedFiles,
      recordPath: path.relative(rootDir, absoluteRecordPath),
      reviewedItemsPath: path.relative(rootDir, reviewedItemsPath),
    })
  );
  fs.writeFileSync(
    reviewedItemsPath,
    `${JSON.stringify(
      {
        recordHeadSha: record?.headSha ?? null,
        reviewedItemIds: reviewedItemIds(record?.items),
        schemaVersion: 1,
      },
      null,
      2
    )}\n`
  );
  fs.writeFileSync(
    outputPath,
    buildManualAcceptanceHandoff(record, {
      audit,
      auditOutputDir,
      filledRecordPath: path.relative(rootDir, filledRecordPath),
      gapsReportPath: path.relative(rootDir, gapsReportPath),
      htmlReviewPackPath: path.relative(rootDir, htmlReviewPackPath),
      manualRecordPath: path.relative(rootDir, absoluteRecordPath),
      reviewPackPath: path.relative(rootDir, reviewPackPath),
      reviewedItemsPath: path.relative(rootDir, reviewedItemsPath),
    })
  );
  fs.writeFileSync(
    htmlHandoffPath,
    buildManualAcceptanceHtmlHandoff(record, {
      audit,
      auditOutputDir,
      filledRecordPath: path.relative(rootDir, filledRecordPath),
      gapsReportPath: path.relative(rootDir, gapsReportPath),
      htmlReviewPackHref: path.relative(path.dirname(htmlHandoffPath), htmlReviewPackPath),
      htmlReviewPackPath: path.relative(rootDir, htmlReviewPackPath),
      manualRecordPath: path.relative(rootDir, absoluteRecordPath),
      reviewPackPath: path.relative(rootDir, reviewPackPath),
      reviewedItemsPath: path.relative(rootDir, reviewedItemsPath),
    })
  );
  console.log(`iOS manual acceptance handoff written to ${outputPath}`);
  console.log(`iOS manual acceptance HTML handoff written to ${htmlHandoffPath}`);
  console.log(`iOS manual review pack written to ${reviewPackPath}`);
  console.log(`iOS manual review HTML pack written to ${htmlReviewPackPath}`);
  console.log(`iOS manual reviewed item list written to ${reviewedItemsPath}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}
