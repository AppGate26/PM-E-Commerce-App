import React, { useEffect, useMemo, useState } from "react";
import AdminNav from "../../Navigation/AdminNav";
import "../shared/SecurityStandard.css";
import {
  fetchSecurityUsers,
  formatDate,
  formatTime,
  toArray,
} from "../shared/securityUtils";
import { apiRequest } from "../../../../lib/config";

const UsersLogTrial = () => {
  const [users, setUsers] = useState([]);
  const [trails, setTrails] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const loadUsers = async () => {
    try {
      const rows = await fetchSecurityUsers();
      setUsers(rows);
    } catch {
      setUsers([]);
    }
  };

  const loadTrails = async () => {
    setLoading(true);
    setError("");

    try {
      let endpoint = `/admin/security/log-trails?page=${currentPage}&size=10`;
      if (selectedUserId) {
        endpoint = `/admin/security/log-trails/user/${selectedUserId}?page=${currentPage}&size=10`;
      }

      const payload = await apiRequest(endpoint, "GET");
      const rows = toArray(payload);
      const pageData = payload?.response || payload || {};

      setTrails(
        rows.map((trail, index) => ({
          id: trail.id || index + 1,
          userId: trail.userId ?? trail.user?.id ?? null,
          email: trail.user?.email || trail.email || trail.userEmail || "",
          role: trail.user?.role || trail.role || "",
          // Backend UserLogTrail stores date + timeIn/timeOut, not loginTime.
          loginDate: formatDate(trail.date || trail.loginTime),
          loginTime: formatTime(trail.timeIn || trail.loginTime),
          logoutTime: formatTime(trail.timeOut || trail.logoutTime),
          ipAddress: trail.ipAddress || trail.ip || "N/A",
          device: trail.device || trail.userAgent || "N/A",
        }))
      );
      setTotalPages(pageData.totalPages || payload?.totalPages || (rows.length ? 1 : 0));
    } catch (loadError) {
      setTrails([]);
      setError(loadError?.message || "Failed to load log trails.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    loadTrails();
  }, [selectedUserId, currentPage]);

  const currentUser = useMemo(
    () => users.find((user) => String(user.id) === String(selectedUserId)),
    [users, selectedUserId]
  );

  // The backend trail rows only carry a userId; resolve the email/role from the
  // loaded users list for display.
  const usersById = useMemo(() => {
    const map = new Map();
    users.forEach((user) => map.set(String(user.id), user));
    return map;
  }, [users]);

  const trailEmail = (trail) =>
    trail.email || usersById.get(String(trail.userId))?.email || "N/A";
  const trailRole = (trail) =>
    trail.role || usersById.get(String(trail.userId))?.role || "N/A";

  return (
    <div className="security-page">
      <AdminNav />
      <main className="security-page-main">
        <section className="security-hero">
          <div>
            <p className="security-hero-kicker">Security Setup</p>
            <h1>Users Log Trail</h1>
            <p>
              Audit user login and logout events with a cleaner list, including the
              date, time, role, IP address, and device trace.
            </p>
          </div>
          <div className="security-hero-stat">
            <span>Trail Rows</span>
            <strong>{loading ? "..." : trails.length}</strong>
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

        <section className="security-layout security-grid-2">
          <div className="security-card">
            <div className="security-card-header">
              <div>
                <h2>Login And Logout Audit</h2>
                <p>Filter by user to inspect the exact time each account logged in and out.</p>
              </div>
              <span className="security-badge">
                Page {totalPages ? currentPage + 1 : 0} of {totalPages || 0}
              </span>
            </div>
            <div className="security-card-body">
              <div className="security-form-grid two" style={{ marginBottom: "18px" }}>
                <div className="security-field">
                  <label htmlFor="trailUser">User Filter</label>
                  <select
                    id="trailUser"
                    className="security-select"
                    value={selectedUserId}
                    onChange={(event) => {
                      setSelectedUserId(event.target.value);
                      setCurrentPage(0);
                    }}
                  >
                    <option value="">All users</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="security-field">
                  <label>Actions</label>
                  <div className="security-actions">
                    <button className="security-btn security-btn-secondary" type="button" onClick={loadTrails}>
                      Refresh Trail
                    </button>
                  </div>
                </div>
              </div>

              <div className="security-table-wrap">
                <table className="security-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Login Date</th>
                      <th>Login Time</th>
                      <th>Logout Time</th>
                      <th>IP Address</th>
                      <th>Device</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="7">Loading log trails...</td>
                      </tr>
                    ) : trails.length === 0 ? (
                      <tr>
                        <td colSpan="7">
                          <div className="security-empty">
                            {selectedUserId
                              ? "This user has no login/logout history yet."
                              : "No login/logout records exist in the system."}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      trails.map((trail) => (
                        <tr key={trail.id}>
                          <td>{trailEmail(trail)}</td>
                          <td>{trailRole(trail)}</td>
                          <td>{trail.loginDate}</td>
                          <td>{trail.loginTime}</td>
                          <td>{trail.logoutTime}</td>
                          <td>{trail.ipAddress}</td>
                          <td>{trail.device}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 ? (
                <div className="security-actions" style={{ marginTop: "18px" }}>
                  <button
                    className="security-btn security-btn-secondary"
                    type="button"
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
                  >
                    Previous
                  </button>
                  <button
                    className="security-btn security-btn-secondary"
                    type="button"
                    disabled={currentPage + 1 >= totalPages}
                    onClick={() => setCurrentPage((page) => page + 1)}
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="security-card">
            <div className="security-card-header">
              <div>
                <h3>Audit Summary</h3>
                <p>Quick context for the current filter.</p>
              </div>
            </div>
            <div className="security-card-body">
              <div className="security-kv">
                <div className="security-kv-item">
                  <span>Selected User</span>
                  <strong>{currentUser?.email || "All users"}</strong>
                </div>
                <div className="security-kv-item">
                  <span>Visible Rows</span>
                  <strong>{trails.length}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default UsersLogTrial;
