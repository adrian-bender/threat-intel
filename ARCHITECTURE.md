# Architecture Documentation

## Overview

The Threat Intelligence API is built using NestJS following a modular, layered architecture pattern. It integrates seamlessly with the existing application infrastructure while maintaining clear separation of concerns.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│  (Security Analysts, Dashboard UI, External Systems)        │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
┌────────────────────────▼────────────────────────────────────┐
│                   API Gateway / Nginx                       │
│              (Authentication handled upstream)              │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                     NestJS Application                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              App Module (app.module.ts)              │   │
│  │  - ConfigModule (Global)                             │   │
│  │  - WinstonModule (Logging)                           │   │
│  │  - TypeOrmModule (Database)                          │   │
│  │  - ContextModule, AuthModule, ClientsModule          │   │
│  │  - ThreatIntelModule                                 │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                   │
│  ┌──────────────────────▼───────────────────────────────┐   │
│  │         ThreatIntelModule (threat-intel.module.ts)   │   │
│  │                                                      │   │
│  │  ┌─────────────────────────────────────────────┐     │   │
│  │  │  ThreatIntelController                      │     │   │
│  │  │  - GET /api/indicators/:id                  │     │   │
│  │  │  - GET /api/indicators/search               │     │   │
│  │  │  - GET /api/campaigns/:id/indicators        │     │   │
│  │  │  - GET /api/dashboard/summary               │     │   │
│  │  └──────────────┬──────────────────────────────┘     │   │
│  │                 │                                    │   │
│  │  ┌──────────────▼──────────────────────────────┐     │   │
│  │  │  ThreatIntelService                         │     │   │
│  │  │  - getIndicatorById()                       │     │   │
│  │  │  - searchIndicators()                       │     │   │
│  │  │  - getCampaignIndicators()                  │     │   │
│  │  │  - getDashboardSummary()                    │     │   │
│  │  └──────────────┬──────────────────────────────┘     │   │
│  │                 │                                    │   │
│  │  ┌──────────────▼──────────────────────────────┐     │   │
│  │  │  DTOs (Data Transfer Objects)               │     │   │
│  │  │  - Request validation                       │     │   │
│  │  │  - Response serialization                   │     │   │
│  │  │  - Type safety                              │     │   │
│  │  └─────────────────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ TypeORM / Raw SQL
┌────────────────────────▼────────────────────────────────────┐
│                   SQLite Database                           │
│  - threat_actors (50 records)                               │
│  - campaigns (100 records)                                  │
│  - indicators (10,000 records)                              │
│  - actor_campaigns (relationships)                          │
│  - campaign_indicators (relationships)                      │
│  - indicator_relationships (5,000 records)                  │
│  - observations (20,000 records)                            │
└─────────────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### 1. Controller Layer (`threat-intel.controller.ts`)

**Purpose**: Handle HTTP requests and responses

**Responsibilities**:
- Route definition and HTTP method mapping
- Request parameter extraction and validation
- Response formatting
- Error handling delegation
- Logging request/response metadata

**Key Features**:
- Uses NestJS decorators (`@Controller`, `@Get`, `@Param`, `@Query`)
- Integrates with Winston logger for request tracking
- Delegates business logic to service layer
- Returns properly typed DTOs

**Example**:
```typescript
@Get('indicators/:id')
async getIndicator(@Param('id') id: string): Promise<IndicatorDetailDto> {
  this.logger.debug(`Retrieving indicator: ${id}`);
  return this.threatIntelService.getIndicatorById(id);
}
```

### 2. Service Layer (`threat-intel.service.ts`)

**Purpose**: Implement business logic and data access

**Responsibilities**:
- Database query execution
- Data transformation and aggregation
- Business rule enforcement
- Error handling and validation
- Complex data processing

**Key Features**:
- Uses TypeORM DataSource for database access
- Raw SQL queries for performance optimization
- Efficient JOIN operations to avoid N+1 problems
- Parameterized queries for security
- Result mapping to DTOs

**Design Decisions**:
- **Raw SQL vs ORM**: Used raw SQL for complex queries requiring specific optimizations
- **Transaction Management**: Queries are read-only, no transaction overhead
- **Error Handling**: Throws NestJS exceptions (NotFoundException, BadRequestException)

### 3. DTO Layer (`dto/`)

**Purpose**: Define data contracts and validation rules

**Responsibilities**:
- Request validation using class-validator
- Type safety for TypeScript
- API documentation (can be used with Swagger)
- Response serialization

**Key Features**:
- Separate DTOs for requests and responses
- Validation decorators (`@IsOptional`, `@IsIn`, `@Min`, `@Max`)
- Type transformations (`@Type(() => Number)`)
- Clear separation between internal and external data structures

**Example**:
```typescript
export class SearchIndicatorsQueryDto {
  @IsOptional()
  @IsIn(['ip', 'domain', 'url', 'hash'])
  type?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
```

## Integration with Existing Infrastructure

### 1. Module System

The ThreatIntelModule follows the same pattern as existing modules (ClientsModule, AuthModule):

```typescript
@Module({
  controllers: [ThreatIntelController],
  providers: [ThreatIntelService],
})
export class ThreatIntelModule {}
```

Integrated into AppModule:
```typescript
imports: [
  // ... existing modules
  ThreatIntelModule,  // Added here
  // ...
]
```

### 2. Logging

Uses the same Winston logger as other modules:
- Structured logging with ECS format
- Request ID correlation via cls-rtracer
- Debug, info, warn, error levels
- Consistent log format across application

### 3. Database Connection

Leverages existing TypeORM configuration:
- Connection pooling managed by TypeORM
- Same configuration service (TypeOrmConfigService)
- Consistent error handling
- Transaction support (if needed in future)

### 4. Validation

Uses NestJS global ValidationPipe:
- Automatic DTO validation
- Consistent error messages
- Type coercion for query parameters
- Validation happens before controller methods

## Design Patterns

### 1. Dependency Injection

All dependencies are injected via constructor:
```typescript
constructor(
  @InjectDataSource() private dataSource: DataSource,
  @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
) {}
```

**Benefits**:
- Testability (easy to mock dependencies)
- Loose coupling
- Single Responsibility Principle

### 2. Repository Pattern (Implicit)

Service layer acts as repository:
- Encapsulates data access logic
- Provides clean interface for controllers
- Can be easily swapped or extended

### 3. DTO Pattern

Clear separation between:
- Request DTOs (query parameters)
- Response DTOs (API responses)
- Internal data structures

### 4. Layered Architecture

```
Controller → Service → Database
     ↓          ↓
    DTOs      DTOs
```

Each layer has single responsibility and clear boundaries.

## Code Organization

```
threat-intel/
├── ARCHITECTURE.md        # High-level system design, data model, and query strategy
├── Dockerfile             # Container definition for consistent, reproducible setup
├── node_modules/          # Installed dependencies (not committed)
├── package-lock.json      # Locked dependency tree for reproducible installs
├── package.json           # Project metadata, scripts, and dependencies
├── README.md              # Project overview, setup instructions, and review guide
├── schema.sql             # Database schema definition and table structure
├── SQL_QUERIES.md         # Documentation of core SQL queries and optimization notes
├── src/                   # Application source code (NestJS modules, services, controllers)
├── tsconfig.build.json    # TypeScript configuration for production builds
└── tsconfig.json          # Base TypeScript compiler configuration
```

## Database Design

### Entity Relationship

```
threat_actors ←→ actor_campaigns ←→ campaigns ←→ campaign_indicators ←→ indicators
                                                                            ↓
                                                                   indicator_relationships
                                                                            ↓
                                                                      observations
```

### Key Design Decisions

1. **Many-to-Many Relationships**: 
   - Actors ↔ Campaigns
   - Campaigns ↔ Indicators
   - Indicators ↔ Indicators (self-referential)

2. **Confidence Scores**: 
   - Stored in relationship tables
   - Allows different confidence levels for different contexts

3. **Temporal Data**: 
   - first_seen, last_seen on main entities
   - observed_at on relationships
   - Enables timeline analysis

4. **Normalization**: 
   - 3rd Normal Form
   - No redundant data
   - Efficient updates

## Error Handling Strategy

### HTTP Status Codes

- **200 OK**: Successful request
- **400 Bad Request**: Invalid query parameters
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Unexpected errors

### Exception Hierarchy

```
NestJS HttpException
├── NotFoundException (404)
├── BadRequestException (400)
└── InternalServerErrorException (500)
```

### Error Response Format

```json
{
  "statusCode": 404,
  "message": "Indicator with id xyz not found",
  "error": "Not Found"
}
```

## Security Considerations

### Current Implementation

1. **SQL Injection Prevention**: 
   - Parameterized queries
   - No string concatenation
   - TypeORM escaping

2. **Input Validation**: 
   - class-validator decorators
   - Type checking
   - Range validation (pagination limits)

3. **No Authentication**: 
   - As per requirements
   - Assumed handled upstream

### Production Recommendations

1. **Rate Limiting**: Add throttling middleware
2. **API Keys**: Implement authentication
3. **CORS**: Configure allowed origins
4. **HTTPS**: Enforce TLS
5. **Input Sanitization**: Additional XSS protection

## Performance Characteristics

### Response Times (Estimated)

| Endpoint | Avg Time | P95 Time | Notes |
|----------|----------|----------|-------|
| GET /api/indicators/:id | 20ms | 50ms | Primary key lookup |
| GET /api/indicators/search | 50ms | 150ms | With pagination |
| GET /api/campaigns/:id/indicators | 100ms | 250ms | Complex aggregation |
| GET /api/dashboard/summary | 200ms | 400ms | Multiple queries |

### Scalability

**Current Capacity** (SQLite):
- 10K-100K indicators: Excellent performance
- 100K-1M indicators: Good performance with proper indexes
- 1M+ indicators: Consider PostgreSQL migration

**Bottlenecks**:
1. SQLite write concurrency (not an issue for read-heavy API)
2. Dashboard summary aggregations (cacheable)
3. Complex timeline queries (optimized with indexes)

### Optimization Strategies

1. **Database Level**:
   - Proper indexing (implemented)
   - Query optimization (documented)
   - Connection pooling (via TypeORM)

2. **Application Level**:
   - Efficient data structures (Map for grouping)
   - Minimal data transformation
   - Lazy loading where appropriate

3. **Future Enhancements**:
   - Redis caching for dashboard
   - Query result caching
   - Database read replicas

## Testing Strategy

### Unit Tests (Recommended)

```typescript
describe('ThreatIntelService', () => {
  it('should return indicator by id', async () => {
    // Test with mocked DataSource
  });
  
  it('should throw NotFoundException for invalid id', async () => {
    // Test error handling
  });
});
```

### Integration Tests (Recommended)

```typescript
describe('ThreatIntelController (e2e)', () => {
  it('/api/indicators/:id (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/indicators/test-id')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
      });
  });
});
```

## Deployment Considerations

### Environment Variables

```env
DATABASE_PATH=threat_intel.db
NODE_ENV=production
LOG_LEVEL=info
DB_HEALTH_CHECK_TIMEOUT_IN_MS=10000
```

### Database Initialization

1. Run schema.sql to create tables
2. Run seed-database.js to populate data
3. Verify indexes are created

### Monitoring

Recommended metrics:
- Request rate per endpoint
- Response time percentiles (P50, P95, P99)
- Error rate by status code
- Database query performance
- Memory usage

## Future Enhancements

### Short Term
1. Add Swagger/OpenAPI documentation
2. Implement comprehensive test suite
3. Add request rate limiting
4. Implement caching layer

### Medium Term
5. Add bulk operations support
6. Implement real-time updates (WebSockets)
7. Add export functionality (CSV/JSON)
8. Enhance logging and monitoring

### Long Term
9. Migrate to PostgreSQL for scale
10. Add GraphQL API
11. Implement advanced analytics
12. Add machine learning threat scoring

## Conclusion

The Threat Intelligence API is built with:
- **Maintainability**: Clear separation of concerns, well-documented code
- **Scalability**: Efficient queries, proper indexing, caching opportunities
- **Extensibility**: Modular design, easy to add new endpoints
- **Reliability**: Error handling, validation, logging
- **Performance**: Optimized queries, pagination, minimal overhead

The architecture follows NestJS best practices and integrates seamlessly with the existing application infrastructure.
