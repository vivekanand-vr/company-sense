"use client";

import React from "react";
import { ExternalLink, Phone, Mail, MapPin, Building2, DollarSign, Users, Globe, Briefcase, Award, TrendingUp, Download, Linkedin, Twitter, Facebook, Calendar } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CompanyResultRow } from "@/types/company";
import { exportResultsToExcel } from "@/lib/api";

interface ResultsTableProps {
  results: CompanyResultRow[];
  isLoading?: boolean;
}

function formatContact(contact?: { phone?: string; email?: string; address?: string }) {
  if (!contact) return "-";
  
  const items = [];
  if (contact.phone) {
    items.push(
      <div key="phone" className="flex items-center space-x-2 text-sm text-gray-300">
        <Phone className="w-4 h-4 text-blue-400" />
        <span>{contact.phone}</span>
      </div>
    );
  }
  if (contact.email) {
    items.push(
      <div key="email" className="flex items-center space-x-2 text-sm text-gray-300">
        <Mail className="w-4 h-4 text-green-400" />
        <span>{contact.email}</span>
      </div>
    );
  }
  if (contact.address) {
    items.push(
      <div key="address" className="flex items-start space-x-2 text-sm text-gray-300">
        <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
        <span className="line-clamp-2">{contact.address}</span>
      </div>
    );
  }
  
  return items.length > 0 ? (
    <div className="space-y-2">{items}</div>
  ) : (
    <span className="text-gray-500">-</span>
  );
}

function formatAddress(addressObj?: any, fallbackAddress?: string): string {
  if (!addressObj && !fallbackAddress) return "";
  
  if (typeof addressObj === 'string') return addressObj;
  
  if (addressObj && typeof addressObj === 'object') {
    const parts = [];
    if (addressObj.city) parts.push(addressObj.city);
    if (addressObj.state) parts.push(addressObj.state);
    if (addressObj.country) parts.push(addressObj.country);
    
    return parts.length > 0 ? parts.join(', ') : (addressObj.full || fallbackAddress || '');
  }
  
  return fallbackAddress || '';
}

function formatRevenue(turnover?: { amount?: number; verbatim?: string; currency?: string }) {
  if (!turnover) return "-";
  
  if (turnover.verbatim) {
    return (
      <div className="flex items-center space-x-2">
        <DollarSign className="w-4 h-4 text-green-400" />
        <span className="font-medium text-green-300">{turnover.verbatim}</span>
      </div>
    );
  }
  
  if (turnover.amount) {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: turnover.currency || 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(turnover.amount);
    
    return (
      <div className="flex items-center space-x-2">
        <DollarSign className="w-4 h-4 text-green-400" />
        <span className="font-medium text-green-300">{formatted}</span>
      </div>
    );
  }
  
  return <span className="text-gray-500">-</span>;
}

function formatEmployeeCount(headcount?: { count?: number }) {
  if (!headcount?.count) return "-";
  
  const formatted = new Intl.NumberFormat('en-US').format(headcount.count);
  
  return (
    <div className="flex items-center space-x-2">
      <Users className="w-4 h-4 text-blue-400" />
      <span className="font-medium text-blue-300">{formatted}</span>
    </div>
  );
}

function formatConfidenceScore(confidence?: { summary?: number }) {
  if (!confidence?.summary) return "-";
  
  const score = Math.round(confidence.summary * 100);
  const color = score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400';
  
  return (
    <div className="flex items-center space-x-2">
      <Award className={`w-4 h-4 ${color}`} />
      <span className={`font-medium ${color}`}>{score}%</span>
    </div>
  );
}

function renderSocialMediaIcons(socialMedia?: { linkedin?: string; twitter?: string; facebook?: string; blog?: string }) {
  if (!socialMedia) return <span className="text-gray-500">-</span>;
  
  const socialLinks = [];
  
  if (socialMedia.linkedin) {
    socialLinks.push(
      <a key="linkedin" href={socialMedia.linkedin} target="_blank" rel="noopener noreferrer" 
         className="text-blue-400 hover:text-blue-300 transition-colors">
        <Linkedin className="w-4 h-4" />
      </a>
    );
  }
  
  if (socialMedia.twitter) {
    socialLinks.push(
      <a key="twitter" href={socialMedia.twitter} target="_blank" rel="noopener noreferrer"
         className="text-blue-400 hover:text-blue-300 transition-colors">
        <Twitter className="w-4 h-4" />
      </a>
    );
  }
  
  if (socialMedia.facebook) {
    socialLinks.push(
      <a key="facebook" href={socialMedia.facebook} target="_blank" rel="noopener noreferrer"
         className="text-blue-600 hover:text-blue-500 transition-colors">
        <Facebook className="w-4 h-4" />
      </a>
    );
  }
  
  if (socialMedia.blog) {
    socialLinks.push(
      <a key="blog" href={socialMedia.blog} target="_blank" rel="noopener noreferrer"
         className="text-purple-400 hover:text-purple-300 transition-colors">
        <Globe className="w-4 h-4" />
      </a>
    );
  }
  
  return socialLinks.length > 0 ? (
    <div className="flex items-center space-x-3">
      {socialLinks}
    </div>
  ) : (
    <span className="text-gray-500">-</span>
  );
}

export function ResultsTable({ results, isLoading }: ResultsTableProps) {
  const handleExportExcel = () => {
    exportResultsToExcel(results, 'company-results');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-2 text-blue-400">
            <TrendingUp className="w-5 h-5 animate-pulse" />
            <span>Processing companies...</span>
          </div>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-600" />
        <p className="text-lg">No companies found</p>
        <p className="text-sm">Try adjusting your search criteria</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Export Header */}
      <div className="flex justify-between items-center">
        <div className="text-gray-300">
          <span className="text-lg font-semibold">{results.length}</span>
          <span className="text-gray-400 ml-2">
            {results.length === 1 ? 'company found' : 'companies found'}
          </span>
        </div>
        <Button
          onClick={handleExportExcel}
          className="bg-green-600 hover:bg-green-700 text-white"
          size="sm"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Excel
        </Button>
      </div>

      {/* Results Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-800 hover:bg-gray-800/50">
              <TableHead className="text-gray-300 font-semibold">Company</TableHead>
              <TableHead className="text-gray-300 font-semibold">Location & Contact</TableHead>
              <TableHead className="text-gray-300 font-semibold">Revenue & Employees</TableHead>
              <TableHead className="text-gray-300 font-semibold">Social Media</TableHead>
              <TableHead className="text-gray-300 font-semibold">Summary</TableHead>
              <TableHead className="text-gray-300 font-semibold text-center">Confidence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((company, index) => (
              <TableRow 
                key={index}
                className="border-gray-800 hover:bg-gray-800/30 transition-colors"
              >
                <TableCell className="align-top">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      {company.logoUrl && (
                        <img 
                          src={company.logoUrl} 
                          alt={`${company.name} logo`}
                          className="w-12 h-12 rounded-lg object-cover border border-gray-700"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Building2 className="w-5 h-5 text-purple-400 shrink-0" />
                          <h3 className="font-semibold text-white text-lg leading-tight">
                            {company.name}
                          </h3>
                        </div>
                        {company.foundedYear && (
                          <div className="flex items-center space-x-2 text-sm text-gray-400">
                            <Calendar className="w-4 h-4 text-orange-400" />
                            <span>Founded {company.foundedYear}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {company.type && (
                      <div className="flex items-center space-x-2">
                        <Briefcase className="w-4 h-4 text-purple-400" />
                        <span className="text-purple-300 font-medium text-sm">{company.type}</span>
                      </div>
                    )}
                    {company.officialUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                        onClick={() => window.open(company.officialUrl, '_blank')}
                      >
                        <Globe className="w-3 h-3 mr-1" />
                        Visit Website
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </TableCell>
                
                <TableCell className="align-top">
                  <div className="space-y-3">
                    {/* Location */}
                    {(company.addressObject || company.contact?.address) && (
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
                        <span className="text-gray-300 text-sm">
                          {formatAddress(company.addressObject, company.contact?.address)}
                        </span>
                      </div>
                    )}
                    
                    {/* Phone */}
                    {company.contact?.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-blue-400" />
                        <span className="text-gray-300 text-sm">{company.contact.phone}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell className="align-top">
                  <div className="space-y-3">
                    {formatRevenue(company.turnover)}
                    {formatEmployeeCount(company.headcount)}
                  </div>
                </TableCell>
                
                <TableCell className="align-top">
                  {renderSocialMediaIcons(company.socialMedia)}
                </TableCell>
                
                <TableCell className="align-top max-w-xs">
                  {company.summary ? (
                    <p className="text-gray-300 text-sm leading-relaxed line-clamp-4">
                      {company.summary}
                    </p>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </TableCell>
                
                <TableCell className="align-top text-center">
                  {formatConfidenceScore(company.confidence)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}