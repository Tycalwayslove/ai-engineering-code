import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import process from "node:process";

import {
  buildManualEvidenceRecordReport,
  validateManualEvidenceRecord,
} from "./validate-ios-manual-evidence-record.mjs";

const rootDir = process.cwd();
const defaultExternalKnowledgeSourceDraftPaths = [
  "docs/knowledge-sync/feishu-pages/03-evolution-log.md",
  "docs/knowledge-sync/feishu-pages/05-ai-workflow-collaboration.md",
];
const defaultManualRecordRoot = path.join(".tmp", "ios-acceptance-evidence");
const manualRecordStrategies = new Set(["best", "latest"]);
const manualEvidenceRecordFileNames = [
  "manual-evidence-record.filled.json",
  "manual-evidence-record.review.json",
  "manual-evidence-record.draft.json",
];
const manualEvidenceRecordPriority = new Map(
  manualEvidenceRecordFileNames.map((fileName, index) => [fileName, index])
);

export const requiredAutomatedCommands = [
  {
    script: "validate:contracts",
    proves: "OpenAPI、Postman、SDK 和 Native Bridge 契约仍一致",
  },
  {
    script: "validate:product-smoke",
    proves: "in-memory runtime + rule planner 产品主路径可用",
  },
  {
    script: "validate:product-smoke:postgres",
    proves: "migration、Postgres repository 和产品 API 主路径可用",
  },
  {
    script: "validate:h5-click-smoke",
    proves: "H5 页面、对话、确认卡、Timeline 和行内动作可点击",
  },
  {
    script: "validate:ios-build",
    proves: "Swift 工程 Debug simulator build 和 H5DevServerURL 构建设置可用",
  },
  {
    script: "validate:ios-simulator-smoke",
    proves: "iOS App 可构建、安装并启动到 Simulator",
  },
  {
    script: "validate:ios-navigation-ui-test",
    proves: "真实 Native Header / Drawer 点击可驱动 H5 七页面切换",
  },
  {
    script: "validate:ios-keyboard-ui-test",
    proves: "真实 Native 键盘输入到 H5 确认卡和后端提醒事实闭环",
  },
  {
    script: "validate:ios-voice-ui-test",
    proves: "Native 语音入口到 H5 确认卡和后端提醒事实闭环",
  },
  {
    script: "validate:ios-attachment-ui-test",
    proves: "Native 纸夹入口和照片 / 文件菜单选项可见",
  },
  {
    script: "validate:ios-manual-acceptance",
    proves: "iOS 人工验收清单保留必验项目和证据要求",
  },
  {
    script: "validate:ios-manual-evidence-record",
    proves: "iOS 人工证据记录模板结构可校验",
  },
  {
    script: "validate:ios-acceptance-evidence",
    proves: "iOS 自动证据包、人工记录 review 预填和 HTTP 重试等采证工具可用",
  },
  {
    script: "validate:llm-smoke",
    proves: "真实 LLM provider 的 chat、clarification、mixed、只读查询和安全追问可用",
  },
  {
    script: "validate:sdk-runtime",
    proves: "SDK runtime 方法和直接动作 conversationId 约束可用",
  },
  {
    script: "validate:context-sync",
    proves: "当前项目状态、记忆索引和知识同步源稿一致",
  },
  {
    script: "validate:v1-readiness",
    proves: "v1 readiness 审计文档保留完成门槛和缺口声明",
  },
  {
    script: "validate:native-shells",
    proves: "原生壳、iOS 采证命令和 UI test 根命令结构护栏仍完整",
  },
  {
    script: "git diff --check",
    command: "git diff --check",
    proves: "工作区 patch 不含空白格式错误",
  },
];

function timestampForPath(date = new Date()) {
  return date.toISOString().replaceAll(":", "-").replace(/\.\d+Z$/, "Z");
}

function normalizeCommandResult(commandSpec, rawResult) {
  if (!rawResult) {
    return {
      script: commandSpec.script,
      command: commandSpec.command ?? `pnpm ${commandSpec.script}`,
      status: "not_run",
      exitCode: null,
      durationMs: null,
      stdout: "",
      stderr: "",
    };
  }

  return {
    script: commandSpec.script,
    command: rawResult.command ?? commandSpec.command ?? `pnpm ${commandSpec.script}`,
    status: rawResult.status ?? (rawResult.exitCode === 0 ? "passed" : "failed"),
    exitCode: rawResult.exitCode ?? null,
    durationMs: rawResult.durationMs ?? null,
    stdout: String(rawResult.stdout ?? "").slice(0, 4000),
    stderr: String(rawResult.stderr ?? "").slice(0, 4000),
  };
}

function resultForScript(commandResults, script) {
  if (commandResults instanceof Map) {
    return commandResults.get(script);
  }
  return commandResults?.[script];
}

function readManualRecord(manualRecordPath) {
  if (!manualRecordPath) {
    return null;
  }
  const absolutePath = path.resolve(rootDir, manualRecordPath);
  if (!fs.existsSync(absolutePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

function relativeToRoot(absolutePath) {
  return path.relative(rootDir, absolutePath) || ".";
}

function collectManualRecordCandidates(manualRecordRoot = defaultManualRecordRoot) {
  const absoluteRoot = path.resolve(rootDir, manualRecordRoot);
  if (!fs.existsSync(absoluteRoot)) {
    return [];
  }

  const candidates = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(entryPath);
        continue;
      }
      if (!entry.isFile() || !manualEvidenceRecordPriority.has(entry.name)) {
        continue;
      }

      try {
        const record = JSON.parse(fs.readFileSync(entryPath, "utf8"));
        const validation = validateManualEvidenceRecord(record, {
          recordPath: relativeToRoot(entryPath),
          requireComplete: true,
        });
        const report = buildManualEvidenceRecordReport(record, {
          recordPath: relativeToRoot(entryPath),
        });
        const stat = fs.statSync(entryPath);
        candidates.push({
          absolutePath: entryPath,
          fileName: entry.name,
          missingEvidenceCount: report.missingEvidenceCount,
          parseError: null,
          requireCompletePassed: validation.failures.length === 0,
          mtimeMs: stat.mtimeMs,
          priority: manualEvidenceRecordPriority.get(entry.name),
        });
      } catch (error) {
        candidates.push({
          absolutePath: entryPath,
          fileName: entry.name,
          missingEvidenceCount: Number.POSITIVE_INFINITY,
          parseError: error.message,
          requireCompletePassed: false,
          mtimeMs: 0,
          priority: manualEvidenceRecordPriority.get(entry.name),
        });
      }
    }
  };
  visit(absoluteRoot);
  return candidates;
}

function compareManualRecordCandidatesForBest(left, right) {
  if (left.requireCompletePassed !== right.requireCompletePassed) {
    return left.requireCompletePassed ? -1 : 1;
  }
  if (left.missingEvidenceCount !== right.missingEvidenceCount) {
    return left.missingEvidenceCount - right.missingEvidenceCount;
  }
  if (left.priority !== right.priority) {
    return left.priority - right.priority;
  }
  return right.mtimeMs - left.mtimeMs;
}

function compareManualRecordCandidatesForLatest(left, right) {
  if (left.mtimeMs !== right.mtimeMs) {
    return right.mtimeMs - left.mtimeMs;
  }
  return left.priority - right.priority;
}

function resolveManualRecordPath(manualRecordPath, manualRecordRoot) {
  if (!manualRecordStrategies.has(manualRecordPath)) {
    return {
      manualRecordPath,
      manualRecordSelection: null,
    };
  }

  const candidates = collectManualRecordCandidates(manualRecordRoot);
  const validCandidates = candidates.filter((candidate) => !candidate.parseError);
  const sortedCandidates = [...validCandidates].sort(
    manualRecordPath === "latest"
      ? compareManualRecordCandidatesForLatest
      : compareManualRecordCandidatesForBest
  );
  const selected = sortedCandidates[0] ?? null;
  return {
    manualRecordPath: selected ? relativeToRoot(selected.absolutePath) : null,
    manualRecordSelection: {
      strategy: manualRecordPath,
      root: manualRecordRoot ?? defaultManualRecordRoot,
      candidateCount: candidates.length,
      validCandidateCount: validCandidates.length,
      selectedRecordPath: selected ? relativeToRoot(selected.absolutePath) : null,
      selectedMissingEvidenceCount: selected?.missingEvidenceCount ?? null,
      selectedRequireCompletePassed: selected?.requireCompletePassed ?? false,
    },
  };
}

function buildManualEvidenceAudit({
  manualEvidenceReportPath,
  manualRecordSelection,
  manualRecord,
  manualRecordPath,
}) {
  const record = manualRecord ?? readManualRecord(manualRecordPath);
  if (!record) {
    return {
      status: "missing",
      recordPath: manualRecordPath ?? null,
      reportPath: null,
      requireCompletePassed: false,
      failures: ["人工证据记录缺失"],
      missingEvidenceCount: null,
      selection: manualRecordSelection ?? null,
      reportMarkdown: "",
    };
  }

  const recordPath = manualRecordPath ?? "manual-evidence-record";
  const validation = validateManualEvidenceRecord(record, {
    recordPath,
    requireComplete: true,
  });
  const report = buildManualEvidenceRecordReport(record, { recordPath });
  return {
    status: validation.failures.length === 0 ? "passed" : "failed",
    recordPath,
    reportPath: manualEvidenceReportPath ?? null,
    requireCompletePassed: validation.failures.length === 0,
    failures: validation.failures,
    missingEvidenceCount: report.missingEvidenceCount,
    statusCounts: report.statusCounts,
    globalGaps: report.globalGaps,
    incompleteItemCount: report.incompleteItems.length,
    selection: manualRecordSelection ?? null,
    reportMarkdown: report.markdown,
  };
}

function normalizeExternalKnowledgeStatus(status) {
  const value = status ?? "not_synced";
  if (!["not_synced", "synced", "partial", "unknown"].includes(value)) {
    throw new Error(
      `external knowledge status must be one of not_synced, synced, partial, unknown; got ${value}`
    );
  }
  return value;
}

function buildExternalKnowledgeSyncAudit(options = {}) {
  const syncEvidence = [
    ...(options.feishuSyncEvidence
      ? [{ target: "feishu", evidence: options.feishuSyncEvidence }]
      : []),
    ...(options.obsidianSyncEvidence
      ? [{ target: "obsidian", evidence: options.obsidianSyncEvidence }]
      : []),
  ];
  const status = normalizeExternalKnowledgeStatus(
    options.externalKnowledgeSynced ? "synced" : options.externalKnowledgeStatus
  );
  const sourceDraftPaths =
    options.externalKnowledgeSourceDraftPaths?.length > 0
      ? options.externalKnowledgeSourceDraftPaths
      : defaultExternalKnowledgeSourceDraftPaths;
  const targets =
    status === "synced"
      ? { feishu: "synced", obsidian: "synced" }
      : {
          feishu:
            options.feishuSyncEvidence || status === "synced"
              ? "synced"
              : status === "unknown"
                ? "unknown"
                : "not_synced",
          obsidian:
            options.obsidianSyncEvidence || status === "synced"
              ? "synced"
              : status === "unknown"
                ? "unknown"
                : "not_synced",
        };
  const finalDisclosureRequired = status !== "synced";
  return {
    status,
    sourceDraftsUpdated: sourceDraftPaths.length > 0,
    sourceDraftPaths,
    targets,
    syncEvidence,
    blocksProductCompletion: false,
    finalDisclosureRequired,
    finalDisclosure: finalDisclosureRequired
      ? "仓库已更新，外部知识库未同步"
      : "",
    note:
      options.externalKnowledgeNote ??
      (status === "synced"
        ? "已显式声明外部知识库完成同步。"
        : "未检测到本轮实际执行飞书或 Obsidian 同步命令；如未同步，最终回复必须明确说明。"),
  };
}

function markdownForAudit(audit) {
  const allCommandsPassed = audit.automatedCommands.every(
    (command) => command.status === "passed"
  );
  const manualRecordSelectionLines = audit.manualEvidence.selection
    ? [
        "",
        "### 人工证据记录选择",
        "",
        `- strategy: ${audit.manualEvidence.selection.strategy}`,
        `- root: ${audit.manualEvidence.selection.root}`,
        `- candidateCount: ${audit.manualEvidence.selection.candidateCount}`,
        `- validCandidateCount: ${
          audit.manualEvidence.selection.validCandidateCount ?? "unknown"
        }`,
        `- selectedRecordPath: ${
          audit.manualEvidence.selection.selectedRecordPath ?? "未选中"
        }`,
        `- selectedMissingEvidenceCount: ${
          audit.manualEvidence.selection.selectedMissingEvidenceCount ?? "unknown"
        }`,
        `- selectedRequireCompletePassed: ${
          audit.manualEvidence.selection.selectedRequireCompletePassed
        }`,
      ]
    : [];
  const lines = [
    "# AI 时间管理 Agent v1 completion audit",
    "",
    `- generatedAt: ${audit.generatedAt}`,
    `- verdict: ${audit.verdict}`,
    `- goalStatus: ${
      audit.verdict === "passed" ? "Goal 可以标记 complete" : "Goal 不能标记 complete"
    }`,
    "",
    "## 自动化命令",
    "",
    "| 命令 | 状态 | 证明范围 |",
    "| --- | --- | --- |",
    ...audit.automatedCommands.map(
      (command) =>
        `| \`${command.command}\` | ${command.status} | ${command.proves} |`
    ),
    "",
    "## 人工证据记录",
    "",
    `- status: ${audit.manualEvidence.status}`,
    `- recordPath: ${audit.manualEvidence.recordPath ?? "未提供"}`,
    `- reportPath: ${audit.manualEvidence.reportPath ?? "未生成"}`,
    `- requireCompletePassed: ${String(
      audit.manualEvidence.requireCompletePassed
    )}`,
    `- missingEvidenceCount: ${
      audit.manualEvidence.missingEvidenceCount ?? "unknown"
    }`,
    ...manualRecordSelectionLines,
    ...(audit.manualEvidence.failures.length > 0
      ? ["", "### 人工证据缺口", "", ...audit.manualEvidence.failures.map((failure) => `- ${failure}`)]
      : []),
    "",
    "## 外部知识库同步",
    "",
    `- status: ${audit.externalKnowledgeSync.status}`,
    `- sourceDraftsUpdated: ${String(
      audit.externalKnowledgeSync.sourceDraftsUpdated
    )}`,
    `- sourceDraftPaths: ${audit.externalKnowledgeSync.sourceDraftPaths.join(", ")}`,
    `- targets: feishu=${audit.externalKnowledgeSync.targets.feishu}, obsidian=${audit.externalKnowledgeSync.targets.obsidian}`,
    `- syncEvidence: ${
      audit.externalKnowledgeSync.syncEvidence.length > 0
        ? audit.externalKnowledgeSync.syncEvidence
            .map((item) => `${item.target}:${item.evidence}`)
            .join(", ")
        : "无"
    }`,
    `- blocksProductCompletion: ${String(
      audit.externalKnowledgeSync.blocksProductCompletion
    )}`,
    `- finalDisclosureRequired: ${String(
      audit.externalKnowledgeSync.finalDisclosureRequired
    )}`,
    `- finalDisclosure: ${
      audit.externalKnowledgeSync.finalDisclosure || "不需要"
    }`,
    `- note: ${audit.externalKnowledgeSync.note}`,
    "",
    "## 完成判定",
    "",
    allCommandsPassed
      ? "- 自动化命令全部通过。"
      : "- 自动化命令尚未全部通过或尚未运行。",
    audit.manualEvidence.requireCompletePassed
      ? "- 人工证据记录 completion 校验通过。"
      : "- 人工证据记录尚未通过 completion 校验。",
    audit.externalKnowledgeSync.finalDisclosureRequired
      ? "- 外部知识库未记录为已同步；最终回复必须明确说明“仓库已更新，外部知识库未同步”。"
      : "- 外部知识库已显式记录为已同步。",
    "",
    "## 下一步",
    "",
    "1. 如需正式收尾，使用 `--run-automated-commands` 重新运行自动化命令。",
    "2. 提供补证后的 `--manual-record <path>`，或用 `--manual-record best --manual-record-root .tmp/ios-acceptance-evidence` 自动选择候选，并确保 `--require-complete` 校验通过。",
    "3. 将本 audit 产物、人工证据记录和 `manual-evidence-gaps.md` 一起归档。"
  ];
  return `${lines.join("\n")}\n`;
}

export function buildV1CompletionAudit(options = {}) {
  const commandResults = options.commandResults ?? new Map();
  const resolvedManualRecord = resolveManualRecordPath(
    options.manualRecordPath,
    options.manualRecordRoot
  );
  const automatedCommands = requiredAutomatedCommands.map((commandSpec) => ({
    ...commandSpec,
    ...normalizeCommandResult(
      commandSpec,
      resultForScript(commandResults, commandSpec.script)
    ),
  }));
  const manualEvidence = buildManualEvidenceAudit({
    manualEvidenceReportPath: options.manualEvidenceReportPath,
    manualRecordSelection: resolvedManualRecord.manualRecordSelection,
    manualRecord: options.manualRecord,
    manualRecordPath: resolvedManualRecord.manualRecordPath,
  });
  const externalKnowledgeSync = buildExternalKnowledgeSyncAudit({
    externalKnowledgeNote: options.externalKnowledgeNote,
    externalKnowledgeSourceDraftPaths: options.externalKnowledgeSourceDraftPaths,
    externalKnowledgeStatus: options.externalKnowledgeStatus,
    externalKnowledgeSynced: options.externalKnowledgeSynced,
    feishuSyncEvidence: options.feishuSyncEvidence,
    obsidianSyncEvidence: options.obsidianSyncEvidence,
  });
  const automatedPassed = automatedCommands.every(
    (command) => command.status === "passed"
  );
  const verdict =
    automatedPassed && manualEvidence.requireCompletePassed ? "passed" : "not_complete";
  const audit = {
    schemaVersion: 1,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    verdict,
    automatedCommands,
    manualEvidence,
    externalKnowledgeSync,
  };
  return {
    ...audit,
    markdown: markdownForAudit(audit),
  };
}

function runCommand(commandSpec) {
  const startedAt = Date.now();
  const command = commandSpec.command ?? `pnpm ${commandSpec.script}`;
  const args = commandSpec.command
    ? commandSpec.command.split(" ").slice(1)
    : [commandSpec.script];
  const binary = commandSpec.command ? commandSpec.command.split(" ")[0] : "pnpm";
  const result = spawnSync(binary, args, {
    cwd: rootDir,
    encoding: "utf8",
  });
  return {
    command,
    status: result.status === 0 ? "passed" : "failed",
    exitCode: result.status,
    durationMs: Date.now() - startedAt,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? result.error?.message ?? "",
  };
}

export function writeV1CompletionAudit(options = {}) {
  const outputDir =
    options.outputDir ??
    path.join(".tmp", "v1-completion-audit", timestampForPath());
  fs.mkdirSync(outputDir, { recursive: true });

  let commandResults = options.commandResults;
  if (options.runAutomatedCommands) {
    commandResults = new Map(
      requiredAutomatedCommands.map((command) => [
        command.script,
        runCommand(command),
      ])
    );
  }

  const manualEvidenceReportPath =
    options.manualRecord || options.manualRecordPath ? "manual-evidence-gaps.md" : null;
  const audit = buildV1CompletionAudit({
    commandResults,
    generatedAt: options.generatedAt,
    manualEvidenceReportPath,
    manualRecord: options.manualRecord,
    manualRecordPath: options.manualRecordPath,
    manualRecordRoot: options.manualRecordRoot,
    externalKnowledgeNote: options.externalKnowledgeNote,
    externalKnowledgeSourceDraftPaths: options.externalKnowledgeSourceDraftPaths,
    externalKnowledgeStatus: options.externalKnowledgeStatus,
    externalKnowledgeSynced: options.externalKnowledgeSynced,
    feishuSyncEvidence: options.feishuSyncEvidence,
    obsidianSyncEvidence: options.obsidianSyncEvidence,
  });
  const jsonPath = path.join(outputDir, "v1-completion-audit.json");
  const markdownPath = path.join(outputDir, "v1-completion-audit.md");
  const absoluteManualEvidenceReportPath = manualEvidenceReportPath
    ? path.join(outputDir, manualEvidenceReportPath)
    : null;
  if (absoluteManualEvidenceReportPath && audit.manualEvidence.reportMarkdown) {
    fs.writeFileSync(
      absoluteManualEvidenceReportPath,
      audit.manualEvidence.reportMarkdown
    );
  }
  fs.writeFileSync(jsonPath, `${JSON.stringify(audit, null, 2)}\n`);
  fs.writeFileSync(markdownPath, audit.markdown);
  return {
    audit,
    jsonPath,
    manualEvidenceReportPath:
      absoluteManualEvidenceReportPath && audit.manualEvidence.reportMarkdown
        ? absoluteManualEvidenceReportPath
        : null,
    markdownPath,
  };
}

function parseArgs(argv) {
  const args = {
    outputDir: process.env.AI_CODE_V1_COMPLETION_AUDIT_DIR,
    manualRecordPath: process.env.AI_CODE_V1_COMPLETION_MANUAL_RECORD,
    manualRecordRoot:
      process.env.AI_CODE_V1_COMPLETION_MANUAL_RECORD_ROOT ??
      defaultManualRecordRoot,
    runAutomatedCommands:
      process.env.AI_CODE_V1_COMPLETION_RUN_AUTOMATED_COMMANDS === "1",
    externalKnowledgeSynced:
      process.env.AI_CODE_EXTERNAL_KNOWLEDGE_SYNCED === "1",
    externalKnowledgeNote: process.env.AI_CODE_EXTERNAL_KNOWLEDGE_NOTE,
    externalKnowledgeStatus: process.env.AI_CODE_EXTERNAL_KNOWLEDGE_STATUS,
    externalKnowledgeSourceDraftPaths: process.env.AI_CODE_EXTERNAL_KNOWLEDGE_SOURCE_DRAFTS
      ? process.env.AI_CODE_EXTERNAL_KNOWLEDGE_SOURCE_DRAFTS.split(",").filter(Boolean)
      : [],
    feishuSyncEvidence: process.env.AI_CODE_FEISHU_SYNC_EVIDENCE,
    obsidianSyncEvidence: process.env.AI_CODE_OBSIDIAN_SYNC_EVIDENCE,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--") {
      continue;
    } else if (arg === "--output-dir") {
      args.outputDir = argv[index + 1];
      index += 1;
    } else if (arg === "--manual-record") {
      args.manualRecordPath = argv[index + 1];
      index += 1;
    } else if (arg === "--manual-record-root") {
      args.manualRecordRoot = argv[index + 1];
      index += 1;
    } else if (arg === "--run-automated-commands") {
      args.runAutomatedCommands = true;
    } else if (arg === "--external-knowledge-synced") {
      args.externalKnowledgeSynced = true;
    } else if (arg === "--external-knowledge-status") {
      args.externalKnowledgeStatus = argv[index + 1];
      index += 1;
    } else if (arg === "--source-draft") {
      args.externalKnowledgeSourceDraftPaths.push(argv[index + 1]);
      index += 1;
    } else if (arg === "--feishu-sync-evidence") {
      args.feishuSyncEvidence = argv[index + 1];
      index += 1;
    } else if (arg === "--obsidian-sync-evidence") {
      args.obsidianSyncEvidence = argv[index + 1];
      index += 1;
    } else if (arg === "--external-knowledge-note") {
      args.externalKnowledgeNote = argv[index + 1];
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function printUsage() {
  console.log(`Usage:
  node scripts/collect-v1-completion-audit.mjs [--output-dir <dir>] [--manual-record <path>]
  node scripts/collect-v1-completion-audit.mjs --run-automated-commands --manual-record <path|best|latest> [--manual-record-root <dir>]
  node scripts/collect-v1-completion-audit.mjs --external-knowledge-status not_synced|synced|partial|unknown
  node scripts/collect-v1-completion-audit.mjs --external-knowledge-synced --external-knowledge-note <text>

Default mode writes an audit checklist without running heavy automated commands.
Use --run-automated-commands only for a formal completion audit.`);
}

function runCli() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`v1 completion audit failed: ${error.message}`);
    process.exit(1);
  }
  if (args.help) {
    printUsage();
    return;
  }
  const result = writeV1CompletionAudit(args);
  console.log(`v1 completion audit written to ${result.markdownPath}`);
  if (result.audit.verdict !== "passed") {
    process.exitCode = 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}
