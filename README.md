# Threat Intelligence Dashboard API

A REST API for threat intelligence analysis, built with NestJS and TypeScript. This API powers a security analyst dashboard for investigating malicious indicators (IPs, domains, file hashes) and understanding relationships between threats.

## Features

- **Indicator Details**: Retrieve comprehensive information about specific threat indicators
- **Advanced Search**: Filter and search indicators with pagination support
- **Campaign Timeline**: Visualize indicators associated with campaigns over time
- **Dashboard Summary**: High-level statistics and active threat overview

## Tech Stack

- **Framework**: NestJS (TypeScript)
- **Database**: SQLite with TypeORM
- **Validation**: class-validator, class-transformer
- **Logging**: Winston with ECS format

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- SQLite3

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

The database schema is already defined in `schema.sql`. To create and seed the database with sample data:

```bash
# Install sqlite3 and uuid for the seed script
npm install --save-dev sqlite3 uuid

# Run the seed script to create and populate the database
node threat-intel/seed-database.js
```

This will create `threat_intel.db` with:
- 10,000 threat indicators (IPs, domains, URLs, file hashes)
- 50 threat actors
- 100 campaigns
- Relationships between indicators, campaigns, and threat actors
- 20,000 observations with timestamps

### 3. Configure Environment

Create a `.env` file in the project root (if not already present):

```env
DATABASE_PATH=threat_intel.db
NODE_ENV=development
LOG_LEVEL=debug
```

### 4. Run the Application

```bash
npm run start:dev
```

The API will be available at `http://localhost:8080`

## API Endpoints

### 1. GET `/api/indicators/:id`

Retrieve detailed information about a specific indicator.

**Response:**
```json
{
  "id": "ind-550e8400-e29b-41d4-a716-446655440000",
  "type": "ip",
  "value": "192.168.1.100",
  "confidence": 85,
  "first_seen": "2024-11-15T10:30:00Z",
  "last_seen": "2024-12-20T14:22:00Z",
  "threat_actors": [
    {
      "id": "actor-123",
      "name": "APT-North",
      "confidence": 90
    }
  ],
  "campaigns": [
    {
      "id": "camp-456",
      "name": "Operation ShadowNet",
      "active": true
    }
  ],
  "related_indicators": [
    {
      "id": "ind-uuid",
      "type": "domain",
      "value": "malicious.example.com",
      "relationship": "same_campaign"
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Indicator found
- `404 Not Found`: Indicator does not exist

---

### 2. GET `/api/indicators/search`

Search and filter indicators with pagination.

**Query Parameters:**
- `type` (optional): Filter by type (`ip`, `domain`, `url`, `hash`)
- `value` (optional): Partial match search on indicator value
- `threat_actor` (optional): Filter by threat actor ID
- `campaign` (optional): Filter by campaign ID
- `first_seen_after` (optional): ISO date filter
- `last_seen_before` (optional): ISO date filter
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20, max: 100)

**Example Request:**
```
GET /api/indicators/search?type=domain&page=1&limit=20
```

**Response:**
```json
{
  "data": [
    {
      "id": "ind-uuid",
      "type": "domain",
      "value": "phishing.example.com",
      "confidence": 75,
      "first_seen": "2024-10-01T08:00:00Z",
      "campaign_count": 2,
      "threat_actor_count": 1
    }
  ],
  "total": 156,
  "page": 1,
  "limit": 20,
  "total_pages": 8
}
```

**Status Codes:**
- `200 OK`: Search successful
- `400 Bad Request`: Invalid query parameters

---

### 3. GET `/api/campaigns/:id/indicators`

Get all indicators associated with a campaign, organized for timeline visualization.

**Query Parameters:**
- `group_by` (optional): Group results by `day` or `week` (default: `day`)
- `start_date` (optional): ISO date filter
- `end_date` (optional): ISO date filter

**Example Request:**
```
GET /api/campaigns/camp-456/indicators?group_by=day
```

**Response:**
```json
{
  "campaign": {
    "id": "camp-456",
    "name": "Operation ShadowNet",
    "description": "Targeted phishing campaign",
    "first_seen": "2024-10-01T00:00:00Z",
    "last_seen": "2024-12-15T00:00:00Z",
    "status": "active"
  },
  "timeline": [
    {
      "period": "2024-10-01",
      "indicators": [
        {
          "id": "ind-uuid",
          "type": "ip",
          "value": "10.0.0.1"
        }
      ],
      "counts": {
        "ip": 5,
        "domain": 3,
        "url": 12,
        "hash": 2
      }
    }
  ],
  "summary": {
    "total_indicators": 234,
    "unique_ips": 45,
    "unique_domains": 67,
    "duration_days": 75
  }
}
```

**Status Codes:**
- `200 OK`: Campaign found
- `404 Not Found`: Campaign does not exist

---

### 4. GET `/api/dashboard/summary`

Provide high-level statistics for the dashboard overview.

**Query Parameters:**
- `time_range` (optional): `24h`, `7d`, or `30d` (default: `7d`)

**Example Request:**
```
GET /api/dashboard/summary?time_range=7d
```

**Response:**
```json
{
  "time_range": "7d",
  "new_indicators": {
    "ip": 145,
    "domain": 89,
    "url": 234,
    "hash": 67
  },
  "active_campaigns": 12,
  "top_threat_actors": [
    {
      "id": "actor-123",
      "name": "APT-North",
      "indicator_count": 456
    }
  ],
  "indicator_distribution": {
    "ip": 3421,
    "domain": 2876,
    "url": 2134,
    "hash": 1569
  }
}
```

**Status Codes:**
- `200 OK`: Summary retrieved successfully

---

## Testing the API

### Using curl

```bash
# Get indicator by ID
curl http://localhost:8080/api/indicators/ind-550e8400-e29b-41d4-a716-446655440000

# Search indicators
curl "http://localhost:8080/api/indicators/search?type=ip&limit=10"

# Get campaign indicators
curl http://localhost:8080/api/campaigns/camp-456/indicators

# Get dashboard summary
curl "http://localhost:8080/api/dashboard/summary?time_range=7d"
```

### Using Postman or Thunder Client

Import the following collection or create requests manually:
- Base URL: `http://localhost:8080`
- All endpoints use GET method
- No authentication required (as per requirements)

## Project Structure

```
threat-intel/
├── dto/                              # Data Transfer Objects
│   ├── campaign-indicators-query.dto.ts
│   ├── campaign-metadata.dto.ts
│   ├── campaign-summary.dto.ts
│   ├── campaign-timeline.dto.ts
│   ├── dashboard-query.dto.ts
│   ├── dashboard-summary.dto.ts
│   ├── indicator-detail.dto.ts
│   ├── indicator-search-item.dto.ts
│   ├── paginated-indicators.dto.ts
│   ├── related-indicator.dto.ts
│   ├── search-indicators-query.dto.ts
│   └── threat-actor-summary.dto.ts
├── threat-intel.controller.ts        # API route handlers
├── threat-intel.service.ts           # Business logic and database queries
├── threat-intel.module.ts            # NestJS module definition
├── seed-database.js                  # Database seeding script
└── README.md                         # This file
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `200 OK`: Successful request
- `400 Bad Request`: Invalid query parameters or request format
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side error

Error response format:
```json
{
  "statusCode": 404,
  "message": "Indicator with id xyz not found",
  "error": "Not Found"
}
```

## Performance Considerations

### Database Indexes

The schema includes indexes on frequently queried columns:
- `indicators.type`
- `indicators.value`
- `indicators.first_seen`
- `indicators.last_seen`
- `campaign_indicators.campaign_id`
- `campaign_indicators.indicator_id`
- `observations.indicator_id`
- `observations.observed_at`

### Query Optimization

- Pagination limits prevent large result sets
- Subqueries are optimized to use indexes
- Related data is fetched with JOIN operations to avoid N+1 queries

## Assumptions Made

1. **No Authentication**: As specified, authentication/authorization is assumed to be handled upstream
2. **SQLite Database**: Using SQLite for simplicity; production would use PostgreSQL or similar
3. **Date Format**: All timestamps are stored and returned in ISO 8601 format
4. **Pagination**: Default page size is 20, maximum is 100 to prevent performance issues
5. **Case-Insensitive Search**: Value searches are case-insensitive for better UX

## What I'd Improve With More Time

### High Priority
1. **Caching Layer**: Implement Redis caching for frequently accessed data (dashboard summary, popular indicators)
2. **Rate Limiting**: Add rate limiting middleware to prevent API abuse
3. **API Documentation**: Generate OpenAPI/Swagger documentation automatically
4. **Unit Tests**: Comprehensive test coverage for service methods and controllers
5. **Integration Tests**: End-to-end tests for all API endpoints

### Medium Priority
6. **Database Migration System**: Use TypeORM migrations instead of raw SQL
7. **Request Validation**: More robust input validation and sanitization
8. **Logging Enhancement**: Structured logging with correlation IDs for request tracing
9. **Monitoring**: Add Prometheus metrics and health check endpoints
10. **Bulk Operations**: Support for bulk indicator lookups

### Nice to Have
11. **GraphQL API**: Alternative GraphQL endpoint for flexible querying
12. **Real-time Updates**: WebSocket support for live threat feed updates
13. **Export Functionality**: CSV/JSON export for search results
14. **Advanced Analytics**: Trend analysis and predictive threat scoring
15. **Docker Compose**: Complete containerized setup with database

## Troubleshooting

### Database Connection Issues

If you see database connection errors:
1. Verify `threat_intel.db` exists in the project root
2. Check `DATABASE_PATH` environment variable
3. Ensure proper file permissions

### Module Import Errors

If you see "Cannot find module" errors:
1. Run `npm install` to ensure all dependencies are installed
2. Check that TypeScript is compiling correctly: `npm run build`

### Port Already in Use

If port 8080 is already in use:
1. Change the port in `main.ts`
2. Or stop the conflicting process

## License

This project is part of a technical assessment and is provided as-is for evaluation purposes.

## Contact

For questions or issues, please refer to the project documentation or contact the development team.
