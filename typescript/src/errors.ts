/**
 * Custom error classes for NorthRelay SDK
 */

export class NorthRelayError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly fixAction?: string;
  public readonly docsUrl?: string;

  constructor(
    message: string,
    code: string,
    statusCode?: number,
    fixAction?: string,
    docsUrl?: string
  ) {
    super(message);
    this.name = 'NorthRelayError';
    this.code = code;
    this.statusCode = statusCode;
    this.fixAction = fixAction;
    this.docsUrl = docsUrl;
    Object.setPrototypeOf(this, NorthRelayError.prototype);
  }
}

export class AuthenticationError extends NorthRelayError {
  constructor(message: string, fixAction?: string) {
    super(message, 'AUTHENTICATION_FAILED', 401, fixAction, 'https://docs.northrelay.ca/api/authentication');
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends NorthRelayError {
  public readonly validationErrors?: Array<{ field: string; message: string }>;

  constructor(message: string, validationErrors?: Array<{ field: string; message: string }>) {
    super(message, 'VALIDATION_ERROR', 400, undefined, 'https://docs.northrelay.ca/api/validation');
    this.name = 'ValidationError';
    this.validationErrors = validationErrors;
  }
}

export class QuotaExceededError extends NorthRelayError {
  public readonly quota?: {
    used: number;
    limit: number;
    remaining: number;
  };

  constructor(message: string, quota?: { used: number; limit: number; remaining: number }) {
    super(message, 'QUOTA_EXCEEDED', 429, 'Upgrade your plan or wait for monthly reset', 'https://docs.northrelay.ca/quotas');
    this.name = 'QuotaExceededError';
    this.quota = quota;
  }
}

export class RateLimitError extends NorthRelayError {
  public readonly retryAfter?: number;

  constructor(message: string, retryAfter?: number) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, `Retry after ${retryAfter} seconds`, 'https://docs.northrelay.ca/rate-limits');
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class NotFoundError extends NorthRelayError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ServerError extends NorthRelayError {
  constructor(message: string) {
    super(message, 'INTERNAL_ERROR', 500, 'Please try again later. If the problem persists, contact support', 'https://docs.northrelay.ca/support');
    this.name = 'ServerError';
  }
}

export class NetworkError extends NorthRelayError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR', undefined, 'Check your internet connection and try again');
    this.name = 'NetworkError';
  }
}
