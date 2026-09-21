import React, { useState } from "react";
import { apiRequest } from "../../../../lib/config";
import { FaTimes } from "react-icons/fa";
import "./DebugOrders.css";

const ENDPOINTS = [
  { label: "GET /orders/user/{userId}/new", path: (id) => `/orders/user/${id}/new` },
  { label: "GET /orders/user/{userId}", path: (id) => `/orders/user/${id}` },
  { label: "GET /orders/user/{userId}/statistics", path: (id) => `/orders/user/${id}/statistics` },
];

const DebugOrders = ({ toggleDebugOrdersModal }) => {
  const [userId, setUserId] = useState("");
  const [endpointIndex, setEndpointIndex] = useState(0);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [requestUrl, setRequestUrl] = useState("");
  const [copyLabel, setCopyLabel] = useState("COPY JSON");

  const selectedEndpoint = ENDPOINTS[endpointIndex];
  const includesPaging = endpointIndex === 0 || endpointIndex === 1;

  const handleFetch = async () => {
    const trimmedId = userId.toString().trim();
    if (!trimmedId) {
      setError("Enter a user ID first.");
      return;
    }

    let path = selectedEndpoint.path(trimmedId);
    if (includesPaging) {
      path += `?page=${page}&size=${size}`;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setRequestUrl(path);
    setCopyLabel("COPY JSON");

    try {
      const response = await apiRequest(path, "GET");
      setResult(response);
    } catch (err) {
      setError(err?.message || "Request failed.");
      // Surface whatever the backend sent back, even on error, so it can be inspected.
      if (err?.status) {
        setResult({ status: err.status, message: err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopyLabel("COPIED!");
      setTimeout(() => setCopyLabel("COPY JSON"), 1500);
    } catch {
      setCopyLabel("COPY FAILED");
      setTimeout(() => setCopyLabel("COPY JSON"), 1500);
    }
  };

  return (
    <div className="dbg-ord-content">
      <div className="dbg-ord-header">
        <h2>DEBUG: USER ORDERS RESPONSE</h2>
        <button className="close-btn" onClick={toggleDebugOrdersModal}>
          <FaTimes />
        </button>
      </div>

      <div className="dbg-ord-body">
        <div className="dbg-ord-form-row">
          <div className="dbg-ord-field">
            <label>USER ID</label>
            <input
              type="number"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. 15"
            />
          </div>

          <div className="dbg-ord-field dbg-ord-field-grow">
            <label>ENDPOINT</label>
            <select
              value={endpointIndex}
              onChange={(e) => setEndpointIndex(Number(e.target.value))}
            >
              {ENDPOINTS.map((ep, index) => (
                <option key={ep.label} value={index}>
                  {ep.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {includesPaging && (
          <div className="dbg-ord-form-row">
            <div className="dbg-ord-field">
              <label>PAGE</label>
              <input
                type="number"
                min="0"
                value={page}
                onChange={(e) => setPage(Number(e.target.value))}
              />
            </div>
            <div className="dbg-ord-field">
              <label>SIZE</label>
              <input
                type="number"
                min="1"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              />
            </div>
          </div>
        )}

        <button className="dbg-ord-fetch-btn" onClick={handleFetch} disabled={loading}>
          {loading ? "FETCHING..." : "FETCH RESPONSE"}
        </button>

        {requestUrl && (
          <p className="dbg-ord-url">
            Request: <code>{requestUrl}</code>
          </p>
        )}

        {error && (
          <div className="alert alert-error dbg-ord-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="dbg-ord-result">
            <div className="dbg-ord-result-header">
              <span>RAW RESPONSE JSON</span>
              <button className="dbg-ord-copy-btn" onClick={handleCopy}>
                {copyLabel}
              </button>
            </div>
            <textarea
              className="dbg-ord-json"
              readOnly
              value={JSON.stringify(result, null, 2)}
              onFocus={(e) => e.target.select()}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugOrders;
