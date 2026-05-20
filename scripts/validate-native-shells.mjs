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

const iosWebViewPath = "apps/ios/AIEngineeringCode/H5WebView.swift";
const iosWebView = readRequired(iosWebViewPath);
assertIncludes(iosWebViewPath, iosWebView, "WKWebView");
assertIncludes(iosWebViewPath, iosWebView, "NativeBridge");

const iosShellPath = "apps/ios/AIEngineeringCode/HybridShellView.swift";
const iosShell = readRequired(iosShellPath);
assertIncludes(iosShellPath, iosShell, "http://127.0.0.1:3000");
assertIncludes(iosShellPath, iosShell, "AI Native Shell");

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
