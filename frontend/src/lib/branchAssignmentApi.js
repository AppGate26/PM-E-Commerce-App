import { apiRequest } from "./config";

// Backend: BranchUserAssignmentController @ /api/admin/branch-assignments.
const BASE = "/admin/branch-assignments";

const unwrap = (payload) => {
  const data = payload?.response?.data ?? payload?.response ?? payload?.data ?? payload;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  return [];
};

const single = (payload) => payload?.response ?? payload?.data ?? payload ?? {};

export const fetchBranchAssignments = async () => {
  const payload = await apiRequest(BASE, "GET");
  return unwrap(payload);
};

// Upsert (one assignment per user, keyed by email on the backend).
export const upsertBranchAssignment = async (assignment) => {
  const payload = await apiRequest(BASE, "PUT", assignment);
  return single(payload);
};

export const deleteBranchAssignment = async (id) => {
  await apiRequest(`${BASE}/${id}`, "DELETE");
  return true;
};
