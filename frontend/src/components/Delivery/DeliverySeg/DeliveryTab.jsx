import React, { useState, useEffect, useRef } from "react";
import DeliverySec from "./DeliverySec";
import { Link } from "react-router-dom";
import logo from "../../../assets/images/adminLogo.png";
import RiderInfoModal from "../RiderInfo/RiderInfoModal";
import ManageRidersModal from "../RiderInfo/ManageRidersModal";
import SuspendedRidersModal from "../RiderInfo/SuspendedRidersModal";
import RiderDetailModal from "../RiderInfo/RiderDetailModal";
import RiderBoxModal from "../RiderBox/RiderBoxModal";
import TransitModal from "../Transit/TransitModal";
import DntModal from "../Notification/DNT/DntModal";
import FeedBackModal from "../Notification/RFB/FeedBackModal";
import RiderReportModal from "../Report/RiderBox/RiderReport.Modal";
import RpInfoModal from "../Report/RiderInfo/RpInfoModal";
import RpTransitModal from "../Report/Transit/RpTransitModal";
import RpDeliveryModal from "../Report/Delivery/RpDeliveryModal";
import RbDisplayModal from "../Report/RiderBoxDisplay/RbDisplayModal";
import { apiRequest } from "../../../lib/config";
import { TfiMenu } from "react-icons/tfi";
import { IoIosCloseCircleOutline } from "react-icons/io";
import "../../../Styles/ModuleStandard.css";
import { useLanguage } from "../../../context/LanguageContext";
import { useAuth } from "../../../context/AuthContext";
import ModuleUserChip from "../../shared/ModuleUserChip";

const DeliveryTab = () => {
  const { t } = useLanguage();
  const { allowedModules, isAdmin, user } = useAuth();
  const canAccessMessenger = isAdmin || allowedModules?.includes("mail_messenger");
  const canFetchAdminDeliveryCounts = Boolean(isAdmin);
  const navRef = useRef(null);
  const [riderInfoModal, setRiderInfoModal] = useState(false);
  const [manageRidersModal, setManageRidersModal] = useState(false);
  const [suspendedRidersModal, setSuspendedRidersModal] = useState(false);
  const [riderDetailModal, setRiderDetailModal] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState(null);
  const [riderBoxModal, setRiderBoxModal] = useState(false);
  const [transDeliveryModal, setTransDeliveryModal] = useState(false);
  const [deliveryNofModal, setDeliveryNofModal] = useState(false);
  const [feedBackModal, setFeedBackModal] = useState(false);
  const [riderReportModal, setRiderReportModal] = useState(false);
  const [reportInfoModal, setReportInfoModal] = useState(false);
  const [reportTransitModal, setReportTransitModal] = useState(false);
  const [reportDeliveryModal, setReportDeliveryModal] = useState(false);
  const [riderDisplayModal, setRiderDisplayModal] = useState(false);

  // New state for the delivery report dropdown
  const [isDeliveryReportDropdownOpen, setIsDeliveryReportDropdownOpen] =
    useState(false);
  // New state for the notification dropdown
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] =
    useState(false);
  // New state for the riders info dropdown
  const [isRidersInfoDropdownOpen, setIsRidersInfoDropdownOpen] =
    useState(false);
  const [notificationCounts, setNotificationCounts] = useState({
    delivery: 0,
    feedback: 0,
    total: 0,
  });
  const [notificationCountsForbidden, setNotificationCountsForbidden] = useState(false);

  const extractCount = (response) => {
    if (typeof response?.totalElements === "number") return response.totalElements;
    if (typeof response?.totalItems === "number") return response.totalItems;
    if (typeof response?.data?.totalElements === "number") return response.data.totalElements;
    if (typeof response?.data?.totalItems === "number") return response.data.totalItems;
    if (Array.isArray(response?.content)) return response.content.length;
    if (Array.isArray(response?.data?.content)) return response.data.content.length;
    if (Array.isArray(response?.data)) return response.data.length;
    if (Array.isArray(response)) return response.length;
    return 0;
  };

  const fetchCountFromEndpoints = async (endpoints) => {
    let forbidden = false;
    for (const endpoint of endpoints) {
      try {
        const response = await apiRequest(endpoint, "GET");
        const count = extractCount(response);
        if (count >= 0) return { count, forbidden: false };
      } catch (err) {
        if (Number(err?.status) === 403 || Number(err?.code) === 403) {
          forbidden = true;
          break;
        }
      }
    }
    return { count: 0, forbidden };
  };

  const fetchNotificationCounts = async () => {
    if (!canFetchAdminDeliveryCounts) {
      setNotificationCounts({ delivery: 0, feedback: 0, total: 0 });
      setNotificationCountsForbidden(true);
      return;
    }

    if (notificationCountsForbidden) return;

    try {
      const [deliveryResult, feedbackResult] = await Promise.all([
        fetchCountFromEndpoints(["/admin/delivery-notifications?page=1&limit=100"]),
        fetchCountFromEndpoints(["/admin/rider-feedback?page=1&limit=100", "/admin/rider-feedback"]),
      ]);
      const isForbidden = deliveryResult.forbidden || feedbackResult.forbidden;
      const delivery = deliveryResult.count;
      const feedback = feedbackResult.count;

      setNotificationCounts({
        delivery,
        feedback,
        total: delivery + feedback,
      });
      setNotificationCountsForbidden(isForbidden);
    } catch {
      setNotificationCounts({ delivery: 0, feedback: 0, total: 0 });
    }
  };

  // Log delivery module initialization
  useEffect(() => {
    console.log("═══════════════════════════════════════════════════════════");
    console.log("✅ DELIVERY MODULE INITIALIZED - ALL SCREENS READY");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("📋 Connected APIs:");
    console.log("   ✅ POST /api/admin/createRiderInfo - Register Rider");
    console.log("   ✅ GET /api/admin/riders - Manage Riders");
    console.log("   ✅ GET /api/admin/getAllSuspendRider - Suspended Riders");
    console.log("   ✅ GET /api/users/rider/{riderId} - Rider Details");
    console.log("   ✅ PUT /api/admin/updateRiderInfo/{riderId} - Update Rider");
    console.log("   ✅ PUT /api/admin/suspendRider/{riderId} - Suspend Rider");
    console.log("   ✅ PUT /api/admin/unblockRider/{riderId} - Unblock Rider");
    console.log("   ✅ DELETE /api/admin/riders/{riderId} - Delete Rider");
    console.log("   ✅ GET /api/admin/rider-box/{riderId} - Rider Box");
    console.log("   ✅ GET /api/admin/transit-deliveries - Transit Deliveries");
    console.log("   ✅ GET /api/admin/delivery-notifications - Delivery Notifications");
    console.log("   ✅ GET /api/admin/delivery-notifications/{id} - Notification Details");
    console.log("   ✅ GET /api/admin/rider-feedback - Rider Feedback");
    console.log("   ✅ GET /api/admin/reports/rider-info - Rider Info Report");
    console.log("   ✅ GET /api/admin/reports/transit - Transit Report");
    console.log("   ✅ GET /api/admin/reports/deliveries - Deliveries Report");
    console.log("   ✅ GET /api/admin/reports/rider-box/{riderId} - Rider Box Report");
    console.log("   ✅ GET /api/admin/reports/rider-box-display/{riderId} - Rider Box Display");
    console.log("═══════════════════════════════════════════════════════════");
  }, []);

  useEffect(() => {
    if (!canFetchAdminDeliveryCounts) {
      setNotificationCounts({ delivery: 0, feedback: 0, total: 0 });
      setNotificationCountsForbidden(true);
      return undefined;
    }

    fetchNotificationCounts();
    if (notificationCountsForbidden) return undefined;
    const timer = setInterval(fetchNotificationCounts, 30000);
    return () => clearInterval(timer);
  }, [canFetchAdminDeliveryCounts, notificationCountsForbidden]);

  const toggleInfoModal = () => {
    setRiderInfoModal(!riderInfoModal);
    setIsRidersInfoDropdownOpen(false);
  };

  const toggleBoxModal = () => {
    setRiderBoxModal(!riderBoxModal);
  };

  const toggleTransitModal = () => {
    setTransDeliveryModal(!transDeliveryModal);
  };

  const toggleDntModal = () => {
    setDeliveryNofModal(!deliveryNofModal);
    fetchNotificationCounts();
  };

  const toggleFeedBackModal = () => {
    setFeedBackModal(!feedBackModal);
    fetchNotificationCounts();
  };

  const toggleRiderReportModal = () => {
    setRiderReportModal(!riderReportModal);
  };

  const toggleRpInfoModal = () => {
    setReportInfoModal(!reportInfoModal);
  };

  const toggleRpTransitModal = () => {
    setReportTransitModal(!reportTransitModal);
  };

  const toggleRpDeliveryModal = () => {
    setReportDeliveryModal(!reportDeliveryModal);
  };

  const toggleRbdModal = () => {
    setRiderDisplayModal(!riderDisplayModal);
  };

  const closeOffcanvas = () => {
    const offcanvasElement = document.getElementById("offcanvasResponsive");
    const offcanvasInstance = bootstrap.Offcanvas.getInstance(offcanvasElement);
    if (offcanvasInstance) {
      offcanvasInstance.hide();
    }
  };

  const handleClick = (action) => {
    action(); // Execute the original action (e.g., open modal)
    closeOffcanvas(); // Close the offcanvas
  };

  const closeAllDropdowns = () => {
    setIsDeliveryReportDropdownOpen(false);
    setIsNotificationDropdownOpen(false);
    setIsRidersInfoDropdownOpen(false);
  };

  // Toggle the delivery report dropdown on click
  const toggleDeliveryReportDropdown = () => {
    setIsDeliveryReportDropdownOpen((prev) => {
      const next = !prev;
      if (next) {
        setIsNotificationDropdownOpen(false);
        setIsRidersInfoDropdownOpen(false);
      }
      return next;
    });
  };

  // Toggle the notification dropdown on click
  const toggleNotificationDropdown = () => {
    fetchNotificationCounts();
    setIsNotificationDropdownOpen((prev) => {
      const next = !prev;
      if (next) {
        setIsDeliveryReportDropdownOpen(false);
        setIsRidersInfoDropdownOpen(false);
      }
      return next;
    });
  };

  // Toggle the riders info dropdown on click
  const toggleRidersInfoDropdown = () => {
    setIsRidersInfoDropdownOpen((prev) => {
      const next = !prev;
      if (next) {
        setIsDeliveryReportDropdownOpen(false);
        setIsNotificationDropdownOpen(false);
      }
      return next;
    });
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

  const toggleManageRidersModal = () => {
    setManageRidersModal(!manageRidersModal);
    setIsRidersInfoDropdownOpen(false);
  };

  const toggleSuspendedRidersModal = () => {
    setSuspendedRidersModal(!suspendedRidersModal);
    setIsRidersInfoDropdownOpen(false);
  };

  const handleViewRider = (riderId) => {
    console.log("DeliveryTab: ========== HANDLE VIEW RIDER ==========");
    console.log("DeliveryTab: handleViewRider called with riderId:", riderId);
    console.log("DeliveryTab: riderId type:", typeof riderId);
    console.log("DeliveryTab: riderId value:", riderId);
    console.log("DeliveryTab: riderId === null?", riderId === null);
    console.log("DeliveryTab: riderId === undefined?", riderId === undefined);
    
    const validRiderId = riderId !== null && riderId !== undefined && riderId !== "";
    
    if (!validRiderId) {
      console.error("DeliveryTab: ❌ riderId is missing or invalid! Value:", riderId);
      return;
    }
    
    const riderIdToUse = Number(riderId) || riderId;
    console.log("DeliveryTab: Setting selectedRiderId to:", riderIdToUse);
    setSelectedRiderId(riderIdToUse);
    
    console.log("DeliveryTab: Closing ManageRiders modal...");
    setManageRidersModal(false);
    
    setTimeout(() => {
      console.log("DeliveryTab: Opening RiderDetailModal");
      console.log("DeliveryTab: selectedRiderId will be:", riderIdToUse);
      setRiderDetailModal(true);
    }, 250);
  };

  const toggleRiderDetailModal = () => {
    setRiderDetailModal(!riderDetailModal);
    if (!riderDetailModal) {
      setSelectedRiderId(null);
    }
  };

  const handleRidersInfoClick = (e) => {
    e.stopPropagation();
    toggleRidersInfoDropdown();
  };

  const handleDropdownItemClick = (action) => {
    return (e) => {
      e.stopPropagation();
      action();
    };
  };

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
          data-bs-target="#offcanvasResponsive"
          aria-controls="offcanvasResponsive"
        >
          <TfiMenu size="28px" />
        </button>
      </div>

      <nav
        ref={navRef}
        className="navbar navbar-expand inventory-nav d-none d-md-block module-desktop-nav"
        id="delivery-nav"
      >
        <div className="container-fluid">
          <Link to="/adminDashboard" className="module-brand-link">
            <img src={logo} alt="logo" className="hub-logo module-brand-logo" />
            <div className="module-brand-copy">
              <span className="module-brand-title">{t("Delivery module")}</span>
              <span className="module-brand-subtitle">{t("Riders, transit, notifications, and reports")}</span>
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
              {/* Riders Info Dropdown */}
              <li
                className="delivery_links module-nav-pill"
                id="riders_info"
                onMouseEnter={() => setIsRidersInfoDropdownOpen(true)}
                onMouseLeave={() => setIsRidersInfoDropdownOpen(false)}
                onClick={handleRidersInfoClick}
              >
                {t("riders-info")}
                <ul
                  className={`delivery-not-ul ${
                    isRidersInfoDropdownOpen ? "open" : ""
                  }`}
                  onMouseEnter={() => setIsRidersInfoDropdownOpen(true)}
                  onMouseLeave={() => setIsRidersInfoDropdownOpen(false)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <li 
                    className="delivery-not-li" 
                    onClick={handleDropdownItemClick(() => {
                      toggleInfoModal();
                      setIsRidersInfoDropdownOpen(false);
                    })}
                  >
                    {t("Register rider")}
                  </li>
                  <li 
                    className="delivery-not-li" 
                    onClick={handleDropdownItemClick(() => {
                      toggleManageRidersModal();
                      setIsRidersInfoDropdownOpen(false);
                    })}
                  >
                    {t("Manage riders")}
                  </li>
                  <li 
                    className="delivery-not-li" 
                    onClick={handleDropdownItemClick(() => {
                      toggleSuspendedRidersModal();
                      setIsRidersInfoDropdownOpen(false);
                    })}
                  >
                    {t("Suspended riders")}
                  </li>
                </ul>
              </li>

              <li className="delivery_links module-nav-pill" onClick={toggleBoxModal}>
                {t("Riders box")}
              </li>

              <li className="delivery_links module-nav-pill" onClick={toggleTransitModal}>
                {t("Transit deliveries")}
              </li>

              {/* Notification Dropdown */}
              <li
                className="delivery_links module-nav-pill"
                id="notification"
                onClick={toggleNotificationDropdown}
              >
                <span className="delivery-nav-badge-wrap">
                  {t("Notification")}
                  <span className="delivery-nav-badge">{notificationCounts.total}</span>
                </span>
                <ul
                  className={`delivery-not-ul ${
                    isNotificationDropdownOpen ? "open" : ""
                  }`}
                >
                  <li className="delivery-not-li" onClick={toggleDntModal}>
                    {t("Delivery notification")}
                    <span className="delivery-submenu-badge">{notificationCounts.delivery}</span>
                  </li>
                  <li className="delivery-not-li" onClick={toggleFeedBackModal}>
                    {t("Rider feedback")}
                    <span className="delivery-submenu-badge">{notificationCounts.feedback}</span>
                  </li>
                </ul>
              </li>

             {/* Report Dropdown - Fixed Version */}
<li
  className="delivery_links module-nav-pill"
  id="report_drop"
  onClick={toggleDeliveryReportDropdown}
>
  {t("Report")}
  <span className="text-center mx-1">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className="arrow-down pb-2"
      style={{ 
        transition: 'transform 0.3s',
        transform: isDeliveryReportDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
      }}
    >
      <path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" 
        fill="currentColor"
      />
    </svg>
  </span>
  
  {/* Dropdown Menu - Using inline styles */}
  {isDeliveryReportDropdownOpen && (
    <ul
      className="delivery-not-ul open"
      onClick={(e) => e.stopPropagation()}
    >
      <li 
        onClick={toggleRiderReportModal}
      >
        {t("Rider box report")}
      </li>
      <li 
        onClick={toggleRpInfoModal}
      >
        {t("Rider info report")}
      </li>
      <li 
        onClick={toggleRpTransitModal}
      >
        {t("All transit product report")}
      </li>
      <li 
        onClick={toggleRbdModal}
      >
        {t("Rider's box display option")}
      </li>
      <li 
        onClick={toggleRpDeliveryModal}
      >
        {t("All delivery product report")}
      </li>
    </ul>
  )}
</li>
              <li className="nav-item">
                <Link to="/">
                  <button className="Log_Out-btn module-logout-btn" id="delivery-logout">
                    {t("Log out")}
                  </button>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

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
        <div className="offcanvas-body offcanvas-body-inventory offcanvas-body-delivery">
          <div className="accordion accordion-flush" id="accordionFlushExample">
            <div className="accordion-item">
              <h2 className="accordion-header">
                <button
                  className="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#flush-collapseRidersInfo"
                  aria-expanded="false"
                  aria-controls="flush-collapseRidersInfo"
                >
                  <div className="me-5">{t("riders-info")}</div>
                </button>
              </h2>
              <div
                id="flush-collapseRidersInfo"
                className="accordion-collapse collapse"
                data-bs-parent="#accordionFlushExample"
              >
                <div className="accordion-body bg-white">
                  <h5
                    className="accordion-body-H5 fs-3 fw-semibold mx-3 text-uppercase"
                    onClick={() => handleClick(toggleInfoModal)}
                  >
                    {t("Register rider")}
                  </h5>
                  <h5
                    className="accordion-body-H5 fs-3 fw-semibold mx-3 text-uppercase"
                    onClick={() => handleClick(toggleManageRidersModal)}
                  >
                    {t("Manage riders")}
                  </h5>
                  <h5
                    className="accordion-body-H5 fs-3 fw-semibold mx-3 text-uppercase"
                    onClick={() => handleClick(toggleSuspendedRidersModal)}
                  >
                    {t("Suspended riders")}
                  </h5>
                </div>
              </div>
            </div>
          </div>
          <h5
            className="accordion-body-H5 fs-3 fw-semibold mx-3"
            onClick={() => handleClick(toggleBoxModal)}
          >
            {t("Riders box")}
          </h5>
          <h5
            className="accordion-body-H5 fs-3 fw-semibold mx-3"
            onClick={() => handleClick(toggleTransitModal)}
          >
            {t("Transit deliveries")}
          </h5>
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
                  <div className="me-5 delivery-mobile-notification-label">
                    {t("Notification")}
                    <span className="delivery-nav-badge">{notificationCounts.total}</span>
                  </div>
                </button>
              </h2>
              <div
                id="flush-collapseOne"
                className="accordion-collapse collapse"
                data-bs-parent="#accordionFlushExample"
              >
                <div className="accordion-body bg-white">
                  <h5
                    className="accordion-body-H5 fs-3 fw-semibold mx-3 text-uppercase"
                    onClick={() => handleClick(toggleDntModal)}
                  >
                    {t("Deliveries notification")}
                  </h5>
                  <h5
                    className="accordion-body-H5 fs-3 fw-semibold mx-3 text-uppercase"
                    onClick={() => handleClick(toggleFeedBackModal)}
                  >
                    {t("Rider feedback")}
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
                  data-bs-target="#flush-collapseFour"
                  aria-expanded="false"
                  aria-controls="flush-collapseFour"
                >
                  <span className="me-5">{t("Report")}</span>
                </button>
              </h2>
              <div
                id="flush-collapseFour"
                className="accordion-collapse collapse"
                data-bs-parent="#accordionFlushExample"
              >
                <div className="accordion-body bg-white">
                  <h5
                    className="accordion-body-H5 text-uppercase"
                    onClick={() => handleClick(toggleRiderReportModal)}
                  >
                    {t("Rider box report")}
                  </h5>
                  <h5
                    className="accordion-body-H5 text-uppercase"
                    onClick={() => handleClick(toggleRpInfoModal)}
                  >
                    {t("Rider info report")}
                  </h5>
                  <h5
                    className="accordion-body-H5 text-uppercase"
                    onClick={() => handleClick(toggleRpTransitModal)}
                  >
                    {t("All transit product report")}
                  </h5>
                  <h5
                    className="accordion-body-H5 text-uppercase"
                    onClick={() => handleClick(toggleRbdModal)}
                  >
                    {t("Rider's box display option")}
                  </h5>
                  <h5
                    className="accordion-body-H5 text-uppercase"
                    onClick={() => handleClick(toggleRpDeliveryModal)}
                  >
                    {t("All delivery product report")}
                  </h5>
                </div>
              </div>
            </div>
          </div>
          <Link to="/">
            <button className="btn btn-primary fs-3 px-4 fw-semibold mt-5">
              {t("Log out")}
            </button>
          </Link>
        </div>
      </div>

      {/* MODAL CONTENT DISPLAY */}
      <RiderInfoModal
        isOpen={riderInfoModal}
        toggleInfoModal={toggleInfoModal}
      />
      <ManageRidersModal
        isOpen={manageRidersModal}
        toggleManageRidersModal={toggleManageRidersModal}
        onViewRider={handleViewRider}
      />
      <SuspendedRidersModal
        isOpen={suspendedRidersModal}
        toggleSuspendedRidersModal={toggleSuspendedRidersModal}
      />
      <RiderBoxModal isOpen={riderBoxModal} toggleBoxModal={toggleBoxModal} />
      <TransitModal
        isOpen={transDeliveryModal}
        toggleTransitModal={toggleTransitModal}
      />
      <DntModal isOpen={deliveryNofModal} toggleDntModal={toggleDntModal} />
      <FeedBackModal
        isOpen={feedBackModal}
        toggleFeedBackModal={toggleFeedBackModal}
      />
      <RiderReportModal
        isOpen={riderReportModal}
        toggleRiderReportModal={toggleRiderReportModal}
      />
      <RpInfoModal
        isOpen={reportInfoModal}
        toggleRpInfoModal={toggleRpInfoModal}
      />
      <RpTransitModal
        isOpen={reportTransitModal}
        toggleRpTransitModal={toggleRpTransitModal}
      />
      <RpDeliveryModal
        isOpen={reportDeliveryModal}
        toggleRpDeliveryModal={toggleRpDeliveryModal}
      />
      <RbDisplayModal
        isOpen={riderDisplayModal}
        toggleRbdModal={toggleRbdModal}
      />
      {riderDetailModal && selectedRiderId && (
        <RiderDetailModal
          isOpen={riderDetailModal}
          riderId={selectedRiderId}
          onClose={() => {
            console.log("DeliveryTab: Closing RiderDetailModal, clearing selectedRiderId");
            setSelectedRiderId(null);
            toggleRiderDetailModal();
          }}
        />
      )}
      <div className="module-content-shell module-surface">
        <div className="module-heading-band">
          <div className="module-heading-copy">
            <h1>{t("Delivery operations")}</h1>
            <p>{t("Coordinate rider information, delivery boxes, transit activity, notifications, and reports.")}</p>
          </div>
          <div className="module-heading-actions">
            <ModuleUserChip user={user} />
            <div className="module-heading-badge">{t("Delivery")}</div>
          </div>
        </div>
        <DeliverySec />
      </div>
    </div>
  );
};

export default DeliveryTab;
