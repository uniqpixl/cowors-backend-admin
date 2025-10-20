import cashfreeConfig from '@/config/cashfree/cashfree.config';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as crypto from 'crypto';

export interface CashfreeVrsConfig {
  appId: string;
  appSecret: string;
  environment: 'sandbox' | 'production';
  baseUrl: string;
  webhookSecret: string;
  retryConfig: {
    maxRetries: number;
    backoffMultiplier: number;
    maxBackoffMs: number;
  };
}

export interface CashfreeApiResponse<T = any> {
  success: boolean;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  message: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export enum CashfreeErrorType {
  AUTHENTICATION_ERROR = 'authentication_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  VALIDATION_ERROR = 'validation_error',
  PROVIDER_ERROR = 'provider_error',
  NETWORK_ERROR = 'network_error',
  UNKNOWN_ERROR = 'unknown_error',
}

export class CashfreeApiError extends Error {
  constructor(
    public readonly type: CashfreeErrorType,
    public readonly code: string,
    public readonly message: string,
    public readonly retryable: boolean = false,
  ) {
    super(message);
  }
}

@Injectable()
export class CashfreeVrsService {
  private readonly logger = new Logger(CashfreeVrsService.name);
  private readonly httpClient: AxiosInstance;

  constructor(
    @Inject(cashfreeConfig.KEY)
    private readonly config: ConfigType<typeof cashfreeConfig>,
  ) {
    this.httpClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Generate authentication token for Cashfree API
   */
  private async generateAuthToken(): Promise<string> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = crypto
        .createHmac('sha256', this.config.clientSecret)
        .update(`${this.config.clientId}${timestamp}`)
        .digest('hex');

      const response = await this.httpClient.post('/auth/token', {
        clientId: this.config.clientId,
        timestamp,
        signature,
      });

      return response.data.token;
    } catch (error) {
      this.logger.error('Failed to generate auth token:', error);
      throw new CashfreeApiError(
        CashfreeErrorType.AUTHENTICATION_ERROR,
        'AUTH_FAILED',
        'Failed to authenticate with Cashfree',
        false,
      );
    }
  }

  /**
   * Make authenticated API call to Cashfree
   */
  private async makeAuthenticatedRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
  ): Promise<CashfreeApiResponse<T>> {
    const token = await this.generateAuthToken();

    try {
      const response: AxiosResponse<T> = await this.httpClient.request({
        method,
        url: endpoint,
        data,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        success: true,
        status: 'SUCCESS',
        data: response.data,
        message: 'Request successful',
      };
    } catch (error) {
      this.logger.error(`API request failed: ${method} ${endpoint}`, error);

      const errorType = this.classifyError(error);
      throw new CashfreeApiError(
        errorType,
        error.response?.data?.code || 'API_ERROR',
        error.response?.data?.message || 'API request failed',
        this.isRetryableError(error),
      );
    }
  }

  /**
   * Verify webhook signature from Cashfree
   */
  async verifyWebhookSignature(
    payload: string,
    signature: string,
  ): Promise<boolean> {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.config.webhookSecret)
        .update(payload)
        .digest('hex');

      return signature === expectedSignature;
    } catch (error) {
      this.logger.error('Failed to verify webhook signature', error);
      return false;
    }
  }

  /**
   * Get webhook secret for signature verification
   */
  getWebhookSecret(): string {
    return this.config.webhookSecret;
  }

  /**
   * Make API call to Cashfree
   */
  async makeApiCall(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any,
  ): Promise<any> {
    return this.makeAuthenticatedRequest(method, endpoint, data);
  }

  /**
   * Handle webhook payload from Cashfree
   */
  async handleWebhook(payload: any, signature: string): Promise<boolean> {
    const payloadString = JSON.stringify(payload);

    if (!(await this.verifyWebhookSignature(payloadString, signature))) {
      this.logger.warn('Invalid webhook signature received');
      return false;
    }

    this.logger.debug('Webhook signature verified successfully');
    return true;
  }

  /**
   * Execute operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    retryConfig = this.config.retryConfig,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (
          !this.isRetryableError(error) ||
          attempt === retryConfig.maxRetries
        ) {
          throw error;
        }

        const delay = this.calculateBackoffDelay(attempt, retryConfig);
        this.logger.warn(
          `Attempt ${attempt} failed, retrying in ${delay}ms`,
          error.message,
        );
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Classify error type
   */
  private classifyError(error: any): CashfreeErrorType {
    if (error.response) {
      const status = error.response.status;

      if (status === 401 || status === 403) {
        return CashfreeErrorType.AUTHENTICATION_ERROR;
      }

      if (status === 429) {
        return CashfreeErrorType.RATE_LIMIT_ERROR;
      }

      if (status === 400) {
        return CashfreeErrorType.VALIDATION_ERROR;
      }

      if (status >= 500) {
        return CashfreeErrorType.PROVIDER_ERROR;
      }
    }

    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return CashfreeErrorType.NETWORK_ERROR;
    }

    return CashfreeErrorType.UNKNOWN_ERROR;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (error instanceof CashfreeApiError) {
      return error.retryable;
    }

    // Network errors are generally retryable
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return true;
    }

    // 5xx server errors are retryable
    if (error.response?.status >= 500) {
      return true;
    }

    // Rate limit errors are retryable
    if (error.response?.status === 429) {
      return true;
    }

    return false;
  }

  /**
   * Calculate backoff delay for retries
   */
  private calculateBackoffDelay(
    attempt: number,
    config: typeof this.config.retryConfig,
  ): number {
    const baseDelay = 1000; // 1 second base delay
    return Math.min(
      baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
      config.maxBackoffMs,
    );
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Handle and classify API errors
   */
  private handleApiError(error: any): CashfreeApiError {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 401:
        case 403:
          return new CashfreeApiError(
            CashfreeErrorType.AUTHENTICATION_ERROR,
            'AUTHENTICATION_FAILED',
            'Authentication failed',
          );

        case 429:
          return new CashfreeApiError(
            CashfreeErrorType.RATE_LIMIT_ERROR,
            'RATE_LIMIT_EXCEEDED',
            'Rate limit exceeded',
            true, // retryable
          );

        case 400:
          return new CashfreeApiError(
            CashfreeErrorType.VALIDATION_ERROR,
            data?.error?.code || 'VALIDATION_ERROR',
            data?.error?.message || 'Validation error',
          );

        case 500:
        case 502:
        case 503:
        case 504:
          return new CashfreeApiError(
            CashfreeErrorType.PROVIDER_ERROR,
            'PROVIDER_ERROR',
            'Provider service error',
            true, // retryable
          );

        default:
          return new CashfreeApiError(
            CashfreeErrorType.PROVIDER_ERROR,
            data?.error?.code || 'API_ERROR',
            data?.error?.message || 'API call failed',
          );
      }
    }

    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return new CashfreeApiError(
        CashfreeErrorType.NETWORK_ERROR,
        'NETWORK_ERROR',
        'Network connection error',
        true, // retryable
      );
    }

    return new CashfreeApiError(
      CashfreeErrorType.UNKNOWN_ERROR,
      'UNKNOWN_ERROR',
      error.message || 'Unknown error occurred',
    );
  }

  /**
   * Get service configuration (for debugging)
   */
  getConfig(): Partial<CashfreeVrsConfig> {
    return {
      environment: this.config.environment,
      baseUrl: this.config.baseUrl,
      retryConfig: this.config.retryConfig,
    };
  }
}
