/**
 * HTTP client utilities
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import {
  NorthRelayError,
  AuthenticationError,
  ValidationError,
  QuotaExceededError,
  RateLimitError,
  NotFoundError,
  ServerError,
  NetworkError,
} from '../errors';
import type { ErrorResponse, RateLimitInfo } from '../types';
import { SDK_VERSION } from '../version';

export interface HttpClientConfig {
  baseURL: string;
  apiKey: string;
  timeout: number;
}

export class HttpClient {
  private client: AxiosInstance;
  private rateLimitInfo: RateLimitInfo | null = null;

  constructor(config: HttpClientConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': `NorthRelay-SDK/${SDK_VERSION}`,
      },
    });

    // Response interceptor to extract rate limit headers
    this.client.interceptors.response.use(
      (response) => {
        this.extractRateLimitInfo(response);
        return response;
      },
      (error) => {
        if (error.response) {
          this.extractRateLimitInfo(error.response);
        }
        return Promise.reject(error);
      }
    );
  }

  public getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }

  public async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.request<T>(config);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError<ErrorResponse>);
    }
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  public async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  public async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  public async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  private extractRateLimitInfo(response: AxiosResponse): void {
    const headers = response.headers;
    const limit = headers['x-ratelimit-limit'];
    const remaining = headers['x-ratelimit-remaining'];
    const reset = headers['x-ratelimit-reset'];

    if (limit && remaining && reset) {
      this.rateLimitInfo = {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10),
      };
    }
  }

  private handleError(error: AxiosError<ErrorResponse>): Error {
    // Network error (no response)
    if (!error.response) {
      return new NetworkError(error.message || 'Network request failed');
    }

    const { status, data } = error.response;
    const errorData = data?.error;

    // API error with structured response
    if (errorData) {
      switch (errorData.code) {
        case 'AUTHENTICATION_FAILED':
        case 'INVALID_API_KEY':
        case 'MISSING_API_KEY':
          return new AuthenticationError(
            errorData.message,
            errorData.fix_action
          );

        case 'VALIDATION_ERROR':
          return new ValidationError(
            errorData.message,
            errorData.validationErrors
          );

        case 'QUOTA_EXCEEDED':
          return new QuotaExceededError(errorData.message);

        case 'RATE_LIMIT_EXCEEDED':
          const retryAfter = parseInt(error.response.headers['retry-after'] || '60', 10);
          return new RateLimitError(errorData.message, retryAfter);

        case 'NOT_FOUND':
        case 'TEMPLATE_NOT_FOUND':
        case 'DOMAIN_NOT_FOUND':
        case 'WEBHOOK_NOT_FOUND':
          return new NotFoundError(errorData.message);

        case 'INTERNAL_ERROR':
        case 'SMTP_ERROR':
        case 'SMTP_AUTH_ERROR':
        case 'SMTP_CONNECTION_FAILED':
          return new ServerError(errorData.message);

        default:
          return new NorthRelayError(
            errorData.message,
            errorData.code,
            status,
            errorData.fix_action,
            errorData.docs_url
          );
      }
    }

    // Generic HTTP error
    switch (status) {
      case 401:
        return new AuthenticationError('Authentication failed');
      case 404:
        return new NotFoundError('Resource');
      case 429:
        const retryAfter = parseInt(error.response.headers['retry-after'] || '60', 10);
        return new RateLimitError('Rate limit exceeded', retryAfter);
      case 500:
      case 502:
      case 503:
      case 504:
        return new ServerError('Server error occurred');
      default:
        return new NorthRelayError(
          error.message || 'An error occurred',
          'UNKNOWN_ERROR',
          status
        );
    }
  }
}
