# Payment Issue Fix Guide

## Problem Identified

The screenshot showed a Paystack payment page stuck at "Pay with Transfer" instead of showing card payment options. This happened because:

1. **Payment Channel Not Restricted**: The backend wasn't specifying which payment method to use, so Paystack defaulted to showing ALL methods (card, bank transfer, USSD, etc.)
2. **Webhook Endpoint Not Public**: The Paystack webhook endpoint wasn't accessible for payment confirmations

## Fixes Applied

### 1. Restricted Payment Channel to Card Only ✅

**File**: `src/main/java/com/appGate/account/service/PaymentGatewayService.java`

**Changes**:
- Added `channels: ["card"]` to both `initializeCardPayment` and `initializeWalletFunding` methods
- This ensures Paystack ONLY shows card payment options to users

**Before**:
```java
requestBody.put("email", user.getEmail());
requestBody.put("amount", (int) (dto.getAmount() * 100));
requestBody.put("reference", savedPayment.getPaymentReference());
requestBody.put("callback_url", dto.getCallbackUrl());
```

**After**:
```java
requestBody.put("email", user.getEmail());
requestBody.put("amount", (int) (dto.getAmount() * 100));
requestBody.put("reference", savedPayment.getPaymentReference());
requestBody.put("callback_url", dto.getCallbackUrl());
requestBody.put("channels", new String[]{"card"}); // ✅ Card only
```

### 2. Made Webhook Endpoint Public ✅

**File**: `src/main/java/com/appGate/config/SecurityConfig.java`

**Changes**:
- Added `/api/payments/webhook` to public endpoints
- Allows Paystack to send payment confirmations without authentication

### 3. Fixed Payment Method for Wallet Funding ✅

**Changes**:
- Changed `PaymentMethod.WALLET` to `PaymentMethod.CARD` for wallet funding
- This correctly reflects that users are using cards to fund their wallets

### 4. Added Better Error Logging ✅

**Changes**:
- Added `e.printStackTrace()` in catch blocks
- Helps debug issues by showing full stack traces in console

## Testing Instructions

### 1. Compile the Backend
```bash
mvn clean install -DskipTests
```

### 2. Configure Paystack Credentials

Update `application.properties` or `application.yml`:
```properties
paystack.secret.key=sk_test_YOUR_ACTUAL_TEST_KEY_HERE
paystack.base.url=https://api.paystack.co
```

**IMPORTANT**: Get your actual test key from:
- Login to [Paystack Dashboard](https://dashboard.paystack.com)
- Go to Settings > API Keys & Webhooks
- Copy your **Test Secret Key** (starts with `sk_test_`)

### 3. Test Payment Initialization

**Endpoint**: `POST /api/payments/card/initialize`

**Request Body**:
```json
{
  "userId": 1,
  "amount": 5000,
  "callbackUrl": "https://your-app.com/payment-callback"
}
```

**Expected Response**:
```json
{
  "status": 200,
  "message": "Payment initialized successfully",
  "data": {
    "paymentId": 123,
    "paymentReference": "PM-ABC12345",
    "authorizationUrl": "https://checkout.paystack.com/...",
    "accessCode": "abc123xyz"
  }
}
```

### 4. Verify User Sees Card Payment Only

When frontend opens the `authorizationUrl`, the user should see:
- ✅ Card payment form (enter card details)
- ❌ NO "Pay with Transfer" option
- ❌ NO "Pay with USSD" option

### 5. Configure Paystack Webhook (CRITICAL)

For payments to be automatically verified:

1. Login to [Paystack Dashboard](https://dashboard.paystack.com)
2. Go to **Settings > API Keys & Webhooks**
3. Scroll to **Webhook URL**
4. Enter your backend URL: `https://your-backend-url.com/api/payments/webhook`
5. Click **Save Changes**

**Local Testing**:
- Use [ngrok](https://ngrok.com) to expose your localhost:
  ```bash
  ngrok http 8080
  ```
- Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
- Set webhook URL as: `https://abc123.ngrok.io/api/payments/webhook`

### 6. Test Complete Payment Flow

1. Initialize payment via API
2. Open the `authorizationUrl` in browser/mobile app
3. Use Paystack test cards:
   - **Success**: `4084 0840 8408 4081` (CVV: 408, Expiry: any future date, PIN: 0000)
   - **Insufficient Funds**: `5060 6666 6666 6666`
4. After payment, verify it:

**Endpoint**: `GET /api/payments/verify/{reference}`

**Example**: `GET /api/payments/verify/PM-ABC12345`

**Expected Response (Success)**:
```json
{
  "status": 200,
  "message": "Payment verified successfully",
  "data": {
    "id": 123,
    "userId": 1,
    "amount": 5000,
    "status": "COMPLETED",
    "paymentReference": "PM-ABC12345",
    "paidAt": "2025-12-25T16:30:00"
  }
}
```

## Common Issues & Solutions

### Issue 1: Still Seeing "Pay with Transfer"
**Solution**:
- Ensure you've compiled and restarted the backend after the fix
- Check the Paystack request in logs to confirm `channels: ["card"]` is being sent

### Issue 2: "User not found" Error
**Solution**:
- Ensure the `userId` in the request body exists in your database
- Check the `users` table

### Issue 3: Webhook Not Working
**Solution**:
- Verify `/api/payments/webhook` is in SecurityConfig public endpoints
- Check Paystack dashboard for webhook delivery logs
- For local testing, use ngrok to expose your localhost
- Verify the webhook URL doesn't have `/` at the end

### Issue 4: "Invalid API Key" Error
**Solution**:
- Double-check your Paystack secret key in `application.properties`
- Ensure it starts with `sk_test_` for testing
- No quotes or extra spaces around the key

### Issue 5: Payment Stuck in PENDING
**Solution**:
- Check if webhook is properly configured
- Manually verify the payment using the verify endpoint
- Check Paystack dashboard for payment status

## Additional Endpoints

### Initialize Wallet Funding
```
POST /api/payments/wallet/fund
```
(Note: You may need to create this endpoint in PaymentController)

### Check Payment Status
```
GET /api/payments/verify/{reference}
```

### Webhook Handler (For Paystack)
```
POST /api/payments/webhook
```

## Security Notes

1. **Never expose your secret key** in frontend code
2. **Always verify payments** on the backend, never trust frontend confirmation
3. **Use test keys** for development (`sk_test_...`)
4. **Use live keys** for production (`sk_live_...`)
5. **Validate webhook signature** (implement Paystack signature verification for production)

## Next Steps

1. ✅ Compile and test the fixes
2. Configure Paystack test credentials
3. Test payment flow end-to-end
4. Set up webhook URL in Paystack dashboard
5. Test with Paystack test cards
6. Implement proper error handling in frontend
7. Add payment confirmation screens in mobile/web app

## Support

If issues persist:
- Check backend console logs for detailed error messages
- Review Paystack API documentation: https://paystack.com/docs/api
- Check Paystack dashboard for payment logs
- Verify all configuration values are correct
