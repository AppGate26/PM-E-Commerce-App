import { apiRequest, apiRequestMultipart } from "./config";

const tryRequest = async (paths, method = "GET", body = null) => {
  let lastError = null;

  for (const path of paths) {
    try {
      return await apiRequest(path, method, body);
    } catch (err) {
      lastError = err;
      const status = Number(err?.status || 0);
      const message = String(err?.message || "").toLowerCase();
      const isNotFound =
        status === 404 ||
        message.includes("not found") ||
        message.includes("404") ||
        message.includes("no static resource") ||
        message.includes("no resource") ||
        message.includes("no handler found");
      const isServerError = status >= 500;
      const isForbidden = status === 403;
      const shouldTryNextPath = isNotFound || isServerError || isForbidden;
      if (!shouldTryNextPath) break;
    }
  }

  throw lastError || new Error("Care API request failed");
};

const tryRequestMultipart = async (paths, method = "POST", formData) => {
  let lastError = null;

  for (const path of paths) {
    try {
      return await apiRequestMultipart(path, method, formData);
    } catch (err) {
      lastError = err;
      const status = Number(err?.status || 0);
      const message = String(err?.message || "").toLowerCase();
      const isNotFound =
        status === 404 ||
        message.includes("not found") ||
        message.includes("404") ||
        message.includes("no static resource") ||
        message.includes("no resource") ||
        message.includes("no handler found");
      const isServerError = status >= 500;
      const isForbidden = status === 403;
      const shouldTryNextPath = isNotFound || isServerError || isForbidden;
      if (!shouldTryNextPath) break;
    }
  }

  throw lastError || new Error("Care multipart API request failed");
};

const carePath = (legacyPath) => `/care-controller${legacyPath}`;

export const careApi = {
  // Calls
  getIncomingCalls: () =>
    tryRequest([carePath("/calls/incoming"), "/support/calls/incoming"]),
  acceptCall: (callId) =>
    tryRequest(
      [carePath(`/calls/${callId}/accept`), `/support/calls/${callId}/accept`],
      "POST"
    ),
  declineCall: (callId) =>
    tryRequest(
      [carePath(`/calls/${callId}/decline`), `/support/calls/${callId}/decline`],
      "POST"
    ),
  endCall: (callId, payload) =>
    tryRequest(
      [carePath(`/calls/${callId}/end`), `/support/calls/${callId}/end`],
      "POST",
      payload
    ),
  getQueueCalls: () =>
    tryRequest([carePath("/calls/queue"), "/support/calls/queue"]),
  getIgnoredCalls: () =>
    tryRequest([carePath("/calls/ignored"), "/support/calls/ignored"]),
  restoreIgnoredCall: (callId) =>
    tryRequest(
      [carePath(`/calls/${callId}/restore`), `/support/calls/${callId}/restore`],
      "POST"
    ),
  deleteCall: (callId) =>
    tryRequest([carePath(`/calls/${callId}`), `/support/calls/${callId}`], "DELETE"),
  clearIgnoredCalls: () =>
    tryRequest([carePath("/calls/ignored/clear"), "/support/calls/ignored/clear"], "DELETE"),

  // Call logs and reports
  getCallLog: (filter = "ALL") => {
    const route =
      filter === "RECEIVED"
        ? "/call-log/received"
        : filter === "REJECTED"
        ? "/call-log/rejected"
        : filter === "MISSED"
        ? "/call-log/missed"
        : "/call-log";
    return tryRequest([carePath(route), `/support${route}`]);
  },
  getReceivedCallsReport: () =>
    tryRequest([carePath("/reports/received-calls"), "/support/reports/received-calls"]),
  getUnansweredCallsReport: () =>
    tryRequest([carePath("/reports/unanswered-calls"), "/support/reports/unanswered-calls"]),

  // Chat
  getChats: () =>
    tryRequest([
      "/support/chats",
      "/support/chat",
      carePath("/chats"),
      carePath("/chat"),
    ]),
  // Create a new chat conversation and get back its id so messages can be sent.
  createChat: (payload) =>
    tryRequest(
      ["/support/chats", carePath("/chats")],
      "POST",
      payload
    ),
  getChatsCount: () =>
    tryRequest([
      "/support/chats/count",
      "/support/chat/count",
      carePath("/chats/count"),
      carePath("/chat/count"),
    ]),
  getChatMessages: (chatId) =>
    tryRequest([
      `/support/chats/${chatId}/messages`,
      `/support/chat/${chatId}/messages`,
      carePath(`/chats/${chatId}/messages`),
      carePath(`/chat/${chatId}/messages`),
    ]),
  sendChatMessage: (chatId, payload) =>
    tryRequest(
      [
        `/support/chats/${chatId}/messages`,
        `/support/chat/${chatId}/messages`,
        carePath(`/chats/${chatId}/messages`),
        carePath(`/chat/${chatId}/messages`),
      ],
      "POST",
      payload
    ),

  // Email
  getEmails: (page = 0, size = 20) =>
    tryRequest([
      `/support/emails?page=${page}&size=${size}`,
      carePath(`/emails?page=${page}&size=${size}`),
    ]),
  getEmailDetails: (ticketId) =>
    tryRequest([`/support/emails/${ticketId}`, carePath(`/emails/${ticketId}`)]),
  replyToEmail: (ticketId, payload) =>
    tryRequest(
      [`/support/emails/${ticketId}/reply`, carePath(`/emails/${ticketId}/reply`)],
      "POST",
      payload
    ),
  replyToEmailMultipart: (ticketId, formData) =>
    tryRequestMultipart(
      [`/support/emails/${ticketId}/reply`, carePath(`/emails/${ticketId}/reply`)],
      "POST",
      formData
    ),
  composeEmail: (payload) =>
    tryRequest(
      [
        "/support/emails/compose",
        "/support/emails/send",
        "/support/email/send",
        carePath("/emails/compose"),
      ],
      "POST",
      payload
    ),
  composeEmailMultipart: (formData) =>
    tryRequestMultipart(
      [
        "/support/emails/compose",
        "/support/emails/send",
        "/support/email/send",
        carePath("/emails/compose"),
      ],
      "POST",
      formData
    ),
  markEmailRead: (ticketId, read = true) =>
    tryRequest(
      [
        `/support/emails/${ticketId}/read`,
        `/support/emails/${ticketId}/status`,
        carePath(`/emails/${ticketId}/read`),
        carePath(`/emails/${ticketId}/status`),
      ],
      "PUT",
      { read }
    ),
  toggleEmailStar: (ticketId, starred = true) =>
    tryRequest(
      [
        `/support/emails/${ticketId}/star`,
        `/support/emails/${ticketId}/important`,
        carePath(`/emails/${ticketId}/star`),
        carePath(`/emails/${ticketId}/important`),
      ],
      "PUT",
      { starred }
    ),
  archiveEmail: (ticketId) =>
    tryRequest(
      [
        `/support/emails/${ticketId}/archive`,
        carePath(`/emails/${ticketId}/archive`),
      ],
      "POST"
    ),
  deleteEmail: (ticketId) =>
    tryRequest([`/support/emails/${ticketId}`, carePath(`/emails/${ticketId}`)], "DELETE"),

  // Social media
  getSocialMedia: () => tryRequest([carePath("/social-media"), "/support/social-media"]),
  createSocialMedia: (payload) =>
    tryRequest(["/support/social-media", carePath("/social-media")], "POST", payload),
  updateSocialMedia: (id, payload) =>
    tryRequest([`/support/social-media/${id}`, carePath(`/social-media/${id}`)], "PUT", payload),
  deleteSocialMedia: (id) =>
    tryRequest([`/support/social-media/${id}`, carePath(`/social-media/${id}`)], "DELETE"),

  // Escalations
  createEscalation: (payload) =>
    tryRequest(["/support/escalations", carePath("/escalations")], "POST", payload),
  getEscalations: ({ department = "", status = "" } = {}) => {
    const params = new URLSearchParams();
    if (department) params.set("department", department);
    if (status) params.set("status", status);
    const query = params.toString() ? `?${params.toString()}` : "";
    return tryRequest([`/support/escalations${query}`, carePath(`/escalations${query}`)]);
  },
  resolveEscalation: (id) =>
    tryRequest([`/support/escalations/${id}/resolve`, carePath(`/escalations/${id}/resolve`)], "PATCH"),
};
