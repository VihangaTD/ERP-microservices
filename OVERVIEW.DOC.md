# Architecture Documentation

## Overview

The ERP Microservices System is designed following microservices architecture principles, ensuring scalability, maintainability, and service independence.

## Core Principles

### 1. Service Independence
- Each service operates independently
- Services have their own databases
- No direct database access between services
- Communication only through REST APIs

### 2. Single Responsibility
- **Auth Service**: User authentication and company management
- **Product Service**: Product and stock management
- **API Gateway**: Request routing and authentication

### 3. Database Per Service
Each service owns its data:
- Auth Service → `erp_auth` database
- Product Service → `erp_products` database

This ensures:
- Data isolation
- Independent scaling
- Service autonomy
- Loose coupling

## Request Flow

```
1. Client sends request to API Gateway
2. Gateway validates JWT token (if protected route)
3. Gateway routes request to appropriate service
4. Service processes request
5. Service returns response to Gateway
6. Gateway forwards response to client
```

## Authentication Flow

```
1. User registers/logs in via Auth Service
2. Auth Service generates JWT with payload:
   {
     user_id: "...",
     company_id: "...",
     role: "..."
   }
3. Client includes token in subsequent requests
4. API Gateway validates token
5. Gateway forwards user info to services
6. Services use company_id for data isolation
```

## Stock Management Flow

```
1. Client requests stock update
2. Gateway validates JWT
3. Product Service:
   a. Starts MongoDB transaction
   b. Locks product document
   c. Validates stock rules (no negative)
   d. Updates product stock
   e. Creates audit log entry
   f. Commits transaction
4. Returns success/failure
```

## Data Flow

### Company-Based Isolation

All data is isolated by `companyId`:
- Users belong to companies
- Products belong to companies
- Stock logs belong to companies

Example query:
```javascript
Product.find({ companyId: user.company_id })
```

### Cross-Service Communication

Services don't share databases. If Service A needs data from Service B:
1. Service A makes HTTP request to Service B
2. Service B validates the request
3. Service B returns only authorized data

## Scalability Considerations

### Horizontal Scaling
- Each service can be scaled independently
- Add more instances behind a load balancer
- Stateless services (JWT-based auth)

### Database Scaling
- Each service database can be scaled separately
- MongoDB replica sets for high availability
- Sharding for large datasets

### Caching Strategy
- Gateway can cache authenticated tokens
- Services can cache frequently accessed data
- Redis can be added for distributed caching

## Security Layers

### 1. Gateway Level
- Rate limiting
- Token validation
- Request sanitization

### 2. Service Level
- Business logic validation
- Authorization checks
- Data validation

### 3. Database Level
- Indexes for performance
- Constraints for data integrity
- Transactions for consistency

## Error Handling Strategy

### Gateway
- Catches all service errors
- Formats error responses
- Hides internal details in production

### Services
- Validate inputs
- Handle business logic errors
- Return structured error responses

### Format
```javascript
{
  success: false,
  message: "User-friendly error message",
  errors: [...] // Optional validation errors
}
```

## Monitoring & Logging

### Health Checks
- Each service exposes `/health` endpoint
- Gateway aggregates health status
- Container health checks

### Audit Logging
- All stock changes logged
- Timestamp and user tracking
- Immutable audit trail

### Application Logging
- Request/response logging
- Error logging with stack traces
- Performance metrics

## Deployment Strategy

### Development
- Run services locally
- Separate terminal windows
- Local MongoDB instances

### Production
- Docker containers
- Container orchestration (Docker Compose/Kubernetes)
- Separate database servers
- Load balancers
- Environment-based configuration

## Future Enhancements

### Planned Improvements
1. Message queues (RabbitMQ/Kafka) for async operations
2. Event-driven architecture
3. CQRS pattern for complex queries
4. GraphQL gateway option
5. Service mesh (Istio)
6. Distributed tracing (Jaeger)
7. Centralized logging (ELK stack)
8. API versioning

### Scalability Roadmap
1. Add caching layer (Redis)
2. Implement event sourcing
3. Database read replicas
4. CDN for static content
5. Multi-region deployment

## Best Practices

### Code Organization
- Consistent folder structure
- Separation of concerns
- DRY principles
- Clear naming conventions

### API Design
- RESTful conventions
- Consistent response format
- Proper HTTP status codes
- Comprehensive error messages

### Security
- Environment variables for secrets
- Input validation
- Output sanitization
- Rate limiting
- HTTPS in production

### Testing
- Unit tests for business logic
- Integration tests for APIs
- End-to-end tests
- Load testing

## Conclusion

This architecture provides:
-  Scalability
-  Maintainability
-  Testability
-  Security
-  Performance
-  Service independence
