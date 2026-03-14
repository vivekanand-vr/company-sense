import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { logger } from '../lib/logger';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  message?: string;
  user?: {
    username: string;
    role: string;
  };
}

export class AuthService {
  private readonly jwtSecret: string;
  private readonly adminUsername: string;
  private readonly adminPasswordHash: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    this.adminUsername = process.env.ADMIN_USERNAME || 'admin';
    
    if (!process.env.JWT_SECRET) {
      logger.warn('JWT_SECRET not set in environment variables. Using fallback key.');
    }

    // Hash the admin password from environment
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    this.adminPasswordHash = bcrypt.hashSync(adminPassword, 10);
    
    logger.info('Auth service initialized', { 
      adminUsername: this.adminUsername,
      hasJwtSecret: !!process.env.JWT_SECRET 
    });
  }

  /**
   * Authenticate user with username and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { username, password } = credentials;

      // Check if username matches admin username
      if (username !== this.adminUsername) {
        logger.warn('Login attempt with invalid username', { username });
        return {
          success: false,
          message: 'Invalid username or password'
        };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, this.adminPasswordHash);
      if (!isValidPassword) {
        logger.warn('Login attempt with invalid password', { username });
        return {
          success: false,
          message: 'Invalid username or password'
        };
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          username: this.adminUsername, 
          role: 'admin',
          iat: Math.floor(Date.now() / 1000)
        },
        this.jwtSecret,
        { expiresIn: '24h' }
      );

      logger.info('User logged in successfully', { username });

      return {
        success: true,
        token,
        user: {
          username: this.adminUsername,
          role: 'admin'
        }
      };

    } catch (error) {
      logger.error('Login error', { error: (error as Error).message });
      return {
        success: false,
        message: 'Internal server error'
      };
    }
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): { valid: boolean; user?: any; error?: string } {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      return {
        valid: true,
        user: decoded
      };
    } catch (error) {
      let errorMessage = 'Invalid token';
      
      if (error instanceof jwt.TokenExpiredError) {
        errorMessage = 'Token expired';
      } else if (error instanceof jwt.JsonWebTokenError) {
        errorMessage = 'Invalid token format';
      }

      return {
        valid: false,
        error: errorMessage
      };
    }
  }

  /**
   * Generate a new token for an existing valid user (refresh)
   */
  refreshToken(currentToken: string): AuthResponse {
    try {
      const verification = this.verifyToken(currentToken);
      
      if (!verification.valid || !verification.user) {
        return {
          success: false,
          message: verification.error || 'Invalid token'
        };
      }

      // Generate new token
      const newToken = jwt.sign(
        { 
          username: verification.user.username, 
          role: verification.user.role,
          iat: Math.floor(Date.now() / 1000)
        },
        this.jwtSecret,
        { expiresIn: '24h' }
      );

      return {
        success: true,
        token: newToken,
        user: {
          username: verification.user.username,
          role: verification.user.role
        }
      };

    } catch (error) {
      logger.error('Token refresh error', { error: (error as Error).message });
      return {
        success: false,
        message: 'Token refresh failed'
      };
    }
  }
}

// Export singleton instance
export const authService = new AuthService();