import { spawnSync } from "node:child_process";
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
  process.env.AI_CODE_IOS_NAVIGATION_UI_TEST_DESTINATION ??
  "platform=iOS Simulator,name=iPhone 16 Pro Max";
const derivedDataPath =
  process.env.AI_CODE_IOS_DERIVED_DATA_PATH ??
  ".tmp/xcodebuild/AIEngineeringCode";
const h5DevServerUrl =
  process.env.H5_DEV_SERVER_URL ??
  "http://127.0.0.1:3000/?native=ios&bridgeDebug=1";
const uiTestTarget =
  process.env.AI_CODE_IOS_NAVIGATION_UI_TEST_TARGET ??
  "AIEngineeringCodeUITests";
const uiTestClass =
  process.env.AI_CODE_IOS_NAVIGATION_UI_TEST_CLASS ??
  "NativeKeyboardInputUITests";
const uiTestMethod =
  process.env.AI_CODE_IOS_NAVIGATION_UI_TEST_METHOD ??
  "testNativeHeaderAndDrawerNavigateH5Surfaces";
const timeoutMs = Number.parseInt(
  process.env.AI_CODE_IOS_NAVIGATION_UI_TEST_TIMEOUT_MS ?? "900000",
  10
);
const artifactDir =
  process.env.AI_CODE_IOS_NAVIGATION_UI_TEST_ARTIFACT_DIR ??
  path.join(".tmp", "ios-navigation-ui-test");
const logPath =
  process.env.AI_CODE_IOS_NAVIGATION_UI_TEST_LOG_PATH ??
  path.join(artifactDir, "ios-navigation-ui-test.log");
const metadataPath =
  process.env.AI_CODE_IOS_NAVIGATION_UI_TEST_METADATA_PATH ??
  path.join(artifactDir, "navigation-ui-test.json");
const resultBundlePath =
  process.env.AI_CODE_IOS_NAVIGATION_UI_TEST_RESULT_BUNDLE_PATH ??
  path.join(artifactDir, "ios-navigation-ui-test.xcresult");

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

const version = run("xcodebuild", ["-version"]);
if (version.error) {
  console.error("iOS navigation UI test failed: xcodebuild is not available.");
  console.error(
    "Install full Xcode and run: sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
  );
  process.exit(1);
}

if (version.status !== 0) {
  console.error("iOS navigation UI test failed while checking xcodebuild.");
  process.stdout.write(version.stdout ?? "");
  process.stderr.write(version.stderr ?? "");
  process.exit(version.status ?? 1);
}

process.stdout.write(version.stdout ?? "");

const onlyTesting = `${uiTestTarget}/${uiTestClass}/${uiTestMethod}`;
fs.mkdirSync(artifactDir, { recursive: true });
fs.rmSync(resultBundlePath, { force: true, recursive: true });
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
  "-only-testing:" + onlyTesting,
  "test",
];

console.log(
  [
    "Running iOS navigation UI test:",
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

process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");

const combinedLog = [
  version.stdout ?? "",
  [
    "Running iOS navigation UI test:",
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
        passed,
        resultBundlePath: path.resolve(rootDir, resultBundlePath),
        screenshotAttachments: {
          drawerSettings: "Drawer 设置切换截图",
          headerTimeline: "Header Timeline 切换截图",
        },
        sourceMarkers: [
          "source=native.header.timeline",
          "source=native.drawer.quick-switch",
        ],
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
    `iOS navigation UI test timed out after ${timeoutMs}ms. Set AI_CODE_IOS_NAVIGATION_UI_TEST_TIMEOUT_MS to override.`
  );
  process.exit(1);
}

if (result.error) {
  writeMetadata({ error: result.error.message, passed: false });
  console.error(`iOS navigation UI test failed: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  writeMetadata({
    error: `exit code ${result.status ?? "unknown"}`,
    passed: false,
  });
  console.error(
    `iOS navigation UI test failed with exit code ${result.status ?? "unknown"}.`
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
    "iOS navigation UI test failed: xcodebuild completed without executing the selected XCTest."
  );
  process.exit(1);
}

writeMetadata({ passed: true });
console.log("iOS navigation UI test passed.");
