# Test Suite Documentation

This project includes a comprehensive test suite using **Vitest** with automated logging and proper test organization.

## Available Test Commands

```bash
# Run all tests (one-time execution)
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with UI interface
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

### Test Files Location: `src/test/`

1. **`setup.ts`** - Test environment configuration and logging setup
2. **`utils.test.ts`** - Environment validation and utility function tests
3. **`apollo.test.ts`** - Apollo.io API integration tests
4. **`api.test.ts`** - Full API endpoint integration tests
5. **`company.service.test.ts`** - Company service unit tests

## Test Categories

### Unit Tests
- **Company Service Tests** - Tests the business logic layer
- **Utility Function Tests** - Tests helper functions and data parsing
- **Environment Validation** - Ensures all required environment variables are present

### Integration Tests
- **Apollo API Tests** - Tests real Apollo.io API connectivity
- **API Endpoint Tests** - Tests all REST API endpoints (requires server to be running)
- **Database Tests** - Tests database operations and queries

### API Tests
- **Company Lookup API** - Single and bulk company lookups
- **Companies List API** - Filtering, pagination, searching
- **Export API** - Excel and CSV export functionality
- **Swagger Documentation** - API documentation endpoints
- **Health Check** - System status monitoring

## Test Results & Logging

### Console Output
- Clean test results showing pass/fail status
- Performance metrics (memory usage, execution time)
- Clear success/warning/error indicators

### Log Files
All detailed test information is logged to:
- **Test Logs**: `logs/test-results.log`
- **JSON Report**: `logs/test-results.json`

### Log Content Includes:
- Test execution timestamps
- Detailed API responses
- Error messages and stack traces
- Performance metrics
- Environment configuration status

## Test Scenarios

### Passing Tests (No Server Required)
- Environment variable validation
- Apollo.io API authentication
- Utility function validation
- Data structure validation
- Company service mocking

### Conditional Tests (Require Running Server)
- API endpoint testing
- Database integration testing
- Export functionality testing
- Swagger documentation testing

## Running Tests

### 1. Basic Test Run
```bash
npm test
```
**Output**: Console shows test results, detailed logs saved to files

### 2. Development Mode
```bash
npm run test:watch
```
**Output**: Tests re-run automatically when files change

### 3. With Coverage
```bash
npm run test:coverage
```
**Output**: Includes code coverage reports

### 4. Test Specific Files
```bash
npx vitest run src/test/apollo.test.ts
npx vitest run src/test/utils.test.ts
```

## Test Configuration

### Environment Variables Required for Full Testing:
- `DATABASE_URL` - Database connection
- `GOOGLE_API_KEY` - Google Search API
- `GOOGLE_SEARCH_ENGINE_ID` - Google Search Engine ID
- `APOLLO_API_KEY` - Apollo.io API key
- `OPENAI_API_KEY` - OpenAI API key

### Test Behavior:
- **Missing Env Vars**: Tests show warnings but continue
- **Server Not Running**: API tests are skipped with warnings
- **API Failures**: Tests log errors but don't crash the suite

## Reading Test Results

### Console Output Format:
```
✓ Test Name - Passed
⚠ Test Name - Skipped (with reason)
× Test Name - Failed (with error details)
```

### Log File Format:
```
[2025-11-06T07:44:23.209Z] [INFO] ✓ Test passed successfully
[2025-11-06T07:44:23.210Z] [ERROR] ✗ Test failed with error
[2025-11-06T07:44:23.211Z] [INFO] ⚠ Test skipped due to missing dependency
```

## Test Development

### Adding New Tests:
1. Create test file in `src/test/` with `.test.ts` extension
2. Use Vitest syntax: `describe()`, `it()`, `expect()`
3. Add console.log statements for detailed output
4. Tests automatically logged to files

### Test Best Practices:
- Use descriptive test names
- Include console.log for important test milestones
- Mock external dependencies appropriately
- Handle missing environment gracefully
- Test both success and failure scenarios

## Troubleshooting

### Common Issues:

1. **Tests Skipped**: Server not running
   - **Solution**: Start the server with `npm run dev`

2. **Apollo API Tests Fail**: Missing API key
   - **Solution**: Add `APOLLO_API_KEY` to `.env` file

3. **Database Tests Fail**: Database not connected
   - **Solution**: Ensure database is running and `DATABASE_URL` is correct

4. **Import Errors**: TypeScript compilation issues
   - **Solution**: Run `npm run build` to check for syntax errors

### Debug Mode:
```bash
# Run with verbose output
npx vitest run --reporter=verbose

# Run single test file with debugging
npx vitest run src/test/apollo.test.ts --reporter=verbose
```