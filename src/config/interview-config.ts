/**
 * Interview Application Configuration
 * Centralized thresholds and settings for the interview lifecycle
 */

export const INTERVIEW_CONFIG = {
    // Minimum requirements to generate a meaningful AI feedback report
    THRESHOLDS: {
        MIN_DURATION_SECONDS: 120, // 2 minutes
        MIN_USER_TURNS: 4,         // Minimum exchanges for assessment
        MIN_RESPONSE_LENGTH: 10,   // Minimum characters for a response to be "meaningful"
    },

    // Interview length categories for Gemini analysis
    LENGTH_CATEGORIES: {
        TOO_SHORT: 6,    // Less than this = too short for any assessment
        SHORT: 12,        // Brief interview, general feedback
        MEDIUM: 20,      // Balanced assessment
        LONG: 35,        // Comprehensive, detailed analysis
    },

    // Tracking & Sync settings
    SYNC: {
        HEARTBEAT_INTERVAL_MS: 30000, // 30 seconds
        RECONNECT_WINDOW_SECONDS: 60, // 1 minute window to reconnect
    },

    // Session Status State Machine
    STATUS: {
        IN_PROGRESS: 'in_progress',
        COMPLETED: 'completed',
        FAILED: 'failed',
    },

    // Map of valid transitions: status -> array of allowed next statuses
    VALID_TRANSITIONS: {
        'in_progress': ['completed', 'failed'],
        'completed': [], // Terminal state
        'failed': ['completed'], // Allow manual completion if failed during generation
    } as Record<string, string[]>
} as const;
