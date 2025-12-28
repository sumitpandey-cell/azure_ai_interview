/**
 * Format seconds into human-readable duration format
 * @param seconds Total seconds
 * @returns Formatted string like "5 min 32 sec" or "1 hr 23 min 45 sec"
 */
export function formatDuration(seconds: number): string {
    if (seconds < 60) {
        return `${seconds} sec`;
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours} hr ${minutes} min ${secs} sec`;
    }

    return `${minutes} min ${secs} sec`;
}

/**
 * Format seconds for dashboard stats (shorter format without seconds if > 1 hour)
 * @param seconds Total seconds
 * @returns Formatted string like "5 min 32 sec" or "1 hr 23 min"
 */
export function formatDurationShort(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours} hr ${minutes} min`;
    }

    return `${minutes} min ${secs} sec`;
}
