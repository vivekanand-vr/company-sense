"use client";

import React, { useState } from "react";
import { BulkResponse } from "@/types/company";
import { Download, CheckCircle, XCircle, Building, ExternalLink, Calendar, Users, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JobResultsProps {
  result: BulkResponse['data'];
  className?: string;
}

export function JobResults({ result, className = "" }: JobResultsProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!result || !result.results) {
    return null;
  }

  const { results, summary } = result;
  const successfulResults = results.filter(r => r.meetsFilterCriteria);

  const handleExportResults = () => {
    const csvData = convertToCSV(successfulResults);
    downloadCSV(csvData, `bulk-lookup-results-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const convertToCSV = (data: typeof results) => {
    if (data.length === 0) return '';

    const headers = [
      'Company Name',
      'Domain',
      'Website',
      'Industry',
      'Employees',
      'Revenue',
      'Founded Year',
      'Location',
      'Description',
      'Data Source',
      'Processing Time (ms)',
      'Meets Criteria'
    ];

    const rows = data.map(item => {
      const company = item.company;
      return [
        company.name || '',
        company.domain || '',
        company.website || '',
        company.industry || '',
        company.employees || company.employeeCount || '',
        company.annualRevenueFormatted || company.revenue || '',
        company.foundedYear || '',
        (typeof company.address === 'string' ? company.address : company.address?.full) || '',
        company.description || '',
        item.dataSource || '',
        item.processingTimeMs || '',
        item.meetsFilterCriteria ? 'Yes' : 'No'
      ];
    });

    return [headers, ...rows].map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  };

  const downloadCSV = (csvData: string, filename: string) => {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatRevenue = (company: any) => {
    if (company.annualRevenueFormatted) return company.annualRevenueFormatted;
    if (company.revenue) return `$${company.revenue.toLocaleString()}`;
    if (company.annualRevenue) return `$${company.annualRevenue.toLocaleString()}`;
    return 'N/A';
  };

  const formatEmployees = (company: any) => {
    const employees = company.employees || company.employeeCount;
    return employees ? employees.toLocaleString() : 'N/A';
  };

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl ${className}`}>
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Results Summary</h3>
            <p className="text-sm text-gray-400 mt-1">
              Your bulk company lookup has been completed
            </p>
          </div>
          {successfulResults.length > 0 && (
            <Button onClick={handleExportResults} size="sm" className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export Results</span>
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="p-6 border-b border-gray-800">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">{summary?.total || results.length}</div>
            <div className="text-sm text-blue-300 font-medium">Total Processed</div>
          </div>
          <div className="text-center p-4 bg-green-900/20 border border-green-800 rounded-lg">
            <div className="text-2xl font-bold text-green-400">{summary?.successful || results.length}</div>
            <div className="text-sm text-green-300 font-medium">Successful</div>
          </div>
          <div className="text-center p-4 bg-yellow-900/20 border border-yellow-800 rounded-lg">
            <div className="text-2xl font-bold text-yellow-400">{summary?.meetsFilterCriteria || successfulResults.length}</div>
            <div className="text-sm text-yellow-300 font-medium">Meets Criteria</div>
          </div>
          <div className="text-center p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <div className="text-2xl font-bold text-red-400">{summary?.failed || 0}</div>
            <div className="text-sm text-red-300 font-medium">Failed</div>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-semibold text-white">
            Companies Meeting Criteria ({successfulResults.length})
          </h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>

        {successfulResults.length === 0 ? (
          <div className="text-center py-8">
            <XCircle className="w-12 h-12 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">No companies met your filter criteria.</p>
            <p className="text-sm text-gray-500 mt-2">
              Try adjusting your filters and running the lookup again.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {successfulResults.slice(0, showDetails ? undefined : 5).map((item, index) => {
              const company = item.company;
              return (
                <div key={index} className="border border-gray-700 rounded-lg p-4 bg-gray-800/50 hover:bg-gray-800/70 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Building className="w-5 h-5 text-blue-400" />
                        <h5 className="font-semibold text-white">{company.name}</h5>
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      </div>
                      
                      {company.website && (
                        <div className="flex items-center space-x-2 mb-2">
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                          <a 
                            href={company.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-sm"
                          >
                            {company.website}
                          </a>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-300">
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>{formatEmployees(company)} employees</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span>{formatRevenue(company)} revenue</span>
                        </div>
                        {company.foundedYear && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>Founded {company.foundedYear}</span>
                          </div>
                        )}
                      </div>

                      {company.industry && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/40 text-blue-300 border border-blue-800">
                            {company.industry}
                          </span>
                        </div>
                      )}

                      {showDetails && company.description && (
                        <p className="mt-3 text-sm text-gray-400 line-clamp-3">
                          {company.description}
                        </p>
                      )}
                    </div>

                    <div className="text-right ml-4">
                      <div className="text-xs text-gray-400">
                        {item.dataSource && (
                          <div className="mb-1">
                            Source: {item.dataSource}
                          </div>
                        )}
                        {item.processingTimeMs && (
                          <div>
                            {(item.processingTimeMs / 1000).toFixed(1)}s
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {!showDetails && successfulResults.length > 5 && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDetails(true)}
                >
                  Show {successfulResults.length - 5} more results
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}