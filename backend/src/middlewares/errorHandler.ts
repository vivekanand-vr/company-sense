import { Request, Response, NextFunction } from 'express';
import { logger } from '@/lib/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: AppError, 
  req: Request, 
  res: Response, 
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Log error
  logger.error('Request error', {
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      statusCode,
    },
    request: {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    },
  });

  // Send error response
  res.status(statusCode).json({
    error: message,
    statusCode,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * Handle 404 errors
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: `Route ${req.method} ${req.path} not found`,
    statusCode: 404,
  });
}

/**
 * Async error wrapper
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}