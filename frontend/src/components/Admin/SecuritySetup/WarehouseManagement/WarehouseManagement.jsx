import React, { useEffect, useMemo, useState } from "react";
import { FiArchive, FiPower, FiSave } from "react-icons/fi";
import AdminNav from "../../Navigation/AdminNav";
import "../shared/SecurityStandard.css";
import { fetchSecurityUsers } from "../shared/securityUtils";
import { getBranchLabel, HEAD_OFFICE_ID } from "../../../../lib/branchAccess";
import { fetchBranches } from "../../../../lib/branchApi";
import {
  createWarehouse,
  fetchWarehouses,
  toggleWarehouseStatus,
} from "../../../../lib/warehouseApi";

const WAREHOUSE_MANAGER_ROLES = ["WAREHOUSE", "SUPER_ADMIN", "ADMIN"];

const getUserName = (user = {}) =>
  user.name ||
  user.fullName ||
  [user.firstName, user.lastName].filter(Boolean).join(" ") ||
  user.email ||
  "Unknown user";

const initialWarehouseForm = {
  warehouseName: "",
  branchCode: "",
  locationAddress: "",
  stateCity: "",
  warehouseManager: "",
  phoneNumber: "",
  email: "",
  status: "Active",
  storageCapacity: "",
};

const WarehouseManagement = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [warehouseForm, setWarehouseForm] = useState(initialWarehouseForm);
  const [message, setMessage] = useState("");
  const [successPopup, setSuccessPopup] = useState("");
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);
  const [warehouseError, setWarehouseError] = useState("");
  const [saving, setSaving] = useState(false);

  const refreshWarehouses = async () => {
    setLoadingWarehouses(true);
    setWarehouseError("");
    try {
      const rows = await fetchWarehouses();
      setWarehouses(rows);
    } catch (error) {
      setWarehouseError(error?.message || "Unable to load warehouses.");
    } finally {
      setLoadingWarehouses(false);
    }
  };

  useEffect(() => {
    fetchSecurityUsers()
      .then((rows) => setUsers(rows.filter(Boolean)))
      .catch(() => setUsers([]));
    fetchBranches()
      .then((rows) => setBranches(rows))
      .catch(() => setBranches([]));
    refreshWarehouses();
  }, []);

  const warehouseManagerUsers = useMemo(() => {
    const filtered = users.filter((u) =>
      WAREHOUSE_MANAGER_ROLES.includes(String(u.role || "").toUpperCase())
    );
    return filtered.length > 0 ? filtered : users;
  }, [users]);

  const updateWarehouseForm = (name, value) => {
    setWarehouseForm((current) => ({ ...current, [name]: value }));
  };

  const branchOptions = branches.filter(
    (b) => b.id === HEAD_OFFICE_ID || !b.isHeadOffice || b.branchCode
  );

  const handleCreateWarehouse = async (event) => {
    event.preventDefault();
    const branchCode = warehouseForm.branchCode.trim().toUpperCase();
    const warehouseName = warehouseForm.warehouseName.trim();

    if (!warehouseName || !branchCode) {
      setMessage("Warehouse name and branch are required.");
      return;
    }

    const managerUser = users.find((u) => u.email === warehouseForm.warehouseManager);
    const managerId = Number(managerUser?.id);
    const branchOption = branchOptions.find(
      (b) => b.branchCode === branchCode || b.id === branchCode
    );
    const branchId = Number(branchOption?.id);

    const payload = {
      warehouseName,
      branchCode,
      locationAddress: warehouseForm.locationAddress.trim(),
      stateCity: warehouseForm.stateCity.trim(),
      branchManagerId: Number.isFinite(managerId) ? managerId : null,
      phoneNumber: warehouseForm.phoneNumber.trim(),
      email: warehouseForm.email.trim(),
      storageCapacity: warehouseForm.storageCapacity
        ? Number(warehouseForm.storageCapacity)
        : null,
      branchId: Number.isFinite(branchId) ? branchId : null,
    };

    setSaving(true);
    setMessage("");
    try {
      const created = await createWarehouse(payload);
      await refreshWarehouses();
      setWarehouseForm(initialWarehouseForm);
      const successMessage = `${created.warehouseName || warehouseName} warehouse saved successfully.`;
      setMessage(successMessage);
      setSuccessPopup(successMessage);
    } catch (error) {
      setMessage(error?.message || "Unable to save warehouse. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (warehouseId) => {
    try {
      await toggleWarehouseStatus(warehouseId);
      await refreshWarehouses();
      setMessage("Warehouse status updated.");
    } catch (error) {
      setMessage(error?.message || "Unable to update warehouse status.");
    }
  };

  // Resolve the manager's display name from the loaded users (the API stores only the id).
  const getManagerName = (warehouse = {}) => {
    if (warehouse.branchManagerId == null) return "";
    const managerUser = users.find(
      (u) => String(u.id) === String(warehouse.branchManagerId)
    );
    return managerUser ? getUserName(managerUser) : "";
  };

  return (
    <div className="security-page">
      <AdminNav />
      <main className="security-page-main">
        <section className="security-hero">
          <div>
            <p className="security-hero-kicker">Security Setup</p>
            <h1>Warehouse Management</h1>
            <p>
              Create and maintain branch warehouses, capacity, location,
              manager details, and active status for multi-branch operations.
            </p>
          </div>
          <div className="security-hero-stat">
            <span>Warehouses</span>
            <strong>{warehouses.length}</strong>
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

        <section className="security-layout">
          <form className="security-card branch-setup-card warehouse-create-card" onSubmit={handleCreateWarehouse}>
            <div className="security-card-header branch-setup-card-header">
              <div className="branch-setup-title">
                <span className="branch-setup-icon">
                  <FiArchive />
                </span>
                <div>
                  <h2>Create Warehouse</h2>
                  <p>Super Admin can create branch warehouses and define capacity, location, contact, and status.</p>
                </div>
              </div>
              <span className="security-badge">SUPER ADMIN</span>
            </div>
            <div className="security-card-body">
              <div className="branch-form-strip">
                <span>Warehouse profile</span>
                <strong>{warehouseForm.warehouseName || "New warehouse"}</strong>
              </div>
              <div className="security-form-grid three">
                <label className="security-field">
                  <span>Branch Warehouse Name</span>
                  <input className="security-input" value={warehouseForm.warehouseName} onChange={(event) => updateWarehouseForm("warehouseName", event.target.value)} required />
                </label>
                <label className="security-field">
                  <span>Branch</span>
                  <select
                    className="security-select"
                    value={warehouseForm.branchCode}
                    onChange={(event) => {
                      const selected = branchOptions.find(
                        (b) => b.branchCode === event.target.value || b.id === event.target.value
                      );
                      updateWarehouseForm("branchCode", selected?.branchCode || event.target.value);
                    }}
                    required
                  >
                    <option value="">Select branch</option>
                    {branchOptions.map((branch) => (
                      <option key={branch.id} value={branch.branchCode || branch.id}>
                        {getBranchLabel(branch)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="security-field">
                  <span>Location / Address</span>
                  <input className="security-input" value={warehouseForm.locationAddress} onChange={(event) => updateWarehouseForm("locationAddress", event.target.value)} />
                </label>
                <label className="security-field">
                  <span>State / City</span>
                  <input className="security-input" value={warehouseForm.stateCity} onChange={(event) => updateWarehouseForm("stateCity", event.target.value)} />
                </label>
                <label className="security-field">
                  <span>Warehouse Manager</span>
                  <select
                    className="security-select"
                    value={warehouseForm.warehouseManager}
                    onChange={(event) => updateWarehouseForm("warehouseManager", event.target.value)}
                  >
                    <option value="">Select warehouse manager</option>
                    {warehouseManagerUsers.map((user) => (
                      <option key={user.email} value={user.email}>
                        {getUserName(user)} — {user.email}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="security-field">
                  <span>Phone Number</span>
                  <input className="security-input" value={warehouseForm.phoneNumber} onChange={(event) => updateWarehouseForm("phoneNumber", event.target.value)} />
                </label>
                <label className="security-field">
                  <span>Email</span>
                  <input className="security-input" type="email" value={warehouseForm.email} onChange={(event) => updateWarehouseForm("email", event.target.value)} />
                </label>
                <label className="security-field">
                  <span>Status</span>
                  <select className="security-select" value={warehouseForm.status} onChange={(event) => updateWarehouseForm("status", event.target.value)}>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </label>
                <label className="security-field">
                  <span>Storage Capacity</span>
                  <input className="security-input" type="number" min="0" value={warehouseForm.storageCapacity} onChange={(event) => updateWarehouseForm("storageCapacity", event.target.value)} />
                </label>
              </div>
              <div className="branch-form-actions">
                <button
                  className="security-btn security-btn-primary branch-save-btn"
                  type="submit"
                  disabled={saving}
                >
                  <FiSave />
                  {saving ? "Saving..." : "Save Warehouse"}
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="security-layout">
          <div className="security-card">
            <div className="security-card-header">
              <div>
                <h2>Warehouses</h2>
                <p>
                  {loadingWarehouses
                    ? "Loading warehouses..."
                    : `${warehouses.length} warehouse record${warehouses.length === 1 ? "" : "s"} created.`}
                </p>
                {warehouseError ? (
                  <p className="security-field-error">{warehouseError}</p>
                ) : null}
              </div>
            </div>
            <div className="security-table-wrap branch-directory-table-wrap">
              <table className="security-table branch-directory-table warehouse-directory-table">
                <thead>
                  <tr>
                    <th>Warehouse</th>
                    <th>Branch</th>
                    <th>Warehouse Manager</th>
                    <th>Capacity</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingWarehouses ? (
                    <tr><td colSpan="6">Loading warehouses...</td></tr>
                  ) : warehouses.length === 0 ? (
                    <tr><td colSpan="6">No warehouse created yet.</td></tr>
                  ) : warehouses.map((warehouse) => {
                    const isActive = String(warehouse.status).toLowerCase() === "active";
                    const managerName = getManagerName(warehouse);
                    return (
                    <tr key={warehouse.id}>
                      <td>
                        <div className="branch-directory-main">
                          <strong>{warehouse.warehouseName}</strong>
                          <span>{warehouse.locationAddress || "No address added"}</span>
                        </div>
                      </td>
                      <td><span className="branch-code-pill">{warehouse.branchCode}</span></td>
                      <td>
                        <div className="branch-directory-contact">
                          <strong>{managerName || "No manager assigned"}</strong>
                          <span>{warehouse.phoneNumber || warehouse.email || "No contact added"}</span>
                        </div>
                      </td>
                      <td>
                        <span className="permission-warehouse-pill assigned">
                          {warehouse.storageCapacity || "0"} capacity
                        </span>
                      </td>
                      <td>
                        <span className={`branch-status-pill ${isActive ? "active" : "inactive"}`}>
                          {warehouse.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="branch-action-icon"
                          type="button"
                          onClick={() => handleToggleStatus(warehouse.id)}
                          aria-label={`${isActive ? "Deactivate" : "Activate"} ${warehouse.warehouseName}`}
                          title={isActive ? "Deactivate warehouse" : "Activate warehouse"}
                        >
                          <FiPower />
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default WarehouseManagement;
