import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

const rootDir = process.cwd();
const scheme = process.env.AI_CODE_IOS_SCHEME ?? "AIEngineeringCode";
const configuration = process.env.AI_CODE_IOS_CONFIGURATION ?? "Debug";
const derivedDataPath =
  process.env.AI_CODE_IOS_DERIVED_DATA_PATH ??
  path.join(".tmp", "xcodebuild", scheme);
const appPath =
  process.env.AI_CODE_IOS_APP_PATH ??
  path.join(
    derivedDataPath,
    "Build",
    "Products",
    `${configuration}-iphonesimulator`,
    `${scheme}.app`
  );
const bundleId =
  process.env.AI_CODE_IOS_BUNDLE_ID ?? "com.aiengineeringcode.shell";
const requestedUdid = process.env.AI_CODE_IOS_SIMULATOR_UDID;
const skipBuild = process.env.AI_CODE_IOS_SIMULATOR_SKIP_BUILD === "1";
const keepBooted = process.env.AI_CODE_IOS_SIMULATOR_KEEP_BOOTED === "1";
const keepRunning =
  process.env.AI_CODE_IOS_SIMULATOR_KEEP_APP_RUNNING === "1";

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: rootDir,
    encoding: "utf8",
    ...options,
  });
}

function fail(message, result) {
  console.error(message);
  if (result?.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result?.stderr) {
    process.stderr.write(result.stderr);
  }
  process.exit(result?.status ?? 1);
}

function parseJsonResult(label, result) {
  if (result.error) {
    fail(`${label} failed: ${result.error.message}`, result);
  }
  if (result.status !== 0) {
    fail(`${label} failed with exit code ${result.status}.`, result);
  }

  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    fail(`${label} returned invalid JSON: ${error.message}`, result);
  }
}

function collectDevices(simctlJson) {
  return Object.entries(simctlJson.devices ?? {}).flatMap(([runtime, devices]) =>
    devices.map((device) => ({ ...device, runtime }))
  );
}

function chooseSimulator() {
  if (requestedUdid) {
    const allDevices = parseJsonResult(
      "xcrun simctl list devices available --json",
      run("xcrun", ["simctl", "list", "devices", "available", "--json"])
    );
    const requested = collectDevices(allDevices).find(
      (device) => device.udid === requestedUdid
    );
    if (!requested) {
      console.error(
        `Requested simulator ${requestedUdid} was not found in available devices.`
      );
      process.exit(1);
    }
    return requested;
  }

  const bootedDevices = parseJsonResult(
    "xcrun simctl list devices booted --json",
    run("xcrun", ["simctl", "list", "devices", "booted", "--json"])
  );
  const bootedIphone = collectDevices(bootedDevices).find(
    (device) =>
      device.isAvailable &&
      device.state === "Booted" &&
      device.deviceTypeIdentifier?.includes("iPhone")
  );
  if (bootedIphone) {
    return bootedIphone;
  }

  const availableDevices = parseJsonResult(
    "xcrun simctl list devices available --json",
    run("xcrun", ["simctl", "list", "devices", "available", "--json"])
  );
  const candidates = collectDevices(availableDevices).filter(
    (device) =>
      device.isAvailable && device.deviceTypeIdentifier?.includes("iPhone")
  );
  if (candidates.length === 0) {
    console.error("No available iPhone simulator was found.");
    process.exit(1);
  }

  return (
    candidates.find((device) => device.name === "iPhone 16 Pro Max") ??
    candidates.find((device) => device.name === "iPhone 16 Pro") ??
    candidates.find((device) => device.name === "iPhone 16") ??
    candidates[0]
  );
}

if (!skipBuild) {
  const buildResult = run("pnpm", ["validate:ios-build"], {
    stdio: "inherit",
  });
  if (buildResult.error) {
    fail(`iOS build command failed: ${buildResult.error.message}`, buildResult);
  }
  if (buildResult.status !== 0) {
    fail(
      `iOS build command failed with exit code ${buildResult.status}.`,
      buildResult
    );
  }
}

const absoluteAppPath = path.resolve(rootDir, appPath);
if (!fs.existsSync(absoluteAppPath)) {
  console.error(`Built app was not found at ${absoluteAppPath}.`);
  console.error(
    "Run pnpm validate:ios-build first, or set AI_CODE_IOS_APP_PATH."
  );
  process.exit(1);
}

const simulator = chooseSimulator();
let bootedByScript = false;

console.log(
  `Using simulator: ${simulator.name} (${simulator.udid}, ${simulator.state})`
);

if (simulator.state !== "Booted") {
  const bootResult = run("xcrun", ["simctl", "boot", simulator.udid], {
    stdio: "inherit",
  });
  if (bootResult.error) {
    fail(`Failed to boot simulator: ${bootResult.error.message}`, bootResult);
  }
  if (bootResult.status !== 0) {
    fail(`Failed to boot simulator ${simulator.udid}.`, bootResult);
  }
  bootedByScript = true;

  const bootStatusResult = run(
    "xcrun",
    ["simctl", "bootstatus", simulator.udid, "-b"],
    { stdio: "inherit" }
  );
  if (bootStatusResult.error) {
    fail(
      `Failed while waiting for simulator boot: ${bootStatusResult.error.message}`,
      bootStatusResult
    );
  }
  if (bootStatusResult.status !== 0) {
    fail(`Simulator ${simulator.udid} did not finish booting.`, bootStatusResult);
  }
}

const installResult = run("xcrun", [
  "simctl",
  "install",
  simulator.udid,
  absoluteAppPath,
]);
if (installResult.error) {
  fail(`Failed to install app: ${installResult.error.message}`, installResult);
}
if (installResult.status !== 0) {
  fail(`Failed to install ${absoluteAppPath}.`, installResult);
}

const containerResult = run("xcrun", [
  "simctl",
  "get_app_container",
  simulator.udid,
  bundleId,
  "app",
]);
if (containerResult.error) {
  fail(
    `Failed to resolve installed app container: ${containerResult.error.message}`,
    containerResult
  );
}
if (containerResult.status !== 0) {
  fail(`Installed app container was not found for ${bundleId}.`, containerResult);
}

const launchResult = run("xcrun", [
  "simctl",
  "launch",
  simulator.udid,
  bundleId,
]);
if (launchResult.error) {
  fail(`Failed to launch app: ${launchResult.error.message}`, launchResult);
}
if (launchResult.status !== 0) {
  fail(`Failed to launch ${bundleId}.`, launchResult);
}

const launchOutput = launchResult.stdout.trim();
console.log(launchOutput);

if (!keepRunning) {
  run("xcrun", ["simctl", "terminate", simulator.udid, bundleId]);
}

if (bootedByScript && !keepBooted) {
  run("xcrun", ["simctl", "shutdown", simulator.udid]);
}

console.log(
  [
    "iOS simulator smoke passed.",
    `App container: ${containerResult.stdout.trim()}`,
  ].join("\n")
);
