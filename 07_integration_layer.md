
## **7. Integration and Adapter Layer**

### **7.1. Adapter Design Pattern**

The Adapter (or Port) design pattern is used to separate the system's core business logic from external infrastructure details (databases, messaging services, file storage). This approach offers the following advantages:

* **Testability:** It allows the business logic to be tested in isolation using mock adapters without needing the real implementations of external services.  
* **Flexibility:** It makes it easy to switch providers. For example, to migrate file storage from MinIO to AWS S3, one only needs to change the implementation of the StorageAdapter; the business logic remains unchanged.

### **7.2. Interface Definitions (TypeScript)**

Below are the core adapter interfaces and their methods. The AI or developers must create stub implementations for these interfaces.

* IStorageAdapter: Responsible for file storage and management.  
  The initial specification assumed the server would handle file uploads itself. However, uploading large files (e.g., video recordings) through a NestJS server monopolizes its network bandwidth and compute resources, which can block the event loop. Furthermore, it requires granting extensive S3 write permissions to the server, which is undesirable from a security perspective.  
  Instead, the best practice accepted in the industry—using pre-signed URLs—will be used. The client (or in our case, the logic that processes the device event) obtains a temporary URL with limited permissions from the server and uploads the file directly to the storage bucket. This offloads the upload burden from the server.

interface IStorageAdapter {  
  /**  
   * Creates a pre-signed URL for a direct upload to S3/MinIO.  
   * @param bucket - The name of the storage bucket.  
   * @param key - The unique key (file path) for the object.  
   * @param expiresIn - The expiration time of the URL (in seconds).  
   * @param contentType - The MIME type of the file to be uploaded.  
   * @returns {Promise<string>} The URL intended for upload.  
   */  
  getPresignedUploadUrl(bucket: string, key: string, expiresIn: number, contentType: string): Promise<string>;

  /**  
   * Creates a pre-signed URL to view a protected file.  
   * @param bucket - The name of the storage bucket.  
   * @param key - The key of the object.  
   * @param expiresIn - The expiration time of the URL (in seconds).  
   * @returns {Promise<string>} The URL intended for download.  
   */  
  getPresignedDownloadUrl(bucket: string, key: string, expiresIn: number): Promise<string>;  
}

* **INotificationAdapter:** For sending email and SMS notifications.

interface INotificationAdapter {  
  sendEmail(to: string, subject: string, body: string): Promise<void>;  
  sendSms(to: string, message: string): Promise<void>;  
}

* **IDeviceAdapter:** For sending commands to physical devices (e.g., opening a door).

interface IDeviceAdapter {  
  openDoor(deviceId: string, duration: number): Promise<boolean>;  
  updateConfig(deviceId: string, config: Record<string, any>): Promise<boolean>;  
}

* **IMatchingAdapter:** For sending requests to an external service for biometric matching.

interface IMatchingAdapter {  
  requestMatch(template: Buffer): Promise<{ isMatch: boolean; confidence?: number }>;  
}

Each stub implementation should either throw a NotImplementedException or log a message and return a fake response (e.g., // TODO: Implement real integration here).
