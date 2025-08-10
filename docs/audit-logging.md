# Audit Logging System

The audit logging system provides comprehensive tracking of all user actions and system events within the application. It automatically captures detailed information about API requests, responses, and system changes.

## Features

- **Automatic Logging**: Uses interceptors to automatically log API requests and responses
- **Sensitive Data Protection**: Automatically redacts sensitive information like passwords, tokens, and credit card numbers
- **Flexible Configuration**: Configurable per endpoint with options for request/response capture
- **Security Events**: Special handling for security-related events
- **Data Export**: Support for CSV and JSON export formats
- **Cleanup**: Automated cleanup of old audit logs
- **Analytics**: Built-in statistics and reporting capabilities

## Usage

### Basic Audit Logging

Add the `@AuditLog` decorator to any controller method:

```typescript
import { AuditLog } from '../../shared/interceptors/audit-log.interceptor';

@Controller('employees')
export class EmployeeController {
  @Post()
  @Permissions('employee:create')
  @AuditLog({
    action: 'CREATE',
    resource: 'employee',
    captureRequest: true,
    captureResponse: true,
  })
  async createEmployee(@Body() createDto: CreateEmployeeDto) {
    // Implementation
  }
}
```

### Audit Log Options

```typescript
interface AuditLogOptions {
  action: string;           // Action being performed (CREATE, UPDATE, DELETE, etc.)
  resource: string;         // Resource being acted upon (employee, device, etc.)
  skipAudit?: boolean;      // Skip audit logging for this endpoint
  captureRequest?: boolean; // Capture request data (body, params, query)
  captureResponse?: boolean; // Capture response data
}
```

### Common Actions

- `CREATE` - Creating new resources
- `UPDATE` - Updating existing resources
- `DELETE` - Deleting resources
- `READ` - Reading/viewing resources (usually not audited)
- `LOGIN` - User authentication
- `LOGOUT` - User logout
- `STATUS_CHANGE` - Changing resource status
- `PERMISSION_DENIED` - Access denied events
- `EXPORT` - Data export operations

### Security Events

The system automatically identifies and categorizes security events:

- Login attempts (successful and failed)
- Permission denied events
- Unauthorized access attempts
- Token refresh operations
- Account lockouts
- Suspicious activities

## API Endpoints

### Get Audit Logs

```http
GET /api/v1/audit-logs?page=1&limit=50&userId=user-123&action=CREATE
```

Query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `userId` - Filter by user ID
- `resource` - Filter by resource type
- `action` - Filter by action
- `resourceId` - Filter by specific resource ID
- `status` - Filter by status (SUCCESS/FAILED)
- `startDate` - Filter by start date (ISO format)
- `endDate` - Filter by end date (ISO format)

### Get Audit Log Statistics

```http
GET /api/v1/audit-logs/stats?startDate=2024-01-01&endDate=2024-01-31
```

Returns statistics including:
- Total log count
- Logs by action type
- Logs by resource type
- Logs by status
- Top users by activity

### Get User Activity Summary

```http
GET /api/v1/audit-logs/user/user-123/activity?startDate=2024-01-01&endDate=2024-01-31
```

Returns detailed activity summary for a specific user.

### Get Resource History

```http
GET /api/v1/audit-logs/resource/employee/emp-123/history
```

Returns complete audit history for a specific resource.

### Get Security Events

```http
GET /api/v1/audit-logs/security-events?severity=HIGH
```

Returns security-related events with optional severity filtering.

### Export Audit Logs

```http
POST /api/v1/audit-logs/export
Content-Type: application/json

{
  "filters": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "userId": "user-123"
  },
  "format": "CSV"
}
```

Exports audit logs in CSV or JSON format.

### Cleanup Old Logs

```http
POST /api/v1/audit-logs/cleanup
Content-Type: application/json

{
  "olderThanDays": 90
}
```

Removes audit logs older than the specified number of days.

## Data Structure

### Audit Log Record

```typescript
interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  userId?: string;
  organizationId?: string;
  method: string;
  url: string;
  userAgent?: string;
  ipAddress?: string;
  requestData?: any;
  responseData?: any;
  status: 'SUCCESS' | 'FAILED';
  duration: number;
  timestamp: Date;
  errorMessage?: string;
  errorStack?: string;
  oldValues?: any;
  newValues?: any;
  createdAt: Date;
}
```

## Sensitive Data Protection

The system automatically redacts sensitive fields in request and response data:

- `password`
- `token`
- `secret`
- `key`
- `authorization`
- `cookie`
- `session`
- `credential`
- `pin`
- `ssn`
- `social`
- `credit`
- `card`
- `cvv`
- `cvc`

Example:
```json
{
  "name": "John Doe",
  "password": "[REDACTED]",
  "email": "john@example.com",
  "creditCard": "[REDACTED]"
}
```

## Performance Considerations

- Audit logging is asynchronous and doesn't block the main request
- Failed audit log creation doesn't affect the main operation
- Database indexes are optimized for common query patterns
- Old logs can be automatically cleaned up to manage storage

## Security

- All audit logs are scoped to organizations
- Access to audit logs requires specific permissions
- Sensitive data is automatically redacted
- IP addresses and user agents are captured for security analysis
- Failed operations are logged with error details

## Permissions

Required permissions for audit log operations:

- `audit:read:all` - View audit logs
- `audit:read:security` - View security events
- `audit:export` - Export audit logs
- `audit:admin` - Administrative operations (cleanup)

## Configuration

The audit logging system is automatically enabled when the `AuditLogInterceptor` is registered as a global interceptor in the application module.

### Environment Variables

- `AUDIT_LOG_RETENTION_DAYS` - Number of days to retain audit logs (default: 365)
- `AUDIT_LOG_EXPORT_LIMIT` - Maximum number of records to export (default: 10000)

## Best Practices

1. **Use Descriptive Actions**: Use clear, consistent action names
2. **Capture Relevant Data**: Only capture request/response data when necessary
3. **Resource Identification**: Always provide meaningful resource names
4. **Regular Cleanup**: Set up automated cleanup of old audit logs
5. **Monitor Security Events**: Regularly review security events for anomalies
6. **Export for Compliance**: Use export functionality for compliance reporting

## Examples

### Employee Management Audit

```typescript
@Controller('employees')
export class EmployeeController {
  @Post()
  @AuditLog({
    action: 'CREATE',
    resource: 'employee',
    captureRequest: true,
    captureResponse: true,
  })
  async createEmployee() { /* ... */ }

  @Patch(':id')
  @AuditLog({
    action: 'UPDATE',
    resource: 'employee',
    captureRequest: true,
    captureResponse: true,
  })
  async updateEmployee() { /* ... */ }

  @Delete(':id')
  @AuditLog({
    action: 'DELETE',
    resource: 'employee',
    captureRequest: true,
  })
  async deleteEmployee() { /* ... */ }
}
```

### Device Management Audit

```typescript
@Controller('devices')
export class DeviceController {
  @Post(':id/activate')
  @AuditLog({
    action: 'ACTIVATE',
    resource: 'device',
    captureRequest: true,
    captureResponse: true,
  })
  async activateDevice() { /* ... */ }

  @Post(':id/deactivate')
  @AuditLog({
    action: 'DEACTIVATE',
    resource: 'device',
    captureRequest: true,
    captureResponse: true,
  })
  async deactivateDevice() { /* ... */ }
}
```

### Authentication Audit

```typescript
@Controller('auth')
export class AuthController {
  @Post('login')
  @AuditLog({
    action: 'LOGIN',
    resource: 'auth',
    captureRequest: false, // Don't capture password
    captureResponse: false, // Don't capture tokens
  })
  async login() { /* ... */ }

  @Post('logout')
  @AuditLog({
    action: 'LOGOUT',
    resource: 'auth',
  })
  async logout() { /* ... */ }
}
```
"