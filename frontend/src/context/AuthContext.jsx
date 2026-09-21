import { createContext, useContext, useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import { API_BASE_URL, apiRequest, SESSION_EXPIRED_EVENT } from "../lib/config";
import {
  DEFAULT_NON_ADMIN_MODULES,
  getUserModulesFromProfile,
} from "../lib/moduleAccess";
import { getDeniedFeaturesFromProfile } from "../lib/featureAccess";
import { resolveUserBranch } from "../lib/branchAccess";
import {
  getActiveBranchId,
  setActiveBranchId,
  clearActiveBranchId,
} from "../lib/activeBranch";
import { upsertMessengerUser } from "../lib/internalMessenger";
import {
  getRegisteredDisplayNameOverride,
  getRegisteredUserByEmail,
  REGISTERED_USERS_CHANGED_EVENT,
} from "../lib/registeredUsers";

const AuthContext = createContext(null);

const AUTH_TOKEN_KEY = "authToken";
const AUTH_USER_KEY = "authUser";
const AUTH_TOKEN_STORAGE_KEY = "pm_auth_token";
const AUTH_USER_STORAGE_KEY = "pm_auth_user";
const AUTH_BACKEND_STORAGE_KEY = "pm_auth_backend";
const AUTH_BACKEND_ID = String(import.meta.env.VITE_API_BASE_URL || API_BASE_URL || "")
  .trim()
  .replace(/\/+$/, "");
const ENABLE_MOCK_LOGIN = import.meta.env.VITE_ENABLE_MOCK_LOGIN === "true";
const MOCK_LOGIN_EMAIL = import.meta.env.VITE_MOCK_LOGIN_EMAIL || "admin@pm.local";
const MOCK_LOGIN_PASSWORD = import.meta.env.VITE_MOCK_LOGIN_PASSWORD || "admin123";
const MOCK_USER_EMAIL = import.meta.env.VITE_MOCK_USER_EMAIL || "user@pm.local";
const MOCK_USER_PASSWORD = import.meta.env.VITE_MOCK_USER_PASSWORD || "user123";
const CONFIGURED_LOGIN_ENDPOINT = import.meta.env.VITE_AUTH_LOGIN_ENDPOINT;
const LOGIN_ENDPOINT = CONFIGURED_LOGIN_ENDPOINT || "/users/sign-in";
// Only hit the real sign-in endpoint. The previous fallback list ("/auth/login",
// "/users/login", "/login") hit routes that don't exist on the backend and that
// Spring Security rejects with 403, which masked the genuine 401
// "Invalid username or password" with a misleading "Forbidden" message.
const LOGIN_ENDPOINTS = CONFIGURED_LOGIN_ENDPOINT
  ? [LOGIN_ENDPOINT]
  : Array.from(new Set([LOGIN_ENDPOINT, "/users/sign-in"].filter(Boolean)));

const cookieOptions = {
  expires: 7,
  path: "/",
  sameSite: "strict",
  secure: window.location.protocol === "https:",
};

const readCandidate = (source, path) => {
  if (!source || !path) return undefined;

  return path.split(".").reduce((value, key) => {
    if (value === null || value === undefined) return undefined;
    return value[key];
  }, source);
};

const pickFirstValue = (source, candidates = []) => {
  for (const candidate of candidates) {
    const value = readCandidate(source, candidate);
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return null;
};

const cleanAuthToken = (value) => {
  if (typeof value !== "string") return null;
  const tokenValue = value.trim();
  if (!tokenValue) return null;
  return tokenValue.replace(/^Bearer\s+/i, "").trim();
};

const findTokenInPayload = (source) => {
  if (!source || typeof source !== "object") return null;

  const tokenKeys = new Set([
    "accessToken",
    "access_token",
    "authToken",
    "bearerToken",
    "idToken",
    "jwt",
    "jwtToken",
    "jwt_token",
    "refreshToken",
    "token",
  ]);

  const queue = [source];
  const visited = new Set();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object" || visited.has(current)) continue;
    visited.add(current);

    for (const [key, value] of Object.entries(current)) {
      if (tokenKeys.has(key) && typeof value === "string") {
        const token = cleanAuthToken(value);
        if (token) return token;
      }

      if (value && typeof value === "object") {
        queue.push(value);
      }
    }
  }

  return null;
};

const checkIsAdminUser = (user) => {
  if (!user) return false;

  const derivedRole =
    user.role ||
    user.userType ||
    user.user_role ||
    (Array.isArray(user.roles) && user.roles.length > 0
      ? user.roles[0]?.name || user.roles[0]?.authority || user.roles[0]
      : "") ||
    (Array.isArray(user.authorities) && user.authorities.length > 0
      ? user.authorities[0]?.name || user.authorities[0]?.authority || user.authorities[0]
      : "");
  const roleUpper = String(derivedRole || "").toUpperCase();

  return (
    roleUpper === "SUPER_ADMIN" ||
    roleUpper === "ADMIN" ||
    user.isAdmin === true ||
    user.userType === "ADMIN" ||
    user.userType === "SUPER_ADMIN"
  );
};

const parseUser = () => {
  const storedUser = Cookies.get(AUTH_USER_KEY);
  const fallbackUser =
    storedUser ||
    localStorage.getItem(AUTH_USER_STORAGE_KEY) ||
    sessionStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (!fallbackUser) return null;
  try {
    return JSON.parse(fallbackUser);
  } catch {
    return null;
  }
};

const readStoredToken = () =>
  Cookies.get(AUTH_TOKEN_KEY) ||
  localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ||
  sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ||
  null;

const isMockToken = (nextToken) =>
  typeof nextToken === "string" && nextToken.startsWith("mock-auth-token");

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => readStoredToken());
  const [user, setUser] = useState(() => parseUser());
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [activeBranchId, setActiveBranchIdState] = useState(() => getActiveBranchId());

  // Switch the branch a head-office / admin user is acting as. Persist it, then
  // reload: every open screen holds already-fetched data for the previous scope,
  // and a full reload is the one reliable way to re-run every fetch under the new
  // X-Branch-Id header without threading a refetch through all 122 routes.
  const setActiveBranch = (branchId) => {
    const next = branchId ? String(branchId) : "";
    if (next === getActiveBranchId()) return;
    setActiveBranchId(next);
    setActiveBranchIdState(next);
    window.location.reload();
  };

  useEffect(() => {
    const storedToken = readStoredToken();
    const storedUser = parseUser();
    const storedBackend = localStorage.getItem(AUTH_BACKEND_STORAGE_KEY);
    const backendChanged =
      Boolean(storedToken) &&
      Boolean(AUTH_BACKEND_ID) &&
      storedBackend !== AUTH_BACKEND_ID;

    if (
      backendChanged ||
      (storedToken && !ENABLE_MOCK_LOGIN && isMockToken(storedToken))
    ) {
      clearSession();
      setToken(null);
      setUser(null);
    } else if (storedToken) {
      setToken(storedToken);
    }
    if (storedUser && !(storedToken && !ENABLE_MOCK_LOGIN && isMockToken(storedToken))) {
      setUser(storedUser);
    }
    setAuthReady(true);
  }, []);

  // Refresh the current user's sub-module denials from the backend once the session
  // is ready. The login payload is cached in localStorage and never re-read, so an
  // admin's change to a user's feature-permissions would otherwise not take effect
  // until a full logout/login. Refetching the user's own /users/profile (EAGER
  // deniedFeatures) makes the change apply on that user's next page load. Own-profile
  // endpoint, so it never 403s; failures are non-fatal and keep the cached profile.
  useEffect(() => {
    if (!authReady || !token || !user?.email) return;
    let cancelled = false;
    (async () => {
      try {
        const payload = await apiRequest("/users/profile", "GET", null, true);
        if (cancelled) return;
        const fresh = extractUser(payload, user.email);
        const freshDenied = getDeniedFeaturesFromProfile(fresh);
        const currentDenied = getDeniedFeaturesFromProfile(user);
        if (JSON.stringify(freshDenied) !== JSON.stringify(currentDenied)) {
          setUser((prev) => {
            const nextUser = { ...prev, deniedFeatures: freshDenied };
            persistSession(token, nextUser);
            return nextUser;
          });
        }
      } catch {
        // Non-fatal: keep the cached profile if the refresh fails.
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, token, user?.email]);

  // apiRequest fires this the moment any call comes back 401 (missing/invalid/expired
  // JWT). Clearing the session here flips isAuthenticated to false, which makes every
  // ProtectedRoute redirect to /auth/login on its next render instead of the screen
  // just sitting there throwing "Forbidden" at the user.
  useEffect(() => {
    const handleSessionExpired = () => {
      if (!readStoredToken()) return;
      logout();
      toast.info("Your session has expired. Please log in again.");
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user?.email) return;

    const syncRegisteredUser = () => {
      const registeredUser = getRegisteredUserByEmail(user.email);
      const registeredName =
        getRegisteredDisplayNameOverride(user.email) ||
        registeredUser?.name ||
        registeredUser?.fullName;
      if (!registeredName || registeredName === user.name) return;

      const nextUser = {
        ...user,
        ...(registeredUser || {}),
        name: registeredName,
        fullName: registeredName,
        moduleAccess: user.moduleAccess,
      };

      setUser(nextUser);
      persistSession(token, nextUser);
    };

    syncRegisteredUser();

    window.addEventListener(REGISTERED_USERS_CHANGED_EVENT, syncRegisteredUser);
    window.addEventListener("storage", syncRegisteredUser);

    return () => {
      window.removeEventListener(REGISTERED_USERS_CHANGED_EVENT, syncRegisteredUser);
      window.removeEventListener("storage", syncRegisteredUser);
    };
  }, [user?.email, user?.name, token]);

  const persistSession = (nextToken, nextUser) => {
    if (nextToken) {
      Cookies.set(AUTH_TOKEN_KEY, nextToken, cookieOptions);
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, nextToken);
      sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, nextToken);
      if (AUTH_BACKEND_ID) {
        localStorage.setItem(AUTH_BACKEND_STORAGE_KEY, AUTH_BACKEND_ID);
      }
    }
    if (nextUser) {
      const serializedUser = JSON.stringify(nextUser);
      Cookies.set(AUTH_USER_KEY, serializedUser, cookieOptions);
      localStorage.setItem(AUTH_USER_STORAGE_KEY, serializedUser);
      sessionStorage.setItem(AUTH_USER_STORAGE_KEY, serializedUser);
      upsertMessengerUser(nextUser);
    }
  };

  const clearSession = () => {
    // Remove cookies with the same options they were set with to ensure complete removal
    Cookies.remove(AUTH_TOKEN_KEY, {
      path: "/",
      sameSite: "strict",
      secure: window.location.protocol === "https:",
    });
    Cookies.remove(AUTH_USER_KEY, {
      path: "/",
      sameSite: "strict",
      secure: window.location.protocol === "https:",
    });
    // Also try removing without options as fallback
    Cookies.remove(AUTH_TOKEN_KEY);
    Cookies.remove(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    localStorage.removeItem(AUTH_BACKEND_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_USER_STORAGE_KEY);
  };

  const loginWithMockUser = (mockProfile) => {
    const nextToken = mockProfile.token;
    const nextUser = {
      ...mockProfile.user,
      moduleAccess:
        mockProfile.user?.isAdmin || mockProfile.user?.role === "SUPER_ADMIN"
          ? DEFAULT_NON_ADMIN_MODULES
          : getUserModulesFromProfile(mockProfile.user),
    };

    setToken(nextToken);
    setUser(nextUser);
    persistSession(nextToken, nextUser);
    clearActiveBranchId();
    setActiveBranchIdState("");

    return { token: nextToken, user: nextUser };
  };

  const extractToken = (payload) => {
    if (typeof payload === "string") return cleanAuthToken(payload);

    const directToken = pickFirstValue(payload, [
      "response.data.jwtResponse.token",
      "response.data.jwtResponse.accessToken",
      "response.data.jwtResponse.access_token",
      "response.jwtResponse.token",
      "response.jwtResponse.accessToken",
      "response.jwtResponse.access_token",
      "data.jwtResponse.token",
      "data.jwtResponse.accessToken",
      "data.jwtResponse.access_token",
      "jwtResponse.token",
      "jwtResponse.accessToken",
      "jwtResponse.access_token",
      "response.data.accessToken",
      "response.data.access_token",
      "response.data.token",
      "response.data.jwt",
      "response.data.jwtToken",
      "response.data.authToken",
      "response.accessToken",
      "response.access_token",
      "response.token",
      "response.jwt",
      "response.jwtToken",
      "response.authToken",
      "data.accessToken",
      "data.access_token",
      "data.token",
      "data.jwt",
      "data.jwtToken",
      "data.authToken",
      "accessToken",
      "access_token",
      "authToken",
      "token",
      "jwt",
      "jwtToken",
      "jwt_token",
      "response.data.bearerToken",
      "response.bearerToken",
      "data.bearerToken",
      "bearerToken",
    ]);

    return cleanAuthToken(directToken) || findTokenInPayload(payload);
  };

  const extractUser = (payload, emailFallback) => {
    const nestedUser =
      pickFirstValue(payload, [
        "response.data.userDetails",
        "response.data.user",
        "response.userDetails",
        "response.user",
        "data.userDetails",
        "data.user",
        "userDetails",
        "user",
      ]) || {};

    const roles =
      nestedUser?.roles ||
      nestedUser?.authorities ||
      payload?.response?.data?.roles ||
      payload?.data?.roles ||
      payload?.roles ||
      [];

    return {
      email:
        nestedUser?.email ||
        payload?.response?.data?.email ||
        payload?.data?.email ||
        emailFallback,
      role:
        nestedUser?.role ||
        nestedUser?.userType ||
        (Array.isArray(roles) && roles.length > 0
          ? roles[0]?.name || roles[0]?.authority || roles[0]
          : undefined),
      userType: nestedUser?.userType || nestedUser?.role,
      isAdmin: nestedUser?.isAdmin,
      ...nestedUser,
    };
  };

  const login = async (email, password) => {
    setLoading(true);

    try {
      if (ENABLE_MOCK_LOGIN) {
        const normalizedEmail = email.trim().toLowerCase();
        const expectedEmail = MOCK_LOGIN_EMAIL.trim().toLowerCase();
        const expectedUserEmail = MOCK_USER_EMAIL.trim().toLowerCase();
        const looksLikeAdminEmail =
          normalizedEmail.includes("admin") ||
          normalizedEmail.endsWith("@pm.local");

        if (
          (normalizedEmail === expectedEmail || looksLikeAdminEmail) &&
          password === MOCK_LOGIN_PASSWORD
        ) {
          return loginWithMockUser({
            token: "mock-auth-token-admin",
            user: {
              id: "mock-admin-1",
              email: email.trim(),
              role: "SUPER_ADMIN",
              userType: "SUPER_ADMIN",
              isAdmin: true,
              firstName: "Mock",
              lastName: "Admin",
            },
          });
        }

        if (
          (normalizedEmail === expectedUserEmail ||
            (normalizedEmail !== expectedEmail && !looksLikeAdminEmail)) &&
          password === MOCK_USER_PASSWORD
        ) {
          return loginWithMockUser({
            token: "mock-auth-token-user",
            user: {
              id: "mock-user-1",
              email: email.trim(),
              role: "USER",
              userType: "USER",
              isAdmin: false,
              firstName: "Mock",
              lastName: "User",
            },
          });
        }
      }

      const isBrowser = typeof window !== "undefined";
      const isVercel =
        isBrowser && window.location.hostname.includes("vercel.app");
      const isDev = isBrowser && import.meta.env.DEV;

      let resolvedApiBase = API_BASE_URL;

      if (isDev || isVercel) {
        resolvedApiBase = "/api";
      }

      if (!resolvedApiBase) {
        const errorMsg =
          "API configuration error: VITE_API_BASE_URL is not set. Please contact support.";
        console.error("Login Error:", errorMsg);
        throw new Error(errorMsg);
      }

      const requestBodies = [{ email: email.trim(), password }];

      let payload = null;
      let lastLoginError = null;

      for (const loginEndpoint of LOGIN_ENDPOINTS) {
        const normalizedEndpoint = loginEndpoint.startsWith("/")
          ? loginEndpoint
          : `/${loginEndpoint}`;
        const endpoint = resolvedApiBase.endsWith("/")
          ? `${resolvedApiBase.slice(0, -1)}${normalizedEndpoint}`
          : `${resolvedApiBase}${normalizedEndpoint}`;

        for (const requestBody of requestBodies) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);
          let response;
          let nextPayload = {};

          try {
            response = await fetch(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(requestBody),
              signal: controller.signal,
            });
            nextPayload = await response.json().catch(() => ({}));
            const headerToken =
              response.headers.get("Authorization") ||
              response.headers.get("authorization") ||
              response.headers.get("X-Auth-Token") ||
              response.headers.get("x-auth-token");
            if (headerToken && !extractToken(nextPayload)) {
              nextPayload = {
                ...nextPayload,
                accessToken: headerToken,
              };
            }
          } finally {
            clearTimeout(timeoutId);
          }

          const responseCode = Number(
            nextPayload?.code ||
              nextPayload?.statusCode ||
              nextPayload?.response?.code ||
              nextPayload?.response?.statusCode ||
              0,
          );

          if (!response.ok || responseCode === 401 || responseCode === 403) {
            const errorMessage =
              nextPayload?.message ||
              nextPayload?.error ||
              nextPayload?.response?.message ||
              `Unable to sign in (${response.status || responseCode})`;
            lastLoginError = new Error(errorMessage);
            lastLoginError.status = response.status || responseCode;

            if (![401, 403, 404, 405].includes(Number(lastLoginError.status))) {
              throw lastLoginError;
            }
            continue;
          }

          if (extractToken(nextPayload)) {
            payload = nextPayload;
            break;
          }

          lastLoginError = new Error(
            "Missing authentication token in response. The backend accepted the login but did not return a token field the frontend can use."
          );
        }

        if (payload) break;
      }

      if (!payload) {
        throw lastLoginError || new Error("Unable to sign in. Please try again.");
      }

      const nextToken = extractToken(payload);

      if (!nextToken) {
        throw new Error(
          "Missing authentication token in response. The backend accepted the login but did not return a token field the frontend can use."
        );
      }

      const nextUser = extractUser(payload, email.trim());
      const registeredUser = getRegisteredUserByEmail(nextUser?.email || email.trim());
      const nextIsAdmin = checkIsAdminUser(nextUser);
      const displayName =
        getRegisteredDisplayNameOverride(nextUser?.email || email.trim()) ||
        registeredUser?.name ||
        registeredUser?.fullName ||
        nextUser?.name ||
        nextUser?.fullName ||
        "";
      const profileModules = getUserModulesFromProfile({
        ...nextUser,
        ...(registeredUser || {}),
      });
      const mergedUser = {
        ...nextUser,
        ...(registeredUser || {}),
        name: displayName || nextUser?.name,
        fullName: displayName || nextUser?.fullName,
        moduleAccess: nextIsAdmin
          ? DEFAULT_NON_ADMIN_MODULES
          : profileModules,
      };

      setToken(nextToken);
      setUser(mergedUser);
      persistSession(nextToken, mergedUser);
      // A fresh sign-in starts at the full "All Branches" view; the previous
      // session's branch selection must not carry over.
      clearActiveBranchId();
      setActiveBranchIdState("");

      return { token: nextToken, user: mergedUser };
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new Error("Login request timed out. Backend server is not reachable.");
      }
      if (String(error?.message || "").toLowerCase().includes("failed to fetch")) {
        throw new Error("Unable to reach login server. Check backend/VPN/network.");
      }
      if (
        String(error?.message || "").toLowerCase().includes("networkerror") ||
        String(error?.message || "").toLowerCase().includes("network error")
      ) {
        throw new Error("Unable to reach login server. Backend API is not responding.");
      }
      // Re-throw with better context
      if (error.message.includes("API configuration error")) {
        throw error;
      }
      throw new Error(error.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    clearSession();
    // A branch selection belongs to the person who made it: never let the next
    // user inherit it.
    clearActiveBranchId();
    setActiveBranchIdState("");
    // Clear admin session storage
    sessionStorage.removeItem("isAdmin");
    sessionStorage.removeItem("adminEmail");
  };

  // Helper function to check if user is admin
  const isAdmin = () => {
    return checkIsAdminUser(user);
  };

  const value = useMemo(() => {
    const admin = isAdmin();
    const branch = resolveUserBranch(user);

    // A "branch user" is someone pinned to a single real branch: not an admin, and
    // not posted to Head Office. This mirrors exactly how the backend decides
    // scoping (BranchContextFilter), so the UI and the API agree on who is locked
    // down. The server is still the enforcement point — this only drives what the
    // UI shows and disables.
    const isBranchUser = !admin && Boolean(branch?.id) && !branch.isHeadOffice;

    // Who gets the branch switcher: anyone the backend treats as unrestricted —
    // an admin, or a user posted to Head Office. Everyone else is either pinned to
    // one branch (badge only) or a shopper (no branch UI at all).
    const canSelectBranch = admin || Boolean(branch?.isHeadOffice);

    return {
      token,
      user,
      isAuthenticated: Boolean(token),
      authReady,
      loading,
      login,
      logout,
      isAdmin: admin,
      branch,
      branchId: branch?.id ?? null,
      isBranchUser,
      canSelectBranch,
      activeBranchId,
      setActiveBranch,
      allowedModules: admin
        ? DEFAULT_NON_ADMIN_MODULES
        : getUserModulesFromProfile(user),
      // Admins are never feature-restricted; other users carry their denials.
      deniedFeatures: admin ? [] : getDeniedFeaturesFromProfile(user),
    };
  }, [token, user, authReady, loading, activeBranchId]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
