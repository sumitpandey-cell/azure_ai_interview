import { LRUCache } from 'lru-cache';

export interface RateLimitConfig {
    interval: number; // Time window in milliseconds
    uniqueTokenPerInterval: number; // Max requests per interval
}

/**
 * Simple In-Memory Rate Limiter using LRU Cache
 * Note: In serverless environments, this will reset per instance.
 */
export const rateLimit = (options: RateLimitConfig) => {
    const tokenCache = new LRUCache<string, number>({
        max: options.uniqueTokenPerInterval || 500,
        ttl: options.interval || 60000,
    });

    return {
        check: (res: unknown, limit: number, token: string) =>
            new Promise<void>((resolve, reject) => {
                const currentUsage = tokenCache.get(token) || 0;
                const newUsage = currentUsage + 1;
                tokenCache.set(token, newUsage);

                const isRateLimited = newUsage > limit;

                // Add headers (only if res exists and has setHeaders)
                const response = res as { headers?: { set: (k: string, v: string) => void } };
                if (response?.headers && typeof response.headers.set === 'function') {
                    response.headers.set('X-RateLimit-Limit', limit.toString());
                    response.headers.set('X-RateLimit-Remaining', isRateLimited ? '0' : (limit - newUsage).toString());
                }

                return isRateLimited ? reject(new Error('Rate limit exceeded')) : resolve();
            }),
    };
};

/**
 * Predefined limiters for common actions
 */
export const limiters = {
    livekit: rateLimit({
        interval: 60 * 1000, // 1 minute
        uniqueTokenPerInterval: 500,
    }),
    supabase: rateLimit({
        interval: 60 * 1000, // 1 minute
        uniqueTokenPerInterval: 500,
    }),
};
