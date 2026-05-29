import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

import { fetchWithRetry } from "./http-retry.mjs";
import { isCalendarPermissionDenialAvailable } from "./ios-acceptance-predicates.mjs";
import { buildManualEvidenceReview } from "./manual-evidence-review.mjs";

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
const nativeConversationIdStorageKey = "ai-code.native.conversationId";
const nativeConversationIdPrefix = "conversation_ios_";
const nativeSystemDiagnosticsStorageKey = "ai-code.native.systemDiagnostics";
const h5NativeBaseUrl =
  process.env.AI_CODE_H5_NATIVE_BASE_URL ?? "http://127.0.0.1:3000";
const h5Surfaces = [
  "conversation",
  "timeline",
  "calendar",
  "expenses",
  "reminders",
  "ledger",
  "settings",
];
const h5SurfaceLabels = {
  calendar: "日程",
  conversation: "对话",
  expenses: "费用",
  ledger: "执行记录",
  reminders: "提醒",
  settings: "设置",
  timeline: "Timeline",
};
const apiBaseUrl = (
  process.env.AI_CODE_API_BASE_URL ?? "http://127.0.0.1:8000"
).replace(/\/+$/, "");
function shanghaiSeedNow(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      day: "2-digit",
      month: "2-digit",
      timeZone: "Asia/Shanghai",
      year: "numeric",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}T09:00:00+08:00`;
}

function shanghaiCurrentNow(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
      minute: "2-digit",
      month: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Shanghai",
      year: "numeric",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}+08:00`;
}
const acceptanceSeedNow =
  process.env.AI_CODE_IOS_ACCEPTANCE_SEED_NOW ?? shanghaiSeedNow();
function defaultSeedRunId(date = new Date()) {
  return `seed_${date.toISOString().replace(/[^0-9]/g, "").slice(0, 14)}`;
}

function buildAcceptanceSeedInputs(seedRunId) {
  return [
    {
      domain: "calendar",
      input: `明天下午三点开${seedRunId}验收会议，时间一个小时`,
    },
    {
      domain: "expense",
      input: `把昨天 58 元${seedRunId}验收打车票报销`,
    },
    {
      domain: "reminder",
      input: `明天上午九点提醒我${seedRunId}验收带电脑`,
    },
  ];
}

const automatedEvidence = [
  "git_state",
  "local_service_health",
  "h5_dev_server_url",
  "ios_build",
  "simulator_install_launch",
  "native_conversation_id_storage",
  "native_system_diagnostics",
  "backend_fact_snapshot",
  "h5_surface_screenshots",
  "simulator_screenshot",
  "manual_acceptance_checklist_shape",
];

const manualEvidenceStillRequired = [
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
];

const manualEvidenceGuides = {
  "会话持久 ID": {
    apiSummaries: ["/agent/conversations/{conversationId}/turns"],
    bridgeMarkers: ["conversationId=conversation_ios_*"],
    screenshots: ["重启前 conversationId", "重启后 conversationId"],
    systemArtifacts: [],
  },
  键盘输入: {
    apiSummaries: ["/reminders?conversationId=..."],
    bridgeMarkers: ["source=native.composer.keyboard"],
    screenshots: ["输入框文本", "H5 确认卡", "提醒页 scheduled 结果"],
    systemArtifacts: [],
  },
  语音输入: {
    apiSummaries: ["/reminders?conversationId=..."],
    bridgeMarkers: ["source=native.composer.voice"],
    screenshots: ["麦克风 / 语音识别权限弹窗", "识别文本", "H5 确认卡"],
    systemArtifacts: ["iOS 权限弹窗截图或录屏"],
  },
  照片附件: {
    apiSummaries: ["/attachments?conversationId=...", "/expenses?conversationId=..."],
    bridgeMarkers: [
      "inputKind=attachment",
      "attachmentKind=image",
      "source=native.composer.attachment.photo",
    ],
    screenshots: ["PhotosPicker 选择流程", "H5 附件摘要卡", "费用确认卡或金额追问"],
    systemArtifacts: ["PhotosPicker 权限与选择器截图"],
  },
  文件附件: {
    apiSummaries: ["/attachments?conversationId=..."],
    bridgeMarkers: [
      "inputKind=attachment",
      "source=native.composer.attachment.file",
    ],
    screenshots: ["fileImporter 选择流程", "H5 附件摘要卡"],
    systemArtifacts: ["Files 选择器截图"],
  },
  "PDF 文本提取": {
    apiSummaries: ["/attachments?conversationId=..."],
    bridgeMarkers: [
      "inputKind=attachment",
      "source=native.composer.attachment.file",
    ],
    screenshots: ["PDF 选择流程", "后续追问或确认卡"],
    systemArtifacts: ["PDF 样本文本摘要截图"],
  },
  本地通知: {
    apiSummaries: ["/reminders?conversationId=..."],
    bridgeMarkers: ["notifications.reminders.sync"],
    screenshots: ["提醒确认卡", "H5 提醒页 scheduled 结果"],
    systemArtifacts: ["iOS 通知权限弹窗截图", "系统通知截图"],
  },
  通知点击回流: {
    apiSummaries: ["/reminders?conversationId=..."],
    bridgeMarkers: ["source=native.notifications.reminders.opened"],
    screenshots: ["通知点击后 H5 reminders 视图", "高亮提醒行"],
    systemArtifacts: ["系统通知点击录屏"],
  },
  系统日历写入: {
    apiSummaries: ["/calendar/events?conversationId=..."],
    bridgeMarkers: ["calendar.events.sync"],
    screenshots: ["日程确认卡", "H5 日历页 scheduled 结果"],
    systemArtifacts: ["iOS 系统日历事件截图"],
  },
  系统日历取消清理: {
    apiSummaries: ["/calendar/events?conversationId=..."],
    bridgeMarkers: ["calendar.events.sync", "status=canceled"],
    screenshots: ["H5 日程取消动作", "后端 canceled 状态"],
    systemArtifacts: ["iOS 系统日历事件消失截图"],
  },
  后端事实确认: {
    apiSummaries: [
      "/calendar/events?conversationId=...",
      "/reminders?conversationId=...",
      "/expenses?conversationId=...",
      "/execution-ledger?conversationId=...",
    ],
    bridgeMarkers: ["action_executed", "direct_action_executed"],
    screenshots: ["Timeline 页面", "日程页", "提醒页", "费用页", "执行记录页"],
    systemArtifacts: [],
  },
  系统同步降级: {
    apiSummaries: ["/calendar/events?conversationId=...", "/reminders?conversationId=..."],
    bridgeMarkers: ["native.error"],
    screenshots: ["权限拒绝", "H5 状态栏降级文案", "后端事实接口成功响应"],
    systemArtifacts: ["iOS 权限拒绝截图"],
  },
};

const manualEvidenceRecordStatuses = ["pending", "passed", "failed", "blocked"];

const manualEvidenceRecordIds = {
  "H5 地址覆盖": "h5_address_override",
  "会话持久 ID": "conversation_persistence",
  键盘输入: "keyboard_input",
  语音输入: "voice_input",
  照片附件: "photo_attachment",
  文件附件: "file_attachment",
  "PDF 文本提取": "pdf_text_extraction",
  本地通知: "local_notification",
  通知点击回流: "notification_click_backflow",
  系统日历写入: "system_calendar_write",
  系统日历取消清理: "system_calendar_cleanup",
  后端事实确认: "backend_fact_confirmation",
  系统同步降级: "system_sync_degradation",
};

function parseArgs(argv) {
  const seedSupportedSystemEvidence =
    process.env.AI_CODE_IOS_ACCEPTANCE_SEED_SUPPORTED_SYSTEM_EVIDENCE === "1";
  const args = {
    dryRun: false,
    outputDir: process.env.AI_CODE_IOS_ACCEPTANCE_EVIDENCE_DIR,
    resetApp: process.env.AI_CODE_IOS_ACCEPTANCE_RESET_APP === "1",
    seedAcceptanceFacts:
      process.env.AI_CODE_IOS_ACCEPTANCE_SEED_FACTS === "1" ||
      seedSupportedSystemEvidence,
    seedCalendarCleanup:
      process.env.AI_CODE_IOS_ACCEPTANCE_SEED_CALENDAR_CLEANUP === "1" ||
      seedSupportedSystemEvidence,
    seedCalendarPermissionDenial:
      process.env.AI_CODE_IOS_ACCEPTANCE_SEED_CALENDAR_PERMISSION_DENIAL === "1" ||
      seedSupportedSystemEvidence,
    seedNotificationClickBackflow:
      process.env.AI_CODE_IOS_ACCEPTANCE_SEED_NOTIFICATION_CLICK_BACKFLOW === "1" ||
      seedSupportedSystemEvidence,
    seedNotificationDelivery:
      process.env.AI_CODE_IOS_ACCEPTANCE_SEED_NOTIFICATION_DELIVERY === "1" ||
      seedSupportedSystemEvidence,
    seedKeyboardInput:
      process.env.AI_CODE_IOS_ACCEPTANCE_SEED_KEYBOARD_INPUT === "1",
    seedAttachmentInputs:
      process.env.AI_CODE_IOS_ACCEPTANCE_SEED_ATTACHMENT_INPUTS === "1",
    captureCalendarSystemApp:
      process.env.AI_CODE_IOS_ACCEPTANCE_CAPTURE_CALENDAR_APP === "1" ||
      seedSupportedSystemEvidence,
    skipBuild: process.env.AI_CODE_IOS_ACCEPTANCE_SKIP_BUILD === "1",
    screenshotDelayMs: Number(
      process.env.AI_CODE_IOS_ACCEPTANCE_SCREENSHOT_DELAY_MS ?? "3000"
    ),
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--dry-run") {
      args.dryRun = true;
    } else if (value === "--") {
      continue;
    } else if (value === "--reset-app") {
      args.resetApp = true;
    } else if (value === "--seed-acceptance-facts") {
      args.seedAcceptanceFacts = true;
    } else if (value === "--seed-supported-system-evidence") {
      args.seedAcceptanceFacts = true;
      args.seedCalendarCleanup = true;
      args.seedCalendarPermissionDenial = true;
      args.seedNotificationClickBackflow = true;
      args.seedNotificationDelivery = true;
      args.captureCalendarSystemApp = true;
    } else if (value === "--seed-calendar-cleanup") {
      args.seedCalendarCleanup = true;
    } else if (value === "--seed-calendar-permission-denial") {
      args.seedCalendarPermissionDenial = true;
    } else if (value === "--seed-notification-click-backflow") {
      args.seedNotificationClickBackflow = true;
    } else if (value === "--seed-notification-delivery") {
      args.seedNotificationDelivery = true;
    } else if (value === "--seed-keyboard-input") {
      args.seedKeyboardInput = true;
    } else if (value === "--seed-attachment-inputs") {
      args.seedAttachmentInputs = true;
    } else if (value === "--capture-calendar-system-app") {
      args.captureCalendarSystemApp = true;
    } else if (value === "--skip-build") {
      args.skipBuild = true;
    } else if (value === "--screenshot-delay-ms") {
      args.screenshotDelayMs = Number(argv[index + 1]);
      index += 1;
    } else if (value === "--output-dir") {
      args.outputDir = argv[index + 1];
      index += 1;
    } else {
      throw new Error(`Unsupported argument: ${value}`);
    }
  }
  return args;
}

function timestampForPath(date = new Date()) {
  return date.toISOString().replaceAll(":", "-").replace(/\.\d+Z$/, "Z");
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function sleep(milliseconds) {
  if (milliseconds <= 0) {
    return;
  }
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function run(command, args, options = {}) {
  if (options.dryRun) {
    return {
      command: [command, ...args].join(" "),
      status: 0,
      stdout: `[dry-run] ${[command, ...args].join(" ")}`,
      stderr: "",
    };
  }
  const result = spawnSync(command, args, {
    cwd: rootDir,
    encoding: "utf8",
    ...options.spawnOptions,
  });
  return {
    command: [command, ...args].join(" "),
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error?.message,
  };
}

function commandOk(result) {
  return !result.error && result.status === 0;
}

function parseJson(stdout) {
  try {
    return JSON.parse(stdout);
  } catch {
    return undefined;
  }
}

function isIsoAtOrAfter(value, threshold) {
  const valueMs = Date.parse(value);
  const thresholdMs = Date.parse(threshold);
  if (!Number.isFinite(valueMs) || !Number.isFinite(thresholdMs)) {
    return null;
  }
  return valueMs >= thresholdMs;
}

function writeText(filePath, content) {
  fs.writeFileSync(filePath, content, "utf8");
}

function collectGitState({ dryRun }) {
  const branch = run("git", ["status", "--short", "--branch"], { dryRun });
  const commit = run("git", ["rev-parse", "--short", "HEAD"], { dryRun });
  const recent = run("git", ["log", "--oneline", "-5"], { dryRun });
  return {
    branch: branch.stdout.trim(),
    commit: commit.stdout.trim(),
    recentCommits: recent.stdout.trim().split("\n").filter(Boolean),
    commands: { branch, commit, recent },
  };
}

function checkH5TargetDocument({ dryRun, url }) {
  const trimmedUrl = typeof url === "string" ? url.trim() : "";
  const isHttpUrl = /^https?:\/\//.test(trimmedUrl);
  if (!trimmedUrl || !isHttpUrl || dryRun) {
    return {
      command: {
        command: isHttpUrl ? `curl -fsS ${trimmedUrl}` : "curl -fsS <h5-url>",
        status: dryRun ? 0 : 1,
        stdout: dryRun
          ? `[dry-run] curl -fsS ${isHttpUrl ? trimmedUrl : "<h5-url>"}`
          : "",
        stderr: isHttpUrl ? "" : "H5 URL was not found.",
      },
      markerFound: false,
      url: isHttpUrl ? trimmedUrl : null,
    };
  }
  const command = run("curl", ["-fsS", trimmedUrl]);
  return {
    command,
    markerFound:
      commandOk(command) &&
      command.stdout.includes("AI 时间管理 Agent") &&
      command.stdout.includes("/_next/"),
    url: trimmedUrl,
  };
}

function collectServiceHealth({ dryRun }) {
  const api = run(
    "curl",
    ["-fsS", "-o", "/dev/null", "-w", "%{http_code}", `${apiBaseUrl}/health`],
    { dryRun }
  );
  const h5 = run(
    "curl",
    [
      "-fsS",
      "-o",
      "/dev/null",
      "-w",
      "%{http_code}",
      "http://127.0.0.1:3000/?native=ios&bridgeDebug=1",
    ],
    { dryRun }
  );
  const h5Target = checkH5TargetDocument({
    dryRun,
    url: `${h5NativeBaseUrl}/?native=ios&bridgeDebug=1`,
  });
  return {
    apiHealthStatus: api.stdout.trim(),
    h5NativeTargetMarkerFound: h5Target.markerFound,
    h5NativeTargetUrl: h5Target.url,
    h5NativeStatus: h5.stdout.trim(),
    commands: { api, h5, h5Document: h5Target.command },
  };
}

function countArrayField(payload, fieldName) {
  if (Array.isArray(payload)) {
    return payload.length;
  }
  return Array.isArray(payload?.[fieldName]) ? payload[fieldName].length : 0;
}

function previewArrayField(payload, fieldName) {
  if (Array.isArray(payload)) {
    return payload.slice(0, 3);
  }
  return Array.isArray(payload?.[fieldName])
    ? payload[fieldName].slice(0, 3)
    : [];
}

function collectBackendFactSnapshot({ conversationId, dryRun }) {
  const commands = {};
  const counts = {
    calendarEvents: 0,
    executionLedger: 0,
    expenses: 0,
    reminders: 0,
    turns: 0,
  };
  const previews = {
    calendarEvents: [],
    executionLedger: [],
    expenses: [],
    reminders: [],
    turns: [],
  };
  const result = {
    available: false,
    conversationId: conversationId ?? null,
    counts,
    previews,
    commands,
  };

  if (!conversationId || dryRun) {
    return result;
  }

  const encodedConversationId = encodeURIComponent(conversationId);
  const requests = {
    calendarEvents: {
      fieldName: "events",
      url: `${apiBaseUrl}/calendar/events?conversationId=${encodedConversationId}`,
    },
    expenses: {
      fieldName: "expenses",
      url: `${apiBaseUrl}/expenses?conversationId=${encodedConversationId}`,
    },
    reminders: {
      fieldName: "reminders",
      url: `${apiBaseUrl}/reminders?conversationId=${encodedConversationId}`,
    },
    executionLedger: {
      fieldName: "items",
      url: `${apiBaseUrl}/execution-ledger?conversationId=${encodedConversationId}`,
    },
    turns: {
      fieldName: "turns",
      url: `${apiBaseUrl}/agent/conversations/${encodedConversationId}/turns`,
    },
  };

  for (const [key, request] of Object.entries(requests)) {
    commands[key] = run("curl", ["-fsS", request.url]);
    if (!commandOk(commands[key])) {
      continue;
    }
    const payload = parseJson(commands[key].stdout);
    counts[key] = countArrayField(payload, request.fieldName);
    previews[key] = previewArrayField(payload, request.fieldName);
  }

  result.available = Object.values(commands).some(commandOk);
  return result;
}

function emptyAcceptanceFactSeed({ enabled, conversationId, seedRunId }) {
  const inputs = buildAcceptanceSeedInputs(seedRunId);
  return {
    available: false,
    apiBaseUrl,
    commands: {},
    conversationId: conversationId ?? null,
    enabled,
    inputs,
    results: [],
    seedRunId,
    seedNow: acceptanceSeedNow,
    errors: [],
  };
}

function emptyCalendarCleanupSeed({
  acceptanceFactSeed,
  conversationId,
  enabled,
  outputDir,
}) {
  return {
    available: false,
    afterScreenshotRequiresCanceledEvent: true,
    apiBaseUrl,
    canceledEvent: null,
    commands: {},
    conversationId: conversationId ?? null,
    enabled,
    errors: [],
    postCancelStoredIdentifierPresent: null,
    postCancelRefreshMaxAttempts: Number(
      process.env.AI_CODE_IOS_ACCEPTANCE_CALENDAR_CLEANUP_POST_CANCEL_ATTEMPTS ??
        "8"
    ),
    postCancelRemovedEventIdPresent: false,
    postCancelStatus: null,
    postCancelSystemDiagnostics: {},
    preCancelDiagnosticsFresh: null,
    preCancelDiagnosticsUpdatedAt: null,
    preCancelStatus: null,
    preCancelRefreshMaxAttempts: Number(
      process.env.AI_CODE_IOS_ACCEPTANCE_CALENDAR_CLEANUP_PRE_CANCEL_ATTEMPTS ??
        "8"
    ),
    preCancelRequiresStoredIdentifier: true,
    preCancelStoredIdentifierPresent: null,
    removedEventIds: [],
    requiresAcceptanceFactSeed: true,
    seedRunId: acceptanceFactSeed?.seedRunId ?? null,
    systemCalendarAppScreenshots: {
      afterAvailable: false,
      afterPath: path.join(outputDir, "calendar-cleanup-after.png"),
      beforeAvailable: false,
      beforePath: path.join(outputDir, "calendar-cleanup-before.png"),
      calshowSeconds: null,
      calshowUrl: null,
      errors: [],
      supportingOnly: true,
    },
    targetEventId: null,
    targetEventStartAt: null,
    targetEventTitle: null,
  };
}

function emptyCalendarSystemAppEvidence({
  acceptanceFactSeed,
  conversationId,
  enabled,
  outputDir,
}) {
  return {
    available: false,
    apiBaseUrl,
    calshowSeconds: null,
    calshowUrl: null,
    commands: {},
    conversationId: conversationId ?? null,
    enabled,
    errors: [],
    requiresAcceptanceFactSeed: true,
    screenshotPath: path.join(outputDir, "system-calendar-app.png"),
    seedRunId: acceptanceFactSeed?.seedRunId ?? null,
    supportingOnly: true,
    targetEventId: null,
    targetEventStartAt: null,
    targetEventTitle: null,
  };
}

function emptyCalendarPermissionDenialSeed({
  conversationId,
  enabled,
  outputDir,
  seedRunId,
}) {
  return {
    available: false,
    apiBaseUrl,
    backendFactPersisted: false,
    commands: {},
    conversationId: conversationId ?? null,
    enabled,
    errors: [],
    h5StatusExpectation:
      "后端事项已保存，系统同步未开启",
    nativeErrorReason: null,
    nativeErrorSource: "native.calendar.events.sync",
    permissionService: "calendar",
    postAuthorizationStatus: null,
    preAuthorizationStatus: null,
    restoreAttempted: false,
    screenshotPath: path.join(outputDir, "calendar-permission-denial.png"),
    seedInput: `明天下午四点开${seedRunId}权限降级验收会议，时间一个小时`,
    seedRunId,
    targetEventId: null,
    targetEventTitle: null,
  };
}

function emptyNotificationClickBackflowSeed({
  conversationId,
  enabled,
  outputDir,
  seedNow,
  seedRunId,
}) {
  return {
    available: false,
    apiBaseUrl,
    bridgeInboundLabel: null,
    commands: {},
    conversationId: conversationId ?? null,
    enabled,
    errors: [],
    h5OpenedScreenshotPath: path.join(outputDir, "notification-click-backflow.png"),
    h5StatusText: null,
    highlightedReminderFound: false,
    mode: "h5_synthetic_native_event",
    notificationIdentifier: null,
    pendingNotificationFound: false,
    preOpenDiagnostics: {},
    reminderId: null,
    reminderTitle: null,
    seedDueAt: null,
    seedInput: `3分钟后提醒我${seedRunId}通知点击回流验收带电脑`,
    seedNow,
    seedRunId,
    supportingOnly: true,
    syntheticNativeMessage: null,
  };
}

function emptyNotificationDeliverySeed({
  conversationId,
  enabled,
  seedNow,
  seedRunId,
}) {
  return {
    available: false,
    apiBaseUrl,
    commands: {},
    conversationId: conversationId ?? null,
    deliveredDiagnostics: {},
    deliveredNotificationFound: false,
    deliveredRefreshMaxAttempts: Number(
      process.env.AI_CODE_IOS_ACCEPTANCE_NOTIFICATION_DELIVERY_DELIVERED_ATTEMPTS ??
        "8"
    ),
    enabled,
    errors: [],
    mode: "delivered_diagnostics",
    notificationIdentifier: null,
    pendingDiagnostics: {},
    pendingNotificationFound: false,
    reminderId: null,
    reminderTitle: null,
    seedDueAt: null,
    pendingRefreshMaxAttempts: Number(
      process.env.AI_CODE_IOS_ACCEPTANCE_NOTIFICATION_DELIVERY_PENDING_ATTEMPTS ??
        "8"
    ),
    seedInput: `2分钟后提醒我${seedRunId}通知投递验收喝水`,
    seedNow,
    seedRunId,
    supportingOnly: true,
    waitAfterDueMs: Number(
      process.env.AI_CODE_IOS_ACCEPTANCE_NOTIFICATION_DELIVERY_WAIT_AFTER_DUE_MS ??
        "15000"
    ),
    waitUntilDueMs: null,
  };
}

function emptyNativeKeyboardInputSeed({
  conversationId,
  enabled,
  outputDir,
  seedRunId,
}) {
  return {
    available: false,
    apiBaseUrl,
    bridgeInboundLabel: null,
    commands: {},
    confirmationCardFound: false,
    conversationId: conversationId ?? null,
    enabled,
    errors: [],
    mode: "h5_synthetic_native_input",
    reminderId: null,
    reminderTitle: null,
    screenshotPath: path.join(outputDir, "native-keyboard-input.png"),
    seedInput: `明天上午九点提醒我${seedRunId}键盘验收带电脑`,
    seedRunId,
    source: "native.composer.keyboard",
    supportingOnly: true,
    syntheticNativeMessage: null,
  };
}

function base64Utf8(value) {
  return Buffer.from(value, "utf8").toString("base64");
}

function buildNativeAttachmentSamples(seedRunId) {
  return [
    {
      attachmentId: `native_attachment_${seedRunId}_photo`,
      attachmentKind: "image",
      attachmentName: `${seedRunId}-receipt.jpg`,
      attachmentSizeBytes: 2048,
      attachmentType: "image/jpeg",
      base64Content: base64Utf8(`照片票据识别文本 金额 88.5 元\n2026-05-28\n${seedRunId}`),
      itemId: "photo_attachment",
      source: "native.composer.attachment.photo",
      text: `已选择附件：${seedRunId}-receipt.jpg（image，2048 bytes）。\n识别文本：照片票据 金额 88.5 元 2026-05-28`,
    },
    {
      attachmentId: `native_attachment_${seedRunId}_file`,
      attachmentKind: "text",
      attachmentName: `${seedRunId}-notes.txt`,
      attachmentSizeBytes: 512,
      attachmentType: "text/plain",
      base64Content: base64Utf8(`文件附件正文：${seedRunId} 项目会议材料`),
      itemId: "file_attachment",
      source: "native.composer.attachment.file",
      text: `已选择附件：${seedRunId}-notes.txt（text，512 bytes）。\n识别文本：项目会议材料`,
    },
    {
      attachmentId: `native_attachment_${seedRunId}_pdf`,
      attachmentKind: "pdf",
      attachmentName: `${seedRunId}-agenda.pdf`,
      attachmentSizeBytes: 4096,
      attachmentType: "application/pdf",
      base64Content: base64Utf8(`%PDF-1.4\n${seedRunId} agenda placeholder`),
      itemId: "pdf_text_extraction",
      source: "native.composer.attachment.file",
      text: `已选择附件：${seedRunId}-agenda.pdf（pdf，4096 bytes）。\n识别文本：PDF 日程材料 明天上午十点项目会`,
    },
  ];
}

function evidenceAttachmentSample(sample, attachment) {
  return {
    attachmentId: sample.attachmentId,
    backendAttachmentId: attachment?.id ?? null,
    contentStatus: attachment?.contentStatus ?? null,
    itemId: sample.itemId,
    kind: sample.attachmentKind,
    name: sample.attachmentName,
    source: sample.source,
    type: sample.attachmentType,
  };
}

function emptyNativeAttachmentInputsSeed({
  conversationId,
  enabled,
  outputDir,
  seedRunId,
}) {
  return {
    available: false,
    apiBaseUrl,
    commands: {},
    conversationId: conversationId ?? null,
    enabled,
    errors: [],
    mode: "h5_synthetic_native_attachment_inputs",
    samples: buildNativeAttachmentSamples(seedRunId).map((sample) =>
      evidenceAttachmentSample(sample)
    ),
    screenshotPath: path.join(outputDir, "native-attachment-inputs.png"),
    seedRunId,
    supportingOnly: true,
  };
}

async function postJson(url, body) {
  const response = await fetchWithRetry(url, {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { rawText: text };
  }
  return {
    ok: response.ok,
    status: response.status,
    payload,
    text,
  };
}

async function postEmpty(url) {
  const response = await fetchWithRetry(url, {
    method: "POST",
  });
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { rawText: text };
  }
  return {
    ok: response.ok,
    status: response.status,
    payload,
    text,
  };
}

async function getJson(url) {
  const response = await fetchWithRetry(url);
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { rawText: text };
  }
  return {
    ok: response.ok,
    status: response.status,
    payload,
    text,
  };
}

async function seedAcceptanceFacts({ conversationId, dryRun, enabled }) {
  const seedRunId =
    process.env.AI_CODE_IOS_ACCEPTANCE_SEED_RUN_ID ?? defaultSeedRunId();
  const seed = emptyAcceptanceFactSeed({ enabled, conversationId, seedRunId });
  if (!enabled) {
    return seed;
  }
  if (dryRun) {
    seed.errors.push("dry-run does not write acceptance facts");
    return seed;
  }
  if (!conversationId) {
    seed.errors.push("Native conversationId was not found; seed skipped.");
    return seed;
  }

  for (const seedInput of seed.inputs) {
    const turnUrl = `${apiBaseUrl}/agent/turns`;
    const turnBody = {
      clientContext: {
        now: acceptanceSeedNow,
        timezone: "Asia/Shanghai",
      },
      conversationId,
      input: seedInput.input,
    };
    const turn = await postJson(turnUrl, turnBody);
    seed.commands[`${seedInput.domain}.submitTurn`] = {
      command: `POST ${turnUrl}`,
      ok: turn.ok,
      status: turn.status,
    };
    if (!turn.ok || turn.payload?.kind !== "confirmation_required") {
      seed.errors.push(
        `${seedInput.domain} seed did not produce confirmation_required: ${turn.status}`
      );
      seed.results.push({
        domain: seedInput.domain,
        input: seedInput.input,
        kind: turn.payload?.kind ?? null,
        ok: false,
        status: turn.status,
      });
      continue;
    }

    const plan = turn.payload.plan;
    const confirmToken = plan?.confirmation?.confirmToken;
    const planId = plan?.id;
    if (!planId || !confirmToken || confirmToken === "redacted") {
      seed.errors.push(`${seedInput.domain} seed confirmation token missing.`);
      seed.results.push({
        domain: seedInput.domain,
        input: seedInput.input,
        kind: turn.payload.kind,
        ok: false,
        planId: planId ?? null,
        status: turn.status,
      });
      continue;
    }

    const confirmUrl = `${apiBaseUrl}/execution-plans/${encodeURIComponent(
      planId
    )}/confirm`;
    const confirm = await postJson(confirmUrl, {
      confirmToken,
    });
    seed.commands[`${seedInput.domain}.confirm`] = {
      command: `POST ${confirmUrl}`,
      ok: confirm.ok,
      status: confirm.status,
    };
    const actions = Array.isArray(confirm.payload?.plan?.actions)
      ? confirm.payload.plan.actions
      : [];
    const succeeded =
      confirm.ok &&
      confirm.payload?.kind === "execution_result" &&
      confirm.payload?.plan?.status === "succeeded" &&
      actions.every((action) => action.status === "succeeded");
    if (!succeeded) {
      seed.errors.push(`${seedInput.domain} seed confirmation failed: ${confirm.status}`);
    }
    seed.results.push({
      actions: actions.map((action) => ({
        actionType: action.actionType,
        id: action.id,
        result: action.result ?? null,
        status: action.status,
      })),
      actionTypes: actions.map((action) => action.actionType),
      domain: seedInput.domain,
      input: seedInput.input,
      kind: confirm.payload?.kind ?? null,
      ok: succeeded,
      planId,
      status: confirm.status,
    });
  }

  seed.available =
    seed.results.length === seed.inputs.length &&
    seed.results.every((result) => result.ok);
  return seed;
}

async function seedSingleCalendarEvent({
  conversationId,
  input,
  now,
  commandPrefix,
}) {
  const result = {
    event: null,
    ok: false,
    planId: null,
    commands: {},
    errors: [],
  };
  const turnUrl = `${apiBaseUrl}/agent/turns`;
  const turn = await postJson(turnUrl, {
    clientContext: {
      now,
      timezone: "Asia/Shanghai",
    },
    conversationId,
    input,
  });
  result.commands[`${commandPrefix}.submitTurn`] = {
    command: `POST ${turnUrl}`,
    status: turn.ok ? 0 : 1,
    stdout: JSON.stringify({ httpStatus: turn.status, kind: turn.payload?.kind ?? null }),
    stderr: "",
  };
  if (!turn.ok || turn.payload?.kind !== "confirmation_required") {
    result.errors.push(`calendar seed did not produce confirmation_required: ${turn.status}`);
    return result;
  }

  const plan = turn.payload.plan;
  const confirmToken = plan?.confirmation?.confirmToken;
  const planId = plan?.id;
  result.planId = planId ?? null;
  if (!planId || !confirmToken || confirmToken === "redacted") {
    result.errors.push("calendar seed confirmation token missing");
    return result;
  }

  const confirmUrl = `${apiBaseUrl}/execution-plans/${encodeURIComponent(
    planId
  )}/confirm`;
  const confirm = await postJson(confirmUrl, { confirmToken });
  result.commands[`${commandPrefix}.confirm`] = {
    command: `POST ${confirmUrl}`,
    status: confirm.ok ? 0 : 1,
    stdout: JSON.stringify({
      httpStatus: confirm.status,
      kind: confirm.payload?.kind ?? null,
    }),
    stderr: "",
  };
  const actions = Array.isArray(confirm.payload?.plan?.actions)
    ? confirm.payload.plan.actions
    : [];
  const calendarAction = actions.find(
    (action) => action.actionType === "calendar.create_event"
  );
  const event = calendarEventFromSeedAction(calendarAction);
  result.event = event;
  result.ok =
    confirm.ok &&
    confirm.payload?.kind === "execution_result" &&
    confirm.payload?.plan?.status === "succeeded" &&
    calendarAction?.status === "succeeded" &&
    Boolean(event);
  if (!result.ok) {
    result.errors.push(`calendar seed confirmation failed: ${confirm.status}`);
  }
  return result;
}

async function seedSingleReminder({
  conversationId,
  input,
  now,
  commandPrefix,
}) {
  const result = {
    commands: {},
    errors: [],
    ok: false,
    planId: null,
    reminder: null,
  };
  const turnUrl = `${apiBaseUrl}/agent/turns`;
  const turn = await postJson(turnUrl, {
    clientContext: {
      now,
      timezone: "Asia/Shanghai",
    },
    conversationId,
    input,
  });
  result.commands[`${commandPrefix}.submitTurn`] = {
    command: `POST ${turnUrl}`,
    status: turn.ok ? 0 : 1,
    stdout: JSON.stringify({ httpStatus: turn.status, kind: turn.payload?.kind ?? null }),
    stderr: "",
  };
  if (!turn.ok || turn.payload?.kind !== "confirmation_required") {
    result.errors.push(`reminder seed did not produce confirmation_required: ${turn.status}`);
    return result;
  }

  const plan = turn.payload.plan;
  const confirmToken = plan?.confirmation?.confirmToken;
  const planId = plan?.id;
  result.planId = planId ?? null;
  if (!planId || !confirmToken || confirmToken === "redacted") {
    result.errors.push("reminder seed confirmation token missing");
    return result;
  }

  const confirmUrl = `${apiBaseUrl}/execution-plans/${encodeURIComponent(
    planId
  )}/confirm`;
  const confirm = await postJson(confirmUrl, { confirmToken });
  result.commands[`${commandPrefix}.confirm`] = {
    command: `POST ${confirmUrl}`,
    status: confirm.ok ? 0 : 1,
    stdout: JSON.stringify({
      httpStatus: confirm.status,
      kind: confirm.payload?.kind ?? null,
    }),
    stderr: "",
  };
  const actions = Array.isArray(confirm.payload?.plan?.actions)
    ? confirm.payload.plan.actions
    : [];
  const reminderAction = actions.find(
    (action) => action.actionType === "reminder.create_reminder"
  );
  const reminder = reminderFromSeedAction(reminderAction);
  result.reminder = reminder;
  result.ok =
    confirm.ok &&
    confirm.payload?.kind === "execution_result" &&
    confirm.payload?.plan?.status === "succeeded" &&
    reminderAction?.status === "succeeded" &&
    Boolean(reminder);
  if (!result.ok) {
    result.errors.push(`reminder seed confirmation failed: ${confirm.status}`);
  }
  return result;
}

function calendarStoredIdentifierKey(eventId) {
  return `AI_CODE_EK_EVENT_IDENTIFIER:${eventId}`;
}

function preferenceKeyPresent(commandResult, key) {
  const json = parseJson(commandResult?.stdout ?? "");
  return Object.prototype.hasOwnProperty.call(json ?? {}, key);
}

function splitDiagnosticIds(rawValue) {
  return String(rawValue ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function diagnosticsContainCalendarId(systemDiagnostics, key, eventId) {
  return splitDiagnosticIds(systemDiagnostics?.[key]).includes(eventId);
}

function calendarSeedActionFromAcceptanceSeed(acceptanceFactSeed) {
  const calendarResult = acceptanceFactSeed?.results?.find(
    (result) => result.domain === "calendar"
  );
  return calendarResult?.actions?.find(
    (action) => action.actionType === "calendar.create_event"
  );
}

function calendarEventFromSeedAction(action) {
  const event = action?.result?.calendarEvent;
  if (!event || typeof event !== "object" || typeof event.id !== "string") {
    return null;
  }
  return event;
}

function secondsSinceAppleReferenceDate(isoDateTime) {
  const timestamp = Date.parse(isoDateTime);
  if (!Number.isFinite(timestamp)) {
    return null;
  }
  const appleReferenceTimestamp = Date.parse("2001-01-01T00:00:00Z");
  return Math.floor((timestamp - appleReferenceTimestamp) / 1000);
}

async function captureCalendarSystemAppEvidence({
  acceptanceFactSeed,
  conversationId,
  dryRun,
  enabled,
  outputDir,
  simulatorUdid,
  waitMs,
}) {
  const evidence = emptyCalendarSystemAppEvidence({
    acceptanceFactSeed,
    conversationId,
    enabled,
    outputDir,
  });
  if (!enabled) {
    return evidence;
  }
  if (dryRun) {
    evidence.errors.push("dry-run does not open the iOS Calendar app");
    return evidence;
  }
  if (!acceptanceFactSeed?.enabled || !acceptanceFactSeed.available) {
    evidence.errors.push("calendar system app evidence requires acceptance fact seed");
    return evidence;
  }
  if (!simulatorUdid) {
    evidence.errors.push("Simulator UDID was not found; system Calendar screenshot skipped.");
    return evidence;
  }

  const calendarAction = calendarSeedActionFromAcceptanceSeed(acceptanceFactSeed);
  const targetEvent = calendarEventFromSeedAction(calendarAction);
  evidence.targetEventId = targetEvent?.id ?? null;
  evidence.targetEventTitle = targetEvent?.title ?? null;
  evidence.targetEventStartAt = targetEvent?.startAt ?? null;
  evidence.calshowSeconds = secondsSinceAppleReferenceDate(
    evidence.targetEventStartAt
  );
  if (!evidence.targetEventId || evidence.calshowSeconds === null) {
    evidence.errors.push("calendar seed event or startAt was not found");
    return evidence;
  }

  evidence.calshowUrl = `calshow:${evidence.calshowSeconds}`;
  evidence.commands.openCalendarApp = run(
    "xcrun",
    ["simctl", "openurl", simulatorUdid, evidence.calshowUrl],
    { dryRun }
  );
  sleep(Math.max(1000, waitMs ?? 1000));
  evidence.commands.screenshot = run(
    "xcrun",
    ["simctl", "io", simulatorUdid, "screenshot", evidence.screenshotPath],
    { dryRun }
  );
  evidence.available =
    evidence.errors.length === 0 &&
    commandOk(evidence.commands.openCalendarApp) &&
    commandOk(evidence.commands.screenshot);
  return evidence;
}

function reminderFromSeedAction(action) {
  const reminder = action?.result?.reminder;
  if (
    !reminder ||
    typeof reminder !== "object" ||
    typeof reminder.id !== "string"
  ) {
    return null;
  }
  return reminder;
}

async function findSeedCalendarEvent({
  acceptanceFactSeed,
  conversationId,
  sourceActionId,
}) {
  if (!conversationId) {
    return { event: null, request: null };
  }
  const encodedConversationId = encodeURIComponent(conversationId);
  const url = `${apiBaseUrl}/calendar/events?conversationId=${encodedConversationId}`;
  const request = await getJson(url);
  if (!request.ok) {
    return { event: null, request };
  }
  const events = Array.isArray(request.payload)
    ? request.payload
    : Array.isArray(request.payload?.events)
      ? request.payload.events
      : [];
  const seedRunId = acceptanceFactSeed?.seedRunId;
  const bySourceAction = events.find(
    (event) => event.sourceActionId === sourceActionId
  );
  const bySeedRunId = events.find(
    (event) =>
      typeof seedRunId === "string" &&
      typeof event.title === "string" &&
      event.title.includes(seedRunId) &&
      event.status === "scheduled"
  );
  return { event: bySourceAction ?? bySeedRunId ?? null, request };
}

function captureCalendarCleanupSystemScreenshot({
  cleanup,
  dryRun,
  phase,
  simulatorUdid,
  waitMs,
}) {
  const screenshots = cleanup.systemCalendarAppScreenshots;
  if (!cleanup.targetEventStartAt) {
    screenshots.errors.push("calendar cleanup target startAt was not found");
    return;
  }
  if (!simulatorUdid && !dryRun) {
    screenshots.errors.push(
      `Simulator UDID was not found; calendar cleanup ${phase} screenshot skipped.`
    );
    return;
  }

  screenshots.calshowSeconds = secondsSinceAppleReferenceDate(
    cleanup.targetEventStartAt
  );
  if (screenshots.calshowSeconds === null) {
    screenshots.errors.push(
      `calendar cleanup target startAt was not parseable: ${cleanup.targetEventStartAt}`
    );
    return;
  }

  screenshots.calshowUrl = `calshow:${screenshots.calshowSeconds}`;
  const pathKey = phase === "before" ? "beforePath" : "afterPath";
  const availableKey = phase === "before" ? "beforeAvailable" : "afterAvailable";
  const openCommand = run(
    "xcrun",
    ["simctl", "openurl", simulatorUdid ?? "booted", screenshots.calshowUrl],
    { dryRun }
  );
  cleanup.commands[`calendarCleanup.${phase}.openCalendarApp`] = openCommand;
  sleep(Math.max(1000, waitMs ?? 1000));
  const screenshotCommand = run(
    "xcrun",
    ["simctl", "io", simulatorUdid ?? "booted", "screenshot", screenshots[pathKey]],
    { dryRun }
  );
  cleanup.commands[`calendarCleanup.${phase}.screenshot`] = screenshotCommand;
  screenshots[availableKey] =
    commandOk(openCommand) && commandOk(screenshotCommand);
}

async function seedCalendarCleanup({
  acceptanceFactSeed,
  conversationId,
  dryRun,
  enabled,
  outputDir,
  preferencesPlist,
  runStartedAt,
  seedRefresh,
  simulatorUdid,
  waitMs,
}) {
  const cleanup = emptyCalendarCleanupSeed({
    acceptanceFactSeed,
    conversationId,
    enabled,
    outputDir,
  });
  if (!enabled) {
    return cleanup;
  }
  if (dryRun) {
    cleanup.errors.push("dry-run does not cancel seed calendar events");
    return cleanup;
  }
  if (!acceptanceFactSeed?.enabled || !acceptanceFactSeed.available) {
    cleanup.errors.push("calendar cleanup seed requires acceptance fact seed");
    return cleanup;
  }
  if (!conversationId) {
    cleanup.errors.push("Native conversationId was not found; cleanup skipped.");
    return cleanup;
  }

  const calendarAction = calendarSeedActionFromAcceptanceSeed(acceptanceFactSeed);
  let targetEvent = calendarEventFromSeedAction(calendarAction);
  if (!targetEvent) {
    const found = await findSeedCalendarEvent({
      acceptanceFactSeed,
      conversationId,
      sourceActionId: calendarAction?.id,
    });
    if (found.request) {
      cleanup.commands.findTargetEvent = {
        command: `GET ${apiBaseUrl}/calendar/events?conversationId=${encodeURIComponent(
          conversationId
        )}`,
        ok: found.request.ok,
        status: found.request.status,
      };
    }
    targetEvent = found.event;
  }

  cleanup.targetEventId = targetEvent?.id ?? null;
  cleanup.targetEventStartAt = targetEvent?.startAt ?? null;
  cleanup.targetEventTitle = targetEvent?.title ?? null;
  cleanup.preCancelStatus = targetEvent?.status ?? null;
  if (!cleanup.targetEventId) {
    cleanup.errors.push("calendar cleanup seed target event was not found");
    return cleanup;
  }

  cleanup.preCancelStoredIdentifierPresent = preferenceKeyPresent(
    seedRefresh?.commands?.readAfterRefresh,
    calendarStoredIdentifierKey(cleanup.targetEventId)
  ) || diagnosticsContainCalendarId(
    seedRefresh?.systemDiagnostics,
    "calendar.storedEventBackendIds",
    cleanup.targetEventId
  );
  let latestPreCancelRefresh = seedRefresh;
  for (
    let attempt = 1;
    cleanup.preCancelStoredIdentifierPresent === false &&
    attempt <= cleanup.preCancelRefreshMaxAttempts;
    attempt += 1
  ) {
    latestPreCancelRefresh = refreshNativeSystemDiagnostics({
      dryRun,
      preferencesPlist,
      simulatorUdid,
      waitMs,
    });
    for (const [key, command] of Object.entries(latestPreCancelRefresh.commands)) {
      cleanup.commands[`preCancelRefresh${attempt}.${key}`] = command;
    }
    cleanup.preCancelStoredIdentifierPresent = preferenceKeyPresent(
      latestPreCancelRefresh.commands.readAfterRefresh,
      calendarStoredIdentifierKey(cleanup.targetEventId)
    ) || diagnosticsContainCalendarId(
      latestPreCancelRefresh.systemDiagnostics,
      "calendar.storedEventBackendIds",
      cleanup.targetEventId
    );
  }
  if (cleanup.preCancelStoredIdentifierPresent !== true) {
    cleanup.preCancelDiagnosticsUpdatedAt =
      latestPreCancelRefresh?.systemDiagnostics?.updatedAt ?? null;
    cleanup.preCancelDiagnosticsFresh = cleanup.preCancelDiagnosticsUpdatedAt
      ? isIsoAtOrAfter(cleanup.preCancelDiagnosticsUpdatedAt, runStartedAt)
      : null;
    if (cleanup.preCancelDiagnosticsFresh === false) {
      cleanup.errors.push(
        `calendar cleanup Native diagnostics were stale before cancel: updatedAt=${cleanup.preCancelDiagnosticsUpdatedAt}`
      );
    }
    cleanup.errors.push(
      `calendar cleanup seed target was not synced to EventKit before cancel: ${cleanup.targetEventId}`
    );
    return cleanup;
  }
  cleanup.preCancelDiagnosticsUpdatedAt =
    latestPreCancelRefresh?.systemDiagnostics?.updatedAt ?? null;
  cleanup.preCancelDiagnosticsFresh = cleanup.preCancelDiagnosticsUpdatedAt
    ? isIsoAtOrAfter(cleanup.preCancelDiagnosticsUpdatedAt, runStartedAt)
    : null;

  captureCalendarCleanupSystemScreenshot({
    cleanup,
    dryRun,
    phase: "before",
    simulatorUdid,
    waitMs,
  });

  const encodedConversationId = encodeURIComponent(conversationId);
  const cancelUrl = `${apiBaseUrl}/calendar/events/${encodeURIComponent(
    cleanup.targetEventId
  )}/cancel?conversationId=${encodedConversationId}`;
  const cancelCommand = run("curl", ["-fsS", "-X", "POST", cancelUrl]);
  const cancelPayload = parseJson(cancelCommand.stdout) ?? null;
  cleanup.commands.cancelTargetEvent = {
    command: `POST ${cancelUrl}`,
    ok: commandOk(cancelCommand),
    status: cancelCommand.status,
    stderr: cancelCommand.stderr,
    stdout: cancelCommand.stdout,
  };
  cleanup.canceledEvent = cancelPayload;
  cleanup.postCancelStatus = cancelPayload?.status ?? null;
  if (!commandOk(cancelCommand) || cancelPayload?.status !== "canceled") {
    cleanup.errors.push(`calendar cleanup seed cancel failed: ${cancelCommand.status}`);
  }

  return cleanup;
}

function finalizeCalendarCleanupSeed({
  cleanup,
  dryRun,
  preferencesPlist,
  refresh,
  simulatorUdid,
  waitMs,
}) {
  if (!cleanup.enabled || !cleanup.targetEventId) {
    return cleanup;
  }
  let latestPostCancelRefresh = refresh;
  const afterRead = refresh?.commands?.readAfterRefresh;
  cleanup.postCancelStoredIdentifierPresent = preferenceKeyPresent(
    afterRead,
    calendarStoredIdentifierKey(cleanup.targetEventId)
  );
  cleanup.removedEventIds = splitDiagnosticIds(
    refresh?.systemDiagnostics?.["calendar.removedEventIds"]
  );
  cleanup.postCancelRemovedEventIdPresent = cleanup.removedEventIds.includes(
    cleanup.targetEventId
  );
  for (
    let attempt = 1;
    cleanup.postCancelStatus === "canceled" &&
    (cleanup.postCancelStoredIdentifierPresent !== false ||
      cleanup.postCancelRemovedEventIdPresent !== true) &&
    attempt <= cleanup.postCancelRefreshMaxAttempts;
    attempt += 1
  ) {
    latestPostCancelRefresh = refreshNativeSystemDiagnostics({
      dryRun,
      preferencesPlist,
      simulatorUdid,
      waitMs,
    });
    for (const [key, command] of Object.entries(latestPostCancelRefresh.commands)) {
      cleanup.commands[`postCancelRefresh${attempt}.${key}`] = command;
    }
    const latestAfterRead = latestPostCancelRefresh.commands.readAfterRefresh;
    cleanup.postCancelStoredIdentifierPresent = preferenceKeyPresent(
      latestAfterRead,
      calendarStoredIdentifierKey(cleanup.targetEventId)
    );
    cleanup.removedEventIds = splitDiagnosticIds(
      latestPostCancelRefresh.systemDiagnostics?.["calendar.removedEventIds"]
    );
    cleanup.postCancelRemovedEventIdPresent = cleanup.removedEventIds.includes(
      cleanup.targetEventId
    );
  }
  cleanup.postCancelSystemDiagnostics =
    latestPostCancelRefresh?.systemDiagnostics ?? {};
  if (cleanup.postCancelStatus !== "canceled") {
    return cleanup;
  }
  captureCalendarCleanupSystemScreenshot({
    cleanup,
    dryRun,
    phase: "after",
    simulatorUdid,
    waitMs,
  });
  cleanup.available =
    cleanup.errors.length === 0 &&
    cleanup.preCancelStatus === "scheduled" &&
    cleanup.postCancelStatus === "canceled" &&
    cleanup.preCancelStoredIdentifierPresent === true &&
    cleanup.postCancelStoredIdentifierPresent === false &&
    cleanup.removedEventIds.includes(cleanup.targetEventId);
  return cleanup;
}

async function seedCalendarPermissionDenial({
  conversationId,
  dryRun,
  enabled,
  initialSystemDiagnostics,
  outputDir,
  preferencesPlist,
  simulatorUdid,
  waitMs,
}) {
  const seedRunId =
    process.env.AI_CODE_IOS_ACCEPTANCE_PERMISSION_DENIAL_RUN_ID ??
    defaultSeedRunId();
  const denial = emptyCalendarPermissionDenialSeed({
    conversationId,
    enabled,
    outputDir,
    seedRunId,
  });
  denial.preAuthorizationStatus =
    initialSystemDiagnostics?.["calendar.authorizationStatus"] ?? null;

  if (!enabled) {
    return { denial, refresh: { commands: {}, systemDiagnostics: {} } };
  }
  if (dryRun) {
    denial.errors.push("dry-run does not revoke simulator calendar permission");
    return { denial, refresh: { commands: {}, systemDiagnostics: {} } };
  }
  if (!conversationId) {
    denial.errors.push("Native conversationId was not found; permission denial skipped.");
    return { denial, refresh: { commands: {}, systemDiagnostics: {} } };
  }
  if (!simulatorUdid) {
    denial.errors.push("Simulator UDID was not found; permission denial skipped.");
    return { denial, refresh: { commands: {}, systemDiagnostics: {} } };
  }

  denial.commands.revokeCalendarPermission = run(
    "xcrun",
    ["simctl", "privacy", simulatorUdid, "revoke", "calendar", bundleId],
    { dryRun }
  );
  denial.commands.launchAfterPermissionRevoke = run(
    "xcrun",
    ["simctl", "launch", simulatorUdid, bundleId],
    { dryRun }
  );
  sleep(Math.max(1000, waitMs ?? 1000));

  const seeded = await seedSingleCalendarEvent({
    commandPrefix: "calendarPermissionDenial.calendar",
    conversationId,
    input: denial.seedInput,
    now: acceptanceSeedNow,
  });
  Object.assign(denial.commands, seeded.commands);
  denial.errors.push(...seeded.errors);
  denial.targetEventId = seeded.event?.id ?? null;
  denial.targetEventTitle = seeded.event?.title ?? null;
  denial.backendFactPersisted = seeded.ok && seeded.event?.status === "scheduled";

  let refresh = refreshNativeSystemDiagnostics({
    dryRun,
    preferencesPlist,
    simulatorUdid,
    waitMs,
  });
  denial.postAuthorizationStatus =
    refresh.systemDiagnostics["calendar.authorizationStatus"] ?? null;
  denial.nativeErrorReason =
    refresh.systemDiagnostics["calendar.lastError"] ?? null;

  denial.commands.screenshot = run(
    "xcrun",
    ["simctl", "io", simulatorUdid, "screenshot", denial.screenshotPath],
    { dryRun }
  );

  const wasPreviouslyGranted = ["authorized", "fullAccess"].includes(
    denial.preAuthorizationStatus ?? ""
  );
  denial.restoreAttempted = wasPreviouslyGranted;
  if (wasPreviouslyGranted) {
    denial.commands.restoreCalendarPermission = run(
      "xcrun",
      ["simctl", "privacy", simulatorUdid, "grant", "calendar", bundleId],
      { dryRun }
    );
  }

  denial.available = isCalendarPermissionDenialAvailable({
    backendFactPersisted: denial.backendFactPersisted,
    errors: denial.errors,
    nativeErrorReason: denial.nativeErrorReason,
    screenshotAvailable: commandOk(denial.commands.screenshot),
    systemDiagnostics: refresh.systemDiagnostics,
  });

  return { denial, refresh };
}

async function seedNotificationClickBackflow({
  conversationId,
  dryRun,
  enabled,
  outputDir,
  preferencesPlist,
  simulatorUdid,
  waitMs,
}) {
  const seedRunId =
    process.env.AI_CODE_IOS_ACCEPTANCE_NOTIFICATION_CLICK_RUN_ID ??
    defaultSeedRunId();
  const seedNow =
    process.env.AI_CODE_IOS_ACCEPTANCE_NOTIFICATION_CLICK_NOW ??
    shanghaiCurrentNow();
  const backflow = emptyNotificationClickBackflowSeed({
    conversationId,
    enabled,
    outputDir,
    seedNow,
    seedRunId,
  });
  if (!enabled) {
    return { backflow, refresh: { commands: {}, systemDiagnostics: {} } };
  }
  if (dryRun) {
    backflow.errors.push("dry-run does not seed reminder notification backflow");
    return { backflow, refresh: { commands: {}, systemDiagnostics: {} } };
  }
  if (!conversationId) {
    backflow.errors.push("Native conversationId was not found; notification backflow skipped.");
    return { backflow, refresh: { commands: {}, systemDiagnostics: {} } };
  }

  const seeded = await seedSingleReminder({
    commandPrefix: "notificationClickBackflow.reminder",
    conversationId,
    input: backflow.seedInput,
    now: backflow.seedNow,
  });
  Object.assign(backflow.commands, seeded.commands);
  backflow.errors.push(...seeded.errors);
  backflow.reminderId = seeded.reminder?.id ?? null;
  backflow.reminderTitle = seeded.reminder?.title ?? null;
  backflow.seedDueAt = seeded.reminder?.dueAt ?? null;
  if (!seeded.ok || !backflow.reminderId) {
    backflow.errors.push("notification backflow reminder seed failed");
    return { backflow, refresh: { commands: {}, systemDiagnostics: {} } };
  }

  let refresh = refreshNativeSystemDiagnostics({
    dryRun,
    preferencesPlist,
    simulatorUdid,
    waitMs,
  });
  Object.assign(
    backflow.commands,
    Object.fromEntries(
      Object.entries(refresh.commands).map(([key, command]) => [
        `nativeRefresh.${key}`,
        command,
      ])
    )
  );
  backflow.preOpenDiagnostics = refresh.systemDiagnostics;
  backflow.notificationIdentifier = `ai-code.reminder.${backflow.reminderId}`;
  backflow.pendingNotificationFound = splitDiagnosticIds(
    refresh.systemDiagnostics["notifications.pendingReminderIds"]
  ).includes(backflow.notificationIdentifier);
  for (
    let attempt = 1;
    backflow.pendingNotificationFound === false && attempt <= 3;
    attempt += 1
  ) {
    refresh = refreshNativeSystemDiagnostics({
      dryRun,
      preferencesPlist,
      simulatorUdid,
      waitMs,
    });
    for (const [key, command] of Object.entries(refresh.commands)) {
      backflow.commands[`nativeRefreshAttempt${attempt}.${key}`] = command;
    }
    backflow.preOpenDiagnostics = refresh.systemDiagnostics;
    backflow.pendingNotificationFound = splitDiagnosticIds(
      refresh.systemDiagnostics["notifications.pendingReminderIds"]
    ).includes(backflow.notificationIdentifier);
  }
  if (!backflow.pendingNotificationFound) {
    backflow.errors.push(
      `pending local notification not found: ${backflow.notificationIdentifier}`
    );
  }

  const screenshot = await collectNotificationClickBackflowScreenshot({
    conversationId,
    dryRun,
    outputDir,
    reminderId: backflow.reminderId,
    reminderTitle: backflow.reminderTitle,
  });
  backflow.commands.h5SyntheticOpen = {
    command: `Playwright ${h5NativeBaseUrl}/?native=ios&bridgeDebug=1&conversationId=${conversationId}`,
    status: screenshot.available ? 0 : 1,
    stdout: JSON.stringify({
      h5StatusText: screenshot.h5StatusText,
      highlightedReminderFound: screenshot.highlightedReminderFound,
    }),
    stderr: screenshot.errors.join("\n"),
  };
  backflow.errors.push(...screenshot.errors);
  backflow.bridgeInboundLabel = screenshot.bridgeInboundLabel;
  backflow.h5StatusText = screenshot.h5StatusText;
  backflow.highlightedReminderFound = screenshot.highlightedReminderFound;
  backflow.syntheticNativeMessage = screenshot.syntheticNativeMessage;
  backflow.available =
    backflow.errors.length === 0 &&
    backflow.pendingNotificationFound === true &&
    screenshot.available === true &&
    backflow.highlightedReminderFound === true &&
    backflow.h5StatusText === "已从系统通知打开提醒";

  return { backflow, refresh };
}

function millisecondsUntilNotificationDelivery(dueAt, waitAfterDueMs) {
  const dueTime = Date.parse(dueAt);
  if (!Number.isFinite(dueTime)) {
    return null;
  }
  return Math.max(0, dueTime - Date.now() + waitAfterDueMs);
}

async function seedNotificationDelivery({
  conversationId,
  dryRun,
  enabled,
  preferencesPlist,
  simulatorUdid,
  waitMs,
}) {
  const seedRunId =
    process.env.AI_CODE_IOS_ACCEPTANCE_NOTIFICATION_DELIVERY_RUN_ID ??
    defaultSeedRunId();
  const seedNow =
    process.env.AI_CODE_IOS_ACCEPTANCE_NOTIFICATION_DELIVERY_NOW ??
    shanghaiCurrentNow();
  const delivery = emptyNotificationDeliverySeed({
    conversationId,
    enabled,
    seedNow,
    seedRunId,
  });
  if (!enabled) {
    return { delivery, refresh: { commands: {}, systemDiagnostics: {} } };
  }
  if (dryRun) {
    delivery.errors.push("dry-run does not wait for notification delivery");
    return { delivery, refresh: { commands: {}, systemDiagnostics: {} } };
  }
  if (!conversationId) {
    delivery.errors.push("Native conversationId was not found; notification delivery skipped.");
    return { delivery, refresh: { commands: {}, systemDiagnostics: {} } };
  }
  if (!simulatorUdid) {
    delivery.errors.push("Simulator UDID was not found; notification delivery skipped.");
    return { delivery, refresh: { commands: {}, systemDiagnostics: {} } };
  }

  const seeded = await seedSingleReminder({
    commandPrefix: "notificationDelivery.reminder",
    conversationId,
    input: delivery.seedInput,
    now: delivery.seedNow,
  });
  Object.assign(delivery.commands, seeded.commands);
  delivery.errors.push(...seeded.errors);
  delivery.reminderId = seeded.reminder?.id ?? null;
  delivery.reminderTitle = seeded.reminder?.title ?? null;
  delivery.seedDueAt = seeded.reminder?.dueAt ?? null;
  if (!seeded.ok || !delivery.reminderId) {
    delivery.errors.push("notification delivery reminder seed failed");
    return { delivery, refresh: { commands: {}, systemDiagnostics: {} } };
  }

  let pendingRefresh = refreshNativeSystemDiagnostics({
    dryRun,
    preferencesPlist,
    simulatorUdid,
    waitMs,
  });
  Object.assign(
    delivery.commands,
    Object.fromEntries(
      Object.entries(pendingRefresh.commands).map(([key, command]) => [
        `pendingRefresh.${key}`,
        command,
      ])
    )
  );
  delivery.pendingDiagnostics = pendingRefresh.systemDiagnostics;
  delivery.notificationIdentifier = `ai-code.reminder.${delivery.reminderId}`;
  delivery.pendingNotificationFound = splitDiagnosticIds(
    pendingRefresh.systemDiagnostics["notifications.pendingReminderIds"]
  ).includes(delivery.notificationIdentifier);
  for (
    let attempt = 1;
    delivery.pendingNotificationFound === false &&
      attempt <= delivery.pendingRefreshMaxAttempts;
    attempt += 1
  ) {
    pendingRefresh = refreshNativeSystemDiagnostics({
      dryRun,
      preferencesPlist,
      simulatorUdid,
      waitMs,
    });
    for (const [key, command] of Object.entries(pendingRefresh.commands)) {
      delivery.commands[`pendingRefreshAttempt${attempt}.${key}`] = command;
    }
    delivery.pendingDiagnostics = pendingRefresh.systemDiagnostics;
    delivery.pendingNotificationFound = splitDiagnosticIds(
      pendingRefresh.systemDiagnostics["notifications.pendingReminderIds"]
    ).includes(delivery.notificationIdentifier);
  }
  if (!delivery.pendingNotificationFound) {
    delivery.errors.push(
      `pending local notification not found before delivery wait: ${delivery.notificationIdentifier}`
    );
  }

  delivery.waitUntilDueMs = millisecondsUntilNotificationDelivery(
    delivery.seedDueAt,
    delivery.waitAfterDueMs
  );
  if (delivery.waitUntilDueMs === null) {
    delivery.errors.push(`notification dueAt was not parseable: ${delivery.seedDueAt}`);
    return { delivery, refresh: pendingRefresh };
  }

  delivery.commands.terminateBeforeDeliveryWait = run(
    "xcrun",
    ["simctl", "terminate", simulatorUdid, bundleId],
    { dryRun }
  );
  sleep(delivery.waitUntilDueMs);
  delivery.commands.launchAfterDeliveryWait = run(
    "xcrun",
    ["simctl", "launch", simulatorUdid, bundleId],
    { dryRun }
  );
  sleep(Math.max(1000, waitMs ?? 1000));
  delivery.commands.readAfterDeliveryWait = readConversationIdFromPreferences(
    preferencesPlist,
    { dryRun }
  );
  let refresh = {
    commands: {
      launchAfterDeliveryWait: delivery.commands.launchAfterDeliveryWait,
      readAfterDeliveryWait: delivery.commands.readAfterDeliveryWait,
      terminateBeforeDeliveryWait: delivery.commands.terminateBeforeDeliveryWait,
    },
    systemDiagnostics: extractNativeSystemDiagnostics(
      delivery.commands.readAfterDeliveryWait
    ),
  };
  delivery.deliveredDiagnostics = refresh.systemDiagnostics;
  delivery.deliveredNotificationFound = splitDiagnosticIds(
    refresh.systemDiagnostics["notifications.deliveredReminderIds"]
  ).includes(delivery.notificationIdentifier);
  for (
    let attempt = 1;
    delivery.deliveredNotificationFound === false &&
      attempt <= delivery.deliveredRefreshMaxAttempts;
    attempt += 1
  ) {
    sleep(Math.max(1000, waitMs ?? 1000));
    const readAfterDeliveryPoll = readConversationIdFromPreferences(
      preferencesPlist,
      { dryRun }
    );
    delivery.commands[`deliveredRefreshAttempt${attempt}.readAfterDeliveryWait`] =
      readAfterDeliveryPoll;
    refresh = {
      commands: {
        ...refresh.commands,
        [`deliveredRefreshAttempt${attempt}.readAfterDeliveryWait`]:
          readAfterDeliveryPoll,
      },
      systemDiagnostics: extractNativeSystemDiagnostics(readAfterDeliveryPoll),
    };
    delivery.deliveredDiagnostics = refresh.systemDiagnostics;
    delivery.deliveredNotificationFound = splitDiagnosticIds(
      refresh.systemDiagnostics["notifications.deliveredReminderIds"]
    ).includes(delivery.notificationIdentifier);
  }
  if (!delivery.deliveredNotificationFound) {
    delivery.errors.push(
      `delivered local notification not found: ${delivery.notificationIdentifier}`
    );
  }

  delivery.available =
    delivery.errors.length === 0 &&
    delivery.pendingNotificationFound === true &&
    delivery.deliveredNotificationFound === true &&
    commandOk(delivery.commands.terminateBeforeDeliveryWait) &&
    commandOk(delivery.commands.launchAfterDeliveryWait) &&
    commandOk(delivery.commands.readAfterDeliveryWait);
  return { delivery, refresh };
}

function buildEmptyH5SurfaceScreenshots({ conversationId, outputDir, error }) {
  const screenshotDir = path.join(outputDir, "h5-surfaces");
  return {
    available: false,
    baseUrl: h5NativeBaseUrl,
    conversationId: conversationId ?? null,
    errorDiagnostics: {
      bodyTextPreview: null,
      htmlPath: path.join(screenshotDir, "h5-surface-error.html"),
      pageTitle: null,
      pageUrl: null,
      screenshotPath: path.join(screenshotDir, "h5-surface-error.png"),
    },
    screenshotDir,
    surfaces: Object.fromEntries(
      h5Surfaces.map((surface) => [
        surface,
        {
          captured: false,
          label: h5SurfaceLabels[surface],
          path: path.join(screenshotDir, `${surface}.png`),
        },
      ])
    ),
    errors: error ? [error] : [],
  };
}

async function collectH5SurfaceErrorDiagnostics({ empty, page }) {
  const diagnostics = { ...empty.errorDiagnostics };
  if (!page) {
    return diagnostics;
  }
  try {
    diagnostics.pageUrl = page.url();
  } catch {
    diagnostics.pageUrl = null;
  }
  try {
    diagnostics.pageTitle = await page.title();
  } catch {
    diagnostics.pageTitle = null;
  }
  try {
    diagnostics.bodyTextPreview = (
      await page.locator("body").innerText({ timeout: 1000 })
    ).slice(0, 1000);
  } catch {
    diagnostics.bodyTextPreview = null;
  }
  try {
    writeText(diagnostics.htmlPath, await page.content());
  } catch {
    // Best-effort diagnostic artifact only.
  }
  try {
    await page.screenshot({
      fullPage: true,
      path: diagnostics.screenshotPath,
    });
  } catch {
    // Best-effort diagnostic artifact only.
  }
  return diagnostics;
}

async function sendH5NativeMessage(page, type, payload) {
  await page.evaluate(
    ({ messagePayload, messageType }) => {
      window.dispatchEvent(
        new CustomEvent("ai-native-message", {
          detail: {
            id: `${messageType}-${Date.now()}`,
            payload: messagePayload,
            sentAt: new Date().toISOString(),
            type: messageType,
          },
        })
      );
    },
    { messagePayload: payload, messageType: type }
  );
}

async function collectH5SurfaceScreenshots({ conversationId, dryRun, outputDir }) {
  const empty = buildEmptyH5SurfaceScreenshots({
    conversationId,
    outputDir,
  });
  if (dryRun) {
    return empty;
  }
  if (!conversationId) {
    return buildEmptyH5SurfaceScreenshots({
      conversationId,
      outputDir,
      error: "Native conversationId was not found; H5 screenshots skipped.",
    });
  }

  ensureDir(empty.screenshotDir);
  let browser;
  let page;
  try {
    const { chromium, expect } = await import("@playwright/test");
    browser = await chromium.launch();
    page = await browser.newPage({ viewport: { height: 844, width: 390 } });
    await page.addInitScript(() => {
      window.__AI_NATIVE_MESSAGES__ = [];
      window.__AI_NATIVE_HOST__ = {
        bridgeVersion: "ios-acceptance-evidence",
        platform: "ios",
      };
      window.webkit = {
        messageHandlers: {
          NativeBridge: {
            postMessage(message) {
              window.__AI_NATIVE_MESSAGES__.push(message);
            },
          },
        },
      };
    });

    await page.goto(
      `${h5NativeBaseUrl}/?native=ios&bridgeDebug=1&conversationId=${encodeURIComponent(
        conversationId
      )}`,
      { waitUntil: "domcontentloaded" }
    );
    const surfaceRegion = page.getByLabel("后端元素渲染区");
    await expect(surfaceRegion).toContainText("AI 时间管理 Agent", {
      timeout: 15000,
    });
    await sendH5NativeMessage(page, "native.hostContext", {
      bridgeVersion: "ios-acceptance-evidence",
      h5URL: page.url(),
      platform: "ios",
    });
    await page.waitForTimeout(1000);

    const surfaces = {};
    for (const surface of h5Surfaces) {
      const screenshotPath = path.join(empty.screenshotDir, `${surface}.png`);
      await sendH5NativeMessage(page, "native.viewChanged", {
        source: "ios-acceptance-evidence",
        view: surface,
      });
      await expect(surfaceRegion).toContainText(h5SurfaceLabels[surface], {
        timeout: 10000,
      });
      await page.waitForTimeout(500);
      await page.screenshot({ fullPage: true, path: screenshotPath });
      surfaces[surface] = {
        captured: true,
        label: h5SurfaceLabels[surface],
        path: screenshotPath,
      };
    }

    return {
      ...empty,
      available: Object.values(surfaces).some((surface) => surface.captured),
      surfaces,
    };
  } catch (error) {
    const failed = buildEmptyH5SurfaceScreenshots({
      conversationId,
      outputDir,
      error: error instanceof Error ? error.message : String(error),
    });
    failed.errorDiagnostics = await collectH5SurfaceErrorDiagnostics({
      empty: failed,
      page,
    });
    return failed;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function collectNotificationClickBackflowScreenshot({
  conversationId,
  dryRun,
  outputDir,
  reminderId,
  reminderTitle,
}) {
  const screenshotPath = path.join(outputDir, "notification-click-backflow.png");
  const result = {
    available: false,
    bridgeInboundLabel: null,
    errors: [],
    h5StatusText: null,
    highlightedReminderFound: false,
    screenshotPath,
    syntheticNativeMessage: null,
  };

  if (dryRun) {
    result.errors.push("dry-run does not capture H5 notification backflow screenshot");
    return result;
  }
  if (!conversationId) {
    result.errors.push("Native conversationId was not found; notification backflow skipped.");
    return result;
  }
  if (!reminderId) {
    result.errors.push("Reminder id was not found; notification backflow skipped.");
    return result;
  }

  let browser;
  try {
    const { chromium, expect } = await import("@playwright/test");
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { height: 844, width: 390 } });
    await page.addInitScript(() => {
      window.__AI_NATIVE_MESSAGES__ = [];
      window.__AI_NATIVE_HOST__ = {
        bridgeVersion: "ios-acceptance-evidence",
        platform: "ios",
      };
      window.webkit = {
        messageHandlers: {
          NativeBridge: {
            postMessage(message) {
              window.__AI_NATIVE_MESSAGES__.push(message);
            },
          },
        },
      };
    });

    await page.goto(
      `${h5NativeBaseUrl}/?native=ios&bridgeDebug=1&conversationId=${encodeURIComponent(
        conversationId
      )}`,
      { waitUntil: "domcontentloaded" }
    );
    const surfaceRegion = page.getByLabel("后端元素渲染区");
    await expect(surfaceRegion).toContainText("AI 时间管理 Agent", {
      timeout: 15000,
    });
    await sendH5NativeMessage(page, "native.hostContext", {
      bridgeVersion: "ios-acceptance-evidence",
      h5URL: page.url(),
      platform: "ios",
    });
    await page.waitForTimeout(1000);

    const syntheticNativeMessage = {
      reminderId,
      source: "native.notifications.reminders.opened",
      view: "reminders",
    };
    await sendH5NativeMessage(
      page,
      "native.viewChanged",
      syntheticNativeMessage
    );
    await expect(surfaceRegion).toContainText("提醒", {
      timeout: 10000,
    });
    await expect(page.locator("body")).toContainText("已从系统通知打开提醒", {
      timeout: 10000,
    });
    const highlighted = page.locator('[data-highlighted-summary-item="true"]');
    await expect(highlighted).toHaveCount(1, { timeout: 10000 });
    if (reminderTitle) {
      await expect(highlighted.first()).toContainText(reminderTitle, {
        timeout: 10000,
      });
    }
    await highlighted.first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ fullPage: true, path: screenshotPath });

    result.available = true;
    result.bridgeInboundLabel =
      `native.viewChanged · source=${syntheticNativeMessage.source} · view=reminders · reminderId=${reminderId}`;
    result.h5StatusText = "已从系统通知打开提醒";
    result.highlightedReminderFound = true;
    result.syntheticNativeMessage = syntheticNativeMessage;
    return result;
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
    return result;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function seedNativeKeyboardInput({
  conversationId,
  dryRun,
  enabled,
  outputDir,
}) {
  const seedRunId =
    process.env.AI_CODE_IOS_ACCEPTANCE_KEYBOARD_INPUT_RUN_ID ??
    defaultSeedRunId();
  const keyboard = emptyNativeKeyboardInputSeed({
    conversationId,
    enabled,
    outputDir,
    seedRunId,
  });
  if (!enabled) {
    return keyboard;
  }
  if (dryRun) {
    keyboard.errors.push("dry-run does not submit H5 synthetic native keyboard input");
    return keyboard;
  }
  if (!conversationId) {
    keyboard.errors.push("Native conversationId was not found; keyboard input seed skipped.");
    return keyboard;
  }

  let browser;
  try {
    const { chromium, expect } = await import("@playwright/test");
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { height: 844, width: 390 } });
    await page.addInitScript(() => {
      window.__AI_NATIVE_MESSAGES__ = [];
      window.__AI_NATIVE_HOST__ = {
        bridgeVersion: "ios-acceptance-keyboard-input",
        platform: "ios",
      };
      window.webkit = {
        messageHandlers: {
          NativeBridge: {
            postMessage(message) {
              window.__AI_NATIVE_MESSAGES__.push(message);
            },
          },
        },
      };
    });

    const url = `${h5NativeBaseUrl}/?native=ios&bridgeDebug=1&conversationId=${encodeURIComponent(
      conversationId
    )}`;
    await page.goto(url, { waitUntil: "domcontentloaded" });
    const surfaceRegion = page.getByLabel("后端元素渲染区");
    await expect(surfaceRegion).toContainText("AI 时间管理 Agent", {
      timeout: 15000,
    });
    await sendH5NativeMessage(page, "native.hostContext", {
      bridgeVersion: "ios-acceptance-keyboard-input",
      h5URL: page.url(),
      platform: "ios",
    });
    await page.waitForTimeout(1000);

    keyboard.syntheticNativeMessage = {
      source: keyboard.source,
      text: keyboard.seedInput,
      view: "conversation",
    };
    await sendH5NativeMessage(
      page,
      "native.inputSubmitted",
      keyboard.syntheticNativeMessage
    );
    keyboard.bridgeInboundLabel =
      `native.inputSubmitted · source=${keyboard.source} · view=conversation`;
    await expect(surfaceRegion).toContainText(keyboard.seedInput, {
      timeout: 10000,
    });
    await expect(surfaceRegion).toContainText("确认", { timeout: 20000 });
    keyboard.confirmationCardFound = true;

    await page.getByRole("button", { name: "确认" }).last().click();
    await expect(page.locator("body")).toContainText(
      "已确认执行，数据库视图和执行记录已刷新",
      { timeout: 20000 }
    );

    const remindersUrl = `${apiBaseUrl}/reminders?conversationId=${encodeURIComponent(
      conversationId
    )}`;
    const reminders = await getJson(remindersUrl);
    keyboard.commands.queryReminders = {
      command: `GET ${remindersUrl}`,
      ok: reminders.ok,
      status: reminders.status,
    };
    const reminderList = Array.isArray(reminders.payload)
      ? reminders.payload
      : Array.isArray(reminders.payload?.reminders)
        ? reminders.payload.reminders
        : [];
    const targetReminder = reminderList.find(
      (reminder) =>
        typeof reminder.title === "string" &&
        reminder.title.includes(seedRunId) &&
        reminder.status === "scheduled"
    );
    keyboard.reminderId = targetReminder?.id ?? null;
    keyboard.reminderTitle = targetReminder?.title ?? null;

    await sendH5NativeMessage(page, "native.viewChanged", {
      source: "ios-acceptance-keyboard-input",
      view: "reminders",
    });
    await expect(surfaceRegion).toContainText("提醒", { timeout: 10000 });
    await expect(page.locator("body")).toContainText(seedRunId, {
      timeout: 10000,
    });
    await page.screenshot({ fullPage: true, path: keyboard.screenshotPath });
    keyboard.commands.h5SyntheticKeyboardInput = {
      command: `Playwright ${url} + native.inputSubmitted source=${keyboard.source}`,
      ok: true,
      status: 0,
    };
    keyboard.available =
      keyboard.errors.length === 0 &&
      keyboard.confirmationCardFound === true &&
      Boolean(keyboard.reminderId);
    if (!keyboard.reminderId) {
      keyboard.errors.push("keyboard input seed reminder was not found after confirmation");
    }
    return keyboard;
  } catch (error) {
    keyboard.errors.push(error instanceof Error ? error.message : String(error));
    return keyboard;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function seedNativeAttachmentInputs({
  conversationId,
  dryRun,
  enabled,
  outputDir,
}) {
  const seedRunId =
    process.env.AI_CODE_IOS_ACCEPTANCE_ATTACHMENT_INPUTS_RUN_ID ??
    defaultSeedRunId();
  const attachmentInputs = emptyNativeAttachmentInputsSeed({
    conversationId,
    enabled,
    outputDir,
    seedRunId,
  });
  if (!enabled) {
    return attachmentInputs;
  }
  if (dryRun) {
    attachmentInputs.errors.push("dry-run does not submit H5 synthetic native attachment inputs");
    return attachmentInputs;
  }
  if (!conversationId) {
    attachmentInputs.errors.push("Native conversationId was not found; attachment input seed skipped.");
    return attachmentInputs;
  }

  const samples = buildNativeAttachmentSamples(seedRunId);
  let browser;
  try {
    const { chromium, expect } = await import("@playwright/test");
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { height: 844, width: 390 } });
    await page.addInitScript(() => {
      window.__AI_NATIVE_MESSAGES__ = [];
      window.__AI_NATIVE_HOST__ = {
        bridgeVersion: "ios-acceptance-attachment-inputs",
        platform: "ios",
      };
      window.webkit = {
        messageHandlers: {
          NativeBridge: {
            postMessage(message) {
              window.__AI_NATIVE_MESSAGES__.push(message);
            },
          },
        },
      };
    });

    const url = `${h5NativeBaseUrl}/?native=ios&bridgeDebug=1&conversationId=${encodeURIComponent(
      conversationId
    )}`;
    await page.goto(url, { waitUntil: "domcontentloaded" });
    const surfaceRegion = page.getByLabel("后端元素渲染区");
    await expect(surfaceRegion).toContainText("AI 时间管理 Agent", {
      timeout: 15000,
    });
    await sendH5NativeMessage(page, "native.hostContext", {
      bridgeVersion: "ios-acceptance-attachment-inputs",
      h5URL: page.url(),
      platform: "ios",
    });
    await page.waitForTimeout(1000);

    for (const sample of samples) {
      await sendH5NativeMessage(page, "native.inputSubmitted", {
        attachmentId: sample.attachmentId,
        attachmentKind: sample.attachmentKind,
        attachmentName: sample.attachmentName,
        attachmentSizeBytes: String(sample.attachmentSizeBytes),
        attachmentType: sample.attachmentType,
        base64Content: sample.base64Content,
        inputKind: "attachment",
        source: sample.source,
        text: sample.text,
        view: "conversation",
      });
      await expect(surfaceRegion).toContainText(sample.attachmentName, {
        timeout: 15000,
      });
      await expect(page.locator("body")).toContainText("已接收附件", {
        timeout: 15000,
      });
    }

    const attachmentsUrl = `${apiBaseUrl}/attachments?conversationId=${encodeURIComponent(
      conversationId
    )}&limit=20`;
    const attachments = await getJson(attachmentsUrl);
    attachmentInputs.commands.queryAttachments = {
      command: `GET ${attachmentsUrl}`,
      ok: attachments.ok,
      status: attachments.status,
    };
    const attachmentList = Array.isArray(attachments.payload)
      ? attachments.payload
      : Array.isArray(attachments.payload?.attachments)
        ? attachments.payload.attachments
        : [];
    attachmentInputs.samples = samples.map((sample) => {
      const attachment = attachmentList.find(
        (candidate) => candidate.attachmentId === sample.attachmentId
      );
      return evidenceAttachmentSample(sample, attachment);
    });
    const missing = attachmentInputs.samples.filter(
      (sample) => !sample.backendAttachmentId
    );
    if (missing.length > 0) {
      attachmentInputs.errors.push(
        `attachment input seeds were not found after submission: ${missing
          .map((sample) => sample.attachmentId)
          .join(", ")}`
      );
    }

    await page.screenshot({
      fullPage: true,
      path: attachmentInputs.screenshotPath,
    });
    attachmentInputs.commands.h5SyntheticAttachmentInputs = {
      command: `Playwright ${url} + native.inputSubmitted inputKind=attachment`,
      ok: true,
      status: 0,
    };
    attachmentInputs.available =
      attachmentInputs.errors.length === 0 &&
      attachmentInputs.samples.length === samples.length &&
      attachmentInputs.samples.every((sample) => sample.backendAttachmentId);
    return attachmentInputs;
  } catch (error) {
    attachmentInputs.errors.push(error instanceof Error ? error.message : String(error));
    return attachmentInputs;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function readConversationIdFromPreferences(preferencesPlist, { dryRun }) {
  if (dryRun) {
    return {
      command: `plutil -convert json -o - ${preferencesPlist}`,
      status: 0,
      stdout: JSON.stringify({
        [nativeConversationIdStorageKey]: `${nativeConversationIdPrefix}dryrun`,
      }),
      stderr: "",
    };
  }
  if (!fs.existsSync(preferencesPlist)) {
    return {
      command: `plutil -convert json -o - ${preferencesPlist}`,
      status: 1,
      stdout: "",
      stderr: `Preferences plist not found at ${preferencesPlist}`,
    };
  }

  return run("plutil", ["-convert", "json", "-o", "-", preferencesPlist]);
}

function extractConversationId(commandResult) {
  const json = parseJson(commandResult.stdout);
  const value = json?.[nativeConversationIdStorageKey];
  return typeof value === "string" && value.startsWith(nativeConversationIdPrefix)
    ? value
    : null;
}

function extractNativeSystemDiagnostics(commandResult) {
  const json = parseJson(commandResult.stdout);
  const diagnostics = json?.[nativeSystemDiagnosticsStorageKey];
  if (!diagnostics || typeof diagnostics !== "object" || Array.isArray(diagnostics)) {
    return {};
  }

  const ignoredGenericKeys = new Set([
    "inputEventCount",
    "lastError",
    "scheduledCount",
    "skippedCount",
    "source",
    "status",
    "syncedCount",
  ]);

  return Object.fromEntries(
    Object.entries(diagnostics)
      .filter(([key]) => !ignoredGenericKeys.has(key))
      .filter(([, value]) => value !== null && value !== undefined)
      .map(([key, value]) => [key, String(value)])
  );
}

function refreshNativeSystemDiagnostics({
  dryRun,
  preferencesPlist,
  simulatorUdid,
  waitMs,
}) {
  const commands = {};
  const result = {
    commands,
    systemDiagnostics: {},
  };
  if (dryRun || !simulatorUdid || !preferencesPlist) {
    return result;
  }

  commands.refreshTerminate = run(
    "xcrun",
    ["simctl", "terminate", simulatorUdid, bundleId],
    { dryRun }
  );
  commands.refreshLaunch = run(
    "xcrun",
    ["simctl", "launch", simulatorUdid, bundleId],
    { dryRun }
  );
  sleep(Math.max(1000, waitMs ?? 1000));
  commands.readAfterRefresh = readConversationIdFromPreferences(preferencesPlist, {
    dryRun,
  });
  result.systemDiagnostics = extractNativeSystemDiagnostics(
    commands.readAfterRefresh
  );
  return result;
}

function prepareCalendarAccessForSystemEvidence({
  captureCalendarSystemApp,
  dryRun,
  seedCalendarCleanup,
  simulatorUdid,
  waitMs,
}) {
  const requiredFor = [
    ...(captureCalendarSystemApp ? ["system_calendar_app_screenshot"] : []),
    ...(seedCalendarCleanup ? ["calendar_cleanup_seed"] : []),
  ];
  const commands = {};
  const result = {
    available: false,
    commands,
    enabled: requiredFor.length > 0,
    errors: [],
    requiredFor,
  };

  if (!result.enabled) {
    return result;
  }

  if (!simulatorUdid && !dryRun) {
    result.errors.push("Simulator UDID was not found; calendar access grant skipped.");
    return result;
  }

  commands.grantCalendar = run(
    "xcrun",
    [
      "simctl",
      "privacy",
      simulatorUdid ?? "<simulator>",
      "grant",
      "calendar",
      bundleId,
    ],
    { dryRun }
  );
  commands.launchAfterGrant = run(
    "xcrun",
    ["simctl", "launch", simulatorUdid ?? "booted", bundleId],
    { dryRun }
  );
  if (!dryRun) {
    sleep(Math.max(1000, waitMs ?? 1000));
  }

  result.available =
    commandOk(commands.grantCalendar) && commandOk(commands.launchAfterGrant);
  if (!result.available) {
    result.errors.push("calendar access grant failed before system evidence seeding");
  }

  return result;
}

function collectConversationPersistence({ dryRun, simulatorUdid, postRelaunchDelayMs }) {
  const commands = {};
  const result = {
    afterRelaunch: null,
    beforeRelaunch: null,
    dataContainer: null,
    expectedPrefix: nativeConversationIdPrefix,
    preferencesPlist: null,
    stableAcrossRelaunch: null,
    storageKey: nativeConversationIdStorageKey,
    commands,
  };

  if (!simulatorUdid && !dryRun) {
    return result;
  }

  commands.dataContainer = run(
    "xcrun",
    ["simctl", "get_app_container", simulatorUdid ?? "booted", bundleId, "data"],
    { dryRun }
  );
  if (!commandOk(commands.dataContainer) && !dryRun) {
    return result;
  }

  const dataContainer = commands.dataContainer.stdout.trim();
  result.dataContainer = dataContainer;
  const preferencesPlist = dryRun
    ? path.join("<data-container>", "Library", "Preferences", `${bundleId}.plist`)
    : path.join(dataContainer, "Library", "Preferences", `${bundleId}.plist`);
  result.preferencesPlist = preferencesPlist;

  if (dryRun) {
    commands.readBeforeRelaunch = readConversationIdFromPreferences(
      preferencesPlist,
      { dryRun }
    );
    commands.relaunchTerminate = run(
      "xcrun",
      ["simctl", "terminate", simulatorUdid ?? "booted", bundleId],
      { dryRun }
    );
    commands.relaunchLaunch = run(
      "xcrun",
      ["simctl", "launch", simulatorUdid ?? "booted", bundleId],
      { dryRun }
    );
    commands.readAfterRelaunch = readConversationIdFromPreferences(
      preferencesPlist,
      { dryRun }
    );
    return result;
  }

  commands.readBeforeRelaunch = readConversationIdFromPreferences(preferencesPlist, {
    dryRun,
  });
  result.beforeRelaunch = extractConversationId(commands.readBeforeRelaunch);

  commands.relaunchTerminate = run(
    "xcrun",
    ["simctl", "terminate", simulatorUdid ?? "booted", bundleId],
    { dryRun }
  );
  commands.relaunchLaunch = run(
    "xcrun",
    ["simctl", "launch", simulatorUdid ?? "booted", bundleId],
    { dryRun }
  );
  if (!dryRun) {
    sleep(Math.max(1000, postRelaunchDelayMs ?? 1000));
  }

  commands.readAfterRelaunch = readConversationIdFromPreferences(preferencesPlist, {
    dryRun,
  });
  result.afterRelaunch = extractConversationId(commands.readAfterRelaunch);
  result.stableAcrossRelaunch =
    result.beforeRelaunch !== null &&
    result.beforeRelaunch === result.afterRelaunch;

  return result;
}

function collectBuildAndLaunch({
  dryRun,
  outputDir,
  resetApp,
  skipBuild,
  screenshotDelayMs,
}) {
  const commands = {};
  const absoluteAppPath = path.resolve(rootDir, appPath);
  if (!skipBuild) {
    commands.iosBuild = run("pnpm", ["validate:ios-build"], { dryRun });
  }
  commands.simulatorSmoke = run("pnpm", ["validate:ios-simulator-smoke"], {
    dryRun,
    spawnOptions: {
      env: {
        ...process.env,
        AI_CODE_IOS_SIMULATOR_SKIP_BUILD: "1",
        AI_CODE_IOS_SIMULATOR_KEEP_BOOTED: "1",
        AI_CODE_IOS_SIMULATOR_KEEP_APP_RUNNING: "1",
      },
    },
  });

  const smokeOutput = `${commands.simulatorSmoke.stdout}\n${commands.simulatorSmoke.stderr}`;
  const simulatorMatch = smokeOutput.match(/Using simulator: .+ \(([^,]+),/);
  const appContainerMatch = smokeOutput.match(/App container: (.+)/);
  const simulatorUdid = simulatorMatch?.[1] ?? null;
  const appContainer = appContainerMatch?.[1]?.trim() ?? null;

  if (resetApp && simulatorUdid) {
    commands.resetTerminate = run(
      "xcrun",
      ["simctl", "terminate", simulatorUdid, bundleId],
      { dryRun }
    );
    commands.resetUninstall = run(
      "xcrun",
      ["simctl", "uninstall", simulatorUdid, bundleId],
      { dryRun }
    );
    commands.resetInstall = run(
      "xcrun",
      ["simctl", "install", simulatorUdid, absoluteAppPath],
      { dryRun }
    );
    commands.resetLaunch = run(
      "xcrun",
      ["simctl", "launch", simulatorUdid, bundleId],
      { dryRun }
    );
  }

  const infoPlist = path.join(absoluteAppPath, "Info.plist");
  commands.h5DevServerUrl = dryRun || fs.existsSync(infoPlist)
    ? run("plutil", ["-extract", "H5DevServerURL", "raw", "-o", "-", infoPlist], {
        dryRun,
      })
    : {
        command: `plutil -extract H5DevServerURL raw -o - ${infoPlist}`,
        status: 1,
        stdout: "",
        stderr: `Info.plist not found at ${infoPlist}`,
      };
  const h5DevServerUrl = commands.h5DevServerUrl.stdout.trim();
  const h5DevServerTarget = checkH5TargetDocument({
    dryRun,
    url: h5DevServerUrl,
  });
  commands.h5DevServerDocument = h5DevServerTarget.command;

  const screenshotPath = path.join(outputDir, "simulator-launch.png");
  if (!dryRun) {
    sleep(screenshotDelayMs);
  }
  if (simulatorUdid || dryRun) {
    commands.simulatorScreenshot = run(
      "xcrun",
      ["simctl", "io", simulatorUdid ?? "booted", "screenshot", screenshotPath],
      { dryRun }
    );
  } else {
    commands.simulatorScreenshot = {
      command: "xcrun simctl io <simulator> screenshot simulator-launch.png",
      status: 1,
      stdout: "",
      stderr: "Simulator UDID was not found in simulator smoke output.",
    };
  }

  const conversationPersistence = collectConversationPersistence({
    dryRun,
    postRelaunchDelayMs: screenshotDelayMs,
    simulatorUdid,
  });
  const systemDiagnostics = dryRun
    ? {}
    : extractNativeSystemDiagnostics(
        conversationPersistence.commands.readAfterRelaunch ??
          conversationPersistence.commands.readBeforeRelaunch ??
          { stdout: "" }
      );

  return {
    appPath: absoluteAppPath,
    bundleId,
    resetApp,
    simulatorUdid,
    appContainer,
    h5DevServerTargetMarkerFound: h5DevServerTarget.markerFound,
    h5DevServerTargetUrl: h5DevServerTarget.url,
    h5DevServerUrl,
    screenshotPath,
    screenshotDelayMs,
    conversationPersistence: {
      ...conversationPersistence,
      commands: compactCommands(conversationPersistence.commands),
    },
    systemDiagnostics,
    commands,
  };
}

function collectChecklistShape() {
  const checklistPath = path.join(rootDir, "docs", "qa", "ios-v1-system-acceptance.md");
  const content = fs.readFileSync(checklistPath, "utf8");
  return {
    path: "docs/qa/ios-v1-system-acceptance.md",
    containsManualWarning: content.includes("不能由自动 smoke 替代"),
    requiredItemsPresent: manualEvidenceStillRequired.filter((item) =>
      content.includes(item)
    ),
    guideItemsPresent: Object.keys(manualEvidenceGuides).filter((item) =>
      content.includes(item)
    ),
  };
}

function buildManifest(evidence) {
  const manualItems = evidence.manualEvidenceStillRequired.map((item) => {
    const supportingEvidenceSignals = supportingSignalsForManualItem(item, evidence);
    return {
      item,
      automationEvidence: ["acceptance-evidence.json"],
      supportingEvidenceSignals,
      manualEvidenceRequired: true,
      manualEvidenceExpected: ["截图或录屏", "bridge/debug 或后端接口摘要"],
      automationCanReplaceManualAcceptance: false,
      status:
        supportingEvidenceSignals.length > 0
          ? "supporting_evidence_collected"
          : "manual_required",
    };
  });

  return {
    schemaVersion: 1,
    generatedAt: evidence.generatedAt,
    repoRoot: rootDir,
    branch: evidence.git.branch,
    headSha: evidence.git.commit,
    acceptanceVerdict: "not_evaluated",
    manualAcceptanceRequired: true,
    manualEvidenceRecordTemplate: "manual-evidence-record.template.json",
    manualEvidenceRecordDraft: "manual-evidence-record.draft.json",
    automationCanReplaceManualAcceptance: false,
    notCoveredByAutomation: evidence.manualEvidenceStillRequired,
    items: [
      {
        item: "H5 地址覆盖",
        automationEvidence: ["acceptance-evidence.json", "summary.md"],
        manualEvidenceRequired: true,
        manualEvidenceExpected: ["App 启动截图", "真机局域网地址截图"],
        automationCanReplaceManualAcceptance: false,
        status: "supporting_evidence_collected",
      },
      ...manualItems,
    ],
  };
}

function supportingSignalsForManualItem(item, evidence) {
  if (
    item === "会话持久 ID" &&
    evidence.ios.conversationPersistence.stableAcrossRelaunch === true
  ) {
    return [
      `Native UserDefaults ${evidence.ios.conversationPersistence.storageKey} 重启前后保持一致`,
      `conversationId=${evidence.ios.conversationPersistence.beforeRelaunch}`,
    ];
  }

  if (item === "后端事实确认" && evidence.backendFactSnapshot.available) {
    const counts = evidence.backendFactSnapshot.counts;
    const signals = [
      `同会话后端读模型可查询：calendar=${counts.calendarEvents}, reminders=${counts.reminders}, expenses=${counts.expenses}, ledger=${counts.executionLedger}, turns=${counts.turns}`,
    ];
    if (evidence.h5SurfaceScreenshots?.available) {
      const captured = Object.entries(evidence.h5SurfaceScreenshots.surfaces)
        .filter(([, surface]) => surface.captured)
        .map(([surface]) => surface)
        .join(", ");
      signals.push(`H5 同会话页面截图已采集：${captured}`);
    }
    if (evidence.acceptanceFactSeed?.available) {
      signals.push("验收事实种子已通过真实 Agent 确认流写入日程、费用和提醒");
    }
    return signals;
  }

  if (item === "系统日历取消清理" && evidence.calendarCleanupSeed?.available) {
    return [
      `seed 日程已取消：eventId=${evidence.calendarCleanupSeed.targetEventId}`,
      `取消前 UserDefaults 存在 EventKit 标识符=${String(evidence.calendarCleanupSeed.preCancelStoredIdentifierPresent)}`,
      `取消后 UserDefaults 存在 EventKit 标识符=${String(evidence.calendarCleanupSeed.postCancelStoredIdentifierPresent)}`,
      `calendar.removedEventIds=${evidence.calendarCleanupSeed.removedEventIds.join(",")}`,
    ];
  }

  if (item === "系统同步降级" && evidence.calendarPermissionDenialSeed?.available) {
    return [
      `日历权限被撤销后后端事实仍保留：eventId=${evidence.calendarPermissionDenialSeed.targetEventId}`,
      `calendar.authorizationStatus=${evidence.calendarPermissionDenialSeed.postAuthorizationStatus}`,
      `calendar.lastSyncStatus=${evidence.ios.systemDiagnostics["calendar.lastSyncStatus"] ?? "unknown"}`,
      `calendar.lastError=${evidence.calendarPermissionDenialSeed.nativeErrorReason}`,
      `H5 预期降级文案包含：${evidence.calendarPermissionDenialSeed.h5StatusExpectation}`,
    ];
  }

  if (item === "本地通知" && evidence.ios.systemDiagnostics["notifications.authorizationStatus"]) {
    return [
      `通知权限状态=${evidence.ios.systemDiagnostics["notifications.authorizationStatus"]}`,
      `pendingReminderCount=${evidence.ios.systemDiagnostics["notifications.pendingReminderCount"] ?? "unknown"}`,
      ...(evidence.notificationDelivery?.available
        ? [
            `目标提醒已进入 delivered notification 诊断：${evidence.notificationDelivery.notificationIdentifier}`,
            `mode=${evidence.notificationDelivery.mode}, supportingOnly=${String(evidence.notificationDelivery.supportingOnly)}`,
          ]
        : []),
    ];
  }

  if (
    item === "通知点击回流" &&
    evidence.notificationClickBackflow?.available
  ) {
    return [
      `pending notification exists：${evidence.notificationClickBackflow.notificationIdentifier}`,
      `H5 synthetic native.viewChanged 已打开提醒页并高亮 reminderId=${evidence.notificationClickBackflow.reminderId}`,
      `mode=${evidence.notificationClickBackflow.mode}, supportingOnly=${String(evidence.notificationClickBackflow.supportingOnly)}`,
    ];
  }

  if (item === "键盘输入" && evidence.nativeKeyboardInput?.available) {
    return [
      `H5 已接收 native.inputSubmitted：source=${evidence.nativeKeyboardInput.source}`,
      `键盘输入 seed 已经确认写入提醒：reminderId=${evidence.nativeKeyboardInput.reminderId}`,
      `mode=${evidence.nativeKeyboardInput.mode}, supportingOnly=${String(evidence.nativeKeyboardInput.supportingOnly)}`,
    ];
  }

  const attachmentItemIds = {
    "PDF 文本提取": "pdf_text_extraction",
    文件附件: "file_attachment",
    照片附件: "photo_attachment",
  };
  const attachmentItemId = attachmentItemIds[item];
  const attachmentSample = evidence.nativeAttachmentInputs?.samples?.find(
    (sample) => sample.itemId === attachmentItemId
  );
  if (attachmentSample && evidence.nativeAttachmentInputs?.available) {
    return [
      `H5 已接收 native.inputSubmitted 附件：source=${attachmentSample.source}`,
      `附件 seed 已写入后端：attachmentId=${attachmentSample.attachmentId}, backendId=${attachmentSample.backendAttachmentId}`,
      `mode=${evidence.nativeAttachmentInputs.mode}, supportingOnly=${String(evidence.nativeAttachmentInputs.supportingOnly)}`,
    ];
  }

  if (
    item === "系统日历写入" &&
    evidence.ios.systemDiagnostics["calendar.authorizationStatus"]
  ) {
    const foundStoredEventCount = Number(
      evidence.ios.systemDiagnostics["calendar.foundStoredEventCount"] ?? "0"
    );
    const storedEventIdentifierCount = Number(
      evidence.ios.systemDiagnostics["calendar.storedEventIdentifierCount"] ?? "0"
    );
    const syncedCount = Number(evidence.ios.systemDiagnostics["calendar.syncedCount"] ?? "0");
    if (foundStoredEventCount <= 0 && storedEventIdentifierCount <= 0 && syncedCount <= 0) {
      return [];
    }

    return [
      `日历权限状态=${evidence.ios.systemDiagnostics["calendar.authorizationStatus"]}`,
      `storedEventIdentifierCount=${evidence.ios.systemDiagnostics["calendar.storedEventIdentifierCount"] ?? "unknown"}`,
      `foundStoredEventCount=${evidence.ios.systemDiagnostics["calendar.foundStoredEventCount"] ?? "unknown"}`,
      ...(evidence.calendarSystemAppEvidence?.available
        ? [
            `系统 Calendar App 已打开 seed 日期并截图：${evidence.calendarSystemAppEvidence.screenshotPath}`,
            `Calendar App 截图目标 eventId=${evidence.calendarSystemAppEvidence.targetEventId}`,
          ]
        : []),
    ];
  }

  return [];
}

function summarizeCommand(commandResult, { includeStdout = true } = {}) {
  return {
    command: commandResult.command,
    status: commandResult.status,
    ok: commandOk(commandResult),
    stdout: includeStdout ? String(commandResult.stdout ?? "").trim().slice(0, 4000) : "",
    stderr: String(commandResult.stderr ?? "").trim().slice(0, 4000),
    error: commandResult.error,
  };
}

function compactCommands(commands, options = {}) {
  return Object.fromEntries(
    Object.entries(commands)
      .filter(([, value]) => Boolean(value))
      .map(([key, value]) => [
        key,
        summarizeCommand(value, options),
      ])
  );
}

function writeSummary(evidence, outputDir) {
  const supportingSignals = evidence.manualEvidenceStillRequired.flatMap((item) =>
    supportingSignalsForManualItem(item, evidence).map((signal) => `${item}：${signal}`)
  );
  const lines = [
    "# iOS v1 自动证据包",
    "",
    `- 生成时间：${evidence.generatedAt}`,
    `- 模式：${evidence.mode}`,
    `- 不能替代真实人工验收：${evidence.replacesManualAcceptance ? "否" : "是"}`,
    `- 输出目录：${outputDir}`,
    "",
    "## 自动采集证据",
    "",
    ...evidence.automatedEvidence.map((item) => `- ${item}`),
    "",
    "## 仍需人工留证",
    "",
    ...evidence.manualEvidenceStillRequired.map((item) => `- ${item}`),
    "",
    "## 当前结果摘要",
    "",
    `- API health HTTP 状态：${evidence.serviceHealth.apiHealthStatus || "未采集"}`,
    `- H5 native HTTP 状态：${evidence.serviceHealth.h5NativeStatus || "未采集"}`,
    `- H5 native 目标页面识别：${evidence.serviceHealth.h5NativeTargetMarkerFound ? "是" : "否"}`,
    `- H5DevServerURL：${evidence.ios.h5DevServerUrl || "未采集"}`,
    `- H5DevServerURL 目标页面识别：${evidence.ios.h5DevServerTargetMarkerFound ? "是" : "否"}`,
    `- Simulator UDID：${evidence.ios.simulatorUdid || "未采集"}`,
    `- App container：${evidence.ios.appContainer || "未采集"}`,
    `- 系统日历权限预授权：${evidence.ios.calendarAccessPreparation.enabled ? evidence.ios.calendarAccessPreparation.available ? "已执行" : "失败" : "未开启"}`,
    `- 系统日历权限预授权用途：${evidence.ios.calendarAccessPreparation.requiredFor.length > 0 ? evidence.ios.calendarAccessPreparation.requiredFor.join(", ") : "无"}`,
    ...(evidence.ios.calendarAccessPreparation.errors.length > 0
      ? evidence.ios.calendarAccessPreparation.errors.map((error) => `- calendarAccessError：${error}`)
      : []),
    `- Native conversationId：${evidence.ios.conversationPersistence.beforeRelaunch || "未采集"}`,
    `- Native conversationId 重启后保持一致：${evidence.ios.conversationPersistence.stableAcrossRelaunch === null ? "未验证" : evidence.ios.conversationPersistence.stableAcrossRelaunch ? "是" : "否"}`,
    `- 截图：${evidence.ios.screenshotPath}`,
    "",
    "## 验收事实种子",
    "",
    `- 仅在显式开启时写入：${evidence.acceptanceFactSeed.enabled ? "已开启" : "未开启"}`,
    `- 可用：${evidence.acceptanceFactSeed.available ? "是" : "否"}`,
    `- conversationId：${evidence.acceptanceFactSeed.conversationId || "未采集"}`,
    ...evidence.acceptanceFactSeed.inputs.map(
      (input) => `- ${input.domain} 输入：${input.input}`
    ),
    ...(evidence.acceptanceFactSeed.results.length > 0
      ? evidence.acceptanceFactSeed.results.map(
          (result) =>
            `- ${result.domain} 结果：${result.ok ? "succeeded" : "failed"} ${result.planId ?? ""}`
        )
      : []),
    ...(evidence.acceptanceFactSeed.errors.length > 0
      ? evidence.acceptanceFactSeed.errors.map((error) => `- error：${error}`)
      : []),
    "",
    "## 系统 Calendar App 辅助截图",
    "",
    `- 仅在显式开启时打开系统 Calendar：${evidence.calendarSystemAppEvidence.enabled ? "已开启" : "未开启"}`,
    `- 可用：${evidence.calendarSystemAppEvidence.available ? "是" : "否"}`,
    `- 不替代人工复核：${evidence.calendarSystemAppEvidence.supportingOnly ? "是" : "否"}`,
    `- conversationId：${evidence.calendarSystemAppEvidence.conversationId || "未采集"}`,
    `- seedRunId：${evidence.calendarSystemAppEvidence.seedRunId || "未采集"}`,
    `- targetEventId：${evidence.calendarSystemAppEvidence.targetEventId || "未采集"}`,
    `- targetEventTitle：${evidence.calendarSystemAppEvidence.targetEventTitle || "未采集"}`,
    `- targetEventStartAt：${evidence.calendarSystemAppEvidence.targetEventStartAt || "未采集"}`,
    `- calshowUrl：${evidence.calendarSystemAppEvidence.calshowUrl || "未采集"}`,
    `- 截图：${evidence.calendarSystemAppEvidence.screenshotPath}`,
    ...(evidence.calendarSystemAppEvidence.errors.length > 0
      ? evidence.calendarSystemAppEvidence.errors.map((error) => `- error：${error}`)
      : []),
    "",
    "## 系统日历取消清理种子",
    "",
    `- 仅在显式开启时取消 seed 日程：${evidence.calendarCleanupSeed.enabled ? "已开启" : "未开启"}`,
    `- 可用：${evidence.calendarCleanupSeed.available ? "是" : "否"}`,
    `- conversationId：${evidence.calendarCleanupSeed.conversationId || "未采集"}`,
    `- seedRunId：${evidence.calendarCleanupSeed.seedRunId || "未采集"}`,
    `- targetEventId：${evidence.calendarCleanupSeed.targetEventId || "未采集"}`,
    `- targetEventTitle：${evidence.calendarCleanupSeed.targetEventTitle || "未采集"}`,
    `- preCancelStatus：${evidence.calendarCleanupSeed.preCancelStatus || "未采集"}`,
    `- postCancelStatus：${evidence.calendarCleanupSeed.postCancelStatus || "未采集"}`,
    `- 取消前 Native 诊断最多轮询：${evidence.calendarCleanupSeed.preCancelRefreshMaxAttempts}`,
    `- 取消前 Native 诊断更新时间：${evidence.calendarCleanupSeed.preCancelDiagnosticsUpdatedAt || "未采集"}`,
    `- 取消前 Native 诊断新鲜：${evidence.calendarCleanupSeed.preCancelDiagnosticsFresh === null ? "未采集" : evidence.calendarCleanupSeed.preCancelDiagnosticsFresh ? "是" : "否"}`,
    `- 取消前必须存在 EventKit 标识符：${evidence.calendarCleanupSeed.preCancelRequiresStoredIdentifier ? "是" : "否"}`,
    `- 取消后截图必须先成功取消日程：${evidence.calendarCleanupSeed.afterScreenshotRequiresCanceledEvent ? "是" : "否"}`,
    `- 取消后 Native 清理最多轮询：${evidence.calendarCleanupSeed.postCancelRefreshMaxAttempts}`,
    `- preCancelStoredIdentifierPresent：${evidence.calendarCleanupSeed.preCancelStoredIdentifierPresent === null ? "未采集" : String(evidence.calendarCleanupSeed.preCancelStoredIdentifierPresent)}`,
    `- postCancelStoredIdentifierPresent：${evidence.calendarCleanupSeed.postCancelStoredIdentifierPresent === null ? "未采集" : String(evidence.calendarCleanupSeed.postCancelStoredIdentifierPresent)}`,
    `- postCancelRemovedEventIdPresent：${evidence.calendarCleanupSeed.postCancelRemovedEventIdPresent ? "是" : "否"}`,
    `- removedEventIds：${evidence.calendarCleanupSeed.removedEventIds.length > 0 ? evidence.calendarCleanupSeed.removedEventIds.join(", ") : "未采集"}`,
    `- 系统 Calendar 取消前后截图不替代人工复核：${evidence.calendarCleanupSeed.systemCalendarAppScreenshots.supportingOnly ? "是" : "否"}`,
    `- 系统 Calendar 取消前截图可用：${evidence.calendarCleanupSeed.systemCalendarAppScreenshots.beforeAvailable ? "是" : "否"}`,
    `- 系统 Calendar 取消前截图：${evidence.calendarCleanupSeed.systemCalendarAppScreenshots.beforePath}`,
    `- 系统 Calendar 取消后截图可用：${evidence.calendarCleanupSeed.systemCalendarAppScreenshots.afterAvailable ? "是" : "否"}`,
    `- 系统 Calendar 取消后截图：${evidence.calendarCleanupSeed.systemCalendarAppScreenshots.afterPath}`,
    `- 系统 Calendar 取消前后截图 calshowUrl：${evidence.calendarCleanupSeed.systemCalendarAppScreenshots.calshowUrl || "未采集"}`,
    ...(evidence.calendarCleanupSeed.systemCalendarAppScreenshots.errors.length > 0
      ? evidence.calendarCleanupSeed.systemCalendarAppScreenshots.errors.map((error) => `- screenshotError：${error}`)
      : []),
    ...(evidence.calendarCleanupSeed.errors.length > 0
      ? evidence.calendarCleanupSeed.errors.map((error) => `- error：${error}`)
      : []),
    "",
    "## 日历权限拒绝降级种子",
    "",
    `- 仅在显式开启时撤销模拟器日历权限：${evidence.calendarPermissionDenialSeed.enabled ? "已开启" : "未开启"}`,
    `- 可用：${evidence.calendarPermissionDenialSeed.available ? "是" : "否"}`,
    `- conversationId：${evidence.calendarPermissionDenialSeed.conversationId || "未采集"}`,
    `- seedRunId：${evidence.calendarPermissionDenialSeed.seedRunId || "未采集"}`,
    `- targetEventId：${evidence.calendarPermissionDenialSeed.targetEventId || "未采集"}`,
    `- targetEventTitle：${evidence.calendarPermissionDenialSeed.targetEventTitle || "未采集"}`,
    `- preAuthorizationStatus：${evidence.calendarPermissionDenialSeed.preAuthorizationStatus || "未采集"}`,
    `- postAuthorizationStatus：${evidence.calendarPermissionDenialSeed.postAuthorizationStatus || "未采集"}`,
    `- backendFactPersisted：${String(evidence.calendarPermissionDenialSeed.backendFactPersisted)}`,
    `- nativeErrorSource：${evidence.calendarPermissionDenialSeed.nativeErrorSource}`,
    `- nativeErrorReason：${evidence.calendarPermissionDenialSeed.nativeErrorReason || "未采集"}`,
    `- H5 预期降级文案：${evidence.calendarPermissionDenialSeed.h5StatusExpectation}`,
    `- 截图：${evidence.calendarPermissionDenialSeed.screenshotPath}`,
    ...(evidence.calendarPermissionDenialSeed.errors.length > 0
      ? evidence.calendarPermissionDenialSeed.errors.map((error) => `- error：${error}`)
      : []),
    "",
    "## 通知点击回流辅助证据",
    "",
    `- 仅在显式开启时写入并采集：${evidence.notificationClickBackflow.enabled ? "已开启" : "未开启"}`,
    `- 可用：${evidence.notificationClickBackflow.available ? "是" : "否"}`,
    `- 不替代真实系统通知点击：${evidence.notificationClickBackflow.supportingOnly ? "是" : "否"}`,
    `- conversationId：${evidence.notificationClickBackflow.conversationId || "未采集"}`,
    `- seedRunId：${evidence.notificationClickBackflow.seedRunId || "未采集"}`,
    `- reminderId：${evidence.notificationClickBackflow.reminderId || "未采集"}`,
    `- notificationIdentifier：${evidence.notificationClickBackflow.notificationIdentifier || "未采集"}`,
    `- pendingNotificationFound：${String(evidence.notificationClickBackflow.pendingNotificationFound)}`,
    `- h5StatusText：${evidence.notificationClickBackflow.h5StatusText || "未采集"}`,
    `- highlightedReminderFound：${String(evidence.notificationClickBackflow.highlightedReminderFound)}`,
    `- bridgeInboundLabel：${evidence.notificationClickBackflow.bridgeInboundLabel || "未采集"}`,
    `- 截图：${evidence.notificationClickBackflow.h5OpenedScreenshotPath}`,
    ...(evidence.notificationClickBackflow.errors.length > 0
      ? evidence.notificationClickBackflow.errors.map((error) => `- error：${error}`)
      : []),
    "",
    "## 通知投递诊断辅助证据",
    "",
    `- 仅在显式开启时写入并等待投递：${evidence.notificationDelivery.enabled ? "已开启" : "未开启"}`,
    `- 可用：${evidence.notificationDelivery.available ? "是" : "否"}`,
    `- 不替代真实系统通知展示或点击：${evidence.notificationDelivery.supportingOnly ? "是" : "否"}`,
    `- mode：${evidence.notificationDelivery.mode}`,
    `- conversationId：${evidence.notificationDelivery.conversationId || "未采集"}`,
    `- seedRunId：${evidence.notificationDelivery.seedRunId || "未采集"}`,
    `- seedInput：${evidence.notificationDelivery.seedInput}`,
    `- seedNow：${evidence.notificationDelivery.seedNow || "未采集"}`,
    `- seedDueAt：${evidence.notificationDelivery.seedDueAt || "未采集"}`,
    `- waitUntilDueMs：${evidence.notificationDelivery.waitUntilDueMs === null ? "未采集" : evidence.notificationDelivery.waitUntilDueMs}`,
    `- waitAfterDueMs：${evidence.notificationDelivery.waitAfterDueMs}`,
    `- reminderId：${evidence.notificationDelivery.reminderId || "未采集"}`,
    `- notificationIdentifier：${evidence.notificationDelivery.notificationIdentifier || "未采集"}`,
    `- pendingNotificationFound：${String(evidence.notificationDelivery.pendingNotificationFound)}`,
    `- deliveredNotificationFound：${String(evidence.notificationDelivery.deliveredNotificationFound)}`,
    ...(evidence.notificationDelivery.errors.length > 0
      ? evidence.notificationDelivery.errors.map((error) => `- error：${error}`)
      : []),
    "",
    "## 原生键盘输入辅助证据",
    "",
    `- 仅在显式开启时写入并采集：${evidence.nativeKeyboardInput.enabled ? "已开启" : "未开启"}`,
    `- 可用：${evidence.nativeKeyboardInput.available ? "是" : "否"}`,
    `- 不替代真实 Native 输入框截图：${evidence.nativeKeyboardInput.supportingOnly ? "是" : "否"}`,
    `- mode：${evidence.nativeKeyboardInput.mode}`,
    `- source：${evidence.nativeKeyboardInput.source}`,
    `- conversationId：${evidence.nativeKeyboardInput.conversationId || "未采集"}`,
    `- seedRunId：${evidence.nativeKeyboardInput.seedRunId || "未采集"}`,
    `- seedInput：${evidence.nativeKeyboardInput.seedInput}`,
    `- confirmationCardFound：${String(evidence.nativeKeyboardInput.confirmationCardFound)}`,
    `- reminderId：${evidence.nativeKeyboardInput.reminderId || "未采集"}`,
    `- reminderTitle：${evidence.nativeKeyboardInput.reminderTitle || "未采集"}`,
    `- bridgeInboundLabel：${evidence.nativeKeyboardInput.bridgeInboundLabel || "未采集"}`,
    `- 截图：${evidence.nativeKeyboardInput.screenshotPath}`,
    ...(evidence.nativeKeyboardInput.errors.length > 0
      ? evidence.nativeKeyboardInput.errors.map((error) => `- error：${error}`)
      : []),
    "",
    "## 原生附件输入辅助证据",
    "",
    `- 仅在显式开启时写入并采集：${evidence.nativeAttachmentInputs.enabled ? "已开启" : "未开启"}`,
    `- 可用：${evidence.nativeAttachmentInputs.available ? "是" : "否"}`,
    `- 不替代真实 PhotosPicker / fileImporter / PDFKit 验收：${evidence.nativeAttachmentInputs.supportingOnly ? "是" : "否"}`,
    `- mode：${evidence.nativeAttachmentInputs.mode}`,
    `- conversationId：${evidence.nativeAttachmentInputs.conversationId || "未采集"}`,
    `- seedRunId：${evidence.nativeAttachmentInputs.seedRunId || "未采集"}`,
    `- 截图：${evidence.nativeAttachmentInputs.screenshotPath}`,
    ...evidence.nativeAttachmentInputs.samples.flatMap((sample) => [
      `- ${sample.itemId} name：${sample.name}`,
      `- ${sample.itemId} source：${sample.source}`,
      `- ${sample.itemId} attachmentId：${sample.attachmentId}`,
      `- ${sample.itemId} backendAttachmentId：${sample.backendAttachmentId || "未采集"}`,
      `- ${sample.itemId} contentStatus：${sample.contentStatus || "未采集"}`,
    ]),
    ...(evidence.nativeAttachmentInputs.errors.length > 0
      ? evidence.nativeAttachmentInputs.errors.map((error) => `- error：${error}`)
      : []),
    "",
    "## H5 同会话页面截图",
    "",
    `- conversationId：${evidence.h5SurfaceScreenshots.conversationId || "未采集"}`,
    `- 可用：${evidence.h5SurfaceScreenshots.available ? "是" : "否"}`,
    ...Object.entries(evidence.h5SurfaceScreenshots.surfaces).map(
      ([surface, screenshot]) =>
        `- ${surface}：${screenshot.captured ? screenshot.path : "未采集"}`
    ),
    `- H5 失败诊断截图：${evidence.h5SurfaceScreenshots.errorDiagnostics.screenshotPath}`,
    `- H5 失败诊断 HTML：${evidence.h5SurfaceScreenshots.errorDiagnostics.htmlPath}`,
    `- H5 失败诊断 URL：${evidence.h5SurfaceScreenshots.errorDiagnostics.pageUrl || "未采集"}`,
    `- H5 失败诊断标题：${evidence.h5SurfaceScreenshots.errorDiagnostics.pageTitle || "未采集"}`,
    `- H5 失败诊断正文片段：${evidence.h5SurfaceScreenshots.errorDiagnostics.bodyTextPreview || "未采集"}`,
    ...(evidence.h5SurfaceScreenshots.errors.length > 0
      ? evidence.h5SurfaceScreenshots.errors.map((error) => `- error：${error}`)
      : []),
    "",
    "## Native 系统诊断摘要",
    "",
    ...(
      Object.keys(evidence.ios.systemDiagnostics).length > 0
        ? Object.entries(evidence.ios.systemDiagnostics).map(
            ([key, value]) => `- ${key}：${value}`
          )
        : ["- 未采集"]
    ),
    "",
    "## 已采集的辅助证据信号",
    "",
    ...(supportingSignals.length > 0
      ? supportingSignals.map((signal) => `- ${signal}`)
      : ["- 无"]),
    "",
    "## 后端事实摘要",
    "",
    `- conversationId：${evidence.backendFactSnapshot.conversationId || "未采集"}`,
    `- 可用：${evidence.backendFactSnapshot.available ? "是" : "否"}`,
    `- 日程：${evidence.backendFactSnapshot.counts.calendarEvents}`,
    `- 提醒：${evidence.backendFactSnapshot.counts.reminders}`,
    `- 费用：${evidence.backendFactSnapshot.counts.expenses}`,
    `- 执行记录：${evidence.backendFactSnapshot.counts.executionLedger}`,
    `- 对话轮次：${evidence.backendFactSnapshot.counts.turns}`,
    "",
    "## 边界声明",
    "",
    "本证据包只证明可通过 CLI 自动采集的构建、安装、启动、H5 地址和服务可达性证据；语音、照片 / 文件选择、PDF、通知、系统日历和权限拒绝降级仍必须按人工验收清单逐项操作并留证。",
    "",
  ];
  writeText(path.join(outputDir, "summary.md"), lines.join("\n"));
}

function writeManualChecklist(evidence, outputDir) {
  const guideLines = (item) => {
    const guide = evidence.manualEvidenceGuides[item] ?? {};
    return [
      ...(guide.bridgeMarkers ?? []).map((marker) => `- bridge_marker: ${marker}`),
      ...(guide.apiSummaries ?? []).map((summary) => `- api_summary: ${summary}`),
      ...(guide.screenshots ?? []).map((screenshot) => `- screenshot: ${screenshot}`),
      ...(guide.systemArtifacts ?? []).map(
        (artifact) => `- system_artifact: ${artifact}`
      ),
    ];
  };
  const lines = [
    "# iOS v1 人工补证清单",
    "",
    "本文件由自动证据包生成。状态 `manual_required` 表示必须人工操作并补充截图、录屏或接口摘要。",
    "",
    ...evidence.manualEvidenceStillRequired.flatMap((item) => [
      `## ${item}`,
      "",
      `- record_id: ${manualEvidenceRecordIds[item]}`,
      "- status: manual_required",
      ...guideLines(item),
      "- evidence_placeholder:",
      "- operator_notes:",
      "",
    ]),
  ];
  writeText(path.join(outputDir, "manual-checklist.todo.md"), lines.join("\n"));
}

function manualRecordItem({ item, evidence, guide, requiredEvidence }) {
  const supportingAutomationSignals = supportingSignalsForManualItem(item, evidence);
  return {
    id: manualEvidenceRecordIds[item],
    item,
    title: item,
    status: "pending",
    allowedStatuses: manualEvidenceRecordStatuses,
    requiredEvidence,
    supportingAutomationSignals,
    evidence: {
      screenshots: [],
      recordings: [],
      apiSummaries: [],
      bridgeMarkers: [],
      systemArtifacts: [],
      operatorNotes: "",
      blocker: "",
    },
    guide,
  };
}

function buildManualEvidenceRecord(evidence, manifest) {
  const h5Guide = {
    apiSummaries: [],
    bridgeMarkers: ["H5DevServerURL", "h5NativeTargetMarkerFound=true"],
    screenshots: ["默认地址 App 启动截图", "局域网地址 App 启动截图"],
    systemArtifacts: ["构建产物 Info.plist 的 H5DevServerURL"],
  };
  const h5RequiredEvidence = {
    screenshots: h5Guide.screenshots,
    recordings: [],
    apiSummaries: h5Guide.apiSummaries,
    bridgeMarkers: h5Guide.bridgeMarkers,
    systemArtifacts: h5Guide.systemArtifacts,
  };

  const manualItems = evidence.manualEvidenceStillRequired.map((item) => {
    const guide = evidence.manualEvidenceGuides[item] ?? {};
    return manualRecordItem({
      item,
      evidence,
      guide,
      requiredEvidence: {
        screenshots: guide.screenshots ?? [],
        recordings: [],
        apiSummaries: guide.apiSummaries ?? [],
        bridgeMarkers: guide.bridgeMarkers ?? [],
        systemArtifacts: guide.systemArtifacts ?? [],
      },
    });
  });

  const record = {
    schemaVersion: 1,
    generatedAt: evidence.generatedAt,
    repoRoot: rootDir,
    branch: evidence.git.branch,
    headSha: evidence.git.commit,
    acceptanceVerdict: "not_evaluated",
    manualAcceptanceRequired: true,
    automationCanReplaceManualAcceptance: false,
    packageEvidence: {
      acceptanceEvidenceJson: "acceptance-evidence.json",
      manifestJson: "manifest.json",
      summaryMarkdown: "summary.md",
      manualChecklist: "manual-checklist.todo.md",
      manualEvidenceReview: "manual-evidence-record.review.json",
    },
    instructions:
      "将每个 item 的 status 改为 passed/failed/blocked，并把截图、录屏、接口摘要、bridge marker 或系统证据路径填入 evidence；不要把自动辅助证据当成人工验收通过。",
    manifestItems: manifest.items.map((item) => ({
      item: item.item,
      status: item.status,
      automationCanReplaceManualAcceptance: item.automationCanReplaceManualAcceptance,
      supportingEvidenceSignals: item.supportingEvidenceSignals ?? [],
    })),
    items: [
      manualRecordItem({
        item: "H5 地址覆盖",
        evidence,
        guide: h5Guide,
        requiredEvidence: h5RequiredEvidence,
      }),
      ...manualItems,
    ],
  };
  return record;
}

function buildManualEvidenceDraft(record) {
  return {
    ...record,
    generatedFromTemplate: "manual-evidence-record.template.json",
    instructions:
      "本文件是人工补证草稿。自动辅助信号只写入 operatorNotes，不能替代截图、录屏、接口摘要、bridge marker 或系统证据；补证完成后再运行 --require-complete。",
    items: record.items.map((item) => {
      const supportingNotes =
        item.supportingAutomationSignals.length > 0
          ? `自动辅助信号：${item.supportingAutomationSignals.join("；")}`
          : "待人工补充。";
      return {
        ...item,
        status: "pending",
        acceptanceNote: "自动辅助信号不等于人工验收通过。",
        evidence: {
          ...item.evidence,
          operatorNotes: supportingNotes,
          blocker: "",
        },
      };
    }),
  };
}

function writeManualEvidenceRecords(evidence, manifest, outputDir) {
  const record = buildManualEvidenceRecord(evidence, manifest);
  const draft = buildManualEvidenceDraft(record);
  const review = buildManualEvidenceReview(draft, evidence);

  writeText(
    path.join(outputDir, "manual-evidence-record.template.json"),
    `${JSON.stringify(record, null, 2)}\n`
  );
  writeText(
    path.join(outputDir, "manual-evidence-record.draft.json"),
    `${JSON.stringify(draft, null, 2)}\n`
  );
  writeText(
    path.join(outputDir, "manual-evidence-record.review.json"),
    `${JSON.stringify(review, null, 2)}\n`
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const runStartedAt = new Date().toISOString();
  const mode = args.dryRun ? "dry-run" : "live";
  const outputDir = path.resolve(
    rootDir,
    args.outputDir ??
      path.join(".tmp", "ios-acceptance-evidence", timestampForPath())
  );
  ensureDir(outputDir);

  const git = collectGitState(args);
  const serviceHealth = collectServiceHealth(args);
  const ios = collectBuildAndLaunch({ ...args, outputDir });
  const calendarAccessPreparation = prepareCalendarAccessForSystemEvidence({
    captureCalendarSystemApp: args.captureCalendarSystemApp,
    dryRun: args.dryRun,
    seedCalendarCleanup: args.seedCalendarCleanup,
    simulatorUdid: ios.simulatorUdid,
    waitMs: args.screenshotDelayMs,
  });
  const currentNativeConversationId =
    ios.conversationPersistence?.beforeRelaunch ??
    ios.conversationPersistence?.afterRelaunch;
  const acceptanceFactSeed = await seedAcceptanceFacts({
    conversationId: currentNativeConversationId,
    dryRun: args.dryRun,
    enabled: args.seedAcceptanceFacts,
  });
  const seedRefresh = acceptanceFactSeed.available
    ? refreshNativeSystemDiagnostics({
        dryRun: args.dryRun,
        preferencesPlist: ios.conversationPersistence?.preferencesPlist,
        simulatorUdid: ios.simulatorUdid,
        waitMs: args.screenshotDelayMs,
      })
    : { commands: {}, systemDiagnostics: {} };
  if (Object.keys(seedRefresh.systemDiagnostics).length > 0) {
    ios.systemDiagnostics = seedRefresh.systemDiagnostics;
  }
  const calendarSystemAppEvidence = await captureCalendarSystemAppEvidence({
    acceptanceFactSeed,
    conversationId: currentNativeConversationId,
    dryRun: args.dryRun,
    enabled: args.captureCalendarSystemApp,
    outputDir,
    simulatorUdid: ios.simulatorUdid,
    waitMs: args.screenshotDelayMs,
  });
  const calendarCleanupSeed = await seedCalendarCleanup({
    acceptanceFactSeed,
    conversationId: currentNativeConversationId,
    dryRun: args.dryRun,
    enabled: args.seedCalendarCleanup,
    outputDir,
    preferencesPlist: ios.conversationPersistence?.preferencesPlist,
    runStartedAt,
    seedRefresh,
    simulatorUdid: ios.simulatorUdid,
    waitMs: args.screenshotDelayMs,
  });
  const cleanupRefresh = calendarCleanupSeed.canceledEvent
    ? refreshNativeSystemDiagnostics({
        dryRun: args.dryRun,
        preferencesPlist: ios.conversationPersistence?.preferencesPlist,
        simulatorUdid: ios.simulatorUdid,
        waitMs: args.screenshotDelayMs,
      })
    : { commands: {}, systemDiagnostics: {} };
  finalizeCalendarCleanupSeed({
    cleanup: calendarCleanupSeed,
    dryRun: args.dryRun,
    preferencesPlist: ios.conversationPersistence?.preferencesPlist,
    refresh: cleanupRefresh,
    simulatorUdid: ios.simulatorUdid,
    waitMs: args.screenshotDelayMs,
  });
  if (Object.keys(cleanupRefresh.systemDiagnostics).length > 0) {
    ios.systemDiagnostics = cleanupRefresh.systemDiagnostics;
  }
  if (Object.keys(calendarCleanupSeed.postCancelSystemDiagnostics).length > 0) {
    ios.systemDiagnostics = calendarCleanupSeed.postCancelSystemDiagnostics;
  }
  const {
    denial: calendarPermissionDenialSeed,
    refresh: permissionDenialRefresh,
  } = await seedCalendarPermissionDenial({
    conversationId: currentNativeConversationId,
    dryRun: args.dryRun,
    enabled: args.seedCalendarPermissionDenial,
    initialSystemDiagnostics: ios.systemDiagnostics,
    outputDir,
    preferencesPlist: ios.conversationPersistence?.preferencesPlist,
    simulatorUdid: ios.simulatorUdid,
    waitMs: args.screenshotDelayMs,
  });
  if (Object.keys(permissionDenialRefresh.systemDiagnostics).length > 0) {
    ios.systemDiagnostics = permissionDenialRefresh.systemDiagnostics;
  }
  const {
    backflow: notificationClickBackflow,
    refresh: notificationClickBackflowRefresh,
  } = await seedNotificationClickBackflow({
    conversationId: currentNativeConversationId,
    dryRun: args.dryRun,
    enabled: args.seedNotificationClickBackflow,
    outputDir,
    preferencesPlist: ios.conversationPersistence?.preferencesPlist,
    simulatorUdid: ios.simulatorUdid,
    waitMs: args.screenshotDelayMs,
  });
  if (Object.keys(notificationClickBackflowRefresh.systemDiagnostics).length > 0) {
    ios.systemDiagnostics = notificationClickBackflowRefresh.systemDiagnostics;
  }
  const {
    delivery: notificationDelivery,
    refresh: notificationDeliveryRefresh,
  } = await seedNotificationDelivery({
    conversationId: currentNativeConversationId,
    dryRun: args.dryRun,
    enabled: args.seedNotificationDelivery,
    preferencesPlist: ios.conversationPersistence?.preferencesPlist,
    simulatorUdid: ios.simulatorUdid,
    waitMs: args.screenshotDelayMs,
  });
  if (Object.keys(notificationDeliveryRefresh.systemDiagnostics).length > 0) {
    ios.systemDiagnostics = notificationDeliveryRefresh.systemDiagnostics;
  }
  const nativeKeyboardInput = await seedNativeKeyboardInput({
    conversationId: currentNativeConversationId,
    dryRun: args.dryRun,
    enabled: args.seedKeyboardInput,
    outputDir,
  });
  const nativeAttachmentInputs = await seedNativeAttachmentInputs({
    conversationId: currentNativeConversationId,
    dryRun: args.dryRun,
    enabled: args.seedAttachmentInputs,
    outputDir,
  });
  const backendFactSnapshot = collectBackendFactSnapshot({
    conversationId: currentNativeConversationId,
    dryRun: args.dryRun,
  });
  const h5SurfaceScreenshots = await collectH5SurfaceScreenshots({
    conversationId: currentNativeConversationId,
    dryRun: args.dryRun,
    outputDir,
  });
  const checklist = collectChecklistShape();

  const evidence = {
    generatedAt: new Date().toISOString(),
    runStartedAt,
    mode,
    replacesManualAcceptance: false,
    automatedEvidence: [
      ...automatedEvidence,
      ...(args.seedAcceptanceFacts ? ["acceptance_fact_seed"] : []),
      ...(args.captureCalendarSystemApp
        ? ["system_calendar_app_screenshot"]
        : []),
      ...(args.seedCalendarCleanup ? ["calendar_cleanup_seed"] : []),
      ...(args.seedCalendarPermissionDenial
        ? ["calendar_permission_denial_seed"]
        : []),
      ...(args.seedNotificationClickBackflow
        ? ["notification_click_backflow"]
        : []),
      ...(args.seedNotificationDelivery
        ? ["notification_delivery_diagnostics"]
        : []),
      ...(args.seedKeyboardInput ? ["native_keyboard_input"] : []),
      ...(args.seedAttachmentInputs ? ["native_attachment_inputs"] : []),
    ],
    manualEvidenceStillRequired,
    manualEvidenceGuides,
    git: {
      branch: git.branch,
      commit: git.commit,
      recentCommits: git.recentCommits,
      commands: compactCommands(git.commands),
    },
    serviceHealth: {
      apiHealthStatus: serviceHealth.apiHealthStatus,
      h5NativeTargetMarkerFound: serviceHealth.h5NativeTargetMarkerFound,
      h5NativeTargetUrl: serviceHealth.h5NativeTargetUrl,
      h5NativeStatus: serviceHealth.h5NativeStatus,
      commands: compactCommands(serviceHealth.commands),
    },
    backendFactSnapshot: {
      ...backendFactSnapshot,
      commands: compactCommands(backendFactSnapshot.commands, {
        includeStdout: false,
      }),
    },
    acceptanceFactSeed,
    calendarSystemAppEvidence: {
      ...calendarSystemAppEvidence,
      commands: compactCommands(calendarSystemAppEvidence.commands),
    },
    calendarCleanupSeed: {
      ...calendarCleanupSeed,
      commands: compactCommands(calendarCleanupSeed.commands),
    },
    calendarPermissionDenialSeed: {
      ...calendarPermissionDenialSeed,
      commands: compactCommands(calendarPermissionDenialSeed.commands),
    },
    notificationClickBackflow: {
      ...notificationClickBackflow,
      commands: compactCommands(notificationClickBackflow.commands),
    },
    notificationDelivery: {
      ...notificationDelivery,
      commands: compactCommands(notificationDelivery.commands),
    },
    nativeKeyboardInput: {
      ...nativeKeyboardInput,
      commands: compactCommands(nativeKeyboardInput.commands),
    },
    nativeAttachmentInputs: {
      ...nativeAttachmentInputs,
      commands: compactCommands(nativeAttachmentInputs.commands),
    },
    h5SurfaceScreenshots,
    ios: {
      appPath: ios.appPath,
      bundleId: ios.bundleId,
      resetApp: ios.resetApp,
      simulatorUdid: ios.simulatorUdid,
      appContainer: ios.appContainer,
      h5DevServerTargetMarkerFound: ios.h5DevServerTargetMarkerFound,
      h5DevServerTargetUrl: ios.h5DevServerTargetUrl,
      h5DevServerUrl: ios.h5DevServerUrl,
      screenshotPath: ios.screenshotPath,
      screenshotDelayMs: ios.screenshotDelayMs,
      calendarAccessPreparation: {
        ...calendarAccessPreparation,
        commands: compactCommands(calendarAccessPreparation.commands),
      },
      conversationPersistence: ios.conversationPersistence,
      systemDiagnostics: ios.systemDiagnostics,
      seedRefresh: {
        commands: compactCommands(seedRefresh.commands),
      },
      cleanupRefresh: {
        commands: compactCommands(cleanupRefresh.commands),
      },
      permissionDenialRefresh: {
        commands: compactCommands(permissionDenialRefresh.commands),
      },
      notificationClickBackflowRefresh: {
        commands: compactCommands(notificationClickBackflowRefresh.commands),
      },
      notificationDeliveryRefresh: {
        commands: compactCommands(notificationDeliveryRefresh.commands),
      },
      commands: compactCommands(ios.commands),
    },
    checklist,
  };

  const manifest = buildManifest(evidence);
  writeText(
    path.join(outputDir, "acceptance-evidence.json"),
    `${JSON.stringify(evidence, null, 2)}\n`
  );
  writeText(
    path.join(outputDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`
  );
  writeSummary(evidence, outputDir);
  writeManualChecklist(evidence, outputDir);
  writeManualEvidenceRecords(evidence, manifest, outputDir);

  const requiredLiveCommands =
    mode === "dry-run"
      ? []
      : [
          serviceHealth.commands.api,
          serviceHealth.commands.h5,
          ios.commands.iosBuild,
          ios.commands.simulatorSmoke,
          ios.commands.resetUninstall,
          ios.commands.resetInstall,
          ios.commands.resetLaunch,
          ios.commands.h5DevServerUrl,
          ios.commands.simulatorScreenshot,
        ].filter(Boolean);
  const failedRequired = requiredLiveCommands.filter((command) => !commandOk(command));
  if (failedRequired.length > 0) {
    console.error("iOS acceptance evidence collection failed:");
    for (const failure of failedRequired) {
      console.error(`- ${failure.command}: ${failure.stderr || failure.error}`);
    }
    console.error(`Partial evidence written to ${outputDir}`);
    process.exit(1);
  }

  console.log(`iOS acceptance evidence written to ${outputDir}`);
  console.log("This evidence does not replace manual system capability acceptance.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
