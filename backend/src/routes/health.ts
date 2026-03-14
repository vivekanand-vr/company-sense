import { Router } from 'express';
import { asyncHandler } from '@/middlewares/errorHandler';
import { healthCheck, readinessCheck, getMetrics } from '@/controllers/health.controller';

const router = Router();

/**
 * GET /health
 * Health check endpoint
 */
router.get('/health', asyncHandler(healthCheck));

/**
 * GET /ready
 * Readiness check endpoint
 */
router.get('/ready', asyncHandler(readinessCheck));

/**
 * GET /metrics
 * Basic metrics endpoint
 */
router.get('/metrics', asyncHandler(getMetrics));

export default router;