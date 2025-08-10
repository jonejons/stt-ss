# Design Document

## Overview

The Sector Staff v2.1 system is designed as a modular monolith using NestJS with TypeScript, implementing a multi-tenant architecture with strict data isolation. The system follows Domain-Driven Design principles with clear separation between core business logic, infrastructure concerns, and external integrations through adapter patterns.

The architecture emphasizes security through multi-layered guards, performance through asynchronous processing, and maintainability through modular organization. The system handles high-throughput device events while maintaining data consistency and providing comprehensive audit trails.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Load Balancer │────│  NestJS App      │────│   PostgreSQL    │
└─────────────────┘    │  (Modular        │    │   (Primary DB)  │
                       │   Monolith)      │    └─────────────────┘
                       │                  │    
                       │  ┌─────────────┐ │    ┌─────────────────┐
                       │  │Controllers  │ │────│     Redis       │
                       │  │Services     │ │    │  (Cache/Queue)  │
                       │  │Guards       │ │    └─────────────────┘
                       │  │Interceptors │ │    
                       │  └─────────────┘ │    ┌─────────────────┐
                       └──────────────────┘────│   MinIO/S3      │
                                               │ (Object Storage)│
                                               └─────────────────┘
```

### Security Architecture

The system implements a three-layer security model:

1. **JwtAuthGuard**: Validates JWT tokens and extracts user context
2. **DataScopeGuard**: Enforces organization-level data isolation
3. **RolesGuard**: Validates permissions based on RBAC matrix

### Data Flow Architecture

```
Device Event → Idempotency Check → Queue → Background Processing → Attendance Record
     ↓              ↓                ↓            ↓                    ↓
  Raw Event    Redis Cache      BullMQ Queue   Worker Process    PostgreSQL
```

## Components and Interfaces

### Core Modules

#### 1. Authentication Module (`src/modules/auth/`)
- **AuthController**: Handles login, logout, token refresh
- **AuthService**: Manages JWT token lifecycle and validation
- **JwtStrategy**: Passport strategy for JWT validation
- **Guards**: JwtAuthGuard, DataScopeGuard, RolesGuard

#### 2. Organization Module (`src/modules/organization/`)
- **OrganizationController**: CRUD operations for organizations
- **OrganizationService**: Business logic for organization management
- **OrganizationRepository**: Data access layer

#### 3. User Module (`src/modules/user/`)
- **UserController**: User management endpoints
- **UserService**: User business logic with role assignment
- **UserRepository**: User data access with organization scoping

#### 4. Employee Module (`src/modules/employee/`)
- **EmployeeController**: Employee CRUD with branch scoping
- **EmployeeService**: Employee management with department assignment
- **EmployeeRepository**: Data access with organization/branch filtering

#### 5. Device Module (`src/modules/device/`)
- **DeviceController**: Device registration and management
- **EventController**: Raw event ingestion endpoint
- **DeviceService**: Device lifecycle management
- **EventProcessor**: Background job for processing device events

#### 6. Guest Module (`src/modules/guest/`)
- **GuestController**: Guest visit management
- **GuestService**: Approval workflows and credential generation
- **GuestRepository**: Guest data access with branch scoping

#### 7. Attendance Module (`src/modules/attendance/`)
- **AttendanceController**: Attendance queries and reports
- **AttendanceService**: Attendance calculation and reporting
- **AttendanceRepository**: Attendance data access with filtering

### Shared Components

#### 1. Core Services (`src/core/`)
- **DatabaseModule**: Prisma configuration and connection management
- **ConfigModule**: Environment variable management
- **LoggerModule**: Structured JSON logging
- **QueueModule**: BullMQ configuration and queue management

#### 2. Shared Utilities (`src/shared/`)
- **Guards**: Reusable security guards
- **Decorators**: Custom decorators (@User(), @Permissions(), @Public())
- **DTOs**: Common data transfer objects
- **Interfaces**: Shared type definitions
- **Utils**: Helper functions and utilities

### External Adapters (`src/modules/integration/`)

#### Storage Adapter Interface
```typescript
interface IStorageAdapter {
  getPresignedUploadUrl(bucket: string, key: string, expiresIn: number, contentType: string): Promise<string>;
  getPresignedDownloadUrl(bucket: string, key: string, expiresIn: number): Promise<string>;
}
```

#### Notification Adapter Interface
```typescript
interface INotificationAdapter {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
  sendSms(to: string, message: string): Promise<void>;
}
```

#### Device Adapter Interface
```typescript
interface IDeviceAdapter {
  openDoor(deviceId: string, duration: number): Promise<boolean>;
  updateConfig(deviceId: string, config: Record<string, any>): Promise<boolean>;
}
```

#### Matching Adapter Interface
```typescript
interface IMatchingAdapter {
  requestMatch(template: Buffer): Promise<{ isMatch: boolean; confidence?: number }>;
}
```

## Data Models

### Core Entities

#### User and Organization Relationship
```
User (1) ←→ (M) OrganizationUser (M) ←→ (1) Organization
                      ↓
                 ManagedBranch (M) ←→ (1) Branch
```

#### Hierarchical Structure
```
Organization (1) ←→ (M) Branch (1) ←→ (M) Department
                                            ↓
                                      Employee (M)
```

#### Attendance Tracking
```
Employee/Guest → Device Event → Attendance Record
      ↓              ↓              ↓
   Identity      Raw Event      Processed Event
```

### Key Database Design Decisions

1. **Many-to-Many Branch Management**: Uses explicit `ManagedBranch` join table for branch managers
2. **Hierarchical Departments**: Self-referencing `Department` model with parent-child relationships
3. **Flexible Attendance**: Supports both employee and guest attendance through nullable foreign keys
4. **Audit Trail**: Comprehensive `AuditLog` model with old/new value tracking
5. **Event Processing**: Separate `DeviceEventLog` for raw events and `Attendance` for processed events

## Error Handling

### Error Response Strategy
- **404 Not Found**: Used instead of 403 for data isolation to prevent information leakage
- **400 Bad Request**: For validation errors and missing required headers
- **401 Unauthorized**: For authentication failures
- **403 Forbidden**: For authorization failures (insufficient permissions)
- **409 Conflict**: For idempotency key conflicts
- **429 Too Many Requests**: For rate limiting
- **503 Service Unavailable**: For infrastructure failures (Redis, database)

### Retry Strategy
- **Exponential Backoff**: 1s, 2s, 4s, 8s, 16s intervals
- **Maximum Attempts**: 5 retries for critical operations
- **Dead Letter Queue**: Failed jobs moved to manual review queue

## Testing Strategy

### Unit Testing
- **Isolation**: All external dependencies mocked using Jest
- **Coverage**: Business logic in services with 90%+ coverage target
- **Mocking**: Prisma client, adapters, and external services fully mocked

### Integration Testing
- **Real Database**: Uses Testcontainers for PostgreSQL and Redis
- **Schema Migration**: Automated schema deployment in test environment
- **Data Isolation**: Each test suite uses isolated database instance

### End-to-End Testing
- **Full Stack**: Real HTTP requests using Supertest
- **Critical Flows**: Organization creation, employee management, device events
- **Security Testing**: Data isolation, permission enforcement, idempotency

### Test Scenarios
1. **E2E-01**: Complete organization setup flow
2. **E2E-02**: Employee creation and attendance tracking
3. **E2E-03**: Guest visit approval and access
4. **E2E-04**: Data isolation between organizations
5. **E2E-05**: Permission enforcement
6. **E2E-06**: Idempotency validation
7. **E2E-07**: Background job processing

## Performance Considerations

### Queue Architecture
- **Domain-Specific Queues**: Separate queues for different job types
- **Priority Levels**: High (events), Medium (notifications, health), Low (exports)
- **Concurrency Control**: Configurable worker concurrency per queue type

### Caching Strategy
- **Redis Caching**: Frequently accessed configuration data
- **Idempotency Cache**: 24-hour TTL for duplicate request prevention
- **Token Denylist**: Revoked refresh tokens with expiration-based cleanup

### Database Optimization
- **Strategic Indexing**: Organization, branch, and user-based indexes
- **Query Optimization**: Automatic organization-level filtering
- **Connection Pooling**: Prisma connection pool management

## Security Implementation

### JWT Token Structure
```json
{
  "sub": "user-uuid",
  "email": "user@example.com", 
  "organizationId": "org-uuid-or-null",
  "branchIds": ["branch-uuid-1", "branch-uuid-2"],
  "roles": ["ORG_ADMIN"],
  "permissions": ["employee:create", "employee:read:all"],
  "iat": 1690000000,
  "exp": 1690000900
}
```

### Password Security
- **Hashing**: bcrypt with minimum 12 salt rounds
- **Policy Enforcement**: 8+ characters, mixed case, numbers, special characters
- **Validation**: DTO-level password policy validation

### Data Scoping Implementation
```typescript
// DataScopeGuard enforces this pattern
interface DataScope {
  organizationId: string;
  branchIds?: string[];
}

// All service methods must accept scope
async findEmployees(scope: DataScope, filters: EmployeeFilters) {
  return this.prisma.employee.findMany({
    where: {
      organizationId: scope.organizationId,
      branchId: scope.branchIds ? { in: scope.branchIds } : undefined,
      ...filters
    }
  });
}
```