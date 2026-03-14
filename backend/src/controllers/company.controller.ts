import { Request, Response } from 'express';
import { logger } from '../lib/logger';
import { CompanyService } from '../services/company.service';
import { ExcelExportService } from '../services/excel-export.service';
import { bulkSelectedSchema } from '../schemas/companies';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { jobManager } from '../services/job-manager.service';
import { webSocketService } from '../services/websocket.service';

// Validation schemas
const CompanyLookupSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  filters: z.object({
    turnover: z.string().optional(),
    turnoverCustom: z.number().positive().optional(),
    headcount: z.string().optional(),
    headcountCustom: z.number().positive().optional(),
    type: z.string().optional(),
    typeCustom: z.string().optional(),
    location: z.string().optional(),
    keywords: z.array(z.string()).optional()
  }).optional()
});

const BulkLookupSchema = z.object({
  companies: z.array(z.string().min(1)).min(1, 'At least one company name is required'),
  filters: z.object({
    turnover: z.string().optional(),
    turnoverCustom: z.number().positive().optional(),
    headcount: z.string().optional(),
    headcountCustom: z.number().positive().optional(),
    type: z.string().optional(),
    typeCustom: z.string().optional(),
    location: z.string().optional(),
    keywords: z.array(z.string()).optional()
  }).optional()
});

const companyService = new CompanyService();
const excelExportService = new ExcelExportService();

/**
 * Main company lookup using Google Search → Apollo API → ChatGPT pipeline
 */
export const lookupCompany = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    // Validate request body
    const validation = CompanyLookupSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validation.error.errors
      });
      return;
    }

    const { companyName, filters } = validation.data;
    
    logger.info('Company lookup initiated', { companyName, filters });
    
    // Clean filters to ensure proper typing - only include defined values
    const cleanFilters = filters ? Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined)
    ) as typeof filters : undefined;
    
    const result = await companyService.lookupCompany(companyName, cleanFilters);

    if (!result.meetsFilterCriteria && filters) {
      res.status(200).json({
        success: false,
        message: `Company found but doesn't meet your criteria. ${formatFilterMessage(result.filterAnalysis || {})}`,
        data: {
          company: result.company,
          meetsFilterCriteria: false,
          filterAnalysis: result.filterAnalysis
        },
        processingTimeMs: result.processingTimeMs
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        company: result.company,
        meetsFilterCriteria: result.meetsFilterCriteria,
        filterAnalysis: result.filterAnalysis
      },
      processingTimeMs: result.processingTimeMs
    });

  } catch (error) {
    const processingTimeMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Company lookup failed', { 
      companyName: req.body.companyName,
      error: errorMessage,
      processingTimeMs
    });

    res.status(500).json({
      success: false,
      message: errorMessage,
      processingTimeMs
    });
  }
};

/**
 * Bulk company lookup with filtering (background job version)
 */
export const bulkLookupCompanies = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validation = BulkLookupSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validation.error.errors
      });
      return;
    }

    const { companies, filters } = validation.data;
    
    logger.info('Bulk company lookup job initiated', { 
      companiesCount: companies.length, 
      filters 
    });
    
    // Clean filters to ensure proper typing - only include defined values
    const cleanFilters = filters ? Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined)
    ) as typeof filters : undefined;
    
    // Start job in background and return job ID immediately
    const jobId = await companyService.startBulkLookupJob(companies, cleanFilters);

    res.status(202).json({
      success: true,
      message: 'Bulk lookup job started successfully',
      data: {
        jobId,
        companiesCount: companies.length,
        appliedFilters: filters,
        statusEndpoint: `/api/companies/jobs/${jobId}/status`
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Failed to start bulk company lookup job', { 
      companies: req.body.companies,
      error: errorMessage
    });

    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Bulk company lookup with filtering (synchronous version for backward compatibility)
 */
export const bulkLookupCompaniesSync = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    // Validate request body
    const validation = BulkLookupSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validation.error.errors
      });
      return;
    }

    const { companies, filters } = validation.data;
    
    logger.info('Synchronous bulk company lookup initiated', { 
      companiesCount: companies.length, 
      filters 
    });
    
    // Clean filters to ensure proper typing - only include defined values
    const cleanFilters = filters ? Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined)
    ) as typeof filters : undefined;
    
    const result = await companyService.bulkLookup(companies, cleanFilters);
    const processingTimeMs = Date.now() - startTime;

    // Filter results that meet criteria if filters were applied
    const filteredResults = filters 
      ? result.results.filter(r => r.meetsFilterCriteria)
      : result.results;

    if (filteredResults.length === 0 && filters) {
      res.status(200).json({
        success: false,
        message: 'No companies found that meet the specified filter criteria',
        data: {
          results: [],
          summary: result.summary,
          appliedFilters: filters
        },
        processingTimeMs
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        results: filteredResults,
        summary: {
          ...result.summary,
          returnedResults: filteredResults.length
        },
        appliedFilters: filters
      },
      processingTimeMs
    });

  } catch (error) {
    const processingTimeMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Synchronous bulk company lookup failed', { 
      companies: req.body.companies,
      error: errorMessage,
      processingTimeMs
    });

    res.status(500).json({
      success: false,
      message: errorMessage,
      processingTimeMs
    });
  }
};

/**
 * Export filtered companies to Excel
 */
export const exportCompaniesExcel = async (req: Request, res: Response): Promise<void> => {
  try {
    // Parse query parameters (same as listCompanies)
    const {
      industry,
      minEmployees,
      maxEmployees,
      minRevenue,
      maxRevenue,
      country,
      publiclyTraded,
      search
    } = req.query;

    // Build Prisma filters (same logic as listCompanies)
    const filters: any = {};
    
    if (search) {
      filters.OR = [
        { name: { contains: search as string } },
        { domain: { contains: search as string } },
        { industry: { contains: search as string } }
      ];
    }

    if (industry) {
      filters.industry = { contains: industry as string };
    }

    if (minEmployees) {
      filters.employees = { ...filters.employees, gte: parseInt(minEmployees as string) };
    }

    if (maxEmployees) {
      filters.employees = { ...filters.employees, lte: parseInt(maxEmployees as string) };
    }

    if (minRevenue) {
      filters.revenue = { ...filters.revenue, gte: parseInt(minRevenue as string) };
    }

    if (maxRevenue) {
      filters.revenue = { ...filters.revenue, lte: parseInt(maxRevenue as string) };
    }

    if (country) {
      filters.country = { equals: country as string };
    }

    if (publiclyTraded !== undefined) {
      filters.publiclyTraded = publiclyTraded === 'true';
    }
    
    logger.info('Excel export initiated', { filters });
    
    const buffer = await excelExportService.exportFilteredCompanies(filters);
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `companies_filtered_${timestamp}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    
    res.send(buffer);
    
    logger.info('Excel export completed successfully', { 
      filename,
      bufferSize: buffer.length 
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Excel export failed', { 
      error: errorMessage,
      filters: req.query
    });

    res.status(500).json({
      success: false,
      message: `Excel export failed: ${errorMessage}`
    });
  }
};

/**
 * Export all companies to Excel
 */
export const exportAllCompaniesExcel = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('All companies Excel export initiated');
    
    const buffer = await excelExportService.exportAllCompanies();
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `all_companies_${timestamp}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    
    res.send(buffer);
    
    logger.info('All companies Excel export completed successfully', { 
      filename,
      bufferSize: buffer.length 
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('All companies Excel export failed', { error: errorMessage });

    res.status(500).json({
      success: false,
      message: `Excel export failed: ${errorMessage}`
    });
  }
};

/**
 * Export companies to CSV
 */
export const exportCompaniesCSV = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = req.query as any;
    
    logger.info('CSV export initiated', { filters });
    
    const csvContent = await excelExportService.exportToCSV(filters);
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `companies_${timestamp}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));
    
    res.send(csvContent);
    
    logger.info('CSV export completed successfully', { 
      filename,
      contentLength: csvContent.length 
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('CSV export failed', { 
      error: errorMessage,
      filters: req.query
    });

    res.status(500).json({
      success: false,
      message: `CSV export failed: ${errorMessage}`
    });
  }
};

/**
 * List companies with optional filtering
 * GET /api/companies
 */
export const listCompanies = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    logger.info('Company list request initiated', { query: req.query });

    // Parse query parameters
    const {
      page = 1,
      limit = 20,
      industry,
      minEmployees,
      maxEmployees,
      minRevenue,
      maxRevenue,
      country,
      publiclyTraded,
      search,
      sortBy = 'lastUpdated',
      sortOrder = 'desc'
    } = req.query;

    // Validate pagination
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Build filters
    const filters: any = {};
    
    if (search) {
      filters.OR = [
        { name: { contains: search as string } },
        { domain: { contains: search as string } },
        { industry: { contains: search as string } }
      ];
    }

    if (industry) {
      filters.industry = { contains: industry as string };
    }

    if (minEmployees) {
      filters.employees = { ...filters.employees, gte: parseInt(minEmployees as string) };
    }

    if (maxEmployees) {
      filters.employees = { ...filters.employees, lte: parseInt(maxEmployees as string) };
    }

    if (minRevenue) {
      filters.revenue = { ...filters.revenue, gte: parseInt(minRevenue as string) };
    }

    if (maxRevenue) {
      filters.revenue = { ...filters.revenue, lte: parseInt(maxRevenue as string) };
    }

    if (country) {
      filters.country = { equals: country as string };
    }

    if (publiclyTraded !== undefined) {
      filters.publiclyTraded = publiclyTraded === 'true';
    }

    // Build sort criteria
    const orderBy: any = {};
    const validSortFields = ['name', 'employees', 'revenue', 'foundedYear', 'lastUpdated', 'enrichmentScore'];
    const sortField = validSortFields.includes(sortBy as string) ? sortBy as string : 'lastUpdated';
    const sortDirection = sortOrder === 'asc' ? 'asc' : 'desc';
    orderBy[sortField] = sortDirection;

    // Get companies and total count
    const [companies, totalCount] = await Promise.all([
      companyService.listCompanies({
        filters,
        skip,
        take: limitNum,
        orderBy
      }),
      companyService.countCompanies(filters)
    ]);

    const processingTimeMs = Date.now() - startTime;
    const totalPages = Math.ceil(totalCount / limitNum);

    logger.info('Company list completed successfully', {
      resultCount: companies.length,
      totalCount,
      page: pageNum,
      totalPages,
      processingTimeMs
    });

    res.status(200).json({
      success: true,
      data: {
        companies,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalCount,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      },
      processingTimeMs
    });

  } catch (error) {
    const processingTimeMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Company list failed', { 
      query: req.query,
      error: errorMessage,
      processingTimeMs
    });

    res.status(500).json({
      success: false,
      message: errorMessage,
      processingTimeMs
    });
  }
};

/**
 * Export selected companies to Excel by IDs
 */
export const exportSelectedCompaniesExcel = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validation = bulkSelectedSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validation.error.errors
      });
      return;
    }

    const { companyIds } = validation.data;
    
    logger.info('Selected companies Excel export initiated', { 
      companyIds: companyIds.length,
      sampleIds: companyIds.slice(0, 3)
    });
    
    const buffer = await excelExportService.exportSelectedCompanies(companyIds);
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `selected_companies_${companyIds.length}_${timestamp}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    
    res.send(buffer);
    
    logger.info('Selected companies Excel export completed successfully', { 
      filename,
      companyCount: companyIds.length,
      bufferSize: buffer.length 
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Selected companies Excel export failed', { 
      error: errorMessage,
      companyIds: req.body.companyIds
    });

    res.status(500).json({
      success: false,
      message: `Selected companies export failed: ${errorMessage}`
    });
  }
};

/**
 * Bulk delete selected companies by IDs
 */
export const bulkDeleteCompanies = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validation = bulkSelectedSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validation.error.errors
      });
      return;
    }

    const { companyIds } = validation.data;
    
    logger.info('Bulk company deletion initiated', { 
      companyIds: companyIds.length,
      sampleIds: companyIds.slice(0, 3)
    });

    // Use a transaction to ensure all deletions are atomic
    const deletedCount = await prisma.$transaction(async (tx) => {
      // First, check which companies exist
      const existingCompanies = await tx.company.findMany({
        where: {
          id: {
            in: companyIds
          }
        },
        select: {
          id: true,
          name: true
        }
      });

      if (existingCompanies.length === 0) {
        throw new Error('No companies found with the provided IDs');
      }

      // Delete all companies in a single operation
      const deleteResult = await tx.company.deleteMany({
        where: {
          id: {
            in: companyIds
          }
        }
      });

      logger.info('Companies deleted successfully', {
        requestedCount: companyIds.length,
        foundCount: existingCompanies.length,
        deletedCount: deleteResult.count,
        deletedCompanies: existingCompanies.map(c => ({ id: c.id, name: c.name }))
      });

      return deleteResult.count;
    });

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${deletedCount} companies`,
      data: {
        deletedCount,
        requestedCount: companyIds.length
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Bulk company deletion failed', { 
      error: errorMessage,
      companyIds: req.body.companyIds
    });

    res.status(500).json({
      success: false,
      message: `Bulk deletion failed: ${errorMessage}`
    });
  }
};

/**
 * Get job status and progress
 * GET /api/companies/jobs/:jobId/status
 */
export const getJobStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    
    if (!jobId) {
      res.status(400).json({
        success: false,
        message: 'Job ID is required'
      });
      return;
    }

    const jobStatus = jobManager.getJobStatus(jobId);
    
    if (!jobStatus) {
      res.status(404).json({
        success: false,
        message: 'Job not found'
      });
      return;
    }

    logger.info('Job status requested', { jobId, status: jobStatus.status });

    res.status(200).json({
      success: true,
      data: {
        id: jobStatus.id,
        status: jobStatus.status,
        progress: jobStatus.progress,
        createdAt: jobStatus.createdAt,
        startedAt: jobStatus.startedAt,
        completedAt: jobStatus.completedAt,
        result: jobStatus.result,
        error: jobStatus.error
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Failed to get job status', { 
      jobId: req.params.jobId,
      error: errorMessage
    });

    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get job messages/logs
 * GET /api/companies/jobs/:jobId/messages
 */
export const getJobMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const { since } = req.query;
    
    if (!jobId) {
      res.status(400).json({
        success: false,
        message: 'Job ID is required'
      });
      return;
    }

    const lastMessageIndex = since ? parseInt(since as string) : undefined;
    const messages = jobManager.getJobMessages(jobId, lastMessageIndex);
    
    if (messages === null) {
      res.status(404).json({
        success: false,
        message: 'Job not found'
      });
      return;
    }

    logger.info('Job messages requested', { 
      jobId, 
      messagesCount: messages.length,
      since: lastMessageIndex 
    });

    res.status(200).json({
      success: true,
      data: {
        messages,
        hasMore: messages.length > 0,
        lastIndex: messages.length > 0 ? (lastMessageIndex || -1) + messages.length : (lastMessageIndex || -1)
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Failed to get job messages', { 
      jobId: req.params.jobId,
      error: errorMessage
    });

    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get combined job status and recent messages
 * GET /api/companies/jobs/:jobId
 */
export const getJobDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const { messagesSince } = req.query;
    
    if (!jobId) {
      res.status(400).json({
        success: false,
        message: 'Job ID is required'
      });
      return;
    }

    const jobStatus = jobManager.getJobStatus(jobId);
    
    if (!jobStatus) {
      res.status(404).json({
        success: false,
        message: 'Job not found'
      });
      return;
    }

    const lastMessageIndex = messagesSince ? parseInt(messagesSince as string) : undefined;
    const messages = jobManager.getJobMessages(jobId, lastMessageIndex);

    logger.info('Job details requested', { 
      jobId, 
      status: jobStatus.status,
      messagesCount: messages.length 
    });

    res.status(200).json({
      success: true,
      data: {
        job: {
          id: jobStatus.id,
          type: jobStatus.type,
          status: jobStatus.status,
          progress: jobStatus.progress,
          createdAt: jobStatus.createdAt,
          startedAt: jobStatus.startedAt,
          completedAt: jobStatus.completedAt,
          result: jobStatus.result,
          error: jobStatus.error
        },
        messages: {
          items: messages,
          hasMore: messages.length > 0,
          lastIndex: messages.length > 0 ? (lastMessageIndex || -1) + messages.length : (lastMessageIndex || -1)
        }
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Failed to get job details', { 
      jobId: req.params.jobId,
      error: errorMessage
    });

    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * List all jobs (for admin/debugging purposes)
 * GET /api/companies/jobs
 */
export const listJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const jobs = jobManager.getAllJobs();
    const stats = jobManager.getJobStats();

    logger.info('Jobs list requested', { 
      totalJobs: jobs.length,
      stats 
    });

    res.status(200).json({
      success: true,
      data: {
        jobs: jobs.map(job => ({
          id: job.id,
          type: job.type,
          status: job.status,
          progress: job.progress,
          createdAt: job.createdAt,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
          messageCount: job.messages.length
        })),
        statistics: stats
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Failed to list jobs', { error: errorMessage });

    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Cancel a running job
 * DELETE /api/companies/jobs/:jobId
 */
export const cancelJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    
    if (!jobId) {
      res.status(400).json({
        success: false,
        message: 'Job ID is required'
      });
      return;
    }

    const jobStatus = jobManager.getJobStatus(jobId);
    
    if (!jobStatus) {
      res.status(404).json({
        success: false,
        message: 'Job not found'
      });
      return;
    }

    if (jobStatus.status === 'completed' || jobStatus.status === 'failed') {
      res.status(400).json({
        success: false,
        message: `Job is already ${jobStatus.status} and cannot be cancelled`
      });
      return;
    }

    // For now, we'll mark it as failed with a cancellation message
    // In a more advanced implementation, you'd have proper cancellation logic
    jobManager.failJob(jobId, 'Job cancelled by user request');

    logger.info('Job cancelled', { jobId, previousStatus: jobStatus.status });

    res.status(200).json({
      success: true,
      message: 'Job cancelled successfully'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Failed to cancel job', { 
      jobId: req.params.jobId,
      error: errorMessage
    });

    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Get WebSocket server statistics
 * GET /api/companies/websocket/stats
 */
export const getWebSocketStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = webSocketService.getStats();
    
    if (!stats) {
      res.status(503).json({
        success: false,
        message: 'WebSocket service not available'
      });
      return;
    }

    logger.info('WebSocket stats requested', stats);

    res.status(200).json({
      success: true,
      data: {
        websocketServer: {
          connectedClients: stats.connectedClients,
          activeRooms: stats.rooms.length,
          uptime: `${Math.round(stats.uptime)}s`
        },
        jobManager: jobManager.getJobStats()
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Failed to get WebSocket stats', { error: errorMessage });

    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Helper function to format filter messages
 */
function formatFilterMessage(filterAnalysis: any): string {
  const failedFilters = Object.entries(filterAnalysis)
    .filter(([key, analysis]: [string, any]) => !analysis.matches)
    .map(([key, analysis]: [string, any]) => 
      `${key}: expected ${analysis.expected}, actual ${analysis.actual}`
    );
  
  return failedFilters.join(', ');
}