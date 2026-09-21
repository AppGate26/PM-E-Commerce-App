import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import "./IgnoreCall.css";
import { Link } from "react-router-dom";
import { careApi } from "../../../../lib/careApi";
import { FaExclamationTriangle, FaRedo, FaTrash, FaUser } from "react-icons/fa";
import { MdArrowBack, MdRestore } from "react-icons/md";
import img from "../../../../assets/images/Flogo.png";

const normalizeIgnoredCall = (call, index = 0) => ({
  id: call.id || call.callId || `ignored-${Date.now()}-${index}`,
  phone: call.phone || call.phoneNumber || call.callerNumber || "Unknown",
  timeAgo: call.timeAgo || call.ignoredTimeAgo || "Now",
  rawTime: call.timestamp || call.ignoredAt || new Date().toISOString(),
  canRestore: call.canRestore !== false,
});

const IgnoreCall = () => {
  const [ignoredCalls, setIgnoredCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [workingId, setWorkingId] = useState(null);

  const fetchIgnoredCalls = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setRefreshing(true);

      const response = await careApi.getIgnoredCalls();
      const rawList = Array.isArray(response?.response)
        ? response.response
        : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];

      const normalized = rawList
        .map((call, index) => normalizeIgnoredCall(call, index))
        .sort((a, b) => new Date(b.rawTime) - new Date(a.rawTime));

      setIgnoredCalls(normalized);
      setLastUpdated(new Date());
    } catch (err) {
      toast.error(`Failed to load ignored calls: ${err?.message || "Unknown error"}`);
      setIgnoredCalls([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const restoreCall = async (call) => {
    try {
      setWorkingId(call.id);
      await careApi.restoreIgnoredCall(call.id);
      setIgnoredCalls((prev) => prev.filter((item) => item.id !== call.id));
      toast.success(`${call.phone} restored to queue`);
    } catch (err) {
      toast.error(`Failed to restore call: ${err?.message || "Unknown error"}`);
    } finally {
      setWorkingId(null);
    }
  };

  const deleteCall = async (call) => {
    const confirmDelete = window.confirm(`Delete ${call.phone} permanently?`);
    if (!confirmDelete) return;

    try {
      setWorkingId(call.id);
      await careApi.deleteCall(call.id);
      setIgnoredCalls((prev) => prev.filter((item) => item.id !== call.id));
      toast.success(`${call.phone} deleted`);
    } catch (err) {
      toast.error(`Failed to delete call: ${err?.message || "Unknown error"}`);
    } finally {
      setWorkingId(null);
    }
  };

  const clearAll = async () => {
    if (!ignoredCalls.length) return;
    const confirmClear = window.confirm(`Clear all ${ignoredCalls.length} ignored calls?`);
    if (!confirmClear) return;
    try {
      setLoading(true);
      await careApi.clearIgnoredCalls();
      setIgnoredCalls([]);
      toast.success("All ignored calls cleared");
    } catch (err) {
      toast.error(`Failed to clear calls: ${err?.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const totalCalls = useMemo(() => ignoredCalls.length, [ignoredCalls]);

  useEffect(() => {
    fetchIgnoredCalls();
    const interval = setInterval(() => fetchIgnoredCalls(true), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="ignored-page">

      <div className="ignored-shell">
        <header className="ignored-header">
          <div className="ignored-title">
            <img src={img} alt="Logo" />
            <div>
              <h2>Ignored Calls</h2>
              <p>Review, restore or delete unanswered calls</p>
            </div>
          </div>
          <div className="ignored-actions">
            <Link to="/care" className="ignored-back">
              <MdArrowBack /> Back
            </Link>
            <button type="button" className="ignored-refresh" onClick={() => fetchIgnoredCalls()} disabled={refreshing}>
              <FaRedo className={refreshing ? "spin" : ""} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </header>

        <div className="ignored-toolbar">
          <p>
            {totalCalls} call(s) ignored
            {lastUpdated ? ` • Updated ${lastUpdated.toLocaleTimeString()}` : ""}
          </p>
          <button type="button" className="ignored-clear" onClick={clearAll} disabled={!totalCalls || loading}>
            Clear All
          </button>
        </div>

        <section className="ignored-content">
          {loading && totalCalls === 0 ? (
            <div className="ignored-empty">
              <FaRedo className="spin large-icon" />
              <p>Loading ignored calls...</p>
            </div>
          ) : totalCalls === 0 ? (
            <div className="ignored-empty">
              <FaExclamationTriangle className="large-icon muted" />
              <h4>No ignored calls</h4>
              <p>All calls are currently handled</p>
            </div>
          ) : (
            <div className="ignored-list">
              {ignoredCalls.map((call) => (
                <div key={call.id} className="ignored-row">
                  <div className="caller-icon">
                    <FaUser />
                  </div>
                  <div className="caller-main">
                    <h4>{call.phone}</h4>
                    <p>{call.timeAgo}</p>
                  </div>
                  <div className="caller-btns">
                    <button
                      type="button"
                      className="btn-restore"
                      disabled={!call.canRestore || workingId === call.id}
                      onClick={() => restoreCall(call)}
                    >
                      <MdRestore />
                      {workingId === call.id ? "Working..." : "Restore"}
                    </button>
                    <button
                      type="button"
                      className="btn-delete"
                      disabled={workingId === call.id}
                      onClick={() => deleteCall(call)}
                    >
                      <FaTrash />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default IgnoreCall;
