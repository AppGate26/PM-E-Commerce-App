import { apiRequest } from "./config";

export const MODULE_OPTIONS = [
  { key: "client", label: "Client" },
  { key: "accounting", label: "Accounting" },
  { key: "ordering_sales", label: "Ordering And Sales" },
  { key: "inventory", label: "Inventory" },
  { key: "warehouse", label: "Warehouse" },
  { key: "branch", label: "Branch" },
  { key: "cashier_stand", label: "Cashier Stand" },
  { key: "recovery", label: "Recovery" },
  { key: "delivery", label: "Delivery" },
  { key: "payment", label: "Payment" },
  { key: "care", label: "Care" },
  { key: "mail_messenger", label: "Mail And Messenger" },
];

export const normalizeModules = (modules = []) => {
  if (!Array.isArray(modules)) return [];

  const validKeys = new Set(MODULE_OPTIONS.map((item) => item.key));
  return [...new Set(modules.map((item) => String(item).trim().toLowerCase()).filter((item) => validKeys.has(item)))];
};

// Frontend module keys are the lowercase form of the backend PermissionEnum names,
// so mapping between the two is a simple case change.
export const modulesToPermissions = (modules = []) =>
  normalizeModules(modules).map((key) => key.toUpperCase());

const extractPermissions = (payload) => {
  const data = payload?.response?.data || payload?.response || payload?.data || payload || {};
  if (Array.isArray(data)) return data;
  return data.permissions || data.moduleAccess || data.modules || [];
};

export const getUserModulesFromProfile = (user = {}) => {
  const profile = user || {};
  return normalizeModules(
    profile.moduleAccess ||
      profile.modules ||
      profile.allowedModules ||
      profile.permissions ||
      profile.raw?.permissions ||
      []
  );
};

// Read a user's assigned modules straight from the backend (single source of truth).
export const fetchUserModules = async (email) => {
  if (!email) return [];
  const payload = await apiRequest(
    `/admin/security/users/permissions?email=${encodeURIComponent(email)}`,
    "GET"
  );
  return normalizeModules(extractPermissions(payload));
};

// Persist a user's assigned modules to the backend.
export const assignUserModules = async (email, modules) => {
  if (!email) return [];
  const normalized = normalizeModules(modules);
  await apiRequest("/admin/security/users/permissions", "PUT", {
    email,
    permissions: normalized.map((key) => key.toUpperCase()),
  });
  return normalized;
};

export const getModuleLabel = (key) =>
  MODULE_OPTIONS.find((item) => item.key === key)?.label || key;

export const DEFAULT_NON_ADMIN_MODULES = MODULE_OPTIONS.map((item) => item.key);
