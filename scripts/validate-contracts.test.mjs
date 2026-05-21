import assert from "node:assert/strict";
import test from "node:test";

import { parseSimpleYamlObject } from "./validate-contracts.mjs";

test("parseSimpleYamlObject parses scalar sequences", () => {
  const document = parseSimpleYamlObject(
    `components:
  schemas:
    Example:
      required:
        - id
        - title
`,
    "inline.yaml",
  );

  assert.deepEqual(document.components.schemas.Example.required, [
    "id",
    "title",
  ]);
});

test("parseSimpleYamlObject parses sequences of mapping objects", () => {
  const document = parseSimpleYamlObject(
    `paths:
  /execution-plans/{id}:
    get:
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
`,
    "inline.yaml",
  );

  assert.deepEqual(document.paths["/execution-plans/{id}"].get.parameters, [
    {
      name: "id",
      in: "path",
      required: true,
      schema: {
        type: "string",
      },
    },
  ]);
});
