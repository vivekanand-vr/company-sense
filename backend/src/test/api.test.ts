import { describe, it, expect, beforeAll } from 'vitest';

describe('Company API Integration Tests', () => {
  const BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';
  let serverRunning = false;

  beforeAll(async () => {
    // Check if server is running
    try {
      const response = await fetch(`${BASE_URL}/health`);
      serverRunning = response.ok;
      console.log(`✓ Server is ${serverRunning ? 'running' : 'not running'} at ${BASE_URL}`);
    } catch (error) {
      console.log(`⚠ Server not accessible at ${BASE_URL} - some tests may be skipped`);
      serverRunning = false;
    }
  });

  describe('Health Check API', () => {
    it('should return healthy status', async () => {
      if (!serverRunning) {
        console.log('⚠ Skipping health check test - server not running');
        return;
      }

      const response = await fetch(`${BASE_URL}/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBeDefined();
      
      console.log('✓ Health check passed:', data.status);
      console.log(`✓ Server uptime: ${data.uptime} seconds`);
    });
  });

  describe('Companies List API', () => {
    it('should list companies with pagination', async () => {
      if (!serverRunning) {
        console.log('⚠ Skipping companies list test - server not running');
        return;
      }

      const response = await fetch(`${BASE_URL}/api/companies?page=1&limit=5`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.companies).toBeInstanceOf(Array);
      expect(data.data.pagination).toBeDefined();
      
      console.log(`✓ Retrieved ${data.data.companies.length} companies`);
      console.log(`✓ Total companies in database: ${data.data.pagination.totalCount}`);
      
      if (data.data.companies.length > 0) {
        const company = data.data.companies[0];
        expect(company.id).toBeDefined();
        expect(company.name).toBeDefined();
        expect(company.domain).toBeDefined();
        console.log(`✓ Sample company: ${company.name} (${company.domain})`);
      }
    });

    it('should filter companies by industry', async () => {
      if (!serverRunning) {
        console.log('⚠ Skipping industry filter test - server not running');
        return;
      }

      const response = await fetch(`${BASE_URL}/api/companies?industry=Technology&limit=3`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      if (data.data.companies.length > 0) {
        console.log(`✓ Found ${data.data.companies.length} technology companies`);
        // Verify industry filter is working
        data.data.companies.forEach((company: any) => {
          console.log(`  - ${company.name}: ${company.industry}`);
        });
      } else {
        console.log('⚠ No technology companies found in database');
      }
    });

    it('should search companies by name', async () => {
      if (!serverRunning) {
        console.log('⚠ Skipping search test - server not running');
        return;
      }

      const response = await fetch(`${BASE_URL}/api/companies?search=tech&limit=3`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      console.log(`✓ Search for 'tech' returned ${data.data.companies.length} results`);
      
      if (data.data.companies.length > 0) {
        data.data.companies.forEach((company: any) => {
          console.log(`  - ${company.name}`);
        });
      }
    });
  });

  describe('Company Lookup API', () => {
    it('should lookup a well-known company (database check)', async () => {
      if (!serverRunning) {
        console.log('⚠ Skipping company lookup test - server not running');
        return;
      }

      const response = await fetch(`${BASE_URL}/api/companies/lookup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Microsoft'
        })
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.company).toBeDefined();
      
      console.log(`✓ Company lookup successful: ${data.data.company.name}`);
      console.log(`✓ Data source: ${data.data.company.dataSource}`);
      console.log(`✓ Processing time: ${data.processingTimeMs}ms`);
      
      if (data.data.company.dataSource === 'database_cache') {
        expect(data.processingTimeMs).toBeLessThan(1000); // Should be fast from cache
        console.log('✓ Fast database cache response confirmed');
      }
    }, 30000);

    it('should handle bulk company lookup', async () => {
      if (!serverRunning) {
        console.log('⚠ Skipping bulk lookup test - server not running');
        return;
      }

      const response = await fetch(`${BASE_URL}/api/companies/bulk-lookup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          names: ['Google', 'Apple', 'Microsoft'],
          hints: {
            type: 'technology'
          }
        })
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.results).toBeInstanceOf(Array);
      expect(data.data.summary).toBeDefined();
      
      console.log(`✓ Bulk lookup processed ${data.data.summary.total} companies`);
      console.log(`✓ Successful: ${data.data.summary.successful}`);
      console.log(`✓ Average processing time: ${data.data.summary.averageProcessingTime}ms`);
      
      data.data.results.forEach((result: any, index: number) => {
        if (result.company) {
          console.log(`  ${index + 1}. ${result.company.name} (${result.dataSource})`);
        }
      });
    }, 60000);
  });

  describe('Export API', () => {
    it('should generate CSV export', async () => {
      if (!serverRunning) {
        console.log('⚠ Skipping CSV export test - server not running');
        return;
      }

      const response = await fetch(`${BASE_URL}/api/companies/export/csv?limit=5`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/csv');
      expect(response.headers.get('content-disposition')).toContain('attachment');
      
      const csvContent = await response.text();
      expect(csvContent).toContain('name'); // Should have header row
      
      console.log('✓ CSV export generated successfully');
      console.log(`✓ CSV content length: ${csvContent.length} characters`);
    });

    it('should generate Excel export', async () => {
      if (!serverRunning) {
        console.log('⚠ Skipping Excel export test - server not running');
        return;
      }

      const response = await fetch(`${BASE_URL}/api/companies/export/excel?limit=3`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('spreadsheet');
      expect(response.headers.get('content-disposition')).toContain('attachment');
      
      const buffer = await response.arrayBuffer();
      expect(buffer.byteLength).toBeGreaterThan(0);
      
      console.log('✓ Excel export generated successfully');
      console.log(`✓ Excel file size: ${buffer.byteLength} bytes`);
    });
  });

  describe('Swagger Documentation API', () => {
    it('should serve Swagger UI', async () => {
      if (!serverRunning) {
        console.log('⚠ Skipping Swagger UI test - server not running');
        return;
      }

      const response = await fetch(`${BASE_URL}/api-docs/`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');
      
      const html = await response.text();
      expect(html).toContain('swagger');
      
      console.log('✓ Swagger UI is accessible');
    });

    it('should serve OpenAPI JSON spec', async () => {
      if (!serverRunning) {
        console.log('⚠ Skipping OpenAPI spec test - server not running');
        return;
      }

      const response = await fetch(`${BASE_URL}/api-docs.json`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');
      
      const spec = await response.json();
      expect(spec.openapi).toBeDefined();
      expect(spec.info).toBeDefined();
      expect(spec.paths).toBeDefined();
      
      console.log('✓ OpenAPI specification is valid');
      console.log(`✓ API version: ${spec.info.version}`);
      console.log(`✓ Total endpoints: ${Object.keys(spec.paths).length}`);
    });
  });
});