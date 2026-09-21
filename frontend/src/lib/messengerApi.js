import { apiRequest } from "./config";

// Backend: MessengerController @ /api/messenger (current user resolved from JWT).
const unwrap = (payload) => payload?.response ?? payload?.data ?? payload;

const toContentArray = (payload) => {
  const data = unwrap(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  return [];
};

const displayName = (entry = {}) =>
  [entry.firstName, entry.lastName].filter(Boolean).join(" ").trim() ||
  entry.name ||
  entry.email ||
  "Unknown User";

// Normalize one persisted message into the shape the UI renders.
// `me` is the current user ({ id, email }); we match on either so bubble
// alignment is correct even when the stored user object lacks an id.
export const normalizeMessage = (message = {}, me = {}) => {
  const senderId = message.sender?.id ?? message.senderId ?? null;
  const senderEmail = message.sender?.email ?? message.senderEmail ?? "";
  const byId = me?.id != null && String(senderId) === String(me.id);
  const byEmail =
    me?.email && senderEmail &&
    String(senderEmail).toLowerCase() === String(me.email).toLowerCase();
  return {
    id: message.id,
    senderId,
    mine: Boolean(byId || byEmail),
    text: message.message ?? message.text ?? "",
    createdAt: message.sentAt || message.createdAt || "",
  };
};

export const normalizeConversation = (conversation = {}) => {
  const other = conversation.otherUser || {};
  return {
    id: conversation.id,
    partnerId: other.id ?? null,
    partner: { ...other, displayName: displayName(other) },
    lastMessage: conversation.lastMessage || "",
    lastTime: conversation.lastMessageAt || "",
    unreadCount: Number(conversation.unreadCount) || 0,
  };
};

export const fetchMessengerConversations = async () => {
  const payload = await apiRequest("/messenger/conversations", "GET");
  return toContentArray(payload).map(normalizeConversation);
};

// Returns messages oldest-first (backend sends newest-first). `me` is { id, email }.
export const fetchMessagesWithUser = async (otherUserId, me = {}, { page = 0, size = 50 } = {}) => {
  if (!otherUserId) return [];
  const payload = await apiRequest(
    `/messenger/messages/user/${otherUserId}?page=${page}&size=${size}`,
    "GET"
  );
  return toContentArray(payload)
    .map((message) => normalizeMessage(message, me))
    .reverse();
};

export const sendMessengerMessage = async (recipientId, message) => {
  const payload = await apiRequest("/messenger/send", "POST", {
    recipientId: Number(recipientId),
    message: String(message || "").trim(),
  });
  return unwrap(payload);
};

export const fetchMessengerUnreadCount = async () => {
  const payload = await apiRequest("/messenger/unread-count", "GET");
  const data = unwrap(payload);
  return Number(data?.unreadCount) || 0;
};
