import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildV1CompletionAudit,
  writeV1CompletionAudit,
} from "./collect-v1-completion-audit.mjs";

const rootDir = process.cwd();

function passedManualRecord() {
  return {
    schemaVersion: 1,
    acceptanceVerdict: "passed",
    manualAcceptanceRequired: true,
    automationCanReplaceManualAcceptance: false,
    packageEvidence: {
      acceptanceEvidenceJson: "acceptance-evidence.json",
      manifestJson: "manifest.json",
      manualChecklist: "manual-checklist.todo.md",
    },
    items: [
      {
        id: "navigation_surfaces",
        item: "原生导航 / 页面切换",
        title: "原生导航 / 页面切换",
        status: "passed",
        allowedStatuses: ["pending", "passed", "failed", "blocked"],
        requiredEvidence: {
          screenshots: ["Header Timeline 切换截图"],
          recordings: [],
          apiSummaries: [],
          bridgeMarkers: ["source=native.header.timeline"],
          systemArtifacts: ["pnpm validate:ios-navigation-ui-test 输出或 xcresult"],
        },
        evidence: {
          screenshots: ["evidence/header-timeline.png - Header Timeline 切换截图"],
          recordings: [],
          apiSummaries: [],
          bridgeMarkers: ["source=native.header.timeline"],
          systemArtifacts: [
            "logs/ios-navigation-ui-test.log - pnpm validate:ios-navigation-ui-test 输出或 xcresult",
          ],
          operatorNotes: "人工已复核。",
          blocker: "",
        },
      },
    ],
  };
}

function incompleteManualRecord() {
  const record = passedManualRecord();
  record.acceptanceVerdict = "not_evaluated";
  record.items[0].status = "pending";
  record.items[0].evidence.screenshots = [];
  return record;
}

test("v1 completion audit reports missing manual evidence and required commands", () => {
  const audit = buildV1CompletionAudit({
    commandResults: new Map(),
    generatedAt: "2026-05-29T10:00:00.000Z",
    manualRecordPath: null,
  });

  assert.equal(audit.verdict, "not_complete");
  assert.equal(audit.externalKnowledgeSync.status, "not_synced");
  assert.equal(audit.externalKnowledgeSync.sourceDraftsUpdated, true);
  assert.deepEqual(audit.externalKnowledgeSync.sourceDraftPaths, [
    "docs/knowledge-sync/feishu-pages/03-evolution-log.md",
    "docs/knowledge-sync/feishu-pages/05-ai-workflow-collaboration.md",
  ]);
  assert.deepEqual(audit.externalKnowledgeSync.targets, {
    feishu: "not_synced",
    obsidian: "not_synced",
  });
  assert.deepEqual(audit.externalKnowledgeSync.syncEvidence, []);
  assert.equal(audit.externalKnowledgeSync.finalDisclosureRequired, true);
  assert.match(
    audit.externalKnowledgeSync.finalDisclosure,
    /仓库已更新，外部知识库未同步/
  );
  assert.equal(audit.manualEvidence.status, "missing");
  assert.equal(audit.manualEvidence.requireCompletePassed, false);
  assert.ok(
    audit.automatedCommands.some(
      (command) => command.script === "validate:ios-navigation-ui-test"
    )
  );
  assert.ok(
    audit.automatedCommands.some(
      (command) => command.script === "validate:ios-manual-evidence-record"
    )
  );
  assert.ok(
    audit.automatedCommands.some(
      (command) => command.script === "validate:ios-acceptance-evidence"
    )
  );
  assert.ok(
    audit.automatedCommands.some(
      (command) => command.script === "validate:native-shells"
    )
  );
  assert.match(audit.markdown, /Goal 不能标记 complete/);
  assert.match(audit.markdown, /pnpm validate:ios-navigation-ui-test/);
  assert.match(audit.markdown, /人工证据记录缺失/);
});

test("v1 completion audit can pass when all command and manual evidence inputs pass", () => {
  const record = passedManualRecord();
  const commandResults = new Map(
    buildV1CompletionAudit({ manualRecord: record }).automatedCommands.map(
      (command) => [
        command.script,
        {
          status: "passed",
          command: `pnpm ${command.script}`,
          exitCode: 0,
          durationMs: 10,
        },
      ]
    )
  );

  const audit = buildV1CompletionAudit({
    commandResults,
    generatedAt: "2026-05-29T10:00:00.000Z",
    manualRecord: record,
    manualRecordPath: "manual-evidence-record.filled.json",
  });

  assert.equal(audit.verdict, "passed");
  assert.equal(audit.manualEvidence.status, "passed");
  assert.equal(audit.manualEvidence.missingEvidenceCount, 0);
  assert.equal(audit.externalKnowledgeSync.status, "not_synced");
  assert.equal(audit.externalKnowledgeSync.blocksProductCompletion, false);
  assert.match(audit.markdown, /Goal 可以标记 complete/);
  assert.match(audit.markdown, /外部知识库同步/);
  assert.match(audit.markdown, /仓库已更新，外部知识库未同步/);
});

test("v1 completion audit writes json and markdown artifacts", () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "v1-completion-audit-"));
  const result = writeV1CompletionAudit({
    commandResults: new Map(),
    generatedAt: "2026-05-29T10:00:00.000Z",
    outputDir,
  });

  assert.match(result.jsonPath, /v1-completion-audit\.json$/);
  assert.match(result.markdownPath, /v1-completion-audit\.md$/);
  const json = JSON.parse(fs.readFileSync(result.jsonPath, "utf8"));
  const markdown = fs.readFileSync(result.markdownPath, "utf8");
  assert.equal(json.verdict, "not_complete");
  assert.match(markdown, /# AI 时间管理 Agent v1 completion audit/);
});

test("v1 completion audit archives manual evidence gap report with record input", () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "v1-completion-audit-"));
  const result = writeV1CompletionAudit({
    commandResults: new Map(),
    generatedAt: "2026-05-29T10:00:00.000Z",
    manualRecord: incompleteManualRecord(),
    manualRecordPath: "manual-evidence-record.review.json",
    outputDir,
  });

  const reportPath = path.join(outputDir, "manual-evidence-gaps.md");
  assert.equal(result.manualEvidenceReportPath, reportPath);
  assert.equal(fs.existsSync(reportPath), true);

  const json = JSON.parse(fs.readFileSync(result.jsonPath, "utf8"));
  const markdown = fs.readFileSync(result.markdownPath, "utf8");
  const report = fs.readFileSync(reportPath, "utf8");
  assert.equal(json.manualEvidence.reportPath, "manual-evidence-gaps.md");
  assert.match(markdown, /reportPath: manual-evidence-gaps\.md/);
  assert.match(report, /# iOS 人工验收补证缺口报告/);
  assert.match(report, /原生导航 \/ 页面切换/);
});

test("v1 completion audit does not return a gap report path when record is missing", () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "v1-completion-audit-"));
  const result = writeV1CompletionAudit({
    commandResults: new Map(),
    generatedAt: "2026-05-29T10:00:00.000Z",
    manualRecordPath: "missing-manual-evidence-record.json",
    outputDir,
  });

  assert.equal(result.audit.manualEvidence.status, "missing");
  assert.equal(result.audit.manualEvidence.reportPath, null);
  assert.equal(result.manualEvidenceReportPath, null);
  assert.equal(fs.existsSync(path.join(outputDir, "manual-evidence-gaps.md")), false);
});

test("v1 completion audit CLI ignores pnpm argument separator", () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "v1-completion-audit-"));
  const result = spawnSync(
    "node",
    [
      "scripts/collect-v1-completion-audit.mjs",
      "--",
      "--output-dir",
      outputDir,
    ],
    { cwd: rootDir, encoding: "utf8" }
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /v1 completion audit written/);
  assert.ok(fs.existsSync(path.join(outputDir, "v1-completion-audit.json")));
});

test("v1 completion audit CLI records explicit external knowledge sync", () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "v1-completion-audit-"));
  const result = spawnSync(
    "node",
    [
      "scripts/collect-v1-completion-audit.mjs",
      "--",
      "--output-dir",
      outputDir,
      "--external-knowledge-synced",
      "--source-draft",
      "docs/knowledge-sync/feishu-pages/03-evolution-log.md",
      "--feishu-sync-evidence",
      "logs/lark-sync.log",
      "--obsidian-sync-evidence",
      "obsidian://vault/AI/阶段记录",
      "--external-knowledge-note",
      "已执行 lark-cli docs +update --api-version v2",
    ],
    { cwd: rootDir, encoding: "utf8" }
  );

  assert.equal(result.status, 1);
  const json = JSON.parse(
    fs.readFileSync(path.join(outputDir, "v1-completion-audit.json"), "utf8")
  );
  assert.equal(json.externalKnowledgeSync.status, "synced");
  assert.deepEqual(json.externalKnowledgeSync.targets, {
    feishu: "synced",
    obsidian: "synced",
  });
  assert.equal(json.externalKnowledgeSync.finalDisclosureRequired, false);
  assert.deepEqual(json.externalKnowledgeSync.sourceDraftPaths, [
    "docs/knowledge-sync/feishu-pages/03-evolution-log.md",
  ]);
  assert.deepEqual(json.externalKnowledgeSync.syncEvidence, [
    {
      target: "feishu",
      evidence: "logs/lark-sync.log",
    },
    {
      target: "obsidian",
      evidence: "obsidian://vault/AI/阶段记录",
    },
  ]);
  assert.match(json.externalKnowledgeSync.note, /lark-cli docs \+update/);
});

test("v1 completion audit CLI records partial external knowledge sync status", () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "v1-completion-audit-"));
  const result = spawnSync(
    "node",
    [
      "scripts/collect-v1-completion-audit.mjs",
      "--output-dir",
      outputDir,
      "--external-knowledge-status",
      "partial",
      "--feishu-sync-evidence",
      "logs/lark-sync.log",
    ],
    { cwd: rootDir, encoding: "utf8" }
  );

  assert.equal(result.status, 1);
  const json = JSON.parse(
    fs.readFileSync(path.join(outputDir, "v1-completion-audit.json"), "utf8")
  );
  assert.equal(json.externalKnowledgeSync.status, "partial");
  assert.deepEqual(json.externalKnowledgeSync.targets, {
    feishu: "synced",
    obsidian: "not_synced",
  });
  assert.equal(json.externalKnowledgeSync.finalDisclosureRequired, true);
});

test("v1 completion audit CLI can select --manual-record best from a root", () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "v1-completion-audit-"));
  const recordRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ios-acceptance-evidence-"));
  const weakerDir = path.join(recordRoot, "older-run");
  const betterDir = path.join(recordRoot, "newer-run");
  fs.mkdirSync(weakerDir, { recursive: true });
  fs.mkdirSync(betterDir, { recursive: true });

  fs.writeFileSync(
    path.join(weakerDir, "manual-evidence-record.review.json"),
    `${JSON.stringify(incompleteManualRecord(), null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(betterDir, "manual-evidence-record.review.json"),
    `${JSON.stringify(passedManualRecord(), null, 2)}\n`
  );

  const result = spawnSync(
    "node",
    [
      "scripts/collect-v1-completion-audit.mjs",
      "--output-dir",
      outputDir,
      "--manual-record",
      "best",
      "--manual-record-root",
      recordRoot,
    ],
    { cwd: rootDir, encoding: "utf8" }
  );

  assert.equal(result.status, 1);
  const json = JSON.parse(
    fs.readFileSync(path.join(outputDir, "v1-completion-audit.json"), "utf8")
  );
  assert.equal(json.manualEvidence.status, "passed");
  assert.equal(
    json.manualEvidence.recordPath,
    path.relative(rootDir, path.join(betterDir, "manual-evidence-record.review.json"))
  );
  assert.equal(json.manualEvidence.selection.strategy, "best");
  assert.equal(json.manualEvidence.selection.candidateCount, 2);
});

test("v1 completion audit CLI ignores invalid manual evidence record candidates", () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "v1-completion-audit-"));
  const recordRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ios-acceptance-evidence-"));
  const brokenDir = path.join(recordRoot, "broken-run");
  fs.mkdirSync(brokenDir, { recursive: true });
  fs.writeFileSync(
    path.join(brokenDir, "manual-evidence-record.review.json"),
    "{not-json"
  );

  const result = spawnSync(
    "node",
    [
      "scripts/collect-v1-completion-audit.mjs",
      "--output-dir",
      outputDir,
      "--manual-record",
      "best",
      "--manual-record-root",
      recordRoot,
    ],
    { cwd: rootDir, encoding: "utf8" }
  );

  assert.equal(result.status, 1);
  const json = JSON.parse(
    fs.readFileSync(path.join(outputDir, "v1-completion-audit.json"), "utf8")
  );
  assert.equal(json.manualEvidence.status, "missing");
  assert.equal(json.manualEvidence.recordPath, null);
  assert.equal(json.manualEvidence.selection.candidateCount, 1);
  assert.equal(json.manualEvidence.selection.validCandidateCount, 0);
});

test("package exposes v1 completion audit command", () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(rootDir, "package.json"), "utf8")
  );

  assert.equal(
    packageJson.scripts["collect:v1-completion-audit"],
    "node scripts/collect-v1-completion-audit.mjs"
  );
});
