import { apiRequest } from "./config";

// Catalog of sub-features (screens inside a module) that an admin can deny to a
// specific user, even when the parent module permission is granted. Each entry
// carries the module it belongs to and the route path prefix used to enforce the
// denial. Keys are stable strings persisted on the backend (User.deniedFeatures).
//
// This catalog is intentionally extensible: add an entry here and the Permission
// card + route enforcement pick it up automatically.
export const FEATURE_CATALOG = [
  // Accounting
  { key: "accounting.setup", module: "accounting", label: "Account Setup", path: "/Accounting/Setup" },
  { key: "accounting.transaction", module: "accounting", label: "Transaction", path: "/Accounting/Transaction" },
  { key: "accounting.journalentry", module: "accounting", label: "Journal Entry", path: "/Accounting/JournalEntry" },
  { key: "accounting.fundtransfers", module: "accounting", label: "Fund Transfers", path: "/Accounting/FundTransfers" },
  { key: "accounting.transactionview", module: "accounting", label: "Transaction Views", path: "/Accounting/TransactionView" },
  { key: "accounting.transactionbyaccount", module: "accounting", label: "Transaction By Account", path: "/Accounting/TransactionByAccount" },
  { key: "accounting.reports", module: "accounting", label: "Accounting Reports", path: "/Accounting/Reports" },
  { key: "accounting.staffpayroll", module: "accounting", label: "Staff Payroll", path: "/Accounting/StaffPayroll" },

  // Inventory
  { key: "inventory.suppliers", module: "inventory", label: "Suppliers", path: "/inventory/suppliers" },
  { key: "inventory.stocks", module: "inventory", label: "Stock Register", path: "/inventory/stocks" },
  { key: "inventory.reports", module: "inventory", label: "Inventory Reports", path: "/inventory/reports" },

  // Cashier Stand
  { key: "cashier_stand.report", module: "cashier_stand", label: "Cashier Report", path: "/cashier-report" },

  // Payment
  { key: "payment.balances", module: "payment", label: "Wallet Balances", path: "/payment/balances" },
  { key: "payment.mainbalance", module: "payment", label: "Main Balance", path: "/payment/main-balance" },
  { key: "payment.disputes", module: "payment", label: "Disputes", path: "/payment/disputes" },
  { key: "payment.notifications", module: "payment", label: "Notifications", path: "/payment/notifications" },

  // Recovery
  { key: "recovery.reminder", module: "recovery", label: "Recovery Reminder", path: "/recovery/reminder" },
];

export const getFeaturesForModule = (moduleKey) =>
  FEATURE_CATALOG.filter((feature) => feature.module === moduleKey);

export const getFeatureLabel = (key) =>
  FEATURE_CATALOG.find((feature) => feature.key === key)?.label || key;

export const normalizeDeniedFeatures = (features = []) => {
  if (!Array.isArray(features)) return [];
  const validKeys = new Set(FEATURE_CATALOG.map((item) => item.key));
  return [
    ...new Set(
      features
        .map((item) => String(item).trim().toLowerCase())
        .filter((item) => validKeys.has(item))
    ),
  ];
};

const extractDenied = (payload) => {
  const data = payload?.response?.data || payload?.response || payload?.data || payload || {};
  if (Array.isArray(data)) return data;
  return data.deniedFeatures || data.denied || [];
};

// Read a user's denied features from their profile (login response carries them
// on User.deniedFeatures) with a normalization pass.
export const getDeniedFeaturesFromProfile = (user = {}) =>
  normalizeDeniedFeatures(
    user?.deniedFeatures || user?.raw?.deniedFeatures || []
  );

// Read a user's denied features straight from the backend (source of truth).
export const fetchDeniedFeatures = async (email) => {
  if (!email) return [];
  const payload = await apiRequest(
    `/admin/security/users/denied-features?email=${encodeURIComponent(email)}`,
    "GET"
  );
  return normalizeDeniedFeatures(extractDenied(payload));
};

// Persist a user's denied features to the backend.
export const assignDeniedFeatures = async (email, features) => {
  if (!email) return [];
  const normalized = normalizeDeniedFeatures(features);
  await apiRequest("/admin/security/users/denied-features", "PUT", {
    email,
    deniedFeatures: normalized,
  });
  return normalized;
};

// True when the given route path falls under a feature the user has been denied.
// Matches the most specific (longest) catalog path prefix so nested routes such
// as "/Accounting/Reports/journal" are covered by "/Accounting/Reports".
export const isPathDenied = (pathname = "", deniedFeatures = []) => {
  const denied = new Set(normalizeDeniedFeatures(deniedFeatures));
  if (denied.size === 0 || !pathname) return false;

  const match = FEATURE_CATALOG
    .filter((feature) => {
      const base = feature.path.toLowerCase();
      const path = pathname.toLowerCase();
      return path === base || path.startsWith(`${base}/`);
    })
    .sort((a, b) => b.path.length - a.path.length)[0];

  return Boolean(match && denied.has(match.key));
};

// True when a specific catalog feature key is denied for the user.
export const isFeatureDenied = (featureKey, deniedFeatures = []) =>
  normalizeDeniedFeatures(deniedFeatures).includes(String(featureKey).toLowerCase());
