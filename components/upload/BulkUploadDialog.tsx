"use client";

import React, { useState, useRef } from "react";
import { Upload, FileText, X, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { OptionalFilters } from "@/components/search/OptionalFilters";
import { parseCSV, parseExcel } from "@/lib/parsing/csv";
import { Filters } from "@/types/company";

interface BulkUploadDialogProps {
  onUpload: (names: string[], filters?: Filters) => void;
  hints?: Filters;
}

interface ParsedData {
  headers: string[];
  data: Record<string, any>[];
  fileName: string;
  sheets?: string[];
  currentSheet?: string;
}

export function BulkUploadDialog({ onUpload, hints }: BulkUploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [previewNames, setPreviewNames] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  
  // New states for chunking and offset
  const [uploadMode, setUploadMode] = useState<'all' | 'chunk' | 'custom'>('all');
  const [chunkSize, setChunkSize] = useState<number>(10);
  const [offset, setOffset] = useState<number>(0);
  const [customStart, setCustomStart] = useState<number>(1);
  const [customEnd, setCustomEnd] = useState<number>(10);
  
  // Filters state
  const [filters, setFilters] = useState<Filters>(hints || {});
  const [showFilters, setShowFilters] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chunkSizeOptions = [10, 20, 60, 80, 100, 200];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCurrentFile(file);

    try {
      let result;
      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith('.csv')) {
        result = await parseCSV(file);
        setParsedData({
          headers: result.headers,
          data: result.data,
          fileName: file.name,
        });
        
        // Auto-select likely company name column for CSV
        autoSelectColumn(result.headers, result.data);
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const excelResult = await parseExcel(file);
        setParsedData({
          headers: excelResult.headers,
          data: excelResult.data,
          fileName: file.name,
          sheets: excelResult.sheets,
          currentSheet: excelResult.currentSheet,
        });
        
        // Set selected sheet to the current sheet
        setSelectedSheet(excelResult.currentSheet);
        
        // Auto-select likely company name column for Excel
        autoSelectColumn(excelResult.headers, excelResult.data);
      } else {
        throw new Error('Unsupported file format. Please use CSV or Excel files.');
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      alert(error instanceof Error ? error.message : 'Failed to parse file');
    }
  };

  const autoSelectColumn = (headers: string[], data: Record<string, any>[]) => {
    const nameColumn = headers.find((header: string) => 
      header.toLowerCase().includes('company') || 
      header.toLowerCase().includes('name') || 
      header.toLowerCase().includes('organization')
    );
    
    if (nameColumn) {
      setSelectedColumn(nameColumn);
      updatePreview(data, nameColumn);
    }
  };

  const handleSheetChange = async (sheetName: string) => {
    if (!currentFile) return;
    
    setSelectedSheet(sheetName);
    setSelectedColumn("");
    setPreviewNames([]);
    setTotalCount(0);
    
    try {
      const excelResult = await parseExcel(currentFile, sheetName);
      setParsedData({
        headers: excelResult.headers,
        data: excelResult.data,
        fileName: currentFile.name,
        sheets: excelResult.sheets,
        currentSheet: excelResult.currentSheet,
      });
      
      // Auto-select likely company name column for the new sheet
      autoSelectColumn(excelResult.headers, excelResult.data);
    } catch (error) {
      console.error('Error parsing sheet:', error);
      alert(error instanceof Error ? error.message : 'Failed to parse selected sheet');
    }
  };

  const updatePreview = (data: Record<string, any>[], columnName: string) => {
    const allNames = data
      .map(row => row[columnName])
      .filter(name => typeof name === 'string' && name.trim().length > 0);
    
    const previewItems = allNames.slice(0, 10); // Show first 10 for preview
    
    setPreviewNames(previewItems);
    setTotalCount(allNames.length);
  };

  const handleColumnChange = (columnName: string) => {
    setSelectedColumn(columnName);
    if (parsedData) {
      updatePreview(parsedData.data, columnName);
    }
  };

  const handleUpload = () => {
    if (!parsedData || !selectedColumn) return;

    const allNames = parsedData.data
      .map(row => row[selectedColumn])
      .filter(name => typeof name === 'string' && name.trim().length > 0);

    if (allNames.length === 0) {
      alert('No valid company names found in selected column');
      return;
    }

    let namesToSend: string[] = [];
    
    switch (uploadMode) {
      case 'all':
        namesToSend = allNames;
        break;
        
      case 'chunk':
        const startIndex = offset;
        const endIndex = Math.min(startIndex + chunkSize, allNames.length);
        namesToSend = allNames.slice(startIndex, endIndex);
        break;
        
      case 'custom':
        const customStartIndex = Math.max(0, customStart - 1); // Convert to 0-based index
        const customEndIndex = Math.min(customEnd, allNames.length); // Include the end index
        
        if (customStartIndex >= customEndIndex) {
          alert('Invalid range: Start index must be less than end index');
          return;
        }
        
        if (customEndIndex - customStartIndex > 200) {
          alert('Maximum range is 200 records');
          return;
        }
        
        namesToSend = allNames.slice(customStartIndex, customEndIndex);
        break;
    }

    if (namesToSend.length === 0) {
      alert('No companies in the selected range');
      return;
    }
    onUpload(namesToSend, filters);
    setIsOpen(false);
    resetState();
  };

  const resetState = () => {
    setParsedData(null);
    setSelectedSheet("");
    setSelectedColumn("");
    setPreviewNames([]);
    setTotalCount(0);
    setCurrentFile(null);
    setUploadMode('all');
    setChunkSize(10);
    setOffset(0);
    setCustomStart(1);
    setCustomEnd(10);
    setFilters(hints || {});
    setShowFilters(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Bulk Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Company Upload</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file containing company names for batch processing with optional filters.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Optional Filters Section */}
          <div className="border border-gray-700 rounded-lg">
            <div className="p-4 border-b border-gray-700 bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Settings className="w-4 h-4 text-blue-400" />
                  <h3 className="font-medium text-white">Optional Filters</h3>
                  <span className="text-xs text-gray-400">
                    (Applied to all uploaded companies)
                  </span>
                  {Object.keys(filters).some(key => filters[key as keyof Filters]) && (
                    <span className="px-2 py-1 bg-blue-900/40 text-blue-300 text-xs rounded-full border border-blue-700">
                      {Object.keys(filters).filter(key => filters[key as keyof Filters]).length} active
                    </span>
                  )}
                </div>
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="ghost"
                  size="sm"
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                >
                  {showFilters ? 'Hide' : 'Show'} Filters
                </Button>
              </div>
            </div>
            {showFilters && (
              <div className="p-4">
                <OptionalFilters 
                  hints={filters}
                  onHintsChange={setFilters}
                />
              </div>
            )}
          </div>

          {!parsedData ? (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Select a CSV or Excel file containing company names
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                >
                  Choose File
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm font-medium">{parsedData.fileName}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      resetState();
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Sheet selection dropdown for Excel files */}
                {parsedData.sheets && parsedData.sheets.length > 1 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Sheet</label>
                    <Select value={selectedSheet} onValueChange={handleSheetChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose sheet" />
                      </SelectTrigger>
                      <SelectContent>
                        {parsedData.sheets.map((sheet) => (
                          <SelectItem key={sheet} value={sheet}>
                            {sheet}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Column with Company Names</label>
                  <Select value={selectedColumn} onValueChange={handleColumnChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose column" />
                    </SelectTrigger>
                    <SelectContent>
                      {parsedData.headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {previewNames.length > 0 && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Preview ({totalCount} companies total)
                      </label>
                      <div className="max-h-32 overflow-y-auto border rounded-md p-3 bg-muted/50">
                        {previewNames.map((name, index) => (
                          <div key={index} className="text-sm py-1">
                            {name}
                          </div>
                        ))}
                        {totalCount > 10 && (
                          <div className="text-sm py-1 text-muted-foreground italic">
                            ... and {totalCount - 10} more companies
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Upload Options */}
                    <div className="space-y-4 border-t pt-4">
                      <div className="flex items-center space-x-2">
                        <Settings className="w-4 h-4 text-gray-500" />
                        <label className="text-sm font-medium">Upload Options</label>
                      </div>
                      
                      {/* Upload Mode Selection */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-600">Processing Mode</label>
                        <Select value={uploadMode} onValueChange={(value: 'all' | 'chunk' | 'custom') => setUploadMode(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Process All Records ({totalCount} companies)</SelectItem>
                            <SelectItem value="chunk">Process in Chunks</SelectItem>
                            <SelectItem value="custom">Custom Range</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Chunk Mode Controls */}
                      {uploadMode === 'chunk' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-600">Chunk Size</label>
                            <Select value={chunkSize.toString()} onValueChange={(value) => setChunkSize(Number(value))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {chunkSizeOptions.map((size) => (
                                  <SelectItem key={size} value={size.toString()}>
                                    {size} records
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-600">Start Offset</label>
                            <Input
                              type="number"
                              min="0"
                              max={Math.max(0, totalCount - 1)}
                              value={offset}
                              onChange={(e) => setOffset(Math.max(0, Number(e.target.value)))}
                              placeholder="0"
                              className="h-8"
                            />
                          </div>
                          <div className="col-span-2 text-xs text-gray-500">
                            Will process records {offset + 1} to {Math.min(offset + chunkSize, totalCount)} 
                            ({Math.min(chunkSize, Math.max(0, totalCount - offset))} companies)
                          </div>
                        </div>
                      )}

                      {/* Custom Range Controls */}
                      {uploadMode === 'custom' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-600">Start Index</label>
                            <Input
                              type="number"
                              min="1"
                              max={totalCount}
                              value={customStart}
                              onChange={(e) => {
                                const value = Math.max(1, Math.min(Number(e.target.value), totalCount));
                                setCustomStart(value);
                                if (value > customEnd) {
                                  setCustomEnd(Math.min(value, totalCount));
                                }
                              }}
                              placeholder="1"
                              className="h-8"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-600">End Index</label>
                            <Input
                              type="number"
                              min={customStart}
                              max={Math.min(customStart + 199, totalCount)}
                              value={customEnd}
                              onChange={(e) => {
                                const value = Math.min(Number(e.target.value), Math.min(customStart + 199, totalCount));
                                setCustomEnd(Math.max(customStart, value));
                              }}
                              placeholder="10"
                              className="h-8"
                            />
                          </div>
                          <div className="col-span-2 text-xs text-gray-500">
                            Will process records {customStart} to {customEnd} 
                            ({customEnd - customStart + 1} companies, max 200)
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload}
            disabled={!parsedData || !selectedColumn || totalCount === 0}
          >
            Upload {
              uploadMode === 'all' ? totalCount :
              uploadMode === 'chunk' ? Math.min(chunkSize, Math.max(0, totalCount - offset)) :
              Math.max(0, customEnd - customStart + 1)
            } Companies
            {Object.keys(filters).some(key => filters[key as keyof Filters]) && (
              <span className="ml-1 text-xs opacity-75">(with filters)</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}