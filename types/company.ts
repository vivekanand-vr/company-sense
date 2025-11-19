// Simplified types without complex validation - handle nulls as empty strings

// Basic filter types
export interface Filters {
  turnover?: string;
  turnoverCustom?: number;
  headcount?: string;
  headcountCustom?: number;
  type?: string;
  typeCustom?: string;
  location?: string;
  keywords?: string[];
}

// Company data interface matching the actual backend structure
export interface CompanyData {
  id?: string;
  name: string;
  domain?: string;
  website?: string;
  description?: string;
  apolloId?: string;
  industry?: string;
  keywords?: string[];
  employees?: number;
  employeeCount?: number;
  revenue?: number;
  annualRevenue?: number;
  annualRevenueFormatted?: string;
  totalFunding?: number;
  latestFundingStage?: string;
  foundedYear?: number;
  publiclyTraded?: boolean;
  stockSymbol?: string;
  stockExchange?: string;
  phone?: string;
  address?: string | {
    full?: string;
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  linkedinUrl?: string;
  twitterUrl?: string;
  facebookUrl?: string;
  socialMedia?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    blog?: string;
  };
  technologies?: string[];
  logoUrl?: string;
  googleSearchData?: {
    url?: string;
    domain?: string;
  };
  apolloSource?: boolean;
  chatgptSource?: boolean;
  combinedSource?: boolean;
  enrichmentScore?: number;
  dataSource?: string;
  lastUpdated?: string;
  lastEnriched?: string;
  isVerified?: boolean;
  // Any other fields the backend might send
  [key: string]: any;
}

export interface LookupResponse {
  success: boolean;
  data: {
    company: CompanyData;
    meetsFilterCriteria?: boolean;
    filterAnalysis?: any;
  };
  processingTimeMs?: number;
  message?: string;
}

export interface BulkResponse {
  success: boolean;
  data: {
    results?: Array<{
      company: CompanyData;
      meetsFilterCriteria?: boolean;
      filterAnalysis?: any;
      processingTimeMs?: number;
      dataSource?: string;
    }>;
    summary?: {
      total: number;
      successful: number;
      failed: number;
      meetsFilterCriteria?: number;
      returnedResults?: number;
    };
    appliedFilters?: any;
    // Fallback for old format
    companies?: CompanyData[];
    processed?: number;
    failed?: number;
    processingTimeMs?: number;
  };
  processingTimeMs?: number;
  message?: string;
}

// Request types
export interface LookupRequest {
  companyName: string;
  filters?: Filters;
}

export interface BulkRequest {
  companies: string[];
  filters?: Filters;
}

// Legacy types for backward compatibility (converted from new structure)
export type Contact = {
  phone?: string;
  email?: string;
  address?: string;
};

export type Turnover = {
  amount?: number;
  currency?: string;
  period?: string;
  verbatim?: string;
  sourceUrl?: string;
};

export type Headcount = {
  count?: number;
  asOf?: string;
  sourceUrl?: string;
};

export type CompanyResultRow = {
  serial: number;
  name: string;
  officialUrl?: string;
  contact?: Contact;
  turnover?: Turnover;
  headcount?: Headcount;
  type?: string;
  summary?: string;
  evidenceUrls?: string[];
  confidence?: { 
    turnover?: number; 
    headcount?: number; 
    summary?: number; 
  };
  // Additional fields for enhanced display
  socialMedia?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    blog?: string;
  };
  technologies?: string[];
  foundedYear?: number;
  logoUrl?: string;
  addressObject?: {
    full?: string;
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
};

// Job-related types for bulk operations with real-time progress
export interface JobProgress {
  total: number;
  completed: number;
  successful: number;
  failed: number;
  current?: string;
}

export interface JobMessage {
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  companyName?: string;
  metadata?: Record<string, any>;
}

export interface Job {
  id: string;
  type: 'bulk_lookup';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: JobProgress;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: BulkResponse['data'];
  error?: string;
}

export interface JobResponse {
  success: boolean;
  data: {
    job: Job;
    messages?: {
      items: JobMessage[];
      hasMore: boolean;
      lastIndex: number;
    };
  };
  message?: string;
}

export interface JobStartResponse {
  success: boolean;
  message: string;
  data: {
    jobId: string;
    companiesCount: number;
    appliedFilters: Filters;
    statusEndpoint: string;
  };
}

export interface JobListResponse {
  success: boolean;
  data: {
    jobs: Job[];
    statistics: {
      total: number;
      running: number;
      completed: number;
      failed: number;
      pending: number;
    };
  };
}

export interface MessagesResponse {
  success: boolean;
  data: {
    messages: JobMessage[];
    hasMore: boolean;
    lastIndex: number;
  };
}

// Legacy type aliases for backward compatibility
export type Hints = Filters;