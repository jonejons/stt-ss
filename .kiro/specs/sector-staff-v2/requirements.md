# Requirements Document

## Introduction

The Sector Staff v2.1 system is a comprehensive multi-organization attendance tracking and access control platform built as a modular monolith using NestJS. The system manages a strict hierarchical data model (System → Organization → Branch → Department) with complete data isolation between organizations. It handles employee attendance tracking, guest management, device integration, and provides robust authentication and authorization mechanisms.

The system serves multiple types of users including Super Admins, Organization Admins, Branch Managers, and Employees, each with specific permissions and data access scopes. It integrates with physical devices (cameras, card readers, fingerprint scanners) to automatically track attendance and supports asynchronous processing for high-throughput event handling.

## Requirements

### Requirement 1: Multi-Organization Data Isolation

**User Story:** As a system administrator, I want complete data isolation between organizations, so that no organization can access or view data from another organization.

#### Acceptance Criteria

1. WHEN a user authenticates THEN the system SHALL enforce organization-level data scoping through JWT tokens
2. WHEN an organization admin makes a request THEN the system SHALL only return data belonging to their organization
3. WHEN a branch manager makes a request THEN the system SHALL only return data from branches they manage
4. IF a user attempts to access data outside their organization scope THEN the system SHALL return 404 Not Found to prevent information leakage
5. WHEN the system processes any database query THEN it SHALL automatically include organization-level filtering

### Requirement 2: Hierarchical User Management

**User Story:** As an organization admin, I want to manage users with different roles and permissions within my organization, so that I can control access to system features appropriately.

#### Acceptance Criteria

1. WHEN creating a user THEN the system SHALL support roles: SUPER_ADMIN, ORG_ADMIN, BRANCH_MANAGER, EMPLOYEE
2. WHEN assigning a BRANCH_MANAGER role THEN the system SHALL allow assignment to multiple branches through a many-to-many relationship
3. WHEN a user logs in THEN the system SHALL generate JWT tokens containing user context (organizationId, branchIds, roles, permissions)
4. WHEN processing requests THEN the system SHALL enforce role-based permissions according to the RBAC matrix
5. IF a user lacks required permissions THEN the system SHALL return 403 Forbidden

### Requirement 3: Employee and Department Management

**User Story:** As a branch manager, I want to manage employees and departments within my assigned branches, so that I can organize staff effectively.

#### Acceptance Criteria

1. WHEN creating an employee THEN the system SHALL require unique employeeCode within the organization
2. WHEN assigning an employee to a department THEN the system SHALL support hierarchical department structures with parent-child relationships
3. WHEN an employee is deleted THEN the system SHALL preserve attendance records but remove personal data
4. WHEN querying employees THEN the system SHALL respect branch-level access controls for branch managers
5. WHEN updating employee information THEN the system SHALL log all changes in the audit trail

### Requirement 4: Device Integration and Event Processing

**User Story:** As a system operator, I want to integrate physical access devices and process their events reliably, so that attendance is tracked automatically without data loss.

#### Acceptance Criteria

1. WHEN a device sends an event THEN the system SHALL accept it via POST /api/v1/events/raw with mandatory Idempotency-Key header
2. WHEN processing device events THEN the system SHALL implement idempotency to prevent duplicate attendance records
3. WHEN an event is received THEN the system SHALL immediately return 202 Accepted and process asynchronously via BullMQ
4. WHEN processing fails THEN the system SHALL implement exponential backoff retry strategy with up to 5 attempts
5. WHEN an event is processed THEN the system SHALL create appropriate attendance records (CHECK_IN, CHECK_OUT)

### Requirement 5: Guest Management and Access Control

**User Story:** As a branch manager, I want to manage guest visits with approval workflows and temporary access credentials, so that I can control facility access for non-employees.

#### Acceptance Criteria

1. WHEN creating a guest visit THEN the system SHALL require scheduled entry/exit times and responsible employee
2. WHEN a guest visit is created THEN the system SHALL set status to PENDING_APPROVAL by default
3. WHEN approving a guest visit THEN the system SHALL generate access credentials (QR_CODE or TEMP_CARD)
4. WHEN a guest uses their credential THEN the system SHALL create GUEST_CHECK_IN/GUEST_CHECK_OUT attendance records
5. WHEN a guest visit expires THEN the system SHALL automatically update status to EXPIRED

### Requirement 6: Attendance Tracking and Reporting

**User Story:** As an organization admin, I want comprehensive attendance tracking and reporting capabilities, so that I can monitor employee presence and generate compliance reports.

#### Acceptance Criteria

1. WHEN an attendance event occurs THEN the system SHALL record timestamp, employee/guest, device, and event type
2. WHEN generating reports THEN the system SHALL process them asynchronously in the exports-queue
3. WHEN a report is requested THEN the system SHALL return 202 Accepted and notify when complete
4. WHEN querying attendance data THEN the system SHALL support filtering by date range, employee, and branch
5. WHEN exporting data THEN the system SHALL store files in S3-compatible storage with presigned URLs

### Requirement 7: Authentication and Security

**User Story:** As a security administrator, I want robust authentication with JWT tokens and secure password policies, so that the system maintains high security standards.

#### Acceptance Criteria

1. WHEN a user logs in THEN the system SHALL validate credentials against bcrypt-hashed passwords with minimum 12 salt rounds
2. WHEN authenticating THEN the system SHALL issue both access tokens (15min) and refresh tokens (7 days)
3. WHEN a token expires THEN the system SHALL support refresh token rotation for security
4. WHEN a user logs out THEN the system SHALL add refresh token to Redis denylist
5. WHEN validating passwords THEN the system SHALL enforce minimum 8 characters with uppercase, lowercase, number, and special character

### Requirement 8: Asynchronous Processing and Queue Management

**User Story:** As a system architect, I want reliable background job processing with proper queue management, so that the system remains responsive under high load.

#### Acceptance Criteria

1. WHEN processing background tasks THEN the system SHALL use domain-specific queues (events, notifications, exports, system-health)
2. WHEN a job fails THEN the system SHALL implement exponential backoff retry with configurable attempts
3. WHEN processing device events THEN the system SHALL use high-priority events-queue with high concurrency
4. WHEN generating reports THEN the system SHALL use low-priority exports-queue with limited concurrency
5. WHEN all retries fail THEN the system SHALL move jobs to failed queue for manual review

### Requirement 9: Audit Logging and Compliance

**User Story:** As a compliance officer, I want comprehensive audit trails of all system changes, so that I can track who made what changes and when.

#### Acceptance Criteria

1. WHEN any mutating operation occurs THEN the system SHALL automatically log it via AuditLogInterceptor
2. WHEN logging changes THEN the system SHALL capture userId, action, entity, entityId, oldValue, and newValue
3. WHEN querying audit logs THEN the system SHALL respect organization-level access controls
4. WHEN writing logs THEN the system SHALL use structured JSON format for observability platforms
5. WHEN storing audit data THEN the system SHALL include correlation IDs for request tracing

### Requirement 10: External System Integration

**User Story:** As a system integrator, I want clean adapter interfaces for external services, so that I can easily swap providers without changing business logic.

#### Acceptance Criteria

1. WHEN integrating storage THEN the system SHALL use IStorageAdapter interface with presigned URL support
2. WHEN sending notifications THEN the system SHALL use INotificationAdapter for email and SMS
3. WHEN controlling devices THEN the system SHALL use IDeviceAdapter for door control and configuration
4. WHEN matching biometrics THEN the system SHALL use IMatchingAdapter for external matching services
5. WHEN testing THEN the system SHALL provide stub implementations that log operations and return mock responses