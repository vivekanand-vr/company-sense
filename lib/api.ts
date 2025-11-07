import { LookupRequest, BulkRequest, LookupResponse, BulkResponse, CompanyResultRow, Filters, CompanyData } from "@/types/company";
import { authenticatedFetch } from "@/lib/auth";

const API_BASE = "/api";

// Helper function to safely convert values and handle nulls
function safeString(value: any): string {
  return value == null ? '' : String(value);
}

function safeNumber(value: any): number {
  return value == null || isNaN(Number(value)) ? 0 : Number(value);
}

// Helper function to convert new API response to legacy format for components
function convertToLegacyFormat(companyData: CompanyData, index: number): CompanyResultRow {
  // Format address from object structure
  const formatAddress = (address: any): string => {
    if (!address) return '';
    if (typeof address === 'string') return address;
    // Prefer city and country for display
    if (address.city || address.country) {
      return [address.city, address.country].filter(Boolean).join(', ');
    }
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.state) parts.push(address.state);
    if (address.postalCode) parts.push(address.postalCode);
    return parts.length > 0 ? parts.join(', ') : (address.full || '');
  };

  return {
    serial: index + 1,
    name: safeString(companyData.name),
    officialUrl: safeString(companyData.website || companyData.domain),
    contact: {
      phone: safeString(companyData.phone),
      email: '', // Not provided in new API
      address: formatAddress(companyData.address),
    },
    turnover: {
      amount: safeNumber(companyData.annualRevenue || companyData.revenue),
      currency: 'USD',
      period: 'annual',
      verbatim: safeString(companyData.annualRevenueFormatted || (companyData.annualRevenue ? `$${companyData.annualRevenue.toLocaleString()}` : '')),
      sourceUrl: safeString(companyData.website),
    },
    headcount: {
      count: safeNumber(companyData.employeeCount || companyData.employees),
      asOf: safeString(companyData.lastEnriched || companyData.lastUpdated),
      sourceUrl: safeString(companyData.website),
    },
    type: safeString(companyData.industry),
    summary: safeString(companyData.description),
    evidenceUrls: companyData.website ? [companyData.website] : [],
    confidence: {
      turnover: typeof companyData.enrichmentScore === 'number' ? companyData.enrichmentScore : 0.8,
      headcount: typeof companyData.enrichmentScore === 'number' ? companyData.enrichmentScore : 0.8,
      summary: typeof companyData.enrichmentScore === 'number' ? companyData.enrichmentScore : 0.9,
    },
    // Additional fields for enhanced display
    socialMedia: companyData.socialMedia || {},
    technologies: companyData.technologies || [],
    foundedYear: companyData.foundedYear,
    logoUrl: companyData.logoUrl,
    addressObject: typeof companyData.address === 'object' ? companyData.address : undefined,
  };
}

export async function lookupCompany(data: LookupRequest): Promise<{ result: CompanyResultRow; message?: string }> {
  const response = await authenticatedFetch(`${API_BASE}/companies/lookup`, {
    method: "POST",
    body: JSON.stringify({
      companyName: data.companyName,
      filters: data.filters,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to lookup company");
  }

  const apiResponse: LookupResponse = await response.json();
  
  if (!apiResponse.success) {
    throw new Error("Company lookup failed");
  }

  // Convert to legacy format for existing components
  const legacyResult = convertToLegacyFormat(apiResponse.data.company, 0);
  
  return {
    result: legacyResult,
    message: `Company lookup completed successfully${apiResponse.data.meetsFilterCriteria ? '' : ' (does not meet filter criteria)'}`,
  };
}

export async function bulkLookup(data: BulkRequest): Promise<{ results: CompanyResultRow[]; processed: number; message?: string }> {
  const response = await authenticatedFetch(`${API_BASE}/companies/bulk`, {
    method: "POST",
    body: JSON.stringify({
      companies: data.companies,
      filters: data.filters,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to start bulk lookup");
  }

  const apiResponse: BulkResponse = await response.json();
  
  if (!apiResponse.success) {
    throw new Error("Bulk lookup failed");
  }

  // Convert successful results to legacy format
  // Handle the actual response structure where each result contains a company object
  const legacyResults = apiResponse.data.results
    ? apiResponse.data.results.map((result: any, index: number) => convertToLegacyFormat(result.company, index))
    : apiResponse.data.companies?.map((company: CompanyData, index: number) => convertToLegacyFormat(company, index)) || [];

  const totalProcessed = apiResponse.data.summary?.successful || apiResponse.data.processed || legacyResults.length;
  const totalFailed = apiResponse.data.summary?.failed || apiResponse.data.failed || 0;

  return {
    results: legacyResults,
    processed: totalProcessed,
    message: `Successfully processed ${totalProcessed} companies${totalFailed > 0 ? ` (${totalFailed} failed)` : ''}`,
  };
}

// Export functionality
export async function exportToExcel(filters?: Filters): Promise<void> {
  const queryParams = new URLSearchParams();
  if (filters?.turnover) queryParams.append('turnover', filters.turnover);
  if (filters?.headcount) queryParams.append('headcount', filters.headcount);
  if (filters?.type) queryParams.append('type', filters.type);
  if (filters?.location) queryParams.append('location', filters.location);
  
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/companies/export/excel?${queryParams.toString()}`;
  
  try {
    // Make authenticated request to get the file
    const response = await authenticatedFetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Export failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Get the blob from the response
    const blob = await response.blob();
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `companies-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the object URL
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
}

// Client-side export function for current results to Excel
export function exportResultsToExcel(results: CompanyResultRow[], filename: string = 'company-results'): void {
  // Create comprehensive Excel data with all available fields
  const headers = [
    'Name',
    'Website',
    'Industry/Type',
    'Summary',
    'Founded Year',
    'Logo URL',
    'Revenue Amount',
    'Revenue Verbatim',
    'Revenue Currency',
    'Employee Count',
    'Phone',
    'Email',
    'Address',
    'City',
    'State/Province',
    'Country',
    'Postal Code',
    'Confidence Summary',
    'Confidence Details',
    'LinkedIn',
    'Twitter',
    'Facebook',
    'Blog/Website',
    'Other Social Media',
    'Additional Data'
  ];
  
  // Helper function to safely extract address data
  const getAddressField = (result: CompanyResultRow, field: string): string => {
    if (result.addressObject && typeof result.addressObject === 'object') {
      const addressObj = result.addressObject as any;
      return addressObj[field] || '';
    }
    return '';
  };
  
  const excelData = results.map(result => [
    result.name || '',
    result.officialUrl || '',
    result.type || '',
    result.summary || '',
    result.foundedYear?.toString() || '',
    result.logoUrl || '',
    result.turnover?.amount?.toString() || '',
    result.turnover?.verbatim || '',
    result.turnover?.currency || '',
    result.headcount?.count?.toString() || '',
    result.contact?.phone || '',
    result.contact?.email || '',
    result.contact?.address || getAddressField(result, 'full') || '',
    getAddressField(result, 'city'),
    getAddressField(result, 'state') || getAddressField(result, 'province'),
    getAddressField(result, 'country'),
    getAddressField(result, 'postalCode') || getAddressField(result, 'zipCode'),
    result.confidence?.summary?.toString() || '',
    JSON.stringify(result.confidence || {}),
    result.socialMedia?.linkedin || '',
    result.socialMedia?.twitter || '',
    result.socialMedia?.facebook || '',
    result.socialMedia?.blog || '',
    JSON.stringify(result.socialMedia || {}),
    JSON.stringify(result, null, 2) // Complete data dump for reference
  ]);
  
  // Create CSV content (Excel can open CSV files)
  const csvContent = [
    headers.join(','),
    ...excelData.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`)
        .join(',')
    )
  ].join('\n');
  
  // Create blob with Excel MIME type
  const blob = new Blob([csvContent], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;' 
  });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}