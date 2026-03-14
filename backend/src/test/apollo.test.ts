import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios';

describe('Apollo API Integration Tests', () => {
  let apiKey: string;

  beforeAll(() => {
    apiKey = process.env.APOLLO_API_KEY || '';
    if (!apiKey) {
      console.error('Warning: APOLLO_API_KEY not found in environment variables');
    }
  });

  it('should have Apollo API key configured', () => {
    expect(apiKey).toBeDefined();
    expect(apiKey.length).toBeGreaterThan(0);
    console.log(`✓ Apollo API key is configured (${apiKey.substring(0, 8)}...)`);
  });

  it('should successfully authenticate with Apollo API', async () => {
    if (!apiKey) {
      console.log('⚠ Skipping Apollo API test - no API key configured');
      return;
    }

    const options = {
      method: 'GET' as const,
      url: 'https://api.apollo.io/api/v1/organizations/enrich',
      headers: {
        'accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      params: {
        domain: 'google.com'
      },
      timeout: 30000
    };

    try {
      const response = await axios.request(options);
      
      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data.organization).toBeDefined();
      
      console.log('✓ Apollo API authentication successful');
      console.log(`✓ Found organization: ${response.data.organization?.name || 'Unknown'}`);
      
    } catch (error: any) {
      console.error('✗ Apollo API test failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.message || error.message
      });
      throw error;
    }
  }, 35000);

  it('should handle invalid domain gracefully', async () => {
    if (!apiKey) {
      console.log('⚠ Skipping Apollo API invalid domain test - no API key configured');
      return;
    }

    const options = {
      method: 'GET' as const,
      url: 'https://api.apollo.io/api/v1/organizations/enrich',
      headers: {
        'accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      params: {
        domain: 'nonexistent-company-12345.com'
      },
      timeout: 30000
    };

    try {
      const response = await axios.request(options);
      
      expect(response.status).toBe(200);
      
      // Apollo may return null or undefined for organization when not found
      if (response.data.organization === null || response.data.organization === undefined) {
        console.log('✓ Apollo API correctly handles invalid domain (no organization data)');
        expect(response.data.organization).toBeFalsy();
      } else {
        console.log('✓ Apollo API returned some data for invalid domain test');
      }
      
    } catch (error: any) {
      // Some error responses are expected for invalid domains
      if (error.response?.status === 404 || error.response?.status === 422) {
        console.log('✓ Apollo API correctly returns error for invalid domain');
        expect([404, 422]).toContain(error.response.status);
      } else {
        throw error;
      }
    }
  }, 35000);
});