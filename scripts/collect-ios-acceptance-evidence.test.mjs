import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const rootDir = process.cwd();
const scriptPath = path.join(rootDir, "scripts", "collect-ios-acceptance-evidence.mjs");
const packageJson = JSON.parse(
  fs.readFileSync(path.join(rootDir, "package.json"), "utf8")
);

test("collect iOS acceptance evidence supports dry-run output with manual gaps", () => {
  const outputDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "ios-acceptance-evidence-")
  );

  const result = spawnSync(
    "node",
    [scriptPath, "--dry-run", "--reset-app", "--output-dir", outputDir],
    {
      cwd: rootDir,
      encoding: "utf8",
    }
  );

  assert.equal(result.status, 0, result.stderr);

  const evidenceJsonPath = path.join(outputDir, "acceptance-evidence.json");
  const manifestPath = path.join(outputDir, "manifest.json");
  const manualChecklistPath = path.join(outputDir, "manual-checklist.todo.md");
  const summaryPath = path.join(outputDir, "summary.md");
  assert.equal(fs.existsSync(evidenceJsonPath), true);
  assert.equal(fs.existsSync(manifestPath), true);
  assert.equal(fs.existsSync(manualChecklistPath), true);
  assert.equal(fs.existsSync(summaryPath), true);

  const evidence = JSON.parse(fs.readFileSync(evidenceJsonPath, "utf8"));
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  assert.equal(evidence.mode, "dry-run");
  assert.equal(evidence.ios.resetApp, true);
  assert.equal(
    evidence.ios.conversationPersistence.storageKey,
    "ai-code.native.conversationId"
  );
  assert.equal(
    evidence.ios.conversationPersistence.expectedPrefix,
    "conversation_ios_"
  );
  assert.equal(evidence.ios.conversationPersistence.stableAcrossRelaunch, null);
  assert.deepEqual(evidence.ios.systemDiagnostics, {});
  assert.deepEqual(Object.keys(evidence.backendFactSnapshot.counts).sort(), [
    "calendarEvents",
    "executionLedger",
    "expenses",
    "reminders",
    "turns",
  ]);
  assert.equal(evidence.backendFactSnapshot.conversationId, null);
  assert.equal(evidence.backendFactSnapshot.available, false);
  assert.equal(evidence.acceptanceFactSeed.enabled, false);
  assert.equal(evidence.acceptanceFactSeed.available, false);
  assert.ok(evidence.acceptanceFactSeed.apiBaseUrl);
  assert.equal(evidence.calendarSystemAppEvidence.enabled, false);
  assert.equal(evidence.calendarSystemAppEvidence.available, false);
  assert.equal(evidence.calendarSystemAppEvidence.supportingOnly, true);
  assert.equal(evidence.calendarCleanupSeed.enabled, false);
  assert.equal(evidence.calendarCleanupSeed.available, false);
  assert.equal(evidence.calendarPermissionDenialSeed.enabled, false);
  assert.equal(evidence.calendarPermissionDenialSeed.available, false);
  assert.equal(evidence.notificationClickBackflow.enabled, false);
  assert.equal(evidence.notificationClickBackflow.available, false);
  assert.equal(evidence.notificationClickBackflow.supportingOnly, true);
  assert.equal(evidence.notificationDelivery.enabled, false);
  assert.equal(evidence.notificationDelivery.available, false);
  assert.equal(evidence.notificationDelivery.supportingOnly, true);
  assert.equal(evidence.h5SurfaceScreenshots.available, false);
  assert.equal(evidence.h5SurfaceScreenshots.conversationId, null);
  assert.deepEqual(Object.keys(evidence.h5SurfaceScreenshots.surfaces), [
    "conversation",
    "timeline",
    "calendar",
    "expenses",
    "reminders",
    "ledger",
    "settings",
  ]);
  assert.match(
    evidence.h5SurfaceScreenshots.surfaces.timeline.path,
    /h5-surfaces\/timeline\.png$/
  );
  assert.equal(evidence.replacesManualAcceptance, false);
  assert.equal(manifest.manualAcceptanceRequired, true);
  assert.equal(manifest.acceptanceVerdict, "not_evaluated");
  assert.equal(manifest.automationCanReplaceManualAcceptance, false);
  assert.equal(
    manifest.items.find((item) => item.item === "会话持久 ID")
      .supportingEvidenceSignals.length,
    0
  );
  assert.equal(
    manifest.items.find((item) => item.item === "后端事实确认")
      .supportingEvidenceSignals.length,
    0
  );
  assert.ok(evidence.generatedAt);
  assert.ok(Array.isArray(evidence.automatedEvidence));
  assert.ok(evidence.automatedEvidence.includes("h5_dev_server_url"));
  assert.ok(evidence.automatedEvidence.includes("simulator_screenshot"));
  assert.ok(evidence.automatedEvidence.includes("native_system_diagnostics"));
  assert.ok(evidence.automatedEvidence.includes("h5_surface_screenshots"));
  assert.equal(evidence.automatedEvidence.includes("acceptance_fact_seed"), false);
  assert.equal(
    evidence.automatedEvidence.includes("system_calendar_app_screenshot"),
    false
  );
  assert.equal(evidence.automatedEvidence.includes("calendar_cleanup_seed"), false);
  assert.equal(
    evidence.automatedEvidence.includes("calendar_permission_denial_seed"),
    false
  );
  assert.equal(
    evidence.automatedEvidence.includes("notification_click_backflow"),
    false
  );
  assert.equal(
    evidence.automatedEvidence.includes("notification_delivery_diagnostics"),
    false
  );
  assert.ok(Array.isArray(evidence.manualEvidenceStillRequired));
  assert.ok(evidence.manualEvidenceStillRequired.includes("语音输入"));
  assert.ok(evidence.manualEvidenceStillRequired.includes("会话持久 ID"));
  assert.ok(evidence.manualEvidenceStillRequired.includes("后端事实确认"));
  assert.ok(evidence.manualEvidenceStillRequired.includes("系统日历写入"));

  const summary = fs.readFileSync(summaryPath, "utf8");
  const manualChecklist = fs.readFileSync(manualChecklistPath, "utf8");
  assert.match(summary, /不能替代真实人工验收/);
  assert.match(manualChecklist, /manual_required/);
  assert.match(summary, /语音输入/);
  assert.match(summary, /系统日历写入/);
  assert.match(summary, /后端事实摘要/);
  assert.match(summary, /H5 同会话页面截图/);
  assert.match(summary, /已采集的辅助证据信号/);
  assert.match(summary, /Native 系统诊断摘要/);
  assert.match(manualChecklist, /bridge_marker: source=native\.composer\.voice/);
  assert.match(manualChecklist, /## 会话持久 ID/);
  assert.match(manualChecklist, /api_summary: \/agent\/conversations\/\{conversationId\}\/turns/);
  assert.match(manualChecklist, /## 后端事实确认/);
  assert.match(manualChecklist, /api_summary: \/reminders\?conversationId=\.\.\./);
  assert.match(manualChecklist, /system_artifact: iOS 系统日历事件截图/);
});

test("collect iOS acceptance evidence can opt into notification click backflow support", () => {
  const outputDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "ios-acceptance-evidence-notification-click-")
  );

  const result = spawnSync(
    "node",
    [
      scriptPath,
      "--dry-run",
      "--seed-notification-click-backflow",
      "--output-dir",
      outputDir,
    ],
    {
      cwd: rootDir,
      encoding: "utf8",
    }
  );

  assert.equal(result.status, 0, result.stderr);

  const evidence = JSON.parse(
    fs.readFileSync(path.join(outputDir, "acceptance-evidence.json"), "utf8")
  );
  const summary = fs.readFileSync(path.join(outputDir, "summary.md"), "utf8");

  assert.equal(evidence.notificationClickBackflow.enabled, true);
  assert.equal(evidence.notificationClickBackflow.available, false);
  assert.equal(evidence.notificationClickBackflow.supportingOnly, true);
  assert.equal(
    evidence.notificationClickBackflow.mode,
    "h5_synthetic_native_event"
  );
  assert.equal(evidence.notificationClickBackflow.reminderId, null);
  assert.equal(evidence.notificationClickBackflow.notificationIdentifier, null);
  assert.match(evidence.notificationClickBackflow.seedInput, /分钟后提醒我/);
  assert.equal(evidence.notificationClickBackflow.seedNow.endsWith("+08:00"), true);
  assert.match(
    evidence.notificationClickBackflow.h5OpenedScreenshotPath,
    /notification-click-backflow\.png$/
  );
  assert.ok(evidence.automatedEvidence.includes("notification_click_backflow"));
  assert.match(summary, /通知点击回流辅助证据/);
  assert.match(summary, /不替代真实系统通知点击/);
});

test("collect iOS acceptance evidence can opt into notification delivery diagnostics", () => {
  const outputDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "ios-acceptance-evidence-notification-delivery-")
  );

  const result = spawnSync(
    "node",
    [
      scriptPath,
      "--dry-run",
      "--seed-notification-delivery",
      "--output-dir",
      outputDir,
    ],
    {
      cwd: rootDir,
      encoding: "utf8",
    }
  );

  assert.equal(result.status, 0, result.stderr);

  const evidence = JSON.parse(
    fs.readFileSync(path.join(outputDir, "acceptance-evidence.json"), "utf8")
  );
  const summary = fs.readFileSync(path.join(outputDir, "summary.md"), "utf8");

  assert.equal(evidence.notificationDelivery.enabled, true);
  assert.equal(evidence.notificationDelivery.available, false);
  assert.equal(evidence.notificationDelivery.supportingOnly, true);
  assert.equal(evidence.notificationDelivery.mode, "delivered_diagnostics");
  assert.equal(evidence.notificationDelivery.reminderId, null);
  assert.equal(evidence.notificationDelivery.notificationIdentifier, null);
  assert.equal(evidence.notificationDelivery.pendingNotificationFound, false);
  assert.equal(evidence.notificationDelivery.deliveredNotificationFound, false);
  assert.match(evidence.notificationDelivery.seedInput, /^2分钟后提醒我/);
  assert.equal(evidence.notificationDelivery.seedNow.endsWith("+08:00"), true);
  assert.equal(
    Number.isInteger(evidence.notificationDelivery.waitAfterDueMs),
    true
  );
  assert.ok(evidence.notificationDelivery.waitAfterDueMs >= 15000);
  assert.equal(
    Number.isInteger(evidence.notificationDelivery.pendingRefreshMaxAttempts),
    true
  );
  assert.ok(evidence.notificationDelivery.pendingRefreshMaxAttempts >= 8);
  assert.equal(
    Number.isInteger(evidence.notificationDelivery.deliveredRefreshMaxAttempts),
    true
  );
  assert.ok(evidence.notificationDelivery.deliveredRefreshMaxAttempts >= 8);
  assert.ok(
    evidence.automatedEvidence.includes("notification_delivery_diagnostics")
  );
  assert.match(summary, /通知投递诊断辅助证据/);
  assert.match(summary, /不替代真实系统通知展示或点击/);
});

test("collect iOS acceptance evidence can opt into calendar permission denial seed", () => {
  const outputDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "ios-acceptance-evidence-permission-denial-")
  );

  const result = spawnSync(
    "node",
    [
      scriptPath,
      "--dry-run",
      "--seed-calendar-permission-denial",
      "--output-dir",
      outputDir,
    ],
    {
      cwd: rootDir,
      encoding: "utf8",
    }
  );

  assert.equal(result.status, 0, result.stderr);

  const evidence = JSON.parse(
    fs.readFileSync(path.join(outputDir, "acceptance-evidence.json"), "utf8")
  );
  const summary = fs.readFileSync(path.join(outputDir, "summary.md"), "utf8");

  assert.equal(evidence.calendarPermissionDenialSeed.enabled, true);
  assert.equal(evidence.calendarPermissionDenialSeed.available, false);
  assert.equal(evidence.calendarPermissionDenialSeed.targetEventId, null);
  assert.equal(evidence.calendarPermissionDenialSeed.permissionService, "calendar");
  assert.ok(
    evidence.automatedEvidence.includes("calendar_permission_denial_seed")
  );
  assert.match(summary, /日历权限拒绝降级种子/);
  assert.match(summary, /仅在显式开启时撤销模拟器日历权限/);
});

test("collect iOS acceptance evidence can opt into seeded acceptance facts", () => {
  const outputDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "ios-acceptance-evidence-seed-")
  );

  const result = spawnSync(
    "node",
    [
      scriptPath,
      "--dry-run",
      "--seed-acceptance-facts",
      "--output-dir",
      outputDir,
    ],
    {
      cwd: rootDir,
      encoding: "utf8",
    }
  );

  assert.equal(result.status, 0, result.stderr);

  const evidence = JSON.parse(
    fs.readFileSync(path.join(outputDir, "acceptance-evidence.json"), "utf8")
  );
  const summary = fs.readFileSync(path.join(outputDir, "summary.md"), "utf8");

  assert.equal(evidence.acceptanceFactSeed.enabled, true);
  assert.equal(evidence.acceptanceFactSeed.available, false);
  assert.equal(evidence.acceptanceFactSeed.seedNow.endsWith("+08:00"), true);
  assert.equal(evidence.acceptanceFactSeed.apiBaseUrl, "http://127.0.0.1:8000");
  assert.match(evidence.acceptanceFactSeed.seedRunId, /^seed_/);
  assert.ok(
    evidence.acceptanceFactSeed.inputs.every((input) =>
      input.input.includes(evidence.acceptanceFactSeed.seedRunId)
    )
  );
  assert.deepEqual(
    evidence.acceptanceFactSeed.inputs.map((input) => input.domain),
    ["calendar", "expense", "reminder"]
  );
  assert.ok(evidence.automatedEvidence.includes("acceptance_fact_seed"));
  assert.match(summary, /验收事实种子/);
  assert.match(summary, /仅在显式开启时写入/);
});

test("collect iOS acceptance evidence can opt into system Calendar app screenshot", () => {
  const outputDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "ios-acceptance-evidence-calendar-app-")
  );

  const result = spawnSync(
    "node",
    [
      scriptPath,
      "--dry-run",
      "--seed-acceptance-facts",
      "--capture-calendar-system-app",
      "--output-dir",
      outputDir,
    ],
    {
      cwd: rootDir,
      encoding: "utf8",
    }
  );

  assert.equal(result.status, 0, result.stderr);

  const evidence = JSON.parse(
    fs.readFileSync(path.join(outputDir, "acceptance-evidence.json"), "utf8")
  );
  const summary = fs.readFileSync(path.join(outputDir, "summary.md"), "utf8");

  assert.equal(evidence.calendarSystemAppEvidence.enabled, true);
  assert.equal(evidence.calendarSystemAppEvidence.available, false);
  assert.equal(evidence.calendarSystemAppEvidence.supportingOnly, true);
  assert.equal(
    evidence.calendarSystemAppEvidence.requiresAcceptanceFactSeed,
    true
  );
  assert.match(
    evidence.calendarSystemAppEvidence.screenshotPath,
    /system-calendar-app\.png$/
  );
  assert.ok(
    evidence.automatedEvidence.includes("system_calendar_app_screenshot")
  );
  assert.match(summary, /系统 Calendar App 辅助截图/);
  assert.match(summary, /不替代人工复核/);
});

test("collect iOS acceptance evidence can opt into calendar cleanup seed", () => {
  const outputDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "ios-acceptance-evidence-cleanup-")
  );

  const result = spawnSync(
    "node",
    [
      scriptPath,
      "--dry-run",
      "--seed-acceptance-facts",
      "--seed-calendar-cleanup",
      "--output-dir",
      outputDir,
    ],
    {
      cwd: rootDir,
      encoding: "utf8",
    }
  );

  assert.equal(result.status, 0, result.stderr);

  const evidence = JSON.parse(
    fs.readFileSync(path.join(outputDir, "acceptance-evidence.json"), "utf8")
  );
  const summary = fs.readFileSync(path.join(outputDir, "summary.md"), "utf8");

  assert.equal(evidence.calendarCleanupSeed.enabled, true);
  assert.equal(evidence.calendarCleanupSeed.available, false);
  assert.equal(evidence.calendarCleanupSeed.requiresAcceptanceFactSeed, true);
  assert.equal(evidence.calendarCleanupSeed.targetEventId, null);
  assert.ok(evidence.automatedEvidence.includes("calendar_cleanup_seed"));
  assert.match(summary, /系统日历取消清理种子/);
  assert.match(summary, /仅在显式开启时取消 seed 日程/);
});

test("package exposes iOS acceptance evidence collection command", () => {
  assert.equal(
    packageJson.scripts["collect:ios-acceptance-evidence"],
    "node scripts/collect-ios-acceptance-evidence.mjs"
  );
  assert.equal(
    packageJson.scripts["validate:ios-acceptance-evidence"],
    "node --test scripts/collect-ios-acceptance-evidence.test.mjs"
  );
});
