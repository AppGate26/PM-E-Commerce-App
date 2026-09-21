import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../../../Styles/Recovery/Recovery.css";
import { apiRequest } from "../../../lib/config";

const normalizeOfficer = (officer) => {
  const id = officer?.id || officer?.recoveryAgentId || "";
  const firstName = String(officer?.firstName || "").trim();
  const lastName = String(officer?.lastName || "").trim();

  return {
    id,
    name: firstName || lastName ? `${firstName} ${lastName}`.trim() : officer?.name || officer?.officerName || "N/A",
    officerId: id || "N/A",
    email: officer?.email || "N/A",
    gender: officer?.gender || "N/A",
  };
};

const readOfficerList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const SuspendedOfficers = ({ toggleSuspendedOfficersModal }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suspendedOfficers, setSuspendedOfficers] = useState([]);
  const [allOfficers, setAllOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [suspendOfficerId, setSuspendOfficerId] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [suspending, setSuspending] = useState(false);

  const [unsuspendConfirm, setUnsuspendConfirm] = useState(null);
  const [unsuspendReason, setUnsuspendReason] = useState("");
  const [unsuspending, setUnsuspending] = useState(false);

  const fetchSuspendedOfficers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest("/admin/recovery-agents/suspended", "GET");
      const officersList = readOfficerList(response).map(normalizeOfficer);
      setSuspendedOfficers(officersList);
    } catch (err) {
      setError(err?.message || "Failed to load suspended officers. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllOfficers = useCallback(async () => {
    try {
      const response = await apiRequest(
        `/admin/recovery-agents?${new URLSearchParams({ page: "1", limit: "500" })}`,
        "GET"
      );
      const officersList = readOfficerList(response).map(normalizeOfficer);
      setAllOfficers(officersList);
    } catch (err) {
      // Keep suspend form usable even if dropdown population fails
      setAllOfficers([]);
    }
  }, []);

  useEffect(() => {
    fetchSuspendedOfficers();
    fetchAllOfficers();
  }, [fetchSuspendedOfficers, fetchAllOfficers]);

  const filteredOfficers = useMemo(() => {
    if (!searchQuery.trim()) {
      return suspendedOfficers;
    }

    const query = searchQuery.toLowerCase();
    return suspendedOfficers.filter(
      (officer) =>
        officer.name.toLowerCase().includes(query) ||
        String(officer.officerId).toLowerCase().includes(query) ||
        officer.email.toLowerCase().includes(query)
    );
  }, [searchQuery, suspendedOfficers]);

  const suspendedOfficerIds = useMemo(
    () => new Set(suspendedOfficers.map((officer) => String(officer.id))),
    [suspendedOfficers]
  );

  const suspendableOfficers = useMemo(
    () => allOfficers.filter((officer) => officer.id && !suspendedOfficerIds.has(String(officer.id))),
    [allOfficers, suspendedOfficerIds]
  );

  const handleSuspendByIdentifier = async () => {
    if (!suspendOfficerId) {
      setError("Select an officer before saving.");
      return;
    }

    setSuspending(true);
    setError("");
    setSuccessMessage("");

    try {
      const targetOfficer = suspendableOfficers.find((officer) => String(officer.id) === String(suspendOfficerId));

      if (!targetOfficer || !targetOfficer.id) {
        throw new Error("Selected officer is invalid. Please select again.");
      }

      await apiRequest(`/admin/recovery-agents/${targetOfficer.id}/suspend`, "PUT", {
        reasonForSuspension: suspendReason.trim() || "Agent suspended by admin",
      });

      setSuccessMessage(`Officer ${targetOfficer.name} has been suspended successfully.`);
      setSuspendOfficerId("");
      setSuspendReason("");
      await fetchSuspendedOfficers();
      await fetchAllOfficers();
      setTimeout(() => setSuccessMessage(""), 2200);
    } catch (err) {
      setError(err?.message || "Failed to suspend recovery officer. Please try again.");
    } finally {
      setSuspending(false);
    }
  };

  const handleUnsuspend = async (officerId) => {
    setUnsuspending(true);
    setError("");
    setSuccessMessage("");

    try {
      await apiRequest(`/admin/recovery-agents/${officerId}/unsuspend`, "PUT", {
        reasonForUnblocking: unsuspendReason.trim() || "Agent unsuspended by admin",
      });

      const target = suspendedOfficers.find((item) => item.id === officerId);
      setSuspendedOfficers((prev) => prev.filter((item) => item.id !== officerId));
      setSuccessMessage(
        `Officer ${target?.name || "selected officer"} has been unsuspended successfully.`
      );
      setUnsuspendConfirm(null);
      setUnsuspendReason("");
      setTimeout(() => setSuccessMessage(""), 2200);
    } catch (err) {
      setError(err?.message || "Failed to unsuspend recovery officer. Please try again.");
      setUnsuspendConfirm(null);
    } finally {
      setUnsuspending(false);
    }
  };

  return (
    <div className="suspended-recovery-shell">
      <div className="suspended-recovery-topbar">
        <Link to="/adminDashboard" className="suspended-recovery-dashboard-btn">
          Dashboard
        </Link>
        <button type="button" className="suspended-recovery-close-btn" onClick={toggleSuspendedOfficersModal}>
          X
        </button>
      </div>

      <header className="suspended-recovery-header">
        <h1>Suspended Officers</h1>
        <p>Suspend with username or ID, and manage unsuspension records</p>
      </header>

      <section className="suspended-recovery-suspend-card">
        <h2>Suspend Officer</h2>
        <div className="suspended-recovery-suspend-grid">
          <label>
            <span>Username or Officer ID</span>
            <select value={suspendOfficerId} onChange={(event) => setSuspendOfficerId(event.target.value)}>
              <option value="">Select saved officer</option>
              {suspendableOfficers.map((officer) => (
                <option key={officer.id} value={officer.id}>
                  {officer.name} - {officer.officerId}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Reason for Suspension (Optional)</span>
            <textarea
              rows="2"
              value={suspendReason}
              onChange={(event) => setSuspendReason(event.target.value)}
              placeholder="Enter reason for suspending this officer"
            />
          </label>
          <button
            type="button"
            onClick={handleSuspendByIdentifier}
            disabled={suspending || loading || suspendableOfficers.length === 0}
          >
            {suspending ? "Saving..." : "Save"}
          </button>
        </div>
      </section>

      <div className="suspended-recovery-toolbar">
        <input
          type="text"
          className="suspended-recovery-search"
          placeholder="Search suspended officers by name, email, or officer ID"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </div>

      {error && <div className="suspended-recovery-alert suspended-recovery-alert-error">{error}</div>}
      {successMessage && (
        <div className="suspended-recovery-alert suspended-recovery-alert-success">{successMessage}</div>
      )}

      <div className="suspended-recovery-table-card">
        <div className="suspended-recovery-table-wrap">
          <table className="suspended-recovery-table">
            <thead>
              <tr>
                <th>S/N</th>
                <th>Name</th>
                <th>Officer ID</th>
                <th>Email</th>
                <th>Gender</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="suspended-recovery-empty">
                    Loading suspended officers...
                  </td>
                </tr>
              ) : filteredOfficers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="suspended-recovery-empty">
                    No suspended officers found.
                  </td>
                </tr>
              ) : (
                filteredOfficers.map((officer, index) => (
                  <tr key={officer.id || `${officer.officerId}-${index}`}>
                    <td>{index + 1}</td>
                    <td className="suspended-recovery-name">{officer.name}</td>
                    <td>{officer.officerId}</td>
                    <td>{officer.email}</td>
                    <td>{officer.gender}</td>
                    <td>
                      <button
                        type="button"
                        className="suspended-recovery-action-btn"
                        onClick={() => setUnsuspendConfirm(officer.id)}
                        disabled={unsuspending}
                      >
                        Unsuspend
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {unsuspendConfirm && (
        <div className="modal-overlay-custom" onClick={() => setUnsuspendConfirm(null)}>
          <div
            className="modal-content-custom suspended-recovery-unsuspend-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <h5>Unsuspend Recovery Officer</h5>
            <p>Are you sure you want to unsuspend this recovery officer?</p>
            <label>
              <span>Reason for Unblocking (Optional)</span>
              <textarea
                rows="3"
                value={unsuspendReason}
                onChange={(event) => setUnsuspendReason(event.target.value)}
                placeholder="Enter reason for unsuspending this officer"
              />
            </label>
            <div className="suspended-recovery-unsuspend-actions">
              <button
                type="button"
                onClick={() => {
                  setUnsuspendConfirm(null);
                  setUnsuspendReason("");
                }}
                disabled={unsuspending}
              >
                Cancel
              </button>
              <button type="button" onClick={() => handleUnsuspend(unsuspendConfirm)} disabled={unsuspending}>
                {unsuspending ? "Unsuspending..." : "Unsuspend"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuspendedOfficers;
