import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(
  new URL("../apps/h5/src/app/ai-time-agent/dateTimeInput.ts", import.meta.url),
  "utf8",
);
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled).toString("base64")}`;
const { dateTimeIsoToLocalInputValue, dateTimeLocalValueToIso } =
  await import(moduleUrl);

assert.equal(
  dateTimeIsoToLocalInputValue("2026-05-24T09:30:00+08:00"),
  "2026-05-24T09:30",
);
assert.equal(
  dateTimeLocalValueToIso("2026-05-24T10:00", "Asia/Shanghai"),
  "2026-05-24T10:00:00+08:00",
);
assert.equal(
  dateTimeLocalValueToIso(
    "2026-05-24T10:00",
    undefined,
    "2026-05-24T09:30:00+08:00",
  ),
  "2026-05-24T10:00:00+08:00",
);

console.log("H5 datetime runtime validation passed.");
