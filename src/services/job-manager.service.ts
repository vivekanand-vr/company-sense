import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../lib/logger';
import { webSocketService } from './websocket.service';

export interface JobMessage {
  timestamp: Date;
  level: 'info' | 'success' | 'error' | 'warning';
  message: string;
  companyName?: string | undefined;
  metadata?: any;
}

export interface JobStatus {
  id: string;
  type: 'bulk_lookup';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: {
    total: number;
    completed: number;
    successful: number;
    failed: number;
    current?: string | undefined;
  };
  messages: JobMessage[];
  result?: any;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export class JobManagerService extends EventEmitter {
  private jobs: Map<string, JobStatus> = new Map();
  private static instance: JobManagerService;

  constructor() {
    super();
    // Clean up old jobs every hour
    setInterval(() => this.cleanupOldJobs(), 60 * 60 * 1000);
  }

  static getInstance(): JobManagerService {
    if (!JobManagerService.instance) {
      JobManagerService.instance = new JobManagerService();
    }
    return JobManagerService.instance;
  }

  /**
   * Create a new job and return its ID
   */
  createJob(type: 'bulk_lookup', totalItems: number, metadata?: any): string {
    const jobId = uuidv4();
    
    const job: JobStatus = {
      id: jobId,
      type,
      status: 'pending',
      progress: {
        total: totalItems,
        completed: 0,
        successful: 0,
        failed: 0
      },
      messages: [],
      createdAt: new Date()
    };

    this.jobs.set(jobId, job);
    
    this.addJobMessage(jobId, 'info', `Job created with ${totalItems} items to process`, undefined, metadata);
    
    logger.info('New job created', { jobId, type, totalItems, metadata });
    
    return jobId;
  }

  /**
   * Start a job
   */
  startJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    job.status = 'running';
    job.startedAt = new Date();
    
    this.addJobMessage(jobId, 'info', 'Job started processing');
    this.emit('jobStatusChanged', jobId, job);
    
    // Emit WebSocket update
    webSocketService.emitJobUpdate(jobId, job);
  }

  /**
   * Add a message to a job
   */
  addJobMessage(jobId: string, level: JobMessage['level'], message: string, companyName?: string, metadata?: any): void {
    const job = this.jobs.get(jobId);
    if (!job) {
      return;
    }

    const jobMessage: JobMessage = {
      timestamp: new Date(),
      level,
      message,
      ...(companyName && { companyName }),
      ...(metadata && { metadata })
    };

    job.messages.push(jobMessage);
    
    // Keep only last 1000 messages to prevent memory issues
    if (job.messages.length > 1000) {
      job.messages = job.messages.slice(-1000);
    }

    this.emit('jobMessageAdded', jobId, jobMessage);
    
    // Emit WebSocket message
    webSocketService.emitJobMessage(jobId, jobMessage);
    
    logger.info('Job message added', { jobId, level, message, companyName });
  }

  /**
   * Update job progress
   */
  updateJobProgress(jobId: string, completed: number, successful: number, failed: number, currentCompany?: string): void {
    const job = this.jobs.get(jobId);
    if (!job) {
      return;
    }

    job.progress.completed = completed;
    job.progress.successful = successful;
    job.progress.failed = failed;
    if (currentCompany !== undefined) {
      job.progress.current = currentCompany;
    }

    this.emit('jobProgressUpdated', jobId, job.progress);
    
    // Emit WebSocket progress update
    webSocketService.emitJobProgress(jobId, job.progress);
  }

  /**
   * Mark job as completed
   */
  completeJob(jobId: string, result?: any): void {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    job.status = 'completed';
    job.completedAt = new Date();
    job.result = result;
    
    const duration = job.completedAt.getTime() - (job.startedAt?.getTime() || job.createdAt.getTime());
    
    this.addJobMessage(jobId, 'success', `Job completed successfully in ${Math.round(duration / 1000)}s. Processed ${job.progress.completed}/${job.progress.total} companies. Success: ${job.progress.successful}, Failed: ${job.progress.failed}`);
    
    this.emit('jobCompleted', jobId, job);
    
    // Emit WebSocket completion
    webSocketService.emitJobCompleted(jobId, job);
    
    logger.info('Job completed', { 
      jobId, 
      duration, 
      progress: job.progress,
      resultSummary: result?.summary 
    });
  }

  /**
   * Mark job as failed
   */
  failJob(jobId: string, error: string): void {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    job.status = 'failed';
    job.completedAt = new Date();
    job.error = error;
    
    this.addJobMessage(jobId, 'error', `Job failed: ${error}`);
    
    this.emit('jobFailed', jobId, job);
    
    // Emit WebSocket failure
    webSocketService.emitJobFailed(jobId, job);
    
    logger.error('Job failed', { jobId, error, progress: job.progress });
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): JobStatus | null {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Get job messages (with optional pagination)
   */
  getJobMessages(jobId: string, lastMessageIndex?: number): JobMessage[] {
    const job = this.jobs.get(jobId);
    if (!job) {
      return [];
    }

    if (lastMessageIndex !== undefined) {
      return job.messages.slice(lastMessageIndex + 1);
    }

    return job.messages;
  }

  /**
   * Get all jobs (for admin purposes)
   */
  getAllJobs(): JobStatus[] {
    return Array.from(this.jobs.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * Delete a job
   */
  deleteJob(jobId: string): boolean {
    return this.jobs.delete(jobId);
  }

  /**
   * Clean up old completed jobs (older than 24 hours)
   */
  private cleanupOldJobs(): void {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24);

    let deletedCount = 0;
    
    for (const [jobId, job] of this.jobs.entries()) {
      if (
        (job.status === 'completed' || job.status === 'failed') &&
        job.completedAt &&
        job.completedAt < cutoffTime
      ) {
        this.jobs.delete(jobId);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      logger.info('Cleaned up old jobs', { deletedCount });
    }
  }

  /**
   * Get job statistics
   */
  getJobStats(): {
    total: number;
    running: number;
    completed: number;
    failed: number;
    pending: number;
  } {
    const jobs = Array.from(this.jobs.values());
    
    return {
      total: jobs.length,
      running: jobs.filter(j => j.status === 'running').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      pending: jobs.filter(j => j.status === 'pending').length
    };
  }
}

// Export singleton instance
export const jobManager = JobManagerService.getInstance();