
## **3. Database Schema and Models (Prisma)**

### **3.1. Full schema.prisma Definition**

Below is the final and complete Prisma schema for the system. This schema has been carefully designed to ensure data integrity, correct relationships, and query performance.

#### **3.1.1. Correct Modeling of the BRANCH_MANAGER Role**

In the initial technical specification, the BRANCH_MANAGER role was linked to a single branch via the managedBranchId field in the OrganizationUser model. This approach does not align with business requirements, as the branchIds array in the JWT token implies that a manager can manage multiple branches. To resolve this inconsistency and make the system scalable, it is necessary to model the "many-to-many" relationship through an explicit join table. This approach is recommended in Prisma's documentation and ensures logical correctness at the database level.

To solve this issue, the managedBranchId and managedBranch fields are removed from the OrganizationUser model, and a new ManagedBranch model is introduced to link the OrganizationUser and Branch models. This change fully aligns the data model with the authentication mechanism.

#### **3.1.2. Final Schema**

// This is your Prisma schema file,  
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {  
  provider = "prisma-client-js"  
}

datasource db {  
  provider = "postgresql"  
  url      = env("DATABASE_URL")  
}

// 1. Core organization model  
model Organization {  
  id          String    @id @default(uuid())  
  name        String    @unique  
  description String?  
  createdAt   DateTime  @default(now())  
  updatedAt   DateTime  @updatedAt

  users       OrganizationUser[]  
  branches    Branch[]  
  employees   Employee[]  
  devices     Device[]  
  guestVisits GuestVisit[]  
  auditLogs   AuditLog[]  
}

// 2. Users and their roles  
model User {  
  id           String             @id @default(uuid())  
  email        String             @unique  
  passwordHash String  
  fullName     String?  
  isActive     Boolean            @default(true)  
  createdAt    DateTime           @default(now())  
  updatedAt    DateTime           @updatedAt

  organizationLinks OrganizationUser[]  
  auditLogs         AuditLog[]  
}

model OrganizationUser {  
  id             String       @id @default(uuid())  
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)  
  userId         String  
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)  
  organizationId String  
  role           Role

  // This link shows which branch(es) this user manages  
  managedBranches ManagedBranch[]

  createdAt      DateTime     @default(now())

  @@unique([userId, organizationId])  
  @@index([organizationId])  
  @@index([userId])  
}

enum Role {  
  SUPER_ADMIN  
  ORG_ADMIN  
  BRANCH_MANAGER  
  EMPLOYEE  
}

// 3. Organization branches (locations)  
model Branch {  
  id             String    @id @default(uuid())  
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)  
  organizationId String  
  name           String  
  address        String?  
  createdAt      DateTime  @default(now())  
  updatedAt      DateTime  @updatedAt

  departments    Department[]  
  employees      Employee[]  
  devices        Device[]  
  guestVisits    GuestVisit[]  
      
  // This link shows which manager(s) manage this branch  
  managers       ManagedBranch[]

  @@unique([organizationId, name])  
  @@index([organizationId])  
}

// 3.1. Many-to-many join table between Manager and Branch  
model ManagedBranch {  
  id        String       @id @default(uuid())  
  manager   OrganizationUser @relation(fields: [managerId], references: [id], onDelete: Cascade)  
  managerId String  
  branch    Branch       @relation(fields: [branchId], references: [id], onDelete: Cascade)  
  branchId  String  
  assignedAt DateTime    @default(now())

  @@unique([managerId, branchId])  
  @@index([managerId])  
  @@index([branchId])  
}

// 4. Departments within a branch  
model Department {  
  id        String   @id @default(uuid())  
  branch    Branch   @relation(fields: [branchId], references: [id], onDelete: Cascade)  
  branchId  String  
  name      String  
  parentId  String?  // For internal hierarchy (self-relation)  
  parent    Department? @relation("DepartmentHierarchy", fields: [parentId], references: [id], onDelete: SetNull)  
  children  Department[] @relation("DepartmentHierarchy")  
      
  createdAt DateTime @default(now())  
  updatedAt DateTime @updatedAt

  employees Employee[]

  @@unique([branchId, name])  
  @@index([branchId])  
}

// 5. Employees  
model Employee {  
  id             String     @id @default(uuid())  
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)  
  organizationId String  
  branch         Branch     @relation(fields: [branchId], references: [id], onDelete: Cascade)  
  branchId       String  
  department     Department? @relation(fields: [departmentId], references: [id], onDelete: SetNull)  
  departmentId   String?  
      
  firstName      String  
  lastName       String  
  employeeCode   String     // Must be unique within the organization  
  email          String?    @unique  
  phone          String?  
  isActive       Boolean    @default(true)  
      
  createdAt      DateTime   @default(now())  
  updatedAt      DateTime   @updatedAt  
      
  attendances    Attendance[]

  @@unique([organizationId, employeeCode])  
  @@index([organizationId])  
  @@index([branchId])  
  @@index([departmentId])  
}

// 6. Devices  
model Device {  
  id             String       @id @default(uuid())  
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)  
  organizationId String  
  branch         Branch       @relation(fields: [branchId], references: [id], onDelete: Cascade)  
  branchId       String

  name           String  
  type           DeviceType  
  ipAddress      String?  
  macAddress     String?      @unique  
  model          String?  
  status         DeviceStatus @default(ONLINE)  
  lastSeenAt     DateTime?  
      
  createdAt      DateTime     @default(now())  
  updatedAt      DateTime     @updatedAt

  events         DeviceEventLog[]  
  attendances    Attendance[]

  @@unique([organizationId, name])  
  @@index([branchId, status])  
}

enum DeviceType { CAMERA, CARD_READER, FINGERPRINT, ANPR, OTHER }  
enum DeviceStatus { ONLINE, OFFLINE, DEGRADED, ERROR }

// 7. Guest visits  
model GuestVisit {  
  id                      String    @id @default(uuid())  
  organization            Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)  
  organizationId          String  
  branch                  Branch    @relation(fields: [branchId], references: [id], onDelete: Cascade)  
  branchId                String  
      
  guestName               String  
  guestContact            String?  
  responsibleEmployeeId   String?   // Employee.id  
      
  scheduledEntryTime      DateTime  
  scheduledExitTime       DateTime  
      
  status                  GuestStatus @default(PENDING_APPROVAL)  
  accessCredentialType    AccessCredentialType  
  accessCredentialHash    String?      // Hashed value for QR code or temporary card  
      
  createdByUserId         String    // User.id  
  createdAt               DateTime  @default(now())  
  updatedAt               DateTime  @updatedAt

  attendances             Attendance[]

  @@index([branchId, status])  
  @@index([accessCredentialHash])  
}

enum GuestStatus { PENDING_APPROVAL, APPROVED, ACTIVE, COMPLETED, EXPIRED, REJECTED }  
enum AccessCredentialType { QR_CODE, TEMP_CARD }

// 8. Attendance  
model Attendance {  
  id             String       @id @default(uuid())  
  organizationId String  
  branchId       String  
      
  employee       Employee?    @relation(fields: [employeeId], references: [id], onDelete: SetNull)  
  employeeId     String?  
  guestVisit     GuestVisit?  @relation(fields: [guestId], references: [id], onDelete: SetNull)  
  guestId        String?  
  device         Device?      @relation(fields: [deviceId], references: [id], onDelete: SetNull)  
  deviceId       String?  
      
  eventType      AttendanceEventType  
  timestamp      DateTime     @default(now())  
  meta           Json?        // Additional information (e.g., temperature)  
      
  createdAt      DateTime     @default(now())

  @@index([organizationId, employeeId, timestamp])  
  @@index([organizationId, guestId, timestamp])  
}

enum AttendanceEventType { CHECK_IN, CHECK_OUT, GUEST_CHECK_IN, GUEST_CHECK_OUT, MANUAL_ENTRY }

// 9. Events and Audit logs  
model DeviceEventLog {  
  id             String    @id @default(uuid())  
  organizationId String  
  deviceId       String  
  device         Device    @relation(fields: [deviceId], references: [id], onDelete: Cascade)  
      
  eventType      String    // e.g., "face.scan", "card.read"  
  timestamp      DateTime  
  rawPayloadUrl  String?   // Reference to the raw data in S3/MinIO  
  metadata       Json?     // Processed data  
  isProcessed    Boolean   @default(false)  
      
  createdAt      DateTime  @default(now())

  @@index([organizationId, deviceId, timestamp])  
}

model AuditLog {  
  id             String       @id @default(uuid())  
  organizationId String?  
  organization   Organization? @relation(fields: [organizationId], references: [id], onDelete: SetNull)  
      
  userId         String  
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)  
      
  action         String       // e.g.: "CREATE_EMPLOYEE"  
  entity         String       // "Employee"  
  entityId       String?  
  oldValue       Json?  
  newValue       Json?  
      
  createdAt      DateTime     @default(now())

  @@index([organizationId, userId, createdAt])  
}

#### **3.1.3. Data Integrity and Performance**

* **onDelete Relation Policies:**  
  * onDelete: Cascade is used to ensure that dependent data is logically deleted along with the parent object. For example, when an Organization is deleted, all its Branch, Employee, and other related records are automatically removed. This prevents the creation of "orphaned" records.  
  * onDelete: SetNull is used in cases where the dependency is not mandatory. For example, when a Department is deleted, the linked Employee records are not deleted; only their departmentId field is set to null. This allows employee data to be preserved.  
* **Indexing (@@index, @unique):**  
  * The schema includes indexes (@@index) for frequently filtered and searched fields. Indexing fields like organizationId, branchId, and userId is crucial for dramatically improving query performance in a multi-tenant system.  
  * Uniqueness constraints (@unique, @@unique) guarantee data correctness at the database level (e.g., within the same organizationId, there cannot be two identical employeeCode values).
