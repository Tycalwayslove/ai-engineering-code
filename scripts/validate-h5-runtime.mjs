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

function assertNotIncludes(relativePath, content, unexpected, reason) {
  if (content.includes(unexpected)) {
    failures.push(`${relativePath}: unexpected "${unexpected}" (${reason})`);
  }
}

function assertIncludes(relativePath, content, expected, reason) {
  if (!content.includes(expected)) {
    failures.push(`${relativePath}: expected "${expected}" (${reason})`);
  }
}

function readFunctionSection(content, functionName, nextMarker) {
  const start = content.indexOf(functionName);
  const end = content.indexOf(nextMarker, start);

  if (start === -1 || end === -1) {
    return "";
  }

  return content.slice(start, end);
}

const h5RuntimePath = "apps/h5/src/app/ai-time-agent/components.tsx";
const h5Runtime = readRequired(h5RuntimePath);
const h5BackendApiPath = "apps/h5/src/app/ai-time-agent/backendApi.ts";
const h5BackendApi = readRequired(h5BackendApiPath);
const h5ClickSmokePath = "scripts/validate-h5-click-smoke.mjs";
const h5ClickSmoke = readRequired(h5ClickSmokePath);
const h5NextConfigPath = "apps/h5/next.config.ts";
const h5NextConfig = readRequired(h5NextConfigPath);
const h5NextEnvPath = "apps/h5/next-env.d.ts";
const h5NextEnv = readRequired(h5NextEnvPath);

assertNotIncludes(
  h5RuntimePath,
  h5Runtime,
  "function inferScheduleDraft",
  "runtime submissions must not infer product facts before the backend responds",
);
assertNotIncludes(
  h5RuntimePath,
  h5Runtime,
  "function makeInteractionElements",
  "runtime submissions must not fabricate backend elements",
);
assertNotIncludes(
  h5RuntimePath,
  h5Runtime,
  "Mock 后端返回",
  "runtime surfaces must only show backend responses or persisted snapshots",
);
assertNotIncludes(
  h5RuntimePath,
  h5Runtime,
  "window.prompt",
  "editing persisted facts must use the in-app editor instead of a browser prompt",
);
assertIncludes(
  h5RuntimePath,
  h5Runtime,
  "SummaryEditPanel",
  "runtime editing must render the in-app summary edit panel",
);
assertIncludes(
  h5RuntimePath,
  h5Runtime,
  "return nativeInitialBackendElementsBySurface;",
  "default H5 runtime must start from the real empty state instead of demo confirmation cards",
);
assertIncludes(
  h5RuntimePath,
  h5Runtime,
  'get("demo") === "1"',
  "demo fixtures must only appear behind an explicit demo query parameter",
);
assertIncludes(
  h5RuntimePath,
  h5Runtime,
  "getNativeAckExecutionStatus(message)",
  "native acknowledgements must resolve keyboard and voice bridge status",
);
assertIncludes(
  h5RuntimePath,
  h5Runtime,
  "getNativeInboundDebugLabel(message)",
  "Bridge Debug must show the Native inbound source summary instead of only the message type",
);
assertIncludes(
  h5RuntimePath,
  h5Runtime,
  "attachmentName",
  "Bridge Debug must identify attachment submissions without exposing file content",
);
assertIncludes(
  h5RuntimePath,
  h5Runtime,
  'type="datetime-local"',
  "calendar and reminder editing must use native date/time controls instead of plain text inputs",
);
assertIncludes(
  h5RuntimePath,
  h5Runtime,
  'type="date"',
  "expense editing must use a native date control instead of a plain text input",
);
assertIncludes(
  h5RuntimePath,
  h5Runtime,
  "dateTimeLocalValueToIso",
  "datetime-local values must be converted back to timezone-bearing ISO strings before calling the backend",
);
assertIncludes(
  h5RuntimePath,
  h5Runtime,
  "withSnapshotFallback",
  "optional snapshot sources must degrade instead of blocking core timeline refresh",
);
assertIncludes(
  h5RuntimePath,
  h5Runtime,
  "optional snapshot refresh failed",
  "optional snapshot failures must be visible in development logs",
);
assertIncludes(
  h5RuntimePath,
  h5Runtime,
  "data-highlighted-summary-item",
  "notification-opened reminders must mark the highlighted row for viewport positioning",
);
assertIncludes(
  h5RuntimePath,
  h5Runtime,
  "scrollIntoView",
  "notification-opened reminders must scroll the highlighted row into view",
);
assertIncludes(
  h5BackendApiPath,
  h5BackendApi,
  "selectRecentItemsWithFocus",
  "focused notification-opened reminders must stay in the rendered list even when outside the latest six items",
);
assertNotIncludes(
  h5BackendApiPath,
  h5BackendApi,
  "reminders.slice(-6).map",
  "focused notification-opened reminders must not be dropped by a blind latest-six slice",
);
assertIncludes(
  h5BackendApiPath,
  h5BackendApi,
  "已更新日程",
  "confirmed calendar update actions must not render as newly created events",
);
assertIncludes(
  h5BackendApiPath,
  h5BackendApi,
  "已提交费用",
  "confirmed expense submit actions must not render as newly created expense drafts",
);
assertIncludes(
  h5BackendApiPath,
  h5BackendApi,
  "已取消提醒",
  "confirmed reminder cancel actions must not render as newly created reminders",
);
assertIncludes(
  h5BackendApiPath,
  h5BackendApi,
  "latestTrace.llmCall",
  "Agent debug settings must surface real LLM provider call observation when available",
);
assertIncludes(
  h5BackendApiPath,
  h5BackendApi,
  "promptSha256",
  "Agent debug settings must include the provider prompt hash for log correlation",
);
assertIncludes(
  h5NextConfigPath,
  h5NextConfig,
  "NEXT_DIST_DIR",
  "H5 smoke tests must be able to isolate Next dev lock state from a running local dev server",
);
assertIncludes(
  h5ClickSmokePath,
  h5ClickSmoke,
  "NEXT_DIST_DIR",
  "H5 click smoke must launch Next with an isolated distDir so dev:full can keep running",
);
assertIncludes(
  h5ClickSmokePath,
  h5ClickSmoke,
  "restoreH5NextEnv",
  "H5 click smoke must restore Next's generated next-env.d.ts after using a temporary distDir",
);
assertNotIncludes(
  h5NextEnvPath,
  h5NextEnv,
  ".tmp/next-h5-click-smoke",
  "H5 click smoke must not leave a temporary Next distDir in the tracked next-env.d.ts file",
);

const handleCancelSection = readFunctionSection(
  h5Runtime,
  "async function handleCancel",
  "useEffect(() =>",
);
const handleSubmittedTextSection = readFunctionSection(
  h5Runtime,
  "async function handleSubmittedText",
  "async function handleSubmittedAttachment",
);

assertIncludes(
  h5RuntimePath,
  handleCancelSection,
  "removeConfirmationElement(current.conversation, planId)",
  "canceling a plan must remove the stale confirmation card",
);
assertNotIncludes(
  h5RuntimePath,
  handleCancelSection,
  ".catch(() => undefined)",
  "reject failures must surface to the runtime status instead of being swallowed",
);
assertIncludes(
  h5RuntimePath,
  handleSubmittedTextSection,
  "displayText ?? text",
  "quick reply stable values must not leak internal IDs into the user-facing message bubble",
);
assertIncludes(
  h5RuntimePath,
  handleSubmittedTextSection,
  "displayInput: displayText",
  "quick reply display labels must be sent to the backend so restored history stays user-facing",
);
assertIncludes(
  h5RuntimePath,
  h5Runtime,
  "void handleSubmittedText(reply.value, { displayText: reply.label });",
  "quick reply clicks must submit the stable value while displaying the human label",
);
assertIncludes(
  h5ClickSmokePath,
  h5ClickSmoke,
  "calendar event should be canceled",
  "click smoke must prove timeline calendar edit and cancellation change backend state",
);
assertIncludes(
  h5ClickSmokePath,
  h5ClickSmoke,
  "calendar native sync should include scheduled event",
  "click smoke must prove H5 sends scheduled calendar facts to Native for EventKit sync",
);
assertIncludes(
  h5ClickSmokePath,
  h5ClickSmoke,
  "calendar native sync should include canceled event",
  "click smoke must prove H5 sends canceled calendar facts to Native so iOS can remove stale system events",
);
assertIncludes(
  h5ClickSmokePath,
  h5ClickSmoke,
  "calendar native sync should include edited scheduled event",
  "click smoke must prove H5 sends edited calendar facts to Native for EventKit resync",
);
assertIncludes(
  h5ClickSmokePath,
  h5ClickSmoke,
  "calendar event should be updated",
  "click smoke must prove timeline calendar edit saves backend state",
);
assertIncludes(
  h5ClickSmokePath,
  h5ClickSmoke,
  "expense should be submitted",
  "click smoke must prove timeline expense edit and submit change backend state",
);
assertIncludes(
  h5ClickSmokePath,
  h5ClickSmoke,
  "expense should be updated",
  "click smoke must prove timeline expense edit saves backend state",
);
assertIncludes(
  h5ClickSmokePath,
  h5ClickSmoke,
  "reminder should be done",
  "click smoke must prove timeline reminder edit and completion change backend state",
);
assertIncludes(
  h5ClickSmokePath,
  h5ClickSmoke,
  "reminder native sync should include scheduled reminder",
  "click smoke must prove H5 sends scheduled reminders to Native for local notifications",
);
assertIncludes(
  h5ClickSmokePath,
  h5ClickSmoke,
  "reminder native sync should include edited scheduled reminder",
  "click smoke must prove H5 sends edited reminder facts to Native for local notification rescheduling",
);
assertIncludes(
  h5ClickSmokePath,
  h5ClickSmoke,
  "reminder native sync should exclude done reminder",
  "click smoke must prove H5 stops sending completed reminders to Native local notification sync",
);
assertIncludes(
  h5ClickSmokePath,
  h5ClickSmoke,
  "reminder should be updated",
  "click smoke must prove timeline reminder edit saves backend state",
);

if (failures.length > 0) {
  console.error("H5 runtime validation failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("H5 runtime validation passed.");
