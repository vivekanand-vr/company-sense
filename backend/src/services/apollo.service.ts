import axios from 'axios';
import { config } from '../lib/config';
import { logApolloRequest, logger } from '../lib/logger';

export interface ApolloOrganization {
  id: string;
  name: string;
  website_url: string;
  blog_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  facebook_url?: string;
  primary_phone?: any;
  phone?: string;
  founded_year?: number;
  publicly_traded_symbol?: string;
  publicly_traded_exchange?: string;
  logo_url?: string;
  primary_domain: string;
  industry: string;
  keywords: string[];
  estimated_num_employees: number;
  industries: string[];
  secondary_industries: string[];
  raw_address?: string;
  street_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  seo_description?: string;
  short_description?: string;
  annual_revenue_printed?: string;
  annual_revenue?: number;
  total_funding?: number;
  total_funding_printed?: string;
  latest_funding_round_date?: string;
  latest_funding_stage?: string;
  funding_events?: Array<{
    id: string;
    date: string;
    type: string;
    investors: string;
    amount: string;
    currency: string;
  }>;
  technology_names?: string[];
  current_technologies?: Array<{
    uid: string;
    name: string;
    category: string;
  }>;
  departmental_head_count?: {
    [department: string]: number;
  };
}

export interface ApolloEnrichmentResponse {
  organization: ApolloOrganization;
}

export interface ApolloApiError {
  message: string;
  status?: number;
  code?: string;
}

export class ApolloService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.apollo.io/api/v1';

  constructor() {
    this.apiKey = config.apollo.apiKey;
  }

  /**
   * Enrich organization data using Apollo.io API based on domain
   * @param domain - The domain of the company (e.g., "apollo.io")
   * @returns Promise<ApolloOrganization | null>
   */
  async enrichOrganization(domain: string): Promise<ApolloOrganization | null> {
    try {
      logger.info('Starting Apollo organization enrichment', { domain });

      const options = {
        method: 'GET',
        url: `${this.baseUrl}/organizations/enrich`,
        headers: {
          accept: 'application/json',
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        },
        params: {
          domain: domain
        },
        timeout: 30000 // 30 second timeout
      };

      const response = await axios.request<ApolloEnrichmentResponse>(options);
      
      if (!response.data?.organization) {
        logger.warn('No organization data returned from Apollo', { domain });
        logApolloRequest(domain, false, null, new Error('No organization data in response'));
        return null;
      }

      const organization = response.data.organization;

      // Log successful request with full data
      logApolloRequest(domain, true, { organization });

      logger.info('Apollo organization enrichment completed successfully', {
        domain,
        organizationId: organization.id,
        name: organization.name,
        employees: organization.estimated_num_employees,
        revenue: organization.annual_revenue,
        industry: organization.industry,
        requestedDomain: domain,
        returnedDomain: organization.primary_domain
      });

      return organization;

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      const status = error.response?.status;

      logger.error('Apollo organization enrichment failed', {
        domain,
        error: errorMessage,
        status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        requestConfig: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers ? Object.keys(error.config.headers) : undefined
        }
      });

      // Log failed request
      logApolloRequest(domain, false, null, {
        message: errorMessage,
        status,
        code: error.code
      });

      // Don't throw error, return null to allow pipeline to continue
      return null;
    }
  }

  /**
   * Search for organizations by name (fallback if domain enrichment fails)
   * @param companyName - The name of the company to search for
   * @returns Promise<ApolloOrganization[]>
   */
  async searchOrganizations(companyName: string): Promise<ApolloOrganization[]> {
    try {
      logger.info('Starting Apollo organization search', { companyName });

      const options = {
        method: 'POST',
        url: `${this.baseUrl}/organizations/search`,
        headers: {
          accept: 'application/json',
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        },
        data: {
          q_organization_name: companyName,
          page: 1,
          per_page: 5
        },
        timeout: 30000
      };

      const response = await axios.request(options);
      
      const organizations = response.data?.organizations || [];

      // Log the search results for debugging
      logApolloRequest(`search:${companyName}`, true, { searchResults: organizations });

      logger.info('Apollo organization search completed', {
        companyName,
        resultsCount: organizations.length,
        foundOrganizations: organizations.slice(0, 3).map((org: any) => ({
          id: org.id,
          name: org.name,
          domain: org.primary_domain,
          employees: org.estimated_num_employees
        }))
      });

      return organizations;

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      const status = error.response?.status;

      // Log failed search request
      logApolloRequest(`search:${companyName}`, false, null, {
        message: errorMessage,
        status,
        code: error.code
      });

      logger.error('Apollo organization search failed', {
        companyName,
        error: errorMessage,
        status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        requestConfig: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers ? Object.keys(error.config.headers) : undefined
        }
      });

      // Return empty array on error
      return [];
    }
  }

  /**
   * Get organization data with fallback logic
   * First try domain-based enrichment, then fall back to name-based search
   * @param domain - The domain of the company
   * @param companyName - The name of the company (for fallback)
   * @returns Promise<ApolloOrganization | null>
   */
  async getOrganizationData(domain: string, companyName: string): Promise<ApolloOrganization | null> {
    // First try domain-based enrichment
    const enrichedData = await this.enrichOrganization(domain);
    
    if (enrichedData) {
      logger.info('Successfully got organization data via domain enrichment', {
        domain,
        companyName,
        organizationName: enrichedData.name
      });
      return enrichedData;
    }

    // Fall back to name-based search
    logger.info('Domain enrichment failed, trying name-based search', {
      domain,
      companyName
    });

    const searchResults = await this.searchOrganizations(companyName);
    
    if (searchResults.length > 0) {
      // Return the best match (first result)
      const bestMatch = searchResults[0];
      
      if (bestMatch) {
        logger.info('Successfully got organization data via name search', {
          domain,
          companyName,
          foundName: bestMatch.name,
          confidence: 'medium'
        });
        
        return bestMatch;
      }
    }

    logger.warn('No organization data found via Apollo API', {
      domain,
      companyName
    });

    return null;
  }

  /**
   * Extract key company information from Apollo organization data
   * @param organization - Apollo organization object
   * @returns Formatted company data
   */
  extractCompanyData(organization: ApolloOrganization) {
    return {
      // Basic Information
      name: organization.name,
      website: organization.website_url,
      domain: organization.primary_domain,
      description: organization.short_description || organization.seo_description,
      
      // Industry and Keywords
      industry: organization.industry,
      keywords: organization.keywords || [],
      
      // Company Details
      foundedYear: organization.founded_year,
      employeeCount: organization.estimated_num_employees,
      
      // Financial Information
      annualRevenue: organization.annual_revenue,
      annualRevenueFormatted: organization.annual_revenue_printed,
      totalFunding: organization.total_funding,
      totalFundingFormatted: organization.total_funding_printed,
      latestFundingStage: organization.latest_funding_stage,
      latestFundingDate: organization.latest_funding_round_date,
      
      // Public Company Information
      publiclyTraded: !!organization.publicly_traded_symbol,
      stockSymbol: organization.publicly_traded_symbol || '',
      stockExchange: organization.publicly_traded_exchange || '',
      
      // Contact Information
      phone: organization.phone || organization.primary_phone,
      
      // Address Information
      address: {
        full: organization.raw_address,
        street: organization.street_address,
        city: organization.city,
        state: organization.state,
        postalCode: organization.postal_code,
        country: organization.country
      },
      
      // Social Media
      socialMedia: {
        linkedin: organization.linkedin_url || '',
        twitter: organization.twitter_url || '',
        facebook: organization.facebook_url || '',
        blog: organization.blog_url || ''
      },
      
      // Technology Stack
      technologies: organization.technology_names || [],
      currentTechnologies: organization.current_technologies || [],
      
      // Department Information
      departmentHeadcount: organization.departmental_head_count || {},
      
      // Funding Information
      fundingEvents: organization.funding_events || [],
      
      // Meta Information
      apolloId: organization.id,
      logoUrl: organization.logo_url,
      industries: organization.industries || [],
      secondaryIndustries: organization.secondary_industries || []
    };
  }
}