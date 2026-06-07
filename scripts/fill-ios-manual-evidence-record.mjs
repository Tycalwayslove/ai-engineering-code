import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import process from "node:process";

import { validateManualEvidenceRecord } from "./validate-ios-manual-evidence-record.mjs";

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function appendOperatorNote(existingNote, nextNote) {
  const current = typeof existingNote === "string" ? existingNote.trim() : "";
  return current ? `${current}\n${nextNote}` : nextNote;
}

function addUnique(values, nextValue) {
  const list = Array.isArray(values) ? values : [];
  return list.includes(nextValue) ? list : [...list, nextValue];
}

function assertExistingMetadataPath(label, filePath) {
  if (!filePath) {
    throw new Error(`notification UI test metadata ${label} is required`);
  }
  if (!fs.existsSync(filePath)) {
    throw new Error(`notification UI test metadata ${label} does not exist: ${filePath}`);
  }
}

function readNotificationUiTestMetadata(filePath) {
  const metadata = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (metadata.passed !== true) {
    throw new Error("notification UI test metadata passed must be true");
  }
  assertExistingMetadataPath("logPath", metadata.logPath);
  assertExistingMetadataPath("resultBundlePath", metadata.resultBundlePath);
  assertExistingMetadataPath("videoPath", metadata.videoPath);
  if (!metadata.screenshotAttachments?.systemNotification) {
    throw new Error("notification UI test metadata screenshotAttachments.systemNotification is required");
  }
  return metadata;
}

function appendNotificationUiTestEvidence(record, metadata) {
  const nextRecord = cloneJson(record);
  const localNotificationItem = (nextRecord.items ?? []).find(
    (item) => item?.id === "local_notification"
  );
  const notificationClickBackflowItem = (nextRecord.items ?? []).find(
    (item) => item?.id === "notification_click_backflow"
  );
  if (!localNotificationItem || !notificationClickBackflowItem) {
    throw new Error("notification UI test metadata import requires local_notification and notification_click_backflow items");
  }

  const testArtifactSummary =
    `pnpm validate:ios-notification-ui-test 输出或 xcresult: log=${metadata.logPath}, xcresult=${metadata.resultBundlePath}`;
  localNotificationItem.evidence = localNotificationItem.evidence ?? {};
  localNotificationItem.evidence.systemArtifacts = addUnique(
    localNotificationItem.evidence.systemArtifacts,
    `系统通知截图: ${metadata.screenshotAttachments.systemNotification} (${metadata.resultBundlePath})`
  );
  localNotificationItem.evidence.systemArtifacts = addUnique(
    localNotificationItem.evidence.systemArtifacts,
    testArtifactSummary
  );
  localNotificationItem.evidence.operatorNotes = appendOperatorNote(
    localNotificationItem.evidence.operatorNotes,
    "已从通知 UI test metadata 导入系统通知候选证据；仍需人工复核。"
  );

  notificationClickBackflowItem.evidence = notificationClickBackflowItem.evidence ?? {};
  notificationClickBackflowItem.evidence.systemArtifacts = addUnique(
    notificationClickBackflowItem.evidence.systemArtifacts,
    `系统通知点击录屏: ${metadata.videoPath}`
  );
  notificationClickBackflowItem.evidence.systemArtifacts = addUnique(
    notificationClickBackflowItem.evidence.systemArtifacts,
    testArtifactSummary
  );
  notificationClickBackflowItem.evidence.operatorNotes = appendOperatorNote(
    notificationClickBackflowItem.evidence.operatorNotes,
    "已从通知 UI test metadata 导入系统通知点击候选证据；仍需人工复核。"
  );

  return nextRecord;
}

function assertMarkPassedOptions(options) {
  if (!options.operator) {
    throw new Error("--operator is required when --mark-passed is used");
  }
  if (!options.confirmedAt) {
    throw new Error("--confirmed-at is required when --mark-passed is used");
  }
}

function itemIdsForRecord(record) {
  return (record?.items ?? []).map((item) => item?.id).filter(Boolean);
}

function assertReviewedItemIds(record, reviewedItemIds) {
  const expectedItemIds = itemIdsForRecord(record);
  const reviewedIds = Array.isArray(reviewedItemIds) ? reviewedItemIds : [];
  if (reviewedIds.length === 0) {
    throw new Error("--reviewed-item is required when --mark-passed is used");
  }

  const expected = new Set(expectedItemIds);
  const reviewed = new Set(reviewedIds);
  const missing = expectedItemIds.filter((itemId) => !reviewed.has(itemId));
  const unknown = reviewedIds.filter((itemId) => !expected.has(itemId));
  if (missing.length > 0 || unknown.length > 0 || reviewed.size !== reviewedIds.length) {
    throw new Error(
      [
        "reviewed item ids must exactly match record item ids",
        missing.length > 0 ? `missing: ${missing.join(", ")}` : null,
        unknown.length > 0 ? `unknown: ${unknown.join(", ")}` : null,
      ]
        .filter(Boolean)
        .join("; ")
    );
  }

  return expectedItemIds;
}

function parseReviewedItemIdsFile(filePath, record) {
  const content = fs.readFileSync(filePath, "utf8").trim();
  if (!content) {
    return [];
  }
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    return content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  }
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (Array.isArray(parsed?.reviewedItemIds)) {
    if (
      parsed.recordHeadSha &&
      record?.headSha &&
      parsed.recordHeadSha !== record.headSha
    ) {
      throw new Error(
        `--reviewed-items-file recordHeadSha does not match record headSha: ${parsed.recordHeadSha} !== ${record.headSha}`
      );
    }
    return parsed.reviewedItemIds;
  }
  if (parsed?.recordHeadSha && !Array.isArray(parsed?.reviewedItemIds)) {
    throw new Error("--reviewed-items-file with recordHeadSha must include reviewedItemIds array");
  }
  throw new Error("--reviewed-items-file must contain a JSON array or reviewedItemIds array");
}

function buildInstructions(markPassed) {
  if (markPassed) {
    return [
      "本文件由人工复核命令生成，所有项目已按显式 operator sign-off 标记为 passed。",
      "请继续使用 validate-ios-manual-evidence-record --require-complete 和 collect:v1-completion-audit 做最终校验。",
    ].join("\n");
  }

  return [
    "本文件是人工验收 filled 草稿，复制了 review 记录中的候选证据，但不会自动代表人工验收通过。",
    "请人工逐项复核截图、录屏、API 摘要、bridge marker 和系统证据后，再显式标记 passed/failed/blocked。",
  ].join("\n");
}

export function buildFilledManualEvidenceRecord(record, options = {}) {
  if (options.markPassed && options.notificationUiTestMetadata) {
    throw new Error("--attach-notification-ui-test-metadata cannot be used with --mark-passed");
  }
  const nextRecord = options.notificationUiTestMetadata
    ? appendNotificationUiTestEvidence(record, options.notificationUiTestMetadata)
    : cloneJson(record);
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const sourcePath = options.sourcePath ?? null;
  const markPassed = options.markPassed === true;

  if (markPassed) {
    assertMarkPassedOptions(options);
  }
  const reviewedItemIds = markPassed
    ? assertReviewedItemIds(record, options.reviewedItemIds)
    : [];

  nextRecord.generatedAt = generatedAt;
  nextRecord.generatedFromReview = sourcePath;
  nextRecord.instructions = buildInstructions(markPassed);
  nextRecord.operatorSignoff = {
    confirmedAt: markPassed ? options.confirmedAt : null,
    mode: markPassed ? "mark-passed" : "draft",
    operator: markPassed ? options.operator : null,
    reviewedItemIds: markPassed ? reviewedItemIds : [],
  };
  if (markPassed) {
    nextRecord.operatorSignoff.recordHeadSha = record?.headSha ?? null;
  }

  if (markPassed) {
    nextRecord.acceptanceVerdict = "passed";
    nextRecord.items = (nextRecord.items ?? []).map((item) => {
      const nextItem = cloneJson(item);
      nextItem.status = "passed";
      nextItem.evidence = nextItem.evidence ?? {};
      nextItem.evidence.blocker = "";
      nextItem.evidence.operatorNotes = appendOperatorNote(
        nextItem.evidence.operatorNotes,
        `人工复核：${options.operator} 于 ${options.confirmedAt} 确认该项通过。`
      );
      return nextItem;
    });

    const validation = validateManualEvidenceRecord(nextRecord, {
      recordPath: sourcePath ?? "manual-evidence-record.filled.json",
      requireComplete: true,
    });
    if (validation.failures.length > 0) {
      throw new Error(
        [
          "cannot mark record as passed because completion validation still fails:",
          ...validation.failures.map((failure) => `- ${failure}`),
        ].join("\n")
      );
    }
  }

  return nextRecord;
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
    } else if (arg === "--operator") {
      args.operator = argv[index + 1];
      index += 1;
    } else if (arg === "--confirmed-at") {
      args.confirmedAt = argv[index + 1];
      index += 1;
    } else if (arg === "--reviewed-item") {
      args.reviewedItemIds = args.reviewedItemIds ?? [];
      args.reviewedItemIds.push(argv[index + 1]);
      index += 1;
    } else if (arg === "--reviewed-items-file") {
      args.reviewedItemsFilePath = argv[index + 1];
      index += 1;
    } else if (arg === "--attach-notification-ui-test-metadata") {
      args.notificationUiTestMetadataPath = argv[index + 1];
      index += 1;
    } else if (arg === "--mark-passed") {
      args.markPassed = true;
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
  node scripts/fill-ios-manual-evidence-record.mjs --record <review.json> [--output <filled.json>]
  node scripts/fill-ios-manual-evidence-record.mjs --record <review.json> --output <filled.json> --attach-notification-ui-test-metadata <notification-ui-test.json>
  node scripts/fill-ios-manual-evidence-record.mjs --record <review.json> --output <filled.json> --mark-passed --operator <name> --confirmed-at <iso8601> --reviewed-item <item-id>...
  node scripts/fill-ios-manual-evidence-record.mjs --record <review.json> --output <filled.json> --mark-passed --operator <name> --confirmed-at <iso8601> --reviewed-items-file <json-or-lines>

Default behavior writes a filled draft and keeps pending/not_evaluated statuses.
Use --attach-notification-ui-test-metadata only to append notification candidate evidence; it cannot be combined with --mark-passed.
Use --mark-passed only after an operator has manually reviewed every evidence item.
The --reviewed-item or --reviewed-items-file list must exactly match the record items.`);
}

function runCli() {
  const rootDir = process.cwd();
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`iOS manual evidence fill failed: ${error.message}`);
    process.exit(1);
  }

  if (args.help || !args.recordPath) {
    printUsage();
    return;
  }

  const recordPath = path.resolve(rootDir, args.recordPath);
  const outputPath = path.resolve(
    rootDir,
    args.outputPath ?? path.join(path.dirname(recordPath), "manual-evidence-record.filled.json")
  );

  let record;
  try {
    record = JSON.parse(fs.readFileSync(recordPath, "utf8"));
  } catch (error) {
    console.error(
      `iOS manual evidence fill failed: cannot read ${recordPath}: ${error.message}`
    );
    process.exit(1);
  }

  let filledRecord;
  try {
    const reviewedItemIds = [
      ...(args.reviewedItemIds ?? []),
      ...(args.reviewedItemsFilePath
        ? parseReviewedItemIdsFile(path.resolve(rootDir, args.reviewedItemsFilePath), record)
        : []),
    ];
    const notificationUiTestMetadata = args.notificationUiTestMetadataPath
      ? readNotificationUiTestMetadata(path.resolve(rootDir, args.notificationUiTestMetadataPath))
      : null;
    filledRecord = buildFilledManualEvidenceRecord(record, {
      confirmedAt: args.confirmedAt,
      markPassed: args.markPassed,
      notificationUiTestMetadata,
      operator: args.operator,
      reviewedItemIds,
      sourcePath: path.relative(rootDir, recordPath),
    });
  } catch (error) {
    console.error(`iOS manual evidence fill failed: ${error.message}`);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(filledRecord, null, 2)}\n`);
  console.log(`iOS manual evidence filled record written to ${outputPath}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}
