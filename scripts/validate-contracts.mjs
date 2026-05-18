import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();

const contractFiles = {
  openapi: "contracts/openapi/api-gateway.yaml",
  memorySchema: "contracts/memory/memory-document.schema.json",
  workflowSchema: "contracts/workflow/workflow-manifest.schema.json",
};

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
    const match = line.trimStart().match(/^(.+?):(?:\s+(.*))?$/);
    if (!match) {
      throw new Error(`line ${lineNumber}: expected a key/value mapping`);
    }

    const key = unquoteYamlString(match[1]);
    const rawValue = match[2];

    while (indent <= stack.at(-1).indent) {
      stack.pop();
    }

    const parent = stack.at(-1);
    if (indent > parent.indent + 2) {
      throw new Error(
        `line ${lineNumber}: indentation jumps more than one level`,
      );
    }

    if (Object.hasOwn(parent.value, key)) {
      throw new Error(`line ${lineNumber}: duplicate key "${key}"`);
    }

    if (rawValue === undefined) {
      const child = {};
      parent.value[key] = child;
      stack.push({ indent, value: child });
      return;
    }

    parent.value[key] = parseYamlScalar(rawValue);
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
    console.log(`ok - ${relativePath} parses as JSON Schema document`);
  } catch (error) {
    reportFailure(relativePath, error.message);
  }
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
  } catch (error) {
    reportFailure(relativePath, error.message);
  }
}

validateOpenApiYaml(contractFiles.openapi);
validateJsonSchema(contractFiles.memorySchema);
validateJsonSchema(contractFiles.workflowSchema);

if (failures.length > 0) {
  console.error("\nContract validation failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("\nContract validation passed.");
