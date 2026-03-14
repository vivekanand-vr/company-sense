"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface CompaniesFiltersProps {
  filters: {
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
  };
  onFiltersChange: (filters: any) => void;
}

const industries = [
  "information technology & services",
  "computer software", 
  "internet",
  "financial services",
  "retail",
  "healthcare",
  "education",
  "manufacturing",
  "real estate",
  "consulting",
  "marketing & advertising",
  "telecommunications",
  "media & entertainment",
  "automotive",
  "aerospace & defense",
  "biotechnology",
  "energy",
  "logistics & supply chain",
  "food & beverages",
  "fashion & apparel"
];

const countries = [
  "United States",
  "India", 
  "United Kingdom",
  "Canada",
  "Germany",
  "France",
  "Australia",
  "Netherlands",
  "Singapore",
  "Japan",
  "China",
  "Brazil",
  "Mexico",
  "Spain",
  "Italy",
  "Sweden",
  "Norway",
  "Denmark",
  "Switzerland",
  "Israel"
];

export function CompaniesFilters({ filters, onFiltersChange }: CompaniesFiltersProps) {
  const updateFilter = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilter = (key: string) => {
    const newFilters = { ...filters } as any;
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({ sortBy: filters.sortBy, sortOrder: filters.sortOrder });
  };

  const hasActiveFilters = Object.keys(filters).some(key => 
    key !== 'sortBy' && key !== 'sortOrder' && (filters as any)[key] !== undefined
  );

  return (
    <div className="border-t border-gray-700 pt-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Advanced Filters</h3>
        {hasActiveFilters && (
          <Button
            onClick={clearAllFilters}
            variant="outline"
            size="sm"
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <X className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Industry Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Industry</label>
          <div className="relative">
            <Select 
              value={filters.industry || "all"} 
              onValueChange={(value) => updateFilter('industry', value === "all" ? undefined : value)}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 max-h-48 overflow-y-auto">
                <SelectItem value="all">All Industries</SelectItem>
                {industries.map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filters.industry && (
              <Button
                onClick={() => clearFilter('industry')}
                variant="ghost"
                size="sm"
                className="absolute right-8 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-700"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Country Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Country</label>
          <div className="relative">
            <Select 
              value={filters.country || "all"} 
              onValueChange={(value) => updateFilter('country', value === "all" ? undefined : value)}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 max-h-48 overflow-y-auto">
                <SelectItem value="all">All Countries</SelectItem>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filters.country && (
              <Button
                onClick={() => clearFilter('country')}
                variant="ghost"
                size="sm"
                className="absolute right-8 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-700"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Public Trading Status */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Public Trading</label>
          <Select 
            value={filters.publiclyTraded?.toString() || "any"} 
            onValueChange={(value) => updateFilter('publiclyTraded', value === "any" ? undefined : value === "true")}
          >
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="true">Public</SelectItem>
              <SelectItem value="false">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Employee Range */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Employees</label>
          <div className="flex space-x-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.minEmployees || ''}
              onChange={(e) => updateFilter('minEmployees', e.target.value ? parseInt(e.target.value) : undefined)}
              className="bg-gray-800 border-gray-700 text-white"
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.maxEmployees || ''}
              onChange={(e) => updateFilter('maxEmployees', e.target.value ? parseInt(e.target.value) : undefined)}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
        </div>

        {/* Revenue Range */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Revenue (USD)</label>
          <div className="flex space-x-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.minRevenue || ''}
              onChange={(e) => updateFilter('minRevenue', e.target.value ? parseInt(e.target.value) : undefined)}
              className="bg-gray-800 border-gray-700 text-white"
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.maxRevenue || ''}
              onChange={(e) => updateFilter('maxRevenue', e.target.value ? parseInt(e.target.value) : undefined)}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-sm text-gray-400 mb-2">Active Filters:</p>
          <div className="flex flex-wrap gap-2">
            {filters.industry && (
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg px-3 py-1 flex items-center space-x-2">
                <span className="text-sm text-blue-300">Industry: {filters.industry}</span>
                <Button
                  onClick={() => clearFilter('industry')}
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-blue-800"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
            {filters.country && (
              <div className="bg-green-900/30 border border-green-700 rounded-lg px-3 py-1 flex items-center space-x-2">
                <span className="text-sm text-green-300">Country: {filters.country}</span>
                <Button
                  onClick={() => clearFilter('country')}
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-green-800"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
            {filters.publiclyTraded !== undefined && (
              <div className="bg-purple-900/30 border border-purple-700 rounded-lg px-3 py-1 flex items-center space-x-2">
                <span className="text-sm text-purple-300">
                  {filters.publiclyTraded ? 'Public' : 'Private'} Companies
                </span>
                <Button
                  onClick={() => clearFilter('publiclyTraded')}
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-purple-800"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
            {(filters.minEmployees || filters.maxEmployees) && (
              <div className="bg-orange-900/30 border border-orange-700 rounded-lg px-3 py-1 flex items-center space-x-2">
                <span className="text-sm text-orange-300">
                  Employees: {filters.minEmployees || '0'} - {filters.maxEmployees || '∞'}
                </span>
                <Button
                  onClick={() => {
                    clearFilter('minEmployees');
                    clearFilter('maxEmployees');
                  }}
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-orange-800"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
            {(filters.minRevenue || filters.maxRevenue) && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg px-3 py-1 flex items-center space-x-2">
                <span className="text-sm text-red-300">
                  Revenue: ${filters.minRevenue?.toLocaleString() || '0'} - ${filters.maxRevenue?.toLocaleString() || '∞'}
                </span>
                <Button
                  onClick={() => {
                    clearFilter('minRevenue');
                    clearFilter('maxRevenue');
                  }}
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-red-800"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}