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

export function buildManualAcceptanceHandoff(record, options = {}) {
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
  const lines = [
    "# iOS 人工验收 Handoff",
    "",
    "本文件不代表验收通过。它只把当前 review record、复核页面、签署命令和最终 audit 命令集中到一个入口。",
    "",
    "## 当前状态",
    "",
    `- record: \`${manualRecordPath}\``,
    `- Markdown Review Pack: \`${reviewPackPath}\``,
    `- HTML Review Pack: \`${htmlReviewPackPath}\``,
    `- reviewed items: \`${reviewedItemsPath}\``,
    `- filled output: \`${filledRecordPath}\``,
    `- gaps report: \`${gapsReportPath}\``,
    `- recordHeadSha: \`${record?.headSha ?? "unknown"}\``,
    `- currentHeadSha: \`${packageFreshness.currentHeadSha ?? "unknown"}\``,
    `- packageFreshness: \`${packageFreshness.status ?? "unknown"}\``,
    `- acceptanceVerdict: \`${record?.acceptanceVerdict ?? "missing"}\``,
    `- auditVerdict: \`${audit.verdict ?? "unknown"}\``,
    `- missingEvidenceCount: \`${manualEvidence.missingEvidenceCount ?? "unknown"}\``,
    `- statusCounts: \`${statusCountsText(manualEvidence.statusCounts)}\``,
    `- totalItems: \`${items.length}\``,
    "",
    "## 操作步骤",
    "",
    "1. 打开 HTML Review Pack，逐项查看截图、录屏、API 摘要、Bridge marker 和系统证据。",
    "",
    "```bash",
    `open ${htmlReviewPackPath}`,
    "```",
    "",
    "2. 如果每个 item 都由真实操作者确认通过，生成 signed filled 记录。",
    "",
    "```bash",
    `pnpm prepare:ios-manual-evidence-record -- --record ${manualRecordPath} --output ${filledRecordPath} --mark-passed --operator <name> --confirmed-at <iso8601> --reviewed-items-file ${reviewedItemsPath}`,
    "```",
    "",
    "3. 校验 filled 记录并输出缺口报告。",
    "",
    "```bash",
    `node scripts/validate-ios-manual-evidence-record.mjs --record ${filledRecordPath} --require-complete --report ${gapsReportPath}`,
    "```",
    "",
    "4. 重新运行正式 completion audit。",
    "",
    "```bash",
    `pnpm collect:v1-completion-audit -- --run-automated-commands --manual-record ${filledRecordPath} --output-dir ${auditOutputDir} --external-knowledge-status not_synced`,
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
  console.log(`iOS manual acceptance handoff written to ${outputPath}`);
  console.log(`iOS manual review pack written to ${reviewPackPath}`);
  console.log(`iOS manual review HTML pack written to ${htmlReviewPackPath}`);
  console.log(`iOS manual reviewed item list written to ${reviewedItemsPath}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}
