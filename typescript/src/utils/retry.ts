/**
 * Retry utility with exponential backoff
 */

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const {
    maxRetries,
    initialDelayMs,
    maxDelayMs,
    backoffMultiplier,
    retryableStatusCodes,
  } = { ...DEFAULT_RETRY_CONFIG, ...config };

  let lastError: Error | undefined;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry
      const shouldRetry = isRetryableError(error, retryableStatusCodes);

      if (!shouldRetry || attempt >= maxRetries) {
        throw lastError;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        initialDelayMs * Math.pow(backoffMultiplier, attempt) + Math.random() * 1000,
        maxDelayMs
      );

      await sleep(delay);
      attempt++;
    }
  }

  throw lastError;
}

function isRetryableError(error: unknown, retryableStatusCodes: number[]): boolean {
  if (typeof error === 'object' && error !== null) {
    // Check for axios-like error
    if ('response' in error && typeof (error as any).response === 'object') {
      const status = (error as any).response?.status;
      return retryableStatusCodes.includes(status);
    }

    // Check for network errors
    if ('code' in error) {
      const code = (error as any).code;
      return ['ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNREFUSED'].includes(code);
    }
  }

  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
