import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  DATABASE_URL: z.string().url(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  RATE_LIMIT_WINDOW_MS: z.string().default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('60'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  
  // OpenAI API configuration
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  
  // Google Programmable Search Engine API
  GOOGLE_API_KEY: z.string().min(1, 'Google API key is required'),
  GOOGLE_SEARCH_ENGINE_ID: z.string().min(1, 'Google Search Engine ID is required'),
  
  // Apollo.io API key for organization enrichment
  APOLLO_API_KEY: z.string().min(1, 'Apollo.io API key is required'),
});

const parseResult = EnvSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Invalid environment variables:', parseResult.error.format());
  process.exit(1);
}

export const env = parseResult.data;

export const config = {
  port: parseInt(env.PORT, 10),
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  database: {
    url: env.DATABASE_URL,
  },
  logging: {
    level: env.LOG_LEVEL,
  },
  rateLimit: {
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10),
    max: parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10),
  },
  cors: {
    origin: env.CORS_ORIGIN,
  },
  google: {
    apiKey: env.GOOGLE_API_KEY,
    searchEngineId: env.GOOGLE_SEARCH_ENGINE_ID,
  },
  apollo: {
    apiKey: env.APOLLO_API_KEY,
  },
  openai: {
    apiKey: env.OPENAI_API_KEY,
  },
} as const;