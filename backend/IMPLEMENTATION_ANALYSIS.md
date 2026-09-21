# DELIVERY & GOODS RECOVERY MODULES - Implementation Analysis

## EXISTING CODE ANALYSIS

### 1. DELIVERY MODULE - What Exists

#### Entities:
- **Rider** (`delivery.models.Rider`) - Delivery agent with personal details, documents (passport, license, signature), BVN/NIN
- **RiderBox** (`delivery.models.RiderBox`) - Represents delivery assignments with orderId, saleRef, status, riderId
- **Order** (`orderingsales.models.Order`) - Has riderId field, deliveryStatus enum, delivery address fields

#### Enums:
- **RiderBoxStatusEnum**: PENDING, ACCEPTED, REJECTED, DELIVERED
- **DeliveryStatus** (in Order): NOT_SHIPPED, SHIPPED, IN_TRANSIT, DELIVERED, RETURNED

#### Existing Endpoints:
- `POST /api/admin/createRiderInfo` - Create rider
- `GET /api/users/rider/{riderId}` - Get rider details
- `PUT /api/admin/updateRiderInfo/{riderId}` - Update rider
- `GET /api/admin/riders` - Get all riders
- `GET /api/users/rider/image/**` - Get rider images
- `PUT /api/admin/suspendRider/{riderId}` - Suspend rider
- `PUT /api/admin/unblockRider/{riderId}` - Unblock rider
- `GET /api/admin/getAllSuspendRider` - Get suspended riders
- `POST /api/admin/assign-product` - Assign product to rider
- `PUT /api/admin/accept/{productId}` - Rider accepts delivery
- `PUT /api/admin/deliver/{productId}` - Mark as delivered
- `PUT /api/admin/reject/{productId}` - Rider rejects delivery
- `GET /api/admin/rider-boxes?status=` - Get deliveries by status

### 2. GOODS RECOVERY - What Exists

**IMPORTANT**: The existing `recovery` module is for **PASSWORD RECOVERY**, not goods recovery!
- The current RecoveryRequest entity tracks password recovery requests
- RecoveryStatus enum: PENDING, SENT, VERIFIED, COMPLETED, EXPIRED, FAILED
- This is completely different from the goods recovery shown in the designs

#### Related Entities:
- **Customer** - Has guarantor information (nextOfKin fields)
- **LoanDetails** - Tracks installment/loan information linked to SalesOrder
- **Order** - Has installmentPlanId field

---

## WHAT'S MISSING FROM THE DESIGNS

### DELIVERY MODULE - Missing Features

#### 1. Rider Authentication
- Riders need to log in to the delivery app
- **Missing**: Rider login endpoint, JWT token generation for riders
- **Missing**: Rider password field in Rider entity
- **Missing**: Forgot password / Change password for riders

#### 2. Delivery Confirmation & Feedback
- **Missing**: Proof of delivery image upload
- **Missing**: Time of delivery tracking
- **Missing**: Delivery feedback entity to track: DELIVERED, WRONG_PRODUCT, OWNER_NOT_AVAILABLE, WRONG_ADDRESS
- **Missing**: Link between RiderBox and actual delivery confirmation

#### 3. Delivery History & Filtering
- **Missing**: Search deliveries by date range
- **Missing**: Filter by delivery status
- **Missing**: Rider's personal delivery history view

#### 4. Pending Deliveries for Rider
- **Existing**: `/api/admin/rider-boxes?status=PENDING` (but needs rider-specific view)
- **Missing**: Get pending deliveries for a specific rider
- **Missing**: Product details in pending delivery response (currently only has orderId, saleRef)

#### 5. Data Issues
- RiderBox has `orderId` and `saleRef` but designs show product information
- Need to join with Order -> OrderItems -> Product to show product details

---

### GOODS RECOVERY MODULE - Missing Entirely

This module is completely missing. The existing `recovery` module is for password recovery.

#### Required New Entities:

1. **GoodsRecovery** - Track recovery operations
   ```
   - id
   - customerId
   - orderId (the order with defaulted installments)
   - recoveryAgentId (optional - can assign recovery agents)
   - recoveryStatus (NOT_YET_RECOVERED, PARTIALLY_RECOVERED, RECOVERED)
   - createdAt
   - updatedAt
   ```

2. **RecoveryItem** - Track individual items to recover
   ```
   - id
   - goodsRecoveryId
   - productId
   - productName
   - quantity
   - recoveryPhoto
   - timeOfRecovery
   - numberOfItemsRecovered
   - status (NOT_YET_RECOVERED, RECOVERED)
   ```

3. **RecoveryAgent** - Similar to Rider but for recovery operations
   ```
   - id
   - firstName, lastName
   - email, password
   - phoneNumber
   - isActive
   ```

#### Required Endpoints:

1. **Authentication**:
   - `POST /api/goods-recovery/auth/login` - Recovery agent login

2. **Goods to Recover**:
   - `GET /api/goods-recovery/pending` - List customers with items to recover (paginated)
   - `GET /api/goods-recovery/customer/{customerId}` - Get customer details + guarantor + items to recover

3. **Recovery Operations**:
   - `POST /api/goods-recovery/upload-photo` - Upload recovery photo
   - `POST /api/goods-recovery/mark-recovered` - Mark item as recovered

4. **Reports**:
   - `GET /api/goods-recovery/reports` - Recovery reports (paginated, date filtered)
   - `GET /api/goods-recovery/reports/{recoveryId}` - Detailed recovery report

#### Business Logic Missing:
- When customer defaults on installment payment, create GoodsRecovery record
- Link to LoanDetails/Order to know what items to recover
- Show customer photo, personal info, and guarantor info for recovery agent

---

## ADDITIONAL FEATURES TO IMPLEMENT

### 1. Rider Authentication System
- Add `password` field to Rider entity
- Create RiderAuthController with login, forgot password, change password
- Generate JWT tokens for riders (separate from regular users)
- Use email as username

### 2. Delivery Workflow Enhancements

#### New Entities Needed:
```java
@Entity
class DeliveryConfirmation {
    Long id;
    Long riderBoxId;
    String deliveryAgentName;
    String deliveryAddress;
    String itemOfDelivery;
    String proofOfDeliveryImage; // uploaded photo
    LocalDateTime timeOfDelivery;
    LocalDateTime createdAt;
}

@Entity
class DeliveryFeedback {
    Long id;
    Long riderBoxId;
    Long deliveryConfirmationId;
    Long productId;
    String customerName;
    FeedbackStatus status; // DELIVERED, WRONG_PRODUCT, OWNER_NOT_AVAILABLE, WRONG_ADDRESS
    LocalDateTime createdAt;
}

enum FeedbackStatus {
    DELIVERED,
    WRONG_PRODUCT,
    OWNER_NOT_AVAILABLE,
    WRONG_ADDRESS
}
```

#### Enhanced RiderBox Response:
Need to include Order details and Product information when returning pending deliveries.

### 3. File Upload Integration
- Reuse existing FileUploadUtil from delivery module
- Add endpoints for uploading:
  - Proof of delivery images
  - Recovery photos

### 4. Integration with Order System
- When order is paid and ready for delivery, auto-create RiderBox record
- Update Order.deliveryStatus when delivery is confirmed
- Update Order.deliveredAt timestamp

### 5. Integration with Loan/Installment System
- When customer misses installment payment by X days, create GoodsRecovery record
- Link GoodsRecovery to Order to know what items were purchased
- Create RecoveryItems from OrderItems

---

## IMPLEMENTATION PRIORITY

### Phase 1: Delivery Module Completion
1. Add password field to Rider entity + migration
2. Create Rider authentication endpoints (login, forgot password, change password)
3. Create DeliveryConfirmation entity
4. Create DeliveryFeedback entity
5. Implement delivery confirmation endpoint with image upload
6. Implement delivery feedback endpoint
7. Enhance pending deliveries endpoint to include product details
8. Create delivery history endpoint with date filtering

### Phase 2: Goods Recovery Module
1. Create GoodsRecovery entity
2. Create RecoveryItem entity
3. Create RecoveryAgent entity
4. Create goods recovery repositories
5. Implement RecoveryAgent authentication
6. Implement goods to recover listing
7. Implement customer details endpoint (with guarantor info)
8. Implement mark as recovered endpoint with photo upload
9. Implement recovery reports endpoints

### Phase 3: Integration & Automation
1. Auto-create RiderBox when order is paid
2. Auto-create GoodsRecovery when installment payment is missed
3. Update Order statuses when delivery is confirmed
4. Add dashboard statistics

---

## DATABASE SCHEMA CHANGES NEEDED

### New Tables:
1. `delivery_confirmations`
2. `delivery_feedbacks`
3. `goods_recoveries`
4. `recovery_items`
5. `recovery_agents`

### Schema Modifications:
1. Add `password` column to `RiderDetails` table (Rider entity)

---

## API STRUCTURE

### Delivery App Endpoints (for Riders):
```
POST   /api/delivery-agent/auth/login
POST   /api/delivery-agent/auth/forgot-password
PUT    /api/delivery-agent/auth/change-password
GET    /api/delivery-agent/pending-deliveries
GET    /api/delivery-agent/delivery/{deliveryId}
POST   /api/delivery-agent/confirm-delivery
POST   /api/delivery-agent/submit-feedback
GET    /api/delivery-agent/history
```

### Goods Recovery App Endpoints (for Recovery Agents):
```
POST   /api/goods-recovery/auth/login
GET    /api/goods-recovery/pending
GET    /api/goods-recovery/customer/{customerId}
POST   /api/goods-recovery/upload-photo
POST   /api/goods-recovery/mark-recovered
GET    /api/goods-recovery/reports
GET    /api/goods-recovery/reports/{recoveryId}
```

---

## NEXT STEPS

1. **Ask user for clarification**:
   - Should we create a separate RecoveryAgent entity or reuse Rider?
   - When should GoodsRecovery be triggered? (e.g., after how many missed payments?)
   - Should riders and recovery agents share the same authentication system?

2. **Start implementation** based on priority phases above

3. **Testing** each module as we build
