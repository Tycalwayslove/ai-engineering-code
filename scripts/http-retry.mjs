const transientErrorCodes = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "EPIPE",
  "ETIMEDOUT",
  "UND_ERR_SOCKET",
]);

function sleep(milliseconds) {
  if (milliseconds <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function transientErrorCode(error) {
  return error?.code ?? error?.cause?.code ?? error?.cause?.cause?.code ?? null;
}

function isTransientFetchError(error) {
  return transientErrorCodes.has(transientErrorCode(error));
}

export async function fetchWithRetry(url, options = {}, retryOptions = {}) {
  const fetchImpl = retryOptions.fetchImpl ?? fetch;
  const maxAttempts = retryOptions.maxAttempts ?? 3;
  const delayMs = retryOptions.delayMs ?? 250;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fetchImpl(url, options);
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts || !isTransientFetchError(error)) {
        throw error;
      }
      await sleep(delayMs * attempt);
    }
  }

  throw lastError;
}
