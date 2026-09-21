import React, { useEffect, useMemo, useState } from "react";
import { FiSave, FiSliders } from "react-icons/fi";
import AdminNav from "../../Navigation/AdminNav";
import "../shared/SecurityStandard.css";
import { fetchSecurityUsers } from "../shared/securityUtils";
import { getModuleLabel, MODULE_OPTIONS } from "../../../../lib/moduleAccess";
import {
  assignDeniedFeatures,
  fetchDeniedFeatures,
  getFeaturesForModule,
} from "../../../../lib/featureAccess";

const getUserName = (user = {}) =>
  user.name ||
  user.fullName ||
  [user.firstName, user.lastName].filter(Boolean).join(" ") ||
  user.email ||
  "Unknown user";

// Only modules that actually have deniable sub-features appear in the grid.
const MODULES_WITH_FEATURES = MODULE_OPTIONS.filter(
  (module) => getFeaturesForModule(module.key).length > 0
);

const FeaturePermissionSetup = () => {
  const [users, setUsers] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [denied, setDenied] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingDenied, setLoadingDenied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setLoadingUsers(true);
    fetchSecurityUsers()
      .then((rows) => setUsers(rows.filter((user) => user?.email && user.email !== "N/A")))
      .catch((loadError) => setError(loadError?.message || "Unable to load users from backend."))
      .finally(() => setLoadingUsers(false));
  }, []);

  const selectedUser = useMemo(
    () => users.find((user) => user.email === selectedEmail),
    [users, selectedEmail]
  );

  useEffect(() => {
    if (!selectedEmail) {
      setDenied([]);
      return;
    }
    setLoadingDenied(true);
    setSuccess("");
    fetchDeniedFeatures(selectedEmail)
      .then((rows) => setDenied(rows))
      .catch(() => setDenied([]))
      .finally(() => setLoadingDenied(false));
  }, [selectedEmail]);

  const toggleFeature = (featureKey) => {
    setDenied((current) =>
      current.includes(featureKey)
        ? current.filter((item) => item !== featureKey)
        : [...current, featureKey]
    );
  };

  const handleSave = async () => {
    if (!selectedEmail) {
      setError("Select a user first.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const saved = await assignDeniedFeatures(selectedEmail, denied);
      setDenied(saved);
      setSuccess(
        `Permissions saved for ${selectedEmail}. ${
          saved.length ? `${saved.length} sub-module(s) denied.` : "No sub-modules denied."
        }`
      );
    } catch (saveError) {
      setError(saveError?.message || "Failed to save permissions.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="security-page">
      <AdminNav />
      <main className="security-page-main">
        <section className="security-hero">
          <div>
            <p className="security-hero-kicker">Security Setup</p>
            <h1>Permission</h1>
            <p>
              Deny a user access to specific sub-modules. A ticked item is blocked
              for that user even when the parent module is granted — for example,
              deny Staff Payroll under Account for a branch user.
            </p>
          </div>
          <div className="security-hero-stat">
            <span>Denied Sub-Modules</span>
            <strong>{denied.length}</strong>
          </div>
        </section>

        {error ? (
          <div className="security-alert security-alert-error">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")}>Close</button>
          </div>
        ) : null}

        {success ? (
          <div className="security-modal-backdrop">
            <div className="security-modal security-success-popup">
              <div className="security-success-icon">✓</div>
              <h3>Saved Successfully</h3>
              <p>{success}</p>
              <div className="security-actions">
                <button
                  className="security-btn security-btn-primary"
                  type="button"
                  onClick={() => setSuccess("")}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <section className="security-card">
          <div className="security-card-header">
            <div className="branch-setup-title">
              <span className="branch-setup-icon"><FiSliders /></span>
              <div>
                <h2>Deny Sub-Module Access</h2>
                <p>Select a user, then tick the sub-modules they should not access.</p>
              </div>
            </div>
          </div>
          <div className="security-card-body">
            <div className="security-field" style={{ maxWidth: "480px" }}>
              <label htmlFor="permUser">User</label>
              <select
                id="permUser"
                className="security-select"
                value={selectedEmail}
                disabled={loadingUsers}
                onChange={(event) => setSelectedEmail(event.target.value)}
              >
                <option value="">
                  {loadingUsers ? "Loading users..." : `Select user (${users.length})`}
                </option>
                {users.map((user) => (
                  <option key={`${user.id}-${user.email}`} value={user.email}>
                    {getUserName(user)} - {user.email}
                  </option>
                ))}
              </select>
            </div>

            {selectedEmail ? (
              <>
                {loadingDenied ? (
                  <p className="security-note" style={{ marginTop: "16px" }}>Loading current permissions…</p>
                ) : (
                  <div style={{ marginTop: "20px", display: "grid", gap: "18px" }}>
                    {MODULES_WITH_FEATURES.map((module) => (
                      <div key={module.key} className="security-card" style={{ padding: "16px" }}>
                        <h3 style={{ marginBottom: "12px" }}>{getModuleLabel(module.key)}</h3>
                        <div className="branch-permission-grid">
                          {getFeaturesForModule(module.key).map((feature) => (
                            <label key={feature.key} className="branch-permission-pill">
                              <input
                                type="checkbox"
                                checked={denied.includes(feature.key)}
                                onChange={() => toggleFeature(feature.key)}
                              />
                              <span>Deny {feature.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="branch-form-actions" style={{ marginTop: "20px" }}>
                  <button
                    className="security-btn security-btn-primary branch-save-btn"
                    type="button"
                    onClick={handleSave}
                    disabled={saving || loadingDenied}
                  >
                    <FiSave />
                    {saving ? "Saving..." : "Save Permissions"}
                  </button>
                </div>
              </>
            ) : (
              <p className="security-note" style={{ marginTop: "16px" }}>
                Select a user to configure their sub-module access.
                {selectedUser ? "" : ""}
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default FeaturePermissionSetup;
