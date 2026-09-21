import React, { useEffect, useMemo, useState } from "react";
import { FaTimes } from "react-icons/fa";
import BranchBadge from "../../../../shared/BranchBadge";
import { IoGridOutline } from "react-icons/io5";
import Dashboard from "../../../../ui/DashboardBtn";
import pmLogo from "../../../../../assets/images/PMlogo.png";
import { fetchReturns, restoreReturnRequest } from "../../../../../lib/returnsApi";
import "./RestoreOrder.css";

const todayIso = () => new Date().toISOString().slice(0, 10);

const RestoreOrder = ({ toggleRestoreOrderModal }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [referenceDropdownOpen, setReferenceDropdownOpen] = useState(false);

  const [form, setForm] = useState({
    receivedAt: "",
    completedAt: todayIso(),
    description: "",
  });

  const loadReturns = async () => {
    try {
      setLoading(true);
      setError("");
      setRequests(await fetchReturns());
    } catch (err) {
      setError(err?.message || "Failed to load return requests.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReturns();
  }, []);

  const restorableReturns = useMemo(
    () => requests.filter((request) => request.status === "Completed"),
    [requests]
  );

  const restoredHistory = useMemo(
    () => requests.filter((request) => request.status === "Restored"),
    [requests]
  );

  const selectedRequest = useMemo(
    () => restorableReturns.find((request) => String(request.id) === String(selectedId)) || null,
    [restorableReturns, selectedId]
  );

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelect = (id) => {
    setSelectedId(id);
    setReferenceDropdownOpen(false);
  };

  const resetForm = () => {
    setSelectedId("");
    setForm({ receivedAt: "", completedAt: todayIso(), description: "" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!selectedRequest) {
      setError("Please select a returned reference first.");
      return;
    }
    if (!form.receivedAt || !form.completedAt) {
      setError("Please provide both the received and restored dates.");
      return;
    }
    if (!form.description.trim()) {
      setError("Please describe the restoration work done.");
      return;
    }

    setSaving(true);
    try {
      await restoreReturnRequest(selectedRequest.id, {
        receivedAt: form.receivedAt,
        completedAt: form.completedAt,
        description: form.description.trim(),
      });
      await loadReturns();
      setMessage(`${selectedRequest.referenceNo} marked as restored.`);
      resetForm();
    } catch (submitError) {
      setError(submitError?.message || "Unable to record restoration.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="restore-order">
      <header className="restore-order-header">
        <div className="restore-order-logo-wrap">
          <img src={pmLogo} alt="PM Logo" className="restore-order-logo" />
        </div>
        <div>
          <h1>Restore Item</h1>
          <div style={{ display: "flex", justifyContent: "center", margin: "0.4rem 0" }}>
            <BranchBadge />
          </div>
          <p>Log repair work on returned items and mark them as restored.</p>
        </div>
        <div className="restore-order-header-actions">
          <Dashboard />
          <IoGridOutline className="restore-order-grid-icon" />
          <button type="button" className="restore-order-close" onClick={toggleRestoreOrderModal} aria-label="Close">
            <FaTimes />
          </button>
        </div>
      </header>

      {error && <div className="restore-alert restore-alert-error">{error}</div>}
      {message && <div className="restore-alert restore-alert-success">{message}</div>}

      <div className="restore-order-layout">
        <form className="restore-panel" onSubmit={handleSubmit}>
          <div className="restore-panel-heading">
            <h2>Restore Returned Item</h2>
            <span>Completed returns only</span>
          </div>

          <label className="restore-field">
            <span>Select Returned Reference</span>
            <div className="restore-reference-dropdown">
              <button
                type="button"
                className="restore-reference-trigger"
                onClick={() => {
                  if (!loading && !saving) {
                    setReferenceDropdownOpen((prev) => !prev);
                  }
                }}
                disabled={loading || saving}
              >
                <span>
                  {selectedRequest
                    ? `${selectedRequest.referenceNo} - ${selectedRequest.customerName}`
                    : loading
                      ? "Loading references..."
                      : "Select returned reference"}
                </span>
                <strong>{referenceDropdownOpen ? "▲" : "▼"}</strong>
              </button>
              {referenceDropdownOpen ? (
                <div className="restore-reference-menu">
                  {restorableReturns.length === 0 ? (
                    <div className="restore-reference-empty">No completed returns available to restore</div>
                  ) : (
                    restorableReturns.map((request) => (
                      <button
                        type="button"
                        key={request.id}
                        className={String(selectedId) === String(request.id) ? "active" : ""}
                        onClick={() => handleSelect(request.id)}
                      >
                        <strong>{request.referenceNo}</strong>
                        <span>{request.customerName}</span>
                        <small>{request.productName}</small>
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          </label>

          {loading && <div className="restore-loading">Loading returns...</div>}

          {selectedRequest && (
            <div className="restore-order-summary">
              <div>
                <span>Reference No</span>
                <strong>{selectedRequest.referenceNo}</strong>
              </div>
              <div>
                <span>Customer</span>
                <strong>{selectedRequest.customerName}</strong>
              </div>
              <div className="restore-summary-wide">
                <span>Product</span>
                <strong>{selectedRequest.productName || "N/A"}</strong>
              </div>
              <div className="restore-summary-wide">
                <span>Return Reason</span>
                <strong>{selectedRequest.reason || "N/A"}</strong>
              </div>
            </div>
          )}

          <div className="restore-form-grid">
            <label className="restore-field">
              <span>Date Received for Restoration</span>
              <input
                type="date"
                value={form.receivedAt}
                onChange={(event) => handleFieldChange("receivedAt", event.target.value)}
                disabled={!selectedRequest || saving}
              />
            </label>

            <label className="restore-field">
              <span>Date Restored</span>
              <input
                type="date"
                value={form.completedAt}
                onChange={(event) => handleFieldChange("completedAt", event.target.value)}
                disabled={!selectedRequest || saving}
              />
            </label>
          </div>

          <label className="restore-field">
            <span>Restoration Description</span>
            <textarea
              value={form.description}
              onChange={(event) => handleFieldChange("description", event.target.value)}
              placeholder="Describe the work done to restore this item."
              disabled={!selectedRequest || saving}
            />
          </label>

          <div className="restore-actions">
            <button type="button" className="restore-secondary-btn" onClick={toggleRestoreOrderModal}>Close</button>
            <button
              type="submit"
              className="restore-primary-btn"
              disabled={saving || !selectedRequest || !form.receivedAt || !form.completedAt || !form.description.trim()}
            >
              {saving ? "Saving..." : "Mark as Restored"}
            </button>
          </div>
        </form>

        <aside className="restore-side">
          <section className="restore-panel">
            <div className="restore-panel-heading">
              <h2>Restore Status Tracking</h2>
              <span>{restoredHistory.length} restored</span>
            </div>
            <div className="restore-request-list">
              {restoredHistory.length === 0 ? (
                <div className="restore-empty">No items restored yet.</div>
              ) : (
                restoredHistory.map((request) => (
                  <div className="restore-request-row" key={request.id}>
                    <em className="restore-status">Restored</em>
                    <strong>{request.referenceNo}</strong>
                    <small>{request.customerName} - {request.productName}</small>
                    {request.restorationCompletedAt && (
                      <small>Restored on {request.restorationCompletedAt}</small>
                    )}
                    {request.restorationDescription && (
                      <small>{request.restorationDescription}</small>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default RestoreOrder;
