import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import process from "node:process";

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

function includesEvidence(actualValues, expected) {
  return asArray(actualValues).some((value) => {
    const text = typeof value === "string" ? value : JSON.stringify(value);
    return text.includes(expected);
  });
}

function pushFailure(failures, recordPath, message) {
  failures.push(`${recordPath}: ${message}`);
}

function missingEvidenceForItem(item) {
  const requiredEvidence = item?.requiredEvidence ?? {};
  const evidence = item?.evidence ?? {};
  const missingEvidence = [];
  for (const category of evidenceCategories) {
    for (const expected of asArray(requiredEvidence[category])) {
      if (!includesEvidence(evidence[category], expected)) {
        missingEvidence.push({ category, expected });
      }
    }
  }
  return missingEvidence;
}

function formatStatusCounts(statusCounts) {
  return [
    `passed=${statusCounts.passed}`,
    `pending=${statusCounts.pending}`,
    `failed=${statusCounts.failed}`,
    `blocked=${statusCounts.blocked}`,
    `other=${statusCounts.other}`,
  ].join(", ");
}

export function buildManualEvidenceRecordReport(record, options = {}) {
  const recordPath = options.recordPath ?? "manual-evidence-record";
  const items = Array.isArray(record?.items) ? record.items : [];
  const statusCounts = {
    passed: 0,
    pending: 0,
    failed: 0,
    blocked: 0,
    other: 0,
  };
  const incompleteItems = [];
  const globalGaps = [];
  let missingEvidenceCount = 0;

  if (record?.acceptanceVerdict !== "passed") {
    globalGaps.push("acceptanceVerdict must be passed for completion");
  }

  for (const item of items) {
    const status = item?.status;
    if (Object.hasOwn(statusCounts, status)) {
      statusCounts[status] += 1;
    } else {
      statusCounts.other += 1;
    }

    const missingEvidence = missingEvidenceForItem(item);
    missingEvidenceCount += missingEvidence.length;
    if (
      status !== "passed" ||
      missingEvidence.length > 0 ||
      item?.evidence?.blocker
    ) {
      incompleteItems.push({
        id: item?.id ?? "",
        title: item?.title ?? item?.item ?? "未命名项目",
        status: status ?? "missing",
        blocker: item?.evidence?.blocker ?? "",
        missingEvidence,
      });
    }
  }

  const lines = [
    "# iOS 人工验收补证缺口报告",
    "",
    `- record: ${recordPath}`,
    `- acceptanceVerdict: ${record?.acceptanceVerdict ?? "missing"}`,
    `- totalItems: ${items.length}`,
    `- statusCounts: ${formatStatusCounts(statusCounts)}`,
    `- missingEvidenceCount: ${missingEvidenceCount}`,
    "",
  ];

  if (globalGaps.length > 0) {
    lines.push("## 全局缺口", "");
    for (const gap of globalGaps) {
      lines.push(`- ${gap}`);
    }
    lines.push("");
  }

  if (incompleteItems.length === 0) {
    lines.push("## 未完成项目", "", "无。");
  } else {
    lines.push("## 未完成项目", "");
    for (const item of incompleteItems) {
      lines.push(`### ${item.title}`, "");
      lines.push(`- id: ${item.id}`);
      lines.push(`- status: ${item.status}`);
      if (item.blocker) {
        lines.push(`- blocker: ${item.blocker}`);
      }
      if (item.missingEvidence.length > 0) {
        lines.push("- missingEvidence:");
        for (const missing of item.missingEvidence) {
          lines.push(`  - ${missing.category}: ${missing.expected}`);
        }
      } else {
        lines.push("- missingEvidence: 无");
      }
      lines.push("");
    }
  }

  lines.push(
    "## 下一步",
    "",
    "1. 按未完成项目补齐截图、录屏、API 摘要、bridge marker 和系统证据。",
    "2. 把对应项目 `status` 改为 `passed`、`failed` 或 `blocked`。",
    "3. 所有必验项通过后，将 `acceptanceVerdict` 改为 `passed`，再运行 completion 校验。"
  );

  return {
    totalItems: items.length,
    statusCounts,
    globalGaps,
    missingEvidenceCount,
    incompleteItems,
    markdown: `${lines.join("\n")}\n`,
  };
}

export function validateManualEvidenceRecord(record, options = {}) {
  const recordPath = options.recordPath ?? "manual-evidence-record";
  const requireComplete = options.requireComplete === true;
  const failures = [];

  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return { failures: [`${recordPath}: record must be a JSON object`] };
  }

  if (record.schemaVersion !== 1) {
    pushFailure(failures, recordPath, "schemaVersion must be 1");
  }
  if (record.manualAcceptanceRequired !== true) {
    pushFailure(failures, recordPath, "manualAcceptanceRequired must be true");
  }
  if (record.automationCanReplaceManualAcceptance !== false) {
    pushFailure(
      failures,
      recordPath,
      "automationCanReplaceManualAcceptance must be false"
    );
  }
  if (requireComplete && record.acceptanceVerdict !== "passed") {
    pushFailure(
      failures,
      recordPath,
      "acceptanceVerdict must be passed when --require-complete is used"
    );
  }

  const packageEvidence = record.packageEvidence ?? {};
  for (const key of ["acceptanceEvidenceJson", "manifestJson", "manualChecklist"]) {
    if (typeof packageEvidence[key] !== "string" || packageEvidence[key] === "") {
      pushFailure(failures, recordPath, `packageEvidence.${key} is required`);
    }
  }

  if (!Array.isArray(record.items) || record.items.length === 0) {
    pushFailure(failures, recordPath, "items must be a non-empty array");
    return { failures };
  }

  const seenIds = new Set();
  record.items.forEach((item, index) => {
    const itemName = item?.title ?? item?.item ?? `items[${index}]`;
    const itemPath = `items[${index}] ${itemName}`;
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      pushFailure(failures, recordPath, `items[${index}] must be an object`);
      return;
    }
    if (typeof item.id !== "string" || item.id === "") {
      pushFailure(failures, recordPath, `${itemPath} id is required`);
    } else if (seenIds.has(item.id)) {
      pushFailure(failures, recordPath, `${itemPath} id is duplicated`);
    } else {
      seenIds.add(item.id);
    }
    if (typeof item.title !== "string" || item.title === "") {
      pushFailure(failures, recordPath, `${itemPath} title is required`);
    }

    const allowedStatuses = asArray(item.allowedStatuses);
    if (!allowedStatuses.includes("pending") || !allowedStatuses.includes("passed")) {
      pushFailure(
        failures,
        recordPath,
        `${itemPath} allowedStatuses must include pending and passed`
      );
    }
    if (!allowedStatuses.includes(item.status)) {
      pushFailure(
        failures,
        recordPath,
        `${itemPath} status must be one of allowedStatuses`
      );
    }
    if (requireComplete && item.status !== "passed") {
      pushFailure(
        failures,
        recordPath,
        `${itemPath} status must be passed for completion, got ${item.status}`
      );
    }

    const requiredEvidence = item.requiredEvidence ?? {};
    const evidence = item.evidence ?? {};
    for (const category of evidenceCategories) {
      if (!Array.isArray(requiredEvidence[category])) {
        pushFailure(
          failures,
          recordPath,
          `${itemPath} requiredEvidence.${category} must be an array`
        );
      }
      if (!Array.isArray(evidence[category])) {
        pushFailure(
          failures,
          recordPath,
          `${itemPath} evidence.${category} must be an array`
        );
      }
      if (requireComplete) {
        for (const expected of asArray(requiredEvidence[category])) {
          if (!includesEvidence(evidence[category], expected)) {
            pushFailure(
              failures,
              recordPath,
              `${itemPath} missing ${category} evidence for ${expected}`
            );
          }
        }
      }
    }

    if (requireComplete && item.status === "passed" && evidence.blocker) {
      pushFailure(
        failures,
        recordPath,
        `${itemPath} passed item must not keep blocker text`
      );
    }
  });

  return { failures };
}

function parseArgs(argv) {
  const args = {
    recordPath: process.env.AI_CODE_IOS_MANUAL_EVIDENCE_RECORD,
    reportPath: process.env.AI_CODE_IOS_MANUAL_EVIDENCE_REPORT,
    requireComplete:
      process.env.AI_CODE_IOS_MANUAL_EVIDENCE_REQUIRE_COMPLETE === "1",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--record") {
      args.recordPath = argv[index + 1];
      index += 1;
    } else if (arg === "--report") {
      args.reportPath = argv[index + 1];
      index += 1;
    } else if (arg === "--require-complete") {
      args.requireComplete = true;
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else if (!arg.startsWith("--") && !args.recordPath) {
      args.recordPath = arg;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function printUsage() {
  console.log(`Usage:
  node scripts/validate-ios-manual-evidence-record.mjs --record <path> [--require-complete]
  node scripts/validate-ios-manual-evidence-record.mjs --record <path> --report <path>

Environment:
  AI_CODE_IOS_MANUAL_EVIDENCE_RECORD=<path>
  AI_CODE_IOS_MANUAL_EVIDENCE_REPORT=<path>
  AI_CODE_IOS_MANUAL_EVIDENCE_REQUIRE_COMPLETE=1

Without --record, the script generates a dry-run evidence package in a temp directory
and validates its manual-evidence-record.template.json structure.`);
}

function generateDryRunTemplate(rootDir) {
  const outputDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "ios-manual-evidence-record-")
  );
  const result = spawnSync(
    "node",
    [
      path.join(rootDir, "scripts", "collect-ios-acceptance-evidence.mjs"),
      "--dry-run",
      "--output-dir",
      outputDir,
    ],
    { cwd: rootDir, encoding: "utf8" }
  );
  if (result.status !== 0) {
    throw new Error(
      `dry-run evidence generation failed:\n${result.stdout}\n${result.stderr}`
    );
  }
  return path.join(outputDir, "manual-evidence-record.template.json");
}

function runCli() {
  const rootDir = process.cwd();
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`iOS manual evidence record validation failed: ${error.message}`);
    process.exit(1);
  }

  if (args.help) {
    printUsage();
    return;
  }

  const recordPath = path.resolve(
    rootDir,
    args.recordPath ?? generateDryRunTemplate(rootDir)
  );
  if (!fs.existsSync(recordPath)) {
    console.error(
      `iOS manual evidence record validation failed: ${recordPath} is missing.`
    );
    process.exit(1);
  }

  let record;
  try {
    record = JSON.parse(fs.readFileSync(recordPath, "utf8"));
  } catch (error) {
    console.error(
      `iOS manual evidence record validation failed: ${recordPath} is not valid JSON: ${error.message}`
    );
    process.exit(1);
  }

  const result = validateManualEvidenceRecord(record, {
    recordPath: path.relative(rootDir, recordPath),
    requireComplete: args.requireComplete,
  });
  if (args.reportPath) {
    const reportPath = path.resolve(rootDir, args.reportPath);
    const report = buildManualEvidenceRecordReport(record, {
      recordPath: path.relative(rootDir, recordPath),
    });
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, report.markdown);
    console.log(`iOS manual evidence gap report written to ${reportPath}`);
  }

  if (result.failures.length > 0) {
    console.error("iOS manual evidence record validation failed:");
    for (const failure of result.failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("iOS manual evidence record validation passed.");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}
