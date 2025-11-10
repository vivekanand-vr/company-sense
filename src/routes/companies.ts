import { Router } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { optionalAuth } from '../middlewares/auth';
import { 
  lookupCompany, 
  bulkLookupCompanies,
  exportCompaniesExcel,
  exportAllCompaniesExcel,
  exportCompaniesCSV,
  exportSelectedCompaniesExcel,
  bulkDeleteCompanies,
  listCompanies
} from '../controllers/company.controller';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CompanyFilters:
 *       type: object
 *       properties:
 *         turnover:
 *           type: string
 *           enum: ['1-10', '10-50', '50-100', '100-500', '500-1000', '1000-5000', '5000+', 'custom']
 *           description: Revenue range in millions USD
 *           example: "100-500"
 *         turnoverCustom:
 *           type: number
 *           description: Custom turnover value in millions USD
 *           example: 250
 *         headcount:
 *           type: string
 *           enum: ['1-10', '11-50', '51-100', '101-250', '251-500', '501-1000', '1001-5000', '5001-10000', '10000+', 'custom']
 *           description: Employee count range
 *           example: "501-1000"
 *         headcountCustom:
 *           type: number
 *           description: Custom employee count
 *           example: 750
 *         type:
 *           type: string
 *           enum: ['ecommerce', 'education', 'health', 'fintech', 'saas', 'manufacturing', 'other']
 *           description: Company industry type
 *           example: "fintech"
 *         typeCustom:
 *           type: string
 *           description: Custom company type
 *           example: "AI/ML Technology"
 *     
 *     CompanyAddress:
 *       type: object
 *       properties:
 *         full:
 *           type: string
 *           description: Full address
 *         street:
 *           type: string
 *           description: Street address
 *         city:
 *           type: string
 *           description: City
 *         state:
 *           type: string
 *           description: State/Province
 *         postalCode:
 *           type: string
 *           description: Postal code
 *         country:
 *           type: string
 *           description: Country
 *     
 *     SocialMedia:
 *       type: object
 *       properties:
 *         linkedin:
 *           type: string
 *           description: LinkedIn URL
 *         twitter:
 *           type: string
 *           description: Twitter URL
 *         facebook:
 *           type: string
 *           description: Facebook URL
 *         blog:
 *           type: string
 *           description: Blog URL
 *     
 *     CompanyData:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique company identifier
 *           example: "uuid-123-456-789"
 *         name:
 *           type: string
 *           description: Company name
 *           example: "Shopify Inc."
 *         domain:
 *           type: string
 *           description: Primary domain
 *           example: "shopify.com"
 *         website:
 *           type: string
 *           description: Website URL
 *           example: "https://www.shopify.com"
 *         description:
 *           type: string
 *           description: Company description
 *           example: "Leading e-commerce platform provider"
 *         industry:
 *           type: string
 *           description: Primary industry
 *           example: "Technology"
 *         employees:
 *           type: number
 *           description: Number of employees
 *           example: 12000
 *         revenue:
 *           type: number
 *           description: Annual revenue in USD
 *           example: 5610000000
 *         foundedYear:
 *           type: number
 *           description: Year founded
 *           example: 2006
 *         publiclyTraded:
 *           type: boolean
 *           description: Is publicly traded
 *           example: true
 *         stockSymbol:
 *           type: string
 *           description: Stock symbol
 *           example: "SHOP"
 *         phone:
 *           type: string
 *           description: Phone number
 *           example: "+1-800-746-7439"
 *         address:
 *           $ref: '#/components/schemas/CompanyAddress'
 *         linkedinUrl:
 *           type: string
 *           description: LinkedIn URL
 *           example: "https://linkedin.com/company/shopify"
 *         twitterUrl:
 *           type: string
 *           description: Twitter URL
 *           example: "https://twitter.com/shopify"
 *         facebookUrl:
 *           type: string
 *           description: Facebook URL
 *           example: "https://facebook.com/shopify"
 *         socialMedia:
 *           $ref: '#/components/schemas/SocialMedia'
 *         technologies:
 *           type: array
 *           items:
 *             type: string
 *           description: Technologies used
 *           example: ["React", "Ruby on Rails", "GraphQL"]
 *         dataSource:
 *           type: string
 *           description: Data sources used
 *           example: "google_apollo_chatgpt"
 *         lastUpdated:
 *           type: string
 *           format: date-time
 *           description: Last updated timestamp
 *         isVerified:
 *           type: boolean
 *           description: Is data verified
 *           example: true
 *         apolloId:
 *           type: string
 *           description: Apollo.io organization ID
 *           example: "5e66b6381e05b4008c8331b8"
 *         summary:
 *           type: string
 *           description: AI-generated company summary
 *           example: "Shopify Inc. is a leading multinational e-commerce platform..."
 *         enrichmentScore:
 *           type: number
 *           description: Data completeness score (0-1)
 *           example: 0.95
 *         apolloSource:
 *           type: boolean
 *           description: Data sourced from Apollo.io
 *           example: true
 *         chatgptSource:
 *           type: boolean
 *           description: Data enhanced by ChatGPT
 *           example: true
 *     
 *     FilterAnalysis:
 *       type: object
 *       properties:
 *         turnover:
 *           type: object
 *           properties:
 *             expected:
 *               type: string
 *               example: "100-500"
 *             actual:
 *               type: string
 *               example: "5610"
 *             match:
 *               type: boolean
 *               example: true
 *         headcount:
 *           type: object
 *           properties:
 *             expected:
 *               type: string
 *               example: "1001-5000"
 *             actual:
 *               type: number
 *               example: 12000
 *             match:
 *               type: boolean
 *               example: true
 *     
 *     LookupSuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             company:
 *               $ref: '#/components/schemas/CompanyData'
 *             meetsFilterCriteria:
 *               type: boolean
 *               description: Whether company meets filter criteria
 *               example: true
 *             filterAnalysis:
 *               $ref: '#/components/schemas/FilterAnalysis'
 *         processingTimeMs:
 *           type: number
 *           description: Processing time in milliseconds
 *           example: 8420
 *     
 *     BulkLookupResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             results:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LookupSuccessResponse'
 *             summary:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                   example: 3
 *                 successful:
 *                   type: number
 *                   example: 3
 *                 failed:
 *                   type: number
 *                   example: 0
 *                 meetsFilterCriteria:
 *                   type: number
 *                   example: 2
 *                 averageProcessingTime:
 *                   type: number
 *                   example: 8540
 *         processingTimeMs:
 *           type: number
 *           example: 25620
 *     
 *     ListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             companies:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CompanyData'
 *             pagination:
 *               type: object
 *               properties:
 *                 page:
 *                   type: number
 *                   example: 1
 *                 limit:
 *                   type: number
 *                   example: 20
 *                 totalCount:
 *                   type: number
 *                   example: 150
 *                 totalPages:
 *                   type: number
 *                   example: 8
 *                 hasNext:
 *                   type: boolean
 *                   example: true
 *                 hasPrev:
 *                   type: boolean
 *                   example: false
 *         processingTimeMs:
 *           type: number
 *           example: 45
 *     
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           description: Error message
 *           example: "Could not find official website for Unknown Company"
 *         processingTimeMs:
 *           type: number
 *           description: Processing time in milliseconds
 *           example: 5000
 *   
 *   tags:
 *     - name: Company Intelligence
 *       description: AI-powered company research and data enrichment
 *     - name: Company Management  
 *       description: List, filter, and manage company data
 *     - name: Export
 *       description: Export company data in various formats
 */

/**
 * @swagger
 * /api/companies:
 *   get:
 *     summary: List companies with advanced filtering and pagination
 *     description: |
 *       Retrieve a paginated list of companies from the database with comprehensive filtering options.
 *       Supports search, industry filtering, size ranges, geographic filtering, and sorting.
 *     tags: [Company Management]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of companies per page
 *         example: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in company name, domain, or industry
 *         example: "technology"
 *       - in: query
 *         name: industry
 *         schema:
 *           type: string
 *         description: Filter by specific industry
 *         example: "Technology"
 *       - in: query
 *         name: minEmployees
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Minimum number of employees
 *         example: 100
 *       - in: query
 *         name: maxEmployees
 *         schema:
 *           type: integer
 *         description: Maximum number of employees
 *         example: 10000
 *       - in: query
 *         name: minRevenue
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Minimum annual revenue in USD
 *         example: 1000000
 *       - in: query
 *         name: maxRevenue
 *         schema:
 *           type: integer
 *         description: Maximum annual revenue in USD
 *         example: 1000000000
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filter by country
 *         example: "United States"
 *       - in: query
 *         name: publiclyTraded
 *         schema:
 *           type: boolean
 *         description: Filter by public trading status
 *         example: true
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, employees, revenue, foundedYear, lastUpdated, enrichmentScore]
 *           default: lastUpdated
 *         description: Field to sort by
 *         example: "revenue"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order (ascending or descending)
 *         example: "desc"
 *     responses:
 *       200:
 *         description: Successfully retrieved companies list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListResponse'
 *             examples:
 *               success:
 *                 summary: Successful companies list retrieval
 *                 value:
 *                   success: true
 *                   data:
 *                     companies:
 *                       - id: "uuid-123"
 *                         name: "Shopify Inc."
 *                         domain: "shopify.com"
 *                         industry: "Technology"
 *                         employees: 12000
 *                         revenue: 5610000000
 *                         foundedYear: 2006
 *                         publiclyTraded: true
 *                         stockSymbol: "SHOP"
 *                         enrichmentScore: 0.95
 *                     pagination:
 *                       page: 1
 *                       limit: 20
 *                       totalCount: 150
 *                       totalPages: 8
 *                       hasNext: true
 *                       hasPrev: false
 *                   processingTimeMs: 45
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid query parameters"
 *                 details:
 *                   type: string
 *                   example: "Page must be a positive integer"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', asyncHandler(listCompanies));

/**
 * @swagger
 * /api/companies/lookup:
 *   post:
 *     summary: Intelligent Company Lookup with AI Pipeline
 *     description: |
 *       Comprehensive company intelligence using advanced AI-powered search pipeline.
 *       
 *       **Processing Pipeline:**
 *       1. **Database Check** - Returns cached data instantly if company exists
 *       2. **Google Search** - Finds official website using Programmable Search Engine  
 *       3. **Apollo.io API** - Gets structured company data and contact information
 *       4. **ChatGPT Enhancement** - Adds business intelligence and fills data gaps
 *       5. **Database Storage** - Saves enriched data for future queries
 *       
 *       **Performance:** 8-20 seconds for new companies, <100ms for cached data
 *     tags: [Company Intelligence]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 255
 *                 description: Company name to search for
 *                 example: "Shopify Inc"
 *               hints:
 *                 $ref: '#/components/schemas/CompanyFilters'
 *           examples:
 *             simple:
 *               summary: Simple company lookup
 *               value:
 *                 name: "Microsoft"
 *             startup:
 *               summary: Startup with filtering hints
 *               value:
 *                 name: "Stripe Inc"
 *                 hints:
 *                   turnover: "1000-5000"
 *                   headcount: "1001-5000"
 *                   type: "fintech"
 *             enterprise:
 *               summary: Large enterprise lookup
 *               value:
 *                 name: "Apple Inc"
 *                 hints:
 *                   turnover: "5000+"
 *                   headcount: "10000+"
 *                   type: "technology"
 *     responses:
 *       200:
 *         description: Company found and processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LookupSuccessResponse'
 *             examples:
 *               new_company:
 *                 summary: Newly processed company (full pipeline)
 *                 value:
 *                   success: true
 *                   data:
 *                     company:
 *                       id: "uuid-123-456-789"
 *                       name: "Shopify Inc."
 *                       domain: "shopify.com" 
 *                       website: "https://www.shopify.com"
 *                       industry: "Technology"
 *                       description: "Leading e-commerce platform provider"
 *                       employees: 12000
 *                       revenue: 5610000000
 *                       foundedYear: 2006
 *                       publiclyTraded: true
 *                       stockSymbol: "SHOP"
 *                       phone: "+1-800-746-7439"
 *                       address:
 *                         city: "Ottawa"
 *                         state: "Ontario"
 *                         country: "Canada"
 *                       socialMedia:
 *                         linkedin: "https://linkedin.com/company/shopify"
 *                         twitter: "https://twitter.com/shopify"
 *                       technologies: ["React", "Ruby on Rails", "GraphQL"]
 *                       summary: "Shopify Inc. is a leading multinational e-commerce platform..."
 *                       apolloId: "5e66b6381e05b4008c8331b8"
 *                       enrichmentScore: 0.95
 *                       apolloSource: true
 *                       chatgptSource: true
 *                       dataSource: "google_apollo_chatgpt"
 *                     meetsFilterCriteria: true
 *                     filterAnalysis:
 *                       turnover:
 *                         expected: "1000-5000"
 *                         actual: "5610"
 *                         match: true
 *                   processingTimeMs: 8420
 *               cached_company:
 *                 summary: Company found in database cache
 *                 value:
 *                   success: true
 *                   data:
 *                     company:
 *                       name: "Microsoft Corporation"
 *                       domain: "microsoft.com"
 *                       dataSource: "database_cache"
 *                     meetsFilterCriteria: true
 *                   processingTimeMs: 45
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid request data"
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                       message:
 *                         type: string
 *             example:
 *               error: "Invalid request data"
 *               details:
 *                 - field: "name"
 *                   message: "Company name is required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               not_found:
 *                 summary: Company not found
 *                 value:
 *                   success: false
 *                   message: "Could not find official website for Unknown Company XYZ"
 *                   processingTimeMs: 5000
 *               api_failure:
 *                 summary: External API failure
 *                 value:
 *                   success: false
 *                   message: "Could not find company data in Apollo for Private Company"
 *                   processingTimeMs: 8500
 */
router.post('/lookup', asyncHandler(lookupCompany));

/**
 * @swagger
 * /api/companies/bulk-lookup:
 *   post:
 *     summary: Bulk Company Lookup with Filtering
 *     description: |
 *       Process multiple companies simultaneously using the AI-powered pipeline.
 *       Each company goes through the same Google → Apollo → ChatGPT process.
 *       
 *       **Features:**
 *       - Process up to 100 companies per request
 *       - Intelligent delay between requests to respect API limits
 *       - Detailed success/failure summary
 *       - Error handling for individual company failures
 *       
 *       **Performance:** 30-60 seconds per company (with respectful delays)
 *     tags: [Company Intelligence]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - names
 *             properties:
 *               names:
 *                 type: array
 *                 items:
 *                   type: string
 *                   minLength: 1
 *                   maxLength: 255
 *                 minItems: 1
 *                 maxItems: 100
 *                 description: Array of company names to lookup
 *                 example: ["Apple Inc", "Microsoft", "Google"]
 *               hints:
 *                 $ref: '#/components/schemas/CompanyFilters'
 *           examples:
 *             tech_companies:
 *               summary: Technology companies lookup
 *               value:
 *                 names: ["Apple Inc", "Microsoft", "Google", "Amazon"]
 *                 hints:
 *                   turnover: "5000+"
 *                   type: "technology"
 *             startups:
 *               summary: Startup companies with filtering
 *               value:
 *                 names: ["Stripe Inc", "Notion Labs", "Discord Inc"]
 *                 hints:
 *                   turnover: "10-500"
 *                   headcount: "101-1000"
 *                   type: "saas"
 *     responses:
 *       200:
 *         description: Bulk lookup completed (may contain partial failures)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BulkLookupResponse'
 *             examples:
 *               all_success:
 *                 summary: All companies processed successfully
 *                 value:
 *                   success: true
 *                   data:
 *                     results:
 *                       - company:
 *                           name: "Apple Inc."
 *                           domain: "apple.com"
 *                           employees: 164000
 *                           revenue: 394330000000
 *                         meetsFilterCriteria: true
 *                         processingTimeMs: 7250
 *                       - company:
 *                           name: "Microsoft Corporation"
 *                           domain: "microsoft.com"
 *                           employees: 221000
 *                           revenue: 211915000000
 *                         meetsFilterCriteria: true
 *                         processingTimeMs: 8950
 *                     summary:
 *                       total: 2
 *                       successful: 2
 *                       failed: 0
 *                       meetsFilterCriteria: 2
 *                       averageProcessingTime: 8100
 *                   processingTimeMs: 16200
 *               partial_failure:
 *                 summary: Some companies failed during processing
 *                 value:
 *                   success: true
 *                   data:
 *                     results:
 *                       - company:
 *                           name: "Apple Inc."
 *                           domain: "apple.com"
 *                         meetsFilterCriteria: true
 *                         processingTimeMs: 7250
 *                     summary:
 *                       total: 3
 *                       successful: 1
 *                       failed: 2
 *                       meetsFilterCriteria: 1
 *                     errors:
 *                       - companyName: "Unknown Company XYZ"
 *                         error: "Could not find official website"
 *                       - companyName: "Private Corp"
 *                         error: "Could not find company data in Apollo"
 *                   processingTimeMs: 15420
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 details:
 *                   type: string
 *             example:
 *               error: "Invalid request data"
 *               details: "At least one company name required"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/bulk-lookup', asyncHandler(bulkLookupCompanies));

/**
 * @swagger
 * /api/companies/export/excel:
 *   get:
 *     summary: Export Filtered Companies to Excel
 *     description: |
 *       Export companies to Excel format with advanced filtering options.
 *       Generates a comprehensive Excel file with multiple worksheets and formatted data.
 *       
 *       **Excel Features:**
 *       - Multiple worksheets (Companies, Summary, Statistics)
 *       - Auto-fitted columns for optimal readability
 *       - Professional styling and formatting
 *       - Comprehensive company data (50+ fields)
 *     tags: [Export]
 *     parameters:
 *       - in: query
 *         name: industry
 *         schema:
 *           type: string
 *         description: Filter by industry
 *         example: "Technology"
 *       - in: query
 *         name: minEmployees
 *         schema:
 *           type: integer
 *         description: Minimum employees
 *         example: 100
 *       - in: query
 *         name: maxEmployees
 *         schema:
 *           type: integer
 *         description: Maximum employees
 *         example: 10000
 *       - in: query
 *         name: minRevenue
 *         schema:
 *           type: integer
 *         description: Minimum revenue in USD
 *         example: 1000000
 *       - in: query
 *         name: maxRevenue
 *         schema:
 *           type: integer
 *         description: Maximum revenue in USD
 *         example: 1000000000
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filter by country
 *         example: "United States"
 *       - in: query
 *         name: publiclyTraded
 *         schema:
 *           type: boolean
 *         description: Public trading status
 *         example: true
 *     responses:
 *       200:
 *         description: Excel file generated successfully
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             description: Attachment filename
 *             schema:
 *               type: string
 *               example: 'attachment; filename="companies-filtered-2024-11-05.xlsx"'
 *       500:
 *         description: Export failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/export/excel', asyncHandler(exportCompaniesExcel));

/**
 * @swagger
 * /api/companies/export/all/excel:
 *   get:
 *     summary: Export All Companies to Excel
 *     description: |
 *       Export complete company database to Excel format.
 *       Includes all companies with full data enrichment details.
 *     tags: [Export]
 *     responses:
 *       200:
 *         description: Complete Excel export generated
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             description: Attachment filename
 *             schema:
 *               type: string
 *               example: 'attachment; filename="companies-complete-2024-11-05.xlsx"'
 *       500:
 *         description: Export failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/export/all/excel', asyncHandler(exportAllCompaniesExcel));

/**
 * @swagger
 * /api/companies/export/csv:
 *   get:
 *     summary: Export Companies to CSV
 *     description: |
 *       Export companies to CSV format with filtering options.
 *       Standard comma-separated format compatible with Excel, Google Sheets, and data analysis tools.
 *     tags: [Export]
 *     parameters:
 *       - in: query
 *         name: industry
 *         schema:
 *           type: string
 *         description: Filter by industry
 *         example: "Technology"
 *       - in: query
 *         name: minEmployees
 *         schema:
 *           type: integer
 *         description: Minimum employees
 *         example: 100
 *       - in: query
 *         name: maxEmployees
 *         schema:
 *           type: integer
 *         description: Maximum employees
 *         example: 10000
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filter by country
 *         example: "United States"
 *     responses:
 *       200:
 *         description: CSV file generated successfully
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             description: Attachment filename
 *             schema:
 *               type: string
 *               example: 'attachment; filename="companies-2024-11-05.csv"'
 *       500:
 *         description: Export failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/export/csv', asyncHandler(exportCompaniesCSV));

/**
 * @swagger
 * /api/companies/export/selected/excel:
 *   post:
 *     summary: Export selected companies to Excel file
 *     description: Export specific companies by their IDs to an Excel file with comprehensive data and summary statistics.
 *     tags:
 *       - Companies Export
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyIds
 *             properties:
 *               companyIds:
 *                 type: array
 *                 description: Array of company IDs to export
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 maxItems: 500
 *                 example: ["cm3e2rf1k0001gzq8zq8zq8zq", "cm3e2rf1k0002gzq8zq8zq8zr"]
 *           examples:
 *             selected-companies:
 *               summary: Export selected companies
 *               value:
 *                 companyIds: ["cm3e2rf1k0001gzq8zq8zq8zq", "cm3e2rf1k0002gzq8zq8zq8zr", "cm3e2rf1k0003gzq8zq8zq8zs"]
 *     responses:
 *       200:
 *         description: Excel file download
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             description: Attachment filename
 *             schema:
 *               type: string
 *               example: 'attachment; filename="selected_companies_3_2024-11-08.xlsx"'
 *       400:
 *         description: Invalid request (missing or invalid company IDs)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: No companies found with provided IDs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Export failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/export/selected/excel', optionalAuth, asyncHandler(exportSelectedCompaniesExcel));

// Debug route to test if this section is working
router.post('/debug-test', optionalAuth, asyncHandler(async (req, res) => {
  res.json({ message: 'Debug route working', timestamp: new Date().toISOString() });
}));

/**
 * @swagger
 * /api/companies/bulk:
 *   delete:
 *     summary: Bulk delete selected companies
 *     description: Delete multiple companies by their IDs in a single atomic transaction. All deletions succeed or fail together.
 *     tags:
 *       - Companies Management
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyIds
 *             properties:
 *               companyIds:
 *                 type: array
 *                 description: Array of company IDs to delete
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 maxItems: 500
 *                 example: ["cm3e2rf1k0001gzq8zq8zq8zq", "cm3e2rf1k0002gzq8zq8zq8zr"]
 *           examples:
 *             bulk-delete:
 *               summary: Delete selected companies
 *               value:
 *                 companyIds: ["cm3e2rf1k0001gzq8zq8zq8zq", "cm3e2rf1k0002gzq8zq8zq8zr", "cm3e2rf1k0003gzq8zq8zq8zs"]
 *     responses:
 *       200:
 *         description: Companies deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Successfully deleted 3 companies"
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedCount:
 *                       type: number
 *                       description: Number of companies actually deleted
 *                       example: 3
 *                     requestedCount:
 *                       type: number
 *                       description: Number of companies requested for deletion
 *                       example: 3
 *       400:
 *         description: Invalid request (missing or invalid company IDs)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: No companies found with provided IDs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Bulk deletion failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/bulk', optionalAuth, asyncHandler(bulkDeleteCompanies));

export default router;