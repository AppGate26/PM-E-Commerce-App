export const HEAD_OFFICE_ID = "HEAD_OFFICE";
// Stable code of the real Head Office branch seeded by the backend. The branch
// directory keeps the "HEAD_OFFICE" sentinel as the UI id, but carries the real
// numeric id (as `backendId`) so it can be sent to the backend when required.
export const HEAD_OFFICE_BRANCH_CODE = "HEAD_OFFICE";

// Branch data is fully backend-driven now: the directory and a user's branch
// membership come from the API (lib/branchApi.js, User.branch), and the per-user
// assignment metadata lives on the backend too (lib/branchAssignmentApi.js). This
// module only holds the Head Office sentinel + pure formatting helpers.
export const HEAD_OFFICE_BRANCH = {
  id: HEAD_OFFICE_ID,
  branchName: "Head Office",
  branchCode: "HO",
  branchAddress: "Head Office",
  branchState: "",
  branchCountry: "",
  phoneNumber: "",
  email: "",
  managerName: "Super Admin",
  status: "Active",
  isHeadOffice: true,
};

// Resolve the numeric branch id to send to the backend for a selected branch.
// Real branches already have a numeric `id`; the Head Office option keeps the
// "HEAD_OFFICE" sentinel as its id but exposes the seeded branch's numeric id as
// `backendId`. Returns null when no real backend id is available.
export const resolveBackendBranchId = (branch = {}) => {
  if (!branch) return null;
  if (branch.backendId != null) {
    const backendId = Number(branch.backendId);
    return Number.isFinite(backendId) ? backendId : null;
  }
  const numericId = Number(branch.id);
  return Number.isFinite(numericId) ? numericId : null;
};

export const getBranchLabel = (branch = {}) => {
  if (!branch?.id || branch.id === HEAD_OFFICE_ID || branch.isHeadOffice) {
    return "Head Office";
  }

  return [branch.branchCode, branch.branchName].filter(Boolean).join(" - ") || "Branch";
};

// Resolve a user's branch for display purely from their backend profile (User.branch).
export const getUserBranchDetails = (email = "", profile = {}) => {
  const branch =
    (typeof profile?.branch === "object" ? profile.branch : null) ||
    (typeof profile?.raw?.branch === "object" ? profile.raw.branch : null) ||
    {};

  return {
    ...branch,
    branchName:
      branch.branchName || profile?.branchName || profile?.raw?.branchName || "",
    branchAddress:
      branch.address ||
      branch.branchAddress ||
      profile?.branchAddress ||
      profile?.raw?.branchAddress ||
      "",
    branchState:
      branch.state?.name ||
      branch.branchState ||
      profile?.branchState ||
      profile?.raw?.branchState ||
      "",
    branchCountry:
      branch.branchCountry || profile?.branchCountry || profile?.raw?.branchCountry || "",
  };
};

// The backend serialises a user's branch inconsistently depending on which
// endpoint the profile came from: sometimes a nested `branch` object, sometimes a
// flat `branchId`, sometimes only under `raw`. Every consumer used to re-derive it
// with its own four-way fallback. This is the one place that guessing happens.
export const resolveUserBranch = (user) => {
  if (!user) return null;

  const branch =
    (typeof user.branch === "object" ? user.branch : null) ||
    (typeof user.raw?.branch === "object" ? user.raw.branch : null) ||
    null;

  const id =
    branch?.id ?? user.branchId ?? user.raw?.branchId ?? null;

  if (id == null) return null;

  return {
    id,
    branchCode: branch?.branchCode || "",
    branchName:
      branch?.branchName || user.branchName || user.raw?.branchName || "",
    branchAddress: branch?.address || branch?.branchAddress || "",
    branchState: branch?.state?.name || branch?.branchState || "",
    branchCountry: branch?.branchCountry || "",
    isHeadOffice: !!branch?.headOffice || branch?.branchCode === HEAD_OFFICE_BRANCH_CODE,
  };
};

export const formatBranchAddress = (branch = {}, fallback = "") =>
  [
    branch.branchAddress,
    branch.branchState,
    branch.branchCountry,
  ]
    .filter(Boolean)
    .join(", ") || fallback;
