import ExcelJS from 'exceljs';
import { CompanyService } from './company.service';
import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';
import path from 'path';
import fs from 'fs';

export class ExcelExportService {
  private companyService: CompanyService;

  constructor() {
    this.companyService = new CompanyService();
  }

  /**
   * Export filtered companies to Excel file
   * @param filters - Prisma filters to apply (same format as listCompanies)
   * @returns Promise<Buffer> - Excel file buffer
   */
  async exportFilteredCompanies(filters?: any): Promise<Buffer> {
    try {
      logger.info('Starting filtered companies Excel export', { filters });

      // Query companies directly with Prisma (same as listCompanies)
      const companies = await prisma.company.findMany({
        where: filters || {},
        orderBy: { lastUpdated: 'desc' }
      });
      
      if (companies.length === 0) {
        throw new Error('No companies found matching the specified filters');
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Companies');

      // Define columns
      worksheet.columns = [
        { header: 'Company Name', key: 'name', width: 25 },
        { header: 'Domain', key: 'domain', width: 20 },
        { header: 'Website', key: 'website', width: 30 },
        { header: 'Industry', key: 'industry', width: 20 },
        { header: 'Description', key: 'description', width: 50 },
        { header: 'Founded Year', key: 'foundedYear', width: 15 },
        { header: 'Employees', key: 'employees', width: 15 },
        { header: 'Annual Revenue', key: 'revenue', width: 20 },
        { header: 'Revenue (Formatted)', key: 'annualRevenueFormatted', width: 20 },
        { header: 'Phone', key: 'phone', width: 20 },
        { header: 'CEO', key: 'ceo', width: 25 },
        { header: 'Business Model', key: 'businessModel', width: 30 },
        { header: 'Stock Symbol', key: 'stockSymbol', width: 15 },
        { header: 'LinkedIn', key: 'linkedinUrl', width: 40 },
        { header: 'Twitter', key: 'twitterUrl', width: 40 },
        { header: 'Address', key: 'fullAddress', width: 40 },
        { header: 'Data Source', key: 'dataSource', width: 20 },
        { header: 'Last Updated', key: 'lastUpdated', width: 20 }
      ];

      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Add data rows
      companies.forEach((company: any) => {
        const addressObj = typeof company.address === 'string' 
          ? JSON.parse(company.address || '{}') 
          : company.address || {};
        
        const fullAddress = [
          addressObj.street,
          addressObj.city,
          addressObj.state,
          addressObj.country
        ].filter(Boolean).join(', ');

        worksheet.addRow({
          name: company.name,
          domain: company.domain,
          website: company.website,
          industry: company.industry,
          description: company.description,
          foundedYear: company.foundedYear,
          employees: company.employees,
          revenue: company.revenue ? Number(company.revenue) : null,
          annualRevenueFormatted: company.annualRevenueFormatted,
          phone: company.phone,
          ceo: company.ceo,
          businessModel: company.businessModel,
          stockSymbol: company.stockSymbol,
          linkedinUrl: company.linkedinUrl,
          twitterUrl: company.twitterUrl,
          fullAddress,
          dataSource: company.dataSource,
          lastUpdated: company.lastUpdated
        });
      });

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        if (column.values) {
          const lengths = column.values.map(v => v ? v.toString().length : 0);
          const maxLength = Math.max(...lengths.filter(v => typeof v === 'number'));
          column.width = Math.min(Math.max(maxLength + 2, 10), 50);
        }
      });

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      
      logger.info('Filtered companies Excel export completed', {
        companiesCount: companies.length,
        bufferSize: buffer.byteLength
      });

      return buffer as unknown as Buffer;

    } catch (error) {
      logger.error('Failed to export filtered companies to Excel', {
        error: (error as Error).message,
        filters
      });
      throw error;
    }
  }

  /**
   * Export all companies from database to Excel file
   * @returns Promise<Buffer> - Excel file buffer
   */
  async exportAllCompanies(): Promise<Buffer> {
    try {
      logger.info('Starting all companies Excel export');

      const companies = await this.companyService.getAllCompanies();
      
      if (companies.length === 0) {
        throw new Error('No companies found in the database');
      }

      const workbook = new ExcelJS.Workbook();
      
      // Main companies sheet
      const mainSheet = workbook.addWorksheet('All Companies');
      
      // Define comprehensive columns for all data
      mainSheet.columns = [
        { header: 'ID', key: 'id', width: 30 },
        { header: 'Company Name', key: 'name', width: 25 },
        { header: 'Domain', key: 'domain', width: 20 },
        { header: 'Website', key: 'website', width: 30 },
        { header: 'Primary Domain', key: 'primaryDomain', width: 20 },
        { header: 'Industry', key: 'industry', width: 20 },
        { header: 'Description', key: 'description', width: 50 },
        { header: 'Founded Year', key: 'foundedYear', width: 15 },
        { header: 'Employees', key: 'employees', width: 15 },
        { header: 'Annual Revenue', key: 'revenue', width: 20 },
        { header: 'Revenue Currency', key: 'revenueCurrency', width: 15 },
        { header: 'Revenue (Formatted)', key: 'annualRevenueFormatted', width: 20 },
        { header: 'Total Funding', key: 'totalFunding', width: 20 },
        { header: 'Latest Funding Stage', key: 'latestFundingStage', width: 20 },
        { header: 'Phone', key: 'phone', width: 20 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'CEO', key: 'ceo', width: 25 },
        { header: 'Business Model', key: 'businessModel', width: 30 },
        { header: 'Parent Company', key: 'parentCompany', width: 25 },
        { header: 'Publicly Traded', key: 'publiclyTraded', width: 15 },
        { header: 'Stock Symbol', key: 'stockSymbol', width: 15 },
        { header: 'Stock Exchange', key: 'stockExchange', width: 15 },
        { header: 'LinkedIn', key: 'linkedinUrl', width: 40 },
        { header: 'Twitter', key: 'twitterUrl', width: 40 },
        { header: 'Facebook', key: 'facebookUrl', width: 40 },
        { header: 'Address', key: 'fullAddress', width: 40 },
        { header: 'City', key: 'city', width: 20 },
        { header: 'State', key: 'state', width: 15 },
        { header: 'Country', key: 'country', width: 15 },
        { header: 'Apollo ID', key: 'apolloId', width: 30 },
        { header: 'Data Source', key: 'dataSource', width: 20 },
        { header: 'Apollo Source', key: 'apolloSource', width: 15 },
        { header: 'ChatGPT Source', key: 'chatgptSource', width: 15 },
        { header: 'Enrichment Score', key: 'enrichmentScore', width: 20 },
        { header: 'Last Updated', key: 'lastUpdated', width: 20 },
        { header: 'Last Enriched', key: 'lastEnriched', width: 20 }
      ];

      // Style the header
      this.styleHeader(mainSheet);

      // Add data
      companies.forEach((company: any) => {
        const addressObj = this.parseAddress(company.address);
        
        mainSheet.addRow({
          id: company.id,
          name: company.name,
          domain: company.domain,
          website: company.website,
          primaryDomain: company.primaryDomain,
          industry: company.industry,
          description: company.description,
          foundedYear: company.foundedYear,
          employees: company.employees,
          revenue: company.revenue ? Number(company.revenue) : null,
          revenueCurrency: company.revenueCurrency,
          annualRevenueFormatted: company.annualRevenueFormatted,
          totalFunding: company.totalFunding ? Number(company.totalFunding) : null,
          latestFundingStage: company.latestFundingStage,
          phone: company.phone,
          email: company.email,
          ceo: company.ceo,
          businessModel: company.businessModel,
          parentCompany: company.parentCompany,
          publiclyTraded: company.publiclyTraded,
          stockSymbol: company.stockSymbol,
          stockExchange: company.stockExchange,
          linkedinUrl: company.linkedinUrl,
          twitterUrl: company.twitterUrl,
          facebookUrl: company.facebookUrl,
          fullAddress: this.formatFullAddress(addressObj),
          city: addressObj.city || company.city,
          state: addressObj.state || company.state,
          country: addressObj.country || company.country,
          apolloId: company.apolloId,
          dataSource: company.dataSource,
          apolloSource: company.apolloSource,
          chatgptSource: company.chatgptSource,
          enrichmentScore: company.enrichmentScore ? Number(company.enrichmentScore) : null,
          lastUpdated: company.lastUpdated,
          lastEnriched: company.lastEnriched
        });
      });

      // Add summary sheet
      const summarySheet = workbook.addWorksheet('Summary');
      this.createSummarySheet(summarySheet, companies);

      // Auto-fit columns
      this.autoFitColumns(mainSheet);

      const buffer = await workbook.xlsx.writeBuffer();
      
      logger.info('All companies Excel export completed', {
        companiesCount: companies.length,
        bufferSize: buffer.byteLength
      });

      return buffer as unknown as Buffer;

    } catch (error) {
      logger.error('Failed to export all companies to Excel', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Generate CSV export of companies
   * @param filters - Optional filters to apply
   * @returns Promise<string> - CSV content
   */
  async exportToCSV(filters?: any): Promise<string> {
    try {
      logger.info('Starting CSV export', { filters });

      const companies = await this.companyService.getAllCompanies(filters);
      
      if (companies.length === 0) {
        throw new Error('No companies found');
      }

      // CSV headers
      const headers = [
        'Company Name',
        'Domain',
        'Website',
        'Industry',
        'Description',
        'Founded Year',
        'Employees',
        'Annual Revenue',
        'Phone',
        'CEO',
        'Business Model',
        'Stock Symbol',
        'LinkedIn',
        'Twitter',
        'Address',
        'Data Source',
        'Last Updated'
      ];

      // Build CSV content
      let csvContent = headers.join(',') + '\n';

      companies.forEach((company: any) => {
        const addressObj = this.parseAddress(company.address);
        const fullAddress = this.formatFullAddress(addressObj);
        
        const row = [
          this.escapeCsvValue(company.name),
          this.escapeCsvValue(company.domain),
          this.escapeCsvValue(company.website),
          this.escapeCsvValue(company.industry),
          this.escapeCsvValue(company.description),
          company.foundedYear || '',
          company.employees || '',
          company.revenue || '',
          this.escapeCsvValue(company.phone),
          this.escapeCsvValue(company.ceo),
          this.escapeCsvValue(company.businessModel),
          this.escapeCsvValue(company.stockSymbol),
          this.escapeCsvValue(company.linkedinUrl),
          this.escapeCsvValue(company.twitterUrl),
          this.escapeCsvValue(fullAddress),
          this.escapeCsvValue(company.dataSource),
          company.lastUpdated || ''
        ];

        csvContent += row.join(',') + '\n';
      });

      logger.info('CSV export completed', {
        companiesCount: companies.length,
        contentLength: csvContent.length
      });

      return csvContent;

    } catch (error) {
      logger.error('Failed to export to CSV', {
        error: (error as Error).message,
        filters
      });
      throw error;
    }
  }

  private styleHeader(worksheet: ExcelJS.Worksheet): void {
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF366092' }
    };
    worksheet.getRow(1).height = 25;
  }

  private autoFitColumns(worksheet: ExcelJS.Worksheet): void {
    worksheet.columns.forEach(column => {
      if (column.values) {
        const lengths = column.values.map(v => v ? v.toString().length : 0);
        const maxLength = Math.max(...lengths.filter(v => typeof v === 'number'));
        column.width = Math.min(Math.max(maxLength + 2, 10), 80);
      }
    });
  }

  private parseAddress(address: any): any {
    if (!address) return {};
    
    if (typeof address === 'string') {
      try {
        return JSON.parse(address);
      } catch {
        return { full: address };
      }
    }
    
    return address;
  }

  private formatFullAddress(addressObj: any): string {
    if (!addressObj) return '';
    
    if (addressObj.full) return addressObj.full;
    
    return [
      addressObj.street,
      addressObj.city,
      addressObj.state,
      addressObj.country,
      addressObj.zipCode
    ].filter(Boolean).join(', ');
  }

  private createSummarySheet(worksheet: ExcelJS.Worksheet, companies: any[]): void {
    worksheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 }
    ];

    this.styleHeader(worksheet);

    // Calculate summary statistics
    const totalCompanies = companies.length;
    const withRevenue = companies.filter(c => c.revenue).length;
    const withEmployees = companies.filter(c => c.employees).length;
    const publiclyTraded = companies.filter(c => c.publiclyTraded).length;
    const withApollo = companies.filter(c => c.apolloSource).length;
    const withChatGPT = companies.filter(c => c.chatgptSource).length;

    const industries = [...new Set(companies.map(c => c.industry).filter(Boolean))];
    const avgRevenue = companies.filter(c => c.revenue).reduce((sum, c) => sum + Number(c.revenue), 0) / withRevenue;
    const avgEmployees = companies.filter(c => c.employees).reduce((sum, c) => sum + Number(c.employees), 0) / withEmployees;

    // Add summary rows
    const summaryData = [
      { metric: 'Total Companies', value: totalCompanies },
      { metric: 'Companies with Revenue Data', value: withRevenue },
      { metric: 'Companies with Employee Data', value: withEmployees },
      { metric: 'Publicly Traded Companies', value: publiclyTraded },
      { metric: 'Companies from Apollo', value: withApollo },
      { metric: 'Companies with ChatGPT Enrichment', value: withChatGPT },
      { metric: 'Unique Industries', value: industries.length },
      { metric: 'Average Revenue (millions)', value: Math.round(avgRevenue / 1000000) },
      { metric: 'Average Employees', value: Math.round(avgEmployees) }
    ];

    summaryData.forEach(row => worksheet.addRow(row));
  }

  private escapeCsvValue(value: any): string {
    if (!value) return '';
    
    const str = value.toString();
    
    // If the value contains comma, quote, or newline, wrap it in quotes and escape internal quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    
    return str;
  }
}