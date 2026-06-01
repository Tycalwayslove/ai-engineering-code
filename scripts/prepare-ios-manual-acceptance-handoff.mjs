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

function asArray(value) {
  return Array.isArray(value) ? value : [];
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

function commandSet({
  auditOutputDir,
  filledRecordPath,
  gapsReportPath,
  htmlReviewPackPath,
  manualRecordPath,
  reviewedItemsPath,
}) {
  return {
    openReviewPack: `open ${htmlReviewPackPath}`,
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
    packageFreshness,
    recordHeadSha: record?.headSha ?? "unknown",
    reviewPackPath,
    reviewedItemsPath,
    statusCounts: statusCountsText(manualEvidence.statusCounts),
  };
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
    .warning { border: 1px solid #b45309; background: #fff7ed; padding: 14px 16px; border-radius: 8px; }
    .panel { background: #fff; border: 1px solid #dde2da; border-radius: 8px; padding: 18px; margin: 18px 0; }
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
  <section class="panel">
    <h2>操作步骤</h2>
    <p>1. 打开 HTML Review Pack，逐项查看截图、录屏、API 摘要、Bridge marker 和系统证据。</p>
    <pre><code>${escapeHtml(commands.openReviewPack)}</code></pre>
    <p>2. 如果每个 item 都由真实操作者确认通过，生成 signed filled 记录。</p>
    <pre><code>${escapeHtml(commands.signFilledRecord)}</code></pre>
    <p>3. 校验 filled 记录并输出缺口报告。</p>
    <pre><code>${escapeHtml(commands.validateFilledRecord)}</code></pre>
    <p>4. 重新运行正式 completion audit。</p>
    <pre><code>${escapeHtml(commands.runCompletionAudit)}</code></pre>
  </section>
  <section class="panel">
    <h2>边界</h2>
    <ul>
      <li>只有真实操作者逐项复核后，才允许运行 <code>--mark-passed</code>。</li>
      <li><code>manual-evidence-reviewed-items.json</code> 只证明签署确认列表完整且绑定 record HEAD，不证明验收通过。</li>
      <li>如果 filled 记录或 completion audit 未通过，继续根据 <code>manual-evidence-gaps.md</code> 补证。</li>
    </ul>
  </section>
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
