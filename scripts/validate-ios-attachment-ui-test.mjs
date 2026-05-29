import { spawnSync } from "node:child_process";
import process from "node:process";

const rootDir = process.cwd();
const projectPath =
  process.env.AI_CODE_IOS_PROJECT ??
  "apps/ios/AIEngineeringCode.xcodeproj";
const scheme = process.env.AI_CODE_IOS_SCHEME ?? "AIEngineeringCode";
const configuration = process.env.AI_CODE_IOS_CONFIGURATION ?? "Debug";
const destination =
  process.env.AI_CODE_IOS_ATTACHMENT_UI_TEST_DESTINATION ??
  "platform=iOS Simulator,name=iPhone 16 Pro Max";
const derivedDataPath =
  process.env.AI_CODE_IOS_DERIVED_DATA_PATH ??
  ".tmp/xcodebuild/AIEngineeringCode";
const h5DevServerUrl =
  process.env.H5_DEV_SERVER_URL ??
  "http://127.0.0.1:3000/?native=ios&bridgeDebug=1";
const uiTestTarget =
  process.env.AI_CODE_IOS_ATTACHMENT_UI_TEST_TARGET ??
  "AIEngineeringCodeUITests";
const uiTestClass =
  process.env.AI_CODE_IOS_ATTACHMENT_UI_TEST_CLASS ??
  "NativeKeyboardInputUITests";
const uiTestMethod =
  process.env.AI_CODE_IOS_ATTACHMENT_UI_TEST_METHOD ??
  "testNativeAttachmentButtonPresentsAttachmentChoices";
const timeoutMs = Number.parseInt(
  process.env.AI_CODE_IOS_ATTACHMENT_UI_TEST_TIMEOUT_MS ?? "900000",
  10
);

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
  console.error("iOS attachment UI test failed: xcodebuild is not available.");
  console.error(
    "Install full Xcode and run: sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
  );
  process.exit(1);
}

if (version.status !== 0) {
  console.error("iOS attachment UI test failed while checking xcodebuild.");
  process.stdout.write(version.stdout ?? "");
  process.stderr.write(version.stderr ?? "");
  process.exit(version.status ?? 1);
}

process.stdout.write(version.stdout ?? "");

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
  `H5_DEV_SERVER_URL=${h5DevServerUrl}`,
  "CODE_SIGNING_ALLOWED=NO",
  "-only-testing:" + onlyTesting,
  "test",
];

console.log(
  [
    "Running iOS attachment UI test:",
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

if (result.error?.code === "ETIMEDOUT") {
  console.error(
    `iOS attachment UI test timed out after ${timeoutMs}ms. Set AI_CODE_IOS_ATTACHMENT_UI_TEST_TIMEOUT_MS to override.`
  );
  process.exit(1);
}

if (result.error) {
  console.error(`iOS attachment UI test failed: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  console.error(
    `iOS attachment UI test failed with exit code ${result.status ?? "unknown"}.`
  );
  process.exit(result.status ?? 1);
}

const combinedOutput = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
if (!/Executed\s+[1-9]\d*\s+tests?[, ]/.test(combinedOutput)) {
  console.error(
    "iOS attachment UI test failed: xcodebuild completed without executing the selected XCTest."
  );
  process.exit(1);
}

console.log("iOS attachment UI test passed.");
