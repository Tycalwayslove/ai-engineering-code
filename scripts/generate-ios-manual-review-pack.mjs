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

const docsOnlyFreshnessPathPrefixes = ["ai-factory/memory/", "docs/"];
const docsOnlyFreshnessPaths = new Set(["README.md", "AGENTS.md"]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function evidenceText(value) {
  return typeof value === "string" ? value : JSON.stringify(value);
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

function evidencePath(value) {
  const text = evidenceText(value);
  const match = text.match(/(?:^|[\s:])((?:\/|\.\.?\/|[A-Za-z0-9_.-]+\/)[^\s,，)]+(?:\.png|\.jpg|\.jpeg|\.mp4|\.mov|\.json|\.log|\.xcresult|\.md|\.html))/i);
  return match?.[1] ?? null;
}

function evidenceHtml(value) {
  const text = evidenceText(value);
  const linkedPath = evidencePath(value);
  if (!linkedPath) {
    return escapeHtml(text);
  }
  return `${escapeHtml(text)} <a href="${escapeHtml(linkedPath)}">打开</a>`;
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

function isDocsOnlyFreshnessPath(filePath) {
  return (
    docsOnlyFreshnessPaths.has(filePath) ||
    docsOnlyFreshnessPathPrefixes.some((prefix) => filePath.startsWith(prefix))
  );
}

function docsOnlyFreshnessStatusForChangedFiles(changedFiles) {
  if (!Array.isArray(changedFiles) || changedFiles.length === 0) {
    return null;
  }
  return changedFiles.every(isDocsOnlyFreshnessPath)
    ? "current_with_docs_only_changes"
    : null;
}

function packageFreshness(recordHeadSha, currentHeadSha, postRecordChangedFiles) {
  if (!recordHeadSha || !currentHeadSha) {
    return { changedFiles: [], status: "unknown" };
  }
  if (recordHeadSha === currentHeadSha) {
    return { changedFiles: [], status: "current" };
  }
  const changedFiles = Array.isArray(postRecordChangedFiles) ? postRecordChangedFiles : [];
  return {
    changedFiles,
    status: docsOnlyFreshnessStatusForChangedFiles(postRecordChangedFiles) ?? "stale",
  };
}

function postRecordChangedFilesBetweenHeads(rootDir, recordHeadSha, currentHeadSha) {
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

function machinePrecheck(items) {
  const itemResults = asArray(items).map((item) => {
    const missing = missingEvidence(item);
    return {
      complete: missing.length === 0,
      item,
      missing,
    };
  });
  const completeCount = itemResults.filter((result) => result.complete).length;
  const incompleteCount = itemResults.length - completeCount;
  return {
    completeCount,
    incompleteCount,
    itemResults,
    requiresHumanSignoff: true,
    text: `candidateEvidenceComplete=${completeCount}/${itemResults.length}, incomplete=${incompleteCount}, requiresHumanSignoff=true`,
  };
}

function machinePrecheckItemText(missing) {
  if (missing.length === 0) {
    return "候选证据齐备；仍需人工复核签署。";
  }
  return `缺少 ${missing.length} 项候选证据；补齐后仍需人工复核签署。`;
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

function requiredEvidenceSummary(item) {
  const requiredEvidence = item?.requiredEvidence ?? {};
  const summaries = [];
  for (const [category, label] of evidenceCategories) {
    const values = asArray(requiredEvidence[category]);
    if (values.length > 0) {
      summaries.push(`${label}：${values.map(evidenceText).join("、")}`);
    }
  }
  return summaries;
}

function reviewedItemArgs(items) {
  return asArray(items)
    .map((item) => item?.id)
    .filter(Boolean)
    .map((itemId) => `--reviewed-item ${itemId}`)
    .join(" ");
}

function reviewedItemIds(items) {
  return asArray(items).map((item) => item?.id).filter(Boolean);
}

function reviewedItemsFileArg(reviewedItemsPath) {
  return reviewedItemsPath ? `--reviewed-items-file ${reviewedItemsPath}` : null;
}

function pushRequiredEvidenceSection(lines, item) {
  const summaries = requiredEvidenceSummary(item);
  lines.push("- 必需证据：");
  if (summaries.length === 0) {
    lines.push("  - 无");
    return;
  }
  for (const summary of summaries) {
    lines.push(`  - ${summary}`);
  }
}

export function buildManualReviewPack(record, options = {}) {
  const recordPath = options.recordPath ?? "manual-evidence-record.review.json";
  const outputPath = options.outputPath ?? "manual-evidence-review-pack.md";
  const items = asArray(record?.items);
  const statusCounts = formatStatusCounts(items);
  const precheck = machinePrecheck(items);
  const recordHeadSha = record?.headSha ?? "unknown";
  const currentHeadSha = options.currentHeadSha ?? "unknown";
  const freshness = packageFreshness(
    record?.headSha,
    options.currentHeadSha,
    options.postRecordChangedFiles
  );
  const reviewedArgs =
    reviewedItemsFileArg(options.reviewedItemsPath) ?? reviewedItemArgs(items);
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
    `- packageFreshness: \`${freshness.status}\``,
    `- acceptanceVerdict: \`${record?.acceptanceVerdict ?? "missing"}\``,
    `- manualAcceptanceRequired: \`${record?.manualAcceptanceRequired ?? "missing"}\``,
    `- automationCanReplaceManualAcceptance: \`${record?.automationCanReplaceManualAcceptance ?? "missing"}\``,
    `- totalItems: \`${items.length}\``,
    `- statusCounts: \`${statusCounts.text}\``,
    `- machinePrecheck: \`${precheck.text}\``,
  ];
  if (freshness.changedFiles.length > 0) {
    lines.push("- postRecordChangedFiles:");
    for (const changedFile of freshness.changedFiles) {
      lines.push(`  - ${changedFile}`);
    }
  }
  lines.push(
    "",
    "## 操作者签署边界",
    "",
    "- 逐项打开截图、录屏、API 摘要、Bridge marker 和系统证据后，再决定每项是 `passed`、`failed` 还是 `blocked`。",
    "- 不要仅因为本文件列出了候选证据就把状态改成 `passed`。",
    "- 真实复核通过后，使用下方命令生成签署记录：",
    "",
    "```bash",
    `pnpm prepare:ios-manual-evidence-record -- --record ${recordPath} --output ${path.join(path.dirname(recordPath), "manual-evidence-record.filled.json")} --mark-passed --operator <name> --confirmed-at <iso8601> ${reviewedArgs}`.trim(),
    "node scripts/validate-ios-manual-evidence-record.mjs --record <filled-path> --require-complete --report <report-path>",
    "pnpm collect:v1-completion-audit -- --run-automated-commands --manual-record <filled-path> --external-knowledge-status not_synced",
    "```",
    "",
    "## 逐项复核",
    ""
  );

  items.forEach((item, index) => {
    const missing = missingEvidence(item);
    lines.push(`## ${index + 1}. ${item?.title ?? item?.item ?? item?.id ?? "未命名项目"}`);
    lines.push("");
    lines.push(`- id: \`${item?.id ?? ""}\``);
    lines.push(`- status: \`${item?.status ?? "missing"}\``);
    lines.push(`- 机器预检：${machinePrecheckItemText(missing)}`);
    pushRequiredEvidenceSection(lines, item);
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

function evidenceListHtml(item, category) {
  const values = asArray(item?.evidence?.[category]);
  if (values.length === 0) {
    return "<li>无</li>";
  }
  return values.map((value) => `<li>${evidenceHtml(value)}</li>`).join("\n");
}

function requiredEvidenceHtml(item) {
  const summaries = requiredEvidenceSummary(item);
  if (summaries.length === 0) {
    return "<li>无</li>";
  }
  return summaries.map((summary) => `<li>${escapeHtml(summary)}</li>`).join("\n");
}

export function buildManualReviewHtmlPack(record, options = {}) {
  const recordPath = options.recordPath ?? "manual-evidence-record.review.json";
  const outputPath = options.outputPath ?? "manual-evidence-review-pack.html";
  const items = asArray(record?.items);
  const statusCounts = formatStatusCounts(items);
  const precheck = machinePrecheck(items);
  const recordHeadSha = record?.headSha ?? "unknown";
  const currentHeadSha = options.currentHeadSha ?? "unknown";
  const freshness = packageFreshness(
    record?.headSha,
    options.currentHeadSha,
    options.postRecordChangedFiles
  );
  const filledPath = path.join(path.dirname(recordPath), "manual-evidence-record.filled.json");
  const reviewedArgs =
    reviewedItemsFileArg(options.reviewedItemsPath) ?? reviewedItemArgs(items);
  const changedFilesHtml =
    freshness.changedFiles.length > 0
      ? `<p>postRecordChangedFiles:</p><ul>${freshness.changedFiles
          .map((filePath) => `<li>${escapeHtml(filePath)}</li>`)
          .join("\n")}</ul>`
      : "";
  const itemSections = items
    .map((item, index) => {
      const missing = missingEvidence(item);
      const missingText =
        missing.length === 0
          ? "无"
          : missing.map((entry) => escapeHtml(entry)).join(", ");
      const evidenceSections = evidenceCategories
        .map(
          ([category, label]) => `
          <section class="evidence-group">
            <h4>${escapeHtml(label)}</h4>
            <ul>${evidenceListHtml(item, category)}</ul>
          </section>`
        )
        .join("\n");
      const operatorNotes = item?.evidence?.operatorNotes
        ? `<p><strong>operatorNotes:</strong> ${escapeHtml(item.evidence.operatorNotes)}</p>`
        : "";
      const blocker = item?.evidence?.blocker
        ? `<p><strong>blocker:</strong> ${escapeHtml(item.evidence.blocker)}</p>`
        : "";
      return `
      <article class="item" id="${escapeHtml(itemAnchorId(item?.id))}">
        <h3>${index + 1}. ${escapeHtml(item?.title ?? item?.item ?? item?.id ?? "未命名项目")}</h3>
        <p>id: <code>${escapeHtml(item?.id ?? "")}</code></p>
        <p>status: <code>${escapeHtml(item?.status ?? "missing")}</code></p>
        <p>机器预检：${escapeHtml(machinePrecheckItemText(missing))}</p>
        <section class="required-evidence">
          <h4>必需证据</h4>
          <ul>${requiredEvidenceHtml(item)}</ul>
        </section>
        <p>缺少候选证据：${missingText}</p>
        ${blocker}
        ${operatorNotes}
        <div class="evidence-grid">
          ${evidenceSections}
        </div>
      </article>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>iOS 人工验收 Review Pack</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 32px; color: #17201b; background: #f7f8f5; }
    h1, h2, h3 { margin: 0 0 12px; }
    code { background: #eef1ec; padding: 2px 5px; border-radius: 4px; }
    .warning { border: 1px solid #b45309; background: #fff7ed; padding: 14px 16px; border-radius: 8px; }
    .panel, .item { background: #fff; border: 1px solid #dde2da; border-radius: 8px; padding: 18px; margin: 18px 0; }
    .evidence-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
    .evidence-group { border-top: 1px solid #edf0ea; padding-top: 10px; }
    a { color: #0f766e; }
    li { margin: 6px 0; overflow-wrap: anywhere; }
  </style>
</head>
<body>
  <h1>iOS 人工验收 Review Pack</h1>
  <p class="warning">本文件不代表验收通过。它只把 review / filled 记录中的候选证据整理给操作者逐项复核。</p>
  <section class="panel">
    <h2>概览</h2>
    <p>record: <code>${escapeHtml(recordPath)}</code></p>
    <p>output: <code>${escapeHtml(outputPath)}</code></p>
    <p>recordHeadSha: <code>${escapeHtml(recordHeadSha)}</code></p>
    <p>currentHeadSha: <code>${escapeHtml(currentHeadSha)}</code></p>
    <p>packageFreshness: <code>${escapeHtml(freshness.status)}</code></p>
    <p>acceptanceVerdict: <code>${escapeHtml(record?.acceptanceVerdict ?? "missing")}</code></p>
    <p>manualAcceptanceRequired: <code>${escapeHtml(record?.manualAcceptanceRequired ?? "missing")}</code></p>
    <p>automationCanReplaceManualAcceptance: <code>${escapeHtml(record?.automationCanReplaceManualAcceptance ?? "missing")}</code></p>
    <p>totalItems: <code>${items.length}</code></p>
    <p>statusCounts: <code>${escapeHtml(statusCounts.text)}</code></p>
    <p>machinePrecheck: <code>${escapeHtml(precheck.text)}</code></p>
    ${changedFilesHtml}
  </section>
  <section class="panel">
    <h2>操作者签署边界</h2>
    <p>逐项打开截图、录屏、API 摘要、Bridge marker 和系统证据后，再决定每项是 <code>passed</code>、<code>failed</code> 还是 <code>blocked</code>。</p>
    <p>真实复核通过后，再生成签署记录并运行 completion audit。</p>
    <pre><code>pnpm prepare:ios-manual-evidence-record -- --record ${escapeHtml(recordPath)} --output ${escapeHtml(filledPath)} --mark-passed --operator &lt;name&gt; --confirmed-at &lt;iso8601&gt; ${escapeHtml(reviewedArgs)}
node scripts/validate-ios-manual-evidence-record.mjs --record &lt;filled-path&gt; --require-complete --report &lt;report-path&gt;
pnpm collect:v1-completion-audit -- --run-automated-commands --manual-record &lt;filled-path&gt; --external-knowledge-status not_synced</code></pre>
  </section>
  <section>
    <h2>逐项复核</h2>
    ${itemSections}
  </section>
</body>
</html>
`;
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
  const htmlOutputPath = outputPath.replace(/\.md$/i, ".html");
  const reviewedItemsPath = path.join(
    path.dirname(outputPath),
    "manual-evidence-reviewed-items.json"
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

  const currentHeadSha = currentGitHeadSha(rootDir);
  const postRecordChangedFiles = postRecordChangedFilesBetweenHeads(
    rootDir,
    record?.headSha,
    currentHeadSha
  );
  const markdown = buildManualReviewPack(record, {
    currentHeadSha,
    outputPath: path.relative(rootDir, outputPath),
    postRecordChangedFiles,
    recordPath: path.relative(rootDir, recordPath),
    reviewedItemsPath: path.relative(rootDir, reviewedItemsPath),
  });
  const html = buildManualReviewHtmlPack(record, {
    currentHeadSha,
    outputPath: path.relative(rootDir, htmlOutputPath),
    postRecordChangedFiles,
    recordPath: path.relative(rootDir, recordPath),
    reviewedItemsPath: path.relative(rootDir, reviewedItemsPath),
  });
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, markdown);
  fs.writeFileSync(htmlOutputPath, html);
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
  console.log(`iOS manual review pack written to ${outputPath}`);
  console.log(`iOS manual review HTML pack written to ${htmlOutputPath}`);
  console.log(`iOS manual reviewed item list written to ${reviewedItemsPath}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}
