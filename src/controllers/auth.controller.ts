import { Request, Response } from 'express';
import { authService, LoginCredentials } from '../services/auth.service';
import { logger } from '../lib/logger';

/**
 * Login endpoint
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password }: LoginCredentials = req.body;

    // Validate input
    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
      return;
    }

    // Attempt login
    const result = await authService.login({ username, password });

    if (result.success) {
      logger.info('Login successful', { username });
      
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token: result.token,
          user: result.user
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: result.message
      });
    }

  } catch (error) {
    logger.error('Login endpoint error', { 
      error: (error as Error).message,
      body: req.body 
    });

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Logout endpoint (client-side token removal, server just confirms)
 * POST /api/auth/logout
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const username = req.user?.username || 'unknown';
    
    logger.info('User logged out', { username });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    logger.error('Logout endpoint error', { 
      error: (error as Error).message 
    });

    res.status(500).json({
      success: false,
      message: 'Logout error'
    });
  }
};

/**
 * Verify token endpoint
 * GET /api/auth/verify
 */
export const verifyToken = async (req: Request, res: Response): Promise<void> => {
  try {
    // If we reach this point, the authenticateToken middleware has already verified the token
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        user: req.user
      }
    });

  } catch (error) {
    logger.error('Token verification endpoint error', { 
      error: (error as Error).message 
    });

    res.status(500).json({
      success: false,
      message: 'Token verification error'
    });
  }
};

/**
 * Refresh token endpoint
 * POST /api/auth/refresh
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: 'Current token required'
      });
      return;
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    const result = authService.refreshToken(token);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: result.token,
          user: result.user
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: result.message
      });
    }

  } catch (error) {
    logger.error('Token refresh endpoint error', { 
      error: (error as Error).message 
    });

    res.status(500).json({
      success: false,
      message: 'Token refresh error'
    });
  }
};

/**
 * Get current user info
 * GET /api/auth/me
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: req.user
      }
    });

  } catch (error) {
    logger.error('Get current user endpoint error', { 
      error: (error as Error).message 
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get user info'
    });
  }
};