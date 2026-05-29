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

function buildManualEvidenceAudit({
  manualEvidenceReportPath,
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
    reportMarkdown: report.markdown,
  };
}

function markdownForAudit(audit) {
  const allCommandsPassed = audit.automatedCommands.every(
    (command) => command.status === "passed"
  );
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
    ...(audit.manualEvidence.failures.length > 0
      ? ["", "### 人工证据缺口", "", ...audit.manualEvidence.failures.map((failure) => `- ${failure}`)]
      : []),
    "",
    "## 完成判定",
    "",
    allCommandsPassed
      ? "- 自动化命令全部通过。"
      : "- 自动化命令尚未全部通过或尚未运行。",
    audit.manualEvidence.requireCompletePassed
      ? "- 人工证据记录 completion 校验通过。"
      : "- 人工证据记录尚未通过 completion 校验。",
    "",
    "## 下一步",
    "",
    "1. 如需正式收尾，使用 `--run-automated-commands` 重新运行自动化命令。",
    "2. 提供补证后的 `--manual-record <path>`，并确保 `--require-complete` 校验通过。",
    "3. 将本 audit 产物、人工证据记录和 `manual-evidence-gaps.md` 一起归档。"
  ];
  return `${lines.join("\n")}\n`;
}

export function buildV1CompletionAudit(options = {}) {
  const commandResults = options.commandResults ?? new Map();
  const automatedCommands = requiredAutomatedCommands.map((commandSpec) => ({
    ...commandSpec,
    ...normalizeCommandResult(
      commandSpec,
      resultForScript(commandResults, commandSpec.script)
    ),
  }));
  const manualEvidence = buildManualEvidenceAudit({
    manualEvidenceReportPath: options.manualEvidenceReportPath,
    manualRecord: options.manualRecord,
    manualRecordPath: options.manualRecordPath,
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
    runAutomatedCommands:
      process.env.AI_CODE_V1_COMPLETION_RUN_AUTOMATED_COMMANDS === "1",
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
    } else if (arg === "--run-automated-commands") {
      args.runAutomatedCommands = true;
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
  node scripts/collect-v1-completion-audit.mjs --run-automated-commands --manual-record <path>

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
