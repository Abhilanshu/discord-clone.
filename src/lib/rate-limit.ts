// Basic in-memory rate limiter for development/single-instance use
// For production serverless environments, an external store like Upstash Redis is recommended.

type RateLimitStore = {
    [ip: string]: {
        count: number;
        resetTime: number;
    };
};

const store: RateLimitStore = {};

interface RateLimitConfig {
    windowMs?: number; // Time frame in milliseconds
    max?: number;      // Maximum number of requests within that time frame
}

export function rateLimit(ip: string, config: RateLimitConfig = {}) {
    const { windowMs = 60000, max = 10 } = config; // Default: 10 requests per minute
    const now = Date.now();

    // Cleanup expired entries periodically or on-the-fly
    if (store[ip] && store[ip].resetTime < now) {
        delete store[ip];
    }

    if (!store[ip]) {
        store[ip] = {
            count: 1,
            resetTime: now + windowMs
        };
        return { success: true, remaining: max - 1, reset: store[ip].resetTime };
    }

    store[ip].count++;

    if (store[ip].count > max) {
        return { success: false, remaining: 0, reset: store[ip].resetTime };
    }

    return { success: true, remaining: max - store[ip].count, reset: store[ip].resetTime };
}
