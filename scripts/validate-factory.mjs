import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const failures = [];

const requiredDirectories = [
  "ai-factory/agents",
  "ai-factory/design-system",
  "ai-factory/memory",
  "ai-factory/playbooks",
  "ai-factory/prompts",
  "ai-factory/specs",
  "ai-factory/workflows",
  "contracts/design",
  "contracts/memory",
  "contracts/requirements",
  "contracts/workflow",
  "docs/knowledge-sync",
];

const requiredFiles = [
  "docs/conventions/phase-gates.md",
  "docs/conventions/release-and-tags.md",
  "docs/conventions/spec-lifecycle.md",
  "docs/conventions/memory-lifecycle.md",
  "docs/knowledge-sync/sync-checklist.md",
  "docs/knowledge-sync/content-boundaries.md",
  "docs/knowledge-sync/external-reference-policy.md",
  "docs/knowledge-sync/feishu-index.md",
  "ai-factory/workflows/templates/workflow-run-template.md",
  "ai-factory/workflows/runs/README.md",
  "ai-factory/memory/templates/memory-note-template.md",
  "ai-factory/memory/templates/memory-review-template.md",
  "ai-factory/memory/index.md",
  "contracts/requirements/requirement-record.schema.json",
  "contracts/design/design-brief.schema.json",
];

const workflowDefinitions = [
  "idea-to-product-understanding",
  "requirement-capture",
  "prd-draft",
  "memory-review",
  "process-audit",
  "spec-to-implementation-plan",
];

const requiredPrompts = [
  "ai-factory/prompts/workflows/product-understanding.prompt.md",
  "ai-factory/prompts/tasks/requirement-capture.prompt.md",
  "ai-factory/prompts/workflows/spec-to-plan.prompt.md",
  "ai-factory/prompts/workflows/memory-review.prompt.md",
  "ai-factory/prompts/evaluation/process-audit.prompt.md",
  "ai-factory/prompts/evaluation/review.prompt.md",
];

const requiredPlaybooks = [
  "ai-factory/playbooks/feature-development/README.md",
  "ai-factory/playbooks/bugfix/README.md",
  "ai-factory/playbooks/review/README.md",
  "ai-factory/playbooks/release/README.md",
];

const requiredAgentDefinitions = [
  "product-synthesizer",
  "process-auditor",
  "spec-planner",
  "design-system-curator",
  "implementation-worker",
  "reviewer",
];

function reportFailure(filePath, message) {
  failures.push(`${filePath}: ${message}`);
}

function absolutePath(relativePath) {
  return path.join(rootDir, relativePath);
}

function readText(relativePath) {
  const filePath = absolutePath(relativePath);
  if (!fs.existsSync(filePath)) {
    reportFailure(relativePath, "file is missing");
    return undefined;
  }

  return fs.readFileSync(filePath, "utf8");
}

function assertDirectory(relativePath) {
  const filePath = absolutePath(relativePath);
  if (!fs.existsSync(filePath)) {
    reportFailure(relativePath, "directory is missing");
    return;
  }

  if (!fs.statSync(filePath).isDirectory()) {
    reportFailure(relativePath, "path exists but is not a directory");
  }
}

function assertFile(relativePath) {
  const filePath = absolutePath(relativePath);
  if (!fs.existsSync(filePath)) {
    reportFailure(relativePath, "file is missing");
    return;
  }

  if (!fs.statSync(filePath).isFile()) {
    reportFailure(relativePath, "path exists but is not a file");
  }
}

function assertSections(relativePath, requiredSections) {
  const content = readText(relativePath);
  if (content === undefined) {
    return;
  }

  for (const section of requiredSections) {
    if (!content.includes(section)) {
      reportFailure(relativePath, `missing section "${section}"`);
    }
  }
}

function assertJsonFile(relativePath, requiredFields) {
  const content = readText(relativePath);
  if (content === undefined) {
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    reportFailure(relativePath, `invalid JSON: ${error.message}`);
    return;
  }

  for (const field of requiredFields) {
    if (!Object.hasOwn(parsed, field)) {
      reportFailure(relativePath, `missing field "${field}"`);
    }
  }
}

function assertPrompt(relativePath) {
  assertSections(relativePath, [
    "## 目的",
    "## 输入",
    "## 输出",
    "## 确认规则",
    "## 失败处理",
  ]);
}

function assertPlaybook(relativePath) {
  assertSections(relativePath, [
    "## 适用场景",
    "## 步骤",
    "## 检查清单",
    "## 产出",
  ]);
}

function assertWorkflow(workflowId) {
  const markdownPath = `ai-factory/workflows/${workflowId}.md`;
  const manifestPath = `ai-factory/workflows/registries/${workflowId}.manifest.json`;

  assertJsonFile(manifestPath, [
    "id",
    "name",
    "owner",
    "trigger",
    "execution",
    "discovery",
    "source",
    "inputs",
    "outputs",
    "states",
    "memoryDomains",
    "humanReviewRequired",
  ]);

  const manifest = readText(manifestPath);
  if (manifest !== undefined) {
    try {
      const parsed = JSON.parse(manifest);
      if (parsed.id !== workflowId) {
        reportFailure(manifestPath, `id must be "${workflowId}"`);
      }
    } catch {
      // The JSON parse failure is reported by assertJsonFile.
    }
  }

  assertSections(markdownPath, [
    "## 工作流声明",
    "## 输入",
    "## 输出",
    "## 状态转换",
    "## 人工确认点",
    "## 失败处理",
  ]);
}

function assertMemoryNote(relativePath) {
  assertSections(relativePath, ["## 记忆类型", "- domain:", "- status:"]);
}

for (const directory of requiredDirectories) {
  assertDirectory(directory);
}

for (const filePath of requiredFiles) {
  assertFile(filePath);
}

for (const workflowId of workflowDefinitions) {
  assertWorkflow(workflowId);
}

for (const promptPath of requiredPrompts) {
  assertPrompt(promptPath);
}

for (const playbookPath of requiredPlaybooks) {
  assertPlaybook(playbookPath);
}

for (const agentId of requiredAgentDefinitions) {
  assertFile(`ai-factory/agents/definitions/${agentId}.md`);
}

assertMemoryNote("ai-factory/memory/durable/architecture/current-state.md");
assertMemoryNote("ai-factory/memory/durable/decisions/phase-strategy.md");
assertMemoryNote(
  "ai-factory/memory/working/tasks/ai-factory-spec-to-plan-workflow.md",
);
assertMemoryNote("ai-factory/memory/working/tasks/factory-status-panel-v1.md");

assertJsonFile("contracts/requirements/requirement-record.schema.json", [
  "$schema",
  "$id",
  "title",
  "type",
  "required",
  "properties",
]);
assertJsonFile("contracts/design/design-brief.schema.json", [
  "$schema",
  "$id",
  "title",
  "type",
  "required",
  "properties",
]);

if (failures.length > 0) {
  console.error("Factory validation failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Factory validation passed.");
