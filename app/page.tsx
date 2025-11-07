"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { Download, Search, Upload, Zap, List } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";
import { OptionalFilters } from "@/components/search/OptionalFilters";
import { BulkUploadDialog } from "@/components/upload/BulkUploadDialog";
import { ProgressIndicator } from "@/components/results/ProgressIndicator";
import { ResultsTable } from "@/components/results/ResultsTable";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ProfileDropdown } from "@/components/auth/ProfileDropdown";
import { lookupCompany, bulkLookup, exportToExcel } from "@/lib/api";
import { LookupRequest, Filters, CompanyResultRow } from "@/types/company";

export default function Home() {
  const [filters, setFilters] = useState<Filters>({});
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<CompanyResultRow[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>();
  const [processingTime, setProcessingTime] = useState<number>();

  const handleFiltersChange = useCallback((newFilters: Filters) => {
    setFilters(newFilters);
  }, []);

  const handleSingleLookup = async (data: LookupRequest) => {
    try {
      const startTime = Date.now();
      setError(undefined);
      setSuccessMessage(undefined);
      setIsLoading(true);
      const response = await lookupCompany({ ...data, filters: filters || data.filters });
      const endTime = Date.now();
      setProcessingTime((endTime - startTime) / 1000);
      setResults([response.result]);
      setSuccessMessage(response.message || "Company lookup completed successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkUpload = async (names: string[], uploadFilters?: Filters) => {
    try {
      const startTime = Date.now();
      setError(undefined);
      setSuccessMessage(undefined);
      setIsLoading(true);
      const response = await bulkLookup({ companies: names, filters: uploadFilters });
      const endTime = Date.now();
      setProcessingTime((endTime - startTime) / 1000);
      setResults(response.results);
      setSuccessMessage(response.message || `Successfully processed ${response.processed} companies`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      await exportToExcel(filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Top Navigation */}
          <div className="flex justify-end mb-6">
            <ProfileDropdown />
          </div>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="p-3 bg-linear-to-br from-blue-600 to-purple-600 rounded-xl">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Company Sense
              </h1>
            </div>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-6">
            Powered by <span className="font-semibold text-blue-400">Google Search</span> + 
            <span className="font-semibold text-green-400"> Apollo.io</span> + 
            <span className="font-semibold text-purple-400"> ChatGPT</span>
          </p>
          <p className="text-gray-400">
            Extract comprehensive business insights including official websites, financial data, and AI-generated summaries from company names.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
          <Link href="/companies">
            <Button className="bg-linear-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3">
              <List className="w-5 h-5 mr-2" />
              Browse All Companies
            </Button>
          </Link>
          <Button
            onClick={handleExportExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3"
          >
            <Download className="w-4 h-4 mr-2" />
            Export All Excel
          </Button>
        </div>

        {/* Search Section */}
        <div className="space-y-6 mb-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Search className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Single Company Lookup</h3>
              </div>
              <SearchBar 
                onSearch={handleSingleLookup}
                isLoading={isLoading}
              />
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Optional Filters</h3>
              <OptionalFilters 
                hints={filters}
                onHintsChange={handleFiltersChange}
              />
            </div>
          </div>

          <div className="text-center">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md mx-auto">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Upload className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Bulk Upload</h3>
              </div>
              <BulkUploadDialog
                onUpload={handleBulkUpload}
                hints={filters}
              />
            </div>
          </div>
        </div>

        {/* Progress Section */}
        {isLoading && (
          <div className="max-w-4xl mx-auto mb-8">
            <ProgressIndicator 
              isLoading={isLoading}
              message="Processing companies with AI enhancement..."
            />
          </div>
        )}

        {/* Success Message */}
        {successMessage && results.length > 0 && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-green-900/20 border border-green-800 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-900/40 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-green-100">Processing Complete</h3>
                  <p className="text-sm text-green-300">{successMessage}</p>
                  {processingTime && (
                    <p className="text-xs text-green-400 mt-1">
                      Completed in {processingTime.toFixed(2)} seconds
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-red-900/20 border border-red-800 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-900/40 flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-red-100">Processing Failed</h3>
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {(results.length > 0 || isLoading) && (
          <div className="w-full">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold mb-2 bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Intelligence Results
              </h2>
              <p className="text-gray-400">Enhanced company data with AI insights</p>
            </div>
            
            <ResultsTable 
              results={results} 
              isLoading={isLoading}
            />
          </div>
        )}
        </div>
      </div>
    </ProtectedRoute>
  );
}