import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { config } from '@/lib/config';
import { requestLogger } from '@/middlewares/requestLogger';
import { rateLimiterMiddleware } from '@/middlewares/rateLimiter';
import { errorHandler, notFoundHandler } from '@/middlewares/errorHandler';
import { setupSwagger } from '@/lib/swagger';

// Import routes
import companiesRouter from '@/routes/companies';
import healthRouter from '@/routes/health';
import debugRouter from '@/routes/debug';
import authRouter from '@/routes/auth';
import databaseRouter from './routes/database';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ 
  limit: '1mb',
  strict: true,
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '1mb',
}));

// Request logging
app.use(requestLogger);

// Rate limiting
app.use(rateLimiterMiddleware());

// Setup Swagger documentation
setupSwagger(app);

// Health check routes (no auth required)
app.use('/', healthRouter);

// Debug routes (development only)
if (config.isDevelopment) {
  app.use('/debug', debugRouter);
}

// API routes
app.use('/api/auth', authRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/db', databaseRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Company Intelligence Platform API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: config.isDevelopment ? 'development' : 'production',
    endpoints: {
      health: '/health',
      ready: '/ready', 
      metrics: '/metrics',
      documentation: '/api-docs - Interactive Swagger UI Documentation',
      auth: {
        login: 'POST /api/auth/login - Admin login',
        logout: 'POST /api/auth/logout - Logout (requires token)',
        verify: 'GET /api/auth/verify - Verify token validity',
        refresh: 'POST /api/auth/refresh - Refresh JWT token',
        me: 'GET /api/auth/me - Get current user info'
      },
      companies: {
        list: 'GET /api/companies - List companies with advanced filtering and pagination',
        lookup: 'POST /api/companies/lookup - AI-powered company lookup (database-first)',
        bulkLookup: 'POST /api/companies/bulk-lookup - Bulk company processing',
        exportExcel: 'GET /api/companies/export/excel - Export filtered companies to Excel',
        exportAllExcel: 'GET /api/companies/export/all/excel - Export complete database to Excel',
        exportCSV: 'GET /api/companies/export/csv - Export companies to CSV format',
      },
      database: {
        stats: 'GET /api/db/stats - Get database query statistics and log file info',
        resetStats: 'POST /api/db/stats/reset - Reset database query statistics'
      },
    },
    features: {
      databaseFirstOptimization: true,
      aiPoweredEnrichment: true,
      interactiveDocumentation: true,
      advancedFiltering: true,
      exportCapabilities: true,
      realTimeResults: true,
    }
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;