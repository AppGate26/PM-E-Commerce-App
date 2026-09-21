import { apiRequest } from "./config";
import { HEAD_OFFICE_ID, HEAD_OFFICE_BRANCH } from "./branchAccess";

// "Head Office" option. The backend now seeds a real Head Office branch
// (branchCode === "HEAD_OFFICE"); the UI keeps the "HEAD_OFFICE" sentinel as the
// option id but carries that branch's real numeric id as `backendId`.
export { HEAD_OFFICE_ID };

const unwrap = (payload) => {
  const data = payload?.response?.data ?? payload?.response ?? payload?.data ?? payload;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.branches)) return data.branches;
  return [];
};

// Map a backend Branch entity to the shape the existing UI helpers expect.
export const mapBackendBranch = (branch = {}) => ({
  id: branch.id,
  branchCode: branch.branchCode || "",
  branchName: branch.branchName || "",
  branchAddress: branch.address || branch.branchAddress || "",
  branchState: branch.state?.name || branch.branchState || "",
  branchCountry: branch.branchCountry || "",
  stateId: branch.state?.id ?? null,
  lgaId: branch.lga?.id ?? null,
  wardId: branch.ward?.id ?? null,
  phoneNumber: branch.phone || "",
  email: branch.email || "",
  managerId: branch.managerId || null,
  status: branch.status || "ACTIVE",
  isHeadOffice: !!branch.headOffice,
});

// Load the branch directory from the backend. A synthetic "HEAD_OFFICE" sentinel
// is prepended purely as a lookup convenience for the Assign User form (it always
// carries the current Head Office branch's real id as `backendId`, see
// resolveBackendBranchId) -- it is filtered back out wherever branches are listed
// for display. The real Head Office branch itself stays in the list under its own
// id and real name, like any other branch, so it's visible and can be flagged with
// an indicator rather than silently disappearing when Head Office moves to it.
export const fetchBranches = async () => {
  const payload = await apiRequest("/branches", "GET");
  const branches = unwrap(payload).map(mapBackendBranch);
  const backendHeadOffice = branches.find((branch) => branch.isHeadOffice);
  const sentinel = backendHeadOffice
    ? { ...HEAD_OFFICE_BRANCH, backendId: backendHeadOffice.id }
    : HEAD_OFFICE_BRANCH;
  return [sentinel, ...branches];
};

// Persist a user's branch assignment to the backend. Head Office is a no-op
// because it represents "no branch" and the backend has no such record.
export const assignUserToBranch = async (branchId, userId) => {
  if (!userId || !branchId || branchId === HEAD_OFFICE_ID) return false;
  await apiRequest(`/branches/${branchId}/assign-user/${userId}`, "POST");
  return true;
};

const single = (payload) => payload?.response ?? payload?.data ?? payload ?? {};

// Create a branch. branchCode is generated server-side (BR/YY/NNNN).
export const createBranch = async (payload) => {
  const response = await apiRequest("/branches", "POST", payload);
  return mapBackendBranch(single(response));
};

export const updateBranch = async (id, payload) => {
  const response = await apiRequest(`/branches/${id}`, "PUT", payload);
  return mapBackendBranch(single(response));
};

export const activateBranch = async (id) => {
  await apiRequest(`/branches/${id}/activate`, "PATCH");
  return true;
};

export const deactivateBranch = async (id) => {
  await apiRequest(`/branches/${id}/deactivate`, "PATCH");
  return true;
};

// Moves the Head Office flag to this branch (unflagging whichever branch held it
// before). SUPER_ADMIN only -- changes who gets unrestricted, all-branch access.
export const setHeadOfficeBranch = async (id) => {
  await apiRequest(`/branches/${id}/set-head-office`, "PATCH");
  return true;
};

// Assign a branch manager. Backend requires the user to have BRANCH_MANAGER role.
export const assignBranchManager = async (branchId, managerId) => {
  if (!branchId || branchId === HEAD_OFFICE_ID || !managerId) return false;
  await apiRequest(`/branches/${branchId}/assign-manager`, "POST", { managerId });
  return true;
};

export const fetchBranchStaff = async (branchId) => {
  if (!branchId || branchId === HEAD_OFFICE_ID) return [];
  const payload = await apiRequest(`/branches/${branchId}/staff`, "GET");
  return unwrap(payload);
};

// --- Branch operations (Branch module: stock / sales / account views + reports) ---

const buildRange = ({ from = "", to = "" } = {}) => {
  const params = new URLSearchParams();
  if (from) params.set("startDate", `${from}T00:00:00`);
  if (to) params.set("endDate", `${to}T23:59:59`);
  return params.toString();
};

// Journal report accepts plain dates (LocalDate), not date-times.
const buildDateRange = ({ from = "", to = "" } = {}) => {
  const params = new URLSearchParams();
  if (from) params.set("startDate", from);
  if (to) params.set("endDate", to);
  return params.toString();
};

// Stock allocated to a branch. StockController @ /api/admin/stocks/branch/{branchId}.
export const fetchBranchStock = async (branchId) => {
  if (!branchId) return [];
  const payload = await apiRequest(`/admin/stocks/branch/${branchId}`, "GET");
  return unwrap(payload);
};

// Sales processed at a branch, optionally within a date range.
export const fetchBranchSales = async (branchId, range = {}) => {
  if (!branchId) return [];
  const query = buildRange(range);
  const payload = await apiRequest(`/sales/branch/${branchId}${query ? `?${query}` : ""}`, "GET");
  return unwrap(payload);
};

// Branch account (journal) report: returns { journalEntries, totalDebit, totalCredit, ... }.
export const fetchBranchAccount = async (branchId, range = {}) => {
  if (!branchId) return { journalEntries: [], totalDebit: 0, totalCredit: 0 };
  const query = buildDateRange(range);
  const payload = await apiRequest(
    `/admin/reports/branch/${branchId}/journal${query ? `?${query}` : ""}`,
    "GET"
  );
  const data = payload?.response?.data ?? payload?.response ?? payload?.data ?? payload ?? {};
  return {
    journalEntries: Array.isArray(data.journalEntries) ? data.journalEntries : [],
    totalDebit: data.totalDebit ?? 0,
    totalCredit: data.totalCredit ?? 0,
  };
};

// Head-office consolidated per-branch summary (stock / sales / account by branch).
export const fetchBranchSummary = async () => {
  const payload = await apiRequest("/branches/summary", "GET");
  const data = payload?.response?.data ?? payload?.response ?? payload?.data ?? payload ?? {};
  return {
    branches: Array.isArray(data.branches) ? data.branches : [],
    totals: data.totals || {},
  };
};

// --- Location lookups (cascading State -> LGA -> Ward) ---
const mapLocation = (row = {}) => ({
  id: row.id,
  name: row.name || row.stateName || row.lgaName || row.wardName || "",
});

export const fetchStates = async () => {
  const payload = await apiRequest("/states", "GET");
  return unwrap(payload).map(mapLocation);
};

export const fetchLgas = async (stateId) => {
  if (!stateId) return [];
  const payload = await apiRequest(`/states/${stateId}/lgas`, "GET");
  return unwrap(payload).map(mapLocation);
};

export const fetchWards = async (lgaId) => {
  if (!lgaId) return [];
  const payload = await apiRequest(`/lgas/${lgaId}/wards`, "GET");
  return unwrap(payload).map(mapLocation);
};
