/**
 * 🛡️ ENHANCED TRANSLATION ERROR HANDLING SYSTEM
 * Production-ready error handling with fallbacks and monitoring
 */

export enum TranslationErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  API_QUOTA_EXCEEDED = 'API_QUOTA_EXCEEDED',
  INVALID_API_KEY = 'INVALID_API_KEY',
  UNSUPPORTED_LANGUAGE = 'UNSUPPORTED_LANGUAGE',
  TEXT_TOO_LONG = 'TEXT_TOO_LONG',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface TranslationError {
  type: TranslationErrorType;
  message: string;
  originalError?: Error;
  retryable: boolean;
  retryAfter?: number; // seconds
  fallbackAvailable: boolean;
}

export interface ErrorHandlerConfig {
  maxRetries: number;
  baseRetryDelay: number;
  maxRetryDelay: number;
  enableFallbacks: boolean;
  enableMonitoring: boolean;
}

export class TranslationErrorHandler {
  private config: ErrorHandlerConfig;
  private errorCounts = new Map<TranslationErrorType, number>();
  private lastErrors = new Map<TranslationErrorType, number>();

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      maxRetries: 3,
      baseRetryDelay: 1000,
      maxRetryDelay: 10000,
      enableFallbacks: true,
      enableMonitoring: true,
      ...config
    };
  }

  /**
   * Parse and classify translation errors
   */
  parseError(error: any): TranslationError {
    let translationError: TranslationError;

    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      translationError = {
        type: TranslationErrorType.TIMEOUT,
        message: 'Translation request timed out',
        originalError: error,
        retryable: true,
        fallbackAvailable: true
      };
    } else if (error.status === 401 || error.message?.includes('unauthorized')) {
      translationError = {
        type: TranslationErrorType.INVALID_API_KEY,
        message: 'Invalid or missing API key',
        originalError: error,
        retryable: false,
        fallbackAvailable: false
      };
    } else if (error.status === 429 || error.message?.includes('rate limit')) {
      const retryAfter = this.extractRetryAfter(error);
      translationError = {
        type: TranslationErrorType.API_RATE_LIMIT,
        message: 'API rate limit exceeded',
        originalError: error,
        retryable: true,
        retryAfter,
        fallbackAvailable: true
      };
    } else if (error.status === 403 || error.message?.includes('quota')) {
      translationError = {
        type: TranslationErrorType.API_QUOTA_EXCEEDED,
        message: 'API quota exceeded',
        originalError: error,
        retryable: false,
        fallbackAvailable: true
      };
    } else if (error.status >= 500 && error.status < 600) {
      translationError = {
        type: TranslationErrorType.NETWORK_ERROR,
        message: 'Server error occurred',
        originalError: error,
        retryable: true,
        fallbackAvailable: true
      };
    } else if (error.message?.includes('unsupported language')) {
      translationError = {
        type: TranslationErrorType.UNSUPPORTED_LANGUAGE,
        message: 'Language not supported',
        originalError: error,
        retryable: false,
        fallbackAvailable: false
      };
    } else if (error.message?.includes('text too long')) {
      translationError = {
        type: TranslationErrorType.TEXT_TOO_LONG,
        message: 'Text exceeds maximum length',
        originalError: error,
        retryable: false,
        fallbackAvailable: true
      };
    } else {
      translationError = {
        type: TranslationErrorType.UNKNOWN_ERROR,
        message: error.message || 'Unknown translation error',
        originalError: error,
        retryable: true,
        fallbackAvailable: true
      };
    }

    this.recordError(translationError);
    return translationError;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  calculateRetryDelay(attempt: number, errorType: TranslationErrorType): number {
    const baseDelay = this.config.baseRetryDelay;
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * exponentialDelay;
    const delay = Math.min(exponentialDelay + jitter, this.config.maxRetryDelay);

    // Special handling for rate limits
    if (errorType === TranslationErrorType.API_RATE_LIMIT) {
      return Math.max(delay, 5000); // Minimum 5 seconds for rate limits
    }

    return delay;
  }

  /**
   * Check if error should be retried
   */
  shouldRetry(error: TranslationError, attempt: number): boolean {
    if (attempt >= this.config.maxRetries) {
      return false;
    }

    if (!error.retryable) {
      return false;
    }

    // Don't retry if we've seen too many of this error type recently
    const errorCount = this.errorCounts.get(error.type) || 0;
    const lastErrorTime = this.lastErrors.get(error.type) || 0;
    const timeSinceLastError = Date.now() - lastErrorTime;

    if (errorCount > 10 && timeSinceLastError < 60000) { // 10 errors in 1 minute
      console.warn(`🚫 Too many ${error.type} errors, skipping retry`);
      return false;
    }

    return true;
  }

  /**
   * Get fallback translation strategies
   */
  getFallbackStrategies(error: TranslationError, text: string, targetLanguage: string): string[] {
    if (!this.config.enableFallbacks || !error.fallbackAvailable) {
      return [];
    }

    const strategies: string[] = [];

    switch (error.type) {
      case TranslationErrorType.API_QUOTA_EXCEEDED:
      case TranslationErrorType.API_RATE_LIMIT:
        strategies.push('Use alternative translation service');
        strategies.push('Return cached translation if available');
        break;

      case TranslationErrorType.TEXT_TOO_LONG:
        strategies.push('Split text into smaller chunks');
        strategies.push('Summarize and translate');
        break;

      case TranslationErrorType.TIMEOUT:
      case TranslationErrorType.NETWORK_ERROR:
        strategies.push('Use cached translation if available');
        strategies.push('Return original text with warning');
        break;

      case TranslationErrorType.UNSUPPORTED_LANGUAGE:
        strategies.push('Detect and use closest supported language');
        strategies.push('Return original text');
        break;

      default:
        strategies.push('Return original text with error indicator');
        break;
    }

    return strategies;
  }

  /**
   * Create user-friendly error message
   */
  getUserFriendlyMessage(error: TranslationError): string {
    switch (error.type) {
      case TranslationErrorType.NETWORK_ERROR:
        return 'Translation service temporarily unavailable. Please try again.';
      
      case TranslationErrorType.API_RATE_LIMIT:
        return 'Too many translation requests. Please wait a moment and try again.';
      
      case TranslationErrorType.API_QUOTA_EXCEEDED:
        return 'Translation quota exceeded. Please try again later.';
      
      case TranslationErrorType.INVALID_API_KEY:
        return 'Translation service configuration error. Please contact support.';
      
      case TranslationErrorType.UNSUPPORTED_LANGUAGE:
        return 'This language is not supported for translation.';
      
      case TranslationErrorType.TEXT_TOO_LONG:
        return 'Message is too long to translate. Please shorten it.';
      
      case TranslationErrorType.TIMEOUT:
        return 'Translation is taking too long. Please try again.';
      
      default:
        return 'Translation failed. Showing original message.';
    }
  }

  /**
   * Record error for monitoring
   */
  private recordError(error: TranslationError): void {
    if (!this.config.enableMonitoring) return;

    const count = this.errorCounts.get(error.type) || 0;
    this.errorCounts.set(error.type, count + 1);
    this.lastErrors.set(error.type, Date.now());

    console.error(`🚨 Translation Error [${error.type}]:`, error.message);
    
    // Log to external monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.logToMonitoring(error);
    }
  }

  /**
   * Extract retry-after header from error
   */
  private extractRetryAfter(error: any): number | undefined {
    if (error.headers && error.headers['retry-after']) {
      return parseInt(error.headers['retry-after'], 10);
    }
    return undefined;
  }

  /**
   * Log error to external monitoring service
   */
  private logToMonitoring(error: TranslationError): void {
    // Implement integration with monitoring services like Sentry, DataDog, etc.
    // Example:
    // Sentry.captureException(error.originalError, {
    //   tags: { errorType: error.type },
    //   extra: { retryable: error.retryable }
    // });
  }

  /**
   * Get error statistics
   */
  getErrorStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const [type, count] of this.errorCounts.entries()) {
      stats[type] = count;
    }
    return stats;
  }

  /**
   * Reset error statistics
   */
  resetStats(): void {
    this.errorCounts.clear();
    this.lastErrors.clear();
  }
}

// Singleton instance
let errorHandlerInstance: TranslationErrorHandler | null = null;

export const getTranslationErrorHandler = (): TranslationErrorHandler => {
  if (!errorHandlerInstance) {
    errorHandlerInstance = new TranslationErrorHandler();
  }
  return errorHandlerInstance;
};
