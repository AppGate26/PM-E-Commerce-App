import React, { useEffect, useMemo, useState } from "react";
import AdminNav from "../../Navigation/AdminNav";
import "../shared/SecurityStandard.css";
import {
  fetchActiveSecuritySessions,
  formatDateTime,
} from "../shared/securityUtils";
import { apiRequest } from "../../../../lib/config";

const logoutEndpointsFor = (sessionId, payload) => [
  { url: "/admin/security/sessions/force-logout", method: "POST", body: payload },
  { url: `/admin/security/sessions/${sessionId}/force-logout`, method: "POST", body: {} },
  { url: `/admin/security/sessions/${sessionId}`, method: "DELETE", body: {} },
  { url: "/admin/security/logout", method: "POST", body: { userId: sessionId } },
];

const UsersLogout = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [warningOpen, setWarningOpen] = useState(false);
  const [logoutDuration, setLogoutDuration] = useState("30");
  const [search, setSearch] = useState("");

  const loadSessions = async () => {
    setLoading(true);
    setError("");

    try {
      const rows = await fetchActiveSecuritySessions();
      setSessions(rows);
      setSelectedIds([]);
    } catch (loadError) {
      setSessions([]);
      setError(loadError?.message || "Failed to load active sessions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const filteredSessions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sessions;

    return sessions.filter((session) =>
      [session.username, session.email, session.ipAddress].join(" ").toLowerCase().includes(query)
    );
  }, [search, sessions]);

  const allVisibleSelected =
    filteredSessions.length > 0 && filteredSessions.every((session) => selectedIds.includes(session.id));

  const toggleSelection = (id) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !filteredSessions.some((session) => session.id === id))
      );
      return;
    }

    setSelectedIds((current) => [
      ...new Set([...current, ...filteredSessions.map((session) => session.id)]),
    ]);
  };

  const runLogout = async () => {
    if (!selectedIds.length) {
      setError("Please select at least one active session to log out.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    let successCount = 0;

    for (const sessionId of selectedIds) {
      const payload = {
        sessionId,
        durationMinutes: Number(logoutDuration) || undefined,
      };

      let done = false;

      for (const endpoint of logoutEndpointsFor(sessionId, payload)) {
        try {
          await apiRequest(endpoint.url, endpoint.method, endpoint.body);
          successCount += 1;
          done = true;
          break;
        } catch {
          // Try the next supported endpoint.
        }
      }

      if (!done) {
        setError("Some users could not be logged out with the currently available backend endpoints.");
      }
    }

    setWarningOpen(false);
    setSubmitting(false);
    setSuccess(`${successCount} session(s) logged out successfully.`);
    await loadSessions();
  };

  return (
    <div className="security-page">
      <AdminNav />
      <main className="security-page-main">
        <section className="security-hero">
          <div>
            <p className="security-hero-kicker">Security Setup</p>
            <h1>Users Log-Out</h1>
            <p>
              Review active sessions, select users to remove, and confirm the action
              with a warning before any logout request is sent.
            </p>
          </div>
          <div className="security-hero-stat">
            <span>Active Sessions</span>
            <strong>{loading ? "..." : sessions.length}</strong>
          </div>
        </section>

        {error ? (
          <div className="security-alert security-alert-error">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")}>
              Close
            </button>
          </div>
        ) : null}

        {success ? (
          <div className="security-alert security-alert-success">
            <span>{success}</span>
            <button type="button" onClick={() => setSuccess("")}>
              Close
            </button>
          </div>
        ) : null}

        <section className="security-layout security-grid-2">
          <div className="security-card">
            <div className="security-card-header">
              <div>
                <h2>Active Session List</h2>
                <p>Select one or more logged-in users from the current active session list.</p>
              </div>
              <span className="security-badge">{selectedIds.length} selected</span>
            </div>
            <div className="security-card-body">
              <div className="security-form-grid two" style={{ marginBottom: "18px" }}>
                <div className="security-field">
                  <label htmlFor="sessionSearch">Search Sessions</label>
                  <input
                    id="sessionSearch"
                    className="security-input"
                    type="text"
                    placeholder="Search by username, email, or IP"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
                <div className="security-field">
                  <label htmlFor="logoutDuration">Requested Lockout Period</label>
                  <select
                    id="logoutDuration"
                    className="security-select"
                    value={logoutDuration}
                    onChange={(event) => setLogoutDuration(event.target.value)}
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="240">4 hours</option>
                  </select>
                </div>
              </div>

              <div className="security-actions" style={{ marginBottom: "16px" }}>
                <button className="security-btn security-btn-secondary" type="button" onClick={loadSessions}>
                  Refresh Sessions
                </button>
                <button className="security-btn security-btn-primary" type="button" onClick={() => setWarningOpen(true)} disabled={!selectedIds.length || submitting}>
                  Log Out Selected Users
                </button>
              </div>

              <div className="security-note" style={{ marginBottom: "16px" }}>
                A warning step is now included before logout. The duration field is captured in the request when
                the backend supports it, but some current logout endpoints may still enforce immediate logout only.
              </div>

              <div className="security-table-wrap">
                <table className="security-table">
                  <thead>
                    <tr>
                      <th>
                        <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} />
                      </th>
                      <th>User</th>
                      <th>Email</th>
                      <th>Login Time</th>
                      <th>Last Activity</th>
                      <th>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="6">Loading active sessions...</td>
                      </tr>
                    ) : filteredSessions.length === 0 ? (
                      <tr>
                        <td colSpan="6">
                          <div className="security-empty">No active sessions found.</div>
                        </td>
                      </tr>
                    ) : (
                      filteredSessions.map((session) => (
                        <tr key={session.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(session.id)}
                              onChange={() => toggleSelection(session.id)}
                            />
                          </td>
                          <td>{session.username}</td>
                          <td>{session.email}</td>
                          <td>{formatDateTime(session.loginTime)}</td>
                          <td>{formatDateTime(session.lastActivity)}</td>
                          <td>{session.ipAddress}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="security-card">
            <div className="security-card-header">
              <div>
                <h3>Logout Summary</h3>
                <p>Review the selected users before confirming the action.</p>
              </div>
            </div>
            <div className="security-card-body">
              <div className="security-kv">
                <div className="security-kv-item">
                  <span>Selected Sessions</span>
                  <strong>{selectedIds.length}</strong>
                </div>
                <div className="security-kv-item">
                  <span>Requested Period</span>
                  <strong>{logoutDuration} minutes</strong>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {warningOpen ? (
        <div className="security-modal-backdrop">
          <div className="security-modal">
            <h3>Confirm User Logout</h3>
            <p>
              You are about to log out {selectedIds.length} selected user session(s).
              Continue only if you are sure this action is necessary.
            </p>
            <div className="security-actions">
              <button className="security-btn security-btn-secondary" type="button" onClick={() => setWarningOpen(false)} disabled={submitting}>
                Cancel
              </button>
              <button className="security-btn security-btn-danger" type="button" onClick={runLogout} disabled={submitting}>
                {submitting ? "Processing..." : "Confirm Logout"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default UsersLogout;
