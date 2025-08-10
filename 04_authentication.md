
## **4. Authentication, Authorization, and Security**

### **4.1. JWT Structure and Claims (Access & Refresh Tokens)**

The system uses two types of JWT tokens: a short-lived accessToken and a long-lived refreshToken.

* **accessToken Payload:** This token, used in every authenticated request, contains the following claims. These claims provide the full context needed to process each request and reduce the number of additional database queries.

{  
  "sub": "user-uuid",  
  "email": "user@example.com",  
  "organizationId": "org-uuid-or-null",  
  "branchIds": ["branch-uuid-1", "branch-uuid-2"],  
  "roles": ["ORG_ADMIN"],  
  "permissions": ["employee:create", "employee:read:all", "device:read"],  
  "iat": 1690000000,  
  "exp": 1690000900  
}

* `sub`: The unique identifier of the user (`User.id`).  
* `organizationId`: Indicates the organization context in which the user is operating. This value will be `null` for `SUPER_ADMIN`.  
* `branchIds`: For the `BRANCH_MANAGER` role, this is an array of IDs of the branches they manage. This data is retrieved from the `ManagedBranch` table. It will be an empty array for other roles.  
* `roles`: A list of roles assigned to the user (e.g., `["ORG_ADMIN"]`).  
* `permissions`: A list of permissions granted based on the roles. This is used for quick checks by the `RolesGuard`.  
* `exp`: The token's expiration time (e.g., 15 minutes).

* **refreshToken:** Used to obtain a new accessToken when the current one expires. It contains only the user sub and a token version, and has a much longer expiration time (e.g., 7 days).

### **4.2. Token Lifecycle and Management**

1. **Login (/api/v1/auth/login):** A user logs in with their email and password. After successful authentication, the system generates and returns a new accessToken and refreshToken pair.  
2. **Token Refresh (/api/v1/auth/refresh):** When the accessToken expires, the client sends the refreshToken to this endpoint. The system validates the refreshToken's authenticity and checks if it has been revoked (by checking a denylist in Redis). If it is valid, a new accessToken and refreshToken pair is returned. This process is known as "refresh token rotation" and enhances security.  
3. **Logout (/api/v1/auth/logout):** When a user logs out, their current refreshToken is added to a denylist in Redis. This prevents the user from obtaining a new accessToken with a stolen refreshToken.

### **4.3. Role-Based Access Control (RBAC)**

The roles and permissions system serves as the foundation for strictly controlling access to system functions. The following matrix clearly defines the permissions available for each role. This matrix is the primary document for implementing and testing the RolesGuard.

| Permission | SUPER_ADMIN | ORG_ADMIN | BRANCH_MANAGER | EMPLOYEE |
| :---- | :---- | :---- | :---- | :---- |
| organization:create | ✅ | ❌ | ❌ | ❌ |
| organization:read:all | ✅ | ❌ | ❌ | ❌ |
| organization:read:self | ✅ | ✅ | ❌ | ❌ |
| organization:update:self | ✅ | ✅ | ❌ | ❌ |
| user:create:org_admin | ✅ | ❌ | ❌ | ❌ |
| user:manage:org | ✅ | ✅ | ❌ | ❌ |
| branch:create | ❌ | ✅ | ❌ | ❌ |
| branch:read:all | ❌ | ✅ | ✅ | ❌ |
| branch:update:managed | ❌ | ✅ | ✅ | ❌ |
| department:create | ❌ | ✅ | ✅ | ❌ |
| department:manage:all | ❌ | ✅ | ✅ | ❌ |
| employee:create | ❌ | ✅ | ✅ | ❌ |
| employee:read:all | ❌ | ✅ | ✅ | ❌ |
| employee:read:self | ❌ | ✅ | ✅ | ✅ |
| employee:update:all | ❌ | ✅ | ✅ | ❌ |
| employee:delete | ❌ | ✅ | ✅ | ❌ |
| device:create | ❌ | ✅ | ✅ | ❌ |
| device:manage:all | ❌ | ✅ | ✅ | ❌ |
| guest:create | ❌ | ✅ | ✅ | ❌ |
| guest:approve | ❌ | ✅ | ✅ | ❌ |
| report:generate:org | ❌ | ✅ | ❌ | ❌ |
| report:generate:branch | ❌ | ✅ | ✅ | ❌ |
| audit:read:org | ❌ | ✅ | ❌ | ❌ |
| audit:read:system | ✅ | ❌ | ❌ | ❌ |

### **4.4. Implementation of Custom Guards**

To ensure system security, a multi-layered protection approach is used. Requests to each protected endpoint must pass through the following chain of Guards:

1. **JwtAuthGuard (AuthGuard('jwt')):** This is NestJS's standard Passport guard that extracts the accessToken from the Authorization header, verifies its signature and expiration. Upon successful verification, it decodes the token payload and places it in the request.user object. This lays the foundation for the subsequent guards to operate.  
2. **DataScopeGuard:** This is one of the most critical security components of the system. Its sole purpose is to enforce data isolation. This guard reads the organizationId and branchIds (if available) values from the request.user object in every request. It then places these values into a special field on the request object (request.scope). Service methods are then forced to accept this scope object as a parameter. This approach eliminates the reliance on each developer to remember to filter data and makes the security policy mandatory at the architectural level. If a user is an ORG_ADMIN, they can only see data for their own organization; if a BRANCH_MANAGER, they can only see data for their assigned branches.  
3. **RolesGuard:** This guard compares the permissions required for the endpoint (obtained via a custom decorator like @Permissions('employee:create')) with the permissions available in the request.user.permissions array. If the required permission is not found, the request is rejected with a 403 Forbidden error. This enforces the RBAC matrix in practice.

This chain sequentially verifies the token's validity, the request's data scope, and the user's permissions, providing comprehensive control over system access.

### **4.5. Password Hashing and Security Policy**

* **Hashing Algorithm:** User passwords are not stored in plain text in the database. Instead, they are stored as a hashed value with a strong salt using the bcrypt library. The number of salt rounds is set to at least 12, which provides sufficient protection against brute-force attacks.  
* **Password Policy:** When creating or changing a new password, the following minimum requirements are checked at the DTO (Data Transfer Object) validation level:  
  * Minimum length: 8 characters.  
  * At least one uppercase letter.  
  * At least one lowercase letter.  
  * At least one number.  
  * At least one special character (e.g., !@#$%^&*).
