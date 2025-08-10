
## **9. Comprehensive Testing Strategy**

To ensure the system's reliability and correct functioning, a three-level testing strategy is employed: unit, integration, and end-to-end (E2E).

### **9.1. Unit Testing (Jest)**

* **Objective:** To test the business logic within services in complete isolation.  
* **Approach:** Separate tests are written for each service method. All external dependencies, including Prisma and adapters, are fully mocked using Jest's mocking functions (jest.fn(), mockResolvedValue). This ensures that the tests run quickly and focus solely on the code unit being tested.

### **9.2. Integration Testing (Jest + Testcontainers)**

* **Objective:** To verify that different components (services, Prisma, database) work correctly together.  
* Approach: Mocking the database can hide real-world problems (e.g., constraint violations, incorrect query logic). Therefore, integration tests must be run against a real database.  
  To achieve this effectively, the Testcontainers library is used. This library allows for programmatically spinning up ephemeral Docker containers for services like PostgreSQL and Redis before a test suite begins.  
  A global setup file for Jest (jest.setup.ts) will perform the following tasks:  
  1. Start the PostgreSQL and Redis containers before all tests begin (beforeAll).  
  2. Run the prisma migrate deploy command to create the schema in the test database.  
  3. Create a single PrismaClient instance connected to the test database and make it available globally for all test files.  
  4. Stop and remove the containers after all tests have finished (afterAll), ensuring a clean testing environment.

### **9.3. End-to-End Testing (Supertest + Testcontainers)**

* **Objective:** To test the system as a fully assembled unit, using real HTTP requests, from a user's perspective.  
* **Approach:** The Supertest library is used to send real HTTP requests to the NestJS application. These tests also run in a fully integrated environment (with PostgreSQL and Redis) created by Testcontainers. The following table lists the most critical E2E test scenarios that define the system's acceptance criteria.

| ID | Scenario Description | Expected Outcome |
| :---- | :---- | :---- |
| E2E-01 | **Main Flow:** A SUPER_ADMIN creates a new Organization and assigns an ORG_ADMIN to it. The ORG_ADMIN logs in and creates a new Branch and Department. | All operations are successful (201 Created, 200 OK). The created objects are verified via GET requests. |
| E2E-02 | **Employee and Attendance:** A BRANCH_MANAGER adds a new Employee to their branch. Then, an event about this employee's card is sent to the /events/raw endpoint. | The employee is successfully created. After the event is sent, a new "CHECK_IN" record is verified to exist in the Attendance table. |
| E2E-03 | **Guest Flow:** A Guest Visit is created and approved. Then, an event with their QR code is sent. | The guest's status changes to APPROVED. After the QR code event is sent, a GUEST_CHECK_IN record appears in the Attendance table. |
| E2E-04 | **Security (Isolation):** An ORG_ADMIN from Org A attempts to retrieve employee data from Org B (GET /api/v1/employees/:id). | A 404 Not Found error is returned. This is used instead of 403 Forbidden to prevent information leakage. |
| E2E-05 | **Security (Permissions):** A user logged in with the EMPLOYEE role attempts to create a new employee (POST /api/v1/employees). | A 403 Forbidden error is returned because this role does not have this permission. |
| E2E-06 | **Idempotency:** Two identical requests with the same Idempotency-Key header are sent sequentially to the /events/raw endpoint. | The first request returns 202 Accepted. The second request also immediately returns 202 Accepted. It is verified that only **one** Attendance record has been created in the database. |
| E2E-07 | **Background Job (Export):** A request to export a report (/api/v1/reports/attendance/export) is sent. | The endpoint immediately returns a 202 Accepted response, indicating that the background job has started. The result (e.g., a file link) is expected to arrive via a notification (which is verified via the stub). |
