import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../../../context/AuthContext";
import AdminNav from "../../Navigation/AdminNav";
import { fetchSecurityUsers } from "../../SecuritySetup/shared/securityUtils";
import {
  fetchMessagesWithUser,
  fetchMessengerConversations,
  sendMessengerMessage,
} from "../../../../lib/messengerApi";
import "../MailMessenger.css";
import "./Messenger.css";

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-NG", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getDisplayName = (entry = {}) =>
  [entry.firstName, entry.lastName].filter(Boolean).join(" ").trim() ||
  entry.displayName ||
  entry.name ||
  entry.email ||
  "Unknown User";

const Messenger = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const currentUserId = user?.id ?? user?.userId ?? null;
  const isAdminLayout = location.pathname.startsWith("/admin/");

  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activePartnerId, setActivePartnerId] = useState("");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      setConversations(await fetchMessengerConversations());
    } catch {
      setConversations([]);
    }
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setUsers(await fetchSecurityUsers());
      } catch {
        setUsers([]);
      }
    };
    loadUsers();
    loadConversations();
  }, [loadConversations]);

  const availableUsers = useMemo(
    () =>
      users
        .filter((entry) => entry?.id && String(entry.id) !== String(currentUserId))
        .map((entry) => ({ ...entry, displayName: getDisplayName(entry) }))
        .sort((left, right) => left.displayName.localeCompare(right.displayName)),
    [currentUserId, users]
  );

  useEffect(() => {
    if (activePartnerId) return;
    if (conversations.length > 0 && conversations[0].partnerId) {
      setActivePartnerId(String(conversations[0].partnerId));
    } else if (availableUsers.length > 0) {
      setActivePartnerId(String(availableUsers[0].id));
    }
  }, [activePartnerId, availableUsers, conversations]);

  const loadMessages = useCallback(async () => {
    if (!activePartnerId) {
      setMessages([]);
      return;
    }
    try {
      setMessages(
        await fetchMessagesWithUser(activePartnerId, { id: currentUserId, email: user?.email })
      );
    } catch {
      setMessages([]);
    }
  }, [activePartnerId, currentUserId, user?.email]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const activeUser = useMemo(
    () => availableUsers.find((entry) => String(entry.id) === String(activePartnerId)),
    [activePartnerId, availableUsers]
  );

  const handleSend = async () => {
    if (!draft.trim() || !activePartnerId || sending) return;

    setSending(true);
    try {
      await sendMessengerMessage(activePartnerId, draft);
      setDraft("");
      await loadMessages();
      await loadConversations();
      toast.success(`Message sent to ${getDisplayName(activeUser)}`);
    } catch (error) {
      toast.error(error?.message || "Unable to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="messenger-page">
      {isAdminLayout ? <AdminNav /> : null}

      <main className={`messenger-shell ${isAdminLayout ? "" : "standalone"}`}>
        <section className="messenger-topbar">
          <div className="messenger-topbar-copy">
            <h1>Team Messenger</h1>
            <p>Chat directly with another user inside the app.</p>
          </div>
          <div className="messenger-topbar-actions">
            <button
              type="button"
              className="messenger-link-btn secondary"
              onClick={() => navigate(-1)}
            >
              Back
            </button>
            {!isAdminLayout ? (
              <button type="button" className="messenger-link-btn primary" onClick={logout}>
                Log Out
              </button>
            ) : null}
          </div>
        </section>

        <section className="messenger-layout">
          <aside className="messenger-sidebar">
            <div className="messenger-sidebar-head">
              <h2>User Directory</h2>
              <p>
                Signed in as <strong>{user?.email || "Unknown"}</strong>
              </p>
            </div>

            <div className="messenger-picker">
              <label htmlFor="messengerUserSelect" className="messenger-picker-label">
                Select User Or Mail
              </label>
              <select
                id="messengerUserSelect"
                className="messenger-user-select"
                value={activePartnerId}
                onChange={(event) => setActivePartnerId(event.target.value)}
              >
                <option value="">Choose user</option>
                {availableUsers.map((entry) => (
                  <option key={entry.id} value={String(entry.id)}>
                    {getDisplayName(entry)} - {entry.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="messenger-section">
              <p className="messenger-section-title">Recent Conversations</p>
              <div className="messenger-conversation-list">
                {conversations.length === 0 ? (
                  <div className="messenger-empty">
                    No conversation yet. Pick a user below to start chatting.
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      type="button"
                      className={`messenger-contact-card ${
                        String(activePartnerId) === String(conversation.partnerId) ? "active" : ""
                      }`}
                      onClick={() => setActivePartnerId(String(conversation.partnerId))}
                    >
                      <div className="messenger-contact-top">
                        <div>
                          <span className="messenger-contact-name">
                            {getDisplayName(conversation.partner)}
                          </span>
                          <span className="messenger-contact-meta">
                            {conversation.partner?.email}
                          </span>
                        </div>
                        <span className="messenger-contact-meta">
                          {formatDateTime(conversation.lastTime)}
                        </span>
                      </div>
                      <div className="messenger-contact-preview">
                        {conversation.lastMessage || "No message yet"}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="messenger-section">
              <p className="messenger-section-title">All Users</p>
              <div className="messenger-user-list">
                {availableUsers.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className={`messenger-contact-card ${
                      String(activePartnerId) === String(entry.id) ? "active" : ""
                    }`}
                    onClick={() => setActivePartnerId(String(entry.id))}
                  >
                    <div className="messenger-contact-top">
                      <div>
                        <span className="messenger-contact-name">{getDisplayName(entry)}</span>
                        <span className="messenger-contact-meta">{entry.email}</span>
                      </div>
                    </div>
                    <div className="messenger-contact-preview">
                      {entry.role ? `Role: ${entry.role}` : "Available for direct chat"}
                    </div>
                  </button>
                ))}
                {availableUsers.length === 0 ? (
                  <div className="messenger-empty">
                    No other users are available yet. Users appear here after they are
                    created or sign in once.
                  </div>
                ) : null}
              </div>
            </div>
          </aside>

          <section className="messenger-main">
            <header className="messenger-main-header">
              <div>
                <h2>{activeUser ? getDisplayName(activeUser) : "Select a user"}</h2>
                <p>
                  {activeUser
                    ? `${activeUser.email}${activeUser.role ? ` • ${activeUser.role}` : ""}`
                    : "Choose a user from the dropdown or recent list to begin a direct conversation."}
                </p>
              </div>
              {activeUser ? (
                <div className="messenger-user-badge">Direct Message</div>
              ) : null}
            </header>

            <div className="messenger-thread">
              {!activeUser ? (
                <div className="messenger-empty">
                  Select a user and your shared conversation thread will open here.
                </div>
              ) : messages.length === 0 ? (
                <div className="messenger-empty">
                  No messages yet. Send the first message to start the conversation.
                </div>
              ) : (
                messages.map((item) => (
                  <article
                    key={item.id}
                    className={`messenger-bubble ${item.mine ? "mine" : "other"}`}
                  >
                    <p>{item.text}</p>
                    <time>{formatDateTime(item.createdAt)}</time>
                  </article>
                ))
              )}
            </div>

            <div className="messenger-composer">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={
                  activeUser
                    ? `Write a message to ${getDisplayName(activeUser)}`
                    : "Select a user before sending a message"
                }
                disabled={!activeUser}
              />
              <div className="messenger-composer-footer">
                <span>
                  {activeUser
                    ? "Messages are saved to your account so both users can continue later."
                    : "Pick a recipient to enable messaging."}
                </span>
                <button
                  type="button"
                  className="messenger-send-btn"
                  onClick={handleSend}
                  disabled={!activeUser || !draft.trim() || sending}
                >
                  {sending ? "Sending..." : "Send Message"}
                </button>
              </div>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
};

export default Messenger;
