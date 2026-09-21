import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "./callModal.css";
import img from "../../../../assets/images/caller.png";
import { careApi } from "../../../../lib/careApi";
import { FaCheckCircle, FaSyncAlt } from "react-icons/fa";
import { MdCallEnd, MdCancel, MdClose } from "react-icons/md";

const normalizeIncomingCall = (call, index = 0) => ({
  id: call.id || call.callId || `incoming-${Date.now()}-${index}`,
  name: call.name || call.callerName || call.userName || "Incoming Call",
  phone: call.phone || call.phoneNumber || call.callerNumber || "Unknown",
  image: call.image || call.profileImage || img,
  time: call.time || call.callTime || new Date().toLocaleTimeString(),
});

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const CallModal = ({ isOpen, onClose }) => {
  const [incomingCalls, setIncomingCalls] = useState([]);
  const [currentCallIndex, setCurrentCallIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [acceptingCall, setAcceptingCall] = useState(false);
  const [decliningCall, setDecliningCall] = useState(false);
  const [endingCall, setEndingCall] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [activeCallId, setActiveCallId] = useState(null);
  const [callInProgress, setCallInProgress] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [acceptedCallData, setAcceptedCallData] = useState(null);
  const [endTemplate, setEndTemplate] = useState("");
  const [endComment, setEndComment] = useState("");

  const fetchIncomingCalls = async (silent = false) => {
    if (!isOpen) return;

    try {
      if (!silent) setLoading(true);
      const response = await careApi.getIncomingCalls();
      const rawList = Array.isArray(response?.response)
        ? response.response
        : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];

      const normalized = rawList.map((call, index) => normalizeIncomingCall(call, index));
      setIncomingCalls(normalized);

      if (normalized.length > 0 && currentCallIndex >= normalized.length) {
        setCurrentCallIndex(0);
      }
      setLastUpdated(new Date());
    } catch (err) {
      toast.error(`Failed to load incoming calls: ${err?.message || "Unknown error"}`);
      setIncomingCalls([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptCall = async () => {
    const currentCall = incomingCalls[currentCallIndex];
    if (!currentCall) return;

    try {
      setAcceptingCall(true);
      await careApi.acceptCall(currentCall.id);

      setAcceptedCallData(currentCall);
      setActiveCallId(currentCall.id);
      setCallInProgress(true);
      setCallDuration(0);
      setEndTemplate("");
      setEndComment("");

      const updatedCalls = incomingCalls.filter((_, index) => index !== currentCallIndex);
      setIncomingCalls(updatedCalls);
      setCurrentCallIndex(Math.min(currentCallIndex, Math.max(0, updatedCalls.length - 1)));
      toast.success(`Call with ${currentCall.name} accepted`);
    } catch (err) {
      toast.error(`Failed to accept call: ${err?.message || "Unknown error"}`);
    } finally {
      setAcceptingCall(false);
    }
  };

  const handleDeclineCall = async () => {
    const currentCall = incomingCalls[currentCallIndex];
    if (!currentCall) return onClose();

    try {
      setDecliningCall(true);
      await careApi.declineCall(currentCall.id);
      toast.info(`Call from ${currentCall.name} declined`);
    } catch (err) {
      toast.error(`Failed to decline call: ${err?.message || "Unknown error"}`);
    } finally {
      const updatedCalls = incomingCalls.filter((_, index) => index !== currentCallIndex);
      setIncomingCalls(updatedCalls);
      if (updatedCalls.length === 0) onClose();
      setCurrentCallIndex(Math.min(currentCallIndex, Math.max(0, updatedCalls.length - 1)));
      setDecliningCall(false);
    }
  };

  const handleEndCall = async () => {
    if (!activeCallId) return;
    if (!endTemplate) {
      toast.warning("Please select an end-call reason");
      return;
    }

    try {
      setEndingCall(true);
      await careApi.endCall(activeCallId, { template: endTemplate, comment: endComment || "" });
      setCallInProgress(false);
      setActiveCallId(null);
      setAcceptedCallData(null);
      setCallDuration(0);
      setEndTemplate("");
      setEndComment("");
      toast.success("Call ended successfully");
      if (!incomingCalls.length) onClose();
    } catch (err) {
      toast.error(`Failed to end call: ${err?.message || "Unknown error"}`);
    } finally {
      setEndingCall(false);
    }
  };

  const handleCloseAll = () => {
    const shouldClose = window.confirm("Close this panel and ignore all incoming calls?");
    if (!shouldClose) return;
    setIncomingCalls([]);
    onClose();
  };

  const handleCloseModal = () => {
    if (callInProgress) {
      const shouldClose = window.confirm("You have an active call. Close panel?");
      if (!shouldClose) return;
    }
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    fetchIncomingCalls();
    const interval = setInterval(() => fetchIncomingCalls(true), 10000);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    let interval;
    if (callInProgress) {
      interval = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [callInProgress]);

  useEffect(() => {
    const onEsc = (event) => {
      if (event.key === "Escape" && isOpen) handleCloseModal();
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [isOpen, callInProgress]);

  if (!isOpen) return null;

  const currentCall = incomingCalls[currentCallIndex] || null;
  const totalCalls = incomingCalls.length;

  return (
    <>

      <div className="incoming-overlay" onClick={(event) => event.target.classList.contains("incoming-overlay") && handleCloseModal()}>
        <div className="incoming-modal">
          <button type="button" className="incoming-close" onClick={handleCloseModal}>
            <MdClose />
          </button>

          <header className={`incoming-header ${callInProgress ? "active" : ""}`}>
            <h3>{callInProgress ? "Active Call" : "Incoming Call"}</h3>
            {callInProgress ? (
              <p>Duration: {formatDuration(callDuration)}</p>
            ) : (
              <p>
                {totalCalls} call(s) waiting
                {lastUpdated ? ` • Updated ${lastUpdated.toLocaleTimeString()}` : ""}
              </p>
            )}
          </header>

          <div className="incoming-body">
            {loading && !callInProgress && totalCalls === 0 ? (
              <div className="incoming-empty">
                <FaSyncAlt className="spin" />
                <p>Checking incoming calls...</p>
              </div>
            ) : !callInProgress && totalCalls === 0 ? (
              <div className="incoming-empty">
                <MdCancel className="big-icon muted" />
                <h4>No incoming calls</h4>
                <button type="button" className="action-light" onClick={() => fetchIncomingCalls()}>
                  <FaSyncAlt /> Check Again
                </button>
              </div>
            ) : callInProgress ? (
              <div className="incoming-active">
                <img src={acceptedCallData?.image || img} alt={acceptedCallData?.name || "Caller"} />
                <h4>{acceptedCallData?.name || "Customer"}</h4>
                <p>{acceptedCallData?.phone || "Unknown"}</p>

                <div className="end-form">
                  <label htmlFor="end-template">End Call Reason</label>
                  <select id="end-template" value={endTemplate} onChange={(event) => setEndTemplate(event.target.value)}>
                    <option value="">Select reason</option>
                    <option value="issue_resolved">Issue Resolved</option>
                    <option value="customer_satisfied">Customer Satisfied</option>
                    <option value="callback_needed">Callback Needed</option>
                    <option value="escalated">Escalated</option>
                    <option value="technical_issue">Technical Issue</option>
                    <option value="default">Default</option>
                  </select>

                  <label htmlFor="end-comment">Note</label>
                  <textarea
                    id="end-comment"
                    value={endComment}
                    onChange={(event) => setEndComment(event.target.value)}
                    placeholder="Optional comments"
                    rows={3}
                  />

                  <button type="button" className="action-danger" onClick={handleEndCall} disabled={endingCall || !endTemplate}>
                    <MdCallEnd />
                    {endingCall ? "Ending..." : "End Call"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="incoming-pending">
                <img src={currentCall.image} alt={currentCall.name} />
                <h4>{currentCall.name}</h4>
                <p>{currentCall.phone}</p>
                <small>{currentCall.time}</small>

                {totalCalls > 1 && (
                  <div className="incoming-nav">
                    <button type="button" onClick={() => setCurrentCallIndex((prev) => Math.max(0, prev - 1))} disabled={currentCallIndex === 0}>
                      Previous
                    </button>
                    <span>{currentCallIndex + 1} / {totalCalls}</span>
                    <button
                      type="button"
                      onClick={() => setCurrentCallIndex((prev) => Math.min(totalCalls - 1, prev + 1))}
                      disabled={currentCallIndex === totalCalls - 1}
                    >
                      Next
                    </button>
                  </div>
                )}

                <div className="incoming-actions">
                  <button type="button" className="action-success" onClick={handleAcceptCall} disabled={acceptingCall}>
                    <FaCheckCircle />
                    {acceptingCall ? "Accepting..." : "Accept"}
                  </button>
                  <button type="button" className="action-danger" onClick={handleDeclineCall} disabled={decliningCall}>
                    <MdCancel />
                    {decliningCall ? "Declining..." : "Decline"}
                  </button>
                </div>

                <div className="incoming-footer">
                  <button type="button" className="action-light" onClick={() => fetchIncomingCalls()} disabled={loading}>
                    <FaSyncAlt className={loading ? "spin" : ""} />
                    Refresh
                  </button>
                  <button type="button" className="action-light warn" onClick={handleCloseAll}>
                    Ignore All
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CallModal;
