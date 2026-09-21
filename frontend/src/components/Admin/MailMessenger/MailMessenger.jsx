import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminNav from "../Navigation/AdminNav";
import "../Admin.css";
import "./MailMessenger.css";
import { useAuth } from "../../../context/AuthContext";
import { fetchSecurityUsers } from "../SecuritySetup/shared/securityUtils";
import { fetchMessengerConversations } from "../../../lib/messengerApi";

const MailMessenger = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    fetchSecurityUsers()
      .then(setUsers)
      .catch(() => setUsers([]));
    fetchMessengerConversations()
      .then(setConversations)
      .catch(() => setConversations([]));
  }, [user]);

  const otherUsers = useMemo(
    () =>
      users.filter(
        (entry) =>
          entry?.email &&
          entry.email.toLowerCase() !== String(user?.email || "").toLowerCase()
      ),
    [user, users]
  );

  return (
    <div className="admin-container">
      <AdminNav />
      <main className="mail-hub">
        <section className="mail-hub-hero">
          <div className="mail-hub-hero-card">
            <p className="mail-hub-kicker">Mail And Messenger</p>
            <h1>One communication hub for email and internal chat</h1>
            <p>
              The mail area is now organized as a cleaner admin workspace, and the
              messenger supports direct user-to-user conversations inside the app.
              Any signed-in user can open messenger and chat with another registered
              user from the shared directory.
            </p>
            <div className="mail-hub-actions">
              <Link to="/messenger" className="mail-hub-btn mail-hub-btn-primary">
                Open Team Messenger
              </Link>
              <Link
                to="/admin/mail-messenger/compose-mail"
                className="mail-hub-btn mail-hub-btn-secondary"
              >
                Compose Mail
              </Link>
            </div>
          </div>

          <aside className="mail-hub-summary">
            <div className="mail-hub-summary-grid">
              <div className="mail-hub-summary-item">
                <span>Signed In User</span>
                <strong>{user?.email || "Unknown"}</strong>
              </div>
              <div className="mail-hub-summary-item">
                <span>Users Available For Chat</span>
                <strong>{otherUsers.length}</strong>
              </div>
              <div className="mail-hub-summary-item">
                <span>Active Conversation Threads</span>
                <strong>{conversations.length}</strong>
              </div>
            </div>
          </aside>
        </section>

        <section className="mail-hub-grid">
          <div className="mail-hub-panel">
            <h2>Communication Tools</h2>
            <p className="mail-hub-panel-copy">
              Use the cards below to move between internal chat and admin mail
              workflows without the old placeholder screens.
            </p>

            <div className="mail-hub-card-list">
              <Link to="/messenger" className="mail-hub-card">
                <div className="mail-hub-icon">IM</div>
                <div className="mail-hub-card-copy">
                  <strong>Team Messenger</strong>
                  <span>
                    Open person-to-person chat. Conversations are grouped by user pair
                    so staff can continue where they stopped.
                  </span>
                </div>
                <span className="mail-hub-arrow">›</span>
              </Link>

              <Link to="/admin/mail-messenger/compose-mail" className="mail-hub-card">
                <div className="mail-hub-icon">ML</div>
                <div className="mail-hub-card-copy">
                  <strong>Compose Mail</strong>
                  <span>
                    Draft internal notices and external mails from the same cleaner
                    mail area.
                  </span>
                </div>
                <span className="mail-hub-arrow">›</span>
              </Link>

              <Link to="/admin/mail-messenger/sent-mail" className="mail-hub-card">
                <div className="mail-hub-icon">SN</div>
                <div className="mail-hub-card-copy">
                  <strong>Sent Mail</strong>
                  <span>Review sent communication history and inspect each outgoing message.</span>
                </div>
                <span className="mail-hub-arrow">›</span>
              </Link>

              <Link
                to="/admin/mail-messenger/view-inbox-message"
                className="mail-hub-card"
              >
                <div className="mail-hub-icon">IN</div>
                <div className="mail-hub-card-copy">
                  <strong>Inbox Review</strong>
                  <span>Monitor incoming messages and keep admin communication organized.</span>
                </div>
                <span className="mail-hub-arrow">›</span>
              </Link>
            </div>
          </div>

          <div className="mail-hub-side">
            <div className="mail-hub-panel">
              <h2>Recently Reachable Users</h2>
              <div className="mail-hub-list">
                {otherUsers.slice(0, 6).map((entry) => (
                  <div key={entry.email} className="mail-hub-list-item">
                    <strong>
                      {[entry.firstName, entry.lastName].filter(Boolean).join(" ") ||
                        entry.displayName ||
                        entry.email}
                    </strong>
                    <span>{entry.email}</span>
                  </div>
                ))}
                {otherUsers.length === 0 ? (
                  <div className="mail-hub-list-item">
                    <strong>No users available yet</strong>
                    <span>Create users or have them sign in once so they appear here.</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mail-hub-panel">
              <h2>How Messenger Works</h2>
              <div className="mail-hub-list">
                <div className="mail-hub-list-item">
                  <strong>Every signed-in user can chat</strong>
                  <span>The messenger route is available beyond admin only pages.</span>
                </div>
                <div className="mail-hub-list-item">
                  <strong>Chats are saved by user pair</strong>
                  <span>The same two users always return to the same thread.</span>
                </div>
                <div className="mail-hub-list-item">
                  <strong>User directory updates automatically</strong>
                  <span>Logins and user creation feed the messenger contact list.</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MailMessenger;
