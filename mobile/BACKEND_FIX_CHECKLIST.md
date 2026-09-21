# Backend Fix Checklist - Delivery Agent 403 Errors

## ✅ YES - These Endpoints SHOULD Be Authenticated

Both endpoints have **lock icons** in Swagger UI, meaning they require authentication:
- `GET /api/delivery-agent/history/{riderId}` 🔒
- `GET /api/delivery-agent/pending-deliveries/{riderId}` 🔒

## What Backend Team Needs to Check

### 1. **Verify Authentication is Enabled** ✅
- [ ] Confirm these endpoints are protected/require authentication
- [ ] Check if Spring Security or your auth framework is configured for these paths
- [ ] Verify the endpoints are not accidentally excluded from authentication

### 2. **Check Token Validation** ✅
- [ ] Is the JWT token being received in the `Authorization` header?
- [ ] Is the token format correct? (Should be: `Bearer {token}`)
- [ ] Is the token signature being validated?
- [ ] Is the token expiration being checked?

### 3. **Verify Token Claims** ✅
- [ ] Does the token contain `riderId` claim?
- [ ] Does the `riderId` in the token match the `riderId` in the URL path?
- [ ] Example: Token has `riderId: 4`, URL is `/history/4` - should match ✅

### 4. **Check Authorization/Permissions** ✅
- [ ] Does the authenticated rider have permission to access their own data?
- [ ] Is there a check that prevents riders from accessing other riders' data?
- [ ] Are the correct roles/permissions assigned?

### 5. **Test the Endpoint Manually** ✅

**Test with Postman/curl:**
```bash
# Step 1: Login to get token
POST http://18.188.177.144:8080/api/delivery-agent/auth/login
Body: {
  "email": "saviourinnocent832@gmail.com",
  "password": "saviour.innocent1"
}

# Step 2: Copy the token from response
# Response should have: { "data": { "token": "eyJhbGc..." } }

# Step 3: Use token to call protected endpoint
GET http://18.188.177.144:8080/api/delivery-agent/history/4
Headers:
  Authorization: Bearer {paste_token_here}
  Accept: application/json

# Step 4: Check if it works or still returns 403
```

## Common Issues & Fixes

### Issue 1: Token Not Being Validated
**Symptom:** Token is sent but backend ignores it
**Fix:** Ensure authentication filter/interceptor is processing the Authorization header

### Issue 2: Rider ID Mismatch
**Symptom:** Token has riderId but doesn't match URL path
**Fix:** Either:
- Allow riders to access their own data (riderId in token == riderId in URL)
- OR remove riderId from URL and get it from token instead

### Issue 3: Endpoint Not Protected
**Symptom:** Endpoint should require auth but doesn't
**Fix:** Add security configuration to protect these endpoints

### Issue 4: CORS/Preflight Issues
**Symptom:** 403 on OPTIONS request
**Fix:** Configure CORS to allow Authorization header

## Expected Behavior

✅ **Correct Flow:**
1. User logs in → Gets JWT token
2. Frontend sends: `GET /api/delivery-agent/history/4` with `Authorization: Bearer {token}`
3. Backend validates token
4. Backend checks if token's riderId matches URL's riderId (4 == 4)
5. Backend returns data (200 OK)

❌ **Current Behavior:**
1. User logs in → Gets JWT token ✅
2. Frontend sends: `GET /api/delivery-agent/history/4` with `Authorization: Bearer {token}` ✅
3. Backend returns 403 Forbidden ❌

## Quick Diagnostic Questions

Ask the backend developer:

1. **"When you test the endpoint with Postman using the token, does it work?"**
   - If YES → Frontend issue (token not being sent correctly)
   - If NO → Backend issue (token validation/authorization problem)

2. **"Can you check the server logs when the 403 happens? What error message appears?"**
   - This will tell us exactly why it's being rejected

3. **"Is there any security configuration that might be blocking these specific endpoints?"**
   - Sometimes endpoints are accidentally excluded from auth

4. **"Does the JWT token contain a 'riderId' claim? And does it match the riderId in the URL?"**
   - Mismatch could cause 403

## What Frontend is Sending

The frontend is correctly sending:
```
GET /api/delivery-agent/history/4
Headers:
  Authorization: Bearer eyJhbGciOiJIUzUxMiJ9...
  Accept: application/json
  Content-Type: application/json
```

The token is a valid JWT received from the login endpoint.

## Summary

**These endpoints MUST be authenticated** (they have lock icons in Swagger).

The issue is likely:
- Token validation failing
- Rider ID mismatch between token and URL
- Missing security configuration
- Permission/authorization check failing

**Action:** Backend team should test the endpoint manually with Postman using the token from login, and check server logs to see why 403 is being returned.








