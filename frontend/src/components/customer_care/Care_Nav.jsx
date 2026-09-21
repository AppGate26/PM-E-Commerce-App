import React, { useEffect, useState } from "react";
import "./care.css";
import logo from "../../assets/images/PMlogo.png";
import CareSocialMediaModal from "./modal/socialMedia";
import ReceivedCallsModal from "./modal/report/ReceivedCallsModal ";
import UnansweredCallModal from "./modal/report/UnansweredCallsModal";
import SupportChannelReportModal from "./modal/report/SupportChannelReportModal";
import CallLogModal from "./modal/CallLog";
import { TfiMenu } from "react-icons/tfi";
import { Link } from "react-router-dom";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { FaChartBar, FaExclamationTriangle, FaHeadset, FaPhoneAlt } from "react-icons/fa";
import "../../Styles/ModuleStandard.css";
import { useAuth } from "../../context/AuthContext";
import ModuleUserChip from "../shared/ModuleUserChip";
import { careApi } from "../../lib/careApi";
import { fetchAdminUsers } from "../../lib/adminApi";
import { sendMessengerMessage } from "../../lib/messengerApi";
import EscalationInbox from "./modal/EscalationInbox";

// Build a readable name for an escalation-target user from whatever the users
// endpoint returns.
const userDisplayName = (u = {}) =>
  [u.firstName, u.lastName || u.surname].filter(Boolean).join(" ").trim() ||
  u.fullName ||
  u.name ||
  u.username ||
  u.email ||
  `User ${u.id}`;

const Care_Nav = () => {
  const { user } = useAuth();
  const [isSocialMediaModalOpen, setIsSocialMediaModalOpen] = useState(false);
  const [isUnansweredCallModal, setIsUnansweredCallModal] = useState(false);
  const [isReceivedCallsModalOpen, setIsReceivedCallsModalOpen] = useState(false);
  const [isCallLogModalOpen, setIsCallLogModalOpen] = useState(false);
  const [supportReportType, setSupportReportType] = useState(null);
  const [isReportDropdownOpen, setIsReportDropdownOpen] = useState(false);
  const [isEscalationDropdownOpen, setIsEscalationDropdownOpen] = useState(false);
  const [escalationTarget, setEscalationTarget] = useState(null);
  const [escalationForm, setEscalationForm] = useState({
    department: "",
    userId: "",
    email: "",
    priority: "Normal",
    subject: "",
    details: "",
  });
  const [escalationNotice, setEscalationNotice] = useState("");
  const [escalationSubmitting, setEscalationSubmitting] = useState(false);
  const [isEscalationInboxOpen, setIsEscalationInboxOpen] = useState(false);
  // Users an escalation can be routed to (Care #1: escalate to a named user, not
  // just a department). Loaded lazily; empty if the caller can't list users.
  const [escalationUsers, setEscalationUsers] = useState([]);

  useEffect(() => {
    let active = true;
    fetchAdminUsers()
      .then((rows) => {
        if (active) setEscalationUsers(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (active) setEscalationUsers([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const openSocialMediaModal = () => setIsSocialMediaModalOpen(true);
  const closeSocialMediaModal = () => setIsSocialMediaModalOpen(false);

  const openReceivedCallsModal = () => setIsReceivedCallsModalOpen(true);
  const closeReceivedCallsModal = () => setIsReceivedCallsModalOpen(false);

  const openUnansweredCallModal = () => setIsUnansweredCallModal(true);
  const closeUnansweredCallModal = () => setIsUnansweredCallModal(false);

  const openCallLogModal = () => setIsCallLogModalOpen(true);
  const closeCallLogModal = () => setIsCallLogModalOpen(false);
  const openEmailReportModal = () => setSupportReportType("email");
  const openLiveChatReportModal = () => setSupportReportType("chat");
  const closeSupportReportModal = () => setSupportReportType(null);

  const toggleReportDropdown = () => {
    setIsReportDropdownOpen((prev) => !prev);
  };

  const toggleEscalationDropdown = () => {
    setIsEscalationDropdownOpen((prev) => !prev);
  };

  const openEscalationModal = (target) => {
    setEscalationTarget(target);
    setIsEscalationDropdownOpen(false);
    setEscalationNotice("");
  };

  const closeEscalationModal = () => {
    setEscalationTarget(null);
    setEscalationNotice("");
  };

  const updateEscalationForm = (field, value) => {
    setEscalationForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitEscalation = async (event) => {
    event.preventDefault();
    // "Department" escalations now target a named user (Care #1).
    const needsUser = escalationTarget === "department" && !escalationForm.userId;
    const needsEmail = escalationTarget === "email" && !escalationForm.email;
    if (needsUser || needsEmail || !escalationForm.subject || !escalationForm.details) {
      setEscalationNotice("Complete all required escalation fields.");
      return;
    }

    setEscalationSubmitting(true);
    setEscalationNotice("");
    try {
      const selectedUser =
        escalationTarget === "department"
          ? escalationUsers.find(
              (u) => String(u.id) === String(escalationForm.userId)
            )
          : null;

      await careApi.createEscalation({
        target: escalationTarget === "department" ? "DEPARTMENT" : "EMAIL",
        // Record who it was routed to so it is traceable in the inbox.
        department: selectedUser ? userDisplayName(selectedUser) : null,
        assignedToUserId: selectedUser ? selectedUser.id : null,
        email:
          escalationTarget === "email"
            ? escalationForm.email
            : selectedUser?.email || null,
        priority: escalationForm.priority,
        subject: escalationForm.subject,
        details: escalationForm.details,
        raisedBy: user?.email || user?.name || "Customer Care",
      });

      // Deliver the escalation straight to the chosen user's internal inbox so it
      // actually reaches them (Care #1: "message should be sent to that user").
      if (selectedUser?.id) {
        try {
          await sendMessengerMessage(
            selectedUser.id,
            `[Escalation - ${escalationForm.priority}] ${escalationForm.subject}\n\n${escalationForm.details}`
          );
        } catch (messageError) {
          console.error("Escalation message delivery failed:", messageError);
        }
      }

      setEscalationNotice(
        escalationTarget === "department"
          ? `Escalation sent to ${selectedUser ? userDisplayName(selectedUser) : "the user"}.`
          : "Escalation sent to the email address."
      );
      window.setTimeout(() => {
        setEscalationForm({
          department: "",
          userId: "",
          email: "",
          priority: "Normal",
          subject: "",
          details: "",
        });
        closeEscalationModal();
      }, 1200);
    } catch (error) {
      setEscalationNotice(error?.message || "Unable to send escalation. Please try again.");
    } finally {
      setEscalationSubmitting(false);
    }
  };
  
  const closeOffcanvas = () => {
    const offcanvasElement = document.getElementById("offcanvasResponsive");
    const offcanvasInstance = bootstrap.Offcanvas.getInstance(offcanvasElement);
    if (offcanvasInstance) {
      offcanvasInstance.hide();
    }
  };

  const handleClick = (action) => {
    action();
    closeOffcanvas();
  };
  
  return (
    <>
      <div className="care-mobile-bar d-md-none d-flex justify-content-between align-items-center">
        <Link to="/adminDashboard">
          <img src={logo} alt="logo" className="hub-logo" />
        </Link>

        <button
          className="btn btn-primary d-md-none"
          id="menu-bar-sm"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#offcanvasResponsive"
          aria-controls="offcanvasResponsive"
        >
          <TfiMenu size="28px" />
        </button>
      </div>
      <div className="care-nav">
        <div className="care-brand">
          <Link to="/adminDashboard" className="care-brand-link">
            <img src={logo} alt="pm logo" className="care-logo" />
            <div className="care-brand-copy">
              <span className="care-brand-title">Customer Care</span>
              <span className="care-brand-subtitle">Support command center</span>
            </div>
          </Link>
        </div>
        <div className="d-flex align-items-center justify-content-between care-links">
          <button type="button" className="care-nav-link" onClick={openSocialMediaModal}>
            <FaHeadset />
            <span>Social Media</span>
          </button>
          <button type="button" className="care-nav-link" onClick={openCallLogModal}>
            <FaPhoneAlt />
            <span>Call Log</span>
          </button>
          <div className="report-container">
            <button
              type="button"
              className="care-nav-link"
              onClick={toggleEscalationDropdown}
            >
              <FaExclamationTriangle />
              <span>Escalation</span>
            </button>
            <div
              className={`care-report-dropdown ${isEscalationDropdownOpen ? "open" : ""}`}
            >
              <ul>
                <li onClick={() => openEscalationModal("department")}>to departments</li>
                <li onClick={() => openEscalationModal("email")}>to emails</li>
                <li
                  onClick={() => {
                    setIsEscalationDropdownOpen(false);
                    setIsEscalationInboxOpen(true);
                  }}
                >
                  view inbox
                </li>
              </ul>
            </div>
          </div>
          <div className="report-container">
            <button
              type="button"
              className="care-nav-link report-care"
              onClick={toggleReportDropdown}
            >
              <FaChartBar />
              <span>Report</span>
            </button>
            <div
              className={`care-report-dropdown ${isReportDropdownOpen ? "open" : ""}`}
            >
              <ul>
                <li onClick={openReceivedCallsModal}>RECEIVED calls</li>
                <li onClick={openUnansweredCallModal}>unanswered calls</li>
                <li onClick={openEmailReportModal}>email support</li>
                <li onClick={openLiveChatReportModal}>live chat</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="care-nav-actions">
          <ModuleUserChip user={user} />
          <button className="Login-btn logout-btn-size">Log Out</button>
        </div>
      </div>
      <div
        className="offcanvas offcanvas-end"
        tabIndex="-1"
        id="offcanvasResponsive"
        aria-labelledby="offcanvasResponsiveLabel"
      >
        <div className="offcanvas-header d-flex justify-content-between bg-primary">
          <div className="">
            <IoIosCloseCircleOutline
              size="40px"
              color="#ffffffde"
              data-bs-dismiss="offcanvas"
              data-bs-target="#offcanvasResponsive"
              aria-label="Close"
            />
          </div>
          <Link to="/adminDashboard">
            <img
              src={logo}
              alt="logo"
              style={{ width: "40px", height: "40px" }}
            />
          </Link>
        </div>
        <div className="offcanvas-body offcanvas-body-inventory">
          <h3
            className="fw-semibold m-4"
            onClick={() => handleClick(openSocialMediaModal)}
          >
            Social Media
          </h3>
          <h3
            className="fw-semibold m-4"
            onClick={() => handleClick(openCallLogModal)}
          >
            Call Log
          </h3>
          <div className="accordion accordion-flush" id="escalationAccordion">
            <div className="accordion-item">
              <h2 className="accordion-header">
                <button
                  className="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#flush-escalation"
                  aria-expanded="false"
                  aria-controls="flush-escalation"
                >
                  <div className="me-5">Escalation</div>
                </button>
              </h2>
              <div
                id="flush-escalation"
                className="accordion-collapse collapse"
                data-bs-parent="#escalationAccordion"
              >
                <div className="accordion-body bg-white">
                  <h5 onClick={() => handleClick(() => openEscalationModal("department"))}>
                    TO DEPARTMENTS
                  </h5>
                  <br />
                  <h5 onClick={() => handleClick(() => openEscalationModal("email"))}>
                    TO EMAILS
                  </h5>
                </div>
              </div>
            </div>
          </div>
          <div className="accordion accordion-flush" id="accordionFlushExample">
            <div className="accordion-item">
              <h2 className="accordion-header">
                <button
                  className="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#flush-collapseOne"
                  aria-expanded="false"
                  aria-controls="flush-collapseOne"
                >
                  <div className="me-5">Report</div>
                </button>
              </h2>
              <div
                id="flush-collapseOne"
                className="accordion-collapse collapse"
                data-bs-parent="#accordionFlushExample"
              >
                <div className="accordion-body bg-white">
                  <h5 onClick={() => handleClick(openReceivedCallsModal)}>
                    RECEIVED CALLS
                  </h5>
                  <br />
                  <h5 onClick={() => handleClick(openUnansweredCallModal)}>
                    UNANSWERED CALLS
                  </h5>
                  <br />
                  <h5 onClick={() => handleClick(openEmailReportModal)}>
                    EMAIL SUPPORT
                  </h5>
                  <br />
                  <h5 onClick={() => handleClick(openLiveChatReportModal)}>
                    LIVE CHAT
                  </h5>
                </div>
              </div>
            </div>
          </div>
          <Link to="/">
            <button className="btn btn-primary fs-3 px-4 fw-semibold mt-5">
              Log Out
            </button>
          </Link>
        </div>
      </div>
      {/* Modals */}
      <CareSocialMediaModal
        isOpen={isSocialMediaModalOpen}
        onClose={closeSocialMediaModal}
      />
      <ReceivedCallsModal
        isOpen={isReceivedCallsModalOpen}
        onClose={closeReceivedCallsModal}
      />
      <UnansweredCallModal
        isOpen={isUnansweredCallModal}
        onClose={closeUnansweredCallModal}
      />
      <CallLogModal
        isOpen={isCallLogModalOpen}
        onClose={closeCallLogModal}
      />
      <SupportChannelReportModal
        isOpen={Boolean(supportReportType)}
        onClose={closeSupportReportModal}
        type={supportReportType}
      />
      {escalationTarget ? (
        <div className="care-escalation-overlay">
          <form className="care-escalation-modal" onSubmit={submitEscalation}>
            <div className="care-escalation-header">
              <div>
                <h2>{escalationTarget === "department" ? "Escalate To Department" : "Escalate To Email"}</h2>
                <p>Route customer care issues to the right resolution channel.</p>
              </div>
              <button type="button" onClick={closeEscalationModal}>x</button>
            </div>

            {escalationNotice ? <div className="care-escalation-notice">{escalationNotice}</div> : null}

            <div className="care-escalation-grid">
              {escalationTarget === "department" ? (
                <label>
                  <span>Send To (User) *</span>
                  <select
                    value={escalationForm.userId}
                    onChange={(event) => updateEscalationForm("userId", event.target.value)}
                  >
                    <option value="">
                      {escalationUsers.length === 0
                        ? "No users available"
                        : "Select user"}
                    </option>
                    {escalationUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {userDisplayName(u)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label>
                  <span>Email *</span>
                  <input
                    type="email"
                    value={escalationForm.email}
                    onChange={(event) => updateEscalationForm("email", event.target.value)}
                    placeholder="department@example.com"
                  />
                </label>
              )}

              <label>
                <span>Priority</span>
                <select
                  value={escalationForm.priority}
                  onChange={(event) => updateEscalationForm("priority", event.target.value)}
                >
                  <option>Normal</option>
                  <option>High</option>
                  <option>Urgent</option>
                </select>
              </label>

              <label className="span-two">
                <span>Subject *</span>
                <input
                  value={escalationForm.subject}
                  onChange={(event) => updateEscalationForm("subject", event.target.value)}
                  placeholder="Short issue title"
                />
              </label>

              <label className="span-two">
                <span>Details *</span>
                <textarea
                  value={escalationForm.details}
                  onChange={(event) => updateEscalationForm("details", event.target.value)}
                  placeholder="Describe the customer issue and required action"
                  rows={5}
                />
              </label>
            </div>

            <div className="care-escalation-actions">
              <button type="button" onClick={closeEscalationModal} disabled={escalationSubmitting}>Cancel</button>
              <button type="submit" disabled={escalationSubmitting}>
                {escalationSubmitting ? "Sending..." : "Send Escalation"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <EscalationInbox
        isOpen={isEscalationInboxOpen}
        onClose={() => setIsEscalationInboxOpen(false)}
      />
    </>
  );
};

export default Care_Nav;
