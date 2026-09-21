import { apiRequest } from "../../../../lib/config";
import { notifyRegisteredUsersChanged } from "../../../../lib/registeredUsers";

// Must match backend RoleEnum exactly — sending an unknown value (e.g. the old
// "WAREHOUSE") makes the backend reject create/merge-role requests.
export const DEFAULT_SECURITY_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "BRANCH_MANAGER",
  "WAREHOUSE_MANAGER",
  "USER",
  "RIDER",
  "RECOVERY_AGENT",
];

export const DEFAULT_SECURITY_QUESTIONS = [
  "What was the name of your first school?",
  "What is your mother's maiden name?",
  "What city were you born in?",
  "What was the name of your first pet?",
  "What is your favorite childhood nickname?",
];

export const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.response?.content)) return payload.response.content;
  if (Array.isArray(payload?.response?.data?.content)) return payload.response.data.content;
  if (Array.isArray(payload?.response?.users)) return payload.response.users;
  if (Array.isArray(payload?.response?.data?.users)) return payload.response.data.users;
  if (Array.isArray(payload?.response?.data)) return payload.response.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload?.data?.users)) return payload.data.users;
  if (Array.isArray(payload?.response)) return payload.response;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;
  if (Array.isArray(payload?.roles)) return payload.roles;
  if (Array.isArray(payload?.response?.roles)) return payload.response.roles;
  if (Array.isArray(payload?.response?.data?.roles)) return payload.response.data.roles;
  if (Array.isArray(payload?.data?.roles)) return payload.data.roles;
  if (Array.isArray(payload?.questions)) return payload.questions;
  if (Array.isArray(payload?.securityQuestions)) return payload.securityQuestions;
  if (Array.isArray(payload?.response?.questions)) return payload.response.questions;
  if (Array.isArray(payload?.response?.securityQuestions)) return payload.response.securityQuestions;
  if (Array.isArray(payload?.response?.data?.questions)) return payload.response.data.questions;
  if (Array.isArray(payload?.response?.data?.securityQuestions)) return payload.response.data.securityQuestions;
  if (Array.isArray(payload?.data?.questions)) return payload.data.questions;
  if (Array.isArray(payload?.data?.securityQuestions)) return payload.data.securityQuestions;
  if (Array.isArray(payload?.sessions)) return payload.sessions;
  return [];
};

const roleFromPayloadItem = (role) => {
  if (typeof role === "string") return role;
  return (
    role?.name ||
    role?.role ||
    role?.roleName ||
    role?.userRole ||
    role?.authority ||
    role?.code ||
    role?.value ||
    ""
  );
};

const objectValues = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.values(value);
};

const collectRoleCandidates = (value, seen = new Set()) => {
  if (!value || seen.has(value)) return [];

  if (typeof value !== "object") {
    return [value];
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectRoleCandidates(item, seen));
  }

  const directRole = roleFromPayloadItem(value);
  const nestedValues = objectValues(value).flatMap((item) =>
    collectRoleCandidates(item, seen)
  );

  return directRole ? [directRole, ...nestedValues] : nestedValues;
};

const normalizeRoleList = (roles = []) =>
  [...new Set(
    roles
      .map(roleFromPayloadItem)
      .map((role) => String(role || "").trim().toUpperCase().replace(/[\s-]+/g, "_"))
      .filter(Boolean)
  )];

const questionFromPayloadItem = (question) => {
  if (typeof question === "string") return question;
  return (
    question?.question ||
    question?.securityQuestion ||
    question?.securityQuestionText ||
    question?.questionText ||
    question?.name ||
    question?.label ||
    question?.value ||
    question?.text ||
    ""
  );
};

const collectQuestionCandidates = (value, seen = new Set()) => {
  if (!value || seen.has(value)) return [];

  if (typeof value !== "object") {
    return [value];
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectQuestionCandidates(item, seen));
  }

  const directQuestion = questionFromPayloadItem(value);
  const nestedValues = objectValues(value).flatMap((item) =>
    collectQuestionCandidates(item, seen)
  );

  return directQuestion ? [directQuestion, ...nestedValues] : nestedValues;
};

const normalizeQuestionList = (questions = []) =>
  [...new Set(
    questions
      .map(questionFromPayloadItem)
      .map((question) => String(question || "").trim())
      .filter(Boolean)
  )];

const getPayloadObject = (payload) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return {};
  return payload.response?.data || payload.response || payload.data || payload;
};

const getPageInfo = (payload) => {
  const page = getPayloadObject(payload);

  return {
    number: Number(page.number ?? page.page ?? page.currentPage ?? 0),
    totalPages: Number(page.totalPages ?? page.pageCount ?? 0),
    totalElements: Number(page.totalElements ?? page.total ?? page.totalItems ?? 0),
    last: Boolean(page.last ?? page.isLast ?? false),
  };
};

const mapSecurityUser = (user, index) => ({
    id: user.id || user.userId || index + 1,
    email: user.email || user.username || "N/A",
    department: user.department || user.userDepartment || "N/A",
    role: user.role || user.userRole || "N/A",
    name: user.name || user.fullName || user.username || user.userName || "",
    username: user.name || user.fullName || user.username || user.userName || "",
    firstName: user.firstName || "",
    lastName: user.lastName || user.surname || "",
    userCode:
      user.userCode ||
      user.user_code ||
      user.code ||
      user.raw?.userCode ||
      user.raw?.user_code ||
      user.raw?.code ||
      "",
    isLocalOnly: Boolean(user.isLocalOnly),
    raw: user,
});

const uniqueUsersByEmail = (users = []) => {
  const seen = new Set();

  return users.filter((user) => {
    const key = String(user.email || user.id || "").trim().toLowerCase();
    if (!key || key === "n/a" || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// No-op shim: users now persist through the backend. Kept so callers (e.g. the
// create/modify user screen) keep working; it only notifies listeners to refresh.
export const cacheSecurityUser = (user = {}) => {
  if (!user?.email) return [];
  notifyRegisteredUsersChanged({ email: user.email, user });
  return [];
};

export const fetchSecurityUsers = async () => {
  const pageSize = 100;
  const users = [];
  const fallbackEndpoints = [
    "/admin/security/users",
    "/admin/security/users/all",
    "/admin/security/users?size=500",
    "/admin/security/users?limit=500",
    "/admin/security/users/status/ACTIVE",
    "/admin/users",
    "/admin/users?size=500",
    "/users",
    "/users?size=500",
  ];

  const fetchFromFallbackEndpoints = async () => {
    let lastError = null;

    for (const endpoint of fallbackEndpoints) {
      try {
        const payload = await apiRequest(endpoint, "GET");
        const rows = toArray(payload);

        if (rows.length > 0) {
          return rows.map((user, index) => mapSecurityUser(user, index + 1));
        }
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError) {
      throw lastError;
    }

    return [];
  };

  try {
    for (let page = 0; page < 20; page += 1) {
      const payload = await apiRequest(
        `/admin/security/users?page=${page}&size=${pageSize}`,
        "GET"
      );
      const rows = toArray(payload);
      users.push(...rows.map((user, index) => mapSecurityUser(user, users.length + index + 1)));

      const pageInfo = getPageInfo(payload);
      const hasKnownLastPage =
        pageInfo.last ||
        (pageInfo.totalPages > 0 && page + 1 >= pageInfo.totalPages) ||
        (pageInfo.totalElements > 0 && users.length >= pageInfo.totalElements);

      if (rows.length < pageSize || hasKnownLastPage) {
        break;
      }
    }

    if (users.length === 0) {
      const fallbackUsers = await fetchFromFallbackEndpoints();
      return uniqueUsersByEmail(fallbackUsers);
    }

    return uniqueUsersByEmail(users);
  } catch (error) {
    if (users.length > 0) {
      return uniqueUsersByEmail(users);
    }

    try {
      const fallbackUsers = await fetchFromFallbackEndpoints();
      return uniqueUsersByEmail(fallbackUsers);
    } catch {
      return [];
    }
  }
};

export const fetchSecurityRoles = async () => {
  const endpoints = [
    "/admin/security/roles",
    "/admin/security/users/role-info",
  ];
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const payload = await apiRequest(endpoint, "GET");
      const roles = normalizeRoleList(collectRoleCandidates(payload));

      if (roles.length > 0) {
        return normalizeRoleList([...roles, ...DEFAULT_SECURITY_ROLES]);
      }
    } catch (error) {
      lastError = error;
    }
  }

  try {
    const users = await fetchSecurityUsers();
    const rolesFromUsers = normalizeRoleList(users.map((user) => user.role));
    if (rolesFromUsers.length > 0) {
      return normalizeRoleList([...rolesFromUsers, ...DEFAULT_SECURITY_ROLES]);
    }
  } catch (error) {
    lastError = error;
  }

  return DEFAULT_SECURITY_ROLES;
};

export const fetchSecurityQuestions = async () => {
  try {
    const payload = await apiRequest("/admin/security/security-questions", "GET");
    const questions = normalizeQuestionList(collectQuestionCandidates(payload));

    return questions.length > 0 ? questions : DEFAULT_SECURITY_QUESTIONS;
  } catch (error) {
    return DEFAULT_SECURITY_QUESTIONS;
  }
};

export const fetchActiveSecuritySessions = async () => {
  const endpoints = [
    "/admin/security/sessions/active",
    "/admin/security/sessions",
    "/admin/sessions/active",
    "/admin/active-sessions",
    "/admin/security/users/status/ACTIVE",
  ];

  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const payload = await apiRequest(endpoint, "GET");
      const rows = toArray(payload);
      return rows.map((session, index) => ({
        id: session.id || session.sessionId || index + 1,
        username:
          session.username ||
          session.userName ||
          session.user?.username ||
          session.user?.name ||
          session.email?.split("@")[0] ||
          session.userId ||
          `User ${index + 1}`,
        email: session.email || session.user?.email || "N/A",
        loginTime:
          session.loginTime || session.createdAt || session.startTime || session.lastLogin || "",
        lastActivity: session.lastActivity || session.updatedAt || "",
        ipAddress: session.ipAddress || session.ip || "N/A",
        raw: session,
      }));
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Unable to load active sessions.");
};

export const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
