
# **Technical Specification (TS): Sector Staff v2.1 (Multi-Organization, NestJS — Modular Monolith)**

Version: 2.1 (Organization-Branch-Department Model and Advanced Architectural Principles)

Date: 10.08.2025

Document Status: Final, Approved

## **1. Introduction and Architectural Principles**

### **1.1. System Overview and Objective**

This document defines the final technical specification (TS) for the **Sector Staff v2.1** system. It supersedes all previous versions and serves as the single source of truth for the project's development.

The system is a modular monolith application designed for multi-organization access control and attendance tracking. It adheres to a strict hierarchical data model: **System -> Organization -> Branch -> Department**. The primary objective of the system is to ensure complete data isolation for each organization while enabling the efficient management of complex hierarchical structures within an organization. This document should serve as the foundation for an AI code generator or a team of developers to create the system in a complete and automated manner.

### **1.2. Key Architectural Pillars**

To ensure the system's stability, scalability, and security, the following architectural principles are strictly followed:

* **Modular Monolith:** The application is built as a single deployable unit, but is internally separated into loosely coupled, domain-oriented modules (e.g., Auth, Organization, Employee). This approach balances the simplicity of the development process with the separation of logical responsibilities, creating a foundation for a future transition to microservices if necessary.  
* **Hierarchical Data Scoping and Isolation:** This is the cornerstone of the architecture. Access to data is strictly controlled and isolated at the Organization level. No user or service can access data outside their assigned organization boundary. This restriction is enforced mandatorily at the authentication guard layer.  
* **Event-Driven and Asynchronous Processing:** Time-consuming or non-critical tasks (e.g., report generation, processing device events, sending notifications) are offloaded to a background job queue (BullMQ). This ensures that API endpoints remain highly responsive and the system is resilient to sudden spikes in processing load.  
* **Stateless Services and JWT-based Authentication:** The API will be stateless. All necessary context for authorizing a request (userId, organizationId, branchIds, roles) is encoded within a JSON Web Token (JWT). This simplifies scaling and load balancing, as any server instance can handle any given request.

### **1.3. Scope Boundaries**

The following tasks are outside the scope of this project and should not be implemented by the AI or developers:

* **Biometric Matching Logic:** The core algorithm for fingerprint or facial matching is outside the project's scope. The system will only interact with a matching service via a defined IMatchingAdapter interface.  
* **Device-Specific API Integration:** Direct integration with hardware APIs (e.g., Hikvision SDK) is not within the project's scope. All such interactions are abstracted through an IDeviceAdapter.  
* **Frontend UI/UX:** This specification is only for the backend system.  
* **Implementation of Third-Party Providers:** The real implementations of SMS, Email, and Object Storage providers are not within the project's scope. The system will be built against INotificationAdapter and IStorageAdapter interfaces.
