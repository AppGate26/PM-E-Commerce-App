import React, { useEffect, useRef, useState } from "react";
import RecoverySec from "./RecoverySec";
import { Link } from "react-router-dom";
import logo from "../../../assets/images/adminLogo.png";
import "../../../Styles/Recovery/Recovery.css";
import { apiRequest } from "../../../lib/config";
import RegisterOfficerModal from "../OfficerInfo/RegisterOfficerModal";
import OfficersInfoIndexModal from "../OfficerInfo/OfficersInfoIndexModal";
import SuspendedOfficersModal from "../OfficerInfo/SuspendedOfficersModal";
import OfficerDetailModal from "../OfficerInfo/OfficerDetailModal";
import RecoveryBoxModal from "../RecoveryBox/RecoveryBoxModal";
import RecoveryNotificationModal from "../Notification/RecoveryNotificationModal";
import LoanNotificationModal from "../Notification/LoanNotificationModal";
import RecoveryReportModal from "../Report/RecoveryReportModal";
import LoanReportModal from "../Report/LoanReportModal";
import { useNavigate } from "react-router-dom";
import { TfiMenu } from "react-icons/tfi";
import { IoIosCloseCircleOutline } from "react-icons/io";
import "../../../Styles/ModuleStandard.css";
import { useLanguage } from "../../../context/LanguageContext";
import { useAuth } from "../../../context/AuthContext";
import ModuleUserChip from "../../shared/ModuleUserChip";

const RecoveryTab = () => {
  const { t } = useLanguage();
  const { allowedModules, isAdmin, user } = useAuth();
  const canAccessMessenger = isAdmin || allowedModules?.includes("mail_messenger");
  const navRef = useRef(null);
  const navigate = useNavigate();
  const [officerInfoModal, setOfficerInfoModal] = useState(false);
  const [officersIndexModal, setOfficersIndexModal] = useState(false);
  const [suspendedOfficersModal, setSuspendedOfficersModal] = useState(false);
  const [officerDetailModal, setOfficerDetailModal] = useState(false);
  const [selectedOfficerId, setSelectedOfficerId] = useState(null);
  const [recoveryBoxModal, setRecoveryBoxModal] = useState(false);
  const [recoveryNotificationModal, setRecoveryNotificationModal] = useState(false);
  const [loanNotificationModal, setLoanNotificationModal] = useState(false);
  const [recoveryReportModal, setRecoveryReportModal] = useState(false);
  const [loanReportModal, setLoanReportModal] = useState(false);

  // State for dropdowns
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [isReportDropdownOpen, setIsReportDropdownOpen] = useState(false);
  const [notificationCounts, setNotificationCounts] = useState({
    recovery: 0,
    loan: 0,
    total: 0,
  });

  const extractCount = (response) => {
    if (typeof response?.totalElements === "number") return response.totalElements;
    if (typeof response?.totalItems === "number") return response.totalItems;
    if (typeof response?.data?.totalElements === "number") return response.data.totalElements;
    if (typeof response?.data?.totalItems === "number") return response.data.totalItems;
    if (typeof response?.data?.totalRecoveries === "number") return response.data.totalRecoveries;
    if (typeof response?.data?.totalNotifications === "number") return response.data.totalNotifications;
    if (Array.isArray(response?.content)) return response.content.length;
    if (Array.isArray(response?.data?.content)) return response.data.content.length;
    if (Array.isArray(response?.data?.allRecoveries)) return response.data.allRecoveries.length;
    if (Array.isArray(response?.data?.allNotifications)) return response.data.allNotifications.length;
    if (Array.isArray(response?.data)) return response.data.length;
    if (Array.isArray(response)) return response.length;
    return 0;
  };

  const fetchCountFromEndpoints = async (endpoints) => {
    for (const endpoint of endpoints) {
      try {
        const response = await apiRequest(endpoint, "GET");
        const count = extractCount(response);
        if (count > 0) return count;
      } catch {
        // Try next endpoint
      }
    }
    return 0;
  };

  const fetchNotificationCounts = async () => {
    try {
      const [recovery, loan] = await Promise.all([
        fetchCountFromEndpoints([
          "/admin/recovery-notifications?page=1&limit=100",
          "/admin/reports/recovery?page=1&limit=100",
        ]),
        fetchCountFromEndpoints([
          "/admin/loan-notifications?page=1&limit=100",
          "/admin/reports/loan?page=1&limit=100",
        ]),
      ]);

      setNotificationCounts({
        recovery,
        loan,
        total: recovery + loan,
      });
    } catch {
      setNotificationCounts({ recovery: 0, loan: 0, total: 0 });
    }
  };

  useEffect(() => {
    fetchNotificationCounts();
    const timer = setInterval(fetchNotificationCounts, 30000);
    return () => clearInterval(timer);
  }, []);

  const toggleInfoModal = () => {
    setOfficerInfoModal(!officerInfoModal);
  };

  const toggleOfficersIndexModal = () => {
    setOfficersIndexModal((prev) => !prev);
  };

  const toggleSuspendedOfficersModal = () => {
    setSuspendedOfficersModal(!suspendedOfficersModal);
  };

  const toggleOfficerDetailModal = () => {
    setOfficerDetailModal(!officerDetailModal);
    if (!officerDetailModal) {
      setSelectedOfficerId(null);
    }
  };

  const handleSuspendSuccess = () => {
    setOfficerDetailModal(false);
    setSelectedOfficerId(null);
  };

  const toggleRecoveryBoxModal = () => {
    setRecoveryBoxModal(!recoveryBoxModal);
  };

  const toggleRecoveryNotificationModal = () => {
    setRecoveryNotificationModal(!recoveryNotificationModal);
    setIsNotificationDropdownOpen(false);
    fetchNotificationCounts();
  };

  const toggleLoanNotificationModal = () => {
    setLoanNotificationModal(!loanNotificationModal);
    setIsNotificationDropdownOpen(false);
    fetchNotificationCounts();
  };

  const handleReminderClick = () => {
    navigate("/recovery/reminder");
  };

  const toggleNotificationDropdown = () => {
    fetchNotificationCounts();
    setIsNotificationDropdownOpen((prev) => {
      const next = !prev;
      if (next) {
        setIsReportDropdownOpen(false);
      }
      return next;
    });
  };

  const toggleReportDropdown = () => {
    setIsReportDropdownOpen((prev) => {
      const next = !prev;
      if (next) {
        setIsNotificationDropdownOpen(false);
      }
      return next;
    });
  };

  const closeAllDropdowns = () => {
    setIsNotificationDropdownOpen(false);
    setIsReportDropdownOpen(false);
  };

  const toggleRecoveryReportModal = () => {
    setRecoveryReportModal(!recoveryReportModal);
    setIsReportDropdownOpen(false);
  };

  const toggleLoanReportModal = () => {
    setLoanReportModal(!loanReportModal);
    setIsReportDropdownOpen(false);
  };

  const closeOffcanvas = () => {
    const offcanvasElement = document.getElementById("offcanvasRecovery");
    const offcanvasInstance = bootstrap.Offcanvas.getInstance(offcanvasElement);
    if (offcanvasInstance) {
      offcanvasInstance.hide();
    }
  };

  const handleClick = (action) => {
    action();
    closeOffcanvas();
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        closeAllDropdowns();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className="module-page-shell">
      <div className="module-mobile-bar d-md-none d-flex justify-content-between align-items-center">
        <Link to="/adminDashboard">
          <img src={logo} alt="logo" className="hub-logo module-brand-logo" />
        </Link>

        <button
          className="btn btn-primary d-md-none"
          id="menu-bar-sm"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#offcanvasRecovery"
          aria-controls="offcanvasRecovery"
        >
          <TfiMenu size="28px" />
        </button>
      </div>

      <nav
        ref={navRef}
        className="navbar navbar-expand inventory-nav d-none d-md-block module-desktop-nav"
        id="recovery-nav"
      >
        <div className="container-fluid">
          <Link to="/adminDashboard" className="module-brand-link">
            <img src={logo} alt="logo" className="hub-logo module-brand-logo" />
            <div className="module-brand-copy">
              <span className="module-brand-title">{t("Recovery module")}</span>
              <span className="module-brand-subtitle">{t("Officers, reminders, notifications, and reports")}</span>
            </div>
          </Link>

          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0 invent-ul-link align-items-center module-nav-links">
              {canAccessMessenger ? (
                <li className="nav-item">
                  <Link to="/messenger" className="module-nav-pill module-quick-link">
                    {t("Mail / Messenger")}
                  </Link>
                </li>
              ) : null}
              {/* Officers Info — opens the officers CRUD index directly */}
              <li
                className="recovery_links module-nav-pill"
                id="officers_info"
                onClick={toggleOfficersIndexModal}
              >
                {t("officers-info")}
              </li>

              <li className="recovery_links module-nav-pill" onClick={toggleRecoveryBoxModal}>
                {t("Recovery box")}
              </li>

              <li className="recovery_links module-nav-pill" onClick={handleReminderClick}>
                {t("Reminder")}
              </li>

              {/* Notification Dropdown */}
              <li
                className="recovery_links module-nav-pill"
                id="notification"
                onClick={toggleNotificationDropdown}
              >
                <span className="recovery-nav-badge-wrap">
                  {t("Notification")}
                  <span className="recovery-nav-badge">{notificationCounts.total}</span>
                </span>
                <ul
                  className={`recovery-not-ul ${
                    isNotificationDropdownOpen ? "open" : ""
                  }`}
                  style={{ display: isNotificationDropdownOpen ? "block" : "none" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <li
                    className="recovery-not-li"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRecoveryNotificationModal();
                      setIsNotificationDropdownOpen(false);
                    }}
                  >
                    {t("Recovery notification")}
                    <span className="recovery-submenu-badge">{notificationCounts.recovery}</span>
                  </li>
                  <li
                    className="recovery-not-li"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLoanNotificationModal();
                      setIsNotificationDropdownOpen(false);
                    }}
                  >
                    {t("Loan notification")}
                    <span className="recovery-submenu-badge">{notificationCounts.loan}</span>
                  </li>
                </ul>
              </li>

              {/* Report Dropdown */}
              <li
                className="recovery_links module-nav-pill"
                id="report"
                style={{ position: "relative" }}
                onClick={toggleReportDropdown}
              >
                {t("Report")}
                <ul
                  className={`recovery-not-ul ${
                    isReportDropdownOpen ? "open" : ""
                  }`}
                  style={{
                    right: 0,
                    left: "auto",
                    transform: "translateX(0)"
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <li
                    className="recovery-not-li"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRecoveryReportModal();
                      setIsReportDropdownOpen(false);
                    }}
                  >
                    {t("Recovery report")}
                  </li>
                  <li
                    className="recovery-not-li"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLoanReportModal();
                      setIsReportDropdownOpen(false);
                    }}
                  >
                    {t("Loan report")}
                  </li>
                </ul>
              </li>

              <li className="nav-item">
                <Link to="/adminDashboard">
                  <button className="Log_Out-btn module-logout-btn" id="recovery-logout">
                    {t("Log out")}
                  </button>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Mobile Offcanvas */}
      <div
        className="offcanvas offcanvas-end"
        tabIndex="-1"
        id="offcanvasRecovery"
        aria-labelledby="offcanvasRecoveryLabel"
      >
        <div className="offcanvas-header d-flex justify-content-between bg-primary">
          <div className="">
            <IoIosCloseCircleOutline
              size="40px"
              color="#ffffffde"
              data-bs-dismiss="offcanvas"
              data-bs-target="#offcanvasRecovery"
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
        <div className="offcanvas-body offcanvas-body-inventory offcanvas-body-recovery">
          <h5
            className="accordion-body-H5 fs-3 fw-semibold mx-3"
            onClick={() => handleClick(toggleOfficersIndexModal)}
          >
            {t("officers-info")}
          </h5>
          <h5
            className="accordion-body-H5 fs-3 fw-semibold mx-3"
            onClick={() => handleClick(toggleRecoveryBoxModal)}
          >
            {t("Recovery box")}
          </h5>
          <h5
            className="accordion-body-H5 fs-3 fw-semibold mx-3"
            onClick={() => handleClick(handleReminderClick)}
          >
            {t("Reminder")}
          </h5>
          <div className="accordion accordion-flush" id="accordionRecovery2">
            <div className="accordion-item">
              <h2 className="accordion-header">
                <button
                  className="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#flush-collapseNotification"
                  aria-expanded="false"
                  aria-controls="flush-collapseNotification"
                >
                  <div className="me-5 recovery-mobile-notification-label">
                    {t("Notification")}
                    <span className="recovery-nav-badge">{notificationCounts.total}</span>
                  </div>
                </button>
              </h2>
              <div
                id="flush-collapseNotification"
                className="accordion-collapse collapse"
                data-bs-parent="#accordionRecovery2"
              >
                <div className="accordion-body bg-white">
                  <h5
                    className="accordion-body-H5 fs-3 fw-semibold mx-3 text-uppercase"
                    onClick={() => handleClick(toggleRecoveryNotificationModal)}
                  >
                    {t("Recovery notification")}
                  </h5>
                  <h5
                    className="accordion-body-H5 fs-3 fw-semibold mx-3 text-uppercase"
                    onClick={() => handleClick(toggleLoanNotificationModal)}
                  >
                    {t("Loan notification")}
                  </h5>
                </div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header">
                <button
                  className="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#flush-collapseReport"
                  aria-expanded="false"
                  aria-controls="flush-collapseReport"
                >
                  <span className="me-5">{t("Report")}</span>
                </button>
              </h2>
              <div
                id="flush-collapseReport"
                className="accordion-collapse collapse"
                data-bs-parent="#accordionRecovery2"
              >
                <div className="accordion-body bg-white">
                  <h5
                    className="accordion-body-H5 text-uppercase"
                    onClick={() => handleClick(toggleRecoveryReportModal)}
                  >
                    {t("Recovery report")}
                  </h5>
                  <h5
                    className="accordion-body-H5 text-uppercase"
                    onClick={() => handleClick(toggleLoanReportModal)}
                  >
                    {t("Loan report")}
                  </h5>
                </div>
              </div>
            </div>
          </div>
          <Link to="/adminDashboard">
            <button className="btn btn-primary fs-3 px-4 fw-semibold mt-5">
              {t("Log out")}
            </button>
          </Link>
        </div>
      </div>

      {/* MODAL CONTENT DISPLAY */}
      <RegisterOfficerModal
        isOpen={officerInfoModal}
        toggleInfoModal={toggleInfoModal}
      />
      <OfficersInfoIndexModal
        isOpen={officersIndexModal}
        onClose={() => setOfficersIndexModal(false)}
        onRegister={() => {
          setOfficersIndexModal(false);
          setTimeout(() => setOfficerInfoModal(true), 200);
        }}
        onViewOfficer={(officerId) => {
          const valid = officerId !== null && officerId !== undefined && officerId !== "";
          if (!valid) return;
          setSelectedOfficerId(Number(officerId) || officerId);
          setOfficersIndexModal(false);
          setTimeout(() => setOfficerDetailModal(true), 250);
        }}
        onViewSuspended={() => {
          setOfficersIndexModal(false);
          setTimeout(() => setSuspendedOfficersModal(true), 200);
        }}
      />
      <SuspendedOfficersModal
        isOpen={suspendedOfficersModal}
        toggleSuspendedOfficersModal={toggleSuspendedOfficersModal}
      />
      <RegisterOfficerModal
        isOpen={officerInfoModal}
        toggleRegisterOfficerModal={() => setOfficerInfoModal(false)}
      />
      <OfficerDetailModal
        isOpen={officerDetailModal}
        officerId={selectedOfficerId}
        onClose={toggleOfficerDetailModal}
      />
      <RecoveryBoxModal
        isOpen={recoveryBoxModal}
        toggleRecoveryBoxModal={toggleRecoveryBoxModal}
      />
      <RecoveryNotificationModal
        isOpen={recoveryNotificationModal}
        toggleRecoveryNotificationModal={toggleRecoveryNotificationModal}
      />
      <LoanNotificationModal
        isOpen={loanNotificationModal}
        toggleLoanNotificationModal={toggleLoanNotificationModal}
      />
      <RecoveryReportModal
        isOpen={recoveryReportModal}
        toggleRecoveryReportModal={toggleRecoveryReportModal}
      />
      <LoanReportModal
        isOpen={loanReportModal}
        toggleLoanReportModal={toggleLoanReportModal}
      />
      <div className="module-content-shell module-surface">
        <div className="module-heading-band">
          <div className="module-heading-copy">
            <h1>{t("Recovery operations")}</h1>
            <p>{t("Manage officers, recovery workflows, reminders, notifications, and loan recovery reporting.")}</p>
          </div>
          <div className="module-heading-actions">
            <ModuleUserChip user={user} />
            <div className="module-heading-badge">{t("Recovery")}</div>
          </div>
        </div>
        <RecoverySec />
      </div>
    </div>
  );
};

export default RecoveryTab;
