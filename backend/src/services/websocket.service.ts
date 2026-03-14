import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '../lib/logger';
import { JobStatus, JobMessage } from './job-manager.service';

export interface WebSocketService {
  initialize(httpServer: HttpServer): void;
  emitJobUpdate(jobId: string, job: JobStatus): void;
  emitJobMessage(jobId: string, message: JobMessage): void;
  emitJobProgress(jobId: string, progress: any): void;
  emitJobCompleted(jobId: string, job: JobStatus): void;
  emitJobFailed(jobId: string, job: JobStatus): void;
}

class WebSocketServiceImpl implements WebSocketService {
  private io: SocketIOServer | null = null;

  initialize(httpServer: HttpServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.io.on('connection', (socket) => {
      logger.info('Client connected to WebSocket', { 
        socketId: socket.id,
        clientIP: socket.handshake.address 
      });

      // Handle job subscription
      socket.on('subscribe-job', (jobId: string) => {
        if (!jobId) {
          socket.emit('error', { message: 'Job ID is required for subscription' });
          return;
        }

        socket.join(`job-${jobId}`);
        logger.info('Client subscribed to job updates', { 
          socketId: socket.id, 
          jobId 
        });

        socket.emit('job-subscribed', { jobId });
      });

      // Handle job unsubscription
      socket.on('unsubscribe-job', (jobId: string) => {
        if (jobId) {
          socket.leave(`job-${jobId}`);
          logger.info('Client unsubscribed from job updates', { 
            socketId: socket.id, 
            jobId 
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        logger.info('Client disconnected from WebSocket', { 
          socketId: socket.id, 
          reason 
        });
      });

      // Handle connection errors
      socket.on('error', (error) => {
        logger.error('WebSocket connection error', { 
          socketId: socket.id, 
          error: error.message 
        });
      });

      // Send initial connection success
      socket.emit('connected', { 
        message: 'Successfully connected to job monitoring',
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
    });

    logger.info('WebSocket server initialized', {
      cors: this.io.engine.opts.cors,
      transports: this.io.engine.opts.transports
    });
  }

  emitJobUpdate(jobId: string, job: JobStatus): void {
    if (!this.io) {
      logger.warn('WebSocket not initialized, cannot emit job update');
      return;
    }

    const room = `job-${jobId}`;
    this.io.to(room).emit('job-update', {
      jobId,
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        error: job.error
      },
      timestamp: new Date().toISOString()
    });

    logger.debug('Emitted job update via WebSocket', { 
      jobId, 
      status: job.status, 
      room 
    });
  }

  emitJobMessage(jobId: string, message: JobMessage): void {
    if (!this.io) {
      logger.warn('WebSocket not initialized, cannot emit job message');
      return;
    }

    const room = `job-${jobId}`;
    this.io.to(room).emit('job-message', {
      jobId,
      message,
      timestamp: new Date().toISOString()
    });

    logger.debug('Emitted job message via WebSocket', { 
      jobId, 
      messageLevel: message.level,
      companyName: message.companyName,
      room 
    });
  }

  emitJobProgress(jobId: string, progress: any): void {
    if (!this.io) {
      logger.warn('WebSocket not initialized, cannot emit job progress');
      return;
    }

    const room = `job-${jobId}`;
    this.io.to(room).emit('job-progress', {
      jobId,
      progress,
      timestamp: new Date().toISOString()
    });

    logger.debug('Emitted job progress via WebSocket', { 
      jobId, 
      completed: progress.completed,
      total: progress.total,
      room 
    });
  }

  emitJobCompleted(jobId: string, job: JobStatus): void {
    if (!this.io) {
      logger.warn('WebSocket not initialized, cannot emit job completion');
      return;
    }

    const room = `job-${jobId}`;
    this.io.to(room).emit('job-completed', {
      jobId,
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        result: job.result,
        completedAt: job.completedAt
      },
      timestamp: new Date().toISOString()
    });

    logger.info('Emitted job completion via WebSocket', { 
      jobId, 
      status: job.status,
      totalProcessed: job.progress.completed,
      room 
    });
  }

  emitJobFailed(jobId: string, job: JobStatus): void {
    if (!this.io) {
      logger.warn('WebSocket not initialized, cannot emit job failure');
      return;
    }

    const room = `job-${jobId}`;
    this.io.to(room).emit('job-failed', {
      jobId,
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        error: job.error,
        completedAt: job.completedAt
      },
      timestamp: new Date().toISOString()
    });

    logger.error('Emitted job failure via WebSocket', { 
      jobId, 
      error: job.error,
      progress: job.progress,
      room 
    });
  }

  // Get connected clients count for a job
  getJobSubscriberCount(jobId: string): number {
    if (!this.io) return 0;
    
    const room = this.io.sockets.adapter.rooms.get(`job-${jobId}`);
    return room ? room.size : 0;
  }

  // Broadcast system message to all connected clients
  broadcastSystemMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (!this.io) return;

    this.io.emit('system-message', {
      message,
      level,
      timestamp: new Date().toISOString()
    });

    logger.info('Broadcasted system message via WebSocket', { message, level });
  }

  // Get WebSocket server statistics
  getStats() {
    if (!this.io) return null;

    return {
      connectedClients: this.io.engine.clientsCount,
      rooms: Array.from(this.io.sockets.adapter.rooms.keys()),
      uptime: process.uptime()
    };
  }
}

// Export singleton instance
export const webSocketService = new WebSocketServiceImpl();