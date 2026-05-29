import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { validateManualEvidenceRecord } from "./validate-ios-manual-evidence-record.mjs";

const rootDir = process.cwd();

function baseRecord() {
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

test("pending manual evidence record template is structurally valid", () => {
  const result = validateManualEvidenceRecord(baseRecord(), {
    requireComplete: false,
    recordPath: "manual-evidence-record.template.json",
  });

  assert.deepEqual(result.failures, []);
});

test("completion validation rejects pending records without evidence", () => {
  const result = validateManualEvidenceRecord(baseRecord(), {
    requireComplete: true,
    recordPath: "manual-evidence-record.template.json",
  });

  assert.ok(
    result.failures.includes(
      "manual-evidence-record.template.json: acceptanceVerdict must be passed when --require-complete is used"
    )
  );
  assert.ok(
    result.failures.includes(
      "manual-evidence-record.template.json: items[0] 语音输入 status must be passed for completion, got pending"
    )
  );
  assert.ok(
    result.failures.includes(
      "manual-evidence-record.template.json: items[0] 语音输入 missing screenshots evidence for 识别文本"
    )
  );
  assert.ok(
    result.failures.includes(
      "manual-evidence-record.template.json: items[0] 语音输入 missing bridgeMarkers evidence for source=native.composer.voice"
    )
  );
});

test("completion validation accepts passed records with required evidence", () => {
  const record = baseRecord();
  record.acceptanceVerdict = "passed";
  record.items[0].status = "passed";
  record.items[0].evidence = {
    screenshots: ["evidence/voice-text.png - 识别文本"],
    recordings: [],
    apiSummaries: [
      "GET /reminders?conversationId=... conversation_ios_123 -> scheduled",
    ],
    bridgeMarkers: ["source=native.composer.voice"],
    systemArtifacts: ["evidence/voice-permission.mov - iOS 权限弹窗截图或录屏"],
    operatorNotes: "Simulator iPhone 16 Pro Max, iOS 18.3",
    blocker: "",
  };

  const result = validateManualEvidenceRecord(record, {
    requireComplete: true,
    recordPath: "manual-evidence-record.filled.json",
  });

  assert.deepEqual(result.failures, []);
});

test("package exposes manual evidence record validation command", () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(rootDir, "package.json"), "utf8")
  );

  assert.equal(
    packageJson.scripts["validate:ios-manual-evidence-record"],
    "node --test scripts/validate-ios-manual-evidence-record.test.mjs && node scripts/validate-ios-manual-evidence-record.mjs"
  );
});
