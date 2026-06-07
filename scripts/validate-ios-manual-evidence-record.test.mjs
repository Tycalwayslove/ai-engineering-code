import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  buildManualEvidenceRecordReport,
  validateManualEvidenceRecord,
} from "./validate-ios-manual-evidence-record.mjs";

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

test("manual evidence report summarizes completion gaps", () => {
  const report = buildManualEvidenceRecordReport(baseRecord(), {
    recordPath: "manual-evidence-record.template.json",
  });

  assert.equal(report.totalItems, 1);
  assert.equal(report.statusCounts.pending, 1);
  assert.equal(report.missingEvidenceCount, 4);
  assert.deepEqual(report.incompleteItems.map((item) => item.id), [
    "voice_input",
  ]);
  assert.match(report.markdown, /# iOS 人工验收补证缺口报告/);
  assert.match(report.markdown, /manual-evidence-record\.template\.json/);
  assert.match(report.markdown, /## 未完成项目/);
  assert.match(report.markdown, /### 语音输入/);
  assert.match(report.markdown, /status: pending/);
  assert.match(report.markdown, /screenshots: 识别文本/);
  assert.match(report.markdown, /apiSummaries: \/reminders\?conversationId=\.\.\./);
  assert.match(report.markdown, /bridgeMarkers: source=native\.composer\.voice/);
});

test("manual evidence report includes global verdict gaps", () => {
  const record = baseRecord();
  record.items[0].status = "passed";
  record.items[0].evidence = {
    screenshots: ["识别文本"],
    recordings: [],
    apiSummaries: ["/reminders?conversationId=..."],
    bridgeMarkers: ["source=native.composer.voice"],
    systemArtifacts: ["iOS 权限弹窗截图或录屏"],
    operatorNotes: "",
    blocker: "",
  };

  const report = buildManualEvidenceRecordReport(record, {
    recordPath: "manual-evidence-record.filled.json",
  });

  assert.deepEqual(report.incompleteItems, []);
  assert.deepEqual(report.globalGaps, [
    "acceptanceVerdict must be passed for completion",
  ]);
  assert.match(report.markdown, /## 全局缺口/);
  assert.match(
    report.markdown,
    /acceptanceVerdict must be passed for completion/
  );
});

test("completion validation accepts passed records with required evidence", () => {
  const record = baseRecord();
  record.headSha = "abc1234";
  record.acceptanceVerdict = "passed";
  record.operatorSignoff = {
    confirmedAt: "2026-06-01T08:00:00.000Z",
    mode: "mark-passed",
    operator: "QA",
    recordHeadSha: "abc1234",
    reviewedItemIds: ["voice_input"],
  };
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

test("completion validation requires operator signoff for passed records", () => {
  const record = baseRecord();
  record.headSha = "abc1234";
  record.acceptanceVerdict = "passed";
  record.items[0].status = "passed";
  record.items[0].evidence = {
    screenshots: ["识别文本"],
    recordings: [],
    apiSummaries: ["/reminders?conversationId=..."],
    bridgeMarkers: ["source=native.composer.voice"],
    systemArtifacts: ["iOS 权限弹窗截图或录屏"],
    operatorNotes: "人工已复核。",
    blocker: "",
  };

  const result = validateManualEvidenceRecord(record, {
    requireComplete: true,
    recordPath: "manual-evidence-record.filled.json",
  });

  assert.ok(
    result.failures.includes(
      "manual-evidence-record.filled.json: operatorSignoff.mode must be mark-passed when --require-complete is used"
    )
  );
});

test("completion validation requires reviewed item ids to match record items", () => {
  const record = baseRecord();
  record.headSha = "abc1234";
  record.acceptanceVerdict = "passed";
  record.operatorSignoff = {
    confirmedAt: "2026-06-01T08:00:00.000Z",
    mode: "mark-passed",
    operator: "QA",
    recordHeadSha: "different",
    reviewedItemIds: ["unknown_item"],
  };
  record.items[0].status = "passed";
  record.items[0].evidence = {
    screenshots: ["识别文本"],
    recordings: [],
    apiSummaries: ["/reminders?conversationId=..."],
    bridgeMarkers: ["source=native.composer.voice"],
    systemArtifacts: ["iOS 权限弹窗截图或录屏"],
    operatorNotes: "人工已复核。",
    blocker: "",
  };

  const result = validateManualEvidenceRecord(record, {
    requireComplete: true,
    recordPath: "manual-evidence-record.filled.json",
  });

  assert.ok(
    result.failures.includes(
      "manual-evidence-record.filled.json: operatorSignoff.reviewedItemIds must exactly match record item ids; missing: voice_input; unknown: unknown_item"
    )
  );
  assert.ok(
    result.failures.includes(
      "manual-evidence-record.filled.json: operatorSignoff.recordHeadSha must match record headSha: different !== abc1234"
    )
  );
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
