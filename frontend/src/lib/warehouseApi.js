import { apiRequest } from "./config";
import { extractApiArray } from "./inventoryApi";

// Backend: WarehouseController @ /api/admin/warehouses (config strips the duplicate /api prefix).
const WAREHOUSE_ENDPOINT = "/admin/warehouses";

const unwrap = (payload) =>
  payload && typeof payload === "object" && "response" in payload ? payload.response : payload;

// Map a persisted warehouse record to the shape the UI expects.
export const normalizeWarehouse = (warehouse = {}) => ({
  id: warehouse.id,
  warehouseName: warehouse.warehouseName || "",
  branchCode: warehouse.branchCode || "",
  locationAddress: warehouse.locationAddress || "",
  stateCity: warehouse.stateCity || "",
  branchManagerId: warehouse.branchManagerId ?? null,
  phoneNumber: warehouse.phoneNumber || "",
  email: warehouse.email || "",
  status:
    String(warehouse.status || "ACTIVE").toUpperCase() === "INACTIVE" ? "Inactive" : "Active",
  storageCapacity: warehouse.storageCapacity ?? "",
  branchId: warehouse.branchId ?? null,
});

export const fetchWarehouses = async () => {
  const response = await apiRequest(WAREHOUSE_ENDPOINT, "GET");
  return extractApiArray(response).map(normalizeWarehouse);
};

export const createWarehouse = async (payload) => {
  const response = await apiRequest(WAREHOUSE_ENDPOINT, "POST", payload);
  return normalizeWarehouse(unwrap(response) || {});
};

export const toggleWarehouseStatus = async (id) => {
  const response = await apiRequest(`${WAREHOUSE_ENDPOINT}/${id}/toggle-status`, "PATCH");
  return normalizeWarehouse(unwrap(response) || {});
};

export const attachWarehouseManager = async (id, managerId) => {
  const response = await apiRequest(`${WAREHOUSE_ENDPOINT}/${id}/attach-manager`, "PATCH", {
    managerId,
  });
  return normalizeWarehouse(unwrap(response) || {});
};

// --- Warehouse manager movement operations (WarehouseManagerController) ---
const MANAGER_ENDPOINT = "/users/warehouses";

const postMovement = async (path, payload) => {
  const response = await apiRequest(`${MANAGER_ENDPOINT}${path}`, "POST", payload);
  const data = unwrap(response);
  // Movement controllers return a BaseResponse (HTTP always 200); a failed business
  // rule is signalled by a non-2xx status field and/or a null data payload. Surface the
  // backend's own message instead of a generic "did not record the movement".
  const bodyStatus = typeof response?.status === "number" ? response.status : null;
  const failed =
    (bodyStatus !== null && bodyStatus >= 400) ||
    data == null ||
    (typeof data === "object" && Object.keys(data).length === 0);
  if (failed) {
    throw new Error(
      response?.message ||
        "The server did not record the movement. Check stock availability and inputs."
    );
  }
  return data;
};

export const submitProductReceipt = (payload) => postMovement("/product-receipt", payload);
export const submitStockAllocation = (payload) => postMovement("/stock-allocation", payload);
export const submitWarehouseTransfer = (payload) => postMovement("/transfer", payload);
export const submitProductSwap = (payload) => postMovement("/swap", payload);
export const submitQuarantineIn = (payload) => postMovement("/quarantine/in", payload);
export const submitQuarantineOut = (payload) => postMovement("/quarantine/out", payload);

export const fetchWarehouseMovements = async (warehouseId) => {
  const response = await apiRequest(`${MANAGER_ENDPOINT}/${warehouseId}/movements`, "GET");
  return extractApiArray(response);
};

export const fetchWarehouseReport = async (warehouseId, { from = "", to = "" } = {}) => {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const query = params.toString();
  const response = await apiRequest(
    `${MANAGER_ENDPOINT}/${warehouseId}/report${query ? `?${query}` : ""}`,
    "GET"
  );
  return extractApiArray(response);
};

// --- Admin approval operations (WarehouseController) ---
export const fetchPendingMovements = async () => {
  const response = await apiRequest(`${WAREHOUSE_ENDPOINT}/movements/pending`, "GET");
  return extractApiArray(response);
};

export const approveMovement = async (movementId, approvedBy) => {
  const response = await apiRequest(
    `${WAREHOUSE_ENDPOINT}/movements/${movementId}/approve?approvedBy=${encodeURIComponent(approvedBy)}`,
    "PATCH"
  );
  return unwrap(response) || {};
};

export const rejectMovement = async (movementId, approvedBy, reason) => {
  const response = await apiRequest(
    `${WAREHOUSE_ENDPOINT}/movements/${movementId}/reject?approvedBy=${encodeURIComponent(
      approvedBy
    )}&reason=${encodeURIComponent(reason || "Rejected")}`,
    "PATCH"
  );
  return unwrap(response) || {};
};

export const fetchWarehouseStockBalance = async () => {
  const response = await apiRequest(`${WAREHOUSE_ENDPOINT}/stock-balance`, "GET");
  return extractApiArray(response);
};

// Products currently held in a single warehouse: [{ warehouseId, productId, quantityOnHand }].
export const fetchWarehouseStock = async (warehouseId) => {
  const response = await apiRequest(`${WAREHOUSE_ENDPOINT}/${warehouseId}/stock-balance`, "GET");
  return extractApiArray(response);
};

// Movements filtered by MovementType (PRODUCT_RECEIPT, STOCK_ALLOCATION, TRANSFER, SWAP,
// QUARANTINE_IN, QUARANTINE_OUT). Backend filters by type across all warehouses.
export const fetchMovementsByType = async (type) => {
  const response = await apiRequest(
    `${MANAGER_ENDPOINT}/movements/by-type?type=${encodeURIComponent(type)}`,
    "GET"
  );
  return extractApiArray(response);
};
