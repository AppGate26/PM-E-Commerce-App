# DELIVERY & RECOVERY MODULES - API DOCUMENTATION

## DELIVERY MODULE

### Authentication Endpoints

#### 1. Login Delivery Agent
- **Endpoint**: `POST /api/delivery/auth/login`
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response**: JWT token + delivery agent details

#### 2. Forgot Password
- **Endpoint**: `POST /api/delivery/auth/forgot-password`
- **Request Body**:
  ```json
  {
    "email": "string"
  }
  ```
- **Response**: Password reset link sent

#### 3. Change Password
- **Endpoint**: `PUT /api/delivery/auth/change-password`
- **Request Body**:
  ```json
  {
    "oldPassword": "string",
    "newPassword": "string",
    "confirmPassword": "string"
  }
  ```
- **Response**: Success message

### Delivery Management Endpoints

#### 4. Get Pending Deliveries
- **Endpoint**: `GET /api/delivery/pending`
- **Query Params**:
  - `page` (default: 0)
  - `size` (default: 10)
- **Response**: Paginated list of pending deliveries
  ```json
  {
    "content": [
      {
        "id": "long",
        "orderId": "long",
        "productId": "long",
        "productName": "string",
        "productImage": "string",
        "deliveryAddress": "string",
        "customerName": "string",
        "customerPhone": "string",
        "estimatedTime": "string",
        "status": "PENDING"
      }
    ],
    "totalPages": "int",
    "totalElements": "long"
  }
  ```

#### 5. Get Delivery Details
- **Endpoint**: `GET /api/delivery/{deliveryId}`
- **Response**: Full delivery details including product info, customer info, sales ref

#### 6. Confirm Delivery
- **Endpoint**: `POST /api/delivery/confirm`
- **Request Body** (multipart/form-data):
  ```
  deliveryId: long
  deliveryAgentName: string
  deliveryAddress: string
  itemOfDelivery: string
  proofOfDeliveryImage: MultipartFile
  timeOfDelivery: LocalDateTime
  ```
- **Response**: Success message

#### 7. Submit Delivery Feedback
- **Endpoint**: `POST /api/delivery/feedback`
- **Request Body**:
  ```json
  {
    "deliveryId": "long",
    "deliveryAgentName": "string",
    "productId": "long",
    "customerName": "string",
    "status": "DELIVERED | WRONG_PRODUCT | OWNER_NOT_AVAILABLE | WRONG_ADDRESS"
  }
  ```
- **Response**: Success message

#### 8. Get Delivery History
- **Endpoint**: `GET /api/delivery/history`
- **Query Params**:
  - `startDate` (optional)
  - `endDate` (optional)
  - `search` (optional)
  - `page` (default: 0)
  - `size` (default: 10)
  - `sortBy` (default: "deliveryDate")
- **Response**: Paginated list of delivery history
  ```json
  {
    "content": [
      {
        "id": "long",
        "deliveryDate": "LocalDate",
        "deliveryAgentName": "string",
        "productName": "string",
        "customerName": "string",
        "status": "DELIVERED | FAILED",
        "deliveryAddress": "string"
      }
    ]
  }
  ```

#### 9. Create New Delivery (Admin)
- **Endpoint**: `POST /api/admin/delivery/create`
- **Request Body**:
  ```json
  {
    "orderId": "long",
    "deliveryAgentId": "long",
    "estimatedDeliveryTime": "string"
  }
  ```
- **Response**: Created delivery details

---

## RECOVERY MODULE

### Authentication Endpoints

#### 10. Login Recovery Agent
- **Endpoint**: `POST /api/recovery/auth/login`
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response**: JWT token + recovery agent details

### Recovery Management Endpoints

#### 11. Get Goods to be Recovered
- **Endpoint**: `GET /api/recovery/pending`
- **Query Params**:
  - `page` (default: 0)
  - `size` (default: 10)
  - `status` (optional): "NOT_YET_RECOVERED | RECOVERED"
- **Response**: Paginated list of customers with items to recover
  ```json
  {
    "content": [
      {
        "customerId": "long",
        "customerName": "string",
        "customerPhoto": "string",
        "recoveryStatus": "NOT_YET_RECOVERED | RECOVERED",
        "numberOfItems": "int"
      }
    ]
  }
  ```

#### 12. Get Customer Recovery Details
- **Endpoint**: `GET /api/recovery/customer/{customerId}`
- **Response**: Customer details with list of items to recover
  ```json
  {
    "customerId": "long",
    "customerInfo": {
      "fullName": "string",
      "homeAddress": "string",
      "city": "string",
      "phoneNumber": "string",
      "emailAddress": "string",
      "photo": "string"
    },
    "guarantorInfo": {
      "fullName": "string",
      "homeAddress": "string",
      "city": "string",
      "phoneNumber": "string",
      "emailAddress": "string"
    },
    "itemsToRecover": [
      {
        "productId": "long",
        "productName": "string",
        "productImage": "string",
        "quantity": "int",
        "description": "string",
        "recoveryStatus": "NOT_YET_RECOVERED | RECOVERED"
      }
    ]
  }
  ```

#### 13. Upload Recovery Photo
- **Endpoint**: `POST /api/recovery/upload-photo`
- **Request Body** (multipart/form-data):
  ```
  recoveryId: long
  recoveryPhoto: MultipartFile
  ```
- **Response**: Photo URL

#### 14. Mark Item as Recovered
- **Endpoint**: `POST /api/recovery/mark-recovered`
- **Request Body**:
  ```json
  {
    "customerId": "long",
    "productId": "long",
    "recoveryPhoto": "string",
    "timeOfRecovery": "LocalDateTime",
    "numberOfItemsRecovered": "int",
    "recoveryAgentId": "long"
  }
  ```
- **Response**: Success message

#### 15. Get Recovery Reports
- **Endpoint**: `GET /api/recovery/reports`
- **Query Params**:
  - `page` (default: 0)
  - `size` (default: 10)
  - `startDate` (optional)
  - `endDate` (optional)
- **Response**: Paginated list of recovery reports
  ```json
  {
    "content": [
      {
        "recoveryId": "long",
        "customerName": "string",
        "customerPhoto": "string",
        "numberOfItems": "int",
        "recoveryStatus": "RECOVERED",
        "recoveryDate": "LocalDateTime"
      }
    ]
  }
  ```

#### 16. Get Recovery Report Detail
- **Endpoint**: `GET /api/recovery/reports/{recoveryId}`
- **Response**: Detailed recovery report
  ```json
  {
    "recoveryId": "long",
    "itemRecovered": "string",
    "itemPhoto": "string",
    "timeOfRecovery": "LocalDateTime",
    "numberOfItemsRecovered": "int",
    "recoveryAgentName": "string",
    "customerName": "string"
  }
  ```

---

## DATABASE MODELS NEEDED

### 1. Delivery Entity
```java
@Entity
@Table(name = "deliveries")
class Delivery {
    Long id;
    Long orderId;
    Long deliveryAgentId;
    String deliveryAgentName;
    String deliveryAddress;
    String customerName;
    String customerPhone;
    String productName;
    String productImage;
    String itemOfDelivery;
    String proofOfDeliveryImage;
    LocalDateTime timeOfDelivery;
    String estimatedTime;
    DeliveryStatus status; // PENDING, IN_TRANSIT, DELIVERED, FAILED
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
```

### 2. DeliveryFeedback Entity
```java
@Entity
@Table(name = "delivery_feedbacks")
class DeliveryFeedback {
    Long id;
    Long deliveryId;
    String deliveryAgentName;
    Long productId;
    String customerName;
    FeedbackStatus status; // DELIVERED, WRONG_PRODUCT, OWNER_NOT_AVAILABLE, WRONG_ADDRESS
    LocalDateTime createdAt;
}
```

### 3. DeliveryAgent Entity
```java
@Entity
@Table(name = "delivery_agents")
class DeliveryAgent {
    Long id;
    String firstName;
    String lastName;
    String email;
    String password;
    String phoneNumber;
    Boolean isActive;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
```

### 4. Recovery Entity
```java
@Entity
@Table(name = "recoveries")
class Recovery {
    Long id;
    Long customerId;
    Long productId;
    Long recoveryAgentId;
    String recoveryPhoto;
    LocalDateTime timeOfRecovery;
    Integer numberOfItemsRecovered;
    RecoveryStatus status; // NOT_YET_RECOVERED, RECOVERED
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
```

### 5. RecoveryAgent Entity
```java
@Entity
@Table(name = "recovery_agents")
class RecoveryAgent {
    Long id;
    String firstName;
    String lastName;
    String email;
    String password;
    String phoneNumber;
    Boolean isActive;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
```

---

## ENUMS NEEDED

### DeliveryStatus
```java
public enum DeliveryStatus {
    PENDING,
    IN_TRANSIT,
    DELIVERED,
    FAILED
}
```

### FeedbackStatus
```java
public enum FeedbackStatus {
    DELIVERED,
    WRONG_PRODUCT,
    OWNER_NOT_AVAILABLE,
    WRONG_ADDRESS
}
```

### RecoveryStatus
```java
public enum RecoveryStatus {
    NOT_YET_RECOVERED,
    RECOVERED
}
```

---

## MISSING FEATURES TO IMPLEMENT

### From Analysis of Business Flow:

1. **Order Integration**: When an order is created and payment is completed, automatically create a delivery record
2. **Delivery Agent Assignment**: Admin should be able to assign delivery agents to deliveries
3. **Recovery Creation**: When a customer defaults on installment payment, automatically create recovery records for items
4. **Notifications**: Send notifications to delivery/recovery agents when new tasks are assigned
5. **Customer Guarantor Information**: Already exists in Customer entity, use it for recovery module
6. **Product Tracking**: Link deliveries to Order and Product entities
7. **Dashboard Statistics**:
   - Total pending deliveries
   - Total completed deliveries
   - Total items to recover
   - Total items recovered
8. **Image Upload**: Implement file upload for proof of delivery and recovery photos (similar to existing product image upload)

---

## NEXT STEPS

1. Check existing codebase for Order, Customer, Product entities
2. Create new entities: Delivery, DeliveryFeedback, DeliveryAgent, Recovery, RecoveryAgent
3. Create repositories for all new entities
4. Create DTOs for request/response
5. Create services for business logic
6. Create controllers for endpoints
7. Add authentication/authorization for delivery and recovery agents
8. Implement file upload for images
9. Test all endpoints
