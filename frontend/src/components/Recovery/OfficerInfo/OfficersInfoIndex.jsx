import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../../../Styles/Recovery/Recovery.css";
import { apiRequest } from "../../../lib/config";

const ITEMS_PER_PAGE = 10;

// Index / landing page for "Officers Info". Lists every recovery officer with
// inline actions (View, Delete) and header shortcuts to register a new officer
// or review suspended ones — so the whole officer directory lives on one page
// instead of being split across three separate dropdown modals.
const formatOfficer = (officer) => ({
  id: officer?.id || officer?.recoveryAgentId || "",
  name:
    officer?.firstName && officer?.lastName
      ? `${officer.firstName} ${officer.lastName}`
      : officer?.name || officer?.officerName || "N/A",
  officerId: officer?.id || officer?.recoveryAgentId || "N/A",
  email: officer?.email || "N/A",
  phone: officer?.phoneNumber || officer?.telephoneNo || "N/A",
  gender: officer?.gender || "N/A",
  status: officer?.status || officer?.agentStatus || "ACTIVE",
});

const OfficersInfoIndex = ({
  onClose,
  onRegister,
  onViewOfficer,
  onViewSuspended,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const hasSearch = useMemo(() => searchQuery.trim().length > 0, [searchQuery]);

  useEffect(() => {
    let mounted = true;

    const loadOfficers = async () => {
      setLoading(true);
      setError("");

      try {
        if (hasSearch) {
          const queryParams = new URLSearchParams({ query: searchQuery.trim() });
          const response = await apiRequest(
            `/admin/recovery-agents/search?${queryParams}`,
            "GET"
          );
          const list = Array.isArray(response) ? response : response?.data || [];
          if (!mounted) return;
          setOfficers(list.map(formatOfficer));
          setTotalPages(1);
          return;
        }

        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: ITEMS_PER_PAGE.toString(),
        });
        const response = await apiRequest(`/admin/recovery-agents?${queryParams}`, "GET");
        const list = Array.isArray(response) ? response : response?.data || [];
        const pagination = response?.pagination || {};
        if (!mounted) return;
        setOfficers(list.map(formatOfficer));
        setTotalPages(Math.max(1, pagination?.totalPages || 1));
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || "Failed to load recovery officers. Please try again.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadOfficers();
    return () => {
      mounted = false;
    };
  }, [currentPage, hasSearch, searchQuery]);

  useEffect(() => {
    if (hasSearch) setCurrentPage(1);
  }, [hasSearch]);

  const handleDelete = async (officerId) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest(`/admin/recovery-agents/${officerId}`, "DELETE");
      setSuccess("Recovery officer deleted successfully.");
      setDeleteConfirm(null);
      setOfficers((prev) => prev.filter((item) => item.id !== officerId));
      setTimeout(() => setSuccess(""), 1800);
    } catch (err) {
      setError(err?.message || "Failed to delete recovery officer. Please try again.");
      setDeleteConfirm(null);
    } finally {
      setLoading(false);
    }
  };

  const activeCount = officers.filter(
    (o) => String(o.status).toUpperCase() !== "SUSPENDED"
  ).length;

  const canGoPrev = !hasSearch && currentPage > 1;
  const canGoNext = !hasSearch && currentPage < totalPages;

  return (
    <div className="manage-recovery-shell">
      <div className="manage-recovery-topbar">
        <Link to="/adminDashboard" className="manage-recovery-dashboard-btn">
          Dashboard
        </Link>
        <button type="button" className="manage-recovery-close-btn" onClick={onClose}>
          X
        </button>
      </div>

      <header className="manage-recovery-header">
        <h1>Officers Info</h1>
        <p>Directory of all recovery officers — register, review, and manage from one place</p>
      </header>

      {/* Index-level actions */}
      <div
        className="manage-recovery-toolbar"
        style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}
      >
        <input
          type="text"
          className="manage-recovery-search"
          placeholder="Search by name, email, or officer ID"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          style={{ flex: "1 1 260px" }}
        />
        <button
          type="button"
          className="manage-recovery-action-btn manage-recovery-view-btn"
          onClick={() => onRegister?.()}
        >
          + Register Officer
        </button>
        <button
          type="button"
          className="manage-recovery-action-btn"
          onClick={() => onViewSuspended?.()}
        >
          Suspended Officers
        </button>
      </div>

      {error && <div className="manage-recovery-alert manage-recovery-alert-error">{error}</div>}
      {success && (
        <div className="manage-recovery-alert manage-recovery-alert-success">{success}</div>
      )}

      <div className="manage-recovery-table-card">
        <div style={{ padding: "0.5rem 1rem", color: "#5e7ca8", fontWeight: 600 }}>
          {loading ? "Loading…" : `${activeCount} officer(s) on this page`}
        </div>
        <div className="manage-recovery-table-wrap">
          <table className="manage-recovery-table">
            <thead>
              <tr>
                <th>S/N</th>
                <th>Name</th>
                <th>Officer ID</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Gender</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="manage-recovery-empty">
                    Loading officers...
                  </td>
                </tr>
              ) : officers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="manage-recovery-empty">
                    No officers found.
                  </td>
                </tr>
              ) : (
                officers.map((officer, index) => (
                  <tr key={officer.id || `${officer.officerId}-${index}`}>
                    <td>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                    <td className="manage-recovery-name">{officer.name}</td>
                    <td>{officer.officerId}</td>
                    <td>{officer.email}</td>
                    <td>{officer.phone}</td>
                    <td>{officer.gender}</td>
                    <td>{String(officer.status).toUpperCase()}</td>
                    <td>
                      <div className="manage-recovery-actions">
                        <button
                          type="button"
                          className="manage-recovery-action-btn manage-recovery-view-btn"
                          onClick={() => onViewOfficer?.(officer.id)}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="manage-recovery-action-btn manage-recovery-delete-btn"
                          onClick={() => setDeleteConfirm(officer.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!hasSearch && (
          <div className="manage-recovery-pagination">
            <button type="button" onClick={() => setCurrentPage((prev) => prev - 1)} disabled={!canGoPrev}>
              Prev
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button type="button" onClick={() => setCurrentPage((prev) => prev + 1)} disabled={!canGoNext}>
              Next
            </button>
          </div>
        )}
      </div>

      {deleteConfirm && (
        <div className="modal-overlay-custom" onClick={() => setDeleteConfirm(null)}>
          <div
            className="modal-content-custom manage-recovery-delete-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <h5>Delete Recovery Officer</h5>
            <p>Are you sure you want to delete this recovery officer? This action cannot be undone.</p>
            <div className="manage-recovery-delete-actions">
              <button type="button" onClick={() => setDeleteConfirm(null)} disabled={loading}>
                Cancel
              </button>
              <button type="button" onClick={() => handleDelete(deleteConfirm)} disabled={loading}>
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficersInfoIndex;
