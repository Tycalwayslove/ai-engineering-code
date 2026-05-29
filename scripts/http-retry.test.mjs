import assert from "node:assert/strict";
import test from "node:test";

import { fetchWithRetry } from "./http-retry.mjs";

test("fetchWithRetry retries transient connection failures", async () => {
  let attempts = 0;
  const response = { ok: true, status: 200 };
  const fetchImpl = async () => {
    attempts += 1;
    if (attempts === 1) {
      const error = new TypeError("fetch failed");
      error.cause = { code: "ECONNRESET" };
      throw error;
    }
    return response;
  };

  const result = await fetchWithRetry("http://127.0.0.1:8000/health", {}, {
    fetchImpl,
    delayMs: 0,
    maxAttempts: 2,
  });

  assert.equal(result, response);
  assert.equal(attempts, 2);
});

test("fetchWithRetry does not retry non-transient failures", async () => {
  let attempts = 0;
  const fetchImpl = async () => {
    attempts += 1;
    throw new TypeError("invalid url");
  };

  await assert.rejects(
    () =>
      fetchWithRetry("bad-url", {}, {
        fetchImpl,
        delayMs: 0,
        maxAttempts: 3,
      }),
    /invalid url/
  );
  assert.equal(attempts, 1);
});
