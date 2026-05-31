import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { buildManualReviewPack } from "./generate-ios-manual-review-pack.mjs";

const rootDir = process.cwd();

function reviewRecord() {
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
        title: "语音输入",
        status: "pending",
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
          systemArtifacts: ["iOS 权限弹窗截图或录屏: /tmp/voice.xcresult"],
          operatorNotes: "候选证据已自动整理。",
          blocker: "",
        },
      },
      {
        id: "local_notification",
        title: "本地通知",
        status: "pending",
        requiredEvidence: {
          screenshots: ["系统通知截图"],
          recordings: [],
          apiSummaries: [],
          bridgeMarkers: [],
          systemArtifacts: ["system-notification-click.mp4"],
        },
        evidence: {
          screenshots: [],
          recordings: [],
          apiSummaries: [],
          bridgeMarkers: [],
          systemArtifacts: ["system-notification-click.mp4: /tmp/click.mp4"],
          operatorNotes: "缺系统通知截图。",
          blocker: "",
        },
      },
    ],
  };
}

test("manual review pack summarizes pending statuses and evidence without passing items", () => {
  const markdown = buildManualReviewPack(reviewRecord(), {
    currentHeadSha: "def5678",
    recordPath: ".tmp/run/manual-evidence-record.review.json",
  });

  assert.match(markdown, /# iOS 人工验收 Review Pack/);
  assert.match(markdown, /acceptanceVerdict: `not_evaluated`/);
  assert.match(markdown, /recordHeadSha: `abc1234`/);
  assert.match(markdown, /currentHeadSha: `def5678`/);
  assert.match(markdown, /packageFreshness: `stale`/);
  assert.match(markdown, /statusCounts: `passed=0, pending=2, failed=0, blocked=0, other=0`/);
  assert.match(markdown, /本文件不代表验收通过/);
  assert.match(markdown, /## 1\. 语音输入/);
  assert.match(markdown, /- status: `pending`/);
  assert.match(markdown, /识别文本: \/tmp\/voice-text\.png/);
  assert.match(markdown, /缺少候选证据：无/);
  assert.match(markdown, /## 2\. 本地通知/);
  assert.match(markdown, /缺少候选证据：`screenshots: 系统通知截图`/);
  assert.match(markdown, /--mark-passed --operator/);
  assert.doesNotMatch(markdown, /status: `passed`/);
});

test("CLI writes manual review pack next to the record by default", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ios-review-pack-"));
  const recordPath = path.join(tmpDir, "manual-evidence-record.review.json");
  fs.writeFileSync(recordPath, `${JSON.stringify(reviewRecord(), null, 2)}\n`);

  const result = spawnSync(
    "node",
    [
      "scripts/generate-ios-manual-review-pack.mjs",
      "--",
      "--record",
      recordPath,
    ],
    { cwd: rootDir, encoding: "utf8" }
  );

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const outputPath = path.join(tmpDir, "manual-evidence-review-pack.md");
  const markdown = fs.readFileSync(outputPath, "utf8");
  assert.match(markdown, /# iOS 人工验收 Review Pack/);
  assert.match(result.stdout, /manual review pack written/);
});

test("package exposes manual review pack command", () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(rootDir, "package.json"), "utf8")
  );

  assert.equal(
    packageJson.scripts["prepare:ios-manual-review-pack"],
    "node --test scripts/generate-ios-manual-review-pack.test.mjs && node scripts/generate-ios-manual-review-pack.mjs"
  );
});
