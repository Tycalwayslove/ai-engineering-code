import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../packages/sdk/src/index.ts", import.meta.url), "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled).toString("base64")}`;
const { ApiClient } = await import(moduleUrl);

const failedResponses = [
  new Response(JSON.stringify({ detail: "reminder status cannot transition" }), {
    headers: { "Content-Type": "application/json" },
    status: 400,
    statusText: "Bad Request",
  }),
  new Response(
    JSON.stringify({
      detail: [
        { msg: "Input should be a valid datetime" },
        { msg: "Field required" },
      ],
    }),
    {
      headers: { "Content-Type": "application/json" },
      status: 422,
      statusText: "Unprocessable Entity",
    },
  ),
  new Response("plain text backend error", {
    status: 500,
    statusText: "Internal Server Error",
  }),
];
globalThis.fetch = async () => {
  const response = failedResponses.shift();
  assert.ok(response, "unexpected SDK runtime validation fetch call");
  return response;
};

const client = new ApiClient({ baseUrl: "http://127.0.0.1:8000" });
await assert.rejects(
  () => client.completeReminder("reminder_done", "conversation_runtime"),
  /API request failed: 400 Bad Request: reminder status cannot transition/,
);
await assert.rejects(
  () => client.updateReminder("reminder_bad", { dueAt: "tomorrow" }, "conversation_runtime"),
  /API request failed: 422 Unprocessable Entity: Input should be a valid datetime; Field required/,
);
await assert.rejects(
  () => client.cancelReminder("reminder_missing_conversation", ""),
  /conversationId is required for direct UI actions/,
);
await assert.rejects(
  () => client.getHealth(),
  /API request failed: 500 Internal Server Error: plain text backend error/,
);

console.log("SDK runtime validation passed.");
