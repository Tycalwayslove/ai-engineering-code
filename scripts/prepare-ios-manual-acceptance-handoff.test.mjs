import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import {
  buildManualAcceptanceHandoff,
  buildManualAcceptanceHtmlHandoff,
} from "./prepare-ios-manual-acceptance-handoff.mjs";

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
        id: "keyboard_input",
        title: "键盘输入",
        status: "pending",
        requiredEvidence: {
          screenshots: ["系统键盘输入截图"],
          recordings: [],
          apiSummaries: ["/reminders?conversationId=..."],
          bridgeMarkers: ["source=native.composer.keyboard"],
          systemArtifacts: [],
        },
        evidence: {
          screenshots: ["系统键盘输入截图: keyboard.png"],
          recordings: [],
          apiSummaries: ["/reminders?conversationId=... -> scheduled"],
          bridgeMarkers: ["source=native.composer.keyboard"],
          systemArtifacts: [],
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
          recordings: ["系统通知点击录屏"],
          apiSummaries: [],
          bridgeMarkers: [],
          systemArtifacts: [],
        },
        evidence: {
          screenshots: ["系统通知截图: notification.png"],
          recordings: ["系统通知点击录屏: click.mp4"],
          apiSummaries: [],
          bridgeMarkers: [],
          systemArtifacts: [],
          operatorNotes: "候选证据已自动整理。",
          blocker: "",
        },
      },
    ],
  };
}

test("manual acceptance handoff keeps review, sign and audit commands together", () => {
  const markdown = buildManualAcceptanceHandoff(reviewRecord(), {
    audit: {
      verdict: "not_complete",
      manualEvidence: {
        packageFreshness: {
          status: "current",
          currentHeadSha: "abc1234",
          recordHeadSha: "abc1234",
        },
        missingEvidenceCount: 0,
        statusCounts: {
          passed: 0,
          pending: 2,
          failed: 0,
          blocked: 0,
          other: 0,
        },
      },
    },
    filledRecordPath: ".tmp/run/manual-evidence-record.filled.json",
    gapsReportPath: ".tmp/run/manual-evidence-gaps.md",
    htmlReviewPackPath: ".tmp/run/manual-evidence-review-pack.html",
    manualRecordPath: ".tmp/run/manual-evidence-record.review.json",
    reviewPackPath: ".tmp/run/manual-evidence-review-pack.md",
    reviewedItemsPath: ".tmp/run/manual-evidence-reviewed-items.json",
  });

  assert.match(markdown, /# iOS 人工验收 Handoff/);
  assert.match(markdown, /本文件不代表验收通过/);
  assert.match(markdown, /record: `\.tmp\/run\/manual-evidence-record\.review\.json`/);
  assert.match(markdown, /HTML Review Pack: `\.tmp\/run\/manual-evidence-review-pack\.html`/);
  assert.match(markdown, /acceptanceVerdict: `not_evaluated`/);
  assert.match(markdown, /statusCounts: `passed=0, pending=2, failed=0, blocked=0, other=0`/);
  assert.match(markdown, /open .tmp\/run\/manual-evidence-review-pack\.html/);
  assert.match(markdown, /--reviewed-items-file .tmp\/run\/manual-evidence-reviewed-items\.json/);
  assert.match(markdown, /node scripts\/validate-ios-manual-evidence-record\.mjs --record .tmp\/run\/manual-evidence-record\.filled\.json --require-complete --report .tmp\/run\/manual-evidence-gaps\.md/);
  assert.match(markdown, /pnpm collect:v1-completion-audit -- --run-automated-commands --manual-record .tmp\/run\/manual-evidence-record\.filled\.json --output-dir .tmp\/v1-completion-audit\/manual-acceptance-final --external-knowledge-status not_synced/);
});

test("CLI writes handoff, review packs and HEAD-bound reviewed item list", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ios-handoff-"));
  const runDir = path.join(tmpDir, "run");
  fs.mkdirSync(runDir, { recursive: true });
  const recordPath = path.join(runDir, "manual-evidence-record.review.json");
  fs.writeFileSync(recordPath, `${JSON.stringify(reviewRecord(), null, 2)}\n`);
  fs.writeFileSync(
    path.join(runDir, "manifest.json"),
    `${JSON.stringify({ headSha: "abc1234" }, null, 2)}\n`
  );

  const result = spawnSync(
    "node",
    [
      "scripts/prepare-ios-manual-acceptance-handoff.mjs",
      "--",
      "--record",
      recordPath,
    ],
    { cwd: rootDir, encoding: "utf8" }
  );

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const handoffPath = path.join(runDir, "manual-acceptance-handoff.md");
  const htmlHandoffPath = path.join(runDir, "manual-acceptance-handoff.html");
  const reviewPackPath = path.join(runDir, "manual-evidence-review-pack.md");
  const htmlReviewPackPath = path.join(runDir, "manual-evidence-review-pack.html");
  const reviewedItemsPath = path.join(runDir, "manual-evidence-reviewed-items.json");
  assert.ok(fs.existsSync(handoffPath));
  assert.ok(fs.existsSync(htmlHandoffPath));
  assert.ok(fs.existsSync(reviewPackPath));
  assert.ok(fs.existsSync(htmlReviewPackPath));
  assert.deepEqual(JSON.parse(fs.readFileSync(reviewedItemsPath, "utf8")), {
    recordHeadSha: "abc1234",
    reviewedItemIds: ["keyboard_input", "local_notification"],
    schemaVersion: 1,
  });
  const handoff = fs.readFileSync(handoffPath, "utf8");
  const htmlHandoff = fs.readFileSync(htmlHandoffPath, "utf8");
  assert.match(handoff, /manual-evidence-review-pack\.html/);
  assert.match(htmlHandoff, /<title>iOS 人工验收 Handoff<\/title>/);
  assert.match(htmlHandoff, /href="manual-evidence-review-pack\.html"/);
  assert.match(htmlHandoff, /pnpm prepare:ios-manual-evidence-record/);
  assert.match(htmlHandoff, /本文件不代表验收通过/);
  assert.match(handoff, /manual-evidence-record\.filled\.json/);
  assert.match(handoff, /manual-evidence-gaps\.md/);
  assert.match(result.stdout, /iOS manual acceptance handoff written/);
  assert.match(result.stdout, /iOS manual acceptance HTML handoff written/);
});

test("HTML handoff renders clickable review links and command blocks", () => {
  const html = buildManualAcceptanceHtmlHandoff(reviewRecord(), {
    audit: {
      verdict: "not_complete",
      manualEvidence: {
        packageFreshness: {
          status: "current",
          currentHeadSha: "abc1234",
          recordHeadSha: "abc1234",
        },
        missingEvidenceCount: 0,
        statusCounts: {
          passed: 0,
          pending: 2,
          failed: 0,
          blocked: 0,
          other: 0,
        },
      },
    },
    filledRecordPath: ".tmp/run/manual-evidence-record.filled.json",
    gapsReportPath: ".tmp/run/manual-evidence-gaps.md",
    htmlReviewPackHref: "manual-evidence-review-pack.html",
    htmlReviewPackPath: ".tmp/run/manual-evidence-review-pack.html",
    manualRecordPath: ".tmp/run/manual-evidence-record.review.json",
    reviewedItemsPath: ".tmp/run/manual-evidence-reviewed-items.json",
  });

  assert.match(html, /<title>iOS 人工验收 Handoff<\/title>/);
  assert.match(html, /href="manual-evidence-review-pack\.html"/);
  assert.match(html, /open .tmp\/run\/manual-evidence-review-pack\.html/);
  assert.match(html, /acceptanceVerdict: <code>not_evaluated<\/code>/);
  assert.match(html, /statusCounts: <code>passed=0, pending=2, failed=0, blocked=0, other=0<\/code>/);
  assert.match(html, /data-item-id="keyboard_input"/);
  assert.match(html, /data-item-id="local_notification"/);
  assert.match(html, /id="operator-name"/);
  assert.match(html, /id="confirmed-at"/);
  assert.match(html, /id="generated-sign-command"/);
  assert.match(html, /data-copy-text="open .tmp\/run\/manual-evidence-review-pack\.html"/);
  assert.match(html, /id="copy-generated-sign-command"/);
  assert.match(html, /id="copy-command-status"/);
  assert.match(html, /function copyCommand/);
  assert.match(html, /function updateSignCommand/);
  assert.match(html, /allItemsReviewed/);
  assert.match(html, /--reviewed-items-file .tmp\/run\/manual-evidence-reviewed-items\.json/);
  assert.match(html, /collect:v1-completion-audit/);
});

test("package exposes manual acceptance handoff command", () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(rootDir, "package.json"), "utf8")
  );

  assert.equal(
    packageJson.scripts["prepare:ios-manual-handoff"],
    "node --test scripts/prepare-ios-manual-acceptance-handoff.test.mjs && node scripts/prepare-ios-manual-acceptance-handoff.mjs"
  );
});
