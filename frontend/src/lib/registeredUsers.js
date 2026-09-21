// User identity (names, accounts) is sourced from the backend security users API.
// The former localStorage cache and display-name override map have been removed;
// the override/lookup helpers remain as no-ops so existing callers keep working.

export const REGISTERED_USERS_CHANGED_EVENT = "pm-registered-users-changed";

export const notifyRegisteredUsersChanged = (detail = {}) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(REGISTERED_USERS_CHANGED_EVENT, { detail }));
};

// No-op shim: renames now persist through the backend (user update), not localStorage.
export const setRegisteredDisplayName = (email, name) => {
  notifyRegisteredUsersChanged({ email, name });
  return {};
};

export const getRegisteredDisplayNameOverride = () => "";

export const getRegisteredUserByEmail = () => null;

// Resolve a display name purely from the (backend-sourced) user profile.
export const getRegisteredDisplayName = (user = {}) => {
  const profile = user || {};
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim();

  return (
    profile.name ||
    profile.fullName ||
    fullName ||
    profile.username ||
    profile.email?.split("@")[0] ||
    "Signed in user"
  );
};
