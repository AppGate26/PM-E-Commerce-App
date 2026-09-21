# Backend Test Data - Delivery Agent 403 Errors

## Issue Summary
Getting **403 Forbidden** errors on authenticated delivery agent endpoints:
- `GET /api/delivery-agent/history/{riderId}`
- `GET /api/delivery-agent/pending-deliveries/{riderId}`

## Test Data Being Used

### 1. Login Credentials
```
Email: saviourinnocent832@gmail.com
Password: saviour.innocent1
```

### 2. Login Response (What Frontend Receives)
```json
{
  "status": 200,
  "message": "Login successful",
  "data": {
    "riderId": 4,
    "fullName": "Innocent  Savillla",
    "email": "saviourinnocent832@gmail.com",
    "token": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJzYXZpb3VyaW5ub2NlbnQ4MzJAZ21haWwuY29tIiwiaWF0IjoxNzY2MjIyMDQ3LCJyaWRlcklkIjo0LCJlbWFpbCI6InNhdmlvdXJpbm5vY2VudDgzMkBnbWFpbC5jb20iLCJmdWxsTmFtZSI6Iklubm9jZW50ICBTYXZpbGxsYSIsInR5cGUiOiJSSURFUiIsImV4cCI6MTc2NjIyOTI0N30.swhrXJI1Ksospadf1jYIA7zDDj8WX65InMtTCLSe7HTHZd3ukGGUKk2E7hVitsauXUMkqAVdLKx-lcrRcV5i2A"
  }
}
```

### 3. Token Details
- **Token Type**: JWT
- **Token Format**: `Bearer {token}`
- **Header Name**: `Authorization`
- **Rider ID in Token**: `4` (from `riderId` claim)
- **Token Type Claim**: `RIDER`

### 4. Failing Requests

#### Request 1: Get Delivery History
```
Method: GET
URL: http://18.188.177.144:8080/api/delivery-agent/history/4
Headers:
  Authorization: Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJzYXZpb3VyaW5ub2NlbnQ4MzJAZ21haWwuY29tIiwiaWF0IjoxNzY2MjIyMDQ3LCJyaWRlcklkIjo0LCJlbWFpbCI6InNhdmlvdXJpbm5vY2VudDgzMkBnbWFpbC5jb20iLCJmdWxsTmFtZSI6Iklubm9jZW50ICBTYXZpbGxsYSIsInR5cGUiOiJSSURFUiIsImV4cCI6MTc2NjIyOTI0N30.swhrXJI1Ksospadf1jYIA7zDDj8WX65InMtTCLSe7HTHZd3ukGGUKk2E7hVitsauXUMkqAVdLKx-lcrRcV5i2A
  Accept: application/json
  Content-Type: application/json

Response: 403 Forbidden
{
  "timestamp": "2025-12-20T09:32:49.123+00:00",
  "status": 403,
  "error": "Forbidden",
  "path": "/api/delivery-agent/history/4"
}
```

#### Request 2: Get Pending Deliveries
```
Method: GET
URL: http://18.188.177.144:8080/api/delivery-agent/pending-deliveries/4
Headers:
  Authorization: Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJzYXZpb3VyaW5ub2NlbnQ4MzJAZ21haWwuY29tIiwiaWF0IjoxNzY2MjIyMDQ3LCJyaWRlcklkIjo0LCJlbWFpbCI6InNhdmlvdXJpbm5vY2VudDgzMkBnbWFpbC5jb20iLCJmdWxsTmFtZSI6Iklubm9jZW50ICBTYXZpbGxsYSIsInR5cGUiOiJSSURFUiIsImV4cCI6MTc2NjIyOTI0N30.swhrXJI1Ksospadf1jYIA7zDDj8WX65InMtTCLSe7HTHZd3ukGGUKk2E7hVitsauXUMkqAVdLKx-lcrRcV5i2A
  Accept: application/json
  Content-Type: application/json

Response: 403 Forbidden
{
  "timestamp": "2025-12-20T09:33:33.461+00:00",
  "status": 403,
  "error": "Forbidden",
  "path": "/api/delivery-agent/pending-deliveries/4"
}
```

## Postman/curl Test Commands

### Step 1: Login to Get Token
```bash
curl -X POST "http://18.188.177.144:8080/api/delivery-agent/auth/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "email": "saviourinnocent832@gmail.com",
    "password": "saviour.innocent1"
  }'
```

**Expected Response:**
```json
{
  "status": 200,
  "message": "Login successful",
  "data": {
    "riderId": 4,
    "fullName": "Innocent  Savillla",
    "email": "saviourinnocent832@gmail.com",
    "token": "eyJhbGciOiJIUzUxMiJ9..."
  }
}
```

### Step 2: Test History Endpoint (Copy token from Step 1)
```bash
curl -X GET "http://18.188.177.144:8080/api/delivery-agent/history/4" \
  -H "Authorization: Bearer {PASTE_TOKEN_HERE}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json"
```

### Step 3: Test Pending Deliveries Endpoint
```bash
curl -X GET "http://18.188.177.144:8080/api/delivery-agent/pending-deliveries/4" \
  -H "Authorization: Bearer {PASTE_TOKEN_HERE}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json"
```

## JWT Token Decoded (for reference)

**Header:**
```json
{
  "alg": "HS512",
  "typ": "JWT"
}
```

**Payload:**
```json
{
  "sub": "saviourinnocent832@gmail.com",
  "iat": 1766222047,
  "riderId": 4,
  "email": "saviourinnocent832@gmail.com",
  "fullName": "Innocent  Savillla",
  "type": "RIDER",
  "exp": 1766229247
}
```

**Key Points:**
- `riderId` in token: **4**
- `riderId` in URL path: **4** (matches ✅)
- Token type: **RIDER**
- Token is valid (not expired)

## Questions for Backend Team

1. **Is the Authorization header being received?**
   - Can you check server logs to confirm the `Authorization: Bearer {token}` header is present?

2. **Is the token being validated?**
   - Is the JWT signature being checked?
   - Is the token expiration being validated?

3. **Rider ID validation:**
   - Does the `riderId` in the JWT token (4) need to match the `riderId` in the URL path (4)?
   - Is there a permission check that's failing?

4. **Endpoint security:**
   - Are these endpoints configured to require authentication?
   - What role/permission is needed? (The token has `type: "RIDER"`)

5. **CORS/Preflight:**
   - Are CORS headers configured to allow the Authorization header?

## What Frontend is Sending

✅ **Correct Format:**
- Token is sent as: `Authorization: Bearer {jwt_token}`
- Headers include: `Accept: application/json`, `Content-Type: application/json`
- URL path includes correct `riderId: 4`
- Token is valid and not expired

## Expected Behavior

**Should work:**
1. User logs in → Gets JWT token with `riderId: 4`
2. Frontend sends: `GET /api/delivery-agent/history/4` with `Authorization: Bearer {token}`
3. Backend validates token
4. Backend checks if token's `riderId` (4) matches URL's `riderId` (4)
5. Backend returns data (200 OK)

**Current behavior:**
- Step 1-2 work ✅
- Step 3-4 fail with 403 ❌

## Server Logs to Check

When testing, please check server logs for:
- Is the Authorization header present in the request?
- What error message appears when 403 is returned?
- Is there any security filter/interceptor rejecting the request?
- Are there any permission/role checks failing?

---

**Test Account:**
- Email: `saviourinnocent832@gmail.com`
- Password: `saviour.innocent1`
- Rider ID: `4`
- Token Type: `RIDER`








