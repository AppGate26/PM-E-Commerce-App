import React, { useEffect, useMemo, useState } from "react";
import AdminNav from "../../Navigation/AdminNav";
import "../shared/SecurityStandard.css";
import { fetchSecurityUsers } from "../shared/securityUtils";

const roleClass = (role) => {
  const value = String(role || "").toLowerCase().replace(/\s+/g, "_");
  if (["super_admin", "admin", "user", "rider"].includes(value)) {
    return `security-pill role-${value}`;
  }
  return "security-pill role-default";
};

const ViewUser = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      setLoading(true);
      setError("");

      try {
        const rows = await fetchSecurityUsers();
        if (!cancelled) {
          setUsers(rows);
        }
      } catch (loadError) {
        if (!cancelled) {
          setUsers([]);
          setError(loadError?.message || "Failed to load users. Please refresh the page.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) =>
      [user.email, user.department, user.role, user.firstName, user.lastName]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [search, users]);

  return (
    <div className="security-page">
      <AdminNav />
      <main className="security-page-main">
        <section className="security-hero">
          <div>
            <p className="security-hero-kicker">Security Setup</p>
            <h1>View Users</h1>
            <p>
              Review all users in one standard table, including email, department,
              and assigned role.
            </p>
          </div>
          <div className="security-hero-stat">
            <span>Total Users</span>
            <strong>{loading ? "..." : users.length}</strong>
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

        <section className="security-card">
          <div className="security-card-header">
            <div>
              <h2>User Directory</h2>
              <p>Search the current user list by email, department, or role.</p>
            </div>
            <span className="security-badge">{filteredUsers.length} shown</span>
          </div>
          <div className="security-card-body">
            <div className="security-form-grid" style={{ marginBottom: "18px" }}>
              <div className="security-field">
                <label htmlFor="searchUsers">Search Users</label>
                <input
                  id="searchUsers"
                  className="security-input"
                  type="text"
                  placeholder="Search by email, name, department, or role"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>

            <div className="security-table-wrap">
              <table className="security-table">
                <thead>
                  <tr>
                    <th>S/N</th>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5">Loading users...</td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5">
                        <div className="security-empty">
                          No users matched the current search.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <tr key={user.id}>
                        <td>{index + 1}</td>
                        <td>{user.email}</td>
                        <td>{`${user.firstName} ${user.lastName}`.trim() || "N/A"}</td>
                        <td>{user.department}</td>
                        <td>
                          <span className={roleClass(user.role)}>{user.role}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ViewUser;
