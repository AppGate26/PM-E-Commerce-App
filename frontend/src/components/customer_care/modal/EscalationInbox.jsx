import React, { useCallback, useEffect, useState } from "react";
import { careApi } from "../../../lib/careApi";

const DEPARTMENTS = [
  "Accounting",
  "Admin",
  "Delivery",
  "Inventory",
  "Orders",
  "Recovery",
  "Warehouse",
];

const EscalationInbox = ({ isOpen, onClose }) => {
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("OPEN");
  const [resolvingId, setResolvingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await careApi.getEscalations({ department, status });
      const rows = Array.isArray(response)
        ? response
        : response?.response || response?.data || [];
      setEscalations(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(err?.message || "Unable to load escalations.");
      setEscalations([]);
    } finally {
      setLoading(false);
    }
  }, [department, status]);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  const handleResolve = async (id) => {
    setResolvingId(id);
    try {
      await careApi.resolveEscalation(id);
      await load();
    } catch (err) {
      setError(err?.message || "Unable to resolve escalation.");
    } finally {
      setResolvingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="care-escalation-overlay">
      <div className="care-escalation-modal" style={{ maxWidth: "900px", width: "95%" }}>
        <div className="care-escalation-header">
          <div>
            <h2>Escalations Inbox</h2>
            <p>Department escalations raised from customer care. Filter and resolve them here.</p>
          </div>
          <button type="button" onClick={onClose}>x</button>
        </div>

        <div className="care-escalation-grid" style={{ marginBottom: "1rem" }}>
          <label>
            <span>Department</span>
            <select value={department} onChange={(event) => setDepartment(event.target.value)}>
              <option value="">All departments</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All</option>
              <option value="OPEN">Open</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </label>
        </div>

        {error ? <div className="care-escalation-notice">{error}</div> : null}

        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead>
              <tr>
                <th>Raised</th>
                <th>Target</th>
                <th>Department / Email</th>
                <th>Priority</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center py-3">Loading escalations...</td></tr>
              ) : escalations.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-3">No escalations found.</td></tr>
              ) : (
                escalations.map((item) => (
                  <tr key={item.id}>
                    <td>{item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}</td>
                    <td>{item.target || "-"}</td>
                    <td>{item.department || item.email || "-"}</td>
                    <td>{item.priority || "Normal"}</td>
                    <td>{item.subject || "-"}</td>
                    <td>{item.status || "OPEN"}</td>
                    <td>
                      {item.status !== "RESOLVED" ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => handleResolve(item.id)}
                          disabled={resolvingId === item.id}
                        >
                          {resolvingId === item.id ? "..." : "Resolve"}
                        </button>
                      ) : (
                        <span className="text-success">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="care-escalation-actions">
          <button type="button" onClick={load} disabled={loading}>Refresh</button>
          <button type="button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default EscalationInbox;
