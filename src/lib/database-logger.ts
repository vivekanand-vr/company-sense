import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Database logger configuration
const dbLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Database transactions log
    new winston.transports.File({
      filename: path.join(logsDir, 'db-transactions.log'),
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 5,
      tailable: true
    }),
    // Database errors log
    new winston.transports.File({
      filename: path.join(logsDir, 'db-errors.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 3,
      tailable: true
    })
  ]
});

// Database query logger with performance tracking
export class DatabaseLogger {
  private static instance: DatabaseLogger;
  private queryCount = 0;
  private totalQueryTime = 0;

  private constructor() {}

  static getInstance(): DatabaseLogger {
    if (!DatabaseLogger.instance) {
      DatabaseLogger.instance = new DatabaseLogger();
    }
    return DatabaseLogger.instance;
  }

  /**
   * Log database query with performance metrics
   */
  logQuery(query: string, params?: any[], duration?: number) {
    this.queryCount++;
    if (duration) {
      this.totalQueryTime += duration;
    }

    const logData = {
      type: 'query',
      timestamp: new Date().toISOString(),
      queryNumber: this.queryCount,
      query: this.sanitizeQuery(query),
      params: params ? this.sanitizeParams(params) : undefined,
      duration: duration ? `${duration}ms` : undefined,
      performanceMetrics: {
        totalQueries: this.queryCount,
        averageQueryTime: duration ? `${(this.totalQueryTime / this.queryCount).toFixed(2)}ms` : undefined
      }
    };

    dbLogger.info('Database Query', logData);
  }

  /**
   * Log database error
   */
  logError(error: any, context?: any) {
    const logData = {
      type: 'error',
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        code: error.code,
        meta: error.meta
      },
      context
    };

    dbLogger.error('Database Error', logData);
  }

  /**
   * Log database warning
   */
  logWarning(message: string, context?: any) {
    const logData = {
      type: 'warning',
      timestamp: new Date().toISOString(),
      message,
      context
    };

    dbLogger.warn('Database Warning', logData);
  }

  /**
   * Log database info (connections, migrations, etc.)
   */
  logInfo(message: string, context?: any) {
    const logData = {
      type: 'info',
      timestamp: new Date().toISOString(),
      message,
      context
    };

    dbLogger.info('Database Info', logData);
  }

  /**
   * Get database statistics
   */
  getStats() {
    return {
      totalQueries: this.queryCount,
      totalQueryTime: this.totalQueryTime,
      averageQueryTime: this.queryCount > 0 ? (this.totalQueryTime / this.queryCount).toFixed(2) : 0
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.queryCount = 0;
    this.totalQueryTime = 0;
  }

  /**
   * Sanitize SQL query for logging (remove sensitive data)
   */
  private sanitizeQuery(query: string): string {
    // Remove potential sensitive data patterns
    return query
      .replace(/VALUES\s*\([^)]*\)/gi, 'VALUES (...)')
      .replace(/SET\s+password\s*=\s*[^,\s]+/gi, 'SET password = [REDACTED]')
      .replace(/WHERE\s+password\s*=\s*[^,\s]+/gi, 'WHERE password = [REDACTED]');
  }

  /**
   * Sanitize query parameters for logging
   */
  private sanitizeParams(params: any[]): any[] {
    return params.map(param => {
      if (typeof param === 'string' && param.length > 100) {
        return `[TRUNCATED:${param.length}chars]`;
      }
      return param;
    });
  }
}

// Export singleton instance
export const databaseLogger = DatabaseLogger.getInstance();