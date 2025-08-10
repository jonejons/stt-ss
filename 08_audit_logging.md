
## **8. Audit and Logging Strategy**

### **8.1. Structured Logging (JSON Format)**

To ensure the system's observability, all log entries must be written to stdout in JSON format. This approach allows modern log aggregation platforms like Datadog, ELK Stack, and Splunk to easily parse and index the logs. Each log entry must minimally include the following fields: timestamp, level (e.g., INFO, ERROR), message, context (e.g., the module name), and correlationId (for request tracing).

### **8.2. Audit Log Tracking**

To track all important changes in the system, entries will be automatically added to the AuditLog table. This allows for determining who made what changes, when, and is critical for security audits.

This functionality will be implemented in a centralized manner using a dedicated NestJS Interceptor (AuditLogInterceptor). This interceptor will be applied globally to all mutating endpoints (POST, PATCH, DELETE).

**Interceptor Logic:**

1. When a request arrives, the interceptor retrieves the request.user.id and other necessary information.  
2. It saves the data sent to the endpoint (request.body) as newValue.  
3. If the operation is PATCH or DELETE, it loads the current state of the object being modified or deleted (oldValue) from the database before the endpoint's core logic is executed.  
4. After the endpoint's core logic successfully completes, the interceptor adds a new entry to the AuditLog table. This entry includes information like userId, action (e.g., UPDATE_EMPLOYEE), entity (Employee), entityId, oldValue, and newValue.

This approach completely separates the audit logic from the business logic and guarantees its consistent application across all necessary areas.
