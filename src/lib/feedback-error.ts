/**
 * Feedback Generation Error Classification System
 * 
 * Provides error categorization and retry logic for feedback generation failures.
 * Distinguishes between network errors (retryable) and server errors (fatal).
 */

/**
 * Error severity levels for feedback generation
 */
export enum ErrorSeverity {
    /** Network issues, timeouts - can be retried */
    RETRYABLE = 'RETRYABLE',
    /** Server errors, API failures - cannot be retried */
    FATAL = 'FATAL',
    /** Session or resource not found */
    NOT_FOUND = 'NOT_FOUND'
}

/**
 * Structured error information for feedback generation
 */
export interface FeedbackError {
    /** User-friendly error message */
    message: string;
    /** Error classification */
    severity: ErrorSeverity;
    /** HTTP status code if applicable */
    code?: number;
    /** Number of retry attempts made */
    retryCount: number;
    /** Technical details for logging */
    technicalDetails?: string;
}

/**
 * Check if the browser is online
 */
function isOnline(): boolean {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
}

/**
 * Determine if an error is network-related
 */
export function isNetworkError(error: unknown): boolean {
    // Check browser online status
    if (!isOnline()) return true;

    // Common network error patterns
    const networkErrorMessages = [
        'network error',
        'failed to fetch',
        'networkerror',
        'network request failed',
        'connection refused',
        'connection reset',
        'timeout',
        'ECONNREFUSED',
        'ETIMEDOUT',
    ];

    const errorMessage = (error as { message?: string })?.message?.toLowerCase() || '';
    return networkErrorMessages.some(msg => errorMessage.includes(msg));
}

/**
 * Classify an error based on its type and HTTP response
 */
export function classifyError(
    error: unknown,
    response?: Response,
    retryCount: number = 0
): FeedbackError {
    // HTTP Response errors
    if (response && !response.ok) {
        const status = response.status;

        // Not Found
        if (status === 404) {
            return {
                message: 'Interview session not found. Please check if the session exists.',
                severity: ErrorSeverity.NOT_FOUND,
                code: status,
                retryCount,
                technicalDetails: `HTTP ${status}: Session not found`,
            };
        }

        // Authentication/Authorization errors
        if (status === 401 || status === 403) {
            return {
                message: 'Authentication failed. Please log in again.',
                severity: ErrorSeverity.FATAL,
                code: status,
                retryCount,
                technicalDetails: `HTTP ${status}: Auth error`,
            };
        }

        // Timeout
        if (status === 408) {
            return {
                message: 'Request timeout. Please check your internet connection.',
                severity: ErrorSeverity.RETRYABLE,
                code: status,
                retryCount,
                technicalDetails: `HTTP ${status}: Request timeout`,
            };
        }

        // Rate limiting
        if (status === 429) {
            return {
                message: 'Too many requests. Please wait a moment and try again.',
                severity: ErrorSeverity.RETRYABLE,
                code: status,
                retryCount,
                technicalDetails: `HTTP ${status}: Rate limited`,
            };
        }

        // Server errors (500-599)
        if (status >= 500) {
            return {
                message: 'Server error occurred. Please contact the developer if this persists.',
                severity: ErrorSeverity.FATAL,
                code: status,
                retryCount,
                technicalDetails: `HTTP ${status}: Server error`,
            };
        }

        // Other client errors (400-499)
        return {
            message: 'An error occurred while processing your request.',
            severity: ErrorSeverity.FATAL,
            code: status,
            retryCount,
            technicalDetails: `HTTP ${status}: Client error`,
        };
    }

    // Network errors (no response)
    if (isNetworkError(error)) {
        return {
            message: 'Network connection issue detected. Retrying automatically...',
            severity: ErrorSeverity.RETRYABLE,
            retryCount,
            technicalDetails: (error as { message?: string })?.message || 'Network error',
        };
    }

    // Gemini API specific errors
    const errorMessage = (error as { message?: string })?.message || '';
    if (errorMessage.includes('quota') || errorMessage.includes('QUOTA_EXCEEDED')) {
        return {
            message: 'API quota exceeded. Please contact the developer.',
            severity: ErrorSeverity.FATAL,
            code: 429,
            retryCount,
            technicalDetails: 'Gemini API quota exceeded',
        };
    }

    // Generic unknown error
    return {
        message: 'An unexpected error occurred. Please try again or contact support.',
        severity: ErrorSeverity.FATAL,
        retryCount,
        technicalDetails: (error as { message?: string })?.message || 'Unknown error',
    };
}

/**
 * Determine if an error should be retried
 */
export function shouldRetry(error: FeedbackError, maxRetries: number): boolean {
    // Don't retry if already exceeded max retries
    if (error.retryCount >= maxRetries) {
        return false;
    }

    // Only retry retryable errors
    return error.severity === ErrorSeverity.RETRYABLE;
}

/**
 * Calculate exponential backoff delay in milliseconds
 * @param retryCount Current retry attempt (0-indexed)
 * @returns Delay in milliseconds (2^retryCount seconds)
 */
export function getRetryDelay(retryCount: number): number {
    // 2^n seconds: 2s, 4s, 8s, 16s, 32s
    return Math.pow(2, retryCount) * 1000;
}

/**
 * Get a user-friendly retry message
 */
export function getRetryMessage(retryCount: number, maxRetries: number): string {
    const remaining = maxRetries - retryCount;
    const delay = getRetryDelay(retryCount) / 1000;

    return `Connection issue. Retrying in ${delay}s... (${remaining} attempt${remaining !== 1 ? 's' : ''} remaining)`;
}
