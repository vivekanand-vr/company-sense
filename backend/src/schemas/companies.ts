import { z } from 'zod';

// Hints schema for both single and bulk requests
const hintsSchema = z.object({
  turnover: z.enum([
    '1-10',
    '10-50', 
    '50-100',
    '100-500',
    '500-1000',
    '1000-5000',
    '5000+',
    'custom'
  ]).optional(),
  turnoverCustom: z.number().positive().optional(),
  headcount: z.enum([
    '1-10',
    '11-50',
    '51-100', 
    '101-250',
    '251-500',
    '501-1000',
    '1001-5000',
    '5001-10000',
    '10000+',
    'custom'
  ]).optional(),
  headcountCustom: z.number().int().positive().optional(),
  type: z.enum([
    'ecommerce',
    'education', 
    'health',
    'fintech',
    'saas',
    'manufacturing',
    'other'
  ]).optional(),
  typeCustom: z.string().max(100, 'Custom type too long').optional(),
}).optional();

// Company lookup request schema
export const lookupSchema = z.object({
  name: z.string().min(2, 'Company name is required').max(255, 'Company name too long'),
  hints: hintsSchema,
});

// Bulk request schema
export const bulkSchema = z.object({
  names: z.array(
    z.string().min(1, 'Company name cannot be empty').max(255, 'Company name too long')
  ).min(1, 'At least one company name is required').max(100, 'Maximum 100 companies per bulk request'),
  hints: hintsSchema,
});

// Bulk selected operations schema (for export/delete)
export const bulkSelectedSchema = z.object({
  companyIds: z.array(
    z.string().min(1, 'Company ID cannot be empty')
  ).min(1, 'At least one company ID is required').max(500, 'Maximum 500 companies per bulk operation'),
});

// Type inference for request bodies
export type LookupRequest = z.infer<typeof lookupSchema>;
export type BulkRequest = z.infer<typeof bulkSchema>;

// Response schemas
export const lookupResponseSchema = z.object({
  jobId: z.string(),
});

export const bulkResponseSchema = z.object({
  jobId: z.string(),
  accepted: z.number(),
});

export type LookupResponse = z.infer<typeof lookupResponseSchema>;
export type BulkResponse = z.infer<typeof bulkResponseSchema>;