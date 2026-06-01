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
  assert.match(validator, /"prepare:ios-manual-review-pack"/);
  assert.match(validator, /"prepare:ios-manual-handoff"/);
  assert.match(validator, /scripts\/generate-ios-manual-review-pack\.mjs/);
  assert.match(validator, /scripts\/prepare-ios-manual-acceptance-handoff\.mjs/);
  assert.match(validator, /buildManualReviewHtmlPack/);
  assert.match(validator, /buildManualAcceptanceHandoff/);
  assert.match(validator, /buildManualAcceptanceHtmlHandoff/);
  assert.match(validator, /requiredEvidenceSummary/);
  assert.match(validator, /manual review HTML pack written/);
  assert.match(validator, /manual acceptance HTML handoff written/);
  assert.match(validator, /manual-acceptance-handoff\.md/);
  assert.match(validator, /HTML manual review pack renders evidence links/);
  assert.match(validator, /current_with_docs_only_changes/);
  assert.match(validator, /postRecordChangedFilesBetweenHeads/);
  assert.match(validator, /reviewedItemIds/);
  assert.match(validator, /--reviewed-item/);
  assert.match(validator, /--reviewed-items-file/);
  assert.match(validator, /manual-evidence-reviewed-items\.json/);
  assert.match(validator, /recordHeadSha/);
  assert.match(validator, /AI_CODE_UI_TEST_DISABLE_CALENDAR_PERMISSION_REQUESTS/);
  assert.match(validator, /AI_CODE_UI_TEST_DISABLE_NOTIFICATION_PERMISSION_REQUESTS/);
  assert.match(validator, /\.second/);
  assert.match(validator, /scripts\/collect-v1-completion-audit\.mjs/);
  assert.match(validator, /const v1CompletionAuditTestPath/);
  assert.match(validator, /readRequired\(v1CompletionAuditTestPath\)/);
  assert.match(validator, /manual-evidence-gaps\.md/);
  assert.match(validator, /manualEvidenceReportPath/);
  assert.match(validator, /externalKnowledgeSync/);
  assert.match(validator, /external-knowledge-status/);
  assert.match(validator, /manual-record-root/);
  assert.match(validator, /manual-record best/);
  assert.match(validator, /人工证据记录选择/);
  assert.match(validator, /packageFreshness/);
  assert.match(validator, /current_with_docs_only_changes/);
  assert.match(validator, /旧 HEAD/);
});
