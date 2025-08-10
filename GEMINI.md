# GEMINI.md: Sector Staff v2.1

This document provides a comprehensive overview of the Sector Staff v2.1 project, designed to be used as instructional context for AI agents and developers.

## Project Overview

Sector Staff v2.1 is a modular monolith application for multi-organization access control and attendance tracking. It is built with NestJS and follows a strict hierarchical data model: **System -> Organization -> Branch -> Department**. The system is designed for complete data isolation between organizations.

The key architectural principles are:

*   **Modular Monolith:** A single deployable unit with loosely coupled, domain-oriented modules.
*   **Hierarchical Data Scoping and Isolation:** Data access is strictly controlled and isolated at the Organization level.
*   **Event-Driven and Asynchronous Processing:** Background jobs are handled by BullMQ to ensure API responsiveness.
*   **Stateless Services and JWT-based Authentication:** The API is stateless, with context encoded in a JSON Web Token (JWT).

The backend is built with **NestJS (TypeScript)**, using **Prisma** as the ORM for a **PostgreSQL** database. **Redis** is used for caching and as a message broker for **BullMQ**. Object storage is handled by a **MinIO / S3-compatible service**.

## Building and Running

The project includes an automated setup script (`auto_agent_setup.sh`) that defines the steps to get the application running.

**Key Commands:**

*   **Install dependencies:** `npm install`
*   **Set up the database:** `docker-compose up -d postgres redis`
*   **Run database migrations:** `npx prisma migrate dev --name init`
*   **Seed the database:** `npx prisma db seed`
*   **Run the application:** `npm run start:dev`

## Development Conventions

The technical specification outlines a clear set of development conventions:

*   **Testing:** A three-level testing strategy is employed:
    *   **Unit Testing (Jest):** Services are tested in isolation with mocked dependencies.
    *   **Integration Testing (Jest + Testcontainers):** Components are tested against a real database spun up in a Docker container.
    *   **End-to-End Testing (Supertest + Testcontainers):** The entire system is tested with real HTTP requests.
*   **API Specification:** The API is organized into modules, with detailed endpoint specifications. Idempotency is a key requirement for state-changing endpoints, implemented using an `Idempotency-Key` header.
*   **Authentication and Authorization:**
    *   Authentication is handled by JWT (access and refresh tokens).
    *   Authorization is based on a Role-Based Access Control (RBAC) system, enforced by a `RolesGuard`.
    *   A `DataScopeGuard` ensures data isolation between organizations.
*   **Asynchronous Processing:** Background jobs are processed by BullMQ, with separate queues for different task priorities (e.g., `events-queue`, `notifications-queue`).
*   **Integration Layer:** The Adapter design pattern is used to decouple the core business logic from external services (e.g., `IStorageAdapter`, `INotificationAdapter`).
*   **Logging:** All logs are structured in JSON format for easy parsing by log aggregation platforms.
*   **Auditing:** An `AuditLogInterceptor` automatically records all important changes to the system in an `AuditLog` table.
*   **CI/CD:** A CI/CD pipeline is defined in `.github/workflows/ci.yml` to automate testing, building, and deployment.

## Mundarija

### [**Texnik spetsifikatsiya (TS): Sector Staff v2.1**](01_introduction.md#texnik-spetsifikatsiya-ts-sector-staff-v21-multi-organization-nestjs--modular-monolith)

**[1. Kirish va arxitektura tamoyillari](01_introduction.md#1-kirish-va-arxitektura-tamoyillari)**
*   [1.1. Tizim haqida umumiy ma'lumot va maqsad](01_introduction.md#11-tizim-haqida-umumiy-malumot-va-maqsad)
*   [1.2. Asosiy arxitektura ustunlari](01_introduction.md#12-asosiy-arxitektura-ustunlari)
*   [1.3. Loyiha doirasi chegaralari](01_introduction.md#13-loyiha-doirasi-chegaralari)

**[2. Tizim arxitekturasi va texnologiyalar steki](02_system_architecture.md#2-tizim-arxitekturasi-va-texnologiyalar-steki)**
*   [2.1. Yuqori darajali arxitektura diagrammasi](02_system_architecture.md#21-yuqori-darajali-arxitektura-diagrammasi)
*   [2.2. Texnologiyalar steki spetsifikatsiyasi](02_system_architecture.md#22-texnologiyalar-steki-spetsifikatsiyasi)
*   [2.3. Loyiha tuzilmasi va modullarni tashkil etish](02_system_architecture.md#23-loyiha-tuzilmasi-va-modullarni-tashkil-etish)

**[3. Ma'lumotlar bazasi sxemasi va modellari (Prisma)](03_database_schema.md#3-malumotlar-bazasi-sxemasi-va-modellari-prisma)**
*   [3.1. To'liq `schema.prisma` ta'rifi](03_database_schema.md#31-toliq-schemaprisma-tarifi)
    *   [3.1.1. `BRANCH_MANAGER` rolini to'g'ri modellashtirish](03_database_schema.md#311-branch_manager-rolini-togri-modellashtirish)
    *   [3.1.2. Yakuniy sxema](03_database_schema.md#312-yakuniy-sxema)
    *   [3.1.3. Ma'lumotlar yaxlitligi va unumdorligi](03_database_schema.md#313-malumotlar-yaxlitligi-va-unumdorligi)

**[4. Autentifikatsiya, avtorizatsiya va xavfsizlik](04_authentication.md#4-autentifikatsiya-avtorizatsiya-va-xavfsizlik)**
*   [4.1. JWT tuzilmasi va da'volari (Kirish va yangilash tokenlari)](04_authentication.md#41-jwt-tuzilmasi-va-davolari-kirish-va-yangilash-tokenlari)
*   [4.2. Tokenlarning hayot aylanishi va ularni boshqarish](04_authentication.md#42-tokenlarning-hayot-aylanishi-va-ularni-boshqarish)
*   [4.3. Rolga asoslangan kirishni boshqarish (RBAC)](04_authentication.md#43-rolga-asoslangan-kirishni-boshqarish-rbac)
*   [4.4. Maxsus himoyachilarni (Guards) amalga oshirish](04_authentication.md#44-maxsus-himoyachilarni-guards-amalga-oshirish)
*   [4.5. Parolni xeshlash va xavfsizlik siyosati](04_authentication.md#45-parolni-xeshlash-va-xavfsizlik-siyosati)

**[5. Modulli API spetsifikatsiyasi (Endpointlar)](05_api_specification.md#5-modulli-api-spetsifikatsiyasi-endpointlar)**
*   [5.6. `DeviceModule` (`/api/v1/devices`)](05_api_specification.md#56-devicemodule-apiv1devices)
    *   [5.6.1. Modul haqida umumiy ma'lumot](05_api_specification.md#561-modul-haqida-umumiy-malumot)
    *   [5.6.2. Endpoint: `POST /api/v1/events/raw`](05_api_specification.md#562-endpoint-post-apiv1eventsraw)

**[6. Asinxron ishlov berish va fon vazifalari (BullMQ)](06_async_processing.md#6-asinxron-ishlov-berish-va-fon-vazifalari-bullmq)**
*   [6.1. Navbat arxitekturasi va konfiguratsiyasi](06_async_processing.md#61-navbat-arxitekturasi-va-konfiguratsiyasi)
*   [6.2. Vazifalar ta'riflari](06_async_processing.md#62-vazifalar-tariflari)
    *   [Vazifa: `ProcessRawDeviceEvent` (`RAW_DEVICE_EVENT` uchun iste'molchi)](06_async_processing.md#job-processrawdeviceevent-consumer-for-raw_device_event)

**[7. Integratsiya va adapter qatlami](07_integration_layer.md#7-integratsiya-va-adapter-qatlami)**
*   [7.1. Adapter dizayn namunasi](07_integration_layer.md#71-adapter-dizayn-namunasi)
*   [7.2. Interfeys ta'riflari (TypeScript)](07_integration_layer.md#72-interfeys-tariflari-typescript)

**[8. Audit va jurnal yuritish strategiyasi](08_audit_logging.md#8-audit-va-jurnal-yuritish-strategiyasi)**
*   [8.1. Tuzilgan jurnal yuritish (JSON formati)](08_audit_logging.md#81-tuzilgan-jurnal-yuritish-json-formati)
*   [8.2. Audit jurnalini kuzatish](08_audit_logging.md#82-audit-jurnalini-kuzatish)

**[9. Keng qamrovli testlash strategiyasi](09_testing_strategy.md#9-keng-qamrovli-testlash-strategiyasi)**
*   [9.1. Birlik testlash (Jest)](09_testing_strategy.md#91-birlik-testlash-jest)
*   [9.2. Integratsion testlash (Jest + Testcontainers)](09_testing_strategy.md#92-integratsion-testlash-jest--testcontainers)
*   [9.3. End-to-End testlash (Supertest + Testcontainers)](09_testing_strategy.md#93-end-to-end-testlash-supertest--testcontainers)

**[10. Joylashtirish va operatsiyalar (CI/CD)](10_deployment.md#10-deployment-va-operatsiyalar-cicd)**
*   [10.1. Konteynerlashtirish](10_deployment.md#101-konteynerlashtirish)
*   [10.2. CI/CD konveyeri (GitHub Actions)](10_deployment.md#102-cicd-konveyeri-github-actions)
*   [10.3. Konfiguratsiyani boshqarish](10_deployment.md#103-konfiguratsiyani-boshqarish)

**[11. Foydalanilgan adabiyotlar](11_references.md#works-cited)**