# Vercel Deployment Guide

## Environment Variables Setup

### Required Environment Variable

**`VITE_API_BASE_URL`** - Your backend API base URL

### Steps to Configure in Vercel

1. **Go to Vercel Dashboard**
   - Navigate to your project: https://vercel.com/dashboard
   - Click on your project name

2. **Open Settings**
   - Click on **Settings** in the top navigation
   - Click on **Environment Variables** in the left sidebar

3. **Add Environment Variable**
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: Your API base URL (e.g., `http://18.188.177.144:8080` or `https://api.yourdomain.com`)
   - **Environment**: Select all (Production, Preview, Development)

4. **Save and Redeploy**
   - Click **Save**
   - Go to **Deployments** tab
   - Click the **⋯** menu on the latest deployment
   - Click **Redeploy**

### Important Notes

- ⚠️ **No trailing slash**: The URL should NOT end with `/`
  - ✅ Correct: `http://18.188.177.144:8080`
  - ❌ Wrong: `http://18.188.177.144:8080/`

- 🔒 **HTTPS in Production**: For production, use HTTPS if available
  - Example: `https://api.yourdomain.com`

- 🔄 **Redeploy Required**: After adding/changing environment variables, you MUST redeploy for changes to take effect

### Verification

After deployment, check the browser console:
- ✅ Should NOT see: `⚠️ VITE_API_BASE_URL is not set!`
- ✅ Login requests should go to: `{YOUR_API_URL}/users/sign-in`
- ❌ Should NOT see: `/undefined/users/sign-in`

### Troubleshooting

**Issue**: Still seeing `/undefined/users/sign-in` in network requests
- **Solution**: Make sure you redeployed after adding the environment variable

**Issue**: 405 Method Not Allowed
- **Solution**: Verify the API endpoint is correct and the backend server is running

**Issue**: CORS errors
- **Solution**: Ensure your backend allows requests from your Vercel domain




