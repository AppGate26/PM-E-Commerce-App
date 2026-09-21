import React, { useEffect, useRef, useState } from "react";
import "./CashierTab.css";
import logo from "../../../assets/images/adminLogo.png";
import { Link } from "react-router-dom";
import CashierSection from "./CashierSection";
import { TfiMenu } from "react-icons/tfi";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { FiBell, FiGrid } from "react-icons/fi";
import "../../../Styles/ModuleStandard.css";
import { useAuth } from "../../../context/AuthContext";
import ModuleUserChip from "../../shared/ModuleUserChip";
import { cashierApi } from "../../../lib/cashierApi";

const CashierTab = () => {
  const { allowedModules, isAdmin, user } = useAuth();
  const canAccessMessenger = isAdmin || allowedModules?.includes("mail_messenger");
  const navRef = useRef(null);
  const [salesReferences, setSalesReferences] = useState([]);
  const [loanDueNotifications, setLoanDueNotifications] = useState([]);
  const [salesNotificationOpen, setSalesNotificationOpen] = useState(false);
  const [cashPaymentReference, setCashPaymentReference] = useState("");
  const [loanPaymentAccount, setLoanPaymentAccount] = useState("");
  const notificationCount = salesReferences.length + loanDueNotifications.length;

  const closeOffcanvas = () => {
    const offcanvasElement = document.getElementById("offcanvasResponsive");
    const offcanvasInstance =
      offcanvasElement && window.bootstrap?.Offcanvas?.getInstance(offcanvasElement);
    if (offcanvasInstance) {
      offcanvasInstance.hide();
    }
  };

  const loadSalesReferenceNotifications = async () => {
    try {
      const references = await cashierApi.getSalesOrderReferences();
      setSalesReferences(Array.isArray(references) ? references.slice(0, 12) : []);
    } catch {
      setSalesReferences([]);
    }
  };

  const isLoanDue = (item) => {
    const outstandingLoan = Number(item?.principalLoanBalance || 0);
    if (!item?.isWalkIn || !item?.accountNumber || outstandingLoan <= 0) return false;
    if (!item?.dueDate) return true;

    const dueDate = new Date(item.dueDate);
    if (Number.isNaN(dueDate.getTime())) return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate <= today;
  };

  const loadWalkInLoanDueNotifications = async () => {
    try {
      const customers = await cashierApi.getCustomerDirectory();
      const dueCustomers = (Array.isArray(customers) ? customers : [])
        .filter(isLoanDue)
        .slice(0, 12);
      setLoanDueNotifications(dueCustomers);
    } catch {
      setLoanDueNotifications([]);
    }
  };

  const loadNotifications = () => {
    loadSalesReferenceNotifications();
    loadWalkInLoanDueNotifications();
  };

  const handleSalesReferenceClick = (referenceNumber) => {
    if (!referenceNumber) return;
    setCashPaymentReference(String(referenceNumber));
    setSalesNotificationOpen(false);
    closeOffcanvas();
  };

  const handleLoanDueClick = (accountNumber) => {
    if (!accountNumber) return;
    setLoanPaymentAccount(String(accountNumber));
    setSalesNotificationOpen(false);
    closeOffcanvas();
  };

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(loadNotifications, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setSalesNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className="module-page-shell">
      <div className="module-mobile-bar d-md-none d-flex justify-content-between align-items-center">
            <Link to="/adminDashboard" >
              <img src={logo} alt="logo" className="hub-logo module-brand-logo" />
            </Link>

            <div className="d-flex align-items-center gap-2">
              <Link to="/adminDashboard" className="cashier-dashboard-btn-sm">
                Dashboard
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
          </div>
      <nav ref={navRef} className="navbar navbar-expand inventory-nav d-none d-md-block module-desktop-nav">
        <div className="container-fluid">
          <Link to="/adminDashboard" className="module-brand-link">
            <img src={logo} alt="logo" className="hub-logo module-brand-logo" />
            <div className="module-brand-copy">
              <span className="module-brand-title">Cashier Stand</span>
              <span className="module-brand-subtitle">Cash desk operations and daily processing</span>
            </div>
          </Link>

          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0 invent-ul-link align-items-center module-nav-links">
              {canAccessMessenger ? (
                <li className="nav-item">
                  <Link to="/messenger" className="module-nav-pill module-quick-link">
                    Mail / Messenger
                  </Link>
                </li>
              ) : null}
              <li className="nav-item cashier-notification-item">
                <button
                  type="button"
                  className="cashier-notification-btn"
                  onClick={() => setSalesNotificationOpen((prev) => !prev)}
                >
                  <FiBell aria-hidden="true" />
                  Notification
                  <span className="cashier-action-badge">{notificationCount}</span>
                </button>
                {salesNotificationOpen ? (
                  <div className="cashier-sales-notification-panel">
                    <div className="cashier-sales-notification-head">
                      <strong>Notifications</strong>
                      <button type="button" onClick={loadNotifications}>
                        Refresh
                      </button>
                    </div>
                    <div className="cashier-notification-section-title">
                      Walk-in customers loan due
                    </div>
                    {loanDueNotifications.length ? (
                      <div className="cashier-sales-reference-list cashier-loan-due-list">
                        {loanDueNotifications.map((item, index) => (
                          <button
                            type="button"
                            className="cashier-sales-reference-item"
                            key={`${item.accountNumber || "loan-due"}-${index}`}
                            onClick={() => handleLoanDueClick(item.accountNumber)}
                          >
                            <strong>{item.customerName || "Walk-in customer"}</strong>
                            <span>{item.accountNumber || "-"}</span>
                            <small>
                              Due: {item.dueDate || "Now"} | Loan: ₦
                              {Number(item.principalLoanBalance || 0).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </small>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="cashier-sales-empty compact">No walk-in customer loan due.</div>
                    )}
                    <div className="cashier-notification-section-title">
                      Processed reference numbers
                    </div>
                    {salesReferences.length ? (
                      <div className="cashier-sales-reference-list">
                        {salesReferences.map((item, index) => (
                          <button
                            type="button"
                            className="cashier-sales-reference-item"
                            key={`${item.referenceNumber || "ref"}-${index}`}
                            onClick={() => handleSalesReferenceClick(item.referenceNumber)}
                          >
                            <strong>{item.referenceNumber || "-"}</strong>
                            <span>{item.customerName || "Sales department"}</span>
                            <small>{item.productName || item.productId || "Reference ready for cashier"}</small>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="cashier-sales-empty">No processed reference numbers yet.</div>
                    )}
                  </div>
                ) : null}
              </li>
              <li className="nav-item">
                <Link to="/adminDashboard" className="cashier-dashboard-btn">
                  <span className="cashier-action-icon">
                    <FiGrid aria-hidden="true" />
                  </span>
                  Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/">
                  <button className="Log_Out-btn cashier-log-out module-logout-btn">
                    Log Out
                  </button>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <div className="module-content-shell module-surface">
        <div className="module-heading-band">
          <div className="module-heading-copy">
            <h1>Cashier Operations</h1>
            <p>Access cashier stand tools, call over, balance enquiry, payments, and reporting functions.</p>
          </div>
          <div className="module-heading-actions">
            <ModuleUserChip user={user} />
            <div className="module-heading-badge">Cashier</div>
          </div>
        </div>
        <CashierSection
          selectedCashReference={cashPaymentReference}
          selectedLoanAccount={loanPaymentAccount}
        />
      </div>

      <div
        className="offcanvas offcanvas-end"
        tabIndex="-1"
        id="offcanvasResponsive"
        aria-labelledby="offcanvasResponsiveLabel"
      >
        <div className="offcanvas-header d-flex justify-content-between bg-primary">
          <button
            type="button"
            className="cashier-offcanvas-close"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          >
            <IoIosCloseCircleOutline size="40px" color="#ffffffde" />
          </button>
          <Link to="/adminDashboard" onClick={closeOffcanvas}>
            <img src={logo} alt="logo" style={{ width: "40px", height: "40px" }} />
          </Link>
        </div>
        <div className="offcanvas-body offcanvas-body-inventory cashier-offcanvas-body">
          <Link to="/adminDashboard" onClick={closeOffcanvas} className="cashier-mobile-nav-link">
            Dashboard
          </Link>
          <Link to="/cashier-report" onClick={closeOffcanvas} className="cashier-mobile-nav-link">
            Report
          </Link>
          <button
            type="button"
            className="cashier-mobile-nav-link cashier-mobile-notification"
            onClick={loadNotifications}
          >
            Notification
            <span>{notificationCount}</span>
          </button>
          <div className="cashier-mobile-reference-list">
            {loanDueNotifications.slice(0, 5).map((item, index) => (
              <button
                type="button"
                key={`${item.accountNumber || "mobile-loan-due"}-${index}`}
                onClick={() => handleLoanDueClick(item.accountNumber)}
              >
                {item.accountNumber || "Loan due"}
              </button>
            ))}
          </div>
          <div className="cashier-mobile-reference-list">
            {salesReferences.slice(0, 5).map((item, index) => (
              <button
                type="button"
                key={`${item.referenceNumber || "mobile-ref"}-${index}`}
                onClick={() => handleSalesReferenceClick(item.referenceNumber)}
              >
                {item.referenceNumber || "-"}
              </button>
            ))}
          </div>
          {canAccessMessenger ? (
            <Link to="/messenger" onClick={closeOffcanvas} className="cashier-mobile-nav-link">
              Mail / Messenger
            </Link>
          ) : null}
          <Link to="/" onClick={closeOffcanvas} className="cashier-mobile-nav-link cashier-mobile-nav-danger">
            Log Out
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CashierTab;
