import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import {
  buildFilledManualEvidenceRecord,
} from "./fill-ios-manual-evidence-record.mjs";

const rootDir = process.cwd();

function completeReviewRecord() {
  return {
    schemaVersion: 1,
    acceptanceVerdict: "not_evaluated",
    manualAcceptanceRequired: true,
    automationCanReplaceManualAcceptance: false,
    packageEvidence: {
      acceptanceEvidenceJson: "acceptance-evidence.json",
      manifestJson: "manifest.json",
      manualChecklist: "manual-checklist.todo.md",
    },
    items: [
      {
        id: "voice_input",
        item: "语音输入",
        title: "语音输入",
        status: "pending",
        allowedStatuses: ["pending", "passed", "failed", "blocked"],
        requiredEvidence: {
          screenshots: ["识别文本"],
          recordings: [],
          apiSummaries: ["/reminders?conversationId=..."],
          bridgeMarkers: ["source=native.composer.voice"],
          systemArtifacts: ["iOS 权限弹窗截图或录屏"],
        },
        evidence: {
          screenshots: ["识别文本: /tmp/voice-text.png"],
          recordings: [],
          apiSummaries: ["/reminders?conversationId=... -> scheduled"],
          bridgeMarkers: ["source=native.composer.voice"],
          systemArtifacts: ["iOS 权限弹窗截图或录屏: /tmp/voice-permission.xcresult"],
          operatorNotes: "候选证据已自动整理。",
          blocker: "",
        },
      },
    ],
  };
}

test("filled record draft preserves pending statuses by default", () => {
  const record = buildFilledManualEvidenceRecord(completeReviewRecord(), {
    sourcePath: "manual-evidence-record.review.json",
    generatedAt: "2026-06-01T00:00:00.000Z",
  });

  assert.equal(record.acceptanceVerdict, "not_evaluated");
  assert.equal(record.items[0].status, "pending");
  assert.equal(record.generatedFromReview, "manual-evidence-record.review.json");
  assert.deepEqual(record.operatorSignoff, {
    confirmedAt: null,
    mode: "draft",
    operator: null,
    reviewedItemIds: [],
  });
  assert.match(record.instructions, /不会自动代表人工验收通过/);
});

test("mark-passed requires explicit operator and timestamp", () => {
  assert.throws(
    () => buildFilledManualEvidenceRecord(completeReviewRecord(), { markPassed: true }),
    /--operator is required/
  );
  assert.throws(
    () =>
      buildFilledManualEvidenceRecord(completeReviewRecord(), {
        markPassed: true,
        operator: "QA",
      }),
    /--confirmed-at is required/
  );
  assert.throws(
    () =>
      buildFilledManualEvidenceRecord(completeReviewRecord(), {
        confirmedAt: "2026-06-01T08:00:00.000Z",
        markPassed: true,
        operator: "QA",
      }),
    /--reviewed-item is required/
  );
});

test("mark-passed signs complete evidence and appends operator note", () => {
  const record = buildFilledManualEvidenceRecord(completeReviewRecord(), {
    confirmedAt: "2026-06-01T08:00:00.000Z",
    markPassed: true,
    operator: "QA",
    reviewedItemIds: ["voice_input"],
    sourcePath: "manual-evidence-record.review.json",
  });

  assert.equal(record.acceptanceVerdict, "passed");
  assert.equal(record.items[0].status, "passed");
  assert.equal(record.operatorSignoff.mode, "mark-passed");
  assert.equal(record.operatorSignoff.operator, "QA");
  assert.deepEqual(record.operatorSignoff.reviewedItemIds, ["voice_input"]);
  assert.match(record.items[0].evidence.operatorNotes, /人工复核：QA/);
});

test("mark-passed refuses missing or unknown reviewed item ids", () => {
  assert.throws(
    () =>
      buildFilledManualEvidenceRecord(completeReviewRecord(), {
        confirmedAt: "2026-06-01T08:00:00.000Z",
        markPassed: true,
        operator: "QA",
        reviewedItemIds: ["unknown_item"],
      }),
    /reviewed item ids must exactly match record item ids/
  );
});

test("mark-passed refuses records that are still missing required evidence", () => {
  const record = completeReviewRecord();
  record.items[0].evidence.screenshots = [];

  assert.throws(
    () =>
      buildFilledManualEvidenceRecord(record, {
        confirmedAt: "2026-06-01T08:00:00.000Z",
        markPassed: true,
        operator: "QA",
        reviewedItemIds: ["voice_input"],
      }),
    /cannot mark record as passed/
  );
});

test("CLI writes filled draft without changing review statuses", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "manual-evidence-fill-"));
  const reviewPath = path.join(tmpDir, "manual-evidence-record.review.json");
  const filledPath = path.join(tmpDir, "manual-evidence-record.filled.json");
  fs.writeFileSync(reviewPath, `${JSON.stringify(completeReviewRecord(), null, 2)}\n`);

  const result = spawnSync(
    "node",
    [
      "scripts/fill-ios-manual-evidence-record.mjs",
      "--",
      "--record",
      reviewPath,
      "--output",
      filledPath,
    ],
    { cwd: rootDir, encoding: "utf8" }
  );

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const filled = JSON.parse(fs.readFileSync(filledPath, "utf8"));
  assert.equal(filled.acceptanceVerdict, "not_evaluated");
  assert.equal(filled.items[0].status, "pending");
});

test("CLI mark-passed accepts reviewed item ids from file", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "manual-evidence-fill-"));
  const reviewPath = path.join(tmpDir, "manual-evidence-record.review.json");
  const reviewedItemsPath = path.join(tmpDir, "manual-evidence-reviewed-items.json");
  const filledPath = path.join(tmpDir, "manual-evidence-record.filled.json");
  fs.writeFileSync(reviewPath, `${JSON.stringify(completeReviewRecord(), null, 2)}\n`);
  fs.writeFileSync(reviewedItemsPath, `${JSON.stringify(["voice_input"], null, 2)}\n`);

  const result = spawnSync(
    "node",
    [
      "scripts/fill-ios-manual-evidence-record.mjs",
      "--",
      "--record",
      reviewPath,
      "--output",
      filledPath,
      "--mark-passed",
      "--operator",
      "QA",
      "--confirmed-at",
      "2026-06-01T08:00:00.000Z",
      "--reviewed-items-file",
      reviewedItemsPath,
    ],
    { cwd: rootDir, encoding: "utf8" }
  );

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const filled = JSON.parse(fs.readFileSync(filledPath, "utf8"));
  assert.equal(filled.acceptanceVerdict, "passed");
  assert.deepEqual(filled.operatorSignoff.reviewedItemIds, ["voice_input"]);
});

test("package exposes manual evidence fill command", () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(rootDir, "package.json"), "utf8")
  );

  assert.equal(
    packageJson.scripts["prepare:ios-manual-evidence-record"],
    "node --test scripts/fill-ios-manual-evidence-record.test.mjs && node scripts/fill-ios-manual-evidence-record.mjs"
  );
});
