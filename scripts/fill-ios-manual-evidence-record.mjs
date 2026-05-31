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

function assertMarkPassedOptions(options) {
  if (!options.operator) {
    throw new Error("--operator is required when --mark-passed is used");
  }
  if (!options.confirmedAt) {
    throw new Error("--confirmed-at is required when --mark-passed is used");
  }
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
  const nextRecord = cloneJson(record);
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const sourcePath = options.sourcePath ?? null;
  const markPassed = options.markPassed === true;

  if (markPassed) {
    assertMarkPassedOptions(options);
  }

  nextRecord.generatedAt = generatedAt;
  nextRecord.generatedFromReview = sourcePath;
  nextRecord.instructions = buildInstructions(markPassed);
  nextRecord.operatorSignoff = {
    confirmedAt: markPassed ? options.confirmedAt : null,
    mode: markPassed ? "mark-passed" : "draft",
    operator: markPassed ? options.operator : null,
  };

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
  node scripts/fill-ios-manual-evidence-record.mjs --record <review.json> --output <filled.json> --mark-passed --operator <name> --confirmed-at <iso8601>

Default behavior writes a filled draft and keeps pending/not_evaluated statuses.
Use --mark-passed only after an operator has manually reviewed every evidence item.`);
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
    filledRecord = buildFilledManualEvidenceRecord(record, {
      confirmedAt: args.confirmedAt,
      markPassed: args.markPassed,
      operator: args.operator,
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
