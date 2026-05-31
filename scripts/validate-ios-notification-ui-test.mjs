import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const projectPath =
  process.env.AI_CODE_IOS_PROJECT ??
  "apps/ios/AIEngineeringCode.xcodeproj";
const scheme = process.env.AI_CODE_IOS_SCHEME ?? "AIEngineeringCode";
const configuration = process.env.AI_CODE_IOS_CONFIGURATION ?? "Debug";
const destination =
  process.env.AI_CODE_IOS_NOTIFICATION_UI_TEST_DESTINATION ??
  "platform=iOS Simulator,name=iPhone 16 Pro Max";
const derivedDataPath =
  process.env.AI_CODE_IOS_DERIVED_DATA_PATH ??
  ".tmp/xcodebuild/AIEngineeringCode";
const h5DevServerUrl =
  process.env.H5_DEV_SERVER_URL ??
  "http://127.0.0.1:3000/?native=ios&bridgeDebug=1";
const bundleId =
  process.env.AI_CODE_IOS_NOTIFICATION_UI_TEST_BUNDLE_ID ??
  "com.aiengineeringcode.shell.notificationuitest";
const uiTestTarget =
  process.env.AI_CODE_IOS_NOTIFICATION_UI_TEST_TARGET ??
  "AIEngineeringCodeUITests";
const uiTestClass =
  process.env.AI_CODE_IOS_NOTIFICATION_UI_TEST_CLASS ??
  "NativeKeyboardInputUITests";
const uiTestMethod =
  process.env.AI_CODE_IOS_NOTIFICATION_UI_TEST_METHOD ??
  "testNativeNotificationDeliveryAndClickCanBeCaptured";
const timeoutMs = Number.parseInt(
  process.env.AI_CODE_IOS_NOTIFICATION_UI_TEST_TIMEOUT_MS ?? "900000",
  10
);
const artifactDir =
  process.env.AI_CODE_IOS_NOTIFICATION_UI_TEST_ARTIFACT_DIR ??
  path.join(".tmp", "ios-notification-ui-test");
const logPath =
  process.env.AI_CODE_IOS_NOTIFICATION_UI_TEST_LOG_PATH ??
  path.join(artifactDir, "ios-notification-ui-test.log");
const metadataPath =
  process.env.AI_CODE_IOS_NOTIFICATION_UI_TEST_METADATA_PATH ??
  path.join(artifactDir, "notification-ui-test.json");
const resultBundlePath =
  process.env.AI_CODE_IOS_NOTIFICATION_UI_TEST_RESULT_BUNDLE_PATH ??
  path.join(artifactDir, "ios-notification-ui-test.xcresult");
const videoPath =
  process.env.AI_CODE_IOS_NOTIFICATION_UI_TEST_VIDEO_PATH ??
  path.join(artifactDir, "system-notification-click.mp4");
const shouldResetPrivacy =
  process.env.AI_CODE_IOS_NOTIFICATION_RESET_PRIVACY !== "0";

function quoteArg(arg) {
  if (/^[A-Za-z0-9_./:=?&,+-]+$/.test(arg)) {
    return arg;
  }

  return `'${arg.replaceAll("'", "'\\''")}'`;
}

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: rootDir,
    encoding: "utf8",
    ...options,
  });
}

function stopVideoRecording(recordingProcess) {
  return new Promise((resolve) => {
    if (!recordingProcess || recordingProcess.exitCode !== null) {
      resolve();
      return;
    }
    const timer = setTimeout(() => {
      recordingProcess.kill("SIGTERM");
      resolve();
    }, 5000);
    recordingProcess.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
    recordingProcess.kill("SIGINT");
  });
}

const version = run("xcodebuild", ["-version"]);
if (version.error) {
  console.error("iOS notification UI test failed: xcodebuild is not available.");
  console.error(
    "Install full Xcode and run: sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
  );
  process.exit(1);
}

if (version.status !== 0) {
  console.error("iOS notification UI test failed while checking xcodebuild.");
  process.stdout.write(version.stdout ?? "");
  process.stderr.write(version.stderr ?? "");
  process.exit(version.status ?? 1);
}

process.stdout.write(version.stdout ?? "");

fs.mkdirSync(artifactDir, { recursive: true });
fs.rmSync(resultBundlePath, { force: true, recursive: true });
fs.rmSync(videoPath, { force: true });

const privacyCommands = [];
if (shouldResetPrivacy) {
  for (const args of [
    ["simctl", "uninstall", "booted", bundleId],
    ["simctl", "privacy", "booted", "reset", "all", bundleId],
  ]) {
    const result = run("xcrun", args);
    privacyCommands.push({
      command: ["xcrun", ...args].map(quoteArg).join(" "),
      status: result.status,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
    });
  }
}

const recording = spawn("xcrun", [
  "simctl",
  "io",
  "booted",
  "recordVideo",
  videoPath,
], {
  cwd: rootDir,
  stdio: ["ignore", "pipe", "pipe"],
});
let recordingStdout = "";
let recordingStderr = "";
recording.stdout?.on("data", (chunk) => {
  recordingStdout += chunk.toString();
});
recording.stderr?.on("data", (chunk) => {
  recordingStderr += chunk.toString();
});

const onlyTesting = `${uiTestTarget}/${uiTestClass}/${uiTestMethod}`;
const testArgs = [
  "-project",
  projectPath,
  "-scheme",
  scheme,
  "-configuration",
  configuration,
  "-destination",
  destination,
  "-derivedDataPath",
  derivedDataPath,
  "-resultBundlePath",
  resultBundlePath,
  `H5_DEV_SERVER_URL=${h5DevServerUrl}`,
  "CODE_SIGNING_ALLOWED=NO",
  `PRODUCT_BUNDLE_IDENTIFIER=${bundleId}`,
  "-only-testing:" + onlyTesting,
  "test",
];

console.log(
  [
    "Running iOS notification UI test:",
    "xcodebuild",
    ...testArgs.map(quoteArg),
  ].join(" ")
);

const result = spawnSync("xcodebuild", testArgs, {
  cwd: rootDir,
  encoding: "utf8",
  maxBuffer: 50 * 1024 * 1024,
  timeout: timeoutMs,
});
await stopVideoRecording(recording);

process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");

const combinedLog = [
  version.stdout ?? "",
  ...privacyCommands.flatMap((command) => [
    command.command,
    command.stdout,
    command.stderr,
  ]),
  `xcrun simctl io booted recordVideo ${quoteArg(videoPath)}`,
  recordingStdout,
  recordingStderr,
  [
    "Running iOS notification UI test:",
    "xcodebuild",
    ...testArgs.map(quoteArg),
  ].join(" "),
  result.stdout ?? "",
  result.stderr ?? "",
].join("\n");
fs.writeFileSync(logPath, combinedLog);

function writeMetadata({ passed, error }) {
  fs.writeFileSync(
    metadataPath,
    `${JSON.stringify(
      {
        error: error ?? null,
        generatedAt: new Date().toISOString(),
        logPath: path.resolve(rootDir, logPath),
        notificationIdentifier: null,
        passed,
        privacyCommands,
        reminderId: null,
        resultBundlePath: path.resolve(rootDir, resultBundlePath),
        screenshotAttachments: {
          notificationClickBackflow: "通知点击后 App 回流",
          systemNotification: "系统通知截图",
        },
        source: "validate:ios-notification-ui-test",
        systemArtifacts: [
          "系统通知截图",
          "系统通知点击录屏",
        ],
        videoPath: path.resolve(rootDir, videoPath),
      },
      null,
      2
    )}\n`
  );
}

if (result.error?.code === "ETIMEDOUT") {
  writeMetadata({
    error: `timed out after ${timeoutMs}ms`,
    passed: false,
  });
  console.error(
    `iOS notification UI test timed out after ${timeoutMs}ms. Set AI_CODE_IOS_NOTIFICATION_UI_TEST_TIMEOUT_MS to override.`
  );
  process.exit(1);
}

if (result.error) {
  writeMetadata({ error: result.error.message, passed: false });
  console.error(`iOS notification UI test failed: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  writeMetadata({
    error: `exit code ${result.status ?? "unknown"}`,
    passed: false,
  });
  console.error(
    `iOS notification UI test failed with exit code ${result.status ?? "unknown"}.`
  );
  process.exit(result.status ?? 1);
}

const combinedOutput = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
if (!/Executed\s+[1-9]\d*\s+tests?[, ]/.test(combinedOutput)) {
  writeMetadata({
    error: "xcodebuild completed without executing the selected XCTest",
    passed: false,
  });
  console.error(
    "iOS notification UI test failed: xcodebuild completed without executing the selected XCTest."
  );
  process.exit(1);
}

writeMetadata({ passed: true });
console.log("iOS notification UI test passed.");
