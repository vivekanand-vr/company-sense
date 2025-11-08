import { CompanyData } from "@/types/company";
import { authenticatedFetch } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api';

export interface CompaniesFilters {
  page?: number;
  limit?: number;
  search?: string;
  industry?: string;
  minEmployees?: number;
  maxEmployees?: number;
  minRevenue?: number;
  maxRevenue?: number;
  country?: string;
  publiclyTraded?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CompaniesResponse {
  success: boolean;
  data: {
    companies: CompanyData[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    filters: {
      applied: any;
      resultCount: number;
    };
  };
  processingTimeMs: number;
}

export async function fetchCompanies(filters: CompaniesFilters = {}): Promise<CompaniesResponse> {
  const queryParams = new URLSearchParams();
  
  // Add pagination
  if (filters.page) queryParams.append('page', filters.page.toString());
  if (filters.limit) queryParams.append('limit', filters.limit.toString());
  
  // Add search
  if (filters.search) queryParams.append('search', filters.search);
  
  // Add filtering
  if (filters.industry) queryParams.append('industry', filters.industry);
  if (filters.minEmployees) queryParams.append('minEmployees', filters.minEmployees.toString());
  if (filters.maxEmployees) queryParams.append('maxEmployees', filters.maxEmployees.toString());
  if (filters.minRevenue) queryParams.append('minRevenue', filters.minRevenue.toString());
  if (filters.maxRevenue) queryParams.append('maxRevenue', filters.maxRevenue.toString());
  if (filters.country) queryParams.append('country', filters.country);
  if (filters.publiclyTraded !== undefined) queryParams.append('publiclyTraded', filters.publiclyTraded.toString());
  
  // Add sorting
  if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
  if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);

  const response = await authenticatedFetch(`${API_BASE}/companies?${queryParams.toString()}`, {
    method: "GET",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch companies' }));
    throw new Error(error.error || "Failed to fetch companies");
  }

  return response.json();
}

export async function exportCompaniesExcel(filters: CompaniesFilters = {}): Promise<void> {
  const queryParams = new URLSearchParams();
  
  // Add all filters for export
  if (filters.search) queryParams.append('search', filters.search);
  if (filters.industry) queryParams.append('industry', filters.industry);
  if (filters.minEmployees) queryParams.append('minEmployees', filters.minEmployees.toString());
  if (filters.maxEmployees) queryParams.append('maxEmployees', filters.maxEmployees.toString());
  if (filters.minRevenue) queryParams.append('minRevenue', filters.minRevenue.toString());
  if (filters.maxRevenue) queryParams.append('maxRevenue', filters.maxRevenue.toString());
  if (filters.country) queryParams.append('country', filters.country);
  if (filters.publiclyTraded !== undefined) queryParams.append('publiclyTraded', filters.publiclyTraded.toString());
  if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
  if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
  
  const url = `${API_BASE}/companies/export/excel?${queryParams.toString()}`;
  
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
    link.download = `companies-filtered-${new Date().toISOString().split('T')[0]}.xlsx`;
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

export async function exportCompaniesCSV(filters: CompaniesFilters = {}): Promise<void> {
  const queryParams = new URLSearchParams();
  
  // Add all filters for export
  if (filters.search) queryParams.append('search', filters.search);
  if (filters.industry) queryParams.append('industry', filters.industry);
  if (filters.minEmployees) queryParams.append('minEmployees', filters.minEmployees.toString());
  if (filters.maxEmployees) queryParams.append('maxEmployees', filters.maxEmployees.toString());
  if (filters.minRevenue) queryParams.append('minRevenue', filters.minRevenue.toString());
  if (filters.maxRevenue) queryParams.append('maxRevenue', filters.maxRevenue.toString());
  if (filters.country) queryParams.append('country', filters.country);
  if (filters.publiclyTraded !== undefined) queryParams.append('publiclyTraded', filters.publiclyTraded.toString());
  if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
  if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
  
  const url = `${API_BASE}/companies/export/csv?${queryParams.toString()}`;
  
  // Create a temporary link and trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = `companies-filtered-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportAllCompaniesExcel(): Promise<void> {
  const url = `${API_BASE}/companies/export/all/excel`;
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `all-companies-${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}