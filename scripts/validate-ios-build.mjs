import { mkdirSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

const rootDir = process.cwd();
const projectPath =
  process.env.AI_CODE_IOS_PROJECT ??
  "apps/ios/AIEngineeringCode.xcodeproj";
const scheme = process.env.AI_CODE_IOS_SCHEME ?? "AIEngineeringCode";
const configuration = process.env.AI_CODE_IOS_CONFIGURATION ?? "Debug";
const destination =
  process.env.AI_CODE_IOS_DESTINATION ?? "generic/platform=iOS Simulator";
const derivedDataPath =
  process.env.AI_CODE_IOS_DERIVED_DATA_PATH ??
  path.join(".tmp", "xcodebuild", scheme);
const h5DevServerUrl =
  process.env.H5_DEV_SERVER_URL ?? "http://127.0.0.1:3000/?native=ios";
const timeoutMs = Number.parseInt(
  process.env.AI_CODE_IOS_BUILD_TIMEOUT_MS ?? "900000",
  10
);

function quoteArg(arg) {
  if (/^[A-Za-z0-9_./:=?&+-]+$/.test(arg)) {
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
  console.error("iOS build validation failed: xcodebuild is not available.");
  console.error(
    "Install full Xcode and run: sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
  );
  process.exit(1);
}

if (version.status !== 0) {
  console.error("iOS build validation failed while checking xcodebuild.");
  process.stdout.write(version.stdout ?? "");
  process.stderr.write(version.stderr ?? "");
  process.exit(version.status ?? 1);
}

process.stdout.write(version.stdout ?? "");

mkdirSync(path.resolve(rootDir, derivedDataPath), { recursive: true });

const buildArgs = [
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
  "build",
];

console.log(
  [
    "Running iOS build validation:",
    "xcodebuild",
    ...buildArgs.map(quoteArg),
  ].join(" ")
);

const result = spawnSync("xcodebuild", buildArgs, {
  cwd: rootDir,
  stdio: "inherit",
  timeout: timeoutMs,
});

if (result.error?.code === "ETIMEDOUT") {
  console.error(
    `iOS build validation timed out after ${timeoutMs}ms. Set AI_CODE_IOS_BUILD_TIMEOUT_MS to override.`
  );
  process.exit(1);
}

if (result.error) {
  console.error(`iOS build validation failed: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  console.error(
    `iOS build validation failed with exit code ${result.status ?? "unknown"}.`
  );
  process.exit(result.status ?? 1);
}

console.log("iOS build validation passed.");
