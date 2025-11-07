import { GoogleSearchService } from './google-search.service';
import { ApolloService } from './apollo.service';
import { ChatGPTService } from './chatgpt.service';
import { prisma } from '../lib/prisma';
import { logger, logPipelineStep } from '../lib/logger';

export interface CompanyLookupFilters {
  turnover?: string | undefined;
  turnoverCustom?: number | undefined;
  headcount?: string | undefined;
  headcountCustom?: number | undefined;
  type?: string | undefined;
  typeCustom?: string | undefined;
  location?: string | undefined;
  keywords?: string[] | undefined;
  // Additional filter fields for list API
  industry?: string | undefined;
  minEmployees?: number | undefined;
  maxEmployees?: number | undefined;
  minRevenue?: number | undefined;
  maxRevenue?: number | undefined;
  country?: string | undefined;
  publiclyTraded?: boolean | undefined;
}

export interface CompanyLookupResult {
  company: any;
  meetsFilterCriteria: boolean;
  filterAnalysis?: any;
  processingTimeMs: number;
  dataSource: string;
}

export interface BulkLookupResult {
  results: CompanyLookupResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    meetsFilterCriteria: number;
  };
}

export class CompanyService {
  private googleSearch: GoogleSearchService;
  private apollo: ApolloService;
  private chatgpt: ChatGPTService;

  constructor() {
    this.googleSearch = new GoogleSearchService();
    this.apollo = new ApolloService();
    this.chatgpt = new ChatGPTService();
  }

  async lookupCompany(companyName: string, filters?: CompanyLookupFilters): Promise<CompanyLookupResult> {
    const startTime = Date.now();
    
    try {
      logPipelineStep('lookup_start', companyName, 'started');
      logger.info('Starting company lookup pipeline', { companyName, filters });

      // Step 0: Check if company already exists in database
      logger.info('Checking if company exists in database', { companyName });
      const existingCompany = await this.findExistingCompany(companyName);
      
      if (existingCompany) {
        logger.info('Company found in database, returning cached data', { 
          companyName, 
          companyId: existingCompany.id,
          lastUpdated: existingCompany.lastUpdated 
        });
        
        const processingTimeMs = Date.now() - startTime;
        const { meetsFilterCriteria, filterAnalysis } = this.analyzeFilters(existingCompany, filters);
        
        return {
          company: existingCompany,
          meetsFilterCriteria,
          filterAnalysis,
          processingTimeMs,
          dataSource: 'database_cache'
        };
      }
      
      logger.info('Company not found in database, starting search pipeline', { companyName });

      // Step 1: Google Search to find official website
      logPipelineStep('google_search', companyName, 'started');
      const websiteData = await this.googleSearch.findOfficialWebsite(companyName);
      
      if (!websiteData) {
        logPipelineStep('google_search', companyName, 'failed', { reason: 'No official website found' });
        throw new Error(`Could not find official website for ${companyName}`);
      }
      
      logPipelineStep('google_search', companyName, 'completed', websiteData);
      logger.info('Found official website', { companyName, domain: websiteData.domain });

      // Step 2: Apollo API enrichment
      logPipelineStep('apollo_enrichment', companyName, 'started');
      const apolloData = await this.apollo.getOrganizationData(websiteData.domain, companyName);
      
      if (!apolloData) {
        logPipelineStep('apollo_enrichment', companyName, 'failed', { reason: 'No Apollo data found' });
        throw new Error(`Could not find company data in Apollo for ${companyName}`);
      }
      
      logPipelineStep('apollo_enrichment', companyName, 'completed', { 
        organizationId: apolloData.id,
        employees: apolloData.estimated_num_employees,
        revenue: apolloData.annual_revenue
      });

      // Step 3: Extract and format Apollo data
      const companyData = this.apollo.extractCompanyData(apolloData);
      
      // Step 4: ChatGPT enrichment for summary and missing data
      logPipelineStep('chatgpt_enrichment', companyName, 'started');
      const enrichmentData = await this.chatgpt.enrichCompanyData({
        companyName,
        apolloData: companyData,
        missingFields: this.identifyMissingFields(companyData),
        requestType: 'full_enrichment'
      });
      
      logPipelineStep('chatgpt_enrichment', companyName, 'completed', {
        enrichedFields: Object.keys(enrichmentData)
      });

      // Step 5: Combine all data
      const enrichedCompany = this.combineCompanyData(companyData, enrichmentData, websiteData);
      
      // Step 6: Apply filters if provided
      const filterResult = filters ? this.applyFilters(enrichedCompany, filters) : { 
        meetsFilterCriteria: true, 
        filterAnalysis: {} 
      };

      const processingTime = Date.now() - startTime;

      const result: CompanyLookupResult = {
        company: enrichedCompany,
        meetsFilterCriteria: filterResult.meetsFilterCriteria,
        filterAnalysis: filterResult.filterAnalysis,
        processingTimeMs: processingTime,
        dataSource: 'google_apollo_chatgpt'
      };

      // Step 7: Save to database if meets filter criteria
      if (filterResult.meetsFilterCriteria) {
        await this.saveCompanyToDatabase(enrichedCompany);
        logPipelineStep('database_save', companyName, 'completed');
      } else {
        logPipelineStep('database_save', companyName, 'failed', { 
          reason: 'Does not meet filter criteria',
          analysis: filterResult.filterAnalysis 
        });
      }

      logPipelineStep('lookup_complete', companyName, 'completed', {
        processingTimeMs: processingTime,
        meetsFilters: filterResult.meetsFilterCriteria
      });

      logger.info('Company lookup pipeline completed successfully', {
        companyName,
        processingTimeMs: processingTime,
        meetsFilterCriteria: filterResult.meetsFilterCriteria
      });

      return result;

    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      
      logPipelineStep('lookup_complete', companyName, 'failed', { 
        error: error.message,
        processingTimeMs: processingTime
      });

      logger.error('Company lookup pipeline failed', {
        companyName,
        error: error.message,
        processingTimeMs: processingTime
      });

      throw error;
    }
  }

  async bulkLookup(companyNames: string[], filters?: CompanyLookupFilters): Promise<BulkLookupResult> {
    logger.info('Starting bulk company lookup', { 
      companiesCount: companyNames.length,
      filters 
    });

    const results: CompanyLookupResult[] = [];
    let successful = 0;
    let failed = 0;
    let meetsFilterCriteria = 0;

    for (const companyName of companyNames) {
      try {
        const result = await this.lookupCompany(companyName, filters);
        results.push(result);
        successful++;
        
        if (result.meetsFilterCriteria) {
          meetsFilterCriteria++;
        }
        
        // Add delay between requests to be respectful to APIs
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        logger.error('Failed to lookup company in bulk operation', {
          companyName,
          error: (error as Error).message
        });
        failed++;
      }
    }

    const summary = {
      total: companyNames.length,
      successful,
      failed,
      meetsFilterCriteria
    };

    logger.info('Bulk company lookup completed', summary);

    return {
      results,
      summary
    };
  }

  async getAllCompanies(filters?: CompanyLookupFilters): Promise<any[]> {
    try {
      logger.info('Retrieving all companies from database', { filters });

      const whereClause = this.buildDatabaseFilter(filters);
      
      const companies = await prisma.company.findMany({
        where: whereClause,
        orderBy: { lastUpdated: 'desc' }
      });

      logger.info('Retrieved companies from database', { 
        count: companies.length,
        hasFilters: !!filters
      });

      return companies;

    } catch (error) {
      logger.error('Failed to retrieve companies from database', {
        error: (error as Error).message,
        filters
      });
      throw error;
    }
  }

  private identifyMissingFields(companyData: any): string[] {
    const requiredFields = [
      'businessModel',
      'keyProducts',
      'ceo',
      'marketPosition',
      'summary'
    ];

    return requiredFields.filter(field => !companyData[field] || 
      (Array.isArray(companyData[field]) && companyData[field].length === 0)
    );
  }

  private combineCompanyData(apolloData: any, enrichmentData: any, websiteData: any): any {
    return {
      // Basic information (Apollo primary)
      name: apolloData.name,
      website: apolloData.website,
      domain: apolloData.domain,
      description: apolloData.description,
      
      // Industry and classification
      industry: apolloData.industry,
      keywords: apolloData.keywords,
      
      // Company details
      foundedYear: apolloData.foundedYear,
      employeeCount: apolloData.employeeCount,
      
      // Financial data
      annualRevenue: apolloData.annualRevenue,
      annualRevenueFormatted: apolloData.annualRevenueFormatted,
      totalFunding: apolloData.totalFunding,
      latestFundingStage: apolloData.latestFundingStage,
      
      // Public company info
      publiclyTraded: apolloData.publiclyTraded,
      stockSymbol: apolloData.stockSymbol,
      stockExchange: apolloData.stockExchange,
      
      // Contact information
      phone: apolloData.phone,
      address: apolloData.address,
      
      // Social media
      socialMedia: apolloData.socialMedia,
      
      // Technology
      technologies: apolloData.technologies,
      
      // ChatGPT enrichment
      summary: enrichmentData.summary,
      businessModel: enrichmentData.businessModel || apolloData.businessModel,
      keyProducts: enrichmentData.keyProducts || apolloData.keyProducts,
      ceo: enrichmentData.ceo || apolloData.ceo,
      parentCompany: enrichmentData.parentCompany,
      subsidiaries: enrichmentData.subsidiaries,
      marketPosition: enrichmentData.marketPosition,
      competitiveAdvantage: enrichmentData.competitiveAdvantage,
      
      // Meta information
      apolloId: apolloData.apolloId,
      logoUrl: apolloData.logoUrl,
      
      // Data source tracking
      googleSearchData: websiteData,
      apolloSource: true,
      chatgptSource: !!enrichmentData.summary,
      combinedSource: true,
      enrichmentScore: this.calculateEnrichmentScore(apolloData, enrichmentData),
      dataSource: 'google_apollo_chatgpt',
      lastEnriched: new Date()
    };
  }

  private applyFilters(company: any, filters: CompanyLookupFilters) {
    const analysis: any = {};
    let meetsFilterCriteria = true;

    // Revenue filter
    if (filters.turnover || filters.turnoverCustom) {
      const revenue = company.annualRevenue;
      const meetsRevenue = this.checkRevenueFilter(revenue, filters.turnover, filters.turnoverCustom);
      
      analysis.turnover = {
        expected: filters.turnover || `${filters.turnoverCustom}+`,
        actual: revenue ? `${Math.round(revenue / 1000000)}M` : 'Unknown',
        matches: meetsRevenue
      };
      
      if (!meetsRevenue) meetsFilterCriteria = false;
    }

    // Employee count filter
    if (filters.headcount || filters.headcountCustom) {
      const employees = company.employeeCount;
      const meetsEmployees = this.checkEmployeeFilter(employees, filters.headcount, filters.headcountCustom);
      
      analysis.headcount = {
        expected: filters.headcount || `${filters.headcountCustom}+`,
        actual: employees || 'Unknown',
        matches: meetsEmployees
      };
      
      if (!meetsEmployees) meetsFilterCriteria = false;
    }

    // Industry type filter
    if (filters.type || filters.typeCustom) {
      const industry = company.industry?.toLowerCase();
      const targetType = (filters.type || filters.typeCustom)?.toLowerCase();
      const meetsType = industry?.includes(targetType!) || false;
      
      analysis.type = {
        expected: filters.type || filters.typeCustom,
        actual: company.industry,
        matches: meetsType
      };
      
      if (!meetsType) meetsFilterCriteria = false;
    }

    return { meetsFilterCriteria, filterAnalysis: analysis };
  }

  private checkRevenueFilter(revenue: number | undefined, rangeFilter?: string, customMin?: number): boolean {
    if (!revenue) return false;
    
    const revenueInMillions = revenue / 1000000;
    
    if (customMin) {
      return revenueInMillions >= customMin;
    }
    
    if (!rangeFilter) return true;
    
    const ranges: { [key: string]: [number, number] } = {
      '1-10': [1, 10],
      '10-50': [10, 50],
      '50-100': [50, 100],
      '100-500': [100, 500],
      '500-1000': [500, 1000],
      '1000-5000': [1000, 5000],
      '5000+': [5000, Infinity]
    };
    
    const [min, max] = ranges[rangeFilter] || [0, Infinity];
    return revenueInMillions >= min && revenueInMillions <= max;
  }

  private checkEmployeeFilter(employees: number | undefined, rangeFilter?: string, customMin?: number): boolean {
    if (!employees) return false;
    
    if (customMin) {
      return employees >= customMin;
    }
    
    if (!rangeFilter) return true;
    
    const ranges: { [key: string]: [number, number] } = {
      '1-10': [1, 10],
      '11-50': [11, 50],
      '51-100': [51, 100],
      '101-250': [101, 250],
      '251-500': [251, 500],
      '501-1000': [501, 1000],
      '1001-5000': [1001, 5000],
      '5001-10000': [5001, 10000],
      '10000+': [10000, Infinity]
    };
    
    const [min, max] = ranges[rangeFilter] || [0, Infinity];
    return employees >= min && employees <= max;
  }

  private calculateEnrichmentScore(apolloData: any, enrichmentData: any): number {
    let score = 0.5; // Base score for Apollo data
    
    if (enrichmentData.summary) score += 0.15;
    if (enrichmentData.businessModel) score += 0.1;
    if (enrichmentData.keyProducts?.length > 0) score += 0.1;
    if (enrichmentData.ceo) score += 0.05;
    if (enrichmentData.marketPosition) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  private async saveCompanyToDatabase(company: any): Promise<void> {
    try {
      await prisma.company.upsert({
        where: { domain: company.domain },
        update: {
          name: company.name,
          website: company.website,
          description: company.description,
          industry: company.industry,
          keywords: company.keywords || null,
          foundedYear: company.foundedYear,
          employees: company.employeeCount,
          revenue: company.annualRevenue,
          phone: company.phone,
          address: company.address,
          linkedinUrl: company.socialMedia?.linkedin,
          twitterUrl: company.socialMedia?.twitter,
          facebookUrl: company.socialMedia?.facebook,
          businessModel: company.businessModel,
          keyProducts: company.keyProducts,
          ceo: company.ceo,
          parentCompany: company.parentCompany,
          subsidiaries: company.subsidiaries,
          publiclyTraded: company.publiclyTraded,
          stockSymbol: company.stockSymbol,
          summary: company.summary,
          apolloId: company.apolloId,
          apolloSource: company.apolloSource,
          chatgptSource: company.chatgptSource,
          enrichmentScore: company.enrichmentScore,
          dataSource: company.dataSource,
          lastEnriched: company.lastEnriched,
          lastUpdated: new Date()
        },
        create: {
          name: company.name,
          domain: company.domain,
          website: company.website,
          description: company.description,
          industry: company.industry,
          keywords: company.keywords || null,
          foundedYear: company.foundedYear,
          employees: company.employeeCount,
          revenue: company.annualRevenue,
          phone: company.phone,
          address: company.address,
          linkedinUrl: company.socialMedia?.linkedin,
          twitterUrl: company.socialMedia?.twitter,
          facebookUrl: company.socialMedia?.facebook,
          businessModel: company.businessModel,
          keyProducts: company.keyProducts,
          ceo: company.ceo,
          parentCompany: company.parentCompany,
          subsidiaries: company.subsidiaries,
          publiclyTraded: company.publiclyTraded,
          stockSymbol: company.stockSymbol,
          summary: company.summary,
          apolloId: company.apolloId,
          apolloSource: company.apolloSource,
          chatgptSource: company.chatgptSource,
          enrichmentScore: company.enrichmentScore,
          dataSource: company.dataSource,
          lastEnriched: company.lastEnriched
        }
      });
      
      logger.info('Company data saved to database successfully', {
        companyName: company.name,
        domain: company.domain
      });
      
    } catch (error) {
      logger.error('Failed to save company data to database', {
        companyName: company.name,
        error: (error as Error).message
      });
      throw error;
    }
  }

  private buildDatabaseFilter(filters?: CompanyLookupFilters): any {
    if (!filters) return {};

    const where: any = {};

    if (filters.industry) {
      where.industry = {
        contains: filters.industry
      };
    }

    if (filters.minEmployees) {
      where.employees = {
        gte: filters.minEmployees
      };
    }

    if (filters.maxEmployees) {
      where.employees = {
        lte: filters.maxEmployees
      };
    }

    if (filters.minRevenue) {
      where.revenue = {
        gte: filters.minRevenue
      };
    }

    if (filters.maxRevenue) {
      where.revenue = {
        lte: filters.maxRevenue
      };
    }

    if (filters.country) {
      where.country = {
        equals: filters.country
      };
    }

    if (filters.publiclyTraded !== undefined) {
      where.publiclyTraded = filters.publiclyTraded;
    }

    return where;
  }

  /**
   * Find existing company in database by name (case-insensitive)
   */
  private async findExistingCompany(companyName: string): Promise<any | null> {
    try {
      // Search by exact name match (case-insensitive using toLowerCase)
      const companies = await prisma.company.findMany({
        where: {
          name: {
            contains: companyName
          }
        }
      });

      // Filter for exact match (case-insensitive)
      const exactMatch = companies.find(
        company => company.name.toLowerCase() === companyName.toLowerCase()
      );

      if (exactMatch) {
        return exactMatch;
      }

      // If no exact match, try partial name match for common variations
      const partialMatch = companies.find(
        company => 
          company.name.toLowerCase().includes(companyName.toLowerCase()) ||
          companyName.toLowerCase().includes(company.name.toLowerCase())
      );

      return partialMatch || null;
    } catch (error) {
      logger.error('Error finding existing company in database', {
        companyName,
        error: (error as Error).message
      });
      return null;
    }
  }

  /**
   * Analyze if company meets filter criteria
   */
  private analyzeFilters(company: any, filters?: CompanyLookupFilters): { 
    meetsFilterCriteria: boolean; 
    filterAnalysis: any 
  } {
    if (!filters) {
      return {
        meetsFilterCriteria: true,
        filterAnalysis: null
      };
    }

    const analysis: any = {};
    let meetsAllCriteria = true;

    // Check industry
    if (filters.industry) {
      const industryMatch = company.industry?.toLowerCase().includes(filters.industry.toLowerCase()) || false;
      analysis.industry = {
        expected: filters.industry,
        actual: company.industry,
        match: industryMatch
      };
      if (!industryMatch) meetsAllCriteria = false;
    }

    // Check employee count
    if (filters.minEmployees || filters.maxEmployees) {
      const employees = company.employees || 0;
      const minCheck = !filters.minEmployees || employees >= filters.minEmployees;
      const maxCheck = !filters.maxEmployees || employees <= filters.maxEmployees;
      analysis.employees = {
        expected: `${filters.minEmployees || 0}-${filters.maxEmployees || '∞'}`,
        actual: employees,
        match: minCheck && maxCheck
      };
      if (!minCheck || !maxCheck) meetsAllCriteria = false;
    }

    // Check revenue
    if (filters.minRevenue || filters.maxRevenue) {
      const revenue = company.revenue || 0;
      const minCheck = !filters.minRevenue || revenue >= filters.minRevenue;
      const maxCheck = !filters.maxRevenue || revenue <= filters.maxRevenue;
      analysis.revenue = {
        expected: `${filters.minRevenue || 0}-${filters.maxRevenue || '∞'}`,
        actual: revenue,
        match: minCheck && maxCheck
      };
      if (!minCheck || !maxCheck) meetsAllCriteria = false;
    }

    // Check country
    if (filters.country) {
      const countryMatch = company.country?.toLowerCase() === filters.country.toLowerCase();
      analysis.country = {
        expected: filters.country,
        actual: company.country,
        match: countryMatch
      };
      if (!countryMatch) meetsAllCriteria = false;
    }

    // Check publicly traded status
    if (filters.publiclyTraded !== undefined) {
      const publicMatch = company.publiclyTraded === filters.publiclyTraded;
      analysis.publiclyTraded = {
        expected: filters.publiclyTraded,
        actual: company.publiclyTraded,
        match: publicMatch
      };
      if (!publicMatch) meetsAllCriteria = false;
    }

    return {
      meetsFilterCriteria: meetsAllCriteria,
      filterAnalysis: analysis
    };
  }

  /**
   * List companies with filtering and pagination
   */
  async listCompanies(options: {
    filters?: any;
    skip?: number;
    take?: number;
    orderBy?: any;
  }): Promise<any[]> {
    try {
      const companies = await prisma.company.findMany({
        where: options.filters || {},
        skip: options.skip || 0,
        take: options.take || 20,
        orderBy: options.orderBy || { lastUpdated: 'desc' }
      });

      return companies;
    } catch (error) {
      logger.error('Error listing companies', {
        error: (error as Error).message,
        options
      });
      throw error;
    }
  }

  /**
   * Count companies with filters
   */
  async countCompanies(filters?: any): Promise<number> {
    try {
      const count = await prisma.company.count({
        where: filters || {}
      });

      return count;
    } catch (error) {
      logger.error('Error counting companies', {
        error: (error as Error).message,
        filters
      });
      throw error;
    }
  }
}