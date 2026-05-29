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
    requireComplete:
      process.env.AI_CODE_IOS_MANUAL_EVIDENCE_REQUIRE_COMPLETE === "1",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--record") {
      args.recordPath = argv[index + 1];
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

Environment:
  AI_CODE_IOS_MANUAL_EVIDENCE_RECORD=<path>
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

