import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { logger } from '../lib/logger';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        username: string;
        role: string;
        iat: number;
        exp: number;
      };
    }
  }
}

/**
 * Middleware to authenticate requests using JWT tokens
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: 'Access token required'
      });
      return;
    }

    // Extract token from "Bearer TOKEN" format
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Invalid token format'
      });
      return;
    }

    // Verify token
    const verification = authService.verifyToken(token);

    if (!verification.valid) {
      logger.warn('Authentication failed', { 
        error: verification.error,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(401).json({
        success: false,
        message: verification.error || 'Invalid token'
      });
      return;
    }

    // Add user to request object
    req.user = verification.user;
    
    logger.info('Request authenticated', { 
      username: verification.user.username,
      route: req.path,
      method: req.method
    });

    next();

  } catch (error) {
    logger.error('Authentication middleware error', { 
      error: (error as Error).message,
      path: req.path 
    });

    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

/**
 * Optional middleware - authenticate if token is provided, but don't require it
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      next();
      return;
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (token) {
      const verification = authService.verifyToken(token);
      
      if (verification.valid) {
        req.user = verification.user;
      }
    }

    next();

  } catch (error) {
    // Don't fail the request, just proceed without authentication
    logger.warn('Optional authentication failed', { 
      error: (error as Error).message 
    });
    next();
  }
};