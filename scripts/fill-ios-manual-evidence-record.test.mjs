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
    headSha: "abc1234",
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

function notificationReviewRecord() {
  return {
    schemaVersion: 1,
    headSha: "abc1234",
    acceptanceVerdict: "not_evaluated",
    manualAcceptanceRequired: true,
    automationCanReplaceManualAcceptance: false,
    packageEvidence: {},
    items: [
      {
        id: "local_notification",
        title: "本地通知",
        status: "pending",
        requiredEvidence: {
          screenshots: [],
          recordings: [],
          apiSummaries: [],
          bridgeMarkers: [],
          systemArtifacts: ["系统通知截图"],
        },
        evidence: {
          screenshots: [],
          recordings: [],
          apiSummaries: [],
          bridgeMarkers: [],
          systemArtifacts: [],
          operatorNotes: "",
          blocker: "",
        },
      },
      {
        id: "notification_click_backflow",
        title: "通知点击回流",
        status: "pending",
        requiredEvidence: {
          screenshots: [],
          recordings: [],
          apiSummaries: [],
          bridgeMarkers: [],
          systemArtifacts: ["系统通知点击录屏"],
        },
        evidence: {
          screenshots: [],
          recordings: [],
          apiSummaries: [],
          bridgeMarkers: [],
          systemArtifacts: [],
          operatorNotes: "",
          blocker: "",
        },
      },
    ],
  };
}

function writeNotificationUiTestMetadata(tmpDir, overrides = {}) {
  const logPath = path.join(tmpDir, "ios-notification-ui-test.log");
  const resultBundlePath = path.join(tmpDir, "ios-notification-ui-test.xcresult");
  const videoPath = path.join(tmpDir, "system-notification-click.mp4");
  fs.writeFileSync(logPath, "notification ui test log\n");
  fs.mkdirSync(resultBundlePath, { recursive: true });
  fs.writeFileSync(videoPath, "video\n");
  const metadata = {
    error: null,
    generatedAt: "2026-06-08T00:00:00.000Z",
    logPath,
    passed: true,
    resultBundlePath,
    screenshotAttachments: {
      notificationClickBackflow: "通知点击后 App 回流",
      systemNotification: "系统通知截图",
    },
    source: "validate:ios-notification-ui-test",
    videoPath,
    ...overrides,
  };
  const metadataPath = path.join(tmpDir, "notification-ui-test.json");
  fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
  return { logPath, metadata, metadataPath, resultBundlePath, videoPath };
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
  fs.writeFileSync(
    reviewedItemsPath,
    `${JSON.stringify(
      { recordHeadSha: "abc1234", reviewedItemIds: ["voice_input"] },
      null,
      2
    )}\n`
  );

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

test("CLI mark-passed refuses reviewed item file from another record head", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "manual-evidence-fill-"));
  const reviewPath = path.join(tmpDir, "manual-evidence-record.review.json");
  const reviewedItemsPath = path.join(tmpDir, "manual-evidence-reviewed-items.json");
  const filledPath = path.join(tmpDir, "manual-evidence-record.filled.json");
  fs.writeFileSync(reviewPath, `${JSON.stringify(completeReviewRecord(), null, 2)}\n`);
  fs.writeFileSync(
    reviewedItemsPath,
    `${JSON.stringify(
      { recordHeadSha: "different", reviewedItemIds: ["voice_input"] },
      null,
      2
    )}\n`
  );

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

  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, /recordHeadSha does not match/);
});

test("CLI attaches notification UI test metadata without changing pending statuses", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "manual-evidence-notification-"));
  const reviewPath = path.join(tmpDir, "manual-evidence-record.review.json");
  const filledPath = path.join(tmpDir, "manual-evidence-record.notification-review.json");
  const { metadataPath, resultBundlePath, videoPath } = writeNotificationUiTestMetadata(tmpDir);
  fs.writeFileSync(reviewPath, `${JSON.stringify(notificationReviewRecord(), null, 2)}\n`);

  const result = spawnSync(
    "node",
    [
      "scripts/fill-ios-manual-evidence-record.mjs",
      "--",
      "--record",
      reviewPath,
      "--output",
      filledPath,
      "--attach-notification-ui-test-metadata",
      metadataPath,
    ],
    { cwd: rootDir, encoding: "utf8" }
  );

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const filled = JSON.parse(fs.readFileSync(filledPath, "utf8"));
  assert.equal(filled.acceptanceVerdict, "not_evaluated");
  assert.equal(filled.items[0].status, "pending");
  assert.equal(filled.items[1].status, "pending");
  assert.deepEqual(filled.operatorSignoff, {
    confirmedAt: null,
    mode: "draft",
    operator: null,
    reviewedItemIds: [],
  });
  assert.ok(
    filled.items[0].evidence.systemArtifacts.some((entry) =>
      entry.includes(`系统通知截图: 系统通知截图 (${resultBundlePath})`)
    )
  );
  assert.ok(
    filled.items[1].evidence.systemArtifacts.some((entry) =>
      entry.includes(`系统通知点击录屏: ${videoPath}`)
    )
  );
  assert.match(filled.items[0].evidence.operatorNotes, /通知 UI test metadata/);
});

test("CLI refuses to attach failed or incomplete notification UI test metadata", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "manual-evidence-notification-"));
  const reviewPath = path.join(tmpDir, "manual-evidence-record.review.json");
  const filledPath = path.join(tmpDir, "manual-evidence-record.notification-review.json");
  const { metadataPath, videoPath } = writeNotificationUiTestMetadata(tmpDir, {
    passed: false,
  });
  fs.writeFileSync(reviewPath, `${JSON.stringify(notificationReviewRecord(), null, 2)}\n`);

  const failedResult = spawnSync(
    "node",
    [
      "scripts/fill-ios-manual-evidence-record.mjs",
      "--",
      "--record",
      reviewPath,
      "--output",
      filledPath,
      "--attach-notification-ui-test-metadata",
      metadataPath,
    ],
    { cwd: rootDir, encoding: "utf8" }
  );

  assert.equal(failedResult.status, 1, failedResult.stdout);
  assert.match(failedResult.stderr, /metadata passed must be true/);

  fs.unlinkSync(videoPath);
  const missingVideoPath = path.join(tmpDir, "missing-system-notification-click.mp4");
  writeNotificationUiTestMetadata(tmpDir, {
    videoPath: missingVideoPath,
  });
  const missingVideoResult = spawnSync(
    "node",
    [
      "scripts/fill-ios-manual-evidence-record.mjs",
      "--",
      "--record",
      reviewPath,
      "--output",
      filledPath,
      "--attach-notification-ui-test-metadata",
      metadataPath,
    ],
    { cwd: rootDir, encoding: "utf8" }
  );

  assert.equal(missingVideoResult.status, 1, missingVideoResult.stdout);
  assert.match(missingVideoResult.stderr, /metadata videoPath does not exist/);
});

test("CLI refuses to attach notification UI test metadata while marking passed", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "manual-evidence-notification-"));
  const reviewPath = path.join(tmpDir, "manual-evidence-record.review.json");
  const filledPath = path.join(tmpDir, "manual-evidence-record.notification-review.json");
  const { metadataPath } = writeNotificationUiTestMetadata(tmpDir);
  fs.writeFileSync(reviewPath, `${JSON.stringify(notificationReviewRecord(), null, 2)}\n`);

  const result = spawnSync(
    "node",
    [
      "scripts/fill-ios-manual-evidence-record.mjs",
      "--",
      "--record",
      reviewPath,
      "--output",
      filledPath,
      "--attach-notification-ui-test-metadata",
      metadataPath,
      "--mark-passed",
      "--operator",
      "QA",
      "--confirmed-at",
      "2026-06-08T00:00:00.000Z",
      "--reviewed-item",
      "local_notification",
      "--reviewed-item",
      "notification_click_backflow",
    ],
    { cwd: rootDir, encoding: "utf8" }
  );

  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, /cannot be used with --mark-passed/);
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
