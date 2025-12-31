# API Reference

## Base URL

All API endpoints are prefixed with `/api`

## Authentication

All API requests require authentication. Include the session cookie in your requests.

## Common Response Format

### Success Response
```json
{
  "data": { ... },
  "pagination": { ... } // If paginated
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

## Schedules API

### List Schedules

**GET** `/api/schedules`

**Query Parameters:**
- `resourceType` (optional): Filter by resource type (REPORT, DASHBOARD, etc.)
- `resourceId` (optional): Filter by resource ID
- `status` (optional): Filter by status (ACTIVE, PAUSED, etc.)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response:**
```json
{
  "data": [
    {
      "id": "schedule-1",
      "name": "Daily Sales Report",
      "resourceType": "REPORT",
      "resourceId": "report-1",
      "frequency": "DAILY",
      "status": "ACTIVE",
      "nextRunAt": "2024-01-15T09:00:00Z",
      "lastRunAt": "2024-01-14T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

### Create Schedule

**POST** `/api/schedules`

**Request Body:**
```json
{
  "name": "Weekly Summary",
  "description": "Weekly summary report",
  "resourceType": "DASHBOARD",
  "resourceId": "dashboard-1",
  "frequency": "WEEKLY",
  "timezone": "UTC",
  "exportFormat": "PDF",
  "includeCharts": true,
  "includeData": true,
  "deliveryChannels": ["EMAIL"],
  "recipients": ["user@example.com"],
  "subject": "Weekly Summary Report"
}
```

**Response:** `201 Created`
```json
{
  "schedule": {
    "id": "schedule-2",
    "name": "Weekly Summary",
    ...
  }
}
```

### Get Schedule

**GET** `/api/schedules/{id}`

**Response:**
```json
{
  "schedule": {
    "id": "schedule-1",
    "name": "Daily Sales Report",
    ...
  }
}
```

### Update Schedule

**PATCH** `/api/schedules/{id}`

**Request Body:** (partial update)
```json
{
  "isActive": false,
  "frequency": "MONTHLY"
}
```

### Delete Schedule

**DELETE** `/api/schedules/{id}`

**Response:** `200 OK`
```json
{
  "success": true
}
```

### Run Schedule Now

**POST** `/api/schedules/{id}/run`

Manually trigger a schedule execution.

**Response:**
```json
{
  "success": true,
  "export": {
    "fileUrl": "/exports/export-123.pdf",
    "fileName": "export-123.pdf"
  },
  "deliveries": [
    {
      "success": true,
      "deliveryId": "delivery-1"
    }
  ]
}
```

## Templates API

### List Marketplace Templates

**GET** `/api/templates/marketplace`

**Query Parameters:**
- `category` (optional): Filter by category
- `type` (optional): Filter by type (DASHBOARD, REPORT, etc.)
- `featured` (optional): Show only featured templates
- `search` (optional): Search query
- `sort` (optional): Sort by (popular, rating, newest, name)
- `limit` (optional): Items per page
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "templates": [
    {
      "id": "template-1",
      "name": "Sales Dashboard",
      "description": "Pre-built sales dashboard",
      "category": "Sales",
      "type": "DASHBOARD",
      "rating": 4.5,
      "usageCount": 150,
      "featured": true
    }
  ],
  "categories": ["Sales", "Marketing", "Finance"],
  "total": 25
}
```

### Get Template Details

**GET** `/api/templates/marketplace/{id}`

**Response:**
```json
{
  "template": {
    "id": "template-1",
    "name": "Sales Dashboard",
    "description": "...",
    "reviews": [
      {
        "id": "review-1",
        "rating": 5,
        "comment": "Great template!",
        "user": {
          "firstName": "John",
          "lastName": "Doe"
        }
      }
    ],
    "_count": {
      "reviews": 10,
      "installations": 150
    }
  }
}
```

### Install Template

**POST** `/api/templates/marketplace/{id}`

**Response:** `201 Created`
```json
{
  "install": {
    "id": "install-1",
    "templateId": "template-1",
    "tenantId": "tenant-1",
    "installedAt": "2024-01-15T10:00:00Z"
  }
}
```

### Create Review

**POST** `/api/templates/marketplace/{id}/reviews`

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Excellent template!",
  "isVerified": true
}
```

## Transformations API

### List Transformations

**GET** `/api/transformations`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page

### Create Transformation

**POST** `/api/transformations`

**Request Body:**
```json
{
  "name": "Clean Sales Data",
  "description": "Remove nulls and format dates",
  "inputDatasetId": "dataset-1",
  "steps": [
    {
      "operator": "FILTER",
      "config": {
        "condition": "amount > 0"
      }
    }
  ]
}
```

### Get Transformation

**GET** `/api/transformations/{id}`

### Update Transformation

**PATCH** `/api/transformations/{id}`

### Delete Transformation

**DELETE** `/api/transformations/{id}`

### Preview Transformation

**POST** `/api/transformations/{id}/preview`

Preview transformation results without saving.

## Error Codes

- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Rate Limiting

API requests are rate limited:
- **Auth endpoints**: 5 requests/minute
- **Standard API**: 60 requests/minute
- **Admin API**: 200 requests/minute

Rate limit headers:
- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (ISO 8601)
- `Retry-After`: Seconds to wait (when exceeded)

## Pagination

Paginated endpoints return:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

## Examples

### Create and Run a Schedule

```javascript
// Create schedule
const schedule = await fetch('/api/schedules', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Daily Report',
    resourceType: 'REPORT',
    resourceId: 'report-1',
    frequency: 'DAILY',
    deliveryChannels: ['EMAIL'],
    recipients: ['user@example.com'],
  }),
})

// Run immediately
await fetch(`/api/schedules/${schedule.id}/run`, {
  method: 'POST',
})
```

### Install Template

```javascript
const install = await fetch('/api/templates/marketplace/template-1', {
  method: 'POST',
})
```

