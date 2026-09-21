import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import "./queues.css";
import { Link } from "react-router-dom";
import { FaPhoneAlt, FaSearch, FaSyncAlt, FaUserClock } from "react-icons/fa";
import { MdArrowBack } from "react-icons/md";
import { careApi } from "../../../lib/careApi";

const normalizeQueueCall = (call, index = 0) => ({
  id: call.id || call.callId || `queue-${Date.now()}-${index}`,
  name: call.name || call.callerName || call.userName || "Waiting Caller",
  phone: call.phone || call.phoneNumber || call.callerNumber || "N/A",
  time: call.time || call.queueTime || call.waitingSince || new Date().toLocaleTimeString(),
  duration: Number(call.duration || call.waitTime || 0),
  position: Number(call.position || call.queuePosition || index + 1),
});

const QueueCalls = () => {
  const [queueCalls, setQueueCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [answeringId, setAnsweringId] = useState(null);

  const fetchQueueCalls = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setRefreshing(true);

      const response = await careApi.getQueueCalls();
      const rawList = Array.isArray(response?.response)
        ? response.response
        : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];

      const normalized = rawList
        .map((call, index) => normalizeQueueCall(call, index))
        .sort((a, b) => a.position - b.position);

      setQueueCalls(normalized);
      setLastUpdated(new Date());
    } catch (err) {
      toast.error(`Failed to load queue calls: ${err?.message || "Unknown error"}`);
      setQueueCalls([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAnswerCall = async (call) => {
    try {
      setAnsweringId(call.id);
      await careApi.acceptCall(call.id);
      setQueueCalls((prev) => prev.filter((item) => item.id !== call.id));
      toast.success(`${call.name} answered successfully`);
    } catch (err) {
      toast.error(`Failed to answer call: ${err?.message || "Unknown error"}`);
    } finally {
      setAnsweringId(null);
    }
  };

  const filteredCalls = useMemo(() => {
    const text = searchTerm.trim().toLowerCase();
    if (!text) return queueCalls;
    return queueCalls.filter(
      (call) => call.name.toLowerCase().includes(text) || call.phone.toLowerCase().includes(text)
    );
  }, [queueCalls, searchTerm]);

  useEffect(() => {
    fetchQueueCalls();
    const interval = setInterval(() => fetchQueueCalls(true), 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="queue-page">

      <div className="queue-shell">
        <header className="queue-header">
          <div className="queue-header-left">
            <Link to="/care" className="queue-back">
              <MdArrowBack /> Back
            </Link>
            <h2>Phone Support Queue</h2>
          </div>
          <button type="button" className="queue-refresh" onClick={() => fetchQueueCalls()} disabled={refreshing}>
            <FaSyncAlt className={refreshing ? "spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        <div className="queue-toolbar">
          <div className="queue-search">
            <FaSearch />
            <input
              type="text"
              placeholder="Search caller name or phone"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <p className="queue-meta">
            {queueCalls.length} call(s) waiting
            {lastUpdated ? ` • Updated ${lastUpdated.toLocaleTimeString()}` : ""}
          </p>
        </div>

        <div className="queue-summary">
          <div className="summary-card">
            <FaUserClock />
            <div>
              <strong>{queueCalls.length}</strong>
              <span>In Queue</span>
            </div>
          </div>
          <div className="summary-card">
            <FaPhoneAlt />
            <div>
              <strong>{queueCalls.length * 3} mins</strong>
              <span>Estimated Wait</span>
            </div>
          </div>
        </div>

        <section className="queue-content">
          {loading && queueCalls.length === 0 ? (
            <div className="queue-empty">
              <FaSyncAlt className="spin large-icon" />
              <p>Loading call queue...</p>
            </div>
          ) : filteredCalls.length === 0 ? (
            <div className="queue-empty">
              <FaPhoneAlt className="large-icon muted" />
              <h4>Queue is empty</h4>
              <p>{searchTerm ? "No match for your search" : "No calls waiting currently"}</p>
            </div>
          ) : (
            <div className="queue-list">
              {filteredCalls.map((call, index) => {
                const isNext = index === 0;
                return (
                  <div key={call.id} className={`queue-row ${isNext ? "next" : ""}`}>
                    <div className="queue-position">#{call.position || index + 1}</div>
                    <div className="queue-main">
                      <h4>{call.name}</h4>
                      <p>{call.phone}</p>
                    </div>
                    <div className="queue-time">
                      <span>{call.time}</span>
                      <small>Wait: {call.duration}s</small>
                    </div>
                    <button
                      type="button"
                      className="queue-answer"
                      disabled={!isNext || answeringId === call.id}
                      onClick={() => handleAnswerCall(call)}
                    >
                      {answeringId === call.id ? "Answering..." : "Answer"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default QueueCalls;
