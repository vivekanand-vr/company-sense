# Company Sense Platform - Frontend

A modern Next.js application for extracting and analyzing comprehensive business intelligence from company names. This frontend provides an intuitive interface for single company lookups and bulk processing of company data.

## Overview

The Company Sense Platform frontend is built with Next.js 14+ and React, offering a clean and responsive interface for company research. Users can search individual companies or upload CSV/Excel files for bulk processing, with real-time results display and advanced filtering capabilities.

## Features

- **Single Company Search**: Real-time company information extraction with detailed results
- **Advanced Bulk File Processing**: Upload CSV/Excel files with enhanced processing controls
  - **Smart Chunking**: Process files in configurable chunks (10, 20, 60, 80, 100, 200 records)
  - **Offset Processing**: Start processing from any record position
  - **Custom Range Selection**: Process specific record ranges (1-based indexing)
  - **Dynamic Upload Controls**: Real-time preview of selected records
- **Multi-Sheet Excel Support**: Automatic sheet detection and selection for Excel files
- **Intelligent Column Mapping**: Auto-detection of company name columns with manual override
- **Advanced Filtering**: Filter companies by revenue, employee count, industry type, location, and keywords
- **Companies Database Browser**: Dedicated page for browsing and managing company data
  - **Debounced Search**: Efficient search with 1-second delay
  - **Advanced Filtering**: Industry, employee count, revenue, country filters
  - **Pagination**: Navigate through large datasets
  - **Export Capabilities**: Export filtered results to Excel format
- **Real-time Job Monitoring**: WebSocket-powered live progress tracking with automatic fallback to REST API
- **Real-time Results**: Live display of company data with confidence scores and source tracking
- **File Format Support**: CSV, XLSX, and XLS file formats with intelligent column detection
- **Responsive Design**: Mobile-first design with Tailwind CSS and dark theme
- **Type Safety**: Full TypeScript implementation with Zod validation
- **Error Handling**: Comprehensive error handling with user-friendly messages

## Enhanced Bulk Upload System

The bulk upload system provides advanced control over how company data is processed from uploaded files.

### Upload Modes

#### 1. **Process All Records** (Default)
```typescript
// Processes entire file
uploadMode: 'all'
// Result: All companies in file are processed
```

#### 2. **Process in Chunks**
```typescript
// Configure chunk processing
uploadMode: 'chunk'
chunkSize: 20        // Records per chunk
offset: 100          // Starting position

// Result: Processes records 101-120 (20 companies)
```

#### 3. **Custom Range Selection**
```typescript
// Process specific range (1-based indexing)
uploadMode: 'custom'
customStart: 25      // Start at record 25
customEnd: 75        // End at record 75

// Result: Processes records 25-75 (51 companies)
// Maximum gap: 200 records
```

### Key Features

- **Dynamic Button Text**: Shows exact number of companies to be processed
- **Real-time Validation**: Input bounds checking and range validation
- **Smart Defaults**: Intelligent default values for quick setup
- **Preview Display**: Shows which records will be processed before upload
- **Error Prevention**: Validates ranges and prevents invalid configurations

### Usage Examples

#### Testing with Small Batches
1. Upload Excel file with 1000 companies
2. Select "Process in Chunks"
3. Set chunk size: 10, offset: 0
4. Process companies 1-10 for testing

#### Processing Specific Segments
1. Select "Custom Range"
2. Set range: 250-300
3. Process exactly companies 250-300 (51 companies)

#### Gradual Processing
1. Select "Process in Chunks"
2. Set chunk size: 100, offset: 500
3. Process companies 501-600
4. Repeat with different offsets for batched processing

## Project Structure

```
company-sense-ui/
├── app/                          # Next.js App Router
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout component
│   ├── page.tsx                 # Main application page (Search & Bulk Upload)
│   ├── companies/               # Companies database browser
│   │   └── page.tsx            # Companies listing with advanced filtering
│   ├── jobs/                    # Real-time job monitoring
│   │   └── [id]/
│   │       └── page.tsx        # WebSocket job status page
│   └── api/                     # API routes (proxy to backend)
│       └── companies/
│           ├── lookup/
│           │   └── route.ts     # Single company lookup proxy
│           └── bulk/
│               └── route.ts     # Bulk processing proxy
├── components/                   # React components
│   ├── companies/               # Companies database components
│   │   ├── CompaniesTable.tsx  # Companies listing table
│   │   └── CompaniesFilters.tsx # Advanced filtering interface
│   ├── jobs/                    # Real-time job monitoring components
│   │   ├── JobProgressIndicator.tsx  # Live progress display
│   │   ├── JobLogs.tsx         # Real-time activity logs
│   │   ├── JobResults.tsx      # Job completion results
│   │   └── WebSocketStatus.tsx # Connection status indicator
│   ├── results/                 # Result display components
│   │   ├── ProgressIndicator.tsx
│   │   └── ResultsTable.tsx
│   ├── search/                  # Search and filter components
│   │   ├── OptionalFilters.tsx
│   │   └── SearchBar.tsx
│   ├── ui/                      # Reusable UI components (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── progress.tsx
│   │   ├── select.tsx
│   │   └── table.tsx
│   └── upload/                  # File upload components
│       └── BulkUploadDialog.tsx
├── hooks/                       # Custom React hooks
│   └── useJobMonitor.ts        # WebSocket job monitoring hook
├── lib/                         # Utility libraries
│   ├── api.ts                   # Main API client functions
│   ├── companies-api.ts         # Companies database API functions
│   ├── utils.ts                 # General utilities
│   └── parsing/                 # File parsing utilities
│       └── csv.ts               # CSV/Excel parsing logic
├── types/                       # TypeScript type definitions
│   └── company.ts               # Company data types and schemas
├── public/                      # Static assets
├── components.json              # shadcn/ui configuration
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies and scripts
```

## Core Components

### Main Application (`app/page.tsx`)
The main page orchestrates the entire application flow:
- Manages global state for filters, results, and loading states
- Handles single company lookups and bulk processing
- Coordinates between search, filter, and result components

### Search Components

#### SearchBar (`components/search/SearchBar.tsx`)
- Company name input with form validation
- Real-time search capability
- Integration with global filters
- Loading state management

#### OptionalFilters (`components/search/OptionalFilters.tsx`)
- Expandable filter panel with advanced options
- Revenue range selection (1M - 5B+)
- Employee count filtering
- Industry type selection with custom options
- Location and keyword filtering
- Form state management with react-hook-form

### Upload Component

#### BulkUploadDialog (`components/upload/BulkUploadDialog.tsx`)
- **File Upload Interface**: Drag-and-drop support for CSV and Excel files
- **Multi-Sheet Excel Support**: Automatic sheet detection with manual selection
- **Intelligent Column Mapping**: Auto-detection of company name columns
- **Advanced Processing Controls**:
  - **All Records Mode**: Process entire file
  - **Chunk Mode**: Configurable chunk sizes (10-200 records) with offset control
  - **Custom Range Mode**: Precise record selection with 1-based indexing
- **Real-time Preview**: Shows first 10 entries and total count
- **Dynamic Upload Button**: Displays exact number of companies to be processed
- **Input Validation**: Range checking, maximum limits (200 records), and error prevention
- **Smart Defaults**: Intelligent default values for quick configuration

### Companies Database Components

#### CompaniesTable (`components/companies/CompaniesTable.tsx`)
- **Paginated Data Display**: Efficient rendering of large company datasets
- **Company Information**: Logo display, social media links, revenue formatting
- **Enhanced Presentation**: Employee count formatting, confidence scores
- **Interactive Elements**: Clickable website links, external link icons
- **Pagination Controls**: Navigation through multiple pages of results

#### CompaniesFilters (`components/companies/CompaniesFilters.tsx`)
- **Advanced Filtering Interface**: Industry, country, employee/revenue range filters
- **Active Filter Display**: Shows currently applied filters with clear indicators
- **Select Component Integration**: Proper validation with non-empty value handling
- **Dynamic Updates**: Real-time filter application with instant results

### Result Components

#### ResultsTable (`components/results/ResultsTable.tsx`)
- **Enhanced Data Display**: Comprehensive company information with rich formatting
- **Export Functionality**: Export to Excel with complete data (not just UI fields)
- **Contact Information**: Phone, email, address display with proper icons
- **Financial Data**: Revenue and employee count with proper formatting
- **Confidence Indicators**: Visual confidence score representation
- **Social Media Integration**: LinkedIn, Twitter, Facebook, blog links

#### ProgressIndicator (`components/results/ProgressIndicator.tsx`)
- Loading state visualization
- Progress tracking for bulk operations
- Error state handling

## Type System

### Core Types (`types/company.ts`)

The application uses a comprehensive type system with Zod validation:

#### Filter Types
```typescript
type Filters = {
  turnover?: "1-10" | "10-50" | "50-100" | "100-500" | "500-1000" | "1000-5000" | "5000+" | "custom";
  turnoverCustom?: number;
  headcount?: "1-10" | "11-50" | "51-100" | "101-250" | "251-500" | "501-1000" | "1001-5000" | "5001-10000" | "10000+" | "custom";
  headcountCustom?: number;
  type?: "ecommerce" | "education" | "health" | "fintech" | "saas" | "technology" | "manufacturing" | "other";
  typeCustom?: string;
  location?: string;
  keywords?: string[];
}
```

#### Company Data Types
```typescript
type CompanyData = {
  id?: string;
  name: string;
  domain?: string;
  website?: string;
  description?: string;
  industry?: string;
  foundedYear?: number;
  confidence?: number;
  revenue?: number;
  revenueUSD?: number;
  originalCurrency?: string;
  revenueRange?: string;
  employees?: number;
  employeeRange?: string;
  contact?: {
    phone?: string;
    email?: string;
  };
  location?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  socialUrls?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  businessModel?: string;
  keyProducts?: string[];
  parentCompany?: string | null;
  subsidiaries?: string[];
  publiclyTraded?: boolean;
  stockSymbol?: string;
  ceo?: string;
  // ... additional fields
}
```

## Data Flow

### Single Company Lookup
1. User enters company name in SearchBar
2. Optional filters are applied from OptionalFilters component
3. API call made to backend via `lookupCompany()` function
4. Response converted to legacy format for table display
5. Results displayed in ResultsTable with confidence scores

### Bulk Processing with Real-time Monitoring
1. User uploads CSV/Excel file via BulkUploadDialog
2. File parsed locally using `parseCSV()` or `parseExcel()`
3. Column mapping interface for company name selection
4. Preview shows first 10 companies, but all data sent to backend
5. Bulk API call made via `bulkLookup()` function returns job ID immediately
6. User redirected to `/jobs/[id]` page for real-time monitoring
7. WebSocket connection established using `useJobMonitor` hook
8. Real-time updates received for job progress, messages, and completion
9. Live activity logs and progress indicators updated in real-time
10. Final results displayed upon job completion with comprehensive statistics

## Real-time Job Monitoring System

The application features a sophisticated WebSocket-based job monitoring system for tracking bulk processing operations in real-time.

### WebSocket Implementation

#### Job Monitoring Hook (`hooks/useJobMonitor.ts`)
- **Real-time Connection Management**: Automatic WebSocket connection with Socket.IO
- **Event-driven Updates**: Live job progress, status changes, and activity messages
- **Automatic Fallback**: Graceful degradation to REST API polling if WebSocket fails
- **Connection Recovery**: Auto-reconnection with exponential backoff strategy
- **Type-safe Events**: Fully typed WebSocket events and job state management

#### Key Features
- **Live Progress Tracking**: Real-time progress bars showing completion status
- **Activity Logs**: Streaming activity messages with timestamps and log levels
- **Connection Status**: Visual indicators for WebSocket connection state
- **Error Handling**: Comprehensive error recovery and user feedback
- **Job Lifecycle Management**: Complete job state from creation to completion

#### WebSocket Events
```typescript
// Job progress updates
'job-progress': { jobId: string; progress: JobProgress }

// Activity messages  
'job-message': { jobId: string; message: JobMessage }

// Job status changes
'job-update': { jobId: string; job: Job }

// Job completion
'job-completed': { jobId: string; job: Job }
```

### Job Monitoring Components

#### JobProgressIndicator (`components/jobs/JobProgressIndicator.tsx`)
- **Live Progress Display**: Real-time progress bars and completion percentages
- **Status Visualization**: Color-coded job status indicators
- **Connection Status**: WebSocket connection health indicators
- **Manual Controls**: Refresh and reconnection capabilities

#### JobLogs (`components/jobs/JobLogs.tsx`)
- **Streaming Activity Logs**: Real-time activity messages with auto-scroll
- **Log Level Filtering**: Filter by info, success, warning, error levels
- **Timestamp Display**: Precise timing for all job activities
- **Auto-refresh**: Live updates without page reload

#### WebSocketStatus (`components/jobs/WebSocketStatus.tsx`)
- **Connection Indicators**: Live, Connecting, Offline, Error states
- **Fallback Mode Display**: Shows when using REST API fallback
- **Reconnection Controls**: Manual reconnection capabilities
- **Status Descriptions**: Clear connection status messaging

### File Processing Logic

#### CSV Processing (`lib/parsing/csv.ts`)
- Uses Papa Parse library for robust CSV parsing
- Header detection and validation
- Empty row filtering
- Error handling for malformed files

#### Excel Processing (`lib/parsing/csv.ts`)
- Uses xlsx library for Excel file support
- Multi-sheet detection and selection
- Column header normalization
- Data type preservation and conversion

## API Integration

### Client Functions (`lib/api.ts`)
- `lookupCompany()`: Single company research
- `bulkLookup()`: Bulk company processing
- Response transformation for backward compatibility
- Error handling and timeout management

### API Routes (`app/api/`)
- Proxy routes to backend API
- Request validation with Zod schemas
- Error transformation and logging
- Timeout configuration for long-running requests

## State Management

The application uses React's built-in state management:
- Component-level state for UI interactions
- Global state lifted to main page component
- Form state managed with react-hook-form
- Loading states coordinated across components

## Styling and UI

### Design System
- **Framework**: Tailwind CSS for utility-first styling
- **Components**: shadcn/ui for consistent UI components
- **Icons**: Lucide React for modern iconography
- **Layout**: Responsive grid system with mobile-first approach

### Theme
- Clean, modern interface with subtle shadows and borders
- Consistent spacing using Tailwind's spacing scale
- Accessible color palette with proper contrast ratios
- Loading states and micro-interactions for better UX

## Development

### Prerequisites
- Node.js 18+ and npm
- Backend API running on specified URL

### Setup
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your backend URL

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables
```env
BACKEND_API_URL=http://localhost:8000              # Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000/api  # Public backend URL
NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:8000    # WebSocket server URL
```

### Key Scripts
- `npm run dev`: Development server with hot reload
- `npm run build`: Production build
- `npm run start`: Start production server
- `npm run lint`: ESLint code checking
- `npm run type-check`: TypeScript type checking

## Configuration Files

### Next.js Configuration (`next.config.ts`)
- API timeout configurations
- Build optimizations
- External package configurations

### TypeScript Configuration (`tsconfig.json`)
- Strict type checking enabled
- Path aliases for clean imports
- Modern ES features support

### Tailwind Configuration (`tailwind.config.ts`)
- Custom color palette
- Component class extensions
- Responsive breakpoint customization

## Testing and Quality

### Type Safety
- Full TypeScript implementation
- Zod runtime validation
- Strict compiler settings

### Error Handling
- Comprehensive error boundaries
- User-friendly error messages
- API error transformation
- File parsing error handling

### Performance
- Next.js automatic optimizations
- Component code splitting
- Image optimization
- Static generation where possible

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- Progressive enhancement approach
- Graceful degradation for older browsers

## Contributing

1. Follow TypeScript strict mode
2. Use existing component patterns
3. Maintain responsive design principles
4. Add proper error handling
5. Update type definitions for new features
6. Test with various file formats for upload functionality
