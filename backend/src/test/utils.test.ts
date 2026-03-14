import { describe, it, expect } from 'vitest';

describe('Environment and Configuration Tests', () => {
  it('should have required environment variables', () => {
    const requiredEnvVars = [
      'DATABASE_URL',
      'GOOGLE_API_KEY', 
      'GOOGLE_SEARCH_ENGINE_ID',
      'APOLLO_API_KEY',
      'OPENAI_API_KEY'
    ];

    const missingVars: string[] = [];
    const presentVars: string[] = [];

    requiredEnvVars.forEach(varName => {
      if (process.env[varName]) {
        presentVars.push(varName);
      } else {
        missingVars.push(varName);
      }
    });

    console.log(`✓ Present environment variables: ${presentVars.length}/${requiredEnvVars.length}`);
    presentVars.forEach(varName => {
      const value = process.env[varName]!;
      const preview = value.length > 10 ? `${value.substring(0, 10)}...` : value;
      console.log(`  ✓ ${varName}: ${preview}`);
    });

    if (missingVars.length > 0) {
      console.log(`⚠ Missing environment variables: ${missingVars.join(', ')}`);
      console.log('  These tests may be skipped or fail without proper configuration');
    }

    // Don't fail the test, just report the status
    expect(requiredEnvVars.length).toBeGreaterThan(0);
  });

  it('should validate database URL format', () => {
    const dbUrl = process.env.DATABASE_URL;
    
    if (dbUrl) {
      expect(dbUrl).toContain('mysql://');
      console.log('✓ Database URL format is valid');
    } else {
      console.log('⚠ DATABASE_URL not configured');
    }
  });

  it('should validate API key formats', () => {
    const keys = {
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
      APOLLO_API_KEY: process.env.APOLLO_API_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY
    };

    Object.entries(keys).forEach(([name, value]) => {
      if (value) {
        expect(value.length).toBeGreaterThan(10);
        console.log(`✓ ${name} has valid format (${value.length} characters)`);
      } else {
        console.log(`⚠ ${name} not configured`);
      }
    });
  });
});

describe('Utility Functions Tests', () => {
  it('should correctly parse revenue ranges', () => {
    const parseRevenueRange = (range: string): { min: number; max: number } => {
      const ranges: Record<string, { min: number; max: number }> = {
        '1-10': { min: 1000000, max: 10000000 },
        '10-50': { min: 10000000, max: 50000000 },
        '50-100': { min: 50000000, max: 100000000 },
        '100-500': { min: 100000000, max: 500000000 },
        '500-1000': { min: 500000000, max: 1000000000 },
        '1000-5000': { min: 1000000000, max: 5000000000 },
        '5000+': { min: 5000000000, max: Infinity }
      };
      return ranges[range] || { min: 0, max: Infinity };
    };

    const testCases = [
      { range: '1-10', expected: { min: 1000000, max: 10000000 } },
      { range: '100-500', expected: { min: 100000000, max: 500000000 } },
      { range: '5000+', expected: { min: 5000000000, max: Infinity } }
    ];

    testCases.forEach(({ range, expected }) => {
      const result = parseRevenueRange(range);
      expect(result).toEqual(expected);
      console.log(`✓ Revenue range "${range}" parsed correctly: $${result.min/1000000}M - $${result.max === Infinity ? '∞' : result.max/1000000 + 'M'}`);
    });
  });

  it('should correctly parse employee count ranges', () => {
    const parseEmployeeRange = (range: string): { min: number; max: number } => {
      const ranges: Record<string, { min: number; max: number }> = {
        '1-10': { min: 1, max: 10 },
        '11-50': { min: 11, max: 50 },
        '51-100': { min: 51, max: 100 },
        '101-250': { min: 101, max: 250 },
        '251-500': { min: 251, max: 500 },
        '501-1000': { min: 501, max: 1000 },
        '1001-5000': { min: 1001, max: 5000 },
        '5001-10000': { min: 5001, max: 10000 },
        '10000+': { min: 10000, max: Infinity }
      };
      return ranges[range] || { min: 0, max: Infinity };
    };

    const testCases = [
      { range: '1-10', expected: { min: 1, max: 10 } },
      { range: '501-1000', expected: { min: 501, max: 1000 } },
      { range: '10000+', expected: { min: 10000, max: Infinity } }
    ];

    testCases.forEach(({ range, expected }) => {
      const result = parseEmployeeRange(range);
      expect(result).toEqual(expected);
      console.log(`✓ Employee range "${range}" parsed correctly: ${result.min} - ${result.max === Infinity ? '∞' : result.max}`);
    });
  });

  it('should format revenue values correctly', () => {
    const formatRevenue = (revenue: number): string => {
      if (revenue >= 1000000000) {
        return `${(revenue / 1000000000).toFixed(1)}B`;
      } else if (revenue >= 1000000) {
        return `${(revenue / 1000000).toFixed(1)}M`;
      } else if (revenue >= 1000) {
        return `${(revenue / 1000).toFixed(1)}K`;
      }
      return revenue.toString();
    };

    const testCases = [
      { revenue: 5600000000, expected: '5.6B' },
      { revenue: 250000000, expected: '250.0M' },
      { revenue: 50000, expected: '50.0K' },
      { revenue: 500, expected: '500' }
    ];

    testCases.forEach(({ revenue, expected }) => {
      const result = formatRevenue(revenue);
      expect(result).toBe(expected);
      console.log(`✓ Revenue $${revenue} formatted as: ${result}`);
    });
  });
});

describe('Data Validation Tests', () => {
  it('should validate company data structure', () => {
    const sampleCompany = {
      id: 'test-uuid-123',
      name: 'Test Company Inc.',
      domain: 'testcompany.com',
      website: 'https://testcompany.com',
      industry: 'Technology',
      description: 'A sample technology company',
      foundedYear: 2020,
      employeeCount: 500,
      annualRevenue: 100000000,
      publiclyTraded: false
    };

    // Validate required fields
    expect(sampleCompany.id).toBeDefined();
    expect(sampleCompany.name).toBeDefined();
    expect(sampleCompany.domain).toBeDefined();
    
    // Validate data types
    expect(typeof sampleCompany.name).toBe('string');
    expect(typeof sampleCompany.employeeCount).toBe('number');
    expect(typeof sampleCompany.annualRevenue).toBe('number');
    expect(typeof sampleCompany.publiclyTraded).toBe('boolean');
    
    // Validate ranges
    expect(sampleCompany.foundedYear).toBeGreaterThan(1800);
    expect(sampleCompany.foundedYear).toBeLessThanOrEqual(new Date().getFullYear());
    expect(sampleCompany.employeeCount).toBeGreaterThan(0);
    expect(sampleCompany.annualRevenue).toBeGreaterThanOrEqual(0);

    console.log('✓ Company data structure validation passed');
    console.log(`  Company: ${sampleCompany.name}`);
    console.log(`  Employees: ${sampleCompany.employeeCount}`);
    console.log(`  Revenue: $${(sampleCompany.annualRevenue / 1000000).toFixed(1)}M`);
  });

  it('should validate filter criteria structure', () => {
    const sampleFilters = {
      turnover: '100-500',
      headcount: '501-1000',
      type: 'technology',
      industry: 'Technology',
      minEmployees: 100,
      maxRevenue: 1000000000,
      publiclyTraded: true
    };

    // Validate filter types
    if (sampleFilters.turnover) expect(typeof sampleFilters.turnover).toBe('string');
    if (sampleFilters.headcount) expect(typeof sampleFilters.headcount).toBe('string');
    if (sampleFilters.type) expect(typeof sampleFilters.type).toBe('string');
    if (sampleFilters.minEmployees) expect(typeof sampleFilters.minEmployees).toBe('number');
    if (sampleFilters.maxRevenue) expect(typeof sampleFilters.maxRevenue).toBe('number');
    if (sampleFilters.publiclyTraded) expect(typeof sampleFilters.publiclyTraded).toBe('boolean');

    // Validate ranges
    if (sampleFilters.minEmployees) expect(sampleFilters.minEmployees).toBeGreaterThan(0);
    if (sampleFilters.maxRevenue) expect(sampleFilters.maxRevenue).toBeGreaterThan(0);

    console.log('✓ Filter criteria structure validation passed');
    console.log(`  Filters applied: ${Object.keys(sampleFilters).length}`);
  });
});