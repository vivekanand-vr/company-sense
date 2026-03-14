import { Request, Response } from 'express';
import { databaseLogger } from '../lib/database-logger';
import { logger } from '../lib/logger';
import fs from 'fs';
import path from 'path';

/**
 * Get database statistics and logging information
 * GET /api/db/stats
 */
export const getDatabaseStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = databaseLogger.getStats();
    const logsDir = path.join(process.cwd(), 'logs');
    
    // Check log file sizes
    const dbTransactionsPath = path.join(logsDir, 'db-transactions.log');
    const dbErrorsPath = path.join(logsDir, 'db-errors.log');
    
    const logFileStats = {
      transactionsLog: {
        exists: fs.existsSync(dbTransactionsPath),
        size: fs.existsSync(dbTransactionsPath) ? `${(fs.statSync(dbTransactionsPath).size / 1024 / 1024).toFixed(2)} MB` : '0 MB'
      },
      errorsLog: {
        exists: fs.existsSync(dbErrorsPath),
        size: fs.existsSync(dbErrorsPath) ? `${(fs.statSync(dbErrorsPath).size / 1024 / 1024).toFixed(2)} MB` : '0 MB'
      }
    };

    res.status(200).json({
      success: true,
      data: {
        queryStats: stats,
        logFiles: logFileStats,
        logDirectory: logsDir
      }
    });

  } catch (error) {
    logger.error('Failed to get database stats', {
      error: (error as Error).message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve database statistics'
    });
  }
};

/**
 * Reset database statistics
 * POST /api/db/stats/reset
 */
export const resetDatabaseStats = async (req: Request, res: Response): Promise<void> => {
  try {
    databaseLogger.resetStats();
    
    logger.info('Database statistics reset');
    
    res.status(200).json({
      success: true,
      message: 'Database statistics have been reset'
    });

  } catch (error) {
    logger.error('Failed to reset database stats', {
      error: (error as Error).message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to reset database statistics'
    });
  }
};