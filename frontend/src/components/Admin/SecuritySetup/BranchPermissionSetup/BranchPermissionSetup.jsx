import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiEdit2, FiHome, FiMapPin, FiPower, FiSave, FiTrash2, FiUserPlus } from "react-icons/fi";
import AdminNav from "../../Navigation/AdminNav";
import "../shared/SecurityStandard.css";
import "./BranchPermissionSetup.css";
import {
  DEFAULT_SECURITY_ROLES,
  fetchSecurityRoles,
  fetchSecurityUsers,
} from "../shared/securityUtils";
import { MODULE_OPTIONS, assignUserModules } from "../../../../lib/moduleAccess";
import { HEAD_OFFICE_ID, resolveBackendBranchId } from "../../../../lib/branchAccess";
import {
  assignUserToBranch,
  createBranch,
  deactivateBranch,
  fetchBranches,
  fetchLgas,
  fetchStates,
  fetchWards,
  setHeadOfficeBranch,
  updateBranch,
} from "../../../../lib/branchApi";
import {
  deleteBranchAssignment,
  fetchBranchAssignments,
  upsertBranchAssignment,
} from "../../../../lib/branchAssignmentApi";
import { fetchWarehouses } from "../../../../lib/warehouseApi";

const initialBranchForm = {
  branchName: "",
  branchAddress: "",
  stateId: "",
  lgaId: "",
  wardId: "",
  phoneNumber: "",
  email: "",
  managerEmail: "",
};

const initialAssignmentForm = {
  userEmail: "",
  locationType: "HEAD_OFFICE",
  branchId: HEAD_OFFICE_ID,
  warehouseName: "",
  userRole: "",
  permissions: [],
};

// Backend requires a branch manager to have the BRANCH_MANAGER role.
const MANAGER_ROLES = ["BRANCH_MANAGER"];

const getUserName = (user = {}) =>
  user.name ||
  user.fullName ||
  [user.firstName, user.lastName].filter(Boolean).join(" ") ||
  user.email ||
  "Unknown user";

const BranchPermissionSetup = () => {
  const [branches, setBranches] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState(DEFAULT_SECURITY_ROLES);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [wards, setWards] = useState([]);
  const [branchForm, setBranchForm] = useState(initialBranchForm);
  const [editingBranchId, setEditingBranchId] = useState(null);
  const [assignmentForm, setAssignmentForm] = useState(initialAssignmentForm);
  const [message, setMessage] = useState("");
  const [successPopup, setSuccessPopup] = useState("");
  const [savingBranch, setSavingBranch] = useState(false);
  const branchFormRef = useRef(null);

  const refreshBranches = async () => {
    try {
      const rows = await fetchBranches();
      setBranches(rows);
    } catch {
      setBranches([]);
    }
  };

  const refreshAssignments = async () => {
    try {
      const rows = await fetchBranchAssignments();
      setAssignments(rows);
    } catch {
      setAssignments([]);
    }
  };

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      fetchSecurityUsers().catch(() => []),
      fetchSecurityRoles().catch(() => DEFAULT_SECURITY_ROLES),
      fetchWarehouses().catch(() => []),
      fetchBranches().catch(() => []),
      fetchStates().catch(() => []),
      fetchBranchAssignments().catch(() => []),
    ]).then(([userRows, roleRows, warehouseRows, branchRows, stateRows, assignmentRows]) => {
      if (!isMounted) return;
      setUsers(userRows.filter(Boolean));
      setRoles(roleRows.filter(Boolean));
      setWarehouses(warehouseRows.filter(Boolean));
      setBranches(branchRows);
      setStates(stateRows);
      setAssignments(assignmentRows);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Cascade: load LGAs when a state is picked, wards when an LGA is picked.
  useEffect(() => {
    if (!branchForm.stateId) {
      setLgas([]);
      return;
    }
    fetchLgas(branchForm.stateId).then(setLgas).catch(() => setLgas([]));
  }, [branchForm.stateId]);

  useEffect(() => {
    if (!branchForm.lgaId) {
      setWards([]);
      return;
    }
    fetchWards(branchForm.lgaId).then(setWards).catch(() => setWards([]));
  }, [branchForm.lgaId]);

  // Key by String(id): branch ids are numeric but <select> values arrive as strings.
  const branchLookup = useMemo(
    () => new Map(branches.map((branch) => [String(branch.id), branch])),
    [branches]
  );

  const selectedBranch =
    branchLookup.get(String(assignmentForm.branchId)) || branchLookup.get(HEAD_OFFICE_ID);

  // Only BRANCH_MANAGER users can be assigned as a branch manager (backend rejects others).
  const managerUsers = useMemo(
    () => users.filter((u) => MANAGER_ROLES.includes(String(u.role || "").toUpperCase())),
    [users]
  );

  const warehouseOptions = useMemo(() => {
    const targetCode =
      assignmentForm.locationType === "HEAD_OFFICE"
        ? "HO"
        : branchLookup.get(String(assignmentForm.branchId))?.branchCode || assignmentForm.branchId;

    return warehouses
      .filter((w) => w.branchCode === targetCode)
      .map((w) => w.warehouseName)
      .filter(Boolean);
  }, [warehouses, assignmentForm.branchId, assignmentForm.locationType, branchLookup]);

  const updateBranchForm = (name, value) => {
    setBranchForm((current) => ({
      ...current,
      [name]: value,
      // Reset dependent location fields when a parent changes.
      ...(name === "stateId" ? { lgaId: "", wardId: "" } : {}),
      ...(name === "lgaId" ? { wardId: "" } : {}),
    }));
  };

  const updateAssignmentForm = (name, value) => {
    setAssignmentForm((current) => {
      const next = { ...current, [name]: value };

      if (name === "locationType") {
        next.branchId = value === "HEAD_OFFICE" ? HEAD_OFFICE_ID : "";
        next.warehouseName = "";
      }

      if (name === "branchId") {
        next.warehouseName = "";
      }

      return next;
    });
  };

  const togglePermission = (permission) => {
    setAssignmentForm((current) => {
      const exists = current.permissions.includes(permission);
      const permissions = exists
        ? current.permissions.filter((item) => item !== permission)
        : [...current.permissions, permission];

      return { ...current, permissions };
    });
  };

  const handleSaveBranch = async (event) => {
    event.preventDefault();
    const branchName = branchForm.branchName.trim();

    if (!branchName) {
      setMessage("Branch name is required.");
      return;
    }

    const managerUser = users.find((u) => u.email === branchForm.managerEmail);
    const managerId = Number(managerUser?.id);

    const payload = {
      branchName,
      address: branchForm.branchAddress.trim(),
      phone: branchForm.phoneNumber.trim(),
      email: branchForm.email.trim(),
      stateId: branchForm.stateId ? Number(branchForm.stateId) : null,
      lgaId: branchForm.lgaId ? Number(branchForm.lgaId) : null,
      wardId: branchForm.wardId ? Number(branchForm.wardId) : null,
      managerId: Number.isFinite(managerId) ? managerId : null,
    };

    const isEditing = editingBranchId != null;
    setSavingBranch(true);
    setMessage("");
    try {
      const saved = isEditing
        ? await updateBranch(editingBranchId, payload)
        : await createBranch(payload);
      await refreshBranches();
      setBranchForm(initialBranchForm);
      setEditingBranchId(null);
      const verb = isEditing ? "updated" : "created";
      const successMessage = `${saved.branchName || branchName} (${saved.branchCode || "saved"}) ${verb} successfully.`;
      setMessage(successMessage);
      setSuccessPopup(successMessage);
    } catch (error) {
      setMessage(error?.message || "Unable to save branch. Please try again.");
    } finally {
      setSavingBranch(false);
    }
  };

  // Loads a branch into the Create/Edit Branch form. State/LGA/Ward selects fill
  // in once their cascading fetch effects (keyed off branchForm.stateId/lgaId)
  // resolve, same as when a user picks them by hand.
  const startEditBranch = (branch) => {
    const managerUser = users.find((u) => String(u.id) === String(branch.managerId));
    setEditingBranchId(branch.id);
    setBranchForm({
      branchName: branch.branchName || "",
      branchAddress: branch.branchAddress || "",
      stateId: branch.stateId != null ? String(branch.stateId) : "",
      lgaId: branch.lgaId != null ? String(branch.lgaId) : "",
      wardId: branch.wardId != null ? String(branch.wardId) : "",
      phoneNumber: branch.phoneNumber || "",
      email: branch.email || "",
      managerEmail: managerUser?.email || "",
    });
    branchFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const cancelEditBranch = () => {
    setEditingBranchId(null);
    setBranchForm(initialBranchForm);
  };

  // Backend stores managerId only; resolve the display name from the loaded users.
  const getBranchManagerName = (branch = {}) => {
    if (branch.managerId == null) return "";
    const managerUser = users.find((u) => String(u.id) === String(branch.managerId));
    return managerUser ? getUserName(managerUser) : "";
  };

  const handleAssignUser = async (event) => {
    event.preventDefault();

    if (!assignmentForm.userEmail) {
      setMessage("Select a user to assign.");
      return;
    }

    if (assignmentForm.locationType === "BRANCH" && !assignmentForm.branchId) {
      setMessage("Select the branch this user belongs to.");
      return;
    }

    const selectedUser = users.find((user) => user.email === assignmentForm.userEmail);

    // Module access must persist to the backend.
    try {
      await assignUserModules(assignmentForm.userEmail, assignmentForm.permissions);
    } catch (assignError) {
      setMessage(assignError?.message || "Failed to save module access to the backend.");
      return;
    }

    // Persist the user's branch on the backend (User.branch). Head Office is a real
    // seeded branch, so it is assigned via its backend id like any other branch.
    // A branch-assignment failure (e.g. backend rejects SUPER_ADMIN) is surfaced as a
    // warning rather than aborting the module + local metadata save.
    let branchWarning = "";
    const resolvedBranchId = resolveBackendBranchId(selectedBranch);
    if (resolvedBranchId != null && selectedUser?.id) {
      try {
        await assignUserToBranch(resolvedBranchId, selectedUser.id);
      } catch (branchError) {
        branchWarning = ` Branch was not saved on the backend: ${
          branchError?.message || "the backend rejected the branch assignment."
        }`;
      }
    }

    // Persist the assignment metadata (warehouse, in-branch role, approval scope)
    // to the backend (BranchUserAssignment).
    const warehouse = warehouses.find((w) => w.warehouseName === assignmentForm.warehouseName);
    try {
      await upsertBranchAssignment({
        email: assignmentForm.userEmail,
        branchId: resolvedBranchId,
        warehouseId: warehouse?.id ?? null,
        warehouseName: assignmentForm.warehouseName || null,
        jobRole: assignmentForm.userRole || null,
        locationType: assignmentForm.locationType,
        approvalScope:
          assignmentForm.locationType === "HEAD_OFFICE"
            ? "HEAD_OFFICE_AND_BRANCHES"
            : "BRANCH_ONLY",
      });
    } catch (saveError) {
      setMessage(saveError?.message || "Failed to save the assignment to the backend.");
      return;
    }

    await refreshAssignments();
    const userName = getUserName(selectedUser);
    const branchName = selectedBranch?.branchName || "Head Office";
    setAssignmentForm(initialAssignmentForm);
    const successMessage = `${userName} assigned to ${branchName} successfully.${branchWarning}`;
    setMessage(successMessage);
    setSuccessPopup(successMessage);
  };

  const removeAssignment = async (assignmentId) => {
    try {
      await deleteBranchAssignment(assignmentId);
      await refreshAssignments();
      setMessage("Assignment removed.");
    } catch (error) {
      setMessage(error?.message || "Failed to remove the assignment.");
    }
  };

  // Backend has no hard-delete; deactivate instead.
  const removeBranch = async (branchId) => {
    try {
      await deactivateBranch(branchId);
      await refreshBranches();
      setMessage("Branch deactivated.");
    } catch (error) {
      setMessage(error?.message || "Unable to deactivate branch.");
    }
  };

  // Moves the Head Office flag here. Everyone currently posted to the old Head
  // Office branch loses company-wide access on their next request; everyone
  // posted to this branch gains it -- so confirm before sending it.
  const makeHeadOffice = async (branch) => {
    const confirmed = window.confirm(
      `Make "${branch.branchName}" the Head Office branch? Staff currently posted to ` +
        `Head Office will lose company-wide access, and staff posted to "${branch.branchName}" will gain it.`
    );
    if (!confirmed) return;
    try {
      await setHeadOfficeBranch(branch.id);
      await refreshBranches();
      setMessage(`${branch.branchName} is now the Head Office branch.`);
    } catch (error) {
      setMessage(error?.message || "Unable to change the Head Office branch.");
    }
  };

  const branchRows = branches.filter((branch) => branch.id !== HEAD_OFFICE_ID);
  // The real, currently-flagged Head Office branch (as opposed to the
  // HEAD_OFFICE_ID lookup sentinel, which always exists as a placeholder).
  const realHeadOffice = branchRows.find((branch) => branch.isHeadOffice);

  return (
    <div className="security-page branch-registry-page">
      <AdminNav />
      <main className="security-page-main">
        <section className="security-hero">
          <div>
            <p className="security-hero-kicker">Security Setup</p>
            <h1>Branch Setup</h1>
            <p>
              Create branches, attach users to head office or branch offices,
              assign storekeepers to warehouses, and control module visibility.
            </p>
          </div>
        </section>

        <section className="reg-stats">
          <div className="reg-stat-card">
            <div className="reg-stat-label">Branch Offices</div>
            <div className="reg-stat-value">{branchRows.length}</div>
            <div className="reg-stat-sub">
              Created so far &middot; <strong>{branchRows.filter((b) => String(b.status).toLowerCase() === "active").length} active</strong>
            </div>
          </div>
          <div className="reg-stat-card">
            <div className="reg-stat-label">
              <FiHome />
              Head Office
            </div>
            <div className="reg-stat-value hq">
              <FiHome />
              {realHeadOffice?.branchName || "Not set"}
            </div>
            <div className="reg-stat-sub">Unrestricted, company-wide access</div>
          </div>
          <div className="reg-stat-card">
            <div className="reg-stat-label">Staff Assignments</div>
            <div className="reg-stat-value">{assignments.length}</div>
            <div className="reg-stat-sub">Posted with module access</div>
          </div>
          <div className="reg-stat-card">
            <div className="reg-stat-label">Modules Governed</div>
            <div className="reg-stat-value">{MODULE_OPTIONS.length}</div>
            <div className="reg-stat-sub">Available to grant per assignment</div>
          </div>
        </section>

        {message ? (
          <div className="security-alert security-alert-success">
            <span>{message}</span>
            <button type="button" onClick={() => setMessage("")}>Close</button>
          </div>
        ) : null}

        {successPopup ? (
          <div className="security-modal-backdrop">
            <div className="security-modal security-success-popup">
              <div className="security-success-icon">✓</div>
              <h3>Saved Successfully</h3>
              <p>{successPopup}</p>
              <div className="security-actions">
                <button
                  className="security-btn security-btn-primary"
                  type="button"
                  onClick={() => setSuccessPopup("")}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <section className="security-layout security-grid-2">
          <form
            ref={branchFormRef}
            className="security-card branch-setup-card branch-create-card"
            onSubmit={handleSaveBranch}
          >
            <div className="security-card-header branch-setup-card-header">
              <div className="branch-setup-title">
                <span className="branch-setup-icon">
                  <FiMapPin />
                </span>
                <div>
                  <h2>{editingBranchId ? "Edit Branch" : "Create Branch"}</h2>
                  <p>
                    {editingBranchId
                      ? "Update this branch's location, manager, and contact details."
                      : "Register a branch office with its location, manager, and operating status."}
                  </p>
                </div>
              </div>
              <span className="security-badge">SUPER ADMIN</span>
            </div>
            <div className="security-card-body">
              <div className="branch-form-strip">
                <span>Branch profile</span>
                <strong>{branchForm.branchName || "New branch"}</strong>
              </div>
              <div className="security-form-grid two">
                <label className="security-field">
                  <span>Branch Name</span>
                  <input className="security-input" value={branchForm.branchName} onChange={(event) => updateBranchForm("branchName", event.target.value)} required />
                </label>
                <label className="security-field">
                  <span>Branch Address</span>
                  <input className="security-input" value={branchForm.branchAddress} onChange={(event) => updateBranchForm("branchAddress", event.target.value)} />
                </label>
                <label className="security-field">
                  <span>State</span>
                  <select
                    className="security-select"
                    value={branchForm.stateId}
                    onChange={(event) => updateBranchForm("stateId", event.target.value)}
                  >
                    <option value="">Select state</option>
                    {states.map((state) => (
                      <option key={state.id} value={state.id}>{state.name}</option>
                    ))}
                  </select>
                </label>
                <label className="security-field">
                  <span>LGA</span>
                  <select
                    className="security-select"
                    value={branchForm.lgaId}
                    onChange={(event) => updateBranchForm("lgaId", event.target.value)}
                    disabled={!branchForm.stateId}
                  >
                    <option value="">{branchForm.stateId ? "Select LGA" : "Select state first"}</option>
                    {lgas.map((lga) => (
                      <option key={lga.id} value={lga.id}>{lga.name}</option>
                    ))}
                  </select>
                </label>
                <label className="security-field">
                  <span>Ward</span>
                  <select
                    className="security-select"
                    value={branchForm.wardId}
                    onChange={(event) => updateBranchForm("wardId", event.target.value)}
                    disabled={!branchForm.lgaId}
                  >
                    <option value="">{branchForm.lgaId ? "Select ward" : "Select LGA first"}</option>
                    {wards.map((ward) => (
                      <option key={ward.id} value={ward.id}>{ward.name}</option>
                    ))}
                  </select>
                </label>
                <label className="security-field">
                  <span>Phone Number</span>
                  <input className="security-input" value={branchForm.phoneNumber} onChange={(event) => updateBranchForm("phoneNumber", event.target.value)} />
                </label>
                <label className="security-field">
                  <span>Email</span>
                  <input className="security-input" type="email" value={branchForm.email} onChange={(event) => updateBranchForm("email", event.target.value)} />
                </label>
                <label className="security-field">
                  <span>Branch Manager</span>
                  <select className="security-select" value={branchForm.managerEmail} onChange={(event) => updateBranchForm("managerEmail", event.target.value)}>
                    <option value="">
                      {managerUsers.length ? "Select manager" : "No BRANCH_MANAGER users"}
                    </option>
                    {managerUsers.map((user) => (
                      <option key={user.email} value={user.email}>
                        {getUserName(user)} — {user.email}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="branch-form-actions">
                <button className="security-btn security-btn-primary branch-save-btn" type="submit" disabled={savingBranch}>
                  <FiSave />
                  {savingBranch ? "Saving..." : editingBranchId ? "Update Branch" : "Save Branch"}
                </button>
                {editingBranchId ? (
                  <button
                    type="button"
                    className="security-btn security-btn-secondary"
                    onClick={cancelEditBranch}
                    disabled={savingBranch}
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </div>
          </form>

          <form className="security-card branch-setup-card branch-assignment-card" onSubmit={handleAssignUser}>
            <div className="security-card-header branch-setup-card-header">
              <div className="branch-setup-title">
                <span className="branch-setup-icon">
                  <FiUserPlus />
                </span>
                <div>
                  <h2>Assign User &amp; Permissions</h2>
                  <p>Attach users to a branch, warehouse, user role, and modules.</p>
                </div>
              </div>
              <span className="security-badge">RBAC</span>
            </div>
            <div className="security-card-body">
              <div className="branch-form-strip">
                <span>Access profile</span>
                <strong>{assignmentForm.userEmail || "Select user"}</strong>
              </div>
              <div className="security-form-grid two">
                <label className="security-field">
                  <span>User</span>
                  <select className="security-select" value={assignmentForm.userEmail} onChange={(event) => updateAssignmentForm("userEmail", event.target.value)} required>
                    <option value="">Select user</option>
                    {users.map((user) => (
                      <option key={user.email} value={user.email}>
                        {getUserName(user)} - {user.email}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="security-field">
                  <span>Office Type</span>
                  <div className="reg-segmented">
                    <button
                      type="button"
                      className={assignmentForm.locationType === "HEAD_OFFICE" ? "on" : ""}
                      onClick={() => updateAssignmentForm("locationType", "HEAD_OFFICE")}
                    >
                      Head Office
                    </button>
                    <button
                      type="button"
                      className={assignmentForm.locationType === "BRANCH" ? "on" : ""}
                      onClick={() => updateAssignmentForm("locationType", "BRANCH")}
                    >
                      Branch Office
                    </button>
                  </div>
                </label>
                <label className="security-field">
                  <span>Branch</span>
                  <select
                    className="security-select"
                    value={assignmentForm.branchId}
                    onChange={(event) => updateAssignmentForm("branchId", event.target.value)}
                    disabled={assignmentForm.locationType === "HEAD_OFFICE"}
                  >
                    <option value={HEAD_OFFICE_ID}>Head Office</option>
                    {branchRows.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.branchCode} - {branch.branchName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="security-field">
                  <span>Warehouse</span>
                  <select className="security-select" value={assignmentForm.warehouseName} onChange={(event) => updateAssignmentForm("warehouseName", event.target.value)}>
                    <option value="">No warehouse</option>
                    {warehouseOptions.map((warehouse) => (
                      <option key={warehouse} value={warehouse}>{warehouse}</option>
                    ))}
                  </select>
                </label>
                <label className="security-field">
                  <span>User Role</span>
                  <select className="security-select" value={assignmentForm.userRole} onChange={(event) => updateAssignmentForm("userRole", event.target.value)}>
                    <option value="">Select role</option>
                    {roles.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="branch-permission-grid">
                {MODULE_OPTIONS.map((module) => (
                  <label key={module.key} className="branch-permission-pill">
                    <input
                      type="checkbox"
                      checked={assignmentForm.permissions.includes(module.key)}
                      onChange={() => togglePermission(module.key)}
                    />
                    <span>{module.label}</span>
                  </label>
                ))}
              </div>

              <div className="branch-form-actions">
                <button className="security-btn security-btn-primary branch-save-btn" type="submit">
                  <FiSave />
                  Save Assignment
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="security-layout security-grid-2">
          <div className="security-card">
            <div className="security-card-header">
              <div>
                <h2>Branches</h2>
                <p>{branchRows.length} branch office{branchRows.length === 1 ? "" : "s"} created.</p>
              </div>
            </div>
            <div className="security-table-wrap branch-directory-table-wrap">
              <table className="security-table branch-directory-table">
                <thead>
                  <tr>
                    <th>Branch Office</th>
                    <th>Code</th>
                    <th>Manager</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {branchRows.length === 0 ? (
                    <tr><td colSpan="5">No branch created yet.</td></tr>
                  ) : branchRows.map((branch) => (
                    <tr key={branch.id}>
                      <td>
                        <div className="branch-directory-main">
                          <strong>{branch.branchName}</strong>
                          <span>
                            {[branch.branchAddress, branch.branchState, branch.branchCountry]
                              .filter(Boolean)
                              .join(", ") || "No address added"}
                          </span>
                          {branch.isHeadOffice ? (
                            <span className="reg-hq-badge">
                              <FiHome />
                              Head Office
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <span className="branch-code-pill">{branch.branchCode}</span>
                      </td>
                      <td>
                        <div className="branch-directory-contact">
                          <strong>{getBranchManagerName(branch) || "No manager assigned"}</strong>
                          <span>{branch.phoneNumber || branch.email || "No contact added"}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`branch-status-pill ${String(branch.status).toLowerCase() === "active" ? "active" : "inactive"}`}>
                          {branch.status}
                        </span>
                      </td>
                      <td className="reg-row-actions">
                        <button
                          className="reg-icon-btn"
                          type="button"
                          onClick={() => startEditBranch(branch)}
                          aria-label={`Edit ${branch.branchName}`}
                          title="Edit branch"
                        >
                          <FiEdit2 />
                        </button>
                        {branch.isHeadOffice ? (
                          <span className="reg-hq-chip" title="This is the current Head Office branch">
                            <FiHome />
                            Current HQ
                          </span>
                        ) : (
                          <button
                            className="reg-icon-btn hq"
                            type="button"
                            onClick={() => makeHeadOffice(branch)}
                            aria-label={`Make ${branch.branchName} the Head Office branch`}
                            title="Make Head Office"
                          >
                            <FiHome />
                          </button>
                        )}
                        <button
                          className="reg-icon-btn danger"
                          type="button"
                          onClick={() => removeBranch(branch.id)}
                          aria-label={`Deactivate ${branch.branchName}`}
                          title="Deactivate branch"
                        >
                          <FiPower />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="security-card">
            <div className="security-card-header">
              <div>
                <h2>User Assignments</h2>
                <p>{assignments.length} user assignment{assignments.length === 1 ? "" : "s"} saved.</p>
              </div>
            </div>
            <div className="security-table-wrap branch-directory-table-wrap">
              <table className="security-table branch-directory-table permission-directory-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Branch</th>
                    <th>Warehouse</th>
                    <th>User Role</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.length === 0 ? (
                    <tr><td colSpan="5">No user assignment yet.</td></tr>
                  ) : assignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td>
                        <div className="branch-directory-main">
                          <strong>{assignment.userName}</strong>
                          <span>{assignment.userEmail}</span>
                        </div>
                      </td>
                      <td>
                        {assignment.locationType === "HEAD_OFFICE" ? (
                          <span className="reg-hq-badge">
                            <FiHome />
                            Head Office
                          </span>
                        ) : (
                          <div className="branch-directory-contact">
                            <strong>{assignment.branchName}</strong>
                            <span>Branch office user</span>
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`permission-warehouse-pill ${assignment.warehouseName ? "assigned" : ""}`}>
                          {assignment.warehouseName || "No warehouse"}
                        </span>
                      </td>
                      <td>
                        <span className="permission-scope-pill">
                          {(assignment.userRole || assignment.jobRole || "").replace(/_/g, " ") || "No role"}
                        </span>
                      </td>
                      <td className="reg-row-actions">
                        <button
                          className="reg-icon-btn danger"
                          type="button"
                          onClick={() => removeAssignment(assignment.id)}
                          aria-label={`Remove assignment for ${assignment.userName}`}
                          title="Remove assignment"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default BranchPermissionSetup;
