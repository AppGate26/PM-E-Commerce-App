import React, { useEffect, useState } from "react";
import AdminNav from "../../Navigation/AdminNav";
import { useAuth } from "../../../../context/AuthContext";
import { apiRequest } from "../../../../lib/config";
import {
  buildActionBody,
  normalizePendingResponse,
} from "./approvalUtils";
import "./ApprovalWorkspace.css";

const ApprovalWorkspace = ({ config }) => {
  const { user } = useAuth();
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [extraState, setExtraState] = useState(config.initialExtraState || {});

  // Optional per-config hook to narrow the normalized pending list (e.g. filter by movement type).
  const applyPendingFilter = (rows) =>
    typeof config.filterPending === "function" ? config.filterPending(rows) : rows;

  useEffect(() => {
    let cancelled = false;

    const loadPendingApprovals = async () => {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      try {
        let approvals = [];
        let lastError = null;
        let resolved = false;

        for (const endpoint of config.pendingEndpoints) {
          try {
            const payload = await apiRequest(endpoint, "GET");
            approvals = applyPendingFilter(normalizePendingResponse(payload));
            resolved = true;
            break;
          } catch (requestError) {
            lastError = requestError;
          }
        }

        if (!cancelled) {
          if (!resolved && lastError) {
            setError(lastError.message || config.errors.load);
          }

          setPendingApprovals(approvals);
          setSelectedApproval((current) => {
            if (!current) return approvals[0] || null;

            return (
              approvals.find((approval) => String(approval.id) === String(current.id)) ||
              approvals[0] ||
              null
            );
          });
        }
      } catch (loadError) {
        if (!cancelled) {
          setPendingApprovals([]);
          setSelectedApproval(null);
          setError(loadError?.message || config.errors.load);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPendingApprovals();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setDeclineOpen(false);
    setDeclineReason("");
  }, [selectedApproval]);

  const reloadApprovals = async () => {
    setLoading(true);

    try {
      let approvals = [];
      let lastError = null;
      let resolved = false;

      for (const endpoint of config.pendingEndpoints) {
        try {
          const payload = await apiRequest(endpoint, "GET");
          approvals = applyPendingFilter(normalizePendingResponse(payload));
          resolved = true;
          break;
        } catch (requestError) {
          lastError = requestError;
        }
      }

      setPendingApprovals(approvals);
      setSelectedApproval(approvals[0] || null);

      if (!resolved && lastError) {
        setError(lastError.message || config.errors.load);
      }
    } catch (loadError) {
      setError(loadError?.message || config.errors.load);
      setPendingApprovals([]);
      setSelectedApproval(null);
    } finally {
      setLoading(false);
    }
  };

  const getApprovedBy = () => user?.id || user?.userId || 0;

  const handleApprove = async (approvalToApprove = selectedApproval) => {
    if (!approvalToApprove?.id) {
      setError(config.errors.select);
      return;
    }

    try {
      setActionLoading("approve");
      setError("");
      setSuccessMessage("");

      if (typeof config.approveRequest === "function") {
        await config.approveRequest({
          approval: approvalToApprove,
          approvedBy: getApprovedBy(),
          extraState,
        });
      } else {
        const requestBody = config.buildApproveBody
          ? config.buildApproveBody({
              approval: approvalToApprove,
              approvedBy: getApprovedBy(),
              extraState,
              buildActionBody,
            })
          : buildActionBody(getApprovedBy());

        await apiRequest(`/admin/approvals/${approvalToApprove.id}/approve`, "PATCH", requestBody);
      }

      setSuccessMessage(config.success.approve);
      setDeclineOpen(false);
      setDeclineReason("");
      await reloadApprovals();
    } catch (approveError) {
      setError(approveError?.message || config.errors.approve);
    } finally {
      setActionLoading("");
    }
  };

  const handleDecline = async () => {
    if (!selectedApproval?.id) {
      setError(config.errors.select);
      return;
    }

    if (!declineReason.trim()) {
      setError(config.errors.declineReason);
      return;
    }

    try {
      setActionLoading("decline");
      setError("");
      setSuccessMessage("");

      if (typeof config.declineRequest === "function") {
        await config.declineRequest({
          approval: selectedApproval,
          approvedBy: getApprovedBy(),
          extraState,
          reason: declineReason.trim(),
        });
      } else {
        const requestBody = config.buildDeclineBody
          ? config.buildDeclineBody({
              approval: selectedApproval,
              approvedBy: getApprovedBy(),
              extraState,
              declineReason: declineReason.trim(),
              buildActionBody,
            })
          : buildActionBody(getApprovedBy(), declineReason.trim());

        await apiRequest(`/admin/approvals/${selectedApproval.id}/decline`, "PATCH", requestBody);
      }

      setSuccessMessage(config.success.decline);
      setDeclineOpen(false);
      setDeclineReason("");
      await reloadApprovals();
    } catch (declineError) {
      setError(declineError?.message || config.errors.decline);
    } finally {
      setActionLoading("");
    }
  };

  const selectedSummary = selectedApproval ? config.getSummary?.(selectedApproval) : null;
  const detailSections = selectedApproval ? config.getDetailSections?.(selectedApproval) || [] : [];
  const detailTable = selectedApproval ? config.getDetailTable?.(selectedApproval) : null;
  const submittedRequest =
    selectedApproval?.requestDataParsed ||
    (selectedApproval?.requestData && typeof selectedApproval.requestData === "object"
      ? selectedApproval.requestData
      : null);

  const formatSubmittedValue = (value) => {
    if (value === undefined || value === null || value === "") return "Not available";
    if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? "" : "s"}`;
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
  };

  const submittedRequestFields = submittedRequest
    ? Object.entries(submittedRequest)
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .slice(0, 12)
    : [];

  return (
    <div className={`approval-workspace ${config.className || ""}`}>
      <AdminNav />
      <main className="approval-workspace-main">
        <section className="approval-workspace-hero">
          <div>
            <p className="approval-workspace-eyebrow">Admin Approval Queue</p>
            <h1>{config.title}</h1>
            <p>{config.description}</p>
          </div>
          <div className="approval-workspace-stat">
            <span className="approval-workspace-stat-label">Pending Items</span>
            <strong>{loading ? "..." : pendingApprovals.length}</strong>
          </div>
        </section>

        {error ? (
          <div className="approval-workspace-alert approval-workspace-alert-error">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")}>
              Close
            </button>
          </div>
        ) : null}

        {successMessage ? (
          <div className="approval-workspace-alert approval-workspace-alert-success">
            <span>{successMessage}</span>
            <button type="button" onClick={() => setSuccessMessage("")}>
              Close
            </button>
          </div>
        ) : null}

        {config.renderControls ? (
          <section className="approval-workspace-controls">
            {config.renderControls({
              selectedApproval,
              extraState,
              setExtraState,
            })}
          </section>
        ) : null}

        <section className="approval-workspace-grid">
          <div className="approval-surface">
            <header className="approval-surface-header">
              <div>
                <h2>{config.queueTitle}</h2>
                <p>{config.queueDescription}</p>
              </div>
              <div className="approval-queue-actions">
                <span className="approval-selection-badge">
                  {selectedApproval ? "1 selected" : "No selection"}
                </span>
                <button
                  type="button"
                  className="approval-table-save-btn approval-table-save-btn-outside"
                  onClick={() => handleApprove()}
                  disabled={!selectedApproval || actionLoading !== ""}
                >
                  {actionLoading === "approve"
                    ? "Saving..."
                    : config.tableActionLabel || "Save"}
                </button>
              </div>
            </header>

            <div className="approval-table-scroll">
              <table className="approval-table">
                <thead>
                  <tr>
                    {config.columns.map((column) => (
                      <th key={column.key}>{column.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={config.columns.length}>Loading pending requests...</td>
                    </tr>
                  ) : pendingApprovals.length === 0 ? (
                    <tr>
                      <td colSpan={config.columns.length}>
                        <div className="approval-empty">
                          <strong>{config.emptyState.title}</strong>
                          <p>{config.emptyState.description}</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pendingApprovals.map((approval, index) => {
                      const isActive =
                        selectedApproval && String(selectedApproval.id) === String(approval.id);

                      return (
                        <tr
                          key={approval.id || index}
                          className={isActive ? "is-active" : ""}
                          onClick={() => {
                            setSelectedApproval(approval);
                            setError("");
                            setSuccessMessage("");
                          }}
                        >
                          {config.columns.map((column) => (
                            <td key={column.key}>
                              {column.render({
                                approval,
                                index,
                                isActive,
                              })}
                            </td>
                          ))}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="approval-surface approval-details">
            <header className="approval-surface-header">
              <div>
                <h3>{config.detailsTitle}</h3>
                <p>{config.detailsDescription}</p>
              </div>
            </header>

            {selectedApproval ? (
              <>
                {selectedSummary ? (
                  <section className="approval-detail-summary">
                    <div className="approval-pill-group">
                      {(selectedSummary.badges || []).map((badge) => (
                        <span className="approval-pill" key={badge}>
                          {badge}
                        </span>
                      ))}
                    </div>
                    <h4>{selectedSummary.title}</h4>
                    {selectedSummary.subtitle ? <p>{selectedSummary.subtitle}</p> : null}
                  </section>
                ) : null}

                {detailSections.map((section) => (
                  <section className="approval-detail-section" key={section.title}>
                    <h5>{section.title}</h5>
                    <div className="approval-detail-grid">
                      {section.fields.map((field) => (
                        <div className="approval-detail-field" key={field.label}>
                          <span className="approval-detail-field-label">{field.label}</span>
                          <p
                            className={`approval-detail-field-value ${
                              !field.value || field.value === "Not available" ? "is-muted" : ""
                            }`}
                          >
                            {field.value || "Not available"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}

                {submittedRequestFields.length > 0 ? (
                  <section className="approval-detail-section approval-submitted-request">
                    <h5>Submitted Request</h5>
                    <div className="approval-detail-grid">
                      {submittedRequestFields.map(([key, value]) => (
                        <div className="approval-detail-field" key={key}>
                          <span className="approval-detail-field-label">
                            {key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase())}
                          </span>
                          <p className="approval-detail-field-value">
                            {formatSubmittedValue(value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                {detailTable ? (
                  <section className="approval-detail-section">
                    <h5>{detailTable.title}</h5>
                    <div className="approval-table-scroll" style={{ padding: 0 }}>
                      <table className="approval-detail-table">
                        <thead>
                          <tr>
                            {detailTable.columns.map((column) => (
                              <th key={column.key}>{column.label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {detailTable.rows.length === 0 ? (
                            <tr>
                              <td colSpan={detailTable.columns.length}>No line items available.</td>
                            </tr>
                          ) : (
                            detailTable.rows.map((row, index) => (
                              <tr key={row.id || index}>
                                {detailTable.columns.map((column) => (
                                  <td key={column.key}>{column.render({ row, index })}</td>
                                ))}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                ) : null}

                <section className="approval-action-panel">
                  <div className="approval-action-row">
                    <button
                      type="button"
                      className="approval-action-btn approval-action-btn-primary"
                      onClick={() => handleApprove()}
                      disabled={actionLoading !== ""}
                    >
                      {actionLoading === "approve"
                        ? config.labels.approving
                        : config.labels.approve}
                    </button>
                    <button
                      type="button"
                      className="approval-action-btn approval-action-btn-danger"
                      onClick={() => {
                        setDeclineOpen((current) => !current);
                        setError("");
                      }}
                      disabled={actionLoading !== ""}
                    >
                      {declineOpen ? "Hide Decline Form" : config.labels.decline}
                    </button>
                  </div>

                  {declineOpen ? (
                    <div className="approval-decline-box">
                      <textarea
                        rows="4"
                        placeholder={config.declinePlaceholder}
                        value={declineReason}
                        onChange={(event) => setDeclineReason(event.target.value)}
                      />
                      <div className="approval-action-row">
                        <button
                          type="button"
                          className="approval-action-btn approval-action-btn-secondary"
                          onClick={() => {
                            setDeclineOpen(false);
                            setDeclineReason("");
                          }}
                          disabled={actionLoading !== ""}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="approval-action-btn approval-action-btn-danger"
                          onClick={handleDecline}
                          disabled={actionLoading !== ""}
                        >
                          {actionLoading === "decline"
                            ? config.labels.declining
                            : config.labels.confirmDecline}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </section>
              </>
            ) : (
              <div className="approval-empty">
                <strong>Select a request</strong>
                <p>
                  Pick any pending row from the queue to review the details and approve or decline
                  it from here.
                </p>
              </div>
            )}
          </aside>
        </section>
      </main>
    </div>
  );
};

export default ApprovalWorkspace;
