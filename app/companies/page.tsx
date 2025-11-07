"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Building2, Users, DollarSign, Calendar, ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CompaniesTable } from "@/components/companies/CompaniesTable";
import { CompaniesFilters } from "@/components/companies/CompaniesFilters";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ProfileDropdown } from "@/components/auth/ProfileDropdown";
import { CompanyData } from "@/types/company";
import { fetchCompanies, exportCompaniesExcel } from "@/lib/companies-api";

interface CompaniesFilters {
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

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filters, setFilters] = useState<CompaniesFilters>({
    sortBy: 'lastUpdated',
    sortOrder: 'desc'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== (filters.search || '')) {
        const newFilters = { ...filters, search: searchTerm || undefined };
        setFilters(newFilters);
        loadCompanies(1, newFilters);
      }
    }, 1000); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [searchTerm]); // Only depend on searchTerm

  const loadCompanies = useCallback(async (page: number = 1, newFilters?: CompaniesFilters) => {
    try {
      setIsLoading(true);
      setError(undefined);
      
      const currentFilters = newFilters || filters;
      const response = await fetchCompanies({
        page,
        limit: pagination.limit,
        ...currentFilters
      });
      
      setCompanies(response.data.companies);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load companies');
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.limit]);

  useEffect(() => {
    loadCompanies(1, filters);
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleFiltersChange = (newFilters: CompaniesFilters) => {
    // Update search term if it changed via filters
    if (newFilters.search !== searchTerm) {
      setSearchTerm(newFilters.search || '');
    }
    setFilters(newFilters);
    loadCompanies(1, newFilters);
  };

  const handlePageChange = (page: number) => {
    loadCompanies(page);
  };

  const handleExportFiltered = async () => {
    try {
      setError(undefined); // Clear any previous errors
      await exportCompaniesExcel(filters);
    } catch (err) {
      console.error('Export failed:', err);
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Top Navigation */}
          <div className="flex justify-end mb-6">
            <ProfileDropdown />
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Companies Database
                </h1>
                <p className="text-gray-400 mt-2">
                  Browse and manage your Company Sense database
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={handleExportFiltered}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Filtered Results
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  onClick={() => window.location.href = '/'}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Search
                </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Building2 className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-gray-400 text-sm">Total Companies</p>
                  <p className="text-2xl font-bold text-white">{pagination.totalCount.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Users className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-gray-400 text-sm">Current Page</p>
                  <p className="text-2xl font-bold text-white">{pagination.page} of {pagination.totalPages}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-8 h-8 text-purple-400" />
                <div>
                  <p className="text-gray-400 text-sm">Results Per Page</p>
                  <p className="text-2xl font-bold text-white">{pagination.limit}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-8 h-8 text-orange-400" />
                <div>
                  <p className="text-gray-400 text-sm">Showing</p>
                  <p className="text-2xl font-bold text-white">{companies.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search companies, domains, industries..."
                  className="pl-10 bg-gray-800 border-gray-700 text-white"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Select value={filters.sortBy} onValueChange={(value) => handleFiltersChange({ ...filters, sortBy: value })}>
                <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="employees">Employees</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="foundedYear">Founded Year</SelectItem>
                  <SelectItem value="lastUpdated">Last Updated</SelectItem>
                  <SelectItem value="enrichmentScore">Quality Score</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.sortOrder} onValueChange={(value: 'asc' | 'desc') => handleFiltersChange({ ...filters, sortOrder: value })}>
                <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {showFilters && (
            <CompaniesFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-red-900/40 flex items-center justify-center">
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-red-100">Error</h3>
                <p className="text-sm text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Companies Table */}
        <CompaniesTable
          companies={companies}
          pagination={pagination}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
        </div>
      </div>
    </ProtectedRoute>
  );
}