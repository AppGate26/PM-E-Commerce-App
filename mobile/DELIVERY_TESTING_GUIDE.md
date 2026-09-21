# Delivery Agent Testing Guide

## 🎯 How to Test Delivery Agent Flow

### Step 1: Check if an email is registered as a delivery agent

**Method 1: Use Forgot Password**
1. Open the app → Login screen
2. Click "Forgot Password?"
3. Enter the email you want to test (e.g., `saviourinnocent832@gmail.com`)
4. **Watch the console logs:**
   - ✅ If you see: `✅ [ForgotPassword] Delivery-agent forgot password success` → **This email IS a delivery agent**
   - ❌ If you see: `❌ [ForgotPassword] Delivery-agent forgot password failed: No rider found with this email` → **This email is NOT a delivery agent**

**Method 2: Try Login**
1. Enter email + any password
2. **Watch the console logs:**
   - ✅ If you see: `✅ [Login] Delivery agent login successful` → **This email IS a delivery agent**
   - ❌ If you see: `ℹ️ [Login] Not a delivery agent, trying regular user login` → **This email is NOT a delivery agent**

### Step 2: First-Time Login (Forgot Password Flow)

**For NEW delivery agents (no password set yet):**

1. **Go to Login Screen**
2. **Click "Forgot Password?"**
3. **Enter delivery agent email** (e.g., `saviourinnocent832@gmail.com`)
4. **Click "RESET PASSWORD"**
5. **Check console logs:**
   ```
   🔐 [ForgotPassword] Trying delivery-agent forgot password for: saviourinnocent832@gmail.com
   🚚 [DeliveryAgent ForgotPassword] URL: http://18.188.177.144:8080/api/delivery-agent/auth/forgot-password
   📥 [DeliveryAgent ForgotPassword Response] Status: 200
   ✅ [ForgotPassword] Delivery-agent forgot password success
   ```
6. **You should:**
   - See green message: "If you are a delivery rider, password reset instructions have been sent to your email"
   - Be automatically navigated to "Change Password" screen
   - See your email displayed on the screen
7. **Check your email** (including spam folder) for the reset code
8. **Enter the code** in the "Enter Reset Code" field
9. **Enter new password** (min 6 characters)
10. **Confirm new password**
11. **Click "CHANGE PASSWORD"**
12. **After success**, you'll be redirected to Login screen
13. **Login with email + new password**

### Step 3: Regular Login (After Password is Set)

**For delivery agents who already have a password:**

1. **Go to Login Screen**
2. **Enter delivery agent email** (e.g., `saviourinnocent832@gmail.com`)
3. **Enter password**
4. **Click "LOGIN"**
5. **Check console logs:**
   ```
   🔐 [Login] Attempting delivery agent login for: saviourinnocent832@gmail.com
   🚚 [DeliveryAgent Login] URL: http://18.188.177.144:8080/api/delivery-agent/auth/login
   📥 [DeliveryAgent Login Response] Status: 200
   ✅ [Login] Delivery agent login successful - riderId: 2
   ```
6. **You should be automatically navigated to Delivery Splash → Delivery Home**

### Step 4: Test All Delivery Screens

Once logged in as delivery agent, test these screens:

1. **Pending Deliveries** (`/pending`)
   - Should show list of pending deliveries
   - Check logs: `✅ [DeliveryAgent PendingDeliveries] Loaded X pending deliveries`

2. **Delivery History** (`/delivery-history`)
   - Should show past deliveries
   - Check logs: `✅ [DeliveryAgent History] Loaded X history records`

3. **New Delivery** (Click on a pending delivery → "PROCEED TO DELIVERY")
   - Fill in delivery details
   - Upload proof image
   - Click "SAVE"
   - Check logs: `✅ [DeliveryAgent ConfirmDelivery] Success`

4. **Delivery Confirmation** (After confirming delivery)
   - Enter product ID, customer name, status
   - Click "SAVE"
   - Check logs: `✅ [DeliveryAgent SubmitFeedback] Success`

5. **Delivery About** (Click on any delivery)
   - Should show delivery details
   - Check logs: `✅ [DeliveryAgent Detail] Loaded detail for riderBoxId: X`

### Step 5: Test Customer Flow (Verify It Still Works)

1. **Logout** from delivery agent
2. **Go to Login Screen**
3. **Enter customer email** (NOT a delivery agent email)
4. **Click "Forgot Password?"**
5. **Should use customer endpoint:**
   ```
   🔐 [ForgotPassword] Trying delivery-agent forgot password for: customer@email.com
   ❌ [ForgotPassword] Delivery-agent forgot password failed: No rider found with this email
   ℹ️ [ForgotPassword] Email is not a rider. Falling back to CUSTOMER forgot password...
   ✅ [ForgotPassword] Customer forgot password success
   ```
6. **Customer flow should work normally**

## 🔍 Debug Checklist

### What to Look For in Console Logs:

**✅ SUCCESS Indicators:**
- `✅ [Login] Delivery agent login successful`
- `✅ [ForgotPassword] Delivery-agent forgot password success`
- `✅ [DeliveryAgent ChangePassword] Success`
- `✅ [DeliveryAgent PendingDeliveries] Loaded X pending deliveries`
- `✅ [DeliveryAgent ConfirmDelivery] Success`
- `✅ [DeliveryAgent SubmitFeedback] Success`

**❌ ERROR Indicators:**
- `❌ [Login] Delivery agent login failed` → Wrong password or email not registered
- `❌ [ForgotPassword] Delivery-agent forgot password failed: No rider found with this email` → Email not registered as delivery agent
- `❌ [DeliveryAgent ChangePassword] Failed` → Invalid reset code or other error

**ℹ️ INFO Indicators:**
- `ℹ️ [Login] Not a delivery agent, trying regular user login` → Normal fallback
- `ℹ️ [ForgotPassword] Email is not a rider. Falling back to CUSTOMER forgot password...` → Normal fallback

## 🐛 Common Issues & Solutions

### Issue 1: "No rider found with this email"
**Solution:** The email is not registered as a delivery agent in the backend. Ask your backend developer to:
- Check the delivery agent/rider table
- Verify the email exists
- Create the rider account if needed

### Issue 2: "Email sent but no code received"
**Solution:** This is a **backend email service issue**, not a frontend issue. Ask your backend developer to:
- Check email service configuration (SMTP settings)
- Check email service logs
- Verify emails are actually being sent
- Consider returning the OTP code in the API response for testing

### Issue 3: "404 Error on forgot password"
**Solution:** The endpoint might be wrong or the backend route doesn't exist. Check:
- API endpoint: `POST /api/delivery-agent/auth/forgot-password`
- Backend is running and accessible
- Network connectivity

## 📝 Test Credentials (You Need to Create These)

**You cannot use fake credentials - they must be created in your backend database.**

**To create test credentials:**
1. Go to your admin panel (web interface)
2. Create a new delivery agent/rider with:
   - Email: `test.rider@example.com` (or any email you control)
   - Name: Test Rider
   - Phone: Any phone number
3. **Do NOT set a password** (for first-time login test)
4. Use the forgot password flow to set the password
5. Then use that email + password to login

**OR**

1. Ask your backend developer to:
   - Create a test delivery agent account
   - Give you the email
   - Either set a temporary password OR leave it blank for first-time login test

## ✅ Testing Checklist

- [ ] Can identify delivery agent emails using forgot password
- [ ] First-time login (forgot password → set password) works
- [ ] Regular login (email + password) works
- [ ] Pending deliveries screen loads data
- [ ] Delivery history screen loads data
- [ ] Can confirm a delivery (with image upload)
- [ ] Can submit feedback
- [ ] Can view delivery details
- [ ] Customer flow still works (not broken)
- [ ] Logout works correctly

## 🎯 Quick Test Commands

**Test if email is delivery agent:**
```
1. Login Screen → Forgot Password → Enter email
2. Check logs for: "Delivery-agent forgot password success" OR "No rider found"
```

**Test delivery login:**
```
1. Login Screen → Enter email + password → Login
2. Check logs for: "Delivery agent login successful"
3. Should navigate to Delivery Home
```

**Test customer flow (verify not broken):**
```
1. Login Screen → Forgot Password → Enter customer email (not delivery agent)
2. Should fall back to customer endpoint
3. Customer reset password should work normally
```










