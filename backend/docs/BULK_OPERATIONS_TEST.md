# Test New Bulk Operations Endpoints

## Test 1: Validation with Empty Request
```bash
# Test export endpoint validation
curl -X POST "http://localhost:8000/api/companies/export/selected/excel" \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected: 400 Bad Request with validation error
```

## Test 2: Validation with Invalid Company IDs
```bash
# Test export with invalid format
curl -X POST "http://localhost:8000/api/companies/export/selected/excel" \
  -H "Content-Type: application/json" \
  -d '{
    "companyIds": ["invalid-id"]
  }'

# Expected: 500 Error - No companies found
```

## Test 3: Bulk Delete Validation
```bash
# Test delete endpoint validation
curl -X DELETE "http://localhost:8000/api/companies/bulk" \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected: 400 Bad Request with validation error
```

## Test 4: Get Company IDs for Real Testing
```bash
# First, get some real company IDs
curl "http://localhost:8000/api/companies?limit=3"

# Use the returned IDs in the following tests
```

## Test 5: Real Export Test (Replace with actual IDs)
```bash
# Replace the IDs with real ones from Test 4
curl -X POST "http://localhost:8000/api/companies/export/selected/excel" \
  -H "Content-Type: application/json" \
  -d '{
    "companyIds": ["REPLACE-WITH-REAL-ID"]
  }' \
  --output "test-export.xlsx"

# Expected: Excel file download
```

## Test 6: Real Delete Test (Replace with actual IDs) 
```bash
# WARNING: This will actually delete companies!
# Replace with a test company ID you can afford to lose
curl -X DELETE "http://localhost:8000/api/companies/bulk" \
  -H "Content-Type: application/json" \
  -d '{
    "companyIds": ["REPLACE-WITH-REAL-ID"]
  }'

# Expected: Success message with deletion count
```

## Features Implemented:
✅ POST /api/companies/export/selected/excel - Export selected companies by IDs  
✅ DELETE /api/companies/bulk - Bulk delete companies by IDs  
✅ Zod validation for company IDs arrays  
✅ Atomic transaction for bulk delete  
✅ Comprehensive error handling  
✅ Proper Excel export with summary worksheets  
✅ Swagger documentation for both endpoints  
✅ Updated API_GUIDE.md and README.md documentation  

## Frontend Integration:
The new endpoints are perfect for checkbox selection features:

1. User browses companies and selects them via checkboxes
2. Frontend collects selected company IDs 
3. For export: POST to /api/companies/export/selected/excel with IDs array
4. For delete: DELETE to /api/companies/bulk with IDs array

Both operations validate IDs, handle errors gracefully, and provide detailed responses.