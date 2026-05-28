import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const requiredFiles = [
  "ai-factory/memory/working/active-context/current-project-state.md",
  "ai-factory/memory/index.md",
  "ai-factory/memory/durable/decisions/phase-strategy.md",
  "docs/knowledge-sync/sync-checklist.md",
  "docs/knowledge-sync/feishu-pages/03-evolution-log.md",
  "docs/knowledge-sync/feishu-pages/05-ai-workflow-collaboration.md",
];

function createFileAccess(rootDir) {
  return {
    exists(relativePath) {
      return fs.existsSync(path.join(rootDir, relativePath));
    },
    readText(relativePath) {
      return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
    },
  };
}

function readRequiredText(relativePath, files, failures) {
  if (!files.exists(relativePath)) {
    failures.push(`${relativePath}: file is missing`);
    return undefined;
  }

  return files.readText(relativePath);
}

function requireIncludes(content, relativePath, needle, message, failures) {
  if (!content.includes(needle)) {
    failures.push(`${relativePath}: ${message}`);
  }
}

export function validateContextSync(
  rootDir,
  fileAccess = createFileAccess(rootDir),
) {
  const failures = [];

  const texts = new Map();
  for (const relativePath of requiredFiles) {
    const content = readRequiredText(relativePath, fileAccess, failures);
    if (content !== undefined) {
      texts.set(relativePath, content);
    }
  }

  const memoryIndex = texts.get("ai-factory/memory/index.md");
  if (memoryIndex !== undefined) {
    requireIncludes(
      memoryIndex,
      "ai-factory/memory/index.md",
      "ai-factory/memory/working/active-context/current-project-state.md",
      "missing active context entry for current-project-state.md",
      failures,
    );
    requireIncludes(
      memoryIndex,
      "ai-factory/memory/index.md",
      "ai-factory/memory/durable/decisions/phase-strategy.md",
      "missing durable decision entry for phase-strategy.md",
      failures,
    );
  }

  const currentState = texts.get(
    "ai-factory/memory/working/active-context/current-project-state.md",
  );
  if (currentState !== undefined) {
    requireIncludes(
      currentState,
      "ai-factory/memory/working/active-context/current-project-state.md",
      "## 知识同步状态",
      "missing knowledge sync status section",
      failures,
    );
    requireIncludes(
      currentState,
      "ai-factory/memory/working/active-context/current-project-state.md",
      "不是自动",
      "must state that external knowledge bases are not automatic",
      failures,
    );
  }

  const phaseStrategy = texts.get(
    "ai-factory/memory/durable/decisions/phase-strategy.md",
  );
  if (phaseStrategy !== undefined) {
    requireIncludes(
      phaseStrategy,
      "ai-factory/memory/durable/decisions/phase-strategy.md",
      "lastReviewed: 2026-05-23",
      "phase strategy must be reviewed on 2026-05-23",
      failures,
    );
    requireIncludes(
      phaseStrategy,
      "ai-factory/memory/durable/decisions/phase-strategy.md",
      "受控产品开发",
      "phase strategy must describe controlled product development",
      failures,
    );
  }

  const syncChecklist = texts.get("docs/knowledge-sync/sync-checklist.md");
  if (syncChecklist !== undefined) {
    requireIncludes(
      syncChecklist,
      "docs/knowledge-sync/sync-checklist.md",
      "pnpm validate:context-sync",
      "missing context sync validation command",
      failures,
    );
    requireIncludes(
      syncChecklist,
      "docs/knowledge-sync/sync-checklist.md",
      "不能说“外部知识库已同步”",
      "must forbid claiming external sync without evidence",
      failures,
    );
  }

  const evolutionLog = texts.get(
    "docs/knowledge-sync/feishu-pages/03-evolution-log.md",
  );
  if (evolutionLog !== undefined) {
    requireIncludes(
      evolutionLog,
      "docs/knowledge-sync/feishu-pages/03-evolution-log.md",
      "阶段 26：新窗口上下文恢复协议",
      "missing latest context recovery phase record",
      failures,
    );
  }

  const workflowPage = texts.get(
    "docs/knowledge-sync/feishu-pages/05-ai-workflow-collaboration.md",
  );
  if (workflowPage !== undefined) {
    requireIncludes(
      workflowPage,
      "docs/knowledge-sync/feishu-pages/05-ai-workflow-collaboration.md",
      "外部知识库不是自动同步",
      "must explain that external knowledge bases are not automatic",
      failures,
    );
  }

  return { failures };
}

function runCli() {
  const result = validateContextSync(process.cwd());
  if (result.failures.length > 0) {
    console.error("Context sync validation failed:");
    for (const failure of result.failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("Context sync validation passed.");
}

const currentFilePath = fileURLToPath(import.meta.url);
if (process.argv[1] === currentFilePath) {
  runCli();
}
