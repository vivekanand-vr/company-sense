import Papa from "papaparse";
import * as XLSX from "xlsx";

export interface ParseResult {
  headers: string[];
  data: Record<string, any>[];
  sheets?: string[]; // Available sheet names for Excel files
}

export interface ExcelParseResult extends ParseResult {
  sheets: string[];
  currentSheet: string;
}

export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(results.errors[0].message));
          return;
        }

        const headers = results.meta.fields || [];
        const data = results.data as Record<string, any>[];

        resolve({ headers, data });
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

export function parseExcel(file: File, sheetName?: string): Promise<ExcelParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        
        // Get all sheet names
        const sheets = workbook.SheetNames;
        console.log('Available sheets:', sheets);
        
        if (sheets.length === 0) {
          reject(new Error("No sheets found in the file"));
          return;
        }
        
        // Use specified sheet or default to first sheet
        const targetSheetName = sheetName || sheets[0];
        
        if (!sheets.includes(targetSheetName)) {
          reject(new Error(`Sheet "${targetSheetName}" not found. Available sheets: ${sheets.join(', ')}`));
          return;
        }
        
        const worksheet = workbook.Sheets[targetSheetName];
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: "",
          raw: false // This ensures we get string values
        }) as any[][];
        
        if (jsonData.length === 0) {
          reject(new Error(`Sheet "${targetSheetName}" is empty`));
          return;
        }
        
        // First row contains headers - clean them up
        const rawHeaders = jsonData[0];
        const headers = rawHeaders
          .map((header, index) => {
            // If header is empty or just whitespace, use column letter
            const cleanHeader = String(header || '').trim();
            return cleanHeader || `Column ${String.fromCharCode(65 + index)}`;
          })
          .filter(header => header); // Remove completely empty headers
        
        // Convert remaining rows to objects, skipping empty rows
        const dataRows = jsonData.slice(1)
          .filter(row => row && row.some(cell => cell && String(cell).trim())) // Skip empty rows
          .map(row => {
            const obj: Record<string, any> = {};
            headers.forEach((header, index) => {
              const cellValue = row[index];
              obj[header] = cellValue ? String(cellValue).trim() : "";
            });
            return obj;
          })
          .filter(row => Object.values(row).some(value => value && String(value).trim())); // Filter out rows with no data
        
        console.log('Parsed Excel data:', { 
          sheets, 
          currentSheet: targetSheetName, 
          headers, 
          rowCount: dataRows.length, 
          sampleRow: dataRows[0] 
        });
        
        resolve({ 
          headers, 
          data: dataRows, 
          sheets,
          currentSheet: targetSheetName 
        });
      } catch (error) {
        console.error('Excel parsing error:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
    
    reader.readAsArrayBuffer(file);
  });
}