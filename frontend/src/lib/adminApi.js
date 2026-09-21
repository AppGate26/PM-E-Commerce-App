import { apiRequest } from "./config";

const ENABLE_ADMIN_SETTINGS_FETCH =
  import.meta.env.VITE_ENABLE_ADMIN_SETTINGS_FETCH === "true";

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.response)) return payload.response;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.response?.content)) return payload.response.content;
  if (Array.isArray(payload?.response?.data)) return payload.response.data;
  return [];
};

const toObject = (payload) => {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return (
      payload.response?.data ||
      payload.response ||
      payload.data ||
      payload.content ||
      payload
    );
  }
  return {};
};

// `category` groups these on the Approvals hub page (see Approvals.jsx); it has no
// backend meaning. `noCount` marks entries that don't represent a distinct pending queue
// (e.g. a review-all view) so the hub shows them without a (permanently 0 or misleading)
// count badge.
const approvalEndpoints = [
  {
    key: "addToStock",
    label: "Add To Stock",
    path: "/admin/approvals/stock/pending",
    route: "/admin/approvals/add-to-stock",
    category: "sales",
  },
  {
    key: "cashSales",
    label: "Cash Sales",
    path: "/admin/approvals/cash-sales/pending",
    route: "/admin/approvals/cash-sales",
    category: "sales",
  },
  {
    key: "creditSales",
    label: "Credit Sales",
    path: "/admin/approvals/credit-sales/pending",
    route: "/admin/approvals/credit-sales",
    category: "sales",
  },
  {
    key: "onlineSales",
    label: "Online Sales",
    route: "/admin/approvals/online-sales",
    category: "sales",
    customCount: "onlineSales",
  },
  {
    key: "refund",
    label: "Refund",
    path: "/admin/approvals/refund/pending",
    route: "/admin/approvals/refund",
    category: "sales",
  },
  {
    key: "return",
    label: "Return",
    route: "/admin/approvals/return",
    category: "sales",
    customCount: "return",
  },
  {
    key: "cancellation",
    label: "Order Cancellation",
    route: "/admin/approvals/cancellation",
    category: "sales",
    customCount: "cancellation",
  },
  {
    key: "customerRegistration",
    label: "Customer Registration",
    path: "/admin/approvals/customers/pending",
    route: "/admin/approvals/customer-registration",
    category: "customer",
  },
  {
    key: "customerEdit",
    label: "Customer Edit",
    path: "/admin/approvals/customer-edit/pending",
    route: "/admin/approvals/customer-edit",
    category: "customer",
  },
  {
    key: "customerSuspension",
    label: "Suspended Customers",
    path: "/admin/approvals/suspensions/pending",
    route: "/admin/approvals/suspended-customers",
    category: "customer",
  },
  {
    key: "customerUnblock",
    label: "Unblock Customers",
    path: "/admin/approvals/unblocks/pending",
    route: "/admin/approvals/unblock-customers",
    category: "customer",
  },
  {
    key: "goodsSupplied",
    label: "Goods Supplied",
    path: "/admin/approvals/goods-supplied/pending",
    route: "/admin/approvals/goods-supplied",
    category: "inventory",
  },
  {
    key: "journal",
    label: "Journal",
    path: "/admin/approvals/journal/pending",
    route: "/admin/approvals/journal",
    category: "inventory",
  },
  {
    key: "stockDelete",
    label: "Stock Delete",
    path: "/admin/approvals/stock-delete/pending",
    route: "/admin/approvals/stock-delete",
    category: "inventory",
  },
  {
    key: "supplierRegistration",
    label: "Supplier Registration",
    path: "/admin/approvals/suppliers/pending",
    route: "/admin/approvals/supplier-reg",
    category: "suppliers",
  },
  {
    key: "productToWarehouse",
    label: "Product To Warehouse",
    path: "/admin/approvals/product-to-warehouse/pending",
    route: "/admin/approvals/product-to-warehouse",
    category: "warehouse",
  },
  // Warehouse buckets share one real backend queue (WarehouseController returns ALL
  // pending movements); we count client-side by movementType. Entries with an empty
  // movementTypes array have no backend queue wired up yet, so their count always reads 0.
  {
    key: "warehouseProductToStock",
    label: "Warehouse Product To Stock",
    route: "/admin/approvals/warehouse/product-to-stock",
    category: "warehouse",
    movementTypes: ["STOCK_ALLOCATION", "PRODUCT_RECEIPT"],
  },
  {
    key: "warehouseProductSwap",
    label: "Warehouse Product Swap",
    route: "/admin/approvals/warehouse/product-swap",
    category: "warehouse",
    movementTypes: ["SWAP"],
  },
  {
    key: "warehouseProductTransfer",
    label: "Warehouse Product Transfer",
    route: "/admin/approvals/warehouse/product-transfer",
    category: "warehouse",
    movementTypes: ["TRANSFER"],
  },
  {
    key: "warehouseQuarantineProduct",
    label: "Warehouse Quarantine Product",
    route: "/admin/approvals/warehouse/quarantine-product",
    category: "warehouse",
    movementTypes: ["QUARANTINE_IN", "QUARANTINE_OUT"],
  },
  {
    key: "warehouseAttachManager",
    label: "Attach Warehouse Manager",
    route: "/admin/approvals/warehouse/attach-manager",
    category: "warehouse",
    movementTypes: [],
  },
  {
    key: "warehouseStatus",
    label: "Activate / Deactivate Warehouse",
    route: "/admin/approvals/warehouse/status",
    category: "warehouse",
    movementTypes: [],
  },
  {
    key: "warehouseStockBalance",
    label: "Warehouse Stock Balance Review",
    route: "/admin/approvals/warehouse/stock-balance",
    category: "warehouse",
    movementTypes: [],
    noCount: true,
  },
];

export const APPROVAL_CATEGORIES = [
  { key: "sales", label: "Sales & Transactions" },
  { key: "customer", label: "Customer" },
  { key: "inventory", label: "Inventory & Stock" },
  { key: "suppliers", label: "Suppliers" },
  { key: "warehouse", label: "Warehouse" },
];

// Real backend queue for all warehouse movements (see WarehouseController).
const WAREHOUSE_PENDING_PATH = "/admin/warehouses/movements/pending";

export const APPROVAL_TYPES = {
  stockAdd: "STOCK_ADD",
  cashSales: "CASH_SALES",
  creditSales: "CREDIT_SALES",
  refund: "REFUND",
  return: "RETURN",
  customerRegistration: "CUSTOMER_REGISTRATION",
  customerEdit: "CUSTOMER_EDIT",
  goodsSupplied: "GOODS_SUPPLIED",
  journalEntry: "JOURNAL_ENTRY",
  stockDelete: "STOCK_DELETE",
  supplierRegistration: "SUPPLIER_REGISTRATION",
  customerSuspension: "CUSTOMER_SUSPENSION",
  customerUnblock: "CUSTOMER_UNBLOCK",
  productToWarehouse: "PRODUCT_TO_WAREHOUSE",
  warehouseProductToStock: "WAREHOUSE_PRODUCT_TO_STOCK",
  warehouseProductSwap: "WAREHOUSE_PRODUCT_SWAP",
  warehouseProductTransfer: "WAREHOUSE_PRODUCT_TRANSFER",
  warehouseQuarantineProduct: "WAREHOUSE_QUARANTINE_PRODUCT",
  warehouseAttachManager: "WAREHOUSE_ATTACH_MANAGER",
  warehouseStatus: "WAREHOUSE_STATUS",
  warehouseStockBalance: "WAREHOUSE_STOCK_BALANCE",
};

export const createApprovalRequest = async ({
  approvalType,
  entityId = null,
  requestedBy = 0,
  requestData,
  comments = "",
}) => {
  const payload = {
    approvalType,
    entityId,
    requestedBy,
    requestData:
      typeof requestData === "string" ? requestData : JSON.stringify(requestData || {}),
    comments,
  };

  const response = await apiRequest("/admin/approvals", "POST", payload, true);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("approval-request-created"));
  }

  return response;
};

export const fetchAdminUsers = async () => {
  const payload = await apiRequest("/admin/security/users", "GET");
  return toArray(payload);
};

export const fetchAdminActiveSessions = async () => {
  const endpoints = [
    "/admin/security/sessions/active",
    "/admin/security/sessions",
    "/admin/active-sessions",
  ];

  for (const endpoint of endpoints) {
    try {
      const payload = await apiRequest(endpoint, "GET");
      const rows = toArray(payload);
      if (rows.length > 0) return rows;
    } catch {
      // Try the next supported endpoint.
    }
  }

  return [];
};

export const fetchAdminLanguageSetting = async () => {
  if (!ENABLE_ADMIN_SETTINGS_FETCH) {
    return {
      value: localStorage.getItem("pm_language") || "",
      raw: {},
    };
  }

  try {
    const payload = await apiRequest("/settings/language", "GET");
    const data = toObject(payload);
    return {
      value:
        data.selectedLanguage ||
        data.language ||
        data.value ||
        data.name ||
        "",
      raw: data,
    };
  } catch {
    return {
      value: localStorage.getItem("pm_language") || "",
      raw: {},
    };
  }
};

export const updateAdminLanguageSetting = async (language) => {
  localStorage.setItem("pm_language", language || "");

  if (!ENABLE_ADMIN_SETTINGS_FETCH) {
    return { language };
  }

  return apiRequest("/settings/language", "PUT", { language });
};

export const fetchAdminCurrencySetting = async () => {
  const payload = await apiRequest("/settings/currency", "GET");
  const data = toObject(payload);
  return {
    value:
      data.selectedCurrency ||
      data.currency ||
      data.value ||
      data.name ||
      "",
    raw: data,
  };
};

export const updateAdminCurrencySetting = async (currency) => {
  return apiRequest("/settings/currency", "PUT", { currency });
};

// Fetch the single warehouse movement queue once and bucket the PENDING rows by
// movementType so each warehouse approval card shows a real count.
const fetchWarehouseMovementCounts = async () => {
  const counts = {};
  try {
    const payload = await apiRequest(WAREHOUSE_PENDING_PATH, "GET");
    const rows = toArray(payload);
    for (const row of rows) {
      const type = row?.movementType;
      if (type) counts[type] = (counts[type] || 0) + 1;
    }
    return { counts, ok: true };
  } catch {
    return { counts, ok: false };
  }
};

// The online-sales report endpoint has no status filter server-side, so pending count
// has to be derived client-side from the (customer-type-scoped) order list. "Pending" here
// means awaiting admin sign-off, i.e. OrderStatus.APPROVED (see submitOrderForApproval in
// SalesService) - not OrderStatus.PENDING, which just means "awaiting payment" and isn't
// actionable on the Online Sales Approvals screen.
const fetchOnlineSalesPendingCount = async () => {
  try {
    const payload = await apiRequest("/sales/reports/all/online?size=500", "GET");
    const rows = toArray(payload);
    const count = rows.filter(
      (order) => String(order?.status || "").toUpperCase() === "APPROVED"
    ).length;
    return { count, ok: true };
  } catch {
    return { count: 0, ok: false };
  }
};

// Returns are their own feature (ReturnRequestController, /api/returns) and were never
// wired into the generic "/admin/approvals/{type}/pending" queue, so - like online sales -
// pending count is fetched straight from the real endpoint instead of a nonexistent one.
const fetchReturnPendingCount = async () => {
  try {
    const payload = await apiRequest("/returns?status=PENDING&size=500", "GET");
    return { count: toArray(payload).length, ok: true };
  } catch {
    return { count: 0, ok: false };
  }
};

// Pending order-cancellation requests awaiting admin's final decision (sales has already
// forwarded these - see SalesService.getPendingCancellationApprovals).
const fetchCancellationPendingCount = async () => {
  try {
    const payload = await apiRequest("/sales/orders/pending-cancellation-approvals?size=500", "GET");
    return { count: toArray(payload).length, ok: true };
  } catch {
    return { count: 0, ok: false };
  }
};

const CUSTOM_COUNT_FETCHERS = {
  onlineSales: fetchOnlineSalesPendingCount,
  return: fetchReturnPendingCount,
  cancellation: fetchCancellationPendingCount,
};

export const fetchApprovalCounts = async () => {
  const needsWarehouse = approvalEndpoints.some((item) => item.movementTypes);
  const warehouse = needsWarehouse
    ? await fetchWarehouseMovementCounts()
    : { counts: {}, ok: false };

  const results = await Promise.all(
    approvalEndpoints.map(async (item) => {
      // Warehouse buckets are derived from the shared movement queue.
      if (item.movementTypes) {
        const count = item.movementTypes.reduce(
          (total, type) => total + (warehouse.counts[type] || 0),
          0
        );
        return { ...item, count, ok: warehouse.ok };
      }

      if (item.customCount && CUSTOM_COUNT_FETCHERS[item.customCount]) {
        const { count, ok } = await CUSTOM_COUNT_FETCHERS[item.customCount]();
        return { ...item, count, ok };
      }

      try {
        const payload = await apiRequest(item.path, "GET");
        const count = toArray(payload).length;
        return { ...item, count, ok: true };
      } catch {
        return { ...item, count: 0, ok: false };
      }
    })
  );

  return results;
};

export const fetchAdminOverview = async () => {
  const [users, sessions, language, currency, approvalBuckets] =
    await Promise.all([
      fetchAdminUsers().catch(() => []),
      fetchAdminActiveSessions().catch(() => []),
      fetchAdminLanguageSetting().catch(() => ({ value: "" })),
      fetchAdminCurrencySetting().catch(() => ({ value: "" })),
      fetchApprovalCounts().catch(() => []),
    ]);

  return {
    usersCount: users.length,
    sessionsCount: sessions.length,
    approvals: approvalBuckets,
    approvalsCount: approvalBuckets.reduce(
      (total, item) => total + Number(item.count || 0),
      0
    ),
    language: language.value || "Not set",
    currency: currency.value || "Not set",
  };
};
