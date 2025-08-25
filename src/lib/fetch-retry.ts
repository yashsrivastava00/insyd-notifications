interface RetryConfig {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
}

interface FetchOptions extends RequestInit {
  retry?: RetryConfig;
}

const defaultRetryConfig: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelayMs: 250,
  maxDelayMs: 5000,
  backoffFactor: 2,
};

async function delay(ms: number) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchWithRetry(url: string, options: FetchOptions = {}): Promise<Response> {
  const config: Required<RetryConfig> = { ...defaultRetryConfig, ...options.retry };
  let lastError: Error | null = null;
  let delayMs = config.initialDelayMs;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Only retry on 5xx errors and network failures
      if (response.ok || response.status < 500) {
        return response;
      }
      
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (err) {
      lastError = err as Error;
    }

    // Don't wait on the last attempt
    if (attempt < config.maxRetries) {
      await delay(delayMs);
      delayMs = Math.min(delayMs * config.backoffFactor, config.maxDelayMs);
    }
  }

  throw lastError || new Error('Fetch failed after retries');
}
