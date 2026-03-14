import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '@/lib/logger';

export interface ValidatedRequest<T> extends Request {
  body: T;
}

/**
 * Middleware to validate request body against Zod schema
 */
export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      (req as ValidatedRequest<T>).body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorDetails = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        logger.warn('Validation error', { 
          path: req.path, 
          method: req.method, 
          errors: errorDetails 
        });
        
        res.status(400).json({
          error: 'Invalid request data',
          details: errorDetails.map(e => `${e.field}: ${e.message}`).join(', '),
          statusCode: 400,
        });
        return;
      }
      
      logger.error('Unexpected validation error', { error });
      res.status(500).json({
        error: 'Internal server error',
        statusCode: 500,
      });
    }
  };
}