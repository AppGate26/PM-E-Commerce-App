import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import AdminNav from "../../Navigation/AdminNav";
import { useAuth } from "../../../../context/AuthContext";
import { fetchSecurityUsers } from "../../SecuritySetup/shared/securityUtils";
import { careApi } from "../../../../lib/careApi";
import "../MailMessenger.css";
import "./ComposeMail.css";

const pickEmailList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.emails)) return payload.emails;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.response)) return payload.response;
  if (Array.isArray(payload?.response?.content)) return payload.response.content;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
};

const normalizeEmailItem = (email, index = 0) => ({
  id: email.ticketId || email.id || email.ticketid || `mail-${Date.now()}-${index}`,
  subject: email.subject || email.title || "No subject",
  from: email.from || email.sender || email.customerEmail || "Unknown sender",
  preview: email.message || email.body || email.content || "No preview available",
  date: email.date || email.createdAt || email.timestamp || "",
});

const formatDateTime = (value) => {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";
  return date.toLocaleString("en-NG", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getUserLabel = (user) => {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return fullName ? `${fullName} - ${user.email}` : user.email;
};

const ComposeMail = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [recentEmails, setRecentEmails] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    selectedUser: "",
    recipientEmail: "",
    subject: "",
    message: "",
  });

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const rows = await fetchSecurityUsers();
        setUsers(rows.filter((entry) => entry?.email));
      } catch {
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    const loadRecentEmails = async () => {
      try {
        const response = await careApi.getEmails(0, 5);
        const payload = response?.data || response?.response || response;
        const rows = pickEmailList(payload).map(normalizeEmailItem);
        setRecentEmails(rows.slice(0, 5));
      } catch {
        setRecentEmails([]);
      } finally {
        setLoadingRecent(false);
      }
    };

    loadUsers();
    loadRecentEmails();
  }, []);

  const selectedRecipient = useMemo(
    () => users.find((entry) => entry.email === form.selectedUser),
    [form.selectedUser, users]
  );

  useEffect(() => {
    if (!selectedRecipient?.email) {
      return;
    }

    setForm((current) => ({
      ...current,
      recipientEmail: selectedRecipient.email,
    }));
  }, [selectedRecipient]);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleClear = () => {
    setForm({
      selectedUser: "",
      recipientEmail: "",
      subject: "",
      message: "",
    });
  };

  const handleSend = async () => {
    const recipient = form.recipientEmail.trim();
    const subject = form.subject.trim();
    const message = form.message.trim();

    if (!recipient || !subject || !message) {
      toast.error("Please complete recipient, subject, and message.");
      return;
    }

    setSending(true);

    try {
      await careApi.composeEmail({
        to: recipient,
        recipientEmail: recipient,
        subject,
        message,
        from: user?.email || "",
      });

      toast.success(`Mail sent successfully to ${recipient}`);
      handleClear();

      try {
        const response = await careApi.getEmails(0, 5);
        const payload = response?.data || response?.response || response;
        const rows = pickEmailList(payload).map(normalizeEmailItem);
        setRecentEmails(rows.slice(0, 5));
      } catch {
        // Keep current recent panel if refresh fails.
      }
    } catch (error) {
      toast.error(error?.message || "Failed to send mail.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="admin-container">
      <AdminNav />
      <main className="compose-standard">
        <section className="compose-standard-hero">
          <div className="compose-standard-hero-copy">
            <p className="compose-standard-kicker">Mail And Messenger</p>
            <h1>Compose Mail</h1>
            <p>
              Draft and send a standard mail from a cleaner admin workspace. You can
              pick a registered user from the dropdown or type any recipient email
              directly before sending.
            </p>
          </div>
          <div className="compose-standard-hero-stat">
            <span>From</span>
            <strong>{user?.email || "Unknown"}</strong>
          </div>
        </section>

        <section className="compose-standard-grid">
          <div className="compose-standard-card">
            <div className="compose-standard-card-head">
              <div>
                <h2>New Message</h2>
                <p>Use the recipient directory or type a direct email address.</p>
              </div>
            </div>

            <div className="compose-standard-form">
              <div className="compose-standard-form-grid">
                <div className="compose-standard-field">
                  <label htmlFor="composeUser">Select User</label>
                  <select
                    id="composeUser"
                    className="compose-standard-select"
                    value={form.selectedUser}
                    onChange={(event) => updateField("selectedUser", event.target.value)}
                    disabled={loadingUsers}
                  >
                    <option value="">
                      {loadingUsers ? "Loading users..." : "Choose user"}
                    </option>
                    {users.map((entry) => (
                      <option key={entry.id || entry.email} value={entry.email}>
                        {getUserLabel(entry)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="compose-standard-field">
                  <label htmlFor="composeRecipient">Recipient Email</label>
                  <input
                    id="composeRecipient"
                    className="compose-standard-input"
                    type="email"
                    placeholder="recipient@example.com"
                    value={form.recipientEmail}
                    onChange={(event) => updateField("recipientEmail", event.target.value)}
                  />
                </div>

                <div className="compose-standard-field compose-standard-span-full">
                  <label htmlFor="composeSubject">Subject</label>
                  <input
                    id="composeSubject"
                    className="compose-standard-input"
                    type="text"
                    placeholder="Enter email subject"
                    value={form.subject}
                    onChange={(event) => updateField("subject", event.target.value)}
                  />
                </div>

                <div className="compose-standard-field compose-standard-span-full">
                  <label htmlFor="composeMessage">Message</label>
                  <textarea
                    id="composeMessage"
                    className="compose-standard-textarea"
                    placeholder="Write your message here"
                    value={form.message}
                    onChange={(event) => updateField("message", event.target.value)}
                  />
                </div>
              </div>

              <div className="compose-standard-actions">
                <button
                  type="button"
                  className="compose-standard-btn compose-standard-btn-secondary"
                  onClick={handleClear}
                  disabled={sending}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="compose-standard-btn compose-standard-btn-primary"
                  onClick={handleSend}
                  disabled={sending}
                >
                  {sending ? "Sending..." : "Send Mail"}
                </button>
              </div>
            </div>
          </div>

          <aside className="compose-standard-side">
            <div className="compose-standard-card">
              <div className="compose-standard-card-head">
                <div>
                  <h3>Mail Notes</h3>
                  <p>Quick details about the current draft.</p>
                </div>
              </div>
              <div className="compose-standard-note-list">
                <div className="compose-standard-note">
                  <span>Selected User</span>
                  <strong>
                    {selectedRecipient ? getUserLabel(selectedRecipient) : "No user selected"}
                  </strong>
                </div>
                <div className="compose-standard-note">
                  <span>Recipient</span>
                  <strong>{form.recipientEmail || "No recipient yet"}</strong>
                </div>
                <div className="compose-standard-note">
                  <span>Subject Length</span>
                  <strong>{form.subject.trim().length} characters</strong>
                </div>
              </div>
            </div>

            <div className="compose-standard-card">
              <div className="compose-standard-card-head">
                <div>
                  <h3>Recent Mail Activity</h3>
                  <p>Latest emails visible from the mail endpoint.</p>
                </div>
              </div>
              <div className="compose-standard-recent-list">
                {loadingRecent ? (
                  <div className="compose-standard-empty">Loading recent mail...</div>
                ) : recentEmails.length === 0 ? (
                  <div className="compose-standard-empty">
                    No recent mail was returned by the backend.
                  </div>
                ) : (
                  recentEmails.map((mail) => (
                    <article key={mail.id} className="compose-standard-recent-item">
                      <strong>{mail.subject}</strong>
                      <span>{mail.from}</span>
                      <p>{mail.preview}</p>
                      <time>{formatDateTime(mail.date)}</time>
                    </article>
                  ))
                )}
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
};

export default ComposeMail;
