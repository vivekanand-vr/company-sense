import { Request, Response } from 'express';
import { logger } from '../lib/logger';
import { CompanyService } from '../services/company.service';
import { ExcelExportService } from '../services/excel-export.service';
import { z } from 'zod';

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
 * Bulk company lookup with filtering
 */
export const bulkLookupCompanies = async (req: Request, res: Response): Promise<void> => {
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
    
    logger.info('Bulk company lookup initiated', { 
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
    
    logger.error('Bulk company lookup failed', { 
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