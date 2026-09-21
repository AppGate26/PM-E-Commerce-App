# Endpoint Analysis - ACCOUNT DETAILS & ADMIN Figma Designs

## Analysis Date: 2025-12-30

---

## ACCOUNT DETAILS Module

### Figma Screens Analyzed:
1. Account Details with filtering (Account Type, Control Account, Chart of Account)
2. Account listings with GL codes (CONTROL ID, ACCOUNT ID, DESCRIPTION)
3. Chart of Account - INCOME (Fees & Commission, Interest & Similar Income)
4. Chart of Account - EXPENSES (Interest & Similar, General & Other Operating)

### **Status: ✅ ALREADY IMPLEMENTED**

All ACCOUNT DETAILS functionality is already covered by:

**AccountController** (`/api/admin/accounts`):
- ✅ GET `/api/admin/accounts` - Get all accounts
- ✅ GET `/api/admin/accounts/{id}` - Get account by ID
- ✅ GET `/api/admin/accounts/gl-code/{glCode}` - Get by GL code
- ✅ GET `/api/admin/accounts/type/{accountType}` - Filter by type (ASSET, LIABILITY, INCOME, EXPENSE)
- ✅ GET `/api/admin/accounts/control-accounts` - Get control accounts
- ✅ GET `/api/admin/accounts/active` - Get active accounts
- ✅ POST `/api/admin/accounts` - Create account
- ✅ PUT `/api/admin/accounts/{id}` - Update account
- ✅ DELETE `/api/admin/accounts/{id}` - Delete account

**No additional endpoints needed for ACCOUNT DETAILS module.**

---

## ADMIN Module - Approval System

### Figma Screens Analyzed:
1. Add to Stock Approval
2. Credit Sales Approval
3. Cash Sales Approval
4. Customer Registration Approval
5. Goods Supplied Approval
6. Journal Approval
7. Stock Delete Approval
8. Supplier Registration Approval
9. Suspended Customers Approvals
10. Unblock Customers Approvals

### **Status: ❌ MOSTLY MISSING - Needs New Approval System**

---

## Existing Approval Endpoints:

### ✅ Journal Approval - EXISTS
**JournalEntryController** (`/api/admin/journal-entries`):
- ✅ PATCH `/api/admin/journal-entries/{id}/approve?approvedBy=123`

---

## Missing Approval Workflows:

### ❌ 1. Stock Approval System
**Current State:**
- StockController has CRUD operations
- No approval workflow for stock additions

**Needed:**
- GET `/api/admin/approvals/stock/pending` - Get pending stock additions
- PATCH `/api/admin/approvals/stock/{id}/approve` - Approve stock addition
- PATCH `/api/admin/approvals/stock/{id}/decline` - Decline stock addition

---

### ❌ 2. Credit Sales Approval
**Current State:**
- SalesController creates credit sales directly
- No approval workflow

**Needed:**
- GET `/api/admin/approvals/credit-sales/pending` - Get pending credit sales
- PATCH `/api/admin/approvals/credit-sales/{id}/approve` - Approve credit sale
- PATCH `/api/admin/approvals/credit-sales/{id}/decline` - Decline credit sale

---

### ❌ 3. Cash Sales Approval
**Current State:**
- SalesController creates cash sales directly
- No approval workflow

**Needed:**
- GET `/api/admin/approvals/cash-sales/pending` - Get pending cash sales
- PATCH `/api/admin/approvals/cash-sales/{id}/approve` - Approve cash sale
- PATCH `/api/admin/approvals/cash-sales/{id}/decline` - Decline cash sale

---

### ❌ 4. Customer Registration Approval
**Current State:**
- CustomerController creates customers directly
- No approval workflow

**Needed:**
- GET `/api/admin/approvals/customers/pending` - Get pending customer registrations
- GET `/api/admin/approvals/customers/{id}` - Get customer registration details
- PATCH `/api/admin/approvals/customers/{id}/approve` - Approve customer registration
- PATCH `/api/admin/approvals/customers/{id}/decline` - Decline customer registration

---

### ❌ 5. Goods Supplied Approval
**Current State:**
- GoodsSuppliedController has CRUD operations
- No approval workflow

**Needed:**
- GET `/api/admin/approvals/goods-supplied/pending` - Get pending goods supplied
- PATCH `/api/admin/approvals/goods-supplied/{id}/approve` - Approve goods supplied
- PATCH `/api/admin/approvals/goods-supplied/{id}/decline` - Decline goods supplied

---

### ❌ 6. Stock Delete Approval
**Current State:**
- Stock deletion is immediate
- No approval workflow for deletions

**Needed:**
- POST `/api/admin/stock-delete-requests` - Create delete request
- GET `/api/admin/approvals/stock-delete/pending` - Get pending delete requests
- PATCH `/api/admin/approvals/stock-delete/{id}/approve` - Approve deletion
- PATCH `/api/admin/approvals/stock-delete/{id}/decline` - Decline deletion

---

### ❌ 7. Supplier Registration Approval
**Current State:**
- SupplierController creates suppliers directly
- No approval workflow

**Needed:**
- GET `/api/admin/approvals/suppliers/pending` - Get pending supplier registrations
- PATCH `/api/admin/approvals/suppliers/{id}/approve` - Approve supplier
- PATCH `/api/admin/approvals/suppliers/{id}/decline` - Decline supplier

---

### ❌ 8. Customer Suspension Approval
**Current State:**
- CustomerController has direct suspend endpoint
- No approval workflow for suspension requests

**Needed:**
- POST `/api/admin/suspension-requests` - Create suspension request
- GET `/api/admin/approvals/suspensions/pending` - Get pending suspension requests
- PATCH `/api/admin/approvals/suspensions/{id}/approve` - Approve suspension
- PATCH `/api/admin/approvals/suspensions/{id}/decline` - Decline suspension

---

### ❌ 9. Customer Unblock Approval
**Current State:**
- CustomerController has direct unblock endpoint
- No approval workflow for unblock requests

**Needed:**
- POST `/api/admin/unblock-requests` - Create unblock request
- GET `/api/admin/approvals/unblocks/pending` - Get pending unblock requests
- PATCH `/api/admin/approvals/unblocks/{id}/approve` - Approve unblock
- PATCH `/api/admin/approvals/unblocks/{id}/decline` - Decline unblock

---

## Implementation Strategy:

### Centralized Approval System Approach:

1. **Create Approval Models:**
   - `ApprovalRequest` - Generic approval request model
   - `ApprovalType` enum - Types: STOCK_ADD, CREDIT_SALES, CASH_SALES, CUSTOMER_REG, GOODS_SUPPLIED, STOCK_DELETE, SUPPLIER_REG, CUSTOMER_SUSPEND, CUSTOMER_UNBLOCK
   - `ApprovalStatus` enum - PENDING, APPROVED, DECLINED

2. **Create Approval Repository:**
   - Store all approval requests in one table
   - Query by type and status

3. **Create Approval Service:**
   - Generic approve/decline methods
   - Type-specific processing logic

4. **Create Approval Controller:**
   - Endpoints for each approval type
   - All under `/api/admin/approvals/**`

5. **Update Existing Services:**
   - Modify services to create approval requests instead of direct actions
   - Only when approval flag is enabled

---

## Summary:

- **ACCOUNT DETAILS:** ✅ Fully implemented (9 endpoints)
- **ADMIN Approvals:** ❌ Need to create (30+ new endpoints)
  - 1 existing (Journal Approval)
  - 9 new approval types needed
  - ~3-4 endpoints per type (list pending, approve, decline, details)

**Total New Endpoints Required: ~35 endpoints**
