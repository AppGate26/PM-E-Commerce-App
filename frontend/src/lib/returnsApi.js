import { apiRequest } from "./config";

// Backend: ReturnRequestController @ /api/returns
const RETURN_ENDPOINT = "/returns";

const unwrap = (payload) => payload?.response ?? payload?.data ?? payload;

const toArray = (payload) => {
  const data = unwrap(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  return [];
};

// --- Enum mapping (frontend display labels <-> backend enums) ---
export const toBackendReturnMethod = (value = "") =>
  /pickup/i.test(value) ? "PICKUP" : "DELIVERY";

export const toBackendRefundMethod = (value = "") =>
  /exchange|replacement|other/i.test(value)
    ? "RECEIVE_OTHER_PRODUCT"
    : "RECEIVE_SIMILAR_PRODUCT";

const STATUS_TO_BACKEND = {
  Pending: "PENDING",
  Approved: "APPROVED",
  Rejected: "REJECTED",
  "Picked up": "PROCESSING",
  Refunded: "COMPLETED",
  Completed: "COMPLETED",
  Restored: "RESTORED",
};

const STATUS_TO_DISPLAY = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PROCESSING: "Picked up",
  COMPLETED: "Completed",
  RESTORED: "Restored",
};

export const toBackendReturnStatus = (status = "") => STATUS_TO_BACKEND[status] || "PENDING";
export const toDisplayReturnStatus = (status = "") =>
  STATUS_TO_DISPLAY[String(status || "").toUpperCase()] || "Pending";

// Map a persisted return into the shape the UI table expects.
export const normalizeReturnRequest = (row = {}) => ({
  id: row.id,
  orderId: row.salesOrderId ?? row.orderId ?? "",
  referenceNo: row.referenceNo || "",
  customerName: row.customerName || "",
  reason: row.reason || "",
  productName: row.replacementProductName || row.productName || "",
  status: toDisplayReturnStatus(row.status),
  adminComment: row.adminNotes || "",
  createdAt: row.createdAt || row.reviewedAt || "",
  notifications: {},
  restorationReceivedAt: row.restorationReceivedAt || "",
  restorationCompletedAt: row.restorationCompletedAt || "",
  restorationDescription: row.restorationDescription || "",
  raw: row,
});

export const fetchReturns = async () => {
  const payload = await apiRequest(`${RETURN_ENDPOINT}?size=200`, "GET");
  return toArray(payload).map(normalizeReturnRequest);
};

export const createReturnRequest = async (payload) => {
  const response = await apiRequest(RETURN_ENDPOINT, "POST", payload);
  return normalizeReturnRequest(unwrap(response) || {});
};

export const updateReturnStatus = async (id, { status, adminNotes, reviewedBy } = {}) => {
  const response = await apiRequest(`${RETURN_ENDPOINT}/${id}/status`, "PUT", {
    status: toBackendReturnStatus(status),
    adminNotes: adminNotes || "",
    reviewedBy: reviewedBy != null ? Number(reviewedBy) : null,
  });
  return normalizeReturnRequest(unwrap(response) || {});
};

export const restoreReturnRequest = async (id, { receivedAt, completedAt, description } = {}) => {
  const response = await apiRequest(`${RETURN_ENDPOINT}/${id}/restore`, "PUT", {
    restorationReceivedAt: receivedAt,
    restorationCompletedAt: completedAt,
    restorationDescription: description,
  });
  return normalizeReturnRequest(unwrap(response) || {});
};
