import { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import { config } from '@/lib/config';

/**
 * Health check endpoint
 */
export const healthCheck = async (req: Request, res: Response): Promise<void> => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.isDevelopment ? 'development' : 'production',
    services: {
      database: 'unknown',
    },
  };

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = 'healthy';
  } catch (error) {
    health.services.database = 'unhealthy';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
};

/**
 * Readiness check endpoint
 */
export const readinessCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if database is ready
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Basic metrics endpoint
 */
export const getMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get basic system metrics
    res.json({
      timestamp: new Date().toISOString(),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
        environment: config.isDevelopment ? 'development' : 'production',
      },
      services: {
        database: 'connected',
        processing: 'direct',
        queue: 'disabled',
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};