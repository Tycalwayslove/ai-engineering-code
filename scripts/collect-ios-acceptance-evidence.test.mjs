import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const rootDir = process.cwd();
const scriptPath = path.join(rootDir, "scripts", "collect-ios-acceptance-evidence.mjs");
const h5ComponentsPath = path.join(
  rootDir,
  "apps",
  "h5",
  "src",
  "app",
  "ai-time-agent",
  "components.tsx"
);
const h5BackendApiPath = path.join(
  rootDir,
  "apps",
  "h5",
  "src",
  "app",
  "ai-time-agent",
  "backendApi.ts"
);
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
      env: {
        ...process.env,
        AI_CODE_IOS_NAVIGATION_UI_TEST_METADATA_PATH: path.join(
          outputDir,
          "missing-navigation-ui-test.json"
        ),
        AI_CODE_IOS_KEYBOARD_UI_TEST_METADATA_PATH: path.join(
          outputDir,
          "missing-keyboard-ui-test.json"
        ),
        AI_CODE_IOS_VOICE_UI_TEST_METADATA_PATH: path.join(
          outputDir,
          "missing-voice-ui-test.json"
        ),
      },
    }
  );

  assert.equal(result.status, 0, result.stderr);

  const evidenceJsonPath = path.join(outputDir, "acceptance-evidence.json");
  const manifestPath = path.join(outputDir, "manifest.json");
  const manualChecklistPath = path.join(outputDir, "manual-checklist.todo.md");
  const manualEvidenceRecordPath = path.join(
    outputDir,
    "manual-evidence-record.template.json"
  );
  const manualEvidenceDraftPath = path.join(
    outputDir,
    "manual-evidence-record.draft.json"
  );
  const manualEvidenceReviewPath = path.join(
    outputDir,
    "manual-evidence-record.review.json"
  );
  const summaryPath = path.join(outputDir, "summary.md");
  assert.equal(fs.existsSync(evidenceJsonPath), true);
  assert.equal(fs.existsSync(manifestPath), true);
  assert.equal(fs.existsSync(manualChecklistPath), true);
  assert.equal(fs.existsSync(manualEvidenceRecordPath), true);
  assert.equal(fs.existsSync(manualEvidenceDraftPath), true);
  assert.equal(fs.existsSync(manualEvidenceReviewPath), true);
  assert.equal(fs.existsSync(summaryPath), true);

  const evidence = JSON.parse(fs.readFileSync(evidenceJsonPath, "utf8"));
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const manualEvidenceRecord = JSON.parse(
    fs.readFileSync(manualEvidenceRecordPath, "utf8")
  );
  const manualEvidenceDraft = JSON.parse(
    fs.readFileSync(manualEvidenceDraftPath, "utf8")
  );
  const manualEvidenceReview = JSON.parse(
    fs.readFileSync(manualEvidenceReviewPath, "utf8")
  );
  assert.equal(evidence.mode, "dry-run");
  assert.equal(evidence.serviceHealth.h5NativeTargetMarkerFound, false);
  assert.match(
    evidence.serviceHealth.h5NativeTargetUrl,
    /^http:\/\/127\.0\.0\.1:3000/
  );
  assert.equal(evidence.ios.resetApp, true);
  assert.equal(evidence.ios.h5DevServerTargetMarkerFound, false);
  assert.equal(evidence.ios.h5DevServerTargetUrl, null);
  assert.equal(evidence.ios.commands.h5DevServerDocument.ok, true);
  assert.match(
    evidence.ios.commands.h5DevServerDocument.stdout,
    /\[dry-run\] curl -fsS --max-time \d+ <h5-url>/
  );
  assert.match(
    evidence.serviceHealth.commands.h5.command,
    /curl -fsS --max-time \d+ -o \/dev\/null -w %\{http_code\} http:\/\/127\.0\.0\.1:3000/
  );
  assert.match(
    evidence.serviceHealth.commands.h5Document.command,
    /curl -fsS --max-time \d+ http:\/\/127\.0\.0\.1:3000/
  );
  assert.equal(
    evidence.ios.conversationPersistence.storageKey,
    "ai-code.native.conversationId"
  );
  assert.equal(
    evidence.ios.conversationPersistence.expectedPrefix,
    "conversation_ios_"
  );
  assert.match(
    evidence.ios.conversationPersistence.beforeRelaunchScreenshotPath,
    /conversation-before-relaunch\.png$/
  );
  assert.match(
    evidence.ios.conversationPersistence.afterRelaunchScreenshotPath,
    /conversation-after-relaunch\.png$/
  );
  assert.match(
    evidence.ios.conversationPersistence.commands.screenshotBeforeRelaunch.command,
    /xcrun simctl io .* screenshot .*conversation-before-relaunch\.png/
  );
  assert.match(
    evidence.ios.conversationPersistence.commands.screenshotAfterRelaunch.command,
    /xcrun simctl io .* screenshot .*conversation-after-relaunch\.png/
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
  assert.equal(evidence.ios.calendarAccessPreparation.enabled, false);
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
  assert.equal(evidence.notificationSyncBridge.enabled, false);
  assert.equal(evidence.notificationSyncBridge.available, false);
  assert.equal(evidence.notificationSyncBridge.supportingOnly, true);
  assert.equal(evidence.navigationUiTest.available, false);
  assert.match(
    evidence.navigationUiTest.metadataPath,
    /missing-navigation-ui-test\.json$/
  );
  assert.equal(evidence.keyboardUiTest.available, false);
  assert.match(
    evidence.keyboardUiTest.metadataPath,
    /missing-keyboard-ui-test\.json$/
  );
  assert.equal(evidence.voiceUiTest.available, false);
  assert.match(
    evidence.voiceUiTest.metadataPath,
    /missing-voice-ui-test\.json$/
  );
  assert.equal(evidence.h5SurfaceScreenshots.available, false);
  assert.equal(evidence.h5SurfaceScreenshots.conversationId, null);
  assert.match(
    evidence.h5SurfaceScreenshots.errorDiagnostics.screenshotPath,
    /h5-surface-error\.png$/
  );
  assert.match(
    evidence.h5SurfaceScreenshots.errorDiagnostics.htmlPath,
    /h5-surface-error\.html$/
  );
  assert.equal(evidence.h5SurfaceScreenshots.errorDiagnostics.pageUrl, null);
  assert.equal(evidence.h5SurfaceScreenshots.errorDiagnostics.pageTitle, null);
  assert.equal(evidence.h5SurfaceScreenshots.errorDiagnostics.bodyTextPreview, null);
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
  assert.equal(manifest.manualEvidenceRecordTemplate, "manual-evidence-record.template.json");
  assert.equal(manifest.manualEvidenceRecordDraft, "manual-evidence-record.draft.json");
  assert.equal(manualEvidenceRecord.schemaVersion, 1);
  assert.equal(manualEvidenceRecord.acceptanceVerdict, "not_evaluated");
  assert.equal(manualEvidenceRecord.manualAcceptanceRequired, true);
  assert.equal(manualEvidenceRecord.automationCanReplaceManualAcceptance, false);
  assert.equal(manualEvidenceRecord.packageEvidence.acceptanceEvidenceJson, "acceptance-evidence.json");
  assert.equal(manualEvidenceRecord.packageEvidence.manifestJson, "manifest.json");
  assert.equal(manualEvidenceRecord.packageEvidence.manualChecklist, "manual-checklist.todo.md");
  assert.equal(manualEvidenceDraft.schemaVersion, 1);
  assert.equal(manualEvidenceDraft.acceptanceVerdict, "not_evaluated");
  assert.equal(manualEvidenceDraft.manualAcceptanceRequired, true);
  assert.equal(manualEvidenceDraft.automationCanReplaceManualAcceptance, false);
  assert.equal(manualEvidenceDraft.generatedFromTemplate, "manual-evidence-record.template.json");
  assert.equal(manualEvidenceReview.generatedFromDraft, "manual-evidence-record.draft.json");
  assert.equal(manualEvidenceReview.items[0].status, "pending");
  assert.match(manualEvidenceReview.instructions, /人工复核/);
  assert.equal(manualEvidenceDraft.items.length, manualEvidenceRecord.items.length);
  assert.ok(Array.isArray(manualEvidenceRecord.items));
  assert.ok(
    manualEvidenceRecord.items.some((item) => item.item === "H5 地址覆盖")
  );
  const voiceManualItem = manualEvidenceRecord.items.find(
    (item) => item.item === "语音输入"
  );
  assert.equal(voiceManualItem.id, "voice_input");
  assert.equal(voiceManualItem.title, "语音输入");
  assert.equal(voiceManualItem.status, "pending");
  assert.deepEqual(voiceManualItem.allowedStatuses, [
    "pending",
    "passed",
    "failed",
    "blocked",
  ]);
  assert.ok(
    voiceManualItem.requiredEvidence.bridgeMarkers.includes(
      "source=native.composer.voice"
    )
  );
  assert.ok(
    voiceManualItem.requiredEvidence.systemArtifacts.includes(
      "iOS 权限弹窗截图或录屏"
    )
  );
  assert.deepEqual(voiceManualItem.evidence.screenshots, []);
  assert.deepEqual(voiceManualItem.evidence.apiSummaries, []);
  assert.equal(voiceManualItem.evidence.operatorNotes, "");
  const draftVoiceItem = manualEvidenceDraft.items.find(
    (item) => item.id === "voice_input"
  );
  assert.equal(draftVoiceItem.status, "pending");
  assert.equal(draftVoiceItem.evidence.operatorNotes, "待人工补充。");
  assert.deepEqual(draftVoiceItem.evidence.apiSummaries, []);
  const navigationManualItem = manualEvidenceRecord.items.find(
    (item) => item.id === "navigation_surfaces"
  );
  assert.equal(navigationManualItem.item, "原生导航 / 页面切换");
  assert.ok(
    navigationManualItem.requiredEvidence.bridgeMarkers.includes(
      "source=native.header.timeline"
    )
  );
  assert.ok(
    navigationManualItem.requiredEvidence.bridgeMarkers.includes(
      "source=native.drawer.quick-switch"
    )
  );
  assert.ok(
    navigationManualItem.requiredEvidence.systemArtifacts.includes(
      "pnpm validate:ios-navigation-ui-test 输出或 xcresult"
    )
  );
  const navigationReviewItem = manualEvidenceReview.items.find(
    (item) => item.id === "navigation_surfaces"
  );
  assert.equal(navigationReviewItem.status, "pending");
  assert.match(navigationReviewItem.acceptanceNote, /候选证据不等于人工验收通过/);
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
  assert.ok(evidence.manualEvidenceStillRequired.includes("原生导航 / 页面切换"));
  assert.ok(evidence.manualEvidenceStillRequired.includes("后端事实确认"));
  assert.ok(evidence.manualEvidenceStillRequired.includes("系统日历写入"));

  const summary = fs.readFileSync(summaryPath, "utf8");
  const manualChecklist = fs.readFileSync(manualChecklistPath, "utf8");
  assert.match(summary, /不能替代真实人工验收/);
  assert.match(manualChecklist, /manual_required/);
  assert.match(summary, /语音输入/);
  assert.match(summary, /原生导航 \/ 页面切换/);
  assert.match(summary, /系统日历写入/);
  assert.match(summary, /后端事实摘要/);
  assert.match(summary, /H5 同会话页面截图/);
  assert.match(summary, /H5 失败诊断截图/);
  assert.match(summary, /已采集的辅助证据信号/);
  assert.match(summary, /Native 系统诊断摘要/);
  assert.match(summary, /H5DevServerURL 目标页面识别/);
  assert.match(manualChecklist, /record_id: voice_input/);
  assert.match(manualChecklist, /bridge_marker: source=native\.composer\.voice/);
  assert.match(manualChecklist, /record_id: navigation_surfaces/);
  assert.match(manualChecklist, /bridge_marker: source=native\.header\.timeline/);
  assert.match(manualChecklist, /bridge_marker: source=native\.drawer\.quick-switch/);
  assert.match(manualChecklist, /## 会话持久 ID/);
  assert.match(manualChecklist, /api_summary: \/agent\/conversations\/\{conversationId\}\/turns/);
  assert.match(manualChecklist, /## 后端事实确认/);
  assert.match(manualChecklist, /api_summary: \/reminders\?conversationId=\.\.\./);
  assert.match(manualChecklist, /system_artifact: iOS 系统日历事件截图/);
});

test("collect iOS acceptance evidence reads voice UI test metadata", () => {
  const outputDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "ios-acceptance-evidence-voice-ui-")
  );
  const artifactDir = path.join(outputDir, "voice-artifacts");
  const logPath = path.join(artifactDir, "ios-voice-ui-test.log");
  const metadataPath = path.join(artifactDir, "voice-ui-test.json");
  const resultBundlePath = path.join(artifactDir, "ios-voice-ui-test.xcresult");
  fs.mkdirSync(resultBundlePath, { recursive: true });
  fs.writeFileSync(logPath, "voice ui test log");
  fs.writeFileSync(
    metadataPath,
    `${JSON.stringify({
      generatedAt: "2026-06-01T00:00:00.000Z",
      logPath,
      passed: true,
      resultBundlePath,
      screenshotAttachments: {
        confirmationCard: "H5 确认卡",
        recognizedText: "识别文本",
      },
      sourceMarkers: ["source=native.composer.voice"],
    })}\n`
  );

  const result = spawnSync(
    "node",
    [scriptPath, "--dry-run", "--output-dir", outputDir],
    {
      cwd: rootDir,
      encoding: "utf8",
      env: {
        ...process.env,
        AI_CODE_IOS_VOICE_UI_TEST_METADATA_PATH: metadataPath,
      },
    }
  );

  assert.equal(result.status, 0, result.stderr);

  const evidence = JSON.parse(
    fs.readFileSync(path.join(outputDir, "acceptance-evidence.json"), "utf8")
  );
  const manifest = JSON.parse(
    fs.readFileSync(path.join(outputDir, "manifest.json"), "utf8")
  );
  const review = JSON.parse(
    fs.readFileSync(path.join(outputDir, "manual-evidence-record.review.json"), "utf8")
  );
  const voiceReviewItem = review.items.find((item) => item.id === "voice_input");

  assert.equal(evidence.voiceUiTest.available, true);
  assert.equal(evidence.voiceUiTest.logPath, logPath);
  assert.equal(evidence.voiceUiTest.resultBundlePath, resultBundlePath);
  assert.equal(evidence.voiceUiTest.screenshotAttachments.recognizedText, "识别文本");
  assert.ok(evidence.automatedEvidence.includes("ios_voice_ui_test_artifact"));
  assert.ok(
    manifest.items
      .find((item) => item.item === "语音输入")
      .supportingEvidenceSignals.includes("ios_voice_ui_test_artifact")
  );
  assert.equal(voiceReviewItem.status, "pending");
  assert.match(voiceReviewItem.evidence.screenshots.join("\n"), /识别文本/);
  assert.match(voiceReviewItem.evidence.screenshots.join("\n"), /H5 确认卡/);
  assert.match(voiceReviewItem.evidence.apiSummaries.join("\n"), /reminders/);
  assert.match(voiceReviewItem.evidence.bridgeMarkers.join("\n"), /source=native\.composer\.voice/);
  assert.match(voiceReviewItem.evidence.systemArtifacts.join("\n"), /ios-voice-ui-test\.log/);
  assert.match(voiceReviewItem.evidence.systemArtifacts.join("\n"), /ios-voice-ui-test\.xcresult/);
});

test("collect iOS acceptance evidence reads voice permission UI test metadata", () => {
  const outputDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "ios-acceptance-evidence-voice-permission-ui-")
  );
  const artifactDir = path.join(outputDir, "voice-permission-artifacts");
  const logPath = path.join(artifactDir, "ios-voice-permission-ui-test.log");
  const metadataPath = path.join(artifactDir, "voice-permission-ui-test.json");
  const resultBundlePath = path.join(
    artifactDir,
    "ios-voice-permission-ui-test.xcresult"
  );
  fs.mkdirSync(resultBundlePath, { recursive: true });
  fs.writeFileSync(logPath, "voice permission ui test log");
  fs.writeFileSync(
    metadataPath,
    `${JSON.stringify({
      generatedAt: "2026-06-01T00:00:00.000Z",
      logPath,
      passed: true,
      resultBundlePath,
      screenshotAttachments: {
        permissionPrompt: "麦克风 / 语音识别权限弹窗",
      },
      systemArtifacts: ["iOS 权限弹窗截图或录屏"],
    })}\n`
  );

  const result = spawnSync(
    "node",
    [scriptPath, "--dry-run", "--output-dir", outputDir],
    {
      cwd: rootDir,
      encoding: "utf8",
      env: {
        ...process.env,
        AI_CODE_IOS_VOICE_PERMISSION_UI_TEST_METADATA_PATH: metadataPath,
      },
    }
  );

  assert.equal(result.status, 0, result.stderr);

  const evidence = JSON.parse(
    fs.readFileSync(path.join(outputDir, "acceptance-evidence.json"), "utf8")
  );
  const manifest = JSON.parse(
    fs.readFileSync(path.join(outputDir, "manifest.json"), "utf8")
  );
  const review = JSON.parse(
    fs.readFileSync(path.join(outputDir, "manual-evidence-record.review.json"), "utf8")
  );
  const voiceReviewItem = review.items.find((item) => item.id === "voice_input");

  assert.equal(evidence.voicePermissionUiTest.available, true);
  assert.equal(evidence.voicePermissionUiTest.logPath, logPath);
  assert.equal(evidence.voicePermissionUiTest.resultBundlePath, resultBundlePath);
  assert.equal(
    evidence.voicePermissionUiTest.screenshotAttachments.permissionPrompt,
    "麦克风 / 语音识别权限弹窗"
  );
  assert.ok(
    evidence.automatedEvidence.includes("ios_voice_permission_ui_test_artifact")
  );
  assert.ok(
    manifest.items
      .find((item) => item.item === "语音输入")
      .supportingEvidenceSignals.includes("ios_voice_permission_ui_test_artifact")
  );
  assert.equal(voiceReviewItem.status, "pending");
  assert.match(
    voiceReviewItem.evidence.screenshots.join("\n"),
    /麦克风 \/ 语音识别权限弹窗/
  );
  assert.match(
    voiceReviewItem.evidence.systemArtifacts.join("\n"),
    /iOS 权限弹窗截图或录屏/
  );
  assert.match(
    voiceReviewItem.evidence.systemArtifacts.join("\n"),
    /ios-voice-permission-ui-test\.xcresult/
  );
});

test("collect iOS acceptance evidence reads notification UI test metadata", () => {
  const outputDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "ios-acceptance-evidence-notification-ui-")
  );
  const artifactDir = path.join(outputDir, "notification-artifacts");
  const logPath = path.join(artifactDir, "ios-notification-ui-test.log");
  const metadataPath = path.join(artifactDir, "notification-ui-test.json");
  const resultBundlePath = path.join(
    artifactDir,
    "ios-notification-ui-test.xcresult"
  );
  const videoPath = path.join(artifactDir, "system-notification-click.mp4");
  fs.mkdirSync(resultBundlePath, { recursive: true });
  fs.writeFileSync(logPath, "notification ui test log");
  fs.writeFileSync(videoPath, "fake video");
  fs.writeFileSync(
    metadataPath,
    `${JSON.stringify({
      generatedAt: "2026-06-01T00:00:00.000Z",
      logPath,
      passed: true,
      resultBundlePath,
      screenshotAttachments: {
        systemNotification: "系统通知截图",
        notificationClickBackflow: "通知点击后 App 回流",
      },
      systemArtifacts: ["系统通知截图", "系统通知点击录屏"],
      videoPath,
    })}\n`
  );

  const result = spawnSync(
    "node",
    [scriptPath, "--dry-run", "--output-dir", outputDir],
    {
      cwd: rootDir,
      encoding: "utf8",
      env: {
        ...process.env,
        AI_CODE_IOS_NOTIFICATION_UI_TEST_METADATA_PATH: metadataPath,
      },
    }
  );

  assert.equal(result.status, 0, result.stderr);

  const evidence = JSON.parse(
    fs.readFileSync(path.join(outputDir, "acceptance-evidence.json"), "utf8")
  );
  const manifest = JSON.parse(
    fs.readFileSync(path.join(outputDir, "manifest.json"), "utf8")
  );
  const review = JSON.parse(
    fs.readFileSync(path.join(outputDir, "manual-evidence-record.review.json"), "utf8")
  );
  const notificationReviewItem = review.items.find(
    (item) => item.id === "local_notification"
  );
  const clickReviewItem = review.items.find(
    (item) => item.id === "notification_click_backflow"
  );

  assert.equal(evidence.notificationUiTest.available, true);
  assert.equal(evidence.notificationUiTest.logPath, logPath);
  assert.equal(evidence.notificationUiTest.resultBundlePath, resultBundlePath);
  assert.equal(evidence.notificationUiTest.videoPath, videoPath);
  assert.ok(
    evidence.automatedEvidence.includes("ios_notification_ui_test_artifact")
  );
  assert.ok(
    manifest.items
      .find((item) => item.item === "本地通知")
      .supportingEvidenceSignals.includes("ios_notification_ui_test_artifact")
  );
  assert.equal(notificationReviewItem.status, "pending");
  assert.match(
    notificationReviewItem.evidence.systemArtifacts.join("\n"),
    /系统通知截图/
  );
  assert.equal(clickReviewItem.status, "pending");
  assert.match(
    clickReviewItem.evidence.systemArtifacts.join("\n"),
    /系统通知点击录屏/
  );
  assert.match(clickReviewItem.evidence.systemArtifacts.join("\n"), /\.mp4/);
});

test("collect iOS acceptance evidence reads attachment UI test metadata", () => {
  const outputDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "ios-acceptance-evidence-attachment-ui-")
  );
  const artifactDir = path.join(outputDir, "attachment-artifacts");
  const logPath = path.join(artifactDir, "ios-attachment-ui-test.log");
  const metadataPath = path.join(artifactDir, "attachment-ui-test.json");
  const resultBundlePath = path.join(artifactDir, "ios-attachment-ui-test.xcresult");
  fs.mkdirSync(resultBundlePath, { recursive: true });
  fs.writeFileSync(logPath, "attachment ui test log");
  fs.writeFileSync(
    metadataPath,
    `${JSON.stringify({
      generatedAt: "2026-06-01T00:00:00.000Z",
      logPath,
      passed: true,
      resultBundlePath,
      screenshotAttachments: {
        attachmentMenu: "附件菜单",
        fileImporterFlow: "fileImporter 选择流程",
        pdfPickerFlow: "PDF 选择流程",
        photoPickerFlow: "PhotosPicker 选择流程",
      },
      sourceMarkers: [
        "source=native.composer.attachment.photo",
        "source=native.composer.attachment.file",
      ],
    })}\n`
  );

  const result = spawnSync(
    "node",
    [scriptPath, "--dry-run", "--output-dir", outputDir],
    {
      cwd: rootDir,
      encoding: "utf8",
      env: {
        ...process.env,
        AI_CODE_IOS_ATTACHMENT_UI_TEST_METADATA_PATH: metadataPath,
      },
    }
  );

  assert.equal(result.status, 0, result.stderr);

  const evidence = JSON.parse(
    fs.readFileSync(path.join(outputDir, "acceptance-evidence.json"), "utf8")
  );
  const manifest = JSON.parse(
    fs.readFileSync(path.join(outputDir, "manifest.json"), "utf8")
  );
  const review = JSON.parse(
    fs.readFileSync(path.join(outputDir, "manual-evidence-record.review.json"), "utf8")
  );
  const photoReviewItem = review.items.find((item) => item.id === "photo_attachment");
  const fileReviewItem = review.items.find((item) => item.id === "file_attachment");
  const pdfReviewItem = review.items.find((item) => item.id === "pdf_text_extraction");

  assert.equal(evidence.attachmentUiTest.available, true);
  assert.equal(evidence.attachmentUiTest.logPath, logPath);
  assert.equal(evidence.attachmentUiTest.resultBundlePath, resultBundlePath);
  assert.equal(
    evidence.attachmentUiTest.screenshotAttachments.photoPickerFlow,
    "PhotosPicker 选择流程"
  );
  assert.ok(evidence.automatedEvidence.includes("ios_attachment_ui_test_artifact"));
  assert.ok(
    manifest.items
      .find((item) => item.item === "照片附件")
      .supportingEvidenceSignals.includes("ios_attachment_ui_test_artifact")
  );
  assert.match(photoReviewItem.evidence.screenshots.join("\n"), /PhotosPicker 选择流程/);
  assert.match(photoReviewItem.evidence.systemArtifacts.join("\n"), /PhotosPicker 权限与选择器截图/);
  assert.match(photoReviewItem.evidence.systemArtifacts.join("\n"), /ios-attachment-ui-test\.xcresult/);
  assert.match(fileReviewItem.evidence.screenshots.join("\n"), /fileImporter 选择流程/);
  assert.match(fileReviewItem.evidence.systemArtifacts.join("\n"), /Files 选择器截图/);
  assert.match(pdfReviewItem.evidence.screenshots.join("\n"), /PDF 选择流程/);
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
      env: {
        ...process.env,
        AI_CODE_IOS_ATTACHMENT_UI_TEST_METADATA_PATH: path.join(
          outputDir,
          "missing-attachment-ui-test.json"
        ),
      },
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

test("collect iOS acceptance evidence can opt into native keyboard input support", () => {
  const outputDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "ios-acceptance-evidence-keyboard-input-")
  );

  const result = spawnSync(
    "node",
    [
      scriptPath,
      "--dry-run",
      "--seed-keyboard-input",
      "--output-dir",
      outputDir,
    ],
    {
      cwd: rootDir,
      encoding: "utf8",
      env: {
        ...process.env,
        AI_CODE_IOS_ATTACHMENT_UI_TEST_METADATA_PATH: path.join(
          outputDir,
          "missing-attachment-ui-test.json"
        ),
      },
    }
  );

  assert.equal(result.status, 0, result.stderr);

  const evidence = JSON.parse(
    fs.readFileSync(path.join(outputDir, "acceptance-evidence.json"), "utf8")
  );
  const review = JSON.parse(
    fs.readFileSync(path.join(outputDir, "manual-evidence-record.review.json"), "utf8")
  );
  const summary = fs.readFileSync(path.join(outputDir, "summary.md"), "utf8");

  assert.equal(evidence.nativeKeyboardInput.enabled, true);
  assert.equal(evidence.nativeKeyboardInput.available, false);
  assert.equal(evidence.nativeKeyboardInput.supportingOnly, true);
  assert.equal(evidence.nativeKeyboardInput.mode, "h5_synthetic_native_input");
  assert.equal(evidence.nativeKeyboardInput.source, "native.composer.keyboard");
  assert.equal(evidence.nativeKeyboardInput.reminderId, null);
  assert.match(evidence.nativeKeyboardInput.seedInput, /提醒我/);
  assert.match(
    evidence.nativeKeyboardInput.screenshotPath,
    /native-keyboard-input\.png$/
  );
  assert.ok(evidence.automatedEvidence.includes("native_keyboard_input"));
  assert.match(summary, /原生键盘输入辅助证据/);
  assert.match(summary, /不替代真实 Native 输入框截图/);

  const keyboardItem = review.items.find((item) => item.id === "keyboard_input");
  assert.equal(keyboardItem.status, "pending");
  assert.deepEqual(keyboardItem.evidence.bridgeMarkers, []);
  assert.match(keyboardItem.evidence.operatorNotes, /待人工补充/);
});

test("native keyboard evidence requires the backend fact to be visible in H5 reminders", async () => {
  const { finalizeNativeKeyboardInputEvidence } = await import(
    "./ios-acceptance-keyboard-evidence.mjs"
  );

  const keyboard = finalizeNativeKeyboardInputEvidence({
    available: false,
    bridgeInboundLabel:
      "native.inputSubmitted · source=native.composer.keyboard · view=conversation",
    confirmationCardFound: true,
    errors: ["Timed out while waiting for seed text on reminders surface"],
    h5ReminderVisible: false,
    reminderId: "reminder_123",
    reminderTitle: "seed_20260531键盘验收带电脑",
  });

  assert.equal(keyboard.backendBridgeAvailable, true);
  assert.equal(keyboard.available, false);
  assert.equal(keyboard.h5ReminderVisible, false);
  assert.deepEqual(keyboard.errors, [
    "Timed out while waiting for seed text on reminders surface",
  ]);

  const visibleKeyboard = finalizeNativeKeyboardInputEvidence({
    ...keyboard,
    errors: [],
    h5ReminderVisible: true,
  });

  assert.equal(visibleKeyboard.backendBridgeAvailable, true);
  assert.equal(visibleKeyboard.available, true);
});

test("native keyboard evidence confirms the seed-specific card", () => {
  const source = fs.readFileSync(scriptPath, "utf8");

  assert.match(source, /filter\(\{\s*hasText: seedRunId\s*\}\)/);
  assert.doesNotMatch(
    source,
    /getByRole\("button", \{ name: "确认" \}\)\.last\(\)\.click/
  );
});

test("acceptance confirmation screenshots target the exact pending plan card", () => {
  const collectorSource = fs.readFileSync(scriptPath, "utf8");
  const h5Source = fs.readFileSync(h5ComponentsPath, "utf8");

  assert.ok(collectorSource.includes('locator(`[data-plan-id="${planId}"]`)'));
  assert.doesNotMatch(collectorSource, /planConfirmationCard\.count\(\)/);
  assert.match(h5Source, /data-plan-id=\{element\.planId\}/);
  assert.match(h5Source, /data-confirmation-id=\{element\.id\}/);
});

test("calendar cleanup evidence clicks the exact H5 calendar cancel action", () => {
  const collectorSource = fs.readFileSync(scriptPath, "utf8");
  const h5Source = fs.readFileSync(h5ComponentsPath, "utf8");
  const h5BackendApiSource = fs.readFileSync(h5BackendApiPath, "utf8");

  assert.ok(collectorSource.includes('locator(`[data-summary-item-id="${targetEventId}"]`)'));
  assert.ok(collectorSource.includes('[data-summary-action-type="calendar.cancel"]'));
  assert.match(collectorSource, /eventId:\s*targetEventId/);
  assert.match(collectorSource, /calendarFocusAttempt <= 3/);
  assert.match(h5Source, /focusedCalendarEventId/);
  assert.match(h5Source, /data-summary-item-id=\{item\.id\}/);
  assert.match(h5Source, /data-summary-action-type=\{action\.type\}/);
  assert.match(h5BackendApiSource, /focusedCalendarEventId/);
  assert.match(h5BackendApiSource, /selectRecentItemsWithFocus\(\s*events,\s*options\.focusedCalendarEventId/);
});

test("collect iOS acceptance evidence can opt into native attachment inputs support", () => {
  const outputDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "ios-acceptance-evidence-attachment-inputs-")
  );

  const result = spawnSync(
    "node",
    [
      scriptPath,
      "--dry-run",
      "--seed-attachment-inputs",
      "--output-dir",
      outputDir,
    ],
    {
      cwd: rootDir,
      encoding: "utf8",
      env: {
        ...process.env,
        AI_CODE_IOS_ATTACHMENT_UI_TEST_METADATA_PATH: path.join(
          outputDir,
          "missing-attachment-ui-test.json"
        ),
      },
    }
  );

  assert.equal(result.status, 0, result.stderr);

  const evidence = JSON.parse(
    fs.readFileSync(path.join(outputDir, "acceptance-evidence.json"), "utf8")
  );
  const review = JSON.parse(
    fs.readFileSync(path.join(outputDir, "manual-evidence-record.review.json"), "utf8")
  );
  const summary = fs.readFileSync(path.join(outputDir, "summary.md"), "utf8");

  assert.equal(evidence.nativeAttachmentInputs.enabled, true);
  assert.equal(evidence.nativeAttachmentInputs.available, false);
  assert.equal(evidence.nativeAttachmentInputs.supportingOnly, true);
  assert.equal(evidence.nativeAttachmentInputs.mode, "h5_synthetic_native_attachment_inputs");
  assert.match(fs.readFileSync(scriptPath, "utf8"), /attachmentQueryAttempt <= 5/);
  assert.deepEqual(
    evidence.nativeAttachmentInputs.samples.map((sample) => sample.itemId),
    ["photo_attachment", "file_attachment", "pdf_text_extraction"]
  );
  const photoSample = evidence.nativeAttachmentInputs.samples.find(
    (sample) => sample.itemId === "photo_attachment"
  );
  const pdfSample = evidence.nativeAttachmentInputs.samples.find(
    (sample) => sample.itemId === "pdf_text_extraction"
  );
  assert.equal(photoSample.expenseFollowUp.available, false);
  assert.match(
    photoSample.expenseFollowUp.screenshotPath,
    /native-attachment-photo-expense-follow-up\.png$/
  );
  assert.equal(pdfSample.scheduleFollowUp.available, false);
  assert.match(
    pdfSample.scheduleFollowUp.screenshotPath,
    /native-attachment-pdf-schedule-follow-up\.png$/
  );
  assert.match(pdfSample.textSummary, /PDF 日程材料/);
  assert.match(
    evidence.nativeAttachmentInputs.screenshotPath,
    /native-attachment-inputs\.png$/
  );
  assert.ok(evidence.automatedEvidence.includes("native_attachment_inputs"));
  assert.match(summary, /原生附件输入辅助证据/);
  assert.match(summary, /不替代真实 PhotosPicker/);

  for (const itemId of ["photo_attachment", "file_attachment", "pdf_text_extraction"]) {
    const reviewItem = review.items.find((item) => item.id === itemId);
    assert.equal(reviewItem.status, "pending");
    assert.deepEqual(reviewItem.evidence.bridgeMarkers, []);
    assert.match(reviewItem.evidence.operatorNotes, /待人工补充/);
  }
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
  assert.equal(evidence.notificationSyncBridge.enabled, true);
  assert.equal(evidence.notificationSyncBridge.available, false);
  assert.equal(evidence.notificationSyncBridge.mode, "h5_outbound_bridge_capture");
  assert.match(
    evidence.notificationSyncBridge.screenshotPath,
    /notification-reminders-sync-bridge\.png$/
  );
  assert.equal(evidence.notificationSyncBridge.supportingOnly, true);
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
  assert.ok(evidence.automatedEvidence.includes("notification_sync_bridge"));
  assert.match(summary, /通知投递诊断辅助证据/);
  assert.match(summary, /通知同步 Bridge 辅助证据/);
  assert.match(summary, /不替代真实系统通知展示或点击/);
});

test("notification sync bridge can reuse H5 surface outbound messages", () => {
  const source = fs.readFileSync(scriptPath, "utf8");

  assert.match(source, /bridgeOutboundMessages/);
  assert.match(source, /function notificationSyncBridgeFromH5Surfaces/);
  assert.match(
    source,
    /message\?\.\s*type === "notifications\.reminders\.sync"/
  );
  assert.match(source, /h5SurfaceScreenshots,\s*\n\s*outputDir/);
  assert.match(source, /supportingOnly: true/);
  assert.doesNotMatch(
    source,
    /notificationSyncBridge[\s\S]{0,240}systemArtifacts/
  );
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
  assert.equal(
    evidence.acceptanceFactSeed.confirmationScreenshots.calendar.available,
    false
  );
  assert.equal(
    evidence.acceptanceFactSeed.confirmationScreenshots.calendar.supportingOnly,
    true
  );
  assert.match(
    evidence.acceptanceFactSeed.confirmationScreenshots.calendar.path,
    /acceptance-calendar-confirmation-card\.png$/
  );
  assert.equal(
    evidence.acceptanceFactSeed.confirmationScreenshots.reminder.available,
    false
  );
  assert.equal(
    evidence.acceptanceFactSeed.confirmationScreenshots.reminder.supportingOnly,
    true
  );
  assert.match(
    evidence.acceptanceFactSeed.confirmationScreenshots.reminder.path,
    /acceptance-reminder-confirmation-card\.png$/
  );
  assert.ok(
    evidence.acceptanceFactSeed.inputs.every((input) =>
      input.input.includes(evidence.acceptanceFactSeed.seedRunId)
    )
  );
  assert.equal(
    evidence.acceptanceFactSeed.inputs.some((input) =>
      /58\s*元seed_/.test(input.input)
    ),
    false
  );
  const expenseSeedInput = evidence.acceptanceFactSeed.inputs.find(
    (input) => input.domain === "expense"
  )?.input;
  assert.match(expenseSeedInput, /费用草稿/);
  assert.match(expenseSeedInput, /标题 seed_/);
  assert.match(expenseSeedInput, /金额 58 元/);
  assert.match(expenseSeedInput, /发生日期昨天/);
  assert.doesNotMatch(expenseSeedInput, /备注/);
  assert.doesNotMatch(expenseSeedInput, /报销/);
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
  assert.equal(evidence.ios.calendarAccessPreparation.enabled, true);
  assert.equal(evidence.ios.calendarAccessPreparation.available, true);
  assert.deepEqual(evidence.ios.calendarAccessPreparation.requiredFor, [
    "calendar_cleanup_seed",
  ]);
  assert.match(
    evidence.ios.calendarAccessPreparation.commands.grantCalendar.command,
    /xcrun simctl privacy .* grant calendar com\.aiengineeringcode\.shell/
  );
  assert.equal(evidence.calendarCleanupSeed.available, false);
  assert.equal(evidence.calendarCleanupSeed.requiresAcceptanceFactSeed, true);
  assert.equal(evidence.calendarCleanupSeed.preCancelRequiresStoredIdentifier, true);
  assert.equal(evidence.calendarCleanupSeed.afterScreenshotRequiresCanceledEvent, true);
  assert.equal(evidence.calendarCleanupSeed.preCancelDiagnosticsUpdatedAt, null);
  assert.equal(evidence.calendarCleanupSeed.preCancelDiagnosticsFresh, null);
  assert.equal(
    Number.isInteger(evidence.calendarCleanupSeed.preCancelRefreshMaxAttempts),
    true
  );
  assert.ok(evidence.calendarCleanupSeed.preCancelRefreshMaxAttempts >= 8);
  assert.equal(
    Number.isInteger(evidence.calendarCleanupSeed.postCancelRefreshMaxAttempts),
    true
  );
  assert.ok(evidence.calendarCleanupSeed.postCancelRefreshMaxAttempts >= 8);
  assert.equal(evidence.calendarCleanupSeed.postCancelRemovedEventIdPresent, false);
  assert.equal(
    evidence.calendarCleanupSeed.h5CancelActionScreenshot.available,
    false
  );
  assert.equal(
    evidence.calendarCleanupSeed.h5CancelActionScreenshot.supportingOnly,
    true
  );
  assert.match(
    evidence.calendarCleanupSeed.h5CancelActionScreenshot.path,
    /calendar-cleanup-h5-cancel-action\.png$/
  );
  assert.deepEqual(evidence.calendarCleanupSeed.postCancelSystemDiagnostics, {});
  assert.equal(evidence.calendarCleanupSeed.targetEventId, null);
  assert.equal(
    evidence.calendarCleanupSeed.systemCalendarAppScreenshots.supportingOnly,
    true
  );
  assert.match(
    evidence.calendarCleanupSeed.systemCalendarAppScreenshots.beforePath,
    /calendar-cleanup-before\.png$/
  );
  assert.match(
    evidence.calendarCleanupSeed.systemCalendarAppScreenshots.afterPath,
    /calendar-cleanup-after\.png$/
  );
  assert.ok(evidence.automatedEvidence.includes("calendar_cleanup_seed"));
  assert.match(summary, /系统日历取消清理种子/);
  assert.match(summary, /仅在显式开启时取消 seed 日程/);
  assert.match(summary, /取消前 Native 诊断最多轮询/);
  assert.match(summary, /取消前 Native 诊断新鲜/);
  assert.match(summary, /取消后 Native 清理最多轮询/);
  assert.match(summary, /取消后截图必须先成功取消日程/);
  assert.match(summary, /系统 Calendar 取消前后截图/);
  assert.match(summary, /系统日历权限预授权/);
});

test("collect iOS acceptance evidence can batch all supported system evidence seeds", () => {
  const outputDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "ios-acceptance-evidence-supported-system-")
  );

  const result = spawnSync(
    "node",
    [
      scriptPath,
      "--dry-run",
      "--seed-supported-system-evidence",
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
  assert.equal(evidence.calendarSystemAppEvidence.enabled, true);
  assert.equal(evidence.calendarCleanupSeed.enabled, true);
  assert.equal(evidence.calendarPermissionDenialSeed.enabled, true);
  assert.equal(evidence.ios.calendarAccessPreparation.enabled, true);
  assert.deepEqual(evidence.ios.calendarAccessPreparation.requiredFor, [
    "system_calendar_app_screenshot",
    "calendar_cleanup_seed",
  ]);
  assert.equal(evidence.notificationClickBackflow.enabled, true);
  assert.equal(evidence.notificationDelivery.enabled, true);
  assert.deepEqual(
    [
      "acceptance_fact_seed",
      "system_calendar_app_screenshot",
      "calendar_cleanup_seed",
      "calendar_permission_denial_seed",
      "notification_click_backflow",
      "notification_delivery_diagnostics",
    ].filter((item) => !evidence.automatedEvidence.includes(item)),
    []
  );
  assert.match(summary, /验收事实种子/);
  assert.match(summary, /系统 Calendar App 辅助截图/);
  assert.match(summary, /系统日历取消清理种子/);
  assert.match(summary, /日历权限拒绝降级种子/);
  assert.match(summary, /通知点击回流辅助证据/);
  assert.match(summary, /通知投递诊断辅助证据/);
});

test("collect iOS acceptance evidence can batch supported system evidence via env", () => {
  const outputDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "ios-acceptance-evidence-supported-system-env-")
  );

  const result = spawnSync(
    "node",
    [scriptPath, "--dry-run", "--output-dir", outputDir],
    {
      cwd: rootDir,
      encoding: "utf8",
      env: {
        ...process.env,
        AI_CODE_IOS_ACCEPTANCE_SEED_SUPPORTED_SYSTEM_EVIDENCE: "1",
      },
    }
  );

  assert.equal(result.status, 0, result.stderr);

  const evidence = JSON.parse(
    fs.readFileSync(path.join(outputDir, "acceptance-evidence.json"), "utf8")
  );

  assert.equal(evidence.acceptanceFactSeed.enabled, true);
  assert.equal(evidence.calendarSystemAppEvidence.enabled, true);
  assert.equal(evidence.calendarCleanupSeed.enabled, true);
  assert.equal(evidence.calendarPermissionDenialSeed.enabled, true);
  assert.equal(evidence.notificationClickBackflow.enabled, true);
  assert.equal(evidence.notificationDelivery.enabled, true);
});

test("notification click backflow can refresh diagnostics repeatedly", () => {
  const source = fs.readFileSync(scriptPath, "utf8");
  const match = source.match(
    /async function seedNotificationClickBackflow[\s\S]*?async function seedNotificationDelivery/
  );

  assert.ok(match, "seedNotificationClickBackflow source should be present");
  assert.match(match[0], /let refresh = refreshNativeSystemDiagnostics/);
  assert.doesNotMatch(match[0], /const refresh = refreshNativeSystemDiagnostics/);
});

test("collect iOS acceptance evidence ignores pnpm argument separator", () => {
  const outputDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "ios-acceptance-evidence-pnpm-separator-")
  );

  const result = spawnSync(
    "node",
    [
      scriptPath,
      "--seed-supported-system-evidence",
      "--",
      "--dry-run",
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

  assert.equal(evidence.mode, "dry-run");
  assert.equal(evidence.acceptanceFactSeed.enabled, true);
});

test("package exposes iOS acceptance evidence collection command", () => {
  assert.equal(
    packageJson.scripts["collect:ios-acceptance-evidence"],
    "node scripts/collect-ios-acceptance-evidence.mjs"
  );
  assert.equal(
    packageJson.scripts["collect:ios-keyboard-evidence"],
    "node scripts/collect-ios-acceptance-evidence.mjs --seed-keyboard-input"
  );
  assert.equal(
    packageJson.scripts["collect:ios-attachment-evidence"],
    "node scripts/collect-ios-acceptance-evidence.mjs --seed-attachment-inputs"
  );
  assert.equal(
    packageJson.scripts["collect:ios-system-evidence"],
    "node scripts/collect-ios-acceptance-evidence.mjs --seed-supported-system-evidence"
  );
  assert.equal(
    packageJson.scripts["validate:ios-voice-permission-ui-test"],
    "node scripts/validate-ios-voice-permission-ui-test.mjs"
  );
  assert.equal(
    packageJson.scripts["validate:ios-acceptance-evidence"],
    "node --test scripts/http-retry.test.mjs scripts/ios-acceptance-predicates.test.mjs scripts/manual-evidence-review.test.mjs scripts/collect-ios-acceptance-evidence.test.mjs"
  );
});
