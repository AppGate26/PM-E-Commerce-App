import React, { useEffect, useMemo, useState } from "react";
import "./care.css";
import CallModal from "./modal/incomingCall/CallModal";
import icon1 from "../../assets/images/call.png";
import icon2 from "../../assets/images/play.png";
import icon3 from "../../assets/images/message.png";
import { Link, useNavigate } from "react-router-dom";
import { FaSyncAlt } from "react-icons/fa";
import { careApi } from "../../lib/careApi";

const extractArray = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  const root = payload.response ?? payload.data ?? payload.content ?? payload.items;
  if (Array.isArray(root)) return root;

  if (root && typeof root === "object") {
    const nested =
      root.content ||
      root.items ||
      root.data ||
      root.calls ||
      root.emails ||
      root.chats ||
      root.records;
    if (Array.isArray(nested)) return nested;
  }

  const firstArray = Object.values(payload).find((value) => Array.isArray(value));
  return Array.isArray(firstArray) ? firstArray : [];
};

const extractCount = (payload, keys = []) => {
  const root = payload?.response ?? payload?.data ?? payload ?? {};

  for (const key of keys) {
    const value = String(key).split(".").reduce((currentValue, pathPart) => {
      if (currentValue === null || currentValue === undefined) return undefined;
      return currentValue[pathPart];
    }, root);

    if (value !== undefined && value !== null && value !== "") {
      return Number(value) || 0;
    }
  }

  return extractArray(payload).length;
};

const CareTab = () => {
  const navigate = useNavigate();
  const [isIncomingCallModalOpen, setIncomingCallModalOpen] = useState(false);
  const [counts, setCounts] = useState({
    liveChat: 0,
    email: 0,
    incomingCalls: 0,
    queueCalls: 0,
    ignoredCalls: 0,
  });
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [refreshingCounts, setRefreshingCounts] = useState(false);
  const [countError, setCountError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const phoneSupportCount = useMemo(
    () => counts.incomingCalls + counts.queueCalls + counts.ignoredCalls,
    [counts.incomingCalls, counts.queueCalls, counts.ignoredCalls]
  );

  const fetchSupportCounts = async (silent = false) => {
    try {
      if (!silent) setLoadingCounts(true);
      setRefreshingCounts(true);
      setCountError("");

      const [chatCountResult, emailResult, incomingResult, queueResult, ignoredResult] =
        await Promise.allSettled([
          careApi.getChatsCount(),
          careApi.getEmails(0, 20),
          careApi.getIncomingCalls(),
          careApi.getQueueCalls(),
          careApi.getIgnoredCalls(),
        ]);

      const nextCounts = {
        liveChat:
          chatCountResult.status === "fulfilled"
            ? extractCount(chatCountResult.value, ["activeChats", "active", "unread", "count", "total"])
            : 0,
        email:
          emailResult.status === "fulfilled"
            ? extractCount(emailResult.value, [
                "totalItems",
                "totalElements",
                "total",
                "count",
                "data.totalItems",
                "data.totalElements",
                "response.totalItems",
                "response.totalElements",
              ])
            : 0,
        incomingCalls:
          incomingResult.status === "fulfilled" ? extractArray(incomingResult.value).length : 0,
        queueCalls:
          queueResult.status === "fulfilled" ? extractArray(queueResult.value).length : 0,
        ignoredCalls:
          ignoredResult.status === "fulfilled" ? extractArray(ignoredResult.value).length : 0,
      };

      setCounts(nextCounts);
      setLastUpdated(new Date());

      const failedResults = [chatCountResult, emailResult, incomingResult, queueResult, ignoredResult]
        .filter((result) => result.status === "rejected");
      if (failedResults.length > 0) {
        setCountError("Some support counts could not be loaded.");
      }
    } catch (error) {
      setCountError(error?.message || "Unable to load support counts.");
    } finally {
      setLoadingCounts(false);
      setRefreshingCounts(false);
    }
  };

  const openIncomingCallModal = () => setIncomingCallModalOpen(true);
  const openQueueCalls = () => navigate("/queues");
  const openIgnoredCalls = () => navigate("/ignore-calls");
  const closeIncomingCallModal = () => {
    setIncomingCallModalOpen(false);
    fetchSupportCounts(true);
  };

  useEffect(() => {
    fetchSupportCounts();
    const interval = setInterval(() => fetchSupportCounts(true), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container care-section md-container-care">
      <div className="care-shell">
        <div className="care-headline">
          <h1 className="text-center care-header">CUSTOMER CARE SUPPORT</h1>
          <p className="text-center care-subline">
            Always supporting our customers across chat, email and phone channels
          </p>
          <div className="care-status-row">
            <span>
              {loadingCounts
                ? "Loading backend support counts..."
                : lastUpdated
                ? `Live backend counts updated ${lastUpdated.toLocaleTimeString()}`
                : "Live backend counts ready"}
            </span>
            <button
              type="button"
              className="care-refresh-btn"
              onClick={() => fetchSupportCounts()}
              disabled={refreshingCounts}
            >
              <FaSyncAlt className={refreshingCounts ? "spin" : ""} />
              {refreshingCounts ? "Refreshing" : "Refresh"}
            </button>
          </div>
          {countError && <div className="care-count-error">{countError}</div>}
        </div>

        <div className="care-grid">
          <div className="care-option">
            <Link to="/chat" className="text-decoration-none care-option-link">
              <div className="care-icon-wrap">
                <img src={icon2} alt="Live chat icon" className="care-icons" />
              </div>
              <h2>
                LIVE CHAT <span className="ms-1">{counts.liveChat}</span>
              </h2>
              <p className="care-summary">Respond to a client on live chat</p>
              <div className="care-bottom-option">
                <h5 className="text-white fw-semibold">Open Live Chat Desk</h5>
              </div>
            </Link>
          </div>

          <div className="care-option">
            <Link to="/email-support" className="text-decoration-none care-option-link">
              <div className="care-icon-wrap">
                <img src={icon3} alt="Email support icon" className="care-icons" />
              </div>
              <h2>
                E-MAIL SUPPORT <span className="ms-1">{counts.email}</span>
              </h2>
              <p className="care-summary">Respond to client issues via email support</p>
              <div className="care-bottom-option">
                <h5 className="text-white fw-semibold">Open Email Support Desk</h5>
              </div>
            </Link>
          </div>

          <div className="care-option care-phone-option">
            <div className="care-option-link care-phone-card">
              <div className="care-icon-wrap">
                <img src={icon1} alt="Phone support icon" className="care-icons" />
              </div>
              <h2>
                PHONE SUPPORT <span className="ms-1">{phoneSupportCount}</span>
              </h2>
              <p className="care-summary">Respond to clients via phone support</p>
              <div className="care-phone-actions">
                <button type="button" className="care-phone-action" onClick={openIncomingCallModal}>
                  <span>Incoming</span>
                  <strong>{counts.incomingCalls}</strong>
                </button>
                <button type="button" className="care-phone-action" onClick={openQueueCalls}>
                  <span>Queues</span>
                  <strong>{counts.queueCalls}</strong>
                </button>
                <button type="button" className="care-phone-action" onClick={openIgnoredCalls}>
                  <span>Ignored</span>
                  <strong>{counts.ignoredCalls}</strong>
                </button>
              </div>
              <div className="care-bottom-option care-phone-stripe">
                <h5 className="text-white fw-semibold">Manage Incoming And Queued Calls</h5>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call Modal */}
      <CallModal
        isOpen={isIncomingCallModalOpen}
        onClose={closeIncomingCallModal}
      /> 
    </div>
  );
};

export default CareTab;
