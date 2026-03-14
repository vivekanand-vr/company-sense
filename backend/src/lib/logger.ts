import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { config } from './config';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create different log files for different purposes
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Main application logger
export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports: [
    // Console logging for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
        })
      ),
    }),
    // General application logs
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Google Search specific logger
export const googleSearchLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'google-search.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
  ],
});

// Apollo API specific logger
export const apolloLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'apollo-api.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
  ],
});

// ChatGPT API specific logger
export const chatgptLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'chatgpt.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
  ],
});

// Company processing pipeline logger
export const pipelineLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'pipeline.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
  ],
});

// Export convenience functions
export const logGoogleSearch = (companyName: string, results: any[], searchTime: number) => {
  googleSearchLogger.info('Google Search completed', {
    companyName,
    resultsCount: results.length,
    searchTimeMs: searchTime,
    results: results.map(r => ({
      title: r.title,
      link: r.link,
      snippet: r.snippet,
      domain: r.link ? new URL(r.link).hostname.replace(/^www\./, '') : 'unknown'
    })),
    topResult: results.length > 0 ? {
      title: results[0].title,
      domain: results[0].link ? new URL(results[0].link).hostname.replace(/^www\./, '') : 'unknown',
      url: results[0].link
    } : null,
    timestamp: new Date().toISOString()
  });
};

export const logApolloRequest = (domain: string, success: boolean, data?: any, error?: any) => {
  apolloLogger.info('Apollo API request', {
    domain,
    success,
    hasData: !!data,
    dataFields: data?.organization ? Object.keys(data.organization) : [],
    organizationData: success && data?.organization ? {
      id: data.organization.id,
      name: data.organization.name,
      website_url: data.organization.website_url,
      primary_domain: data.organization.primary_domain,
      industry: data.organization.industry,
      estimated_num_employees: data.organization.estimated_num_employees,
      annual_revenue: data.organization.annual_revenue,
      annual_revenue_printed: data.organization.annual_revenue_printed,
      founded_year: data.organization.founded_year,
      city: data.organization.city,
      state: data.organization.state,
      country: data.organization.country,
      technologies: data.organization.technology_names?.slice(0, 10), // First 10 techs
      keywords: data.organization.keywords?.slice(0, 10) // First 10 keywords
    } : null,
    fullResponseData: success ? data : null, // Complete response for debugging
    error: error?.message,
    errorStatus: error?.status,
    timestamp: new Date().toISOString()
  });
};

export const logChatGPTRequest = (purpose: string, inputData: any, success: boolean, response?: any, error?: any) => {
  chatgptLogger.info('ChatGPT request', {
    purpose,
    inputDataKeys: Object.keys(inputData),
    inputSample: {
      companyName: inputData.companyName,
      requestType: inputData.requestType,
      missingFieldsCount: inputData.missingFields?.length || 0,
      apolloDataPresent: !!inputData.apolloData
    },
    success,
    responseLength: response ? JSON.stringify(response).length : 0,
    responseKeys: response && typeof response === 'object' ? Object.keys(response) : [],
    responseData: success ? response : null, // Include full response for debugging
    error: error?.message,
    timestamp: new Date().toISOString()
  });
};

export const logPipelineStep = (step: string, companyName: string, status: 'started' | 'completed' | 'failed', data?: any) => {
  pipelineLogger.info(`Pipeline step: ${step}`, {
    step,
    companyName,
    status,
    data,
    timestamp: new Date().toISOString()
  });
};

export default logger;