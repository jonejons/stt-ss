
## **6. Asynchronous Processing and Background Jobs (BullMQ)**

### **6.1. Queue Architecture and Configuration**

Processing all background tasks in a single queue is a common anti-pattern that can lead to "head-of-line blocking." For example, a slow task like generating a large report could block a critical, real-time device event that needs to be processed.

To prevent this problem, the system uses multiple domain-specific queues. This approach allows each type of task to have its own priority and concurrency settings, which increases the overall stability and responsiveness of the system.

* **events-queue:** High priority. For processing real-time events from devices. Concurrency: high (e.g., 10-20).  
* **notifications-queue:** Medium priority. For sending email and SMS notifications. Concurrency: medium (e.g., 5).  
* **exports-queue:** Low priority. For generating and exporting large reports. Concurrency: low (e.g., 1-2), as these tasks are resource-intensive.  
* **system-health-queue:** Medium priority. For periodic system tasks such as checking device status or expiring guest tokens.

### **6.2. Job Definitions**

Below is a description of the main background jobs and the logic of their "workers."

#### **Job: ProcessRawDeviceEvent (Consumer for RAW_DEVICE_EVENT)**

* **Queue Name:** events-queue.  
* **Worker Logic:**  
  1. Retrieves the job containing the DeviceEventLog ID from the queue.  
  2. Loads the full log record from the database.  
  3. If necessary, downloads the raw data (via rawPayloadUrl) from S3/MinIO.  
  4. Parses the event data to identify the user (e.g., by the employeeCode from a card).  
  5. Executes business logic: determines if this is a CHECK_IN or CHECK_OUT (e.g., based on the type of the employee's last event).  
  6. Creates a new Attendance record in the database.  
  7. Emits an ATTENDANCE_RECORDED event for other systems (e.g., the notifications module) to consume.  
* Error Handling and Retry Strategy:  
  If the worker fails while executing a job (e.g., the database is temporarily down), a mechanism for reliably retrying the job is necessary. Simple retries that happen immediately would likely fail again if the problem is not resolved, putting an unnecessary load on the system.  
  Instead, BullMQ's advanced retry strategies are used. For each critical job, the following settings are defined:  
  * attempts: 5: Attempt to re-run the job 5 times after a failure.  
  * backoff: A strategy to control the delay between retries.  
    * type: 'exponential': Exponential backoff. Each subsequent retry happens after a delay twice as long as the previous one.  
    * delay: 1000: The initial delay is 1000 ms (1 second).  
      With these settings, retries will occur at intervals of approximately 1, 2, 4, 8, and 16 seconds. This gives the subsystem (e.g., the database) enough time to recover. If all 5 attempts fail, the job is moved to a failed queue and flagged for manual review by an administrator.
