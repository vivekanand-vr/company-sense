# Company Intelligence API Guide - Google Search + Apollo.io + ChatGPT Edition

This guide demonstrates the revolutionary Company Intelligence API that combines **Google's Programmable Search Engine** with **Apollo.io API** and **ChatGPT AI enhancement** for the most comprehensive and accurate company research available.

## Revolutionary Architecture

The API uses intelligent automation and real APIs for unprecedented data accuracy:

### Automated Data Pipeline
1. **Google Search Intelligence** → Find official company websites using Google's Programmable Search Engine
2. **Apollo.io API Integration** → Get structured company data from Apollo's organization enrichment API  
3. **ChatGPT Enrichment** → AI fills gaps, adds context, and provides business intelligence
4. **Smart Storage & Export** → Save filtered results and export to Excel/CSV formats

### Key Innovations
- **Official Website Discovery**: Google's Programmable Search Engine finds verified company domains
- **Real Apollo.io API**: Direct API integration with Apollo.io's organization enrichment endpoint
- **AI Business Intelligence**: ChatGPT provides market insights and strategic analysis
- **Advanced Export**: Excel and CSV export with comprehensive data formatting
- **Complete Audit Trail**: Full logging of Google searches, Apollo requests, and ChatGPT interactions

## Data Sources Integration

### Google Programmable Search Engine (Primary Discovery)
- Finds official company websites with 95-98% accuracy
- Filters out social media and directory sites automatically
- Prioritizes authoritative company domains and about pages
- Handles company name variations and aliases intelligently

### Apollo.io API (Structured Data)
- 50+ structured company data fields with high accuracy
- Financial information, employee counts, contact details
- Industry classification and technology stack information
- Funding data, public trading status, and corporate structure
- Social media profiles and external links

### ChatGPT Enhancement (Business Intelligence)
- Professional business summaries and market analysis
- Business model identification and value proposition analysis
- Missing data completion and strategic insights
- Leadership information and competitive positioning
- Key products, services, and market context

## API Endpoints

## Authentication Endpoints

### Admin Login
**POST** `/api/auth/login`

Authenticate with admin credentials to receive a JWT token for API access.

**Request:**
```json
{
  "username": "admin",
  "password": "your-admin-password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "username": "admin",
      "role": "admin"
    }
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### Token Verification
**GET** `/api/auth/verify`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user": {
      "username": "admin",
      "role": "admin"
    },
    "expiresAt": "2025-11-08T12:00:00.000Z"
  }
}
```

### Current User Info
**GET** `/api/auth/me`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "username": "admin",
      "role": "admin"
    }
  }
}
```

### Token Refresh
**POST** `/api/auth/refresh`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "username": "admin",
      "role": "admin"
    }
  }
}
```

### Logout
**POST** `/api/auth/logout`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Complete API Specifications for Frontend Integration

### Authentication Guide for Frontend

**Environment Setup:**
1. Set up environment variables:
```bash
JWT_SECRET=your-very-strong-secret-key-here
JWT_EXPIRES_IN=24h
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password-here
```

**Frontend Authentication Flow:**

1. **Login Process:**
```javascript
// Login function
async function login(username, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Store token in localStorage/sessionStorage
    localStorage.setItem('authToken', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    return data;
  } else {
    throw new Error(data.message);
  }
}
```

2. **Making Authenticated API Calls:**
```javascript
// Function to make authenticated requests
async function authenticatedFetch(url, options = {}) {
  const token = localStorage.getItem('authToken');
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
}

// Example: Fetch companies with authentication
async function getCompanies() {
  const response = await authenticatedFetch('/api/companies');
  return response.json();
}
```

3. **Token Management:**
```javascript
// Check if token is valid
async function verifyToken() {
  try {
    const response = await authenticatedFetch('/api/auth/verify');
    const data = await response.json();
    return data.success;
  } catch {
    return false;
  }
}

// Refresh token if needed
async function refreshToken() {
  try {
    const response = await authenticatedFetch('/api/auth/refresh', {
      method: 'POST',
    });
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('authToken', data.data.token);
      return true;
    }
  } catch {
    // Token refresh failed, redirect to login
    logout();
    return false;
  }
}

// Logout function
function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  window.location.href = '/login';
}
```

4. **Automatic Token Handling:**
```javascript
// Axios interceptor example
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      const refreshed = await refreshToken();
      if (refreshed) {
        // Retry the original request
        return axios.request(error.config);
      } else {
        // Redirect to login
        logout();
      }
    }
    return Promise.reject(error);
  }
);
```

**Security Best Practices:**
- Always use HTTPS in production
- Store JWT tokens securely (consider httpOnly cookies for production)
- Implement token refresh logic to handle expiration
- Log out users when tokens become invalid
- Use strong, randomly generated JWT secrets
- Set appropriate token expiration times

### 1. Company Lookup API

**Endpoint:** `POST /api/companies/lookup`

**Description:** Complete company research using Google Search → Apollo API → ChatGPT pipeline with database-first optimization

**Request Payload:**
```json
{
  "name": "string (required) - Company name to lookup",
  "hints": {
    "turnover": "string (optional) - Revenue range filter",
    "headcount": "string (optional) - Employee count filter", 
    "type": "string (optional) - Industry type filter"
  }
}
```

**Response Payload:**
```json
{
  "success": "boolean - Request success status",
  "data": {
    "company": {
      "id": "string - UUID identifier",
      "name": "string - Official company name",
      "website": "string - Company website URL",
      "domain": "string - Primary domain",
      "industry": "string - Industry classification",
      "description": "string - Company description",
      "foundedYear": "number - Year company was founded",
      "employeeCount": "number - Current employee count",
      "annualRevenue": "number - Annual revenue in USD",
      "annualRevenueFormatted": "string - Human-readable revenue (e.g., '5.6B')",
      "phone": "string - Primary phone number",
      "address": {
        "street": "string - Street address",
        "city": "string - City",
        "state": "string - State/Province", 
        "country": "string - Country"
      },
      "socialMedia": {
        "linkedin": "string - LinkedIn profile URL",
        "twitter": "string - Twitter profile URL"
      },
      "businessModel": "string - Business model description",
      "keyProducts": ["array of strings - Main products/services"],
      "ceo": "string - CEO name",
      "publiclyTraded": "boolean - Public trading status",
      "stockSymbol": "string - Stock ticker symbol",
      "summary": "string - AI-generated company summary",
      "technologies": ["array of strings - Technologies used"],
      "apolloId": "string - Apollo.io identifier",
      "googleSearchData": {
        "url": "string - Found website URL",
        "domain": "string - Extracted domain"
      },
      "dataSource": "string - Source: 'google_apollo_chatgpt' or 'database_cache'",
      "apolloSource": "boolean - Data from Apollo.io",
      "chatgptSource": "boolean - Data enhanced by ChatGPT", 
      "enrichmentScore": "number - Data quality score (0-1)",
      "lastUpdated": "string - ISO timestamp"
    },
    "meetsFilterCriteria": "boolean - Company meets filter criteria",
    "filterAnalysis": {
      "turnover": {
        "expected": "string - Expected revenue range",
        "actual": "string - Actual revenue value",
        "matches": "boolean - Criteria match status"
      },
      "headcount": {
        "expected": "string - Expected employee range",
        "actual": "string - Actual employee count", 
        "matches": "boolean - Criteria match status"
      }
    }
  },
  "processingTimeMs": "number - Processing time in milliseconds"
}
```

### 2. Bulk Company Lookup API

**Endpoint:** `POST /api/companies/bulk-lookup`

**Description:** Process multiple companies in a single request (max 100 companies)

**Request Payload:**
```json
{
  "names": ["array of strings (required) - Company names to lookup (max 100)"],
  "hints": {
    "turnover": "string (optional) - Revenue range filter for all companies",
    "headcount": "string (optional) - Employee count filter for all companies",
    "type": "string (optional) - Industry filter for all companies"
  }
}
```

**Response Payload:**
```json
{
  "success": "boolean - Request success status",
  "data": {
    "results": [
      {
        "company": {
          /* Same company object structure as single lookup */
        },
        "meetsFilterCriteria": "boolean - Filter criteria match",
        "filterAnalysis": {
          /* Same filter analysis structure as single lookup */
        },
        "processingTimeMs": "number - Individual processing time",
        "dataSource": "string - Data source for this company"
      }
    ],
    "summary": {
      "total": "number - Total companies processed",
      "successful": "number - Successfully processed companies",
      "failed": "number - Failed to process companies",
      "meetsFilterCriteria": "number - Companies meeting filter criteria",
      "averageProcessingTime": "number - Average processing time",
      "totalProcessingTime": "number - Total processing time"
    }
  },
  "processingTimeMs": "number - Total request processing time"
}
```

### 3. Companies List API

**Endpoint:** `GET /api/companies`

**Description:** Retrieve companies from database with filtering, searching, and pagination

**Query Parameters:**
```javascript
{
  // Pagination
  page: "number (optional, default: 1) - Page number",
  limit: "number (optional, default: 20, max: 100) - Items per page",
  
  // Search
  search: "string (optional) - Search in name, domain, industry",
  
  // Filtering
  industry: "string (optional) - Filter by specific industry",
  minEmployees: "number (optional) - Minimum employee count",
  maxEmployees: "number (optional) - Maximum employee count",
  minRevenue: "number (optional) - Minimum revenue in USD", 
  maxRevenue: "number (optional) - Maximum revenue in USD",
  country: "string (optional) - Filter by country",
  publiclyTraded: "boolean (optional) - Public trading status",
  
  // Sorting
  sortBy: "string (optional) - Sort by: name, employees, revenue, foundedYear, lastUpdated, enrichmentScore",
  sortOrder: "string (optional) - Sort order: asc, desc"
}
```

**Response Payload:**
```json
{
  "success": "boolean - Request success status",
  "data": {
    "companies": [
      {
        "id": "string - Company UUID",
        "name": "string - Company name",
        "domain": "string - Primary domain",
        "industry": "string - Industry classification",
        "employeeCount": "number - Employee count",
        "annualRevenue": "number - Revenue in USD",
        "annualRevenueFormatted": "string - Formatted revenue",
        "foundedYear": "number - Year founded",
        "publiclyTraded": "boolean - Public trading status",
        "stockSymbol": "string - Stock symbol",
        "country": "string - Country location",
        "enrichmentScore": "number - Data quality score (0-1)",
        "lastUpdated": "string - ISO timestamp"
      }
    ],
    "pagination": {
      "page": "number - Current page number",
      "limit": "number - Items per page",
      "totalCount": "number - Total companies matching filters",
      "totalPages": "number - Total pages available",
      "hasNext": "boolean - Has next page",
      "hasPrev": "boolean - Has previous page"
    },
    "filters": {
      "applied": {
        /* Object containing all applied filters */
      },
      "resultCount": "number - Number of filtered results"
    }
  },
  "processingTimeMs": "number - Processing time"
}
```

### 4. Export APIs

**Excel Export:** `GET /api/companies/export/excel`
**CSV Export:** `GET /api/companies/export/csv` 
**All Companies Excel:** `GET /api/companies/export/all/excel`

**Query Parameters:** Same as Companies List API for filtering

**Response Headers:**
- `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (Excel)
- `Content-Type: text/csv` (CSV)
- `Content-Disposition: attachment; filename="companies-export.xlsx"`

**Response:** Binary file download

### 5. Health Check API

**Endpoint:** `GET /health`

**Description:** System health and status check

**Response Payload:**
```json
{
  "status": "string - Overall status: healthy/unhealthy",
  "timestamp": "string - ISO timestamp",
  "uptime": "number - Server uptime in seconds",
  "version": "string - API version",
  "database": {
    "status": "string - Database status: connected/disconnected",
    "totalCompanies": "number - Total companies in database"
  },
  "externalServices": {
    "apollo": "string - Apollo.io API status",
    "openai": "string - OpenAI API status",
    "google": "string - Google Search API status"
  }
}
```

### Error Response Format

All endpoints return errors in this consistent format:

```json
{
  "success": false,
  "error": {
    "code": "string - Error code identifier",
    "message": "string - Human-readable error message",
    "details": "string (optional) - Additional error details"
  },
  "timestamp": "string - ISO timestamp"
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Invalid request parameters
- `COMPANY_NOT_FOUND` - Company not found in any data source
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `EXTERNAL_API_ERROR` - Error from external APIs
- `DATABASE_ERROR` - Database connection or query error
- `INTERNAL_SERVER_ERROR` - Unexpected server error

## Legacy API Documentation

### 1. Original Company Lookup

**Endpoint:** `POST /api/companies/lookup`

**Description:** Complete company research using Google Search → Apollo API → ChatGPT pipeline

```bash
curl -X POST "http://localhost:8000/api/companies/lookup" \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Shopify Inc",
    "filters": {
      "turnover": "1000-5000",
      "headcount": "1001-5000",
      "type": "technology"
    }
  }'
```

**Request Body:**
```json
{
  "companyName": "string (required)",
  "filters": {
    "turnover": "string (optional) - Revenue range",
    "turnoverCustom": "number (optional) - Custom minimum revenue in millions USD",
    "headcount": "string (optional) - Employee count range", 
    "headcountCustom": "number (optional) - Custom minimum employee count",
    "type": "string (optional) - Industry type",
    "typeCustom": "string (optional) - Custom industry description",
    "location": "string (optional) - Geographic location",
    "keywords": ["string"] (optional) - Additional search keywords"
  }
}
```

**Complete Response:**
```json
{
  "success": true,
  "data": {
    "company": {
      "id": "company_id_here",
      "name": "Shopify Inc.",
      "domain": "shopify.com",
      "website": "https://www.shopify.com",
      "description": "Leading e-commerce platform enabling businesses worldwide...",
      
      // Basic Information
      "industry": "Technology",
      "foundedYear": 2006,
      "employeeCount": 12000,
      "employeeRange": "10000+",
      
      // Financial Data (from Apollo)
      "annualRevenue": 5610000000,
      "annualRevenueFormatted": "5.6B",
      "totalFunding": 251200000,
      "totalFundingFormatted": "251.2M",
      "latestFundingStage": "Series D",
      "latestFundingDate": "2023-08-01T00:00:00.000Z",
      
      // Contact Information
      "phone": "+1-800-746-7439",
      "email": "support@shopify.com",
      "address": {
        "street": "150 Elgin Street",
        "city": "Ottawa",
        "state": "Ontario", 
        "country": "Canada",
        "postalCode": "K2P 1L4"
      },
      
      // Social Media & External Links
      "socialMedia": {
        "linkedin": "https://linkedin.com/company/shopify",
        "twitter": "https://twitter.com/shopify",
        "facebook": "https://facebook.com/shopify"
      },
      
      // Enhanced Information (ChatGPT)
      "summary": "Shopify Inc. is a leading multinational e-commerce platform...",
      "businessModel": "SaaS platform providing comprehensive e-commerce solutions",
      "keyProducts": [
        "Shopify Platform",
        "Shopify Plus", 
        "Shopify POS",
        "Shop Pay"
      ],
      "ceo": "Tobias Lütke",
      "marketPosition": "Market leader in e-commerce platform solutions",
      "competitiveAdvantage": "Comprehensive ecosystem with integrated payments...",
      
      // Public Company Information
      "publiclyTraded": true,
      "stockSymbol": "SHOP",
      "stockExchange": "NYSE",
      
      // Technology Stack
      "technologies": [
        "React", "Ruby", "GraphQL", "Kubernetes", "Docker"
      ],
      
      // Company Structure
      "parentCompany": null,
      "subsidiaries": [
        "6 River Systems",
        "Deliverr", 
        "Shopify Logistics"
      ],
      
      // Data Source Tracking
      "googleSearchData": {
        "url": "https://www.shopify.com",
        "domain": "shopify.com"
      },
      "apolloId": "5e66b6381e05b4008c8331b8",
      "dataSource": "google_apollo_chatgpt",
      "apolloSource": true,
      "chatgptSource": true,
      "enrichmentScore": 0.92,
      "lastEnriched": "2024-11-05T11:39:25.000Z"
    },
    "meetsFilterCriteria": true,
    "filterAnalysis": {
      "turnover": {
        "expected": "1000-5000",
        "actual": "1000-5000", 
        "matches": true
      },
      "headcount": {
        "expected": "1001-5000",
        "actual": "10000+",
        "matches": true
      },
      "type": {
        "expected": "technology",
        "actual": "Technology",
        "matches": true
      }
    }
  },
  "processingTimeMs": 8420
}
```

### 2. Bulk Company Research

**Endpoint:** `POST /api/companies/bulk-lookup`

**Description:** Process multiple companies with filtering in a single request

```bash
curl -X POST "http://localhost:8000/api/companies/bulk-lookup" \
  -H "Content-Type: application/json" \
  -d '{
    "companies": ["Shopify", "Stripe", "Square"],
    "filters": {
      "turnover": "100-500",
      "type": "fintech"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "company": { /* Complete company data */ },
        "meetsFilterCriteria": true,
        "filterAnalysis": { /* Filter matching details */ },
        "processingTimeMs": 8420,
        "dataSource": "google_apollo_chatgpt"
      }
    ],
    "summary": {
      "total": 3,
      "successful": 3,
      "failed": 0,
      "meetsFilterCriteria": 2,
      "returnedResults": 2
    },
    "appliedFilters": {
      "turnover": "100-500",
      "type": "fintech"
    }
  },
  "processingTimeMs": 25640
}
```

### 3. Export Endpoints

**Download Filtered Companies (Excel):**
```bash
GET /api/companies/export/excel?type=technology&turnover=1000-5000
```

**Download All Companies (Excel):**
```bash
GET /api/companies/export/all/excel
```

**Download Companies (CSV):**
```bash
GET /api/companies/export/csv?type=technology&headcount=1000+
```

## Advanced Filter Options

### Revenue Ranges (USD)
- `"1-10"` - $1M to $10M revenue
- `"10-50"` - $10M to $50M revenue  
- `"50-100"` - $50M to $100M revenue
- `"100-500"` - $100M to $500M revenue
- `"500-1000"` - $500M to $1B revenue
- `"1000-5000"` - $1B to $5B revenue
- `"5000+"` - Over $5B revenue
- `turnoverCustom: 250` - Custom minimum revenue in millions USD

### Employee Count Ranges
- `"1-10"` - 1 to 10 employees
- `"11-50"` - 11 to 50 employees
- `"51-100"` - 51 to 100 employees
- `"101-250"` - 101 to 250 employees
- `"251-500"` - 251 to 500 employees
- `"501-1000"` - 501 to 1,000 employees
- `"1001-5000"` - 1,001 to 5,000 employees
- `"5001-10000"` - 5,001 to 10,000 employees
- `"10000+"` - Over 10,000 employees
- `headcountCustom: 500` - Custom minimum employee count

### Industry Types
- `"ecommerce"` - E-commerce and online retail
- `"fintech"` - Financial technology
- `"saas"` - Software as a Service
- `"technology"` - General technology
- `"health"` - Healthcare and medical
- `"education"` - Educational services
- `"manufacturing"` - Manufacturing and production
- `"consulting"` - Consulting services
- `"marketing"` - Marketing and advertising
- `"retail"` - Traditional retail
- `"nonprofit"` - Non-profit organizations

## 🔍 Advanced Features

### Google Search Intelligence
The system automatically:
- Generates search variations and company name alternatives
- Filters out social media and directory sites
- Prioritizes official company domains and about pages
- Handles international domains and complex company structures

### Apollo.io API Integration
- Direct API access to Apollo's organization enrichment endpoint
- 50+ structured data fields with high accuracy
- Financial data, contact information, and corporate structure
- Technology stack and industry classification
- Funding history and public trading information

### ChatGPT Business Intelligence
- Professional business summaries and market analysis
- Business model identification and value proposition
- Strategic positioning and competitive analysis
- Leadership information and corporate structure
- Missing data completion with high confidence

### Smart Export Capabilities
- **Excel Export**: Multiple worksheets with summary statistics
- **CSV Export**: Standard format for data analysis tools
- **Filtered Exports**: Apply criteria before download
- **Comprehensive Data**: 50+ fields including enrichment metadata

## 💡 Best Practices

### Search Query Optimization
- Use official company names when possible
- Include common variations (Alphabet vs Google)
- Provide industry context in keywords for disambiguation
- Handle international companies with local naming conventions

### Filter Configuration
- Start with broader ranges and refine based on results
- Use custom values for precise business requirements
- Combine multiple filter criteria for targeted research
- Review filter analysis for insights into data quality

### Data Quality Assessment
- Check `enrichmentScore` for data completeness (0.0-1.0 scale)
- Review `dataSource` tracking to understand data origin
- Validate results using `filterAnalysis` for accuracy
- Use `lastEnriched` timestamp for data freshness assessment

## 🔧 Configuration

### Required Environment Variables
```bash
# Google Programmable Search Engine API
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here

# Apollo.io API
APOLLO_API_KEY=your_apollo_api_key_here

# OpenAI ChatGPT Configuration  
OPENAI_API_KEY=your_openai_api_key_here

# Database
DATABASE_URL=mysql://user:password@localhost:3306/appdb
```

### API Rate Limits & Performance
- **Google Search API**: 100 searches per day (free tier), 10,000+ (paid)
- **Apollo.io API**: Depends on subscription plan and usage limits
- **OpenAI API**: Standard API rate limits based on usage tier
- **Processing Time**: 8-20 seconds per company (complete pipeline)
- **Bulk Processing**: 30-60 seconds per company (with respectful delays)

## 📊 Response Data Quality

### Enrichment Score Interpretation
- **0.9-1.0**: Comprehensive data from multiple sources with high confidence
- **0.7-0.9**: Good data coverage with minor gaps, suitable for most use cases
- **0.5-0.7**: Acceptable data quality with some missing fields
- **0.3-0.5**: Basic data available, significant enrichment opportunities
- **0.0-0.3**: Limited data, manual verification recommended

### Data Source Combinations
- **Google + Apollo + ChatGPT**: Best accuracy and completeness (recommended)
- **Google + Apollo**: High accuracy structured data
- **Google + ChatGPT**: Good coverage for companies not in Apollo
- **Individual Sources**: Fallback modes with reduced data completeness

## 🚨 Error Handling

### Common Error Responses

**No company found:**
```json
{
  "success": false,
  "message": "Could not find official website for Company Name",
  "processingTimeMs": 5230
}
```

**Filter criteria not met:**
```json
{
  "success": false,
  "message": "Company found but doesn't meet your criteria. turnover: expected 1000-5000, actual 100-500",
  "data": {
    "company": { /* Company data for reference */ },
    "meetsFilterCriteria": false,
    "filterAnalysis": { /* Detailed filter comparison */ }
  },
  "processingTimeMs": 8420
}
```

**API quota exceeded:**
```json
{
  "success": false,
  "message": "Google search failed: Quota exceeded",
  "processingTimeMs": 1250
}
```

## 📈 Performance Optimizations

### Caching Strategy
- Database caching for recently searched companies
- API response caching for Google search results
- Intelligent cache invalidation based on data freshness

### Request Optimization
- Parallel processing where possible (Google + Apollo)
- Smart fallback mechanisms when APIs fail
- Optimized ChatGPT prompts for faster responses
- Respectful rate limiting to prevent quota exhaustion

## 📁 Export File Formats

### Excel Export Features
- **Multiple Worksheets**: Companies data + Summary statistics
- **Rich Formatting**: Styled headers, auto-fitted columns
- **Comprehensive Data**: 50+ fields including all enrichment data
- **Summary Analytics**: Industry distribution, revenue ranges, data quality metrics

### CSV Export Features
- **Standard Format**: RFC 4180 compliant comma-separated values
- **Proper Escaping**: Handles commas, quotes, and newlines in data
- **Tool Compatibility**: Works with Excel, Google Sheets, and data analysis tools
- **Selective Fields**: Core business fields optimized for analysis

This revolutionary API provides the most comprehensive and accurate company intelligence available through the intelligent combination of Google's search capabilities, Apollo's structured data, and ChatGPT's business intelligence.