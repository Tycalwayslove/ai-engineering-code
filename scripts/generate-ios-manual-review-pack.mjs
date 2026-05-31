import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import process from "node:process";

const evidenceCategories = [
  ["screenshots", "截图"],
  ["recordings", "录屏"],
  ["apiSummaries", "API 摘要"],
  ["bridgeMarkers", "Bridge marker"],
  ["systemArtifacts", "系统证据"],
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

function formatStatusCounts(items) {
  const counts = {
    passed: 0,
    pending: 0,
    failed: 0,
    blocked: 0,
    other: 0,
  };
  for (const item of items) {
    if (Object.hasOwn(counts, item?.status)) {
      counts[item.status] += 1;
    } else {
      counts.other += 1;
    }
  }
  return {
    counts,
    text: [
      `passed=${counts.passed}`,
      `pending=${counts.pending}`,
      `failed=${counts.failed}`,
      `blocked=${counts.blocked}`,
      `other=${counts.other}`,
    ].join(", "),
  };
}

function packageFreshness(recordHeadSha, currentHeadSha) {
  if (!recordHeadSha || !currentHeadSha) {
    return "unknown";
  }
  return recordHeadSha === currentHeadSha ? "current" : "stale";
}

function missingEvidence(item) {
  const requiredEvidence = item?.requiredEvidence ?? {};
  const evidence = item?.evidence ?? {};
  const missing = [];
  for (const [category] of evidenceCategories) {
    for (const expected of asArray(requiredEvidence[category])) {
      if (!hasEvidence(evidence[category], expected)) {
        missing.push(`${category}: ${expected}`);
      }
    }
  }
  return missing;
}

function pushEvidenceSection(lines, item, category, label) {
  const values = asArray(item?.evidence?.[category]);
  lines.push(`- ${label}:`);
  if (values.length === 0) {
    lines.push("  - 无");
    return;
  }
  for (const value of values) {
    lines.push(`  - ${evidenceText(value)}`);
  }
}

export function buildManualReviewPack(record, options = {}) {
  const recordPath = options.recordPath ?? "manual-evidence-record.review.json";
  const outputPath = options.outputPath ?? "manual-evidence-review-pack.md";
  const items = asArray(record?.items);
  const statusCounts = formatStatusCounts(items);
  const recordHeadSha = record?.headSha ?? "unknown";
  const currentHeadSha = options.currentHeadSha ?? "unknown";
  const freshness = packageFreshness(record?.headSha, options.currentHeadSha);
  const lines = [
    "# iOS 人工验收 Review Pack",
    "",
    "本文件不代表验收通过。它只把 review / filled 记录中的候选证据整理给操作者逐项复核。",
    "",
    "## 概览",
    "",
    `- record: \`${recordPath}\``,
    `- output: \`${outputPath}\``,
    `- recordHeadSha: \`${recordHeadSha}\``,
    `- currentHeadSha: \`${currentHeadSha}\``,
    `- packageFreshness: \`${freshness}\``,
    `- acceptanceVerdict: \`${record?.acceptanceVerdict ?? "missing"}\``,
    `- manualAcceptanceRequired: \`${record?.manualAcceptanceRequired ?? "missing"}\``,
    `- automationCanReplaceManualAcceptance: \`${record?.automationCanReplaceManualAcceptance ?? "missing"}\``,
    `- totalItems: \`${items.length}\``,
    `- statusCounts: \`${statusCounts.text}\``,
    "",
    "## 操作者签署边界",
    "",
    "- 逐项打开截图、录屏、API 摘要、Bridge marker 和系统证据后，再决定每项是 `passed`、`failed` 还是 `blocked`。",
    "- 不要仅因为本文件列出了候选证据就把状态改成 `passed`。",
    "- 真实复核通过后，使用下方命令生成签署记录：",
    "",
    "```bash",
    `pnpm prepare:ios-manual-evidence-record -- --record ${recordPath} --output ${path.join(path.dirname(recordPath), "manual-evidence-record.filled.json")} --mark-passed --operator <name> --confirmed-at <iso8601>`,
    "node scripts/validate-ios-manual-evidence-record.mjs --record <filled-path> --require-complete --report <report-path>",
    "pnpm collect:v1-completion-audit -- --run-automated-commands --manual-record <filled-path> --external-knowledge-status not_synced",
    "```",
    "",
    "## 逐项复核",
    "",
  ];

  items.forEach((item, index) => {
    const missing = missingEvidence(item);
    lines.push(`## ${index + 1}. ${item?.title ?? item?.item ?? item?.id ?? "未命名项目"}`);
    lines.push("");
    lines.push(`- id: \`${item?.id ?? ""}\``);
    lines.push(`- status: \`${item?.status ?? "missing"}\``);
    lines.push(`- 缺少候选证据：${missing.length === 0 ? "无" : missing.map((entry) => `\`${entry}\``).join(", ")}`);
    if (item?.evidence?.blocker) {
      lines.push(`- blocker: ${item.evidence.blocker}`);
    }
    if (item?.evidence?.operatorNotes) {
      lines.push("- operatorNotes:");
      for (const noteLine of String(item.evidence.operatorNotes).split("\n")) {
        lines.push(`  - ${noteLine}`);
      }
    }
    for (const [category, label] of evidenceCategories) {
      pushEvidenceSection(lines, item, category, label);
    }
    lines.push("");
  });

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--") {
      continue;
    } else if (arg === "--record") {
      args.recordPath = argv[index + 1];
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
  node scripts/generate-ios-manual-review-pack.mjs --record <manual-evidence-record.review.json> [--output <manual-evidence-review-pack.md>]

The generated Markdown is an operator review aid only. It does not mark acceptance as passed.`);
}

function currentGitHeadSha(rootDir) {
  const result = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
    cwd: rootDir,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    return null;
  }
  return result.stdout.trim() || null;
}

function runCli() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`iOS manual review pack generation failed: ${error.message}`);
    process.exit(1);
  }

  if (args.help || !args.recordPath) {
    printUsage();
    return;
  }

  const rootDir = process.cwd();
  const recordPath = path.resolve(rootDir, args.recordPath);
  const outputPath = path.resolve(
    rootDir,
    args.outputPath ?? path.join(path.dirname(recordPath), "manual-evidence-review-pack.md")
  );

  let record;
  try {
    record = JSON.parse(fs.readFileSync(recordPath, "utf8"));
  } catch (error) {
    console.error(
      `iOS manual review pack generation failed: cannot read ${recordPath}: ${error.message}`
    );
    process.exit(1);
  }

  const markdown = buildManualReviewPack(record, {
    currentHeadSha: currentGitHeadSha(rootDir),
    outputPath: path.relative(rootDir, outputPath),
    recordPath: path.relative(rootDir, recordPath),
  });
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, markdown);
  console.log(`iOS manual review pack written to ${outputPath}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}
