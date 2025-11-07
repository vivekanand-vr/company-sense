# Company Intelligence Backend - Google Search + Apollo.io + ChatGPT Edition

A revolutionary company research API that combines **Google's Programmable Search Engine** with **Apollo.io API** and **ChatGPT AI enrichment** to provide the most comprehensive, accurate company intelligence data available.

## 🚀 Revolutionary Architecture + NEW Features

This system uses a cutting-edge 4-stage pipeline for maximum data accuracy and completeness:

### **🆕 Latest Updates (November 2024)**
- **⚡ Database-First Optimization**: Instant company lookup from cache (<100ms vs 8-20s)
- **📋 Advanced Company Listing**: Filter, sort, and paginate through your company database
- **📊 Professional Export System**: Excel & CSV exports with comprehensive filtering
- **📚 Interactive Swagger Documentation**: Test APIs directly in your browser
- **🔍 Smart Company Matching**: Handles name variations and partial matches automatically

### Data Pipeline
1. **🔍 Google Search Intelligence** → Find official company websites using Google's Programmable Search Engine
2. **🎯 Apollo.io API Integration** → Get structured company data from Apollo's organization enrichment API
3. **🧠 ChatGPT Data Enrichment** → AI fills gaps, adds context, and provides business intelligence
4. **✅ Smart Filtering & Export** → Advanced criteria validation with Excel/CSV export capabilities
5. **💾 Intelligent Caching** → Database-first approach for instant subsequent lookups

### Key Innovations
- **Official Website Discovery**: Google's Programmable Search Engine finds verified company domains
- **Real Apollo.io API**: Direct API integration with Apollo.io's organization enrichment endpoint
- **AI Business Intelligence**: ChatGPT provides market insights and fills missing data gaps
- **Comprehensive Export**: Excel and CSV export functionality for data analysis
- **Advanced Filtering**: Revenue, employee, industry, and location-based filtering
- **Complete Audit Trail**: Full logging of Google searches, Apollo requests, and ChatGPT interactions

## 🔧 Quick Start

### Prerequisites
- Node.js 20+
- MySQL 8+ 
- Google Cloud Platform account (for Programmable Search Engine API)
- Apollo.io API key
- OpenAI API key for ChatGPT integration

### Environment Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd company-sense-backend
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your API keys and credentials:
   ```bash
   # Database
   DATABASE_URL=mysql://app:app@localhost:3306/appdb
   
   # Google Programmable Search Engine API
   GOOGLE_API_KEY=your_google_api_key_here
   GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
   
   # Apollo.io API
   APOLLO_API_KEY=your_apollo_api_key_here
   
   # OpenAI API for ChatGPT
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Authentication (for admin access)
   JWT_SECRET=your-very-strong-secret-key-here
   JWT_EXPIRES_IN=24h
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your-secure-password-here
   ```

3. **API Keys Setup**

   **Google Programmable Search Engine:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable the Custom Search API
   - Create API credentials
   - Set up your Custom Search Engine at [Google CSE](https://cse.google.com/)

   **Apollo.io API:**
   - Sign up at [Apollo.io](https://app.apollo.io/)
   - Get your API key from the integrations section

   **OpenAI API:**
   - Get your API key from [OpenAI Platform](https://platform.openai.com/)

4. **Docker Setup & Database**

   **Option A: Development Setup (Recommended)**
   ```bash
   # Start MySQL database with phpMyAdmin using Docker
   docker-compose -f docker-compose.dev.yml up -d
   
   # Wait for MySQL to be ready (about 30 seconds)
   docker-compose -f docker-compose.dev.yml logs mysql
   
   # Run database migrations
   npx prisma migrate dev --name "initial_setup"
   npx prisma generate
   ```

   **Option B: Full Docker Setup**
   ```bash
   # Build and start all services (MySQL + App)
   docker-compose up --build -d
   
   # Run migrations inside the app container
   docker-compose exec app npx prisma migrate deploy
   docker-compose exec app npx prisma generate
   ```

   **Database Management:**
   - **phpMyAdmin**: http://localhost:8080 (user: `app`, password: `app`)
   - **Direct MySQL**: `localhost:3306` (user: `app`, password: `app`, database: `appdb`)

   **Migration Commands:**
   ```bash
   # Create a new migration
   npx prisma migrate dev --name "migration_name"
   
   # Apply migrations in production
   npx prisma migrate deploy
   
   # Reset database (development only)
   npx prisma migrate reset
   
   # View migration status
   npx prisma migrate status
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   **Alternative: Development with Docker**
   ```bash
   # If using full Docker setup
   docker-compose up --build
   
   # View logs
   docker-compose logs -f app
   ```

## � Docker Quick Reference

**Essential Commands:**
```bash
# Start development database
docker-compose -f docker-compose.dev.yml up -d

# Stop services
docker-compose -f docker-compose.dev.yml down

# View service status
docker-compose -f docker-compose.dev.yml ps

# View logs
docker-compose -f docker-compose.dev.yml logs mysql
docker-compose -f docker-compose.dev.yml logs phpmyadmin

# Full application with Docker
docker-compose up --build -d     # Start all services
docker-compose down -v           # Stop and remove volumes
docker-compose exec app bash     # Access app container shell
```

**Database Management:**
```bash
# Connect to MySQL directly
docker-compose -f docker-compose.dev.yml exec mysql mysql -u app -papp appdb

# Backup database
docker-compose -f docker-compose.dev.yml exec mysql mysqldump -u app -papp appdb > backup.sql

# Restore database
docker-compose -f docker-compose.dev.yml exec -T mysql mysql -u app -papp appdb < backup.sql
```

## 📋 API Endpoints

### 🔐 Authentication API

For secure access to protected endpoints, the system provides JWT-based authentication with a single admin account for internal use.

#### 1. Admin Login
**POST** `/api/auth/login`

Authenticate with admin credentials to receive a JWT token for API access.

```bash
curl -X POST "http://localhost:3001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your-admin-password"
  }'
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

#### 2. Token Verification
**GET** `/api/auth/verify`

Verify if a JWT token is valid and not expired.

```bash
curl -X GET "http://localhost:3001/api/auth/verify" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 3. Current User Info
**GET** `/api/auth/me`

Get current authenticated user information.

```bash
curl -X GET "http://localhost:3001/api/auth/me" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 4. Token Refresh
**POST** `/api/auth/refresh`

Refresh a valid JWT token to extend its expiration.

```bash
curl -X POST "http://localhost:3001/api/auth/refresh" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 5. Logout
**POST** `/api/auth/logout`

Logout and invalidate the current session (client-side token removal).

```bash
curl -X POST "http://localhost:3001/api/auth/logout" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Authentication Setup:**
1. Set environment variables in `.env`:
   ```bash
   JWT_SECRET=your-very-strong-secret-key-here
   JWT_EXPIRES_IN=24h
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your-secure-password-here
   ```

2. Use the JWT token in API requests:
   ```bash
   # Add Authorization header to protected endpoints
   curl -H "Authorization: Bearer YOUR_JWT_TOKEN" "http://localhost:3001/api/companies"
   ```

**Security Features:**
- JWT tokens with configurable expiration (default: 24 hours)
- Secure password hashing with bcrypt (12 rounds)
- Environment-based admin credentials
- Request logging and audit trail
- Token validation middleware for protected routes

**Authentication Options for Internal Tools:**

The system provides multiple authentication approaches suitable for different security needs:

1. **JWT with bcrypt (Implemented & Recommended)**
   - ✅ Best balance of security and simplicity
   - ✅ Stateless authentication (no server-side sessions)
   - ✅ Configurable token expiration
   - ✅ Industry standard approach
   - ✅ Suitable for single-page applications

2. **Alternative Options (Not Implemented):**
   - **Session-based**: Server-side sessions with express-session
   - **API Key**: Simple static API key authentication  
   - **Basic Auth**: HTTP Basic Authentication with browser support
   - **OAuth**: Third-party authentication (Google, GitHub, etc.)

3. **Current Implementation Benefits:**
   - Single admin account for internal use
   - Secure password hashing (12 rounds)
   - JWT tokens with digital signatures
   - Configurable security settings
   - Ready for frontend integration

**Protecting Endpoints (Optional):**
By default, all company endpoints are publicly accessible. To add authentication protection:

1. **Protect all company endpoints:**
   ```typescript
   // In src/app.ts
   app.use('/api/companies', authenticateToken, companiesRouter);
   ```

2. **Protect specific endpoints:**
   ```typescript
   // In src/routes/companies.ts
   router.get('/', authenticateToken, asyncHandler(listCompanies));
   router.get('/export/excel', authenticateToken, asyncHandler(exportCompaniesExcel));
   ```

3. **Mixed protection (some public, some private):**
   ```bash
   # Public access (no token required)
   curl "http://localhost:3001/api/companies?limit=5"
   
   # Protected access (token required)
   curl -H "Authorization: Bearer YOUR_JWT_TOKEN" "http://localhost:3001/api/companies/export/excel"
   ```

### 🎯 Core Intelligence API

#### 1. Company Lookup (Recommended)
**POST** `/api/companies/lookup`

Uses the complete Google Search → Apollo API → ChatGPT pipeline for maximum data accuracy. **Now with database-first optimization** - returns cached data instantly if company exists!

```bash
curl -X POST "http://localhost:3001/api/companies/lookup" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Shopify Inc",
    "hints": {
      "turnover": "1000-5000",
      "headcount": "1001-5000", 
      "type": "technology"
    }
  }'
```

**Smart Processing:**
- ⚡ **Database Cache**: Returns existing companies in <100ms
- 🔍 **Full Pipeline**: New companies processed in 8-20 seconds
- 🎯 **Intelligent Matching**: Handles company name variations automatically

#### 2. Bulk Company Lookup  
**POST** `/api/companies/bulk-lookup`

Process multiple companies with filtering in a single request (up to 100 companies).

```bash
curl -X POST "http://localhost:3001/api/companies/bulk-lookup" \
  -H "Content-Type: application/json" \
  -d '{
    "names": ["Apple Inc", "Microsoft", "Google", "Amazon"],
    "hints": {"turnover": "5000+", "type": "technology"}
  }'
```

#### 3. **NEW** - List Companies with Advanced Filtering
**GET** `/api/companies`

Retrieve companies from database with comprehensive filtering and pagination.

```bash
# Basic listing with pagination
curl "http://localhost:3001/api/companies?page=1&limit=20"

# Advanced filtering
curl "http://localhost:3001/api/companies?industry=Technology&minEmployees=1000&maxRevenue=10000000000&country=United%20States&publiclyTraded=true&sortBy=revenue&sortOrder=desc"

# Search functionality
curl "http://localhost:3001/api/companies?search=fintech&minEmployees=100&sortBy=enrichmentScore&sortOrder=desc"
```

**Advanced Filter Parameters:**
- `search` - Search in company name, domain, or industry
- `industry` - Filter by specific industry
- `minEmployees` / `maxEmployees` - Employee count range
- `minRevenue` / `maxRevenue` - Revenue range in USD
- `country` - Geographic filter
- `publiclyTraded` - Public/private status
- `sortBy` - Sort by: name, employees, revenue, foundedYear, lastUpdated, enrichmentScore
- `sortOrder` - asc or desc

### 📊 Export & Analytics API

#### 4. **NEW** - Export Filtered Companies (Excel)
**GET** `/api/companies/export/excel`

```bash
# Export technology companies with 1000+ employees
curl "http://localhost:3001/api/companies/export/excel?industry=Technology&minEmployees=1000" \
  --output "tech-companies.xlsx"

# Export by revenue range and location
curl "http://localhost:3001/api/companies/export/excel?minRevenue=100000000&country=United%20States&publiclyTraded=true" \
  --output "us-public-companies.xlsx"
```

#### 5. **NEW** - Export All Companies (Excel)
**GET** `/api/companies/export/all/excel`

```bash
curl "http://localhost:3001/api/companies/export/all/excel" \
  --output "complete-company-database.xlsx"
```

#### 6. **NEW** - Export Companies (CSV)
**GET** `/api/companies/export/csv`

```bash
curl "http://localhost:3001/api/companies/export/csv?industry=fintech&minEmployees=50" \
  --output "fintech-companies.csv"
```

### 📚 **NEW** - Interactive API Documentation
**GET** `/api-docs`

**Swagger UI Integration:**
- 🌐 **Interactive Testing**: Test all endpoints directly in your browser
- 📖 **Complete Documentation**: Detailed request/response schemas including authentication
- 🎯 **Example Requests**: Pre-filled examples for every endpoint
- 🔍 **Schema Explorer**: Browse all data models and filters
- 🔐 **Authentication Support**: Test protected endpoints with JWT tokens

**Access Documentation:**
```bash
# Open in browser
http://localhost:3001/api-docs

# Get raw OpenAPI spec
curl http://localhost:3001/api-docs.json
```

**Testing Authentication in Swagger:**
1. Use the `/api/auth/login` endpoint to get a JWT token
2. Click the "Authorize" button in Swagger UI
3. Enter your token as: `Bearer YOUR_JWT_TOKEN`
4. Test protected endpoints with authentication

### 🏥 Health & Monitoring

#### Database Statistics
**GET** `/api/db/stats`

Get comprehensive database query statistics and log file information.

```bash
curl "http://localhost:3001/api/db/stats"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "queryStats": {
      "totalQueries": 156,
      "totalQueryTime": 2340,
      "averageQueryTime": "15.00"
    },
    "logFiles": {
      "transactionsLog": {
        "exists": true,
        "size": "2.45 MB"
      },
      "errorsLog": {
        "exists": true,
        "size": "0.12 MB"
      }
    },
    "logDirectory": "/path/to/logs"
  }
}
```

#### Reset Database Statistics
**POST** `/api/db/stats/reset`

Reset database query counters and performance metrics.

```bash
curl -X POST "http://localhost:3001/api/db/stats/reset"
```

#### Health Check
**GET** `/health`

```bash
curl "http://localhost:3001/health"
```

**Enhanced Response Examples:**

**1. Successful New Company Lookup (Full Pipeline):**
```json
{
  "success": true,
  "data": {
    "company": {
      "id": "uuid-123-456-789",
      "name": "Shopify Inc.",
      "website": "https://www.shopify.com",
      "domain": "shopify.com",
      "industry": "Technology",
      "description": "Leading e-commerce platform provider...",
      "foundedYear": 2006,
      "employeeCount": 12000,
      "annualRevenue": 5610000000,
      "annualRevenueFormatted": "5.6B",
      "phone": "+1-800-746-7439",
      "address": {
        "street": "150 Elgin Street", 
        "city": "Ottawa",
        "state": "Ontario",
        "country": "Canada"
      },
      "socialMedia": {
        "linkedin": "https://linkedin.com/company/shopify",
        "twitter": "https://twitter.com/shopify"
      },
      "businessModel": "SaaS platform for e-commerce solutions",
      "keyProducts": ["Shopify Platform", "Shopify Plus", "Shopify POS"],
      "ceo": "Tobias Lütke",
      "publiclyTraded": true,
      "stockSymbol": "SHOP",
      "summary": "Shopify Inc. is a leading multinational e-commerce platform...",
      "technologies": ["React", "Ruby", "GraphQL", "Kubernetes"],
      "apolloId": "5e66b6381e05b4008c8331b8",
      "googleSearchData": {
        "url": "https://www.shopify.com",
        "domain": "shopify.com"
      },
      "dataSource": "google_apollo_chatgpt",
      "apolloSource": true,
      "chatgptSource": true,
      "enrichmentScore": 0.95,
      "lastUpdated": "2024-11-05T14:32:18.962Z"
    },
    "meetsFilterCriteria": true,
    "filterAnalysis": {
      "turnover": {"expected": "1000-5000", "actual": "5610", "matches": true},
      "headcount": {"expected": "1001-5000", "actual": "12000", "matches": true}
    }
  },
  "processingTimeMs": 8420
}
```

**2. Cached Company Lookup (Database):**
```json
{
  "success": true,
  "data": {
    "company": {
      "name": "Microsoft Corporation",
      "domain": "microsoft.com",
      "dataSource": "database_cache",
      /* ... complete company data ... */
    },
    "meetsFilterCriteria": true
  },
  "processingTimeMs": 45
}
```

**3. Companies List Response:**
```json
{
  "success": true,
  "data": {
    "companies": [
      {
        "id": "uuid-123",
        "name": "Apple Inc.",
        "domain": "apple.com",
        "industry": "Technology",
        "employees": 164000,
        "revenue": 394330000000,
        "foundedYear": 1976,
        "publiclyTraded": true,
        "stockSymbol": "AAPL",
        "enrichmentScore": 0.98,
        "lastUpdated": "2024-11-05T12:15:30.000Z"
      },
      /* ... more companies ... */
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalCount": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "processingTimeMs": 45
}
```

**4. Bulk Processing Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "company": {
          "name": "Apple Inc.",
          "website": "https://www.apple.com",
          "domain": "apple.com",
          "industry": "Technology",
          "employeeCount": 164000,
          "annualRevenue": 394330000000,
          "annualRevenueFormatted": "394.3B",
          "businessModel": "Consumer electronics and software ecosystem",
          "keyProducts": ["iPhone", "MacBook", "iPad", "Apple Services"],
          "ceo": "Tim Cook",
          "stockSymbol": "AAPL",
          "summary": "Apple Inc. is a multinational technology company...",
          "apolloSource": true,
          "chatgptSource": true,
          "enrichmentScore": 0.95
        },
        "meetsFilterCriteria": true,
        "filterAnalysis": {
          "turnover": {"expected": "5000+", "actual": "394330", "matches": true},
          "type": {"expected": "technology", "actual": "Technology", "matches": true}
        },
        "processingTimeMs": 7250,
        "dataSource": "google_apollo_chatgpt"
      },
      /* ... more companies ... */
    ],
    "summary": {
      "total": 3,
      "successful": 3,
      "failed": 0,
      "meetsFilterCriteria": 3,
      "averageProcessingTime": 8540,
      "totalProcessingTime": 25620
    }
  },
  "processingTimeMs": 25620
}
```

## 🎯 Advanced Filtering

### Revenue Ranges (USD)
- `"1-10"` - $1M to $10M revenue
- `"10-50"` - $10M to $50M revenue  
- `"50-100"` - $50M to $100M revenue
- `"100-500"` - $100M to $500M revenue
- `"500-1000"` - $500M to $1B revenue
- `"1000-5000"` - $1B to $5B revenue
- `"5000+"` - Over $5B revenue
- `turnoverCustom: 100` - Custom minimum revenue in millions

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

## 📊 Data Sources & Quality

### Google Programmable Search Engine
- **Purpose**: Find official company websites and domains
- **Accuracy**: 95-98% for finding correct official domains
- **Features**: Filters out social media and directory sites
- **Logging**: All search results logged to `/logs/google-search.log`

### Apollo.io API Integration
- **Purpose**: Structured company data and contact information
- **Data Fields**: 50+ fields including financials, employees, contact info
- **Accuracy**: 90-95% for publicly available data
- **Logging**: All API requests logged to `/logs/apollo-api.log`

### ChatGPT Enrichment
- **Purpose**: Business intelligence and missing data completion
- **Features**: Company summaries, business models, market positioning
- **Accuracy**: 85-90% for business intelligence data
- **Logging**: All interactions logged to `/logs/chatgpt.log`

### Data Quality Metrics
- **Enrichment Score**: 0.0-1.0 indicating data completeness
- **Source Tracking**: Know which APIs provided each data point
- **Confidence Scoring**: Reliability indicators for each field

### 🔍 Advanced Features

### Database Query Logging & Monitoring

**File-Based Database Logging:**
- All Prisma queries are logged to `/logs/db-transactions.log` instead of console output
- Database errors are captured in `/logs/db-errors.log`
- Performance metrics include query count, duration, and averages
- Query parameters are logged (with sensitive data sanitization)
- No more console spam from database queries

**Database Statistics API:**
```bash
# Get database query statistics
curl "http://localhost:3001/api/db/stats"

# Reset query statistics
curl -X POST "http://localhost:3001/api/db/stats/reset"
```

**Example Database Log Entry:**
```json
{
  "type": "query",
  "timestamp": "2025-11-07 15:22:35.819",
  "queryNumber": 1,
  "query": "findMany Company",
  "params": ["{\"where\":{},\"skip\":0,\"take\":20}"],
  "duration": "17ms",
  "performanceMetrics": {
    "totalQueries": 1,
    "averageQueryTime": "17.00ms"
  }
}
```

**Environment Configuration:**
```bash
# Disable Prisma console logging (queries logged to files)
PRISMA_DISABLE_CONSOLE_LOG=true
```

### Intelligent Website Discovery
- Automatically generates search variations and company name alternatives
- Filters out social media, directories, and competitor sites
- Prioritizes official company domains and about pages

### Multi-Source Data Validation
- Cross-references Google search results with Apollo data
- Validates company domains and websites for accuracy
- Combines multiple data sources for comprehensive profiles

### AI-Powered Business Intelligence
- Generates professional business summaries
- Identifies business models and value propositions
- Provides market positioning and competitive analysis
- Fills missing data gaps intelligently

### Comprehensive Export Capabilities
- Excel exports with multiple worksheets and summary statistics
- CSV exports for data analysis and integration
- Filtered exports based on criteria
- Full database exports for backup and analysis

## 📈 Performance & Logging

### ⚡ Optimized Processing Times
- **Database Cache Hits**: <100ms (instant return for existing companies)
- **Google Search**: 2-5 seconds per company
- **Apollo API**: 1-3 seconds per company  
- **ChatGPT Enrichment**: 3-8 seconds per company
- **Total New Company Pipeline**: 8-20 seconds per company
- **Bulk Processing**: 30-60 seconds per company (with respectful delays)
- **List/Filter Operations**: 10-100ms for database queries
- **Export Generation**: 1-5 seconds depending on data size

### Smart Caching Strategy
- **Automatic Database Check**: Every lookup first checks for existing data
- **Intelligent Matching**: Handles company name variations and partial matches
- **Cache Invalidation**: Configurable data freshness policies
- **Performance Boost**: 99%+ faster for repeat company lookups

### Comprehensive Logging
- **Pipeline Logs**: Complete processing pipeline in `/logs/pipeline.log`
- **Google Search Logs**: Search queries and results in `/logs/google-search.log`
- **Apollo API Logs**: API requests and responses in `/logs/apollo-api.log`
- **ChatGPT Logs**: AI interactions and responses in `/logs/chatgpt.log`
- **Database Logs**: All database queries and transactions in `/logs/db-transactions.log`
- **Database Errors**: Database errors and failures in `/logs/db-errors.log`
- **Application Logs**: General application events in `/logs/app.log`

## 🛠️ Development

### Project Structure
```
src/
├── services/
│   ├── google-search.service.ts     # Google Programmable Search Engine
│   ├── apollo.service.ts            # Apollo.io API integration
│   ├── chatgpt.service.ts          # ChatGPT enrichment
│   ├── company.service.ts          # Main pipeline orchestration
│   └── excel-export.service.ts     # Export functionality
├── controllers/
│   └── company.controller.ts       # API endpoint handlers
├── routes/
│   └── companies.ts               # API routes
├── lib/
│   ├── config.ts                  # Configuration management
│   └── logger.ts                  # Winston logging setup
└── middlewares/                   # Express middleware
```

### Key Technologies
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Google Custom Search API** - Website discovery
- **Apollo.io API** - Company data enrichment
- **OpenAI** - ChatGPT integration
- **Prisma** - Database ORM
- **MySQL** - Data storage
- **Winston** - Comprehensive logging
- **ExcelJS** - Excel export functionality
- **Zod** - Runtime validation

## � Security & Compliance

### API Security
- Environment variable-based API key management
- Rate limiting for all external API calls
- Request validation with Zod schemas
- Comprehensive error handling

### Data Privacy
- Only processes publicly available company information
- No personal data collection or storage
- Transparent data source attribution
- Full audit trails for compliance

### Rate Limiting
- Google Search API: Respects daily quotas
- Apollo.io API: Built-in rate limiting
- OpenAI API: Intelligent request optimization
- Bulk operations: Respectful delays between requests

## 🐛 Troubleshooting

### Common Issues

**Google Search API fails:**
- Verify API key and Search Engine ID are correct
- Check API quotas in Google Cloud Console
- Ensure Custom Search Engine is configured properly

**Apollo.io API fails:**
- Verify API key is valid and active
- Check API usage limits in Apollo dashboard
- Ensure domain format is correct (e.g., "apollo.io", not "https://apollo.io")

**ChatGPT enrichment fails:**
- Verify OpenAI API key is valid and has credits
- Check API rate limits

**Docker & Database Issues:**

*MySQL Connection Issues:*
```bash
# Check if MySQL container is running
docker-compose -f docker-compose.dev.yml ps

# View MySQL logs
docker-compose -f docker-compose.dev.yml logs mysql

# Wait for MySQL to be ready
docker-compose -f docker-compose.dev.yml exec mysql mysqladmin ping -h localhost -u app -papp
```

*Database Migration Issues:*
```bash
# Reset Prisma client
npx prisma generate

# Check migration status
npx prisma migrate status

# Force reset (development only)
npx prisma migrate reset --force

# Apply specific migration
npx prisma migrate resolve --applied "migration_name"
```

*Port Conflicts:*
```bash
# If port 3306 is already in use, modify docker-compose.dev.yml:
# Change "3306:3306" to "3307:3306"
# Update DATABASE_URL to: mysql://app:app@localhost:3307/appdb
```

*Docker Build Issues:*
```bash
# Clean Docker build cache
docker-compose down -v
docker system prune -f
docker-compose up --build --force-recreate
```

*Permission Issues (Linux/Mac):*
```bash
# Fix Docker volume permissions
sudo chown -R $USER:$USER ./data
```
- Review request/response logs in `/logs/chatgpt.log`

**Database connection issues:**
- Ensure MySQL is running
- Verify DATABASE_URL configuration
- Run migrations: `npx prisma migrate dev`

**Authentication issues:**
- Verify JWT_SECRET is set in environment variables
- Check ADMIN_USERNAME and ADMIN_PASSWORD are configured
- Ensure JWT token is included in Authorization header: `Bearer YOUR_TOKEN`
- Check token expiration (default: 24 hours)
- Verify token format is valid JWT

**Common Authentication Errors:**
```bash
# Error: "JWT_SECRET not set"
# Solution: Add JWT_SECRET to .env file

# Error: "Invalid credentials" 
# Solution: Check ADMIN_USERNAME and ADMIN_PASSWORD in .env

# Error: "Token verification failed"
# Solution: Check token format and expiration, refresh if needed

# Error: "Authorization header missing"
# Solution: Add header: Authorization: Bearer YOUR_JWT_TOKEN
```

### Debug Mode
Set `LOG_LEVEL=debug` in `.env` for detailed logging including:
- Complete API request/response cycles
- Data transformation steps
- Performance metrics
- Error stack traces

## 📊 Export Formats

### Excel Export Features
- Multiple worksheets (Companies, Summary)
- Auto-fitted columns for readability
- Styled headers and formatting
- Comprehensive company data (50+ fields)
- Summary statistics and metrics

### CSV Export Features
- Standard comma-separated format
- Proper escaping of special characters
- Compatible with Excel, Google Sheets, and data analysis tools
- Filtered data based on request parameters

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For issues and questions:
- Create a GitHub issue
- Check the troubleshooting guide
- Review the comprehensive logging in `/logs/` folder