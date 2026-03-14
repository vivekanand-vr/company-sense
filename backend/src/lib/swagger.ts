import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Company Sense API',
      version: '1.0.0',
      description: 'AI-powered company intelligence and data enrichment API',
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://your-production-url.com' 
          : 'http://localhost:8000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      schemas: {
        Company: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique company identifier' },
            name: { type: 'string', description: 'Company name' },
            domain: { type: 'string', description: 'Primary domain' },
            website: { type: 'string', description: 'Website URL' },
            description: { type: 'string', description: 'Company description' },
            industry: { type: 'string', description: 'Primary industry' },
            employees: { type: 'number', description: 'Number of employees' },
            revenue: { type: 'number', description: 'Annual revenue in USD' },
            foundedYear: { type: 'number', description: 'Year founded' },
            publiclyTraded: { type: 'boolean', description: 'Is publicly traded' },
            stockSymbol: { type: 'string', description: 'Stock symbol' },
            phone: { type: 'string', description: 'Phone number' },
            address: { type: 'string', description: 'Company address' },
            linkedinUrl: { type: 'string', description: 'LinkedIn URL' },
            twitterUrl: { type: 'string', description: 'Twitter URL' },
            facebookUrl: { type: 'string', description: 'Facebook URL' },
            technologies: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Technologies used'
            },
            dataSource: { type: 'string', description: 'Data sources used' },
            lastUpdated: { type: 'string', format: 'date-time', description: 'Last updated timestamp' },
            isVerified: { type: 'boolean', description: 'Is data verified' }
          }
        },
        LookupRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { 
              type: 'string', 
              minLength: 2, 
              maxLength: 255,
              description: 'Company name to search for'
            },
            hints: {
              type: 'object',
              properties: {
                turnover: {
                  type: 'string',
                  enum: ['1-10', '10-50', '50-100', '100-500', '500-1000', '1000-5000', '5000+', 'custom'],
                  description: 'Expected turnover range in millions USD'
                },
                turnoverCustom: { type: 'number', description: 'Custom turnover value' },
                headcount: {
                  type: 'string',
                  enum: ['1-10', '11-50', '51-100', '101-250', '251-500', '501-1000', '1001-5000', '5001-10000', '10000+', 'custom'],
                  description: 'Expected employee count range'
                },
                headcountCustom: { type: 'number', description: 'Custom headcount value' },
                type: {
                  type: 'string',
                  enum: ['ecommerce', 'education', 'health', 'fintech', 'saas', 'manufacturing', 'other'],
                  description: 'Company type/industry'
                },
                typeCustom: { type: 'string', description: 'Custom company type' }
              }
            }
          }
        },
        LookupResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', description: 'Success status' },
            data: {
              type: 'object',
              properties: {
                company: { $ref: '#/components/schemas/Company' },
                meetsFilterCriteria: { type: 'boolean', description: 'Whether company meets filter criteria' },
                filterAnalysis: { type: 'object', description: 'Filter analysis results' }
              }
            },
            processingTimeMs: { type: 'number', description: 'Processing time in milliseconds' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', description: 'Error message' },
            processingTimeMs: { type: 'number', description: 'Processing time in milliseconds' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJSDoc(options);

export const setupSwagger = (app: Express): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Company Sense API Documentation'
  }));
  
  // Also serve the raw JSON spec
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};

export default specs;