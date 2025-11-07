import { PrismaClient } from '@prisma/client';
import { config } from './config';
import { databaseLogger } from './database-logger';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create a simple Prisma client without console logging
// We'll intercept queries using Prisma middleware instead
export const prisma = globalForPrisma.prisma ?? 
  new PrismaClient({
    // Disable console logging completely
    log: [],
  });

// Use Prisma middleware to log queries to files
prisma.$use(async (params, next) => {
  const start = Date.now();
  
  try {
    const result = await next(params);
    const duration = Date.now() - start;
    
    // Log the query with performance metrics
    databaseLogger.logQuery(
      `${params.action} ${params.model || 'unknown'}`,
      [JSON.stringify(params.args)],
      duration
    );
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    
    // Log the failed query
    databaseLogger.logError(error, {
      action: params.action,
      model: params.model,
      args: params.args,
      duration
    });
    
    throw error;
  }
});

// Log database connection info
databaseLogger.logInfo('Prisma client initialized', {
  environment: config.isDevelopment ? 'development' : config.isProduction ? 'production' : 'test',
  databaseUrl: config.database.url ? '[CONFIGURED]' : '[MISSING]'
});

if (!config.isProduction) globalForPrisma.prisma = prisma;