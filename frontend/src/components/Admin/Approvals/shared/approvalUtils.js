const parseRequestData = (approval) => {
  const raw = approval?.requestData;

  if (!raw) return null;
  if (typeof raw === "object") return raw;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const normalizeApproval = (approval) => {
  if (!approval || typeof approval !== "object") return approval;

  const parsedRequestData = parseRequestData(approval);
  if (!parsedRequestData) return approval;

  return {
    ...approval,
    requestDataParsed: parsedRequestData,
    data: approval.data || parsedRequestData,
  };
};

export const normalizePendingResponse = (payload) => {
  let approvals = [];

  if (Array.isArray(payload)) approvals = payload;
  else if (Array.isArray(payload?.data)) approvals = payload.data;
  else if (Array.isArray(payload?.response)) approvals = payload.response;
  else if (Array.isArray(payload?.response?.data)) approvals = payload.response.data;
  else if (Array.isArray(payload?.response?.content)) approvals = payload.response.content;
  else if (Array.isArray(payload?.content)) approvals = payload.content;
  else if (Array.isArray(payload?.result)) approvals = payload.result;
  else if (Array.isArray(payload?.pendingApprovals)) approvals = payload.pendingApprovals;

  return approvals.map(normalizeApproval);
};

export const readPath = (source, path) => {
  if (!source || !path) return undefined;

  return path.split(".").reduce((value, key) => {
    if (value === null || value === undefined) return undefined;
    return value[key];
  }, source);
};

export const pickValue = (source, candidates = [], fallback = "") => {
  for (const candidate of candidates) {
    const value =
      typeof candidate === "function" ? candidate(source) : readPath(source, candidate);

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return fallback;
};

export const resolveApprovalData = (approval, keys = []) => {
  for (const key of keys) {
    const value = readPath(approval, key);
    if (value && typeof value === "object") {
      return value;
    }
  }

  const parsedRequestData = parseRequestData(approval);
  if (parsedRequestData) return parsedRequestData;

  return approval || {};
};

export const formatDateValue = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDateInputValue = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).split("T")[0];
  }

  return date.toISOString().slice(0, 10);
};

export const formatCurrencyValue = (value) => {
  if (value === undefined || value === null || value === "") return "Not available";

  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);

  return numeric.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const buildActionBody = (approvedBy, declineReason = "", extra = {}) => ({
  comments: "",
  declineReason,
  approvedBy,
  ...extra,
});

export const buildKeyValueSection = (title, fields) => ({
  title,
  fields: fields.filter((field) => field && field.value !== undefined),
});
