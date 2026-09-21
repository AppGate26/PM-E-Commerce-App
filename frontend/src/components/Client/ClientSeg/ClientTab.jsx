import React, { useState, useEffect, useRef } from "react";
import "./ClientTab.css";
import logo from "../../../assets/images/adminLogo.png";
import { Link } from "react-router-dom";
import ClientSec from "./ClientSec";

// Online Customer Modals
import SuspendCusModal from "../OnlineCustomer/SuspendCus/SuspendCusModal";
import CustomerInfoModal from "../OnlineCustomer/CustomerInfo/CustomerInfoModal";

// Walk In Customer Modals
import RegCusModal from "../WalkInCustomer/RegCustomer/RegCusModal";
import WalkInSupModal from "../WalkInCustomer/WalkSuspend/WalkInSupModal";
import EditWalkInCustomerInfoModal from "../WalkInCustomer/EditWalkInCustomerInfo/EditWalkInCustomerInfoModal";
import CustomerLedgerModal from "../CustomerLedger/CustomerLedgerModal";

// Report Modals - Customer Details
import OnlineCusModal from "../Report/CustomerDetails/OnlineCus/OnlineCusModal";
import WalkInCusModal from "../Report/CustomerDetails/WalkInCus/WalkInCusModal";

// Report Modals - Suspended Customer Details
import OnSupCusModal from "../Report/SuspendedCustomerDetails/OnlineSupCus/OnSupCusModal";
import WalkInSupCusModal from "../Report/SuspendedCustomerDetails/WalkInSupCus/WalkInSupCusModal";
import CustomerReportDisplayModal from "../Report/CustomerReportDisplay/CustomerReportDisplayModal";

// Report Modals - New Reports
import CustomerCreditReportModal from "../Report/CustomerCreditReport/CustomerCreditReportModal";
import OneOffReportModal from "../Report/OneOffReport/OneOffReportModal";
import LoanRecoveryReportModal from "../Report/LoanRecoveryReport/LoanRecoveryReportModal";

import { TfiMenu } from "react-icons/tfi";
import { IoIosCloseCircleOutline } from "react-icons/io";
import "../../../Styles/ModuleStandard.css";
import { useLanguage } from "../../../context/LanguageContext";
import { useAuth } from "../../../context/AuthContext";
import ModuleUserChip from "../../shared/ModuleUserChip";

const ClientTab = () => {
  const { t } = useLanguage();
  const { allowedModules, isAdmin, user } = useAuth();
  const canAccessMessenger = isAdmin || allowedModules?.includes("mail_messenger");
  const navRef = useRef(null);
  useEffect(() => {
    console.log("═══════════════════════════════════════════════════════════");
    console.log("✅ CLIENT MODULE INITIALIZED");
    console.log("═══════════════════════════════════════════════════════════");
  }, []);

  // Modal states
  const [customerInfoModal, setCustomerInfoModal] = useState(false);
  const [walkInCustomerInfoModal, setWalkInCustomerInfoModal] = useState(false);
  const [supCusModal, setSupCusModal] = useState(false);
  const [regCusModal, setRegCusModal] = useState(false);
  const [walkSupModal, setWalkSupModal] = useState(false);
  const [oCDModal, setOCDModal] = useState(false); // Online Customer Details
  const [wCDModal, setWCDModal] = useState(false); // Walk-in Customer Details
  const [oSCModal, setOSCModal] = useState(false); // Online Suspended Customer Details
  const [wSCModal, setWSCModal] = useState(false); // Walk-in Suspended Customer Details
  const [crdModal, setCrdModal] = useState(false); // Customer Report Display
  const [customerLedgerModal, setCustomerLedgerModal] = useState(false);
  const [creditReportModal, setCreditReportModal] = useState(false); // Customer Credit Report
  const [oneOffReportModal, setOneOffReportModal] = useState(false); // One-Off Report
  const [loanRecoveryReportModal, setLoanRecoveryReportModal] = useState(false); // Loan Recovery Report

  // Dropdown states
  const [isOnlineCustomerDropdownOpen, setOnlineCustomerDropdownOpen] = useState(false);
  const [isWalkInCustomerDropdownOpen, setWalkInCustomerDropdownOpen] = useState(false);
  const [isReportCustomerDropdownOpen, setReportCustomerDropdownOpen] = useState(false);
  const [isCustomerDetailsSubDropdownOpen, setCustomerDetailsSubDropdownOpen] = useState(false);
  const [isSuspendedDetailsSubDropdownOpen, setSuspendedDetailsSubDropdownOpen] = useState(false);

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setOnlineCustomerDropdownOpen(false);
    setWalkInCustomerDropdownOpen(false);
    setReportCustomerDropdownOpen(false);
    setCustomerDetailsSubDropdownOpen(false);
    setSuspendedDetailsSubDropdownOpen(false);
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

  // Toggle dropdowns
  const toggleOnlineCustomerDropdown = (e) => {
    e?.stopPropagation();
    if (isOnlineCustomerDropdownOpen) {
      setOnlineCustomerDropdownOpen(false);
    } else {
      closeAllDropdowns();
      setOnlineCustomerDropdownOpen(true);
    }
  };

  const toggleWalkInCustomerDropdown = (e) => {
    e?.stopPropagation();
    if (isWalkInCustomerDropdownOpen) {
      setWalkInCustomerDropdownOpen(false);
    } else {
      closeAllDropdowns();
      setWalkInCustomerDropdownOpen(true);
    }
  };

  const toggleReportCustomerDropdown = (e) => {
    e?.stopPropagation();
    if (isReportCustomerDropdownOpen) {
      setReportCustomerDropdownOpen(false);
    } else {
      closeAllDropdowns();
      setReportCustomerDropdownOpen(true);
    }
  };

  const toggleCustomerDetailsSubDropdown = (e) => {
    e.stopPropagation();
    setCustomerDetailsSubDropdownOpen(prev => !prev);
    setSuspendedDetailsSubDropdownOpen(false);
  };

  const toggleSuspendedDetailsSubDropdown = (e) => {
    e.stopPropagation();
    setSuspendedDetailsSubDropdownOpen(prev => !prev);
    setCustomerDetailsSubDropdownOpen(false);
  };

  // Toggle modals
  const toggleCustomerInfoModal = () => setCustomerInfoModal(prev => !prev);
  const toggleWalkInCustomerInfoModal = () => setWalkInCustomerInfoModal(prev => !prev);
  const toggleSupCusModal = () => setSupCusModal(prev => !prev);
  const toggleRegCusModal = () => setRegCusModal(prev => !prev);
  const toggleWalkInSupModal = () => setWalkSupModal(prev => !prev);
  const toggleOcdModal = () => setOCDModal(prev => !prev); // Online Customer Details
  const toggleWcdModal = () => setWCDModal(prev => !prev); // Walk-in Customer Details
  const toggleOscModal = () => setOSCModal(prev => !prev); // Online Suspended Customer Details
  const toggleWscModal = () => setWSCModal(prev => !prev); // Walk-in Suspended Customer Details
  const toggleCrdModal = () => setCrdModal(prev => !prev); // Customer Report Display
  const toggleCustomerLedgerModal = () => setCustomerLedgerModal(prev => !prev);
  const toggleCreditReportModal = () => setCreditReportModal(prev => !prev); // Customer Credit Report
  const toggleOneOffReportModal = () => setOneOffReportModal(prev => !prev); // One-Off Report
  const toggleLoanRecoveryReportModal = () => setLoanRecoveryReportModal(prev => !prev); // Loan Recovery Report

  const closeOffcanvas = () => {
    const offcanvasElement = document.getElementById("offcanvasResponsive");
    const offcanvasInstance = bootstrap.Offcanvas.getInstance(offcanvasElement);
    if (offcanvasInstance) offcanvasInstance.hide();
  };

  const handleClick = (action) => {
    action();
    closeOffcanvas();
  };

  return (
    <div className="mainn module-page-shell">
      {/* Mobile Header */}
      <div className="module-mobile-bar d-md-none d-flex justify-content-between align-items-center">
        <Link to="/adminDashboard">
          <img src={logo} alt="logo" className="hub-logo module-brand-logo" />
        </Link>
        <button
          className="btn btn-primary d-md-none"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#offcanvasResponsive"
        >
          <TfiMenu size="28px" />
        </button>
      </div>

      {/* Desktop Navbar */}
      <nav ref={navRef} className="navbar navbar-expand-md inventory-nav d-none d-md-block module-desktop-nav">
        <div className="container-fluid">
          <Link to="/adminDashboard" className="module-brand-link">
            <img src={logo} alt="logo" className="hub-logo module-brand-logo" />
            <div className="module-brand-copy">
              <span className="module-brand-title">{t("Client module")}</span>
              <span className="module-brand-subtitle">{t("Customer records and reports")}</span>
            </div>
          </Link>

          <ul className="gap-5 mb-2 navbar-nav ms-auto mb-lg-0 invent-ul-link align-items-center module-nav-links">
            {canAccessMessenger ? (
              <li className="nav-item">
                <Link to="/messenger" className="module-nav-pill module-quick-link">
                  {t("Mail / Messenger")}
                </Link>
              </li>
            ) : null}
            <li className="nav-item">
              <button
                type="button"
                className="client_links client-ledger-nav-btn module-nav-pill"
                onClick={toggleCustomerLedgerModal}
              >
                {t("Customer ledger")}
              </button>
            </li>
            {/* ONLINE CUSTOMER */}
            <li
              className={`client_links client-links-focus module-nav-pill ${isOnlineCustomerDropdownOpen ? "show" : ""}`}
              onClick={toggleOnlineCustomerDropdown}
            >
              {t("Online customer")}
              <span className="mx-1 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={`pb-2 arrow-down ${isOnlineCustomerDropdownOpen ? "open" : ""}`}>
                  <path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
                </svg>
              </span>
              <ul className={`cl-online-ul ${isOnlineCustomerDropdownOpen ? "show" : ""}`}>
                <li className="online-li-dropdown" onClick={(e) => { e.stopPropagation(); toggleCustomerInfoModal(); }}>
                  {t("Customer information")}
                </li>
                <li className="online-li-dropdown" onClick={(e) => { e.stopPropagation(); toggleSupCusModal(); }}>
                  {t("Suspend customer")}
                </li>
              </ul>
            </li>

            {/* WALK IN CUSTOMER */}
            <li
              className={`client_links module-nav-pill ${isWalkInCustomerDropdownOpen ? "show" : ""}`}
              onClick={toggleWalkInCustomerDropdown}
            >
              {t("Walk in customer")}
              <span className="mx-1 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={`pb-2 arrow-down ${isWalkInCustomerDropdownOpen ? "open" : ""}`}>
                  <path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
                </svg>
              </span>
              <ul className={`walk-in-dropdown ${isWalkInCustomerDropdownOpen ? "show" : ""}`}>
                <li className="walk-li-dropdown" onClick={(e) => { e.stopPropagation(); toggleRegCusModal(); }}>
                  {t("Register customer")}
                </li>
                <li className="walk-li-dropdown" onClick={(e) => { e.stopPropagation(); toggleWalkInCustomerInfoModal(); }}>
                  {t("Customer info edit")}
                </li>
                <li className="walk-li-dropdown" onClick={(e) => { e.stopPropagation(); toggleWalkInSupModal(); }}>
                  {t("Suspend customer")}
                </li>
              </ul>
            </li>

            {/* REPORT - With Nested Dropdowns */}
            <li
              className={`client_links module-nav-pill ${isReportCustomerDropdownOpen ? "show" : ""}`}
              onClick={toggleReportCustomerDropdown}
            >
              {t("Report")}
              <span className="mx-1 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={`pb-2 arrow-down ${isReportCustomerDropdownOpen ? "open" : ""}`}>
                  <path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
                </svg>
              </span>
              <ul className={`walk-in-dropdown ${isReportCustomerDropdownOpen ? "show" : ""}`}>
                {/* Customer Details with Sub-dropdown */}
                <li 
                  className="walk-li-dropdown has-subdropdown" 
                  onClick={toggleCustomerDetailsSubDropdown}
                >
                  {t("Customer details")}
                  {/* Sub-dropdown */}
                  <ul className={`customer-details-subdropdown ${isCustomerDetailsSubDropdownOpen ? "show" : ""}`}>
                    <li 
                      className="subdropdown-item" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        toggleOcdModal(); // Online Customer Details
                        closeAllDropdowns();
                      }}
                    >
                      {t("Online customer details")}
                    </li>
                    <li 
                      className="subdropdown-item" 
                      onClick={(e) => { 
                        e.stopPropagation();
                        toggleWcdModal(); // Walk In Customer Details
                        closeAllDropdowns();
                      }}
                    >
                      {t("Walk in customer details")}
                    </li>
                  </ul>
                </li>

                {/* Suspended Customer Details with Sub-dropdown */}
                <li 
                  className="walk-li-dropdown has-subdropdown" 
                  onClick={toggleSuspendedDetailsSubDropdown}
                >
                  {t("Suspended customer details")}
                  {/* Sub-dropdown */}
                  <ul className={`suspended-details-subdropdown ${isSuspendedDetailsSubDropdownOpen ? "show" : ""}`}>
                    <li 
                      className="subdropdown-item" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        toggleOscModal(); // Online Suspended Customer Details
                        closeAllDropdowns();
                      }}
                    >
                      {t("Online suspended customer details")}
                    </li>
                    <li 
                      className="subdropdown-item" 
                      onClick={(e) => { 
                        e.stopPropagation();
                        toggleWscModal(); // Walk In Suspended Customer Details
                        closeAllDropdowns();
                      }}
                    >
                      {t("Walk in suspended customer details")}
                    </li>
                  </ul>
                </li>

                <li
                  className="walk-li-dropdown"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCrdModal(); // Customer Report Display
                    closeAllDropdowns();
                  }}
                >
                  {t("Customer report display")}
                </li>

                <li
                  className="walk-li-dropdown"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCreditReportModal(); // Customer Credit Report
                    closeAllDropdowns();
                  }}
                >
                  {t("Customer credit report")}
                </li>

                <li
                  className="walk-li-dropdown"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOneOffReportModal(); // One-Off Report
                    closeAllDropdowns();
                  }}
                >
                  {t("One-off report")}
                </li>

                <li
                  className="walk-li-dropdown"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLoanRecoveryReportModal(); // Loan Recovery Report
                    closeAllDropdowns();
                  }}
                >
                  {t("Loan recovery report")}
                </li>
              </ul>
            </li>

            {/* LOG OUT */}
            <li className="nav-item">
              <Link to="/">
                <button className="Log_Out-btn cl-log-out module-logout-btn">{t("Log out")}</button>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Mobile Offcanvas */}
      <div className="offcanvas offcanvas-end" tabIndex="-1" id="offcanvasResponsive">
        <div className="offcanvas-header d-flex justify-content-between bg-primary">
          <IoIosCloseCircleOutline size="40px" color="#ffffffde" data-bs-dismiss="offcanvas" />
          <Link to="/adminDashboard">
            <img src={logo} alt="logo" style={{ width: "40px", height: "40px" }} />
          </Link>
        </div>
        <div className="offcanvas-body offcanvas-body-inventory">
          <div className="accordion accordion-flush" id="accordionFlushExample">
            {/* Online Customer */}
            <div className="accordion-item">
              <h2 className="accordion-header">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseOne">
                  <div className="me-5">{t("Online customer")}</div>
                </button>
              </h2>
              <div id="flush-collapseOne" className="accordion-collapse collapse" data-bs-parent="#accordionFlushExample">
                <div className="bg-white accordion-body">
                  <h5 className="accordion-body-H5 text-uppercase" onClick={() => handleClick(toggleCustomerInfoModal)}>
                    {t("Customer information")}
                  </h5>
                  <h5 className="accordion-body-H5 text-uppercase" onClick={() => handleClick(toggleSupCusModal)}>
                    {t("Suspend customer")}
                  </h5>
                </div>
              </div>
            </div>

            {/* Walk In Customer */}
            <div className="accordion-item">
              <h2 className="accordion-header">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseTwo">
                  <span className="me-5">{t("Walk in customer")}</span>
                </button>
              </h2>
              <div id="flush-collapseTwo" className="accordion-collapse collapse" data-bs-parent="#accordionFlushExample">
                <div className="bg-white accordion-body">
                  <h5 className="accordion-body-H5 text-uppercase" onClick={() => handleClick(toggleRegCusModal)}>
                    {t("Register customer")}
                  </h5>
                  <h5 className="accordion-body-H5 text-uppercase" onClick={() => handleClick(toggleWalkInCustomerInfoModal)}>
                    {t("Customer info edit")}
                  </h5>
                  <h5 className="accordion-body-H5 text-uppercase" onClick={() => handleClick(toggleWalkInSupModal)}>
                    {t("Suspend customer")}
                  </h5>
                </div>
              </div>
            </div>

            {/* Report */}
            <div className="accordion-item">
              <h2 className="accordion-header">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseThree">
                  <span className="me-5">{t("Report")}</span>
                </button>
              </h2>
              <div id="flush-collapseThree" className="accordion-collapse collapse" data-bs-parent="#accordionFlushExample">
                <div className="bg-white accordion-body">
                  <h5 className="accordion-body-H5 text-uppercase" onClick={() => handleClick(toggleOcdModal)}>
                    {t("Customer details")}
                  </h5>
                  <h5 className="accordion-body-H5 text-uppercase" onClick={() => handleClick(toggleOscModal)}>
                    {t("Suspended customer details")}
                  </h5>
                  <h5 className="accordion-body-H5 text-uppercase" onClick={() => handleClick(toggleCrdModal)}>
                    {t("Customer report display")}
                  </h5>
                  <h5 className="accordion-body-H5 text-uppercase" onClick={() => handleClick(toggleCreditReportModal)}>
                    {t("Customer credit report")}
                  </h5>
                  <h5 className="accordion-body-H5 text-uppercase" onClick={() => handleClick(toggleOneOffReportModal)}>
                    {t("One-off report")}
                  </h5>
                  <h5 className="accordion-body-H5 text-uppercase" onClick={() => handleClick(toggleLoanRecoveryReportModal)}>
                    {t("Loan recovery report")}
                  </h5>
                </div>
              </div>
            </div>

            <div className="accordion-item">
              <h2 className="accordion-header">
                <button
                  className="accordion-button collapsed"
                  type="button"
                  onClick={() => handleClick(toggleCustomerLedgerModal)}
                >
                  <span className="me-5">{t("Customer ledger")}</span>
                </button>
              </h2>
            </div>
          </div>

          <Link to="/">
            <button className="px-4 mt-5 btn btn-primary fs-3 fw-semibold">{t("Log out")}</button>
          </Link>
        </div>
      </div>

      <div className="module-content-shell module-surface">
        <div className="module-heading-band">
          <div className="module-heading-copy">
            <h1>{t("Client operations")}</h1>
            <p>{t("Manage online customers, walk-in customers, suspensions, and customer reports.")}</p>
          </div>
          <div className="module-heading-actions">
            <ModuleUserChip user={user} />
            <div className="module-heading-badge">{t("Client")}</div>
          </div>
        </div>
        <ClientSec />
      </div>

      {/* All Modals */}
      <CustomerInfoModal isOpen={customerInfoModal} toggleCustomerInfoModal={toggleCustomerInfoModal} />
      <SuspendCusModal isOpen={supCusModal} toggleSupCusModal={toggleSupCusModal} />
      <OnlineCusModal isOpen={oCDModal} toggleOcdModal={toggleOcdModal} />
      <WalkInCusModal isOpen={wCDModal} toggleWcdModal={toggleWcdModal} />
      <OnSupCusModal isOpen={oSCModal} toggleOscModal={toggleOscModal} />
      <WalkInSupCusModal isOpen={wSCModal} toggleWscModal={toggleWscModal} />
      <RegCusModal isOpen={regCusModal} toggleRegCusModal={toggleRegCusModal} />
      <WalkInSupModal isOpen={walkSupModal} toggleWalkInSupModal={toggleWalkInSupModal} />
      <EditWalkInCustomerInfoModal
        isOpen={walkInCustomerInfoModal}
        onClose={toggleWalkInCustomerInfoModal}
      />
      <CustomerReportDisplayModal isOpen={crdModal} toggleCrdModal={toggleCrdModal} />
      <CustomerLedgerModal
        isOpen={customerLedgerModal}
        toggleCustomerLedgerModal={toggleCustomerLedgerModal}
      />
      <CustomerCreditReportModal
        isOpen={creditReportModal}
        toggleModal={toggleCreditReportModal}
      />
      <OneOffReportModal
        isOpen={oneOffReportModal}
        toggleModal={toggleOneOffReportModal}
      />
      <LoanRecoveryReportModal
        isOpen={loanRecoveryReportModal}
        toggleModal={toggleLoanRecoveryReportModal}
      />
    </div>
  );
};

export default ClientTab;
