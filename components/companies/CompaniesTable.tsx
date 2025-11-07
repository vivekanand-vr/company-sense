"use client";

import React, { useState } from "react";
import { ExternalLink, Building2, Users, DollarSign, Calendar, Award, ChevronLeft, ChevronRight, Globe, Linkedin, Twitter, Facebook, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CompanyData } from "@/types/company";

interface CompaniesTableProps {
  companies: CompanyData[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

function formatRevenue(revenue?: number, formatted?: string): string {
  if (formatted) return formatted;
  if (!revenue) return "-";
  
  if (revenue >= 1000000000) {
    return `$${(revenue / 1000000000).toFixed(1)}B`;
  } else if (revenue >= 1000000) {
    return `$${(revenue / 1000000).toFixed(1)}M`;
  } else if (revenue >= 1000) {
    return `$${(revenue / 1000).toFixed(1)}K`;
  }
  return `$${revenue.toLocaleString()}`;
}

function formatEmployees(count?: number): string {
  if (!count) return "-";
  return count.toLocaleString();
}

function formatDate(dateString?: string): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString();
}

function getCountryFromAddress(address?: any): string {
  if (!address) return "-";
  if (typeof address === 'string') return address;
  return address.country || "-";
}

function SocialMediaIcons({ socialMedia }: { socialMedia?: any }) {
  if (!socialMedia) return null;

  return (
    <div className="flex items-center space-x-2">
      {socialMedia.linkedin && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-blue-900/20"
          onClick={() => window.open(socialMedia.linkedin, '_blank')}
        >
          <Linkedin className="w-3 h-3 text-blue-400" />
        </Button>
      )}
      {socialMedia.twitter && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-blue-900/20"
          onClick={() => window.open(socialMedia.twitter, '_blank')}
        >
          <Twitter className="w-3 h-3 text-blue-400" />
        </Button>
      )}
      {socialMedia.facebook && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-blue-900/20"
          onClick={() => window.open(socialMedia.facebook, '_blank')}
        >
          <Facebook className="w-3 h-3 text-blue-400" />
        </Button>
      )}
    </div>
  );
}

export function CompaniesTable({ companies, pagination, onPageChange, isLoading }: CompaniesTableProps) {
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDescriptionClick = (company: CompanyData) => {
    setSelectedCompany(company);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-8 text-center">
          <div className="inline-flex items-center space-x-2 text-blue-400">
            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading companies...</span>
          </div>
        </div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="text-center py-12 text-gray-400">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-lg">No companies found</p>
          <p className="text-sm">Try adjusting your search criteria or filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-800 hover:bg-gray-800/50">
              <TableHead className="text-gray-300 font-semibold">Company</TableHead>
              <TableHead className="text-gray-300 font-semibold">Industry</TableHead>
              <TableHead className="text-gray-300 font-semibold">Employees</TableHead>
              <TableHead className="text-gray-300 font-semibold">Revenue</TableHead>
              <TableHead className="text-gray-300 font-semibold">Country</TableHead>
              <TableHead className="text-gray-300 font-semibold">Founded</TableHead>
              <TableHead className="text-gray-300 font-semibold">Quality</TableHead>
              <TableHead className="text-gray-300 font-semibold">Description</TableHead>
              <TableHead className="text-gray-300 font-semibold">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company, index) => (
              <TableRow 
                key={company.id || index}
                className="border-gray-800 hover:bg-gray-800/30 transition-colors"
              >
                <TableCell className="align-top">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {company.logoUrl && (
                        <img 
                          src={company.logoUrl} 
                          alt={`${company.name} logo`}
                          className="w-6 h-6 rounded object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <Building2 className="w-4 h-4 text-purple-400 shrink-0" />
                      <h3 className="font-semibold text-white text-sm leading-tight">
                        {company.name}
                      </h3>
                    </div>
                    {company.website && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                        onClick={() => window.open(company.website, '_blank')}
                      >
                        <Globe className="w-3 h-3 mr-1" />
                        {company.domain || new URL(company.website).hostname}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                    {company.publiclyTraded && company.stockSymbol && (
                      <div className="text-xs text-green-400 font-medium">
                        {company.stockSymbol} ({company.stockExchange?.toUpperCase()})
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell className="align-top">
                  <div className="text-sm text-gray-300 max-w-32 truncate" title={company.industry}>
                    {company.industry || "-"}
                  </div>
                </TableCell>
                
                <TableCell className="align-top">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="font-medium text-blue-300">
                      {formatEmployees(company.employeeCount || company.employees)}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell className="align-top">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="font-medium text-green-300">
                      {formatRevenue(company.annualRevenue || company.revenue, company.annualRevenueFormatted)}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell className="align-top">
                  <div className="text-sm text-gray-300">
                    {getCountryFromAddress(company.address)}
                  </div>
                </TableCell>
                
                <TableCell className="align-top">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-orange-400" />
                    <span className="text-sm text-orange-300">
                      {company.foundedYear || "-"}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell className="align-top text-center">
                  {company.enrichmentScore !== undefined ? (
                    <div className="flex items-center space-x-2">
                      <Award className={`w-4 h-4 ${
                        company.enrichmentScore >= 0.8 ? 'text-green-400' : 
                        company.enrichmentScore >= 0.6 ? 'text-yellow-400' : 'text-red-400'
                      }`} />
                      <span className={`font-medium ${
                        company.enrichmentScore >= 0.8 ? 'text-green-400' : 
                        company.enrichmentScore >= 0.6 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {Math.round(company.enrichmentScore * 100)}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </TableCell>
                
                <TableCell className="align-top text-center">
                  {company.description ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-gray-700/50 text-gray-400 hover:text-white"
                      onClick={() => handleDescriptionClick(company)}
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </TableCell>
                
                <TableCell className="align-top">
                  <div className="text-xs text-gray-400">
                    {formatDate(company.lastEnriched || company.lastUpdated)}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="border-t border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
            {pagination.totalCount.toLocaleString()} companies
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              variant="outline"
              size="sm"
              className="border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {/* Page numbers */}
              {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    variant={pagination.page === pageNum ? "default" : "outline"}
                    size="sm"
                    className={`w-8 h-8 p-0 ${
                      pagination.page === pageNum 
                        ? "bg-blue-600 text-white" 
                        : "border-gray-700 text-gray-300 hover:bg-gray-800"
                    }`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              variant="outline"
              size="sm"
              className="border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-50"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-purple-400" />
              <span>{selectedCompany?.name}</span>
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Company Summary
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {selectedCompany?.description || "No description available for this company."}
              </p>
            </div>
            {selectedCompany?.website && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-blue-400 hover:bg-blue-900/20 hover:border-blue-500"
                  onClick={() => window.open(selectedCompany.website, '_blank')}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Visit Website
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}