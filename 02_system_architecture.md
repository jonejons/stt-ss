
## **2. System Architecture and Technology Stack**

### **2.1. High-Level Architecture Diagram**

The system architecture includes the following components and interactions:

A client (e.g., a web browser or mobile app) sends requests through a Load Balancer. The Load Balancer directs the requests to one of the available instances of the NestJS application.

1. **NestJS Application (Modular Monolith):**  
   * **API Gateway/Controllers:** Receives incoming HTTP requests, passing them through Guards for authentication and authorization.  
   * **Services:** Contains the business logic. It interacts with the database via PrismaClient, with queues via BullMQ, and with other external services via Adapters.  
   * **Event Emitters:** When a significant event occurs within the business logic (e.g., GUEST_APPROVED), it emits these events to the system's internal event bus.  
   * **Queue Producers:** Adds tasks that need to be executed asynchronously (e.g., processing a RAW_DEVICE_EVENT) to the BullMQ queue.  
2. **Data Storage Layers:**  
   * **PostgreSQL:** The primary relational database. All core data (organizations, users, employees, etc.) is stored here. It is managed via the Prisma ORM.  
   * **Redis:** Serves two primary functions:  
     * **Broker for BullMQ:** Manages the queues for background jobs.  
     * **Cache:** Used for storing frequently requested but infrequently changing data (e.g., configurations) and for temporary states like the Idempotency-Key.  
   * **MinIO / S3-compatible service:** Used for object storage. Raw device events (e.g., images from a face scan), generated reports, and other large files are stored here.  
3. **Asynchronous Handlers (BullMQ Workers):**  
   * These are consumers that can run as separate processes from the NestJS application. They retrieve tasks from the queues in Redis and execute them in the background (e.g., generating a report, checking device status).

This architecture reduces component coupling, enhances system responsiveness, and allows for horizontal scaling.

### **2.2. Technology Stack Specification**

The selected technologies, their versions, and the reasons for their choice are provided in the table below.

| Technology | Recommended Version | Rationale for Choice |
| :---- | :---- | :---- |
| **Backend Framework** | NestJS (TypeScript) v10.x | For its scalable, modular architecture, full TypeScript support, and robust ecosystem. |
| **ORM** | Prisma v5.x | For strong type safety, easy migrations, and high-level integration with PostgreSQL. |
| **Database** | PostgreSQL v15.x | For its reliability, advanced SQL capabilities, and support for complex queries. |
| **Queue** | BullMQ (with Redis) | For reliable, high-performance background job management, retry strategies, and advanced features like FlowProducer. |
| **Cache** | Redis v7.x | For high-speed caching, session management, and as a broker for BullMQ. |
| **Object Storage** | MinIO / S3-compatible service | A scalable, standardized (S3 API), and cost-effective solution for storing large files. |
| **Authentication** | JWT, Passport.js | Industry standard for stateless authentication. Passport.js allows for easy integration of various strategies. |
| **Testing** | Jest (unit/integration), Supertest (e2e) | Deeply integrated into the NestJS ecosystem, providing comprehensive testing capabilities. |
| **CI/CD** | GitHub Actions | To simplify automated testing, build, and deployment processes. |
| **Containerization** | Docker, Docker Compose | To ensure consistency between development, testing, and production environments. |

### **2.3. Project Structure and Module Organization**

The system's source code (src) will have the following modular structure. This structure enables a clear separation of concerns and makes the codebase easy to manage.

src/  
├── app/                     // The application's main module and configuration  
│   └── app.module.ts  
├── core/                    // Common, core modules for the entire application  
│   ├── config/              // Environment variables and configuration  
│   ├── database/            // Prisma service and module  
│   ├── logger/              // Structured logging service  
│   └── queue/               // BullMQ modules and configuration  
├── shared/                  // Resources shared between modules  
│   ├── decorators/          // Custom decorators (e.g., @User(), @Public())  
│   ├── dto/                 // Common data transfer objects (DTOs)  
│   ├── enums/               // Common enumerations  
│   ├── guards/              // Common guards (e.g., RolesGuard, DataScopeGuard)  
│   ├── interfaces/          // Common interfaces  
│   └── utils/               // Helper functions  
├── modules/                 // Domain-oriented business modules  
│   ├── auth/                // Authentication and authorization  
│   ├── organization/        // Management of organizations  
│   ├── user/                // Management of users  
│   ├── branch/              // Management of branches  
│   ├── department/          // Management of departments  
│   ├── employee/            // Management of employees  
│   ├── device/              // Management of devices  
│   ├── guest/               // Management of guests  
│   ├── attendance/          // Attendance recording and management  
│   ├── reporting/           // Report generation  
│   ├── audit/               // Audit log tracking  
│   └── integration/         // Adapters for external systems  
│       ├── adapters/        // Adapter interfaces  
│       └── stubs/           // Stub implementations of adapters  
└── main.ts                  // The application's entry point
