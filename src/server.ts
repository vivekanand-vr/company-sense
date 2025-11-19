// Register module aliases before any other imports
import 'module-alias/register';

import app from './app';
import { prisma } from '@/lib/prisma';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';
import { createServer } from 'http';
import { webSocketService } from '@/services/websocket.service';

async function startServer(): Promise<void> {
  try {
    // Connect to database
    await prisma.$connect();
    logger.info('Database connected');

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize WebSocket service
    webSocketService.initialize(httpServer);
    logger.info('WebSocket service initialized');

    // Start HTTP server with WebSocket support
    const server = httpServer.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Environment: ${config.isDevelopment ? 'development' : 'production'}`);
      logger.info(`API URL: http://localhost:${config.port}`);
      logger.info(`WebSocket URL: ws://localhost:${config.port}`);
      logger.info(`Health check: http://localhost:${config.port}/health`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          // Close WebSocket connections
          webSocketService.broadcastSystemMessage('Server shutting down', 'warning');
          
          await prisma.$disconnect();
          logger.info('Database disconnected');

          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions with detailed logging
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception detected', { 
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: (error as any).code,
          errno: (error as any).errno,
          syscall: (error as any).syscall,
          address: (error as any).address,
          port: (error as any).port
        },
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        pid: process.pid
      });
      
      // Give time for logging before exit
      setTimeout(() => {
        process.exit(1);
      }, 2000);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Promise Rejection detected', { 
        reason: reason instanceof Error ? {
          name: reason.name,
          message: reason.message,
          stack: reason.stack,
          code: (reason as any).code,
          errno: (reason as any).errno,
          syscall: (reason as any).syscall,
          address: (reason as any).address,
          port: (reason as any).port
        } : reason,
        promise: promise.toString(),
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        pid: process.pid
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();