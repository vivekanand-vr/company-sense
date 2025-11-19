# Job-Based Bulk Company Lookup API

This document describes the new job-based API endpoints for bulk company lookups with real-time progress monitoring.

## Overview

The bulk company lookup feature has been enhanced to support background processing with job management. This allows:

1. **Immediate Response**: Start jobs instantly and get a job ID
2. **Real-time Monitoring**: Poll job status and get live progress updates
3. **Better UX**: Users see live logs and progress instead of waiting for completion
4. **Scalability**: Handle large batches without timeout issues

## API Endpoints

### 1. Start Bulk Lookup Job (New Behavior)

```http
POST /api/companies/bulk-lookup
Content-Type: application/json

{
  "companies": ["Apple Inc", "Microsoft Corporation", "Google LLC"],
  "filters": {
    "turnover": "1000-5000",
    "headcount": "1001-5000",
    "type": "technology"
  }
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "message": "Bulk lookup job started successfully",
  "data": {
    "jobId": "550e8400-e29b-41d4-a716-446655440000",
    "companiesCount": 3,
    "appliedFilters": {
      "turnover": "1000-5000",
      "headcount": "1001-5000",
      "type": "technology"
    },
    "statusEndpoint": "/api/companies/jobs/550e8400-e29b-41d4-a716-446655440000/status"
  }
}
```

### 2. Synchronous Bulk Lookup (Backward Compatibility)

```http
POST /api/companies/bulk-lookup-sync
Content-Type: application/json
```
Uses the same request format as above but waits for completion before returning results.

### 3. Get Job Details with Messages (Recommended for Polling)

```http
GET /api/companies/jobs/{jobId}?messagesSince=0
```

**Response:**
```json
{
  "success": true,
  "data": {
    "job": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "bulk_lookup",
      "status": "running",
      "progress": {
        "total": 3,
        "completed": 1,
        "successful": 1,
        "failed": 0,
        "current": "Microsoft Corporation"
      },
      "createdAt": "2024-01-01T10:00:00Z",
      "startedAt": "2024-01-01T10:00:01Z",
      "completedAt": null,
      "result": null,
      "error": null
    },
    "messages": {
      "items": [
        {
          "timestamp": "2024-01-01T10:00:01Z",
          "level": "info",
          "message": "Job created with 3 items to process"
        },
        {
          "timestamp": "2024-01-01T10:00:02Z",
          "level": "info",
          "message": "Job started processing"
        },
        {
          "timestamp": "2024-01-01T10:00:05Z",
          "level": "info",
          "message": "Processing company 1/3",
          "companyName": "Apple Inc"
        },
        {
          "timestamp": "2024-01-01T10:00:08Z",
          "level": "info",
          "message": "🔍 Searching Google for official website",
          "companyName": "Apple Inc"
        },
        {
          "timestamp": "2024-01-01T10:00:12Z",
          "level": "success",
          "message": "✅ Found official website: apple.com",
          "companyName": "Apple Inc"
        },
        {
          "timestamp": "2024-01-01T10:00:15Z",
          "level": "info",
          "message": "🚀 Enriching data with Apollo API",
          "companyName": "Apple Inc"
        },
        {
          "timestamp": "2024-01-01T10:00:25Z",
          "level": "success",
          "message": "✅ Apollo data retrieved (147000 employees)",
          "companyName": "Apple Inc"
        },
        {
          "timestamp": "2024-01-01T10:00:28Z",
          "level": "info",
          "message": "🤖 Enhancing data with ChatGPT AI",
          "companyName": "Apple Inc"
        },
        {
          "timestamp": "2024-01-01T10:00:45Z",
          "level": "success",
          "message": "✅ ChatGPT enrichment completed",
          "companyName": "Apple Inc"
        },
        {
          "timestamp": "2024-01-01T10:00:48Z",
          "level": "success",
          "message": "💾 Company data saved to database",
          "companyName": "Apple Inc"
        },
        {
          "timestamp": "2024-01-01T10:00:49Z",
          "level": "success",
          "message": "✅ Company processed and meets criteria",
          "companyName": "Apple Inc",
          "metadata": {
            "dataSource": "google_apollo_chatgpt",
            "processingTime": "44000ms"
          }
        }
      ],
      "hasMore": true,
      "lastIndex": 10
    }
  }
}
```

### 4. Get Job Status Only

```http
GET /api/companies/jobs/{jobId}/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "progress": {
      "total": 3,
      "completed": 3,
      "successful": 2,
      "failed": 1
    },
    "createdAt": "2024-01-01T10:00:00Z",
    "startedAt": "2024-01-01T10:00:01Z",
    "completedAt": "2024-01-01T10:03:15Z",
    "result": {
      "results": [...],
      "summary": {
        "total": 3,
        "successful": 2,
        "failed": 1,
        "meetsFilterCriteria": 2
      }
    }
  }
}
```

### 5. Get Job Messages Only

```http
GET /api/companies/jobs/{jobId}/messages?since=5
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "timestamp": "2024-01-01T10:02:00Z",
        "level": "info",
        "message": "Processing company 2/3",
        "companyName": "Microsoft Corporation"
      }
    ],
    "hasMore": true,
    "lastIndex": 15
  }
}
```

### 6. List All Jobs (Admin)

```http
GET /api/companies/jobs
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "type": "bulk_lookup",
        "status": "completed",
        "progress": {
          "total": 3,
          "completed": 3,
          "successful": 2,
          "failed": 1
        },
        "createdAt": "2024-01-01T10:00:00Z",
        "startedAt": "2024-01-01T10:00:01Z",
        "completedAt": "2024-01-01T10:03:15Z",
        "messageCount": 25
      }
    ],
    "statistics": {
      "total": 5,
      "running": 1,
      "completed": 3,
      "failed": 1,
      "pending": 0
    }
  }
}
```

### 7. Cancel Job

```http
DELETE /api/companies/jobs/{jobId}
```

**Response:**
```json
{
  "success": true,
  "message": "Job cancelled successfully"
}
```

## Job States

- **pending**: Job created but not started yet
- **running**: Job is actively processing companies
- **completed**: Job finished successfully with results
- **failed**: Job encountered an error and stopped

## Message Levels

- **info**: General information and progress updates
- **success**: Successful operations (with ✅ emoji)
- **warning**: Non-critical issues (with ⚠️ emoji)
- **error**: Failures and errors (with ❌ emoji)

## Polling Recommendations

1. **Poll Frequency**: Every 2-3 seconds for active jobs
2. **Message Pagination**: Use `messagesSince` parameter to get only new messages
3. **Auto-stop**: Stop polling when job status is `completed` or `failed`
4. **Error Handling**: Handle network errors gracefully and retry

## Implementation Notes

1. **Backward Compatibility**: Existing `/bulk-lookup` route now returns job ID immediately
2. **Synchronous Option**: Use `/bulk-lookup-sync` for legacy behavior
3. **Memory Management**: Job data is automatically cleaned up after 24 hours
4. **Rate Limiting**: 1-second delay between company lookups to respect API limits

## Example Frontend Usage

```typescript
// Start job
const response = await fetch('/api/companies/bulk-lookup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ companies: ['Apple', 'Microsoft'] })
});
const { data } = await response.json();
const jobId = data.jobId;    

// Poll for updates
const pollJob = async () => {
  const response = await fetch(`/api/companies/jobs/${jobId}`);
  const { data } = await response.json();
  
  console.log('Progress:', data.job.progress);
  console.log('New messages:', data.messages.items);
  
  if (data.job.status === 'completed') {
    console.log('Results:', data.job.result);
    return; // Stop polling
  }
  
  setTimeout(pollJob, 2000); // Poll every 2 seconds
};

pollJob();
```

This job-based system provides a much better user experience for bulk operations while maintaining backward compatibility with existing integrations.