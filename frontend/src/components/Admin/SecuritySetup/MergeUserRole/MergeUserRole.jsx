import React, { useEffect, useMemo, useState } from "react";
import AdminNav from "../../Navigation/AdminNav";
import "../shared/SecurityStandard.css";
import {
  DEFAULT_SECURITY_ROLES,
  fetchSecurityRoles,
  fetchSecurityUsers,
} from "../shared/securityUtils";
import { apiRequest } from "../../../../lib/config";
import {
  assignUserModules,
  fetchUserModules,
  getModuleLabel,
  MODULE_OPTIONS,
  normalizeModules,
} from "../../../../lib/moduleAccess";
import {
  getBranchLabel,
  HEAD_OFFICE_BRANCH,
  HEAD_OFFICE_ID,
  resolveBackendBranchId,
} from "../../../../lib/branchAccess";
import { assignUserToBranch, fetchBranches } from "../../../../lib/branchApi";

const MergeUserRole = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState(DEFAULT_SECURITY_ROLES);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedModules, setSelectedModules] = useState([]);
  const [branches, setBranches] = useState([HEAD_OFFICE_BRANCH]);
  const [branchId, setBranchId] = useState(HEAD_OFFICE_ID);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadOptions = async () => {
      setLoadingUsers(true);
      setError("");
      const [userRows, roleResult, branchResult] = await Promise.all([
        fetchSecurityUsers()
          .then((users) => ({ users, error: null }))
          .catch((error) => ({ users: [], error })),
        fetchSecurityRoles()
          .then((roles) => ({ roles, error: null }))
          .catch((error) => ({ roles: [], error })),
        fetchBranches()
          .then((branches) => ({ branches, error: null }))
          .catch((error) => ({ branches: [HEAD_OFFICE_BRANCH], error })),
      ]);

      setUsers(userRows.users.filter((user) => user?.email && user.email !== "N/A"));
      setRoles(roleResult.roles.filter(Boolean));
      setBranches(branchResult.branches);

      const loadErrors = [
        userRows.error ? userRows.error?.message || "Unable to load users from backend." : "",
        roleResult.error ? roleResult.error?.message || "Unable to load roles from backend." : "",
        branchResult.error ? branchResult.error?.message || "Unable to load branches from backend." : "",
      ].filter(Boolean);

      if (loadErrors.length > 0) {
        setError(loadErrors.join(" "));
      }
      setLoadingUsers(false);
    };

    loadOptions();
  }, []);

  const selectedUser = useMemo(
    () => users.find((user) => user.email === selectedEmail),
    [users, selectedEmail]
  );

  const selectedBranch = useMemo(
    () =>
      branches.find((branch) => String(branch.id) === String(branchId)) ||
      branches.find((branch) => branch.id === HEAD_OFFICE_ID),
    [branches, branchId]
  );

  useEffect(() => {
    if (!selectedUser?.email) {
      setSelectedModules([]);
      return;
    }

    setSelectedRole(selectedUser.role || "");
    // Seed from the cached profile, then refresh from the backend (source of truth).
    setSelectedModules(normalizeModules(selectedUser.raw?.permissions || []));

    let cancelled = false;
    fetchUserModules(selectedUser.email)
      .then((modules) => {
        if (!cancelled) setSelectedModules(modules);
      })
      .catch(() => {
        // Keep the modules seeded from the cached profile.
      });

    // Branch comes from the backend user record (User.branch).
    setBranchId(
      selectedUser.raw?.branch?.id ||
        selectedUser.raw?.branchId ||
        selectedUser.branchId ||
        HEAD_OFFICE_ID
    );

    return () => {
      cancelled = true;
    };
  }, [selectedUser]);

  const toggleModule = (moduleKey) => {
    setSelectedModules((current) =>
      current.includes(moduleKey)
        ? current.filter((item) => item !== moduleKey)
        : [...current, moduleKey]
    );
  };

  const normalizeRole = (role = "") =>
    String(role || "").trim().toUpperCase().replace(/[\s-]+/g, "_");

  const hasBackendUserId = (user) =>
    Boolean(user?.raw?.id || user?.raw?.userId) && !user?.isLocalOnly;

  const handleAssignRole = async () => {
    if (!selectedUser) {
      setError("Please select a user first.");
      return;
    }

    if (!selectedRole && selectedModules.length === 0) {
      setError("Please select a role or at least one module to assign.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const nextRole = normalizeRole(selectedRole);
    const currentRole =
      normalizeRole(selectedUser.role) && normalizeRole(selectedUser.role) !== "N/A"
        ? normalizeRole(selectedUser.role)
        : undefined;
    const backendUserId = hasBackendUserId(selectedUser) ? selectedUser.id : null;

    const endpoints = [
      {
        url: "/admin/security/users/role",
        method: "PUT",
        body: {
          email: selectedUser.email,
          currentRole,
          attachRoles: [nextRole],
        },
      },
      {
        url: "/admin/security/users/role",
        method: "PUT",
        body: {
          email: selectedUser.email,
          currentRole,
          attachRoles: [nextRole],
          detachRole:
            currentRole && currentRole !== nextRole ? currentRole : undefined,
        },
      },
      backendUserId
        ? { url: `/admin/security/users/${backendUserId}/role`, method: "PUT", body: { role: nextRole } }
        : null,
      {
        url: "/admin/security/users/role",
        method: "POST",
        body: {
          email: selectedUser.email,
          currentRole,
          attachRoles: [nextRole],
        },
      },
      backendUserId
        ? { url: `/admin/security/users/${backendUserId}`, method: "PUT", body: { role: nextRole } }
        : null,
    ].filter(Boolean);

    try {
      let roleWarning = "";

      if (selectedRole && nextRole !== currentRole) {
        let assigned = false;
        let lastRoleError = null;

        for (const endpoint of endpoints) {
          try {
            const body = Object.fromEntries(
              Object.entries(endpoint.body).filter(([, value]) => value !== undefined)
            );
            await apiRequest(endpoint.url, endpoint.method, body);
            assigned = true;
            break;
          } catch (roleError) {
            lastRoleError = roleError;
            // Try the next endpoint.
          }
        }

        if (!assigned) {
          roleWarning = ` Backend role update failed: ${
            lastRoleError?.message || "No working role update endpoint was accepted by the backend."
          }`;
        }
      }

      const savedModules = await assignUserModules(selectedUser.email, selectedModules);

      let branchWarning = "";
      // Head Office now maps to its seeded backend branch via `backendId`, so it is
      // persisted like any other branch.
      const resolvedBranchId = resolveBackendBranchId(selectedBranch);
      if (resolvedBranchId != null) {
        if (!backendUserId) {
          branchWarning = " Branch was not saved: this user has no backend account id.";
        } else {
          try {
            await assignUserToBranch(resolvedBranchId, backendUserId);
          } catch (branchError) {
            branchWarning = ` Branch assignment failed: ${
              branchError?.message || "The backend rejected the branch assignment."
            }`;
          }
        }
      }

      const successMessage = `Access saved for ${selectedUser.email}.${roleWarning}${branchWarning}`;
      setSuccess(successMessage);
      setUsers((current) =>
        current.map((user) =>
          user.id === selectedUser.id
            ? {
                ...user,
                role: nextRole || selectedRole,
                branchId: selectedBranch?.id || HEAD_OFFICE_ID,
                branchName: getBranchLabel(selectedBranch),
                raw: {
                  ...user.raw,
                  branch:
                    resolvedBranchId != null
                      ? { id: resolvedBranchId, branchName: selectedBranch?.branchName }
                      : user.raw?.branch,
                },
              }
            : user
        )
      );
      setSelectedModules(savedModules);
    } catch (assignError) {
      setError(assignError?.message || "Failed to update user role.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="security-page">
      <AdminNav />
      <main className="security-page-main">
        <section className="security-hero">
          <div>
            <p className="security-hero-kicker">Security Setup</p>
            <h1>Merge User Role</h1>
            <p>
              Assign a backend role to a selected user in a cleaner standard form.
              You can also attach module visibility like Mail And Messenger here.
            </p>
          </div>
          <div className="security-hero-stat">
            <span>Available Roles</span>
            <strong>{roles.length}</strong>
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
          <div className="security-modal-backdrop">
            <div className="security-modal">
              <h3>Success Message</h3>
              <p>{success}</p>
              <div className="security-actions">
                <button
                  type="button"
                  className="security-btn security-btn-primary"
                  onClick={() => setSuccess("")}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <section className="security-layout security-grid-2">
          <div className="security-card">
            <div className="security-card-header">
              <div>
                <h2>Role Assignment</h2>
                <p>Select a user and assign the role that should control access after login.</p>
              </div>
            </div>
            <div className="security-card-body">
              <div className="security-form-grid two">
                <div className="security-field">
                  <label htmlFor="mergeUser">User Email</label>
                  <select
                    id="mergeUser"
                    className="security-select"
                    value={selectedEmail}
                    disabled={loadingUsers}
                    onChange={(event) => {
                      setSelectedEmail(event.target.value);
                      setSelectedRole("");
                    }}
                  >
                    <option value="">
                      {loadingUsers ? "Loading backend users..." : `Select user (${users.length})`}
                    </option>
                    {!loadingUsers && users.length === 0 ? (
                      <option value="" disabled>
                        No backend users found
                      </option>
                    ) : null}
                    {users.map((user) => (
                      <option key={`${user.id}-${user.email}`} value={user.email}>
                        {user.name && user.name !== user.email ? `${user.name} - ${user.email}` : user.email}
                      </option>
                    ))}
                  </select>
                  {!loadingUsers && users.length === 0 ? (
                    <span className="security-field-help">
                      No backend users loaded. Check your admin login permission and refresh this page.
                    </span>
                  ) : (
                    <span className="security-field-help">
                      {users.length} backend user{users.length === 1 ? "" : "s"} loaded.
                    </span>
                  )}
                </div>
                <div className="security-field">
                  <label htmlFor="mergeRole">Role To Assign</label>
                  <select
                    id="mergeRole"
                    className="security-select"
                    value={selectedRole}
                    onChange={(event) => setSelectedRole(event.target.value)}
                  >
                    <option value="">Select role</option>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="security-field">
                  <label htmlFor="mergeBranch">Branch / Office</label>
                  <select
                    id="mergeBranch"
                    className="security-select"
                    value={branchId}
                    onChange={(event) => setBranchId(event.target.value)}
                  >
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {getBranchLabel(branch)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="security-field" style={{ gridColumn: "1 / -1" }}>
                  <label>Module Access To Assign</label>
                  <div className="security-actions">
                    {MODULE_OPTIONS.map((module) => (
                      <button
                        key={module.key}
                        type="button"
                        className={`security-btn ${
                          selectedModules.includes(module.key)
                            ? "security-btn-primary"
                            : "security-btn-secondary"
                        }`}
                        onClick={() => toggleModule(module.key)}
                      >
                        {module.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="security-actions" style={{ marginTop: "16px" }}>
                <button className="security-btn security-btn-primary" type="button" onClick={handleAssignRole} disabled={loading}>
                  {loading ? "Saving..." : "Save Access"}
                </button>
              </div>
              <div className="security-note" style={{ marginTop: "16px" }}>
                Module access is saved to the backend against the user account, so it follows the user across any browser or device after login. If you add `Mail And Messenger`, that user will also get access to the team messenger screen. Backend role update is still sent when a role is selected.
              </div>
            </div>
          </div>

          <div className="security-card">
            <div className="security-card-header">
              <div>
                <h3>Selected User</h3>
                <p>Review the current assignment before saving a change.</p>
              </div>
            </div>
            <div className="security-card-body">
              <div className="security-kv">
                <div className="security-kv-item">
                  <span>Name</span>
                  <strong>{selectedUser?.name || selectedUser?.fullName || "No user selected"}</strong>
                </div>
                <div className="security-kv-item">
                  <span>Email</span>
                  <strong>{selectedUser?.email || "—"}</strong>
                </div>
                <div className="security-kv-item">
                  <span>User Code</span>
                  <strong>{selectedUser?.userCode || "—"}</strong>
                </div>
                <div className="security-kv-item">
                  <span>Current Role</span>
                  <strong>{selectedUser?.role || "N/A"}</strong>
                </div>
                <div className="security-kv-item">
                  <span>New Role</span>
                  <strong>{selectedRole || "Not selected"}</strong>
                </div>
                <div className="security-kv-item">
                  <span>Branch / Office</span>
                  <strong>{getBranchLabel(selectedBranch)}</strong>
                </div>
                <div className="security-kv-item">
                  <span>Assigned Modules</span>
                  <strong>
                    {selectedModules.length
                      ? selectedModules.map((module) => getModuleLabel(module)).join(", ")
                      : "No module access selected"}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MergeUserRole;
