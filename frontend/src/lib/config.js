import Cookies from "js-cookie";
import { getActiveBranchId } from "./activeBranch";

// Get API base URL from environment
let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const ENABLE_MOCK_LOGIN = import.meta.env.VITE_ENABLE_MOCK_LOGIN === "true";

// In production on Vercel, use relative /api path to avoid mixed content issues
// The vercel.json proxy will handle routing /api/* to the backend
const isVercel = typeof window !== "undefined" && window.location.hostname.includes("vercel.app");
const isDev = typeof window !== "undefined" && import.meta.env.DEV;

if (isVercel || isDev) {
  // Use relative /api path for Vercel deployments (proxy handles routing)
  API_BASE_URL = "/api";
} else if (!API_BASE_URL && typeof window !== "undefined" && import.meta.env.DEV) {
  // Warn only in development if not set
  console.error("⚠️ VITE_API_BASE_URL is not set! Please configure it in your environment variables.");
  console.error("📖 See VERCEL_DEPLOYMENT.md for setup instructions.");
}

export { API_BASE_URL };

const fetchAuthToken = () => {
  return (
    Cookies.get("authToken") ||
    localStorage.getItem("pm_auth_token") ||
    sessionStorage.getItem("pm_auth_token") ||
    null
  );
};

const isMockSessionToken = (token) =>
  ENABLE_MOCK_LOGIN &&
  typeof token === "string" &&
  token.startsWith("mock-auth-token");

// Fired when the backend says the caller isn't authenticated (missing/invalid/expired
// JWT -> 401). AuthContext listens for this and clears the session so ProtectedRoute's
// isAuthenticated check flips to false and the app redirects to /auth/login. A 403 means
// the session is valid but lacks permission for that endpoint, so it must NOT fire this -
// otherwise a legitimate permission error would silently log the user out.
export const SESSION_EXPIRED_EVENT = "auth:session-expired";
const dispatchSessionExpired = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }
};

const normalizeEndpoint = (endpoint = "") => {
  if (!endpoint) return "";
  if (/^https?:\/\//i.test(endpoint)) return endpoint;

  let nextEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  // Prevent duplicated /api prefix (e.g. API_BASE_URL=/api + endpoint=/api/products)
  if (
    API_BASE_URL === "/api" &&
    nextEndpoint.toLowerCase().startsWith("/api/")
  ) {
    nextEndpoint = nextEndpoint.slice(4);
  }

  return nextEndpoint;
};

const getApiErrorMessage = (errorData, fallback) => {
  if (!errorData) return fallback;

  if (typeof errorData === "string") {
    return errorData.trim() || fallback;
  }

  const directMessage =
    errorData.message ||
    errorData.error ||
    errorData.response?.message ||
    errorData.response?.error ||
    errorData.data?.message ||
    errorData.data?.error;

  if (directMessage) return String(directMessage);

  if (typeof errorData.response === "string") {
    return errorData.response;
  }

  if (errorData.errors) {
    if (Array.isArray(errorData.errors)) {
      return errorData.errors
        .map((item) => item?.message || item?.defaultMessage || item)
        .filter(Boolean)
        .join(", ") || fallback;
    }

    if (typeof errorData.errors === "object") {
      return Object.entries(errorData.errors)
        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
        .join(", ") || fallback;
    }
  }

  return fallback;
};

export const apiRequest = async (
  endpoint,
  method = "GET",
  body = null,
  requiresAuth = true,
  branchIdOverride = undefined
) => {
  // Validate API_BASE_URL (allow /api for Vercel proxy)
  const isVercel = typeof window !== "undefined" && window.location.hostname.includes("vercel.app");
  if (!API_BASE_URL && !isVercel) {
    throw new Error("API_BASE_URL is not configured. Please set VITE_API_BASE_URL environment variable.");
  }

  const token = fetchAuthToken();
  const headers = {      
    "Content-Type": "application/json",
  };

  // Add Authorization header only when needed
  if (requiresAuth) {
    if (!token) throw new Error("No authentication token found");
    headers.Authorization = `Bearer ${token}`;
  }

  // Head-office / admin branch selection. Harmless for everyone else: the backend
  // reads this header only for callers who may see every branch, so a branch user
  // can never widen their view with it.
  //
  // A caller may override the global selection for a single request by passing
  // branchIdOverride (e.g. a report screen fetching one branch's data without
  // switching the whole app's branch scope). undefined = use the global value.
  const activeBranchId =
    branchIdOverride !== undefined ? branchIdOverride : getActiveBranchId();
  if (activeBranchId) {
    headers["X-Branch-Id"] = activeBranchId;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
    // Log request body for debugging
    if (method === "POST" || method === "PUT") {
      console.log("═══════════════════════════════════════════════════════════");
      console.log("apiRequest: REQUEST BODY BEING SENT TO BACKEND");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("apiRequest: Endpoint:", endpoint);
      console.log("apiRequest: Method:", method);
      console.log("apiRequest: Body object:", body);
      console.log("apiRequest: Stringified body:", options.body);
      console.log("apiRequest: Body keys:", Object.keys(body));
      console.log("═══════════════════════════════════════════════════════════");
    }
  }

  const normalizedEndpoint = normalizeEndpoint(endpoint);
  const requestUrl = /^https?:\/\//i.test(normalizedEndpoint)
    ? normalizedEndpoint
    : `${API_BASE_URL}${normalizedEndpoint}`;
  let response;
  try {
    response = await fetch(requestUrl, options);
  } catch (networkError) {
    const messageText = (networkError?.message || "").toLowerCase();
    const isNetworkChange =
      messageText.includes("network") ||
      messageText.includes("failed to fetch") ||
      messageText.includes("err_network_changed");

    const userMessage = isNetworkChange
      ? "Network changed while loading data. Please check your internet/VPN and try again."
      : "Unable to reach server. Please try again.";

    const error = new Error(userMessage);
    error.code = "NETWORK_ERROR";
    error.cause = networkError;
    throw error;
  }
  
  // Log response status
  console.log("apiRequest: Response status:", response.status);
  if (!response.ok) {
    console.log("apiRequest: ❌ Response not OK, status:", response.status);
  }

  // Handle auth failures
  if (response.status === 401 || response.status === 403) {
    let authMessage =
      response.status === 403 ? "Forbidden (403)" : "Unauthorized";

    try {
      const errorData = await response.clone().json();
      authMessage =
        errorData?.message ||
        errorData?.error ||
        errorData?.response?.message ||
        errorData?.response ||
        authMessage;
    } catch {
      try {
        const text = await response.clone().text();
        if (text && text.trim()) authMessage = text.trim();
      } catch {
        // keep default auth message
      }
    }

    if (requiresAuth) {
      // Only a 401 means "you're not authenticated" (missing/invalid/expired token).
      // A 403 means the token is valid but the account lacks permission for this
      // endpoint - that must never force a logout.
      const sessionExpired =
        response.status === 401 && !isMockSessionToken(token);

      const authError = new Error(
        isMockSessionToken(token)
          ? "Unauthorized in mock session"
          : sessionExpired
            ? "Your session has expired. Please log in again."
            : authMessage
      );
      authError.status = response.status;
      authError.shouldRedirectToLogin = sessionExpired;
      if (sessionExpired) dispatchSessionExpired();
      throw authError;
    }
    const accessError = new Error(authMessage);
    accessError.status = response.status;
    throw accessError;
  }

  // Handle other errors
  if (!response.ok) {
    let errorMessage = `Request failed (${response.status})`;

    try {
      const errorData = await response.clone().json();
      errorMessage = getApiErrorMessage(errorData, errorMessage);
    } catch {
      // If body isn't JSON, try plain text to expose backend errors
      try {
        const text = await response.clone().text();
        if (text && text.trim()) {
          errorMessage = text.trim();
        }
      } catch {
        // ignore
      }
    }
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return {};
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const textResponse = await response.text();
  try {
    return JSON.parse(textResponse);
  } catch {
    return { response: textResponse };
  }
};

// Function to manually construct multipart/form-data body
const buildMultipartBody = (formData, boundary) => {
  const parts = [];
  const encoder = new TextEncoder();
  
  for (const [key, value] of formData.entries()) {
    parts.push(encoder.encode(`--${boundary}\r\n`));
    
    if (value instanceof File) {
      parts.push(encoder.encode(`Content-Disposition: form-data; name="${key}"; filename="${value.name}"\r\n`));
      parts.push(encoder.encode(`Content-Type: ${value.type || 'application/octet-stream'}\r\n\r\n`));
      // File content will be added as ArrayBuffer
      parts.push(value);
    } else {
      parts.push(encoder.encode(`Content-Disposition: form-data; name="${key}"\r\n\r\n`));
      parts.push(encoder.encode(String(value)));
    }
    
    parts.push(encoder.encode('\r\n'));
  }
  
  parts.push(encoder.encode(`--${boundary}--\r\n`));
  return parts;
};

// Function for multipart/form-data requests (file uploads)
export const apiRequestMultipart = async (
  endpoint,
  method = "POST",
  formData,
  requiresAuth = true
) => {
  const token = fetchAuthToken();

  if (requiresAuth && !token) {
    throw new Error("No authentication token found");
  }

  // Generate a boundary string
  const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  
  // Build multipart body manually - read all files first
  const encoder = new TextEncoder();
  const bodyParts = [];
  
  for (const [key, value] of formData.entries()) {
    // Add boundary
    bodyParts.push(encoder.encode(`--${boundary}\r\n`));
    
    if (value instanceof File) {
      // File header
      bodyParts.push(encoder.encode(`Content-Disposition: form-data; name="${key}"; filename="${value.name}"\r\n`));
      bodyParts.push(encoder.encode(`Content-Type: ${value.type || 'application/octet-stream'}\r\n\r\n`));
      // Read file as ArrayBuffer
      const fileBuffer = await value.arrayBuffer();
      bodyParts.push(new Uint8Array(fileBuffer));
    } else {
      // Text field
      bodyParts.push(encoder.encode(`Content-Disposition: form-data; name="${key}"\r\n\r\n`));
      bodyParts.push(encoder.encode(String(value)));
    }
    
    bodyParts.push(encoder.encode('\r\n'));
  }
  
  // Add closing boundary
  bodyParts.push(encoder.encode(`--${boundary}--\r\n`));
  
  // Create a Blob from all parts
  const bodyBlob = new Blob(bodyParts);

  // Use XMLHttpRequest to send with custom Content-Type header (without charset)
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const normalizedEndpoint = normalizeEndpoint(endpoint);
    const url = /^https?:\/\//i.test(normalizedEndpoint)
      ? normalizedEndpoint
      : `${API_BASE_URL}${normalizedEndpoint}`;

    xhr.open(method, url, true);

    // Set Authorization header if needed
    if (requiresAuth && token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    // Carry the head-office branch selection on uploads too, so a created record
    // (e.g. a supplier with an attached document) lands in the selected branch.
    const activeBranchId = getActiveBranchId();
    if (activeBranchId) {
      xhr.setRequestHeader("X-Branch-Id", activeBranchId);
    }

    // Manually set Content-Type header WITHOUT charset parameter
    xhr.setRequestHeader("Content-Type", `multipart/form-data; boundary=${boundary}`);
    
    xhr.onload = function () {
      // Handle auth failures
      if (xhr.status === 401 || xhr.status === 403) {
        if (requiresAuth) {
          const sessionExpired = xhr.status === 401 && !isMockSessionToken(token);
          const authError = new Error(
            isMockSessionToken(token)
              ? "Unauthorized in mock session"
              : sessionExpired
                ? "Your session has expired. Please log in again."
                : "Forbidden (403)"
          );
          authError.status = xhr.status;
          authError.shouldRedirectToLogin = sessionExpired;
          if (sessionExpired) dispatchSessionExpired();
          reject(authError);
          return;
        }
        const accessError = new Error(
          xhr.status === 403 ? "Forbidden (403)" : "Unauthorized (401)"
        );
        accessError.status = xhr.status;
        reject(accessError);
        return;
      }

      // Handle other errors
      if (xhr.status < 200 || xhr.status >= 300) {
        let errorMessage = "Request failed";
        let errorDetails = null;

        try {
          if (!xhr.responseText || !xhr.responseText.trim()) {
            throw new Error("Empty error response body");
          }

          const errorData = JSON.parse(xhr.responseText);
          console.error("═══════════════════════════════════════════════════════════");
          console.error("apiRequestMultipart: FULL ERROR RESPONSE DATA:");
          console.error(JSON.stringify(errorData, null, 2));
          console.error("apiRequestMultipart: Error response keys:", Object.keys(errorData));
          console.error("═══════════════════════════════════════════════════════════");
          
          if (errorData.message) errorMessage = errorData.message;
          if (errorData.error) errorMessage = errorData.error;
          if (errorData.errors) {
            errorDetails = errorData.errors;
            const errorMessages = Array.isArray(errorData.errors) 
              ? errorData.errors.map(err => `${err.field || ''}: ${err.message || err}`).join(', ')
              : Object.entries(errorData.errors).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join(', ');
            if (errorMessages) errorMessage = errorMessages;
          }
          if (errorData.validationErrors) {
            errorDetails = errorData.validationErrors;
            errorMessage = Object.entries(errorData.validationErrors).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join(', ');
          }
          if (errorData.data && errorData.data.errors) {
            errorDetails = errorData.data.errors;
            errorMessage = Object.entries(errorData.data.errors).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join(', ');
          }
        } catch (e) {
          if (xhr.responseText && xhr.responseText.trim()) {
            console.error("apiRequestMultipart: Could not parse error response as JSON:", e);
            errorMessage = xhr.responseText;
          } else {
            errorMessage = `Request failed (${xhr.status})`;
          }
        }

        const error = new Error(errorMessage);
        error.details = errorDetails;
        error.status = xhr.status;
        reject(error);
        return;
      }

      // Success
      try {
        const response = JSON.parse(xhr.responseText);
        resolve(response);
      } catch (e) {
        // If response is not JSON, return as text
        resolve(xhr.responseText);
      }
    };

    xhr.onerror = function () {
      reject(new Error("Network error occurred"));
    };

    xhr.ontimeout = function () {
      reject(new Error("Request timeout"));
    };

    // Send the manually constructed body
    xhr.send(bodyBlob);
  });
};
