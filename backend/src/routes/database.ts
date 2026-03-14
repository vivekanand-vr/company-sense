import { Router } from 'express';
import { getDatabaseStats, resetDatabaseStats } from '../controllers/database.controller';

const router = Router();

/**
 * @swagger
 * /api/db/stats:
 *   get:
 *     summary: Get database query statistics
 *     tags: [Database]
 *     responses:
 *       200:
 *         description: Database statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     queryStats:
 *                       type: object
 *                       properties:
 *                         totalQueries:
 *                           type: number
 *                         totalQueryTime:
 *                           type: number
 *                         averageQueryTime:
 *                           type: string
 *                     logFiles:
 *                       type: object
 *                       properties:
 *                         transactionsLog:
 *                           type: object
 *                           properties:
 *                             exists:
 *                               type: boolean
 *                             size:
 *                               type: string
 *                         errorsLog:
 *                           type: object
 *                           properties:
 *                             exists:
 *                               type: boolean
 *                             size:
 *                               type: string
 */
router.get('/stats', getDatabaseStats);

/**
 * @swagger
 * /api/db/stats/reset:
 *   post:
 *     summary: Reset database query statistics
 *     tags: [Database]
 *     responses:
 *       200:
 *         description: Statistics reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post('/stats/reset', resetDatabaseStats);

export default router;