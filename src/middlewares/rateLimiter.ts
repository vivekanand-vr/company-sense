import { Request, Response, NextFunction } from 'express';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';

// Simple in-memory rate limiter (replace Redis for simplicity)
interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitInfo>();
const windowMs = config.rateLimit.windowMs;
const maxRequests = config.rateLimit.max;

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, info] of rateLimitStore) {
    if (now > info.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Cleanup every minute

/**
 * Rate limiting middleware
 */
export function rateLimiterMiddleware() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = req.ip || 'anonymous';
      const now = Date.now();
      
      let rateInfo = rateLimitStore.get(key);
      
      // If no record or window expired, create new one
      if (!rateInfo || now > rateInfo.resetTime) {
        rateInfo = {
          count: 1,
          resetTime: now + windowMs
        };
        rateLimitStore.set(key, rateInfo);
      } else {
        rateInfo.count += 1;
      }
      
      // Set rate limit headers
      const remaining = Math.max(0, maxRequests - rateInfo.count);
      const resetTimeSeconds = Math.ceil((rateInfo.resetTime - now) / 1000);
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(rateInfo.resetTime).toISOString(),
      });
      
      // Check if rate limit exceeded
      if (rateInfo.count > maxRequests) {
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          path: req.path,
          method: req.method,
          count: rateInfo.count,
          limit: maxRequests,
          retryAfter: resetTimeSeconds,
        });

        res.set({
          'Retry-After': resetTimeSeconds.toString(),
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateInfo.resetTime).toISOString(),
        });

        res.status(429).json({
          error: 'Too Many Requests',
          statusCode: 429,
          retryAfter: resetTimeSeconds,
        });
        return;
      }
      
      next();
    } catch (error) {
      // If rate limiting fails, log error but don't block request
      logger.error('Rate limiter error', { error, ip: req.ip });
      next();
    }
  };
}