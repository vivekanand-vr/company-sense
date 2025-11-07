import axios from 'axios';
import { config } from '../lib/config';
import { logGoogleSearch, logger } from '../lib/logger';

export interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
}

export interface GoogleSearchResponse {
  items?: GoogleSearchResult[];
  searchInformation?: {
    totalResults: string;
    searchTime: number;
  };
}

export class GoogleSearchService {
  private readonly apiKey: string;
  private readonly searchEngineId: string;
  private readonly baseUrl = 'https://www.googleapis.com/customsearch/v1';

  constructor() {
    this.apiKey = config.google.apiKey;
    this.searchEngineId = config.google.searchEngineId;
  }

  /**
   * Search for a company using Google's Programmable Search Engine
   * @param companyName - The name of the company to search for
   * @returns Promise<GoogleSearchResult[]> - Array of search results
   */
  async searchCompany(companyName: string): Promise<GoogleSearchResult[]> {
    const startTime = Date.now();
    
    try {
      logger.info('Starting Google search for company', { companyName });

      // Create search query optimized for finding official company websites
      const searchQuery = `"${companyName}" site:com OR site:org OR site:io OR site:net -linkedin -facebook -twitter -instagram -youtube -crunchbase -glassdoor -indeed`;
      
      const response = await axios.get(this.baseUrl, {
        params: {
          key: this.apiKey,
          cx: this.searchEngineId,
          q: searchQuery,
          num: 10, // Get top 10 results
          fields: 'items(title,link,snippet,displayLink),searchInformation(totalResults,searchTime)'
        },
        timeout: 30000 // 30 second timeout
      });

      const searchTime = Date.now() - startTime;
      const results: GoogleSearchResult[] = response.data.items || [];

      // Filter and prioritize results
      const filteredResults = this.filterAndPrioritizeResults(results, companyName);

      // Log the search results with detailed information
      logGoogleSearch(companyName, filteredResults, searchTime);

      // Additional detailed logging for debugging
      logger.info('Google search completed successfully', {
        companyName,
        resultsCount: filteredResults.length,
        searchTimeMs: searchTime,
        searchResults: filteredResults.map(result => ({
          title: result.title,
          domain: this.extractDomain(result.link),
          url: result.link,
          snippet: result.snippet?.substring(0, 150) + '...'
        }))
      });

      return filteredResults;

    } catch (error: any) {
      const searchTime = Date.now() - startTime;
      
      logger.error('Google search failed', {
        companyName,
        error: error.message,
        searchTimeMs: searchTime,
        status: error.response?.status,
        statusText: error.response?.statusText
      });

      // Log failed search
      logGoogleSearch(companyName, [], searchTime);

      throw new Error(`Google search failed: ${error.message}`);
    }
  }

  /**
   * Extract domain from URL
   * @param url - The URL to extract domain from
   * @returns string - The domain (e.g., "apollo.io" from "https://www.apollo.io")
   */
  extractDomain(url: string): string {
    try {
      const urlObject = new URL(url);
      let domain = urlObject.hostname;
      
      // Remove 'www.' prefix if present
      if (domain.startsWith('www.')) {
        domain = domain.substring(4);
      }
      
      return domain;
    } catch (error) {
      logger.warn('Failed to extract domain from URL', { url, error: (error as Error).message });
      return '';
    }
  }

  /**
   * Find the most likely official website from search results
   * @param companyName - The company name being searched
   * @returns Promise<{url: string, domain: string} | null>
   */
  async findOfficialWebsite(companyName: string): Promise<{url: string, domain: string} | null> {
    try {
      const searchResults = await this.searchCompany(companyName);
      
      if (searchResults.length === 0) {
        logger.warn('No search results found for company', { companyName });
        return null;
      }

      // Get the top result as it's most likely to be the official website
      const topResult = searchResults[0];
      
      if (!topResult || !topResult.link) {
        logger.warn('Invalid top search result', { companyName, topResult });
        return null;
      }
      
      const domain = this.extractDomain(topResult.link);

      if (!domain) {
        logger.warn('Could not extract domain from top search result', { 
          companyName, 
          url: topResult.link 
        });
        return null;
      }

      logger.info('Found official website for company', {
        companyName,
        url: topResult.link,
        domain,
        title: topResult.title || 'Unknown'
      });

      return {
        url: topResult.link,
        domain
      };

    } catch (error) {
      logger.error('Failed to find official website', {
        companyName,
        error: (error as Error).message
      });
      return null;
    }
  }

  /**
   * Filter and prioritize search results to find official company websites
   * @param results - Raw Google search results
   * @param companyName - The company name being searched
   * @returns GoogleSearchResult[] - Filtered and prioritized results
   */
  private filterAndPrioritizeResults(results: GoogleSearchResult[], companyName: string): GoogleSearchResult[] {
    // Filter out unwanted domains
    const unwantedDomains = [
      'linkedin.com',
      'facebook.com',
      'twitter.com',
      'instagram.com',
      'youtube.com',
      'crunchbase.com',
      'glassdoor.com',
      'indeed.com',
      'wikipedia.org',
      'bloomberg.com',
      'forbes.com',
      'techcrunch.com'
    ];

    const filtered = results.filter(result => {
      const domain = this.extractDomain(result.link);
      return !unwantedDomains.some(unwanted => domain.includes(unwanted));
    });

    // Prioritize results based on URL patterns that indicate official websites
    const prioritized = filtered.sort((a, b) => {
      const aScore = this.getWebsiteScore(a, companyName);
      const bScore = this.getWebsiteScore(b, companyName);
      return bScore - aScore; // Higher score first
    });

    return prioritized;
  }

  /**
   * Score a website result based on how likely it is to be the official company website
   * @param result - Google search result
   * @param companyName - The company name being searched
   * @returns number - Score (higher is better)
   */
  private getWebsiteScore(result: GoogleSearchResult, companyName: string): number {
    let score = 0;
    const domain = this.extractDomain(result.link);
    const companyNameLower = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Higher score for domains that contain the company name
    if (domain.toLowerCase().includes(companyNameLower)) {
      score += 50;
    }

    // Higher score for common official page patterns
    const officialPatterns = [
      '/about',
      '/company',
      '/investor',
      '/corporate',
      '.com',
      '.io'
    ];

    officialPatterns.forEach(pattern => {
      if (result.link.toLowerCase().includes(pattern)) {
        score += 10;
      }
    });

    // Higher score for titles that contain the company name
    if (result.title.toLowerCase().includes(companyName.toLowerCase())) {
      score += 20;
    }

    // Prefer root domains over subpages
    const url = new URL(result.link);
    if (url.pathname === '/' || url.pathname === '') {
      score += 15;
    }

    return score;
  }
}