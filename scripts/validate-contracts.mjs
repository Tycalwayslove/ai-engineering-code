import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();

const contractFiles = {
  openapi: "contracts/openapi/api-gateway.yaml",
  memorySchema: "contracts/memory/memory-document.schema.json",
  workflowSchema: "contracts/workflow/workflow-manifest.schema.json",
  hybridBridgeSchema:
    "contracts/hybrid-bridge/native-bridge-message.schema.json",
  sdk: "packages/sdk/src/index.ts",
  sharedTypes: "packages/shared-types/src/index.ts",
};

const expectedOperations = {
  cancelCalendarEvent: "cancelCalendarEvent",
  cancelExpense: "cancelExpense",
  cancelReminder: "cancelReminder",
  confirmExecutionPlan: "confirmExecutionPlan",
  completeReminder: "completeReminder",
  getAgentConversationDebug: "getAgentConversationDebug",
  getAgentConversationTurns: "getAgentConversationTurns",
  getAgentPendingConfirmations: "getAgentPendingConfirmations",
  getCalendarEvents: "getCalendarEvents",
  getExecutionLedger: "getExecutionLedger",
  getExecutionPlan: "getExecutionPlan",
  getExpenses: "getExpenses",
  getFactoryStatus: "getFactoryStatus",
  getHealth: "getHealth",
  getReminders: "getReminders",
  getVersion: "getVersion",
  intakeAttachment: "intakeAttachment",
  listAttachments: "getAttachments",
  rejectExecutionPlan: "rejectExecutionPlan",
  submitAgentTurn: "submitAgentTurn",
  submitExpense: "submitExpense",
  updateCalendarEvent: "updateCalendarEvent",
  updateExpense: "updateExpense",
  updateReminder: "updateReminder",
  uploadAttachment: "uploadAttachment",
};

const directMutationOperations = [
  ["patch", "/calendar/events/{id}", "updateCalendarEvent"],
  ["post", "/calendar/events/{id}/cancel", "cancelCalendarEvent"],
  ["patch", "/expenses/{id}", "updateExpense"],
  ["post", "/expenses/{id}/submit", "submitExpense"],
  ["post", "/expenses/{id}/cancel", "cancelExpense"],
  ["patch", "/reminders/{id}", "updateReminder"],
  ["post", "/reminders/{id}/complete", "completeReminder"],
  ["post", "/reminders/{id}/cancel", "cancelReminder"],
];

const expectedFactoryCapabilityFields = [
  "id",
  "label",
  "status",
  "source",
  "summary",
];

const expectedFactoryStatusFields = [
  "name",
  "status",
  "version",
  "capabilities",
  "nextActions",
];

const expectedExecutionPlanFields = [
  "id",
  "conversationId",
  "status",
  "riskLevel",
  "summary",
  "decisionTraceId",
  "actions",
];

const expectedDomainActionTypes = [
  "calendar.cancel_event",
  "calendar.create_event",
  "calendar.query_events",
  "calendar.update_event",
  "expense.cancel_reimbursement",
  "expense.create_reimbursement_draft",
  "expense.submit_reimbursement",
  "expense.update_reimbursement",
  "reminder.cancel_reminder",
  "reminder.complete_reminder",
  "reminder.create_reminder",
  "reminder.update_reminder",
];

const failures = [];

function reportFailure(filePath, message) {
  failures.push(`${filePath}: ${message}`);
}

function readRequiredFile(relativePath) {
  const absolutePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(absolutePath)) {
    reportFailure(relativePath, "file is missing");
    return undefined;
  }

  const stat = fs.statSync(absolutePath);
  if (!stat.isFile()) {
    reportFailure(relativePath, "path exists but is not a file");
    return undefined;
  }

  return fs.readFileSync(absolutePath, "utf8");
}

function stripYamlComment(line) {
  let quote = null;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const previous = line[index - 1];

    if ((character === `"` || character === `'`) && previous !== "\\") {
      quote = quote === character ? null : (quote ?? character);
    }

    if (character === "#" && quote === null) {
      return line.slice(0, index);
    }
  }

  return line;
}

function splitInlineArray(rawValue) {
  const value = rawValue.trim();
  const inner = value.slice(1, -1).trim();
  if (inner === "") {
    return [];
  }

  const values = [];
  let quote = null;
  let start = 0;

  for (let index = 0; index < inner.length; index += 1) {
    const character = inner[index];
    const previous = inner[index - 1];

    if ((character === `"` || character === `'`) && previous !== "\\") {
      quote = quote === character ? null : (quote ?? character);
    }

    if (character === "," && quote === null) {
      values.push(parseYamlScalar(inner.slice(start, index)));
      start = index + 1;
    }
  }

  values.push(parseYamlScalar(inner.slice(start)));
  return values;
}

function unquoteYamlString(value) {
  const trimmed = value.trim();
  const first = trimmed[0];
  const last = trimmed.at(-1);

  if ((first === `"` && last === `"`) || (first === `'` && last === `'`)) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parseYamlScalar(rawValue) {
  const value = rawValue.trim();

  if (value.startsWith("[") && value.endsWith("]")) {
    return splitInlineArray(value);
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  if (value === "null" || value === "~") {
    return null;
  }

  return unquoteYamlString(value);
}

function setStackContainer(stackEntry, container) {
  if (stackEntry.parent !== undefined && stackEntry.key !== undefined) {
    stackEntry.parent.value[stackEntry.key] = container;
  }
  stackEntry.value = container;
  return container;
}

function parseSimpleYamlObject(text, filePath) {
  const root = {};
  const stack = [{ indent: -1, value: root }];

  text.split(/\r?\n/).forEach((rawLine, lineIndex) => {
    const lineNumber = lineIndex + 1;

    if (rawLine.includes("\t")) {
      throw new Error(
        `line ${lineNumber}: tabs are not allowed in this validator`,
      );
    }

    const withoutComment = stripYamlComment(rawLine);
    if (withoutComment.trim() === "") {
      return;
    }

    const indent = withoutComment.match(/^ */)[0].length;
    if (indent % 2 !== 0) {
      throw new Error(
        `line ${lineNumber}: indentation must use two-space steps`,
      );
    }

    const line = withoutComment.trimEnd();
    const trimmed = line.trimStart();

    while (indent <= stack.at(-1).indent) {
      stack.pop();
    }

    const parent = stack.at(-1);
    if (indent > parent.indent + 2) {
      throw new Error(
        `line ${lineNumber}: indentation jumps more than one level`,
      );
    }

    if (trimmed.startsWith("- ")) {
      const rawItem = trimmed.slice(2).trim();
      const sequence = Array.isArray(parent.value)
        ? parent.value
        : setStackContainer(parent, []);

      const mappingMatch = rawItem.match(/^(.+?):(?:\s+(.*))?$/);
      if (!mappingMatch) {
        sequence.push(parseYamlScalar(rawItem));
        return;
      }

      const key = unquoteYamlString(mappingMatch[1]);
      const rawValue = mappingMatch[2];
      const item = {};
      sequence.push(item);

      if (rawValue === undefined) {
        const child = {};
        item[key] = child;
        stack.push({ indent, value: item });
        stack.push({
          indent: indent + 2,
          value: child,
          parent: { value: item },
          key,
        });
        return;
      }

      item[key] = parseYamlScalar(rawValue);
      stack.push({ indent, value: item });
      return;
    }

    const match = trimmed.match(/^(.+?):(?:\s+(.*))?$/);
    if (!match) {
      throw new Error(`line ${lineNumber}: expected a key/value mapping`);
    }

    const key = unquoteYamlString(match[1]);
    const rawValue = match[2];
    const parentValue = parent.value;
    if (
      typeof parentValue !== "object" ||
      parentValue === null ||
      Array.isArray(parentValue)
    ) {
      throw new Error(`line ${lineNumber}: mapping parent must be an object`);
    }

    if (Object.hasOwn(parentValue, key)) {
      throw new Error(`line ${lineNumber}: duplicate key "${key}"`);
    }

    if (rawValue === undefined) {
      const child = {};
      parentValue[key] = child;
      stack.push({ indent, value: child, parent, key });
      return;
    }

    parentValue[key] = parseYamlScalar(rawValue);
  });

  if (Object.keys(root).length === 0) {
    throw new Error(`${filePath}: document is empty`);
  }

  return root;
}

function assertObject(value, label) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function validateJsonSchema(relativePath) {
  const content = readRequiredFile(relativePath);
  if (content === undefined) {
    return;
  }

  try {
    const schema = JSON.parse(content);
    assertObject(schema, "schema root");

    for (const requiredKey of ["$schema", "title", "type", "properties"]) {
      if (!Object.hasOwn(schema, requiredKey)) {
        throw new Error(`missing required schema key "${requiredKey}"`);
      }
    }

    assertObject(schema.properties, "schema properties");
    if (relativePath === contractFiles.hybridBridgeSchema) {
      validateHybridBridgePayloadSchemas(relativePath, schema);
    }
    console.log(`ok - ${relativePath} parses as JSON Schema document`);
  } catch (error) {
    reportFailure(relativePath, error.message);
  }
}

function validateHybridBridgePayloadSchemas(relativePath, schema) {
  const conditionalSchemas = Array.isArray(schema.allOf) ? schema.allOf : [];
  const calendarSchema = conditionalSchemas.find(
    (entry) =>
      entry?.if?.properties?.type?.const === "calendar.events.sync",
  );
  const reminderSchema = conditionalSchemas.find(
    (entry) =>
      entry?.if?.properties?.type?.const === "notifications.reminders.sync",
  );

  const calendarEventRequired =
    calendarSchema?.then?.properties?.payload?.properties?.events?.items
      ?.required;
  assertArrayIncludesAll(
    relativePath,
    "calendar.events.sync.payload.events[].required",
    calendarEventRequired,
    ["id", "title", "startAt", "endAt", "timezone", "status", "sourceActionId"],
  );

  const reminderRequired =
    reminderSchema?.then?.properties?.payload?.properties?.reminders?.items
      ?.required;
  assertArrayIncludesAll(
    relativePath,
    "notifications.reminders.sync.payload.reminders[].required",
    reminderRequired,
    ["id", "title", "dueAt", "status"],
  );
}

function validateOpenApiYaml(relativePath) {
  const content = readRequiredFile(relativePath);
  if (content === undefined) {
    return;
  }

  try {
    const document = parseSimpleYamlObject(content, relativePath);

    if (
      typeof document.openapi !== "string" ||
      document.openapi.trim() === ""
    ) {
      throw new Error('missing string top-level key "openapi"');
    }

    assertObject(document.info, "top-level info");
    assertObject(document.paths, "top-level paths");

    if (
      typeof document.info.title !== "string" ||
      document.info.title.trim() === ""
    ) {
      throw new Error('missing string key "info.title"');
    }

    if (
      typeof document.info.version !== "string" ||
      document.info.version.trim() === ""
    ) {
      throw new Error('missing string key "info.version"');
    }

    console.log(
      `ok - ${relativePath} parses as lightweight YAML and has OpenAPI roots`,
    );
    return document;
  } catch (error) {
    reportFailure(relativePath, error.message);
    return undefined;
  }
}

function getPathValue(document, pathSegments) {
  return pathSegments.reduce((value, segment) => {
    if (typeof value !== "object" || value === null) {
      return undefined;
    }

    return value[segment];
  }, document);
}

function assertArrayIncludesAll(filePath, label, value, expectedValues) {
  if (!Array.isArray(value)) {
    reportFailure(filePath, `${label} must be an array`);
    return;
  }

  for (const expectedValue of expectedValues) {
    if (!value.includes(expectedValue)) {
      reportFailure(filePath, `${label} is missing "${expectedValue}"`);
    }
  }
}

function validateFactoryStatusSlice(openapiDocument) {
  if (openapiDocument === undefined) {
    return;
  }

  const failureCountBeforeSlice = failures.length;
  const sdkSource = readRequiredFile(contractFiles.sdk);
  const sharedTypesSource = readRequiredFile(contractFiles.sharedTypes);
  const openapiText = fs.readFileSync(
    path.join(rootDir, contractFiles.openapi),
    "utf8",
  );

  for (const [operationId, sdkMethod] of Object.entries(expectedOperations)) {
    if (!openapiText.includes(`operationId: ${operationId}`)) {
      reportFailure(
        contractFiles.openapi,
        `missing operationId "${operationId}"`,
      );
    }

    if (sdkSource !== undefined && !sdkSource.includes(`async ${sdkMethod}(`)) {
      reportFailure(contractFiles.sdk, `missing SDK method "${sdkMethod}"`);
    }
  }

  for (const [method, pathName, operationId] of directMutationOperations) {
    const parameters = getPathValue(openapiDocument, [
      "paths",
      pathName,
      method,
      "parameters",
    ]);
    const conversationParam = Array.isArray(parameters)
      ? parameters.find(
          (parameter) =>
            parameter !== null &&
            typeof parameter === "object" &&
            parameter.name === "conversationId" &&
            parameter.in === "query",
        )
      : undefined;
    if (conversationParam?.required !== true) {
      reportFailure(
        contractFiles.openapi,
        `${operationId} must require query parameter "conversationId"`,
      );
    }
  }

  for (const [, , sdkMethod] of directMutationOperations) {
    const methodIndex =
      sdkSource === undefined ? -1 : sdkSource.indexOf(`async ${sdkMethod}(`);
    const nextMethodIndex =
      methodIndex < 0 || sdkSource === undefined
        ? -1
        : sdkSource.indexOf("\n  async ", methodIndex + 1);
    const methodSource =
      methodIndex < 0 || sdkSource === undefined
        ? ""
        : sdkSource.slice(
            methodIndex,
            nextMethodIndex > methodIndex ? nextMethodIndex : undefined,
          );
    if (!methodSource.includes("conversationId: string")) {
      reportFailure(
        contractFiles.sdk,
        `${sdkMethod} must require conversationId: string`,
      );
    }
  }

  const capabilityRequired = getPathValue(openapiDocument, [
    "components",
    "schemas",
    "FactoryCapability",
    "required",
  ]);
  assertArrayIncludesAll(
    contractFiles.openapi,
    "FactoryCapability.required",
    capabilityRequired,
    expectedFactoryCapabilityFields,
  );

  const statusRequired = getPathValue(openapiDocument, [
    "components",
    "schemas",
    "FactoryStatus",
    "required",
  ]);
  assertArrayIncludesAll(
    contractFiles.openapi,
    "FactoryStatus.required",
    statusRequired,
    expectedFactoryStatusFields,
  );

  const executionPlanRequired = getPathValue(openapiDocument, [
    "components",
    "schemas",
    "ExecutionPlan",
    "required",
  ]);
  assertArrayIncludesAll(
    contractFiles.openapi,
    "ExecutionPlan.required",
    executionPlanRequired,
    expectedExecutionPlanFields,
  );

  const domainActionTypeEnum = getPathValue(openapiDocument, [
    "components",
    "schemas",
    "DomainAction",
    "properties",
    "actionType",
    "enum",
  ]);
  assertArrayIncludesAll(
    contractFiles.openapi,
    "DomainAction.actionType.enum",
    domainActionTypeEnum,
    expectedDomainActionTypes,
  );

  const debugPendingActionTypeEnum = getPathValue(openapiDocument, [
    "components",
    "schemas",
    "AgentDebugPendingClarification",
    "properties",
    "actionType",
    "enum",
  ]);
  assertArrayIncludesAll(
    contractFiles.openapi,
    "AgentDebugPendingClarification.actionType.enum",
    debugPendingActionTypeEnum,
    expectedDomainActionTypes,
  );

  if (sharedTypesSource === undefined) {
    return;
  }

  for (const field of [
    ...expectedFactoryCapabilityFields,
    ...expectedFactoryStatusFields,
  ]) {
    if (!sharedTypesSource.includes(`${field}:`)) {
      reportFailure(contractFiles.sharedTypes, `missing field "${field}"`);
    }
  }

  for (const actionType of expectedDomainActionTypes) {
    if (!sharedTypesSource.includes(`"${actionType}"`)) {
      reportFailure(
        contractFiles.sharedTypes,
        `missing DomainActionType "${actionType}"`,
      );
    }
  }
  if (!sharedTypesSource.includes("actionType: DomainActionType")) {
    reportFailure(
      contractFiles.sharedTypes,
      "AgentDebugPendingClarification.actionType must use DomainActionType",
    );
  }

  if (failures.length === failureCountBeforeSlice) {
    console.log(
      "ok - factory status slice has lightweight cross-runtime checks",
    );
  }
}

function validateOpenApiContentSchemas(openapiDocument) {
  if (openapiDocument === undefined) {
    return;
  }

  const methods = new Set([
    "delete",
    "get",
    "patch",
    "post",
    "put",
  ]);

  for (const [pathName, pathItem] of Object.entries(openapiDocument.paths)) {
    if (typeof pathItem !== "object" || pathItem === null) {
      continue;
    }

    for (const [method, operation] of Object.entries(pathItem)) {
      if (!methods.has(method) || typeof operation !== "object" || operation === null) {
        continue;
      }

      for (const [statusCode, response] of Object.entries(operation.responses ?? {})) {
        if (typeof response !== "object" || response === null) {
          continue;
        }

        const content = response.content;
        if (content === undefined) {
          continue;
        }
        if (typeof content !== "object" || content === null || Array.isArray(content)) {
          reportFailure(
            contractFiles.openapi,
            `${method.toUpperCase()} ${pathName} ${statusCode} content must be an object`,
          );
          continue;
        }
        if (Object.hasOwn(content, "schema")) {
          reportFailure(
            contractFiles.openapi,
            `${method.toUpperCase()} ${pathName} ${statusCode} has schema at content level instead of media type level`,
          );
        }

        for (const [mediaType, mediaConfig] of Object.entries(content)) {
          if (!mediaType.includes("/")) {
            continue;
          }
          if (
            typeof mediaConfig !== "object" ||
            mediaConfig === null ||
            Array.isArray(mediaConfig)
          ) {
            reportFailure(
              contractFiles.openapi,
              `${method.toUpperCase()} ${pathName} ${statusCode} ${mediaType} must be an object`,
            );
            continue;
          }
          if (!Object.hasOwn(mediaConfig, "schema")) {
            reportFailure(
              contractFiles.openapi,
              `${method.toUpperCase()} ${pathName} ${statusCode} ${mediaType} is missing schema`,
            );
          }
        }
      }
    }
  }
}

function runValidation() {
  const openapiDocument = validateOpenApiYaml(contractFiles.openapi);
  validateOpenApiContentSchemas(openapiDocument);
  validateJsonSchema(contractFiles.memorySchema);
  validateJsonSchema(contractFiles.workflowSchema);
  validateJsonSchema(contractFiles.hybridBridgeSchema);
  validateFactoryStatusSlice(openapiDocument);

  if (failures.length > 0) {
    console.error("\nContract validation failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("\nContract validation passed.");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runValidation();
}

export { parseSimpleYamlObject };
