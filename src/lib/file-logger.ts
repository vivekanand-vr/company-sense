import fs from 'fs/promises';
import path from 'path';

export class FileLogger {
  private static instance: FileLogger;
  private logsDir: string;

  private constructor() {
    this.logsDir = path.join(process.cwd(), 'logs');
    this.ensureLogsDirectory();
  }

  static getInstance(): FileLogger {
    if (!FileLogger.instance) {
      FileLogger.instance = new FileLogger();
    }
    return FileLogger.instance;
  }

  private async ensureLogsDirectory(): Promise<void> {
    try {
      await fs.access(this.logsDir);
    } catch {
      await fs.mkdir(this.logsDir, { recursive: true });
    }
  }

  async logSearchResults(companyName: string, searchResults: any): Promise<void> {
    const timestamp = new Date().toISOString();
    const filename = `search-results-${timestamp.split('T')[0]}.log`;
    const logEntry = {
      timestamp,
      companyName,
      searchResults
    };

    try {
      await this.ensureLogsDirectory();
      const content = JSON.stringify(logEntry, null, 2) + '\n---\n';
      await fs.appendFile(path.join(this.logsDir, filename), content);
    } catch (error) {
      console.error('Failed to log search results to file:', error);
    }
  }

  async logScrapedPages(companyName: string, scrapedPages: any[]): Promise<void> {
    const timestamp = new Date().toISOString();
    const filename = `scraped-pages-${timestamp.split('T')[0]}.log`;
    
    const logEntry = {
      timestamp,
      companyName,
      pagesCount: scrapedPages?.length || 0,
      pages: scrapedPages?.map((page, index) => ({
        pageNumber: index + 1,
        title: page.title,
        url: page.url,
        contentLength: page.cleanText?.length || 0,
        preview: page.cleanText?.substring(0, 200) + '...' || 'No content'
      })) || []
    };

    try {
      await this.ensureLogsDirectory();
      const content = JSON.stringify(logEntry, null, 2) + '\n---\n';
      await fs.appendFile(path.join(this.logsDir, filename), content);
    } catch (error) {
      console.error('Failed to log scraped pages to file:', error);
    }
  }

  async logExtractionResults(companyName: string, extractedData: any): Promise<void> {
    const timestamp = new Date().toISOString();
    const filename = `extraction-results-${timestamp.split('T')[0]}.log`;
    
    const logEntry = {
      timestamp,
      companyName,
      extractedData
    };

    try {
      await this.ensureLogsDirectory();
      const content = JSON.stringify(logEntry, null, 2) + '\n---\n';
      await fs.appendFile(path.join(this.logsDir, filename), content);
    } catch (error) {
      console.error('Failed to log extraction results to file:', error);
    }
  }

  async logDatabaseStorage(companyName: string, success: boolean, error?: any): Promise<void> {
    const timestamp = new Date().toISOString();
    const filename = `database-storage-${timestamp.split('T')[0]}.log`;
    
    const logEntry = {
      timestamp,
      companyName,
      success,
      error: error ? (error instanceof Error ? error.message : error) : undefined
    };

    try {
      await this.ensureLogsDirectory();
      const content = JSON.stringify(logEntry, null, 2) + '\n---\n';
      await fs.appendFile(path.join(this.logsDir, filename), content);
    } catch (error) {
      console.error('Failed to log database storage to file:', error);
    }
  }
}

export const fileLogger = FileLogger.getInstance();