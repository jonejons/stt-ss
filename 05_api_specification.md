
## **5. Modular API Specification (Endpoints)**

This section provides a detailed description of the API endpoints, their requirements, and business logic for each system module. As an example, the DeviceModule and its most important endpoint are described in detail.

### **5.6. DeviceModule (/api/v1/devices)**

#### **5.6.1. Module Overview**

This module is responsible for managing the lifecycle of physical devices (cameras, card readers, etc.) in an organization's branches. This includes registering devices, monitoring their status, and receiving events from them.

#### **5.6.2. Endpoint: POST /api/v1/events/raw**

* **Description:** The main entry point for receiving all raw events (e.g., face scans, card reads) from physical devices. This endpoint is designed for high throughput and reliability. Its primary task is to quickly accept the event, queue it for processing, and return an immediate response.  
* **Required Role(s):** None (authentication is done via a device-specific API key/secret, not a user JWT). A separate DeviceAuthGuard will be implemented for this purpose.  
* **Request Headers:** Idempotency-Key: <UUID> — Mandatory.  
* **Request Body:** A generic event payload. For example:

{  
  "eventType": "card.read",  
  "timestamp": "2025-08-10T10:00:00Z",  
  "payload": {  
    "cardId": "HEX_CARD_ID",  
    "temperature": 36.6  
  }  
}

* **Successful Response (202):** 202 Accepted. The response must be returned immediately to confirm that the request has been received. Processing will occur asynchronously.  
* **Error Responses (4xx, 5xx):** The following table lists possible error codes and their causes for this endpoint.

| Code | Cause | Description |
| :---- | :---- | :---- |
| 400 | Bad Request | Idempotency-Key header is missing or in an invalid format. |
| 401 | Unauthorized | The device's API key is invalid. |
| 429 | Too Many Requests | The rate limit has been exceeded. |
| 503 | Service Unavailable | The queue service (Redis) is down. |

* Detailed Business Logic and Idempotency:  
  This endpoint is a critical entry point for state-changing data. Network interruptions can cause devices to send the same event multiple times, leading to duplicate attendance records. For this reason, implementing idempotency is not an "added convenience" but a fundamental requirement for data integrity.  
  To solve this problem, an approach is used that aligns with industry standards like the Stripe API. The client (device) generates a unique Idempotency-Key for each new operation and sends it in the request header. The server uses this key to check if the operation has already been performed.  
  The logic of the endpoint is as follows:  
  1. Authenticate the device via DeviceAuthGuard.  
  2. Extract the Idempotency-Key from the header. If it is missing, return 400 Bad Request.  
  3. Check for a cached response for this key in Redis (GET idempotency:response:<key>).  
  4. **If a response is found for the key:** Immediately return the cached response (e.g., 202 Accepted) and do not perform any further actions. This effectively handles duplicate requests.  
  5. If the key is not found:  
     a. Set a short-term lock in Redis to prevent race conditions (SET idempotency:lock:<key> "locked" NX EX 60). If the lock fails to set (meaning another parallel request has set the lock), either wait and retry or return a 409 Conflict.  
     b. Upload the incoming raw payload to S3/MinIO via IStorageAdapter.  
     c. Create a new DeviceEventLog record in PostgreSQL, storing a reference to the S3 object (rawPayloadUrl).  
     d. Add a task named RAW_DEVICE_EVENT to the events-queue in BullMQ. The payload includes the ID of the DeviceEventLog record.  
     e. Upon successful queuing, cache the 202 Accepted response in Redis along with the Idempotency-Key (SET idempotency:response:<key> '{"status": 202}' EX 86400).  
     f. Remove the lock (DEL idempotency:lock:<key>).  
     g. Return the 202 Accepted response to the client.
