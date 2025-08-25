async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        throw error;
      }
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) * (0.5 + Math.random());
      await wait(delay);
    }
  }
}

export { retryWithBackoff, wait };
