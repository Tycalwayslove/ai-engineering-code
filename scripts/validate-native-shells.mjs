import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const failures = [];

function readRequired(relativePath) {
  const filePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(filePath)) {
    failures.push(`${relativePath}: file is missing`);
    return "";
  }

  return fs.readFileSync(filePath, "utf8");
}

function assertIncludes(relativePath, content, expected) {
  if (!content.includes(expected)) {
    failures.push(`${relativePath}: expected to include "${expected}"`);
  }
}

function assertNotIncludes(relativePath, content, unexpected) {
  if (content.includes(unexpected)) {
    failures.push(`${relativePath}: expected not to include "${unexpected}"`);
  }
}

const iosFiles = [
  "apps/ios/AIEngineeringCode.xcodeproj/project.pbxproj",
  "apps/ios/AIEngineeringCode/AIEngineeringCodeApp.swift",
  "apps/ios/AIEngineeringCode/HybridShellView.swift",
  "apps/ios/AIEngineeringCode/H5WebView.swift",
  "apps/ios/AIEngineeringCode/Info.plist",
];

const androidFiles = [
  "apps/android/settings.gradle.kts",
  "apps/android/build.gradle.kts",
  "apps/android/app/build.gradle.kts",
  "apps/android/app/src/main/AndroidManifest.xml",
  "apps/android/app/src/main/java/com/aiengineeringcode/shell/MainActivity.kt",
  "apps/android/app/src/main/res/xml/network_security_config.xml",
];

for (const file of [...iosFiles, ...androidFiles]) {
  readRequired(file);
}

const packageJsonPath = "package.json";
const packageJson = readRequired(packageJsonPath);
assertIncludes(packageJsonPath, packageJson, '"validate:ios-build"');
assertIncludes(packageJsonPath, packageJson, "scripts/validate-ios-build.mjs");
assertIncludes(packageJsonPath, packageJson, '"collect:ios-acceptance-evidence"');
assertIncludes(packageJsonPath, packageJson, "scripts/collect-ios-acceptance-evidence.mjs");
assertIncludes(packageJsonPath, packageJson, '"collect:ios-system-evidence"');
assertIncludes(packageJsonPath, packageJson, "--seed-supported-system-evidence");
assertIncludes(packageJsonPath, packageJson, '"validate:ios-acceptance-evidence"');
assertIncludes(packageJsonPath, packageJson, "scripts/collect-ios-acceptance-evidence.test.mjs");
assertIncludes(packageJsonPath, packageJson, '"validate:ios-manual-acceptance"');
assertIncludes(packageJsonPath, packageJson, "scripts/validate-ios-manual-acceptance.mjs");
assertIncludes(packageJsonPath, packageJson, '"validate:ios-simulator-smoke"');
assertIncludes(packageJsonPath, packageJson, "scripts/validate-ios-simulator-smoke.mjs");
assertIncludes(packageJsonPath, packageJson, '"validate:ios-keyboard-ui-test"');
assertIncludes(packageJsonPath, packageJson, "scripts/validate-ios-keyboard-ui-test.mjs");
assertIncludes(packageJsonPath, packageJson, '"validate:v1-readiness"');
assertIncludes(packageJsonPath, packageJson, "scripts/validate-v1-readiness.mjs");

const iosBuildScriptPath = "scripts/validate-ios-build.mjs";
const iosBuildScript = readRequired(iosBuildScriptPath);
assertIncludes(iosBuildScriptPath, iosBuildScript, "xcodebuild");
assertIncludes(iosBuildScriptPath, iosBuildScript, "generic/platform=iOS Simulator");
assertIncludes(iosBuildScriptPath, iosBuildScript, "CODE_SIGNING_ALLOWED=NO");
assertIncludes(iosBuildScriptPath, iosBuildScript, "-derivedDataPath");

const iosSimulatorSmokeScriptPath = "scripts/validate-ios-simulator-smoke.mjs";
const iosSimulatorSmokeScript = readRequired(iosSimulatorSmokeScriptPath);
assertIncludes(iosSimulatorSmokeScriptPath, iosSimulatorSmokeScript, "simctl");
assertIncludes(iosSimulatorSmokeScriptPath, iosSimulatorSmokeScript, "com.aiengineeringcode.shell");
assertIncludes(iosSimulatorSmokeScriptPath, iosSimulatorSmokeScript, "get_app_container");
assertIncludes(iosSimulatorSmokeScriptPath, iosSimulatorSmokeScript, "launch");

const iosKeyboardUiTestScriptPath = "scripts/validate-ios-keyboard-ui-test.mjs";
const iosKeyboardUiTestScript = readRequired(iosKeyboardUiTestScriptPath);
assertIncludes(iosKeyboardUiTestScriptPath, iosKeyboardUiTestScript, "xcodebuild");
assertIncludes(iosKeyboardUiTestScriptPath, iosKeyboardUiTestScript, "AIEngineeringCodeUITests");
assertIncludes(iosKeyboardUiTestScriptPath, iosKeyboardUiTestScript, "NativeKeyboardInputUITests");
assertIncludes(iosKeyboardUiTestScriptPath, iosKeyboardUiTestScript, "testNativeKeyboardComposerSubmitsThroughH5Bridge");
assertIncludes(iosKeyboardUiTestScriptPath, iosKeyboardUiTestScript, "CODE_SIGNING_ALLOWED=NO");

const iosAcceptanceEvidenceScriptPath = "scripts/collect-ios-acceptance-evidence.mjs";
const iosAcceptanceEvidenceScript = readRequired(iosAcceptanceEvidenceScriptPath);
assertIncludes(iosAcceptanceEvidenceScriptPath, iosAcceptanceEvidenceScript, "manualAcceptanceRequired");
assertIncludes(iosAcceptanceEvidenceScriptPath, iosAcceptanceEvidenceScript, "acceptanceVerdict");
assertIncludes(iosAcceptanceEvidenceScriptPath, iosAcceptanceEvidenceScript, "not_evaluated");
assertIncludes(iosAcceptanceEvidenceScriptPath, iosAcceptanceEvidenceScript, "automationCanReplaceManualAcceptance");
assertIncludes(iosAcceptanceEvidenceScriptPath, iosAcceptanceEvidenceScript, "manual_required");
assertIncludes(iosAcceptanceEvidenceScriptPath, iosAcceptanceEvidenceScript, "不能替代真实人工验收");

const iosManualAcceptancePath = "docs/qa/ios-v1-system-acceptance.md";
const iosManualAcceptance = readRequired(iosManualAcceptancePath);
for (const expected of [
  "H5 地址覆盖",
  "会话持久 ID",
  "键盘输入",
  "语音输入",
  "照片附件",
  "文件附件",
  "PDF 文本提取",
  "本地通知",
  "通知点击回流",
  "系统日历写入",
  "系统日历取消清理",
  "后端事实确认",
  "系统同步降级",
  "验收证据",
  "不能由自动 smoke 替代",
]) {
  assertIncludes(iosManualAcceptancePath, iosManualAcceptance, expected);
}

const iosWebViewPath = "apps/ios/AIEngineeringCode/H5WebView.swift";
const iosWebView = readRequired(iosWebViewPath);
assertIncludes(iosWebViewPath, iosWebView, "WKWebView");
assertIncludes(iosWebViewPath, iosWebView, "NativeBridge");

const iosShellPath = "apps/ios/AIEngineeringCode/HybridShellView.swift";
const iosShell = readRequired(iosShellPath);
assertIncludes(iosShellPath, iosShell, "http://127.0.0.1:3000");
assertIncludes(iosShellPath, iosShell, "AI Native Shell");
assertIncludes(iosShellPath, iosShell, "case expenses");
assertIncludes(iosShellPath, iosShell, "case reminders");
assertIncludes(iosShellPath, iosShell, "case settings");
assertIncludes(iosShellPath, iosShell, "isVoiceRecording");
assertIncludes(iosShellPath, iosShell, "@FocusState");
assertIncludes(iosShellPath, iosShell, "isComposerTextFocused");
assertIncludes(iosShellPath, iosShell, "import Speech");
assertIncludes(iosShellPath, iosShell, "import AVFoundation");
assertIncludes(iosShellPath, iosShell, "import EventKit");
assertIncludes(iosShellPath, iosShell, "import PhotosUI");
assertIncludes(iosShellPath, iosShell, "import PDFKit");
assertIncludes(iosShellPath, iosShell, "import Vision");
assertIncludes(iosShellPath, iosShell, "NativeConversationIdentity");
assertIncludes(iosShellPath, iosShell, "ai-code.native.conversationId");
assertIncludes(iosShellPath, iosShell, "ai-code.native.systemDiagnostics");
assertIncludes(iosShellPath, iosShell, "recordNativeSystemDiagnostics");
assertIncludes(iosShellPath, iosShell, "calendar.removedEventIds");
assertIncludes(iosShellPath, iosShell, "calendar.storedEventBackendIds");
assertIncludes(iosShellPath, iosShell, "calendar.foundStoredEventBackendIds");
assertIncludes(iosShellPath, iosShell, "URLQueryItem(name: \"conversationId\"");
assertIncludes(iosShellPath, iosShell, "import UserNotifications");
assertIncludes(iosShellPath, iosShell, "import UniformTypeIdentifiers");
assertIncludes(iosShellPath, iosShell, "SFSpeechRecognizer");
assertIncludes(iosShellPath, iosShell, "SFSpeechAudioBufferRecognitionRequest");
assertIncludes(iosShellPath, iosShell, "AVAudioEngine");
assertIncludes(iosShellPath, iosShell, "NativeCalendarEventSyncer");
assertIncludes(iosShellPath, iosShell, "EKEventStore");
assertIncludes(iosShellPath, iosShell, "removeInactiveEvent");
assertIncludes(iosShellPath, iosShell, "event.status != \"scheduled\"");
assertIncludes(iosShellPath, iosShell, "UserDefaults.standard");
assertIncludes(iosShellPath, iosShell, "eventIdentifier");
assertIncludes(iosShellPath, iosShell, "storedIdentifierKey");
assertIncludes(iosShellPath, iosShell, "date(byAdding: .year, value: -1");
assertIncludes(iosShellPath, iosShell, "date(byAdding: .year, value: 3");
assertIncludes(iosShellPath, iosShell, "PhotosPickerItem");
assertIncludes(iosShellPath, iosShell, "VNRecognizeTextRequest");
assertIncludes(iosShellPath, iosShell, "recognizedText");
assertIncludes(iosShellPath, iosShell, "PDFDocument(data:");
assertIncludes(iosShellPath, iosShell, "inImportedFileData");
assertIncludes(iosShellPath, iosShell, "fileImporter");
assertIncludes(iosShellPath, iosShell, "submitNativeAttachment");
assertIncludes(iosShellPath, iosShell, "openKeyboardInput");
assertIncludes(iosShellPath, iosShell, "textFieldFocus: $isComposerTextFocused");
assertIncludes(iosShellPath, iosShell, ".focused(textFieldFocus)");
assertIncludes(iosShellPath, iosShell, 'accessibilityIdentifier("ai-code.composer.attachment-button")');
assertIncludes(iosShellPath, iosShell, 'accessibilityIdentifier("ai-code.composer.keyboard-text-field")');
assertIncludes(iosShellPath, iosShell, 'accessibilityIdentifier("ai-code.composer.submit-button")');
assertIncludes(iosShellPath, iosShell, 'accessibilityIdentifier("ai-code.composer.voice-button")');
assertIncludes(iosShellPath, iosShell, 'accessibilityIdentifier("ai-code.composer.mode-toggle-button")');
assertIncludes(iosShellPath, iosShell, "NativeReminderNotificationScheduler");
assertIncludes(iosShellPath, iosShell, "UNUserNotificationCenter");
assertIncludes(iosShellPath, iosShell, "UNUserNotificationCenterDelegate");
assertIncludes(iosShellPath, iosShell, "openReminderFromNotification");
assertIncludes(iosShellPath, iosShell, "didReceive response");
assertIncludes(iosShellPath, iosShell, "willPresent notification");
assertNotIncludes(
  iosShellPath,
  iosShell,
  "removeDeliveredNotifications(withIdentifiers: existingIdentifiers)"
);
assertIncludes(iosShellPath, iosShell, "native.composer.attachment");
assertNotIncludes(iosShellPath, iosShell, "Button {}");
assertNotIncludes(iosShellPath, iosShell, 'Image(systemName: "chevron.right")');
assertNotIncludes(iosShellPath, iosShell, "startMockVoiceInput");
assertNotIncludes(iosShellPath, iosShell, "明天上午九点提醒我带电脑");
assertNotIncludes(iosShellPath, iosShell, "把昨天 58 元打车票报销");
assertNotIncludes(iosShellPath, iosShell, "附件 mock");

const iosProjectPath = "apps/ios/AIEngineeringCode.xcodeproj/project.pbxproj";
const iosProject = readRequired(iosProjectPath);
assertIncludes(iosProjectPath, iosProject, "AIEngineeringCodeUITests");
assertIncludes(iosProjectPath, iosProject, "NativeKeyboardInputUITests.swift");
assertIncludes(iosProjectPath, iosProject, "com.apple.product-type.bundle.ui-testing");
assertIncludes(iosProjectPath, iosProject, "TEST_TARGET_NAME = AIEngineeringCode");

const iosSharedSchemePath =
  "apps/ios/AIEngineeringCode.xcodeproj/xcshareddata/xcschemes/AIEngineeringCode.xcscheme";
const iosSharedScheme = readRequired(iosSharedSchemePath);
assertIncludes(iosSharedSchemePath, iosSharedScheme, "AIEngineeringCodeUITests");
assertIncludes(iosSharedSchemePath, iosSharedScheme, "BuildAction");
assertIncludes(iosSharedSchemePath, iosSharedScheme, "TestAction");

const iosKeyboardUiTestPath =
  "apps/ios/AIEngineeringCodeUITests/NativeKeyboardInputUITests.swift";
const iosKeyboardUiTest = readRequired(iosKeyboardUiTestPath);
assertIncludes(iosKeyboardUiTestPath, iosKeyboardUiTest, "XCUIApplication");
assertIncludes(iosKeyboardUiTestPath, iosKeyboardUiTest, "ai-code.composer.mode-toggle-button");
assertIncludes(iosKeyboardUiTestPath, iosKeyboardUiTest, "ai-code.composer.keyboard-text-field");
assertIncludes(iosKeyboardUiTestPath, iosKeyboardUiTest, "ai-code.composer.submit-button");
assertIncludes(iosKeyboardUiTestPath, iosKeyboardUiTest, "source=native.composer.keyboard");
assertIncludes(iosKeyboardUiTestPath, iosKeyboardUiTest, "testNativeKeyboardComposerSubmitsThroughH5Bridge");

const iosInfoPlistPath = "apps/ios/AIEngineeringCode/Info.plist";
const iosInfoPlist = readRequired(iosInfoPlistPath);
assertIncludes(iosInfoPlistPath, iosInfoPlist, "NSSpeechRecognitionUsageDescription");
assertIncludes(iosInfoPlistPath, iosInfoPlist, "NSMicrophoneUsageDescription");
assertIncludes(iosInfoPlistPath, iosInfoPlist, "NSCalendarsFullAccessUsageDescription");
assertIncludes(iosInfoPlistPath, iosInfoPlist, "$(H5_DEV_SERVER_URL)");

assertIncludes(iosWebViewPath, iosWebView, "onVoiceInputRequested");
assertIncludes(iosWebViewPath, iosWebView, "onVoiceInputStopRequested");
assertIncludes(iosWebViewPath, iosWebView, "onKeyboardInputRequested");
assertIncludes(iosWebViewPath, iosWebView, "input.voice.stop");
assertIncludes(iosWebViewPath, iosWebView, "input.keyboard.open");
assertIncludes(iosWebViewPath, iosWebView, "calendar.events.sync");
assertIncludes(iosWebViewPath, iosWebView, "notifications.reminders.sync");
assertNotIncludes(iosWebViewPath, iosWebView, '"status": "notImplemented"');

const h5WorkbenchPath = "apps/h5/src/app/ai-time-agent/components.tsx";
const h5Workbench = readRequired(h5WorkbenchPath);
assertIncludes(h5WorkbenchPath, h5Workbench, "syncNativeCalendarEvents(calendarEvents)");
assertIncludes(h5WorkbenchPath, h5Workbench, "status: event.status");
assertIncludes(h5WorkbenchPath, h5Workbench, '"input.keyboard.open"');
assertNotIncludes(
  h5WorkbenchPath,
  h5Workbench,
  ".filter((event) => event.status === \"scheduled\")"
);

const h5DemoDataPath = "apps/h5/src/app/ai-time-agent/demoData.ts";
const h5DemoData = readRequired(h5DemoDataPath);
assertIncludes(h5DemoDataPath, h5DemoData, 'bridgeAction: "input.keyboard.open"');
assertIncludes(h5DemoDataPath, h5DemoData, "native-settings-keyboard-open");

const androidActivityPath =
  "apps/android/app/src/main/java/com/aiengineeringcode/shell/MainActivity.kt";
const androidActivity = readRequired(androidActivityPath);
assertIncludes(androidActivityPath, androidActivity, "WebView");
assertIncludes(androidActivityPath, androidActivity, "NativeBridge");
assertIncludes(androidActivityPath, androidActivity, "AI Native Shell");

const androidGradlePath = "apps/android/app/build.gradle.kts";
const androidGradle = readRequired(androidGradlePath);
assertIncludes(androidGradlePath, androidGradle, "http://10.0.2.2:3000");

const h5LayoutPath = "apps/h5/src/app/layout.tsx";
const h5Layout = readRequired(h5LayoutPath);
assertIncludes(h5LayoutPath, h5Layout, "viewportFit");

if (failures.length > 0) {
  console.error("Native shell validation failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Native shell validation passed.");
