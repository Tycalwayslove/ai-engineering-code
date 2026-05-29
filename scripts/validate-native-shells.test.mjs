import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const rootDir = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

test("native shell validation guards the v1 completion audit entrypoint", () => {
  const validator = read("scripts/validate-native-shells.mjs");
  const packageJson = JSON.parse(read("package.json"));

  assert.equal(
    packageJson.scripts["validate:native-shells"],
    "node --test scripts/validate-native-shells.test.mjs && node scripts/validate-native-shells.mjs"
  );
  assert.match(validator, /"collect:v1-completion-audit"/);
  assert.match(validator, /scripts\/collect-v1-completion-audit\.mjs/);
  assert.match(validator, /const v1CompletionAuditTestPath/);
  assert.match(validator, /readRequired\(v1CompletionAuditTestPath\)/);
});
