import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useLanguage } from "../../../context/LanguageContext";
import "../Admin.css";
import logo from "../../../assets/images/PMlogo.png";
import { fetchApprovalCounts } from "../../../lib/adminApi";
import { careApi } from "../../../lib/careApi";
import { fetchMessengerConversations } from "../../../lib/messengerApi";
import { getRegisteredDisplayName } from "../../../lib/registeredUsers";
import { resolveUserBranch } from "../../../lib/branchAccess";
import BranchSwitcher from "../../shared/BranchSwitcher";

const pickEmailList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.emails)) return payload.emails;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.response)) return payload.response;
  if (Array.isArray(payload?.response?.content)) return payload.response.content;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
};

const getDisplayName = (user = {}) => {
  return getRegisteredDisplayName(user);
};

const getInitials = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
};

const AdminNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isMailOpen, setIsMailOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationItems, setNotificationItems] = useState([]);
  const [approvalToast, setApprovalToast] = useState("");
  const [, setBranchRefreshTick] = useState(0);
  const securityRef = useRef(null);
  const languageRef = useRef(null);
  const mailRef = useRef(null);
  const notificationRef = useRef(null);
  const previousApprovalTotalRef = useRef(null);
  const approvalToastTimerRef = useRef(null);

  useEffect(() => {
    const isSecurityPage = location.pathname.includes("/security-setup");

    document.documentElement.classList.toggle("security-scroll-unlocked", isSecurityPage);
    document.body.classList.toggle("security-scroll-unlocked", isSecurityPage);

    return () => {
      document.documentElement.classList.remove("security-scroll-unlocked");
      document.body.classList.remove("security-scroll-unlocked");
    };
  }, [location.pathname]);

  useEffect(() => {
    const path = location.pathname;

    if (path.includes("/approvals")) {
      setActiveSection("approvals");
      setIsSecurityOpen(false);
      setIsLanguageOpen(false);
      setIsMailOpen(false);
      setIsNotificationOpen(false);
      return;
    }

    if (path.includes("/security-setup")) {
      setActiveSection("security");
      setIsSecurityOpen(false);
      setIsLanguageOpen(false);
      setIsMailOpen(false);
      setIsNotificationOpen(false);
      return;
    }

    if (path.includes("/language-currency")) {
      setActiveSection("language");
      setIsLanguageOpen(false);
      setIsSecurityOpen(false);
      setIsMailOpen(false);
      setIsNotificationOpen(false);
      return;
    }

    if (path.includes("/mail-messenger")) {
      setActiveSection("mail");
      setIsMailOpen(false);
      setIsSecurityOpen(false);
      setIsLanguageOpen(false);
      setIsNotificationOpen(false);
      return;
    }

    setActiveSection("dashboard");
    setIsSecurityOpen(false);
    setIsLanguageOpen(false);
    setIsMailOpen(false);
    setIsNotificationOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const isSecurityPage = location.pathname.includes("/security-setup");
    let isMounted = true;

    const loadNotifications = async () => {
      const nextItems = [];

      if (!isSecurityPage) {
        try {
          const approvalBuckets = await fetchApprovalCounts();
          approvalBuckets
            .filter((item) => Number(item.count || 0) > 0)
            .forEach((item) => {
              const count = Number(item.count || 0);
              nextItems.push({
                key: `approval-${item.key}`,
                title: `${item.label} Approval`,
                description: `${count} pending request${count > 1 ? "s" : ""}`,
                route: item.route,
                count,
                kind: "approval",
              });
            });
        } catch {
          // Ignore approval notification failures.
        }

        try {
          const emailResponse = await careApi.getEmails(0, 20);
          const emails = pickEmailList(emailResponse?.data || emailResponse?.response || emailResponse);
          if (emails.length > 0) {
            nextItems.push({
              key: "mail-inbox",
              title: "Mail Inbox",
              description: `${emails.length} mail item${emails.length > 1 ? "s" : ""} available`,
              route: "/admin/mail-messenger/view-inbox-message",
              count: emails.length,
              kind: "mail",
            });
          }
        } catch {
          // Ignore mail notification failures.
        }
      }

      try {
        const conversations = await fetchMessengerConversations();
        const unreadConversations = conversations.filter(
          (conversation) => Number(conversation.unreadCount) > 0
        );
        if (unreadConversations.length > 0) {
          const unreadTotal = unreadConversations.reduce(
            (total, conversation) => total + Number(conversation.unreadCount || 0),
            0
          );
          nextItems.push({
            key: "messenger-conversations",
            title: "Messenger",
            description: `${unreadTotal} unread message${unreadTotal > 1 ? "s" : ""}`,
            route: "/messenger",
            count: unreadTotal,
            kind: "messenger",
          });
        }
      } catch {
        // Ignore messenger notification failures.
      }

      const approvalTotal = nextItems
        .filter((item) => item.kind === "approval")
        .reduce((total, item) => total + Number(item.count || 0), 0);

      if (
        !isSecurityPage &&
        previousApprovalTotalRef.current !== null &&
        approvalTotal > previousApprovalTotalRef.current
      ) {
        setApprovalToast("New approval request received.");
        if (approvalToastTimerRef.current) {
          clearTimeout(approvalToastTimerRef.current);
        }
        approvalToastTimerRef.current = setTimeout(() => setApprovalToast(""), 6000);
      }

      previousApprovalTotalRef.current = approvalTotal;
      if (isMounted) {
        setNotificationItems(nextItems);
      }
    };

    loadNotifications();
    const timer = isSecurityPage ? null : setInterval(loadNotifications, 30000);

    if (!isSecurityPage) {
      window.addEventListener("approval-request-created", loadNotifications);
    }

    return () => {
      isMounted = false;
      if (timer) {
        clearInterval(timer);
      }
      if (!isSecurityPage) {
        window.removeEventListener("approval-request-created", loadNotifications);
      }
      if (approvalToastTimerRef.current) {
        clearTimeout(approvalToastTimerRef.current);
      }
    };
  }, [location.pathname, user?.email]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (securityRef.current && !securityRef.current.contains(event.target)) {
        setIsSecurityOpen(false);
      }

      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setIsLanguageOpen(false);
      }

      if (mailRef.current && !mailRef.current.contains(event.target)) {
        setIsMailOpen(false);
      }

      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    const handleBranchAccessChanged = () => {
      setBranchRefreshTick((current) => current + 1);
    };

    window.addEventListener("storage", handleBranchAccessChanged);

    return () => {
      window.removeEventListener("storage", handleBranchAccessChanged);
    };
  }, []);

  const getNavbarTitle = () => {
    const path = location.pathname;
    if (path.includes("/add-to-stock")) return t("Add To Stock Approval");
    if (path.includes("/cash-sales")) return t("Cash Sales Approval");
    if (path.includes("/credit-sales")) return t("Credit Sales Approval");
    if (path.includes("/online-sales")) return t("Online Sales Approval");
    if (path.includes("/approvals/refund")) return t("Refund Approval");
    if (path.includes("/approvals/return")) return t("Return Approval");
    if (path.includes("/approvals/cancellation")) return t("Order Cancellation Approval");
    if (path.includes("/customer-registration")) return t("Customer Registration Approval");
    if (path.includes("/customer-edit")) return t("Customer Edit Approval");
    if (path.includes("/goods-supplied")) return t("Goods Supplied Approval");
    if (path.includes("/journal")) return t("Journal Approval");
    if (path.includes("/stock-delete")) return t("Stock Delete Approval");
    if (path.includes("/supplier-reg")) return t("Supplier Reg Approval");
    if (path.includes("/suspended-customers")) return t("Suspended Customers Approval");
    if (path.includes("/unblock-customers")) return t("Unblock Customers Approval");
    if (path.includes("/approvals/product-to-warehouse")) return t("Product To Warehouse Approval");
    if (path.includes("/approvals/warehouse/product-to-stock")) return t("Warehouse Product To Stock Approval");
    if (path.includes("/approvals/warehouse/product-swap")) return t("Warehouse Product Swap Approval");
    if (path.includes("/approvals/warehouse/product-transfer")) return t("Warehouse Product Transfer Approval");
    if (path.includes("/approvals/warehouse/quarantine-product")) return t("Warehouse Quarantine Product Approval");
    if (path.includes("/approvals/warehouse/attach-manager")) return t("Attach Warehouse Manager Approval");
    if (path.includes("/approvals/warehouse/status")) return t("Warehouse Status Approval");
    if (path.includes("/approvals/warehouse/stock-balance")) return t("Warehouse Stock Balance Review");
    if (path.includes("/approvals")) return t("Approval");
    if (path.includes("/security-setup/view-user")) return t("View User");
    if (path.includes("/security-setup/users-logout")) return t("Users Log-Out");
    if (path.includes("/security-setup/users-log-trial")) return t("Users Log Trial");
    if (path.includes("/security-setup/merge-user-role")) return t("Merge User Role");
    if (path.includes("/security-setup/database-backup")) return t("Database Backup");
    if (path.includes("/security-setup/create-modify-user")) return t("Create And Modify User");
    if (path.includes("/security-setup/branch-permissions")) return t("Branch And Permission Setup");
    if (path.includes("/security-setup/warehouse-management")) return t("Warehouse Management");
    if (path.includes("/security-setup/change-user-password")) return t("Change User Password");
    if (path.includes("/security-setup/activate-deactivate-user")) {
      return t("Activate Or Deactivate User");
    }
    if (path.includes("/language-currency/currency-options")) return t("Currency Options");
    if (path.includes("/language-currency/language-options")) return t("Language Options");
    if (path.includes("/language-currency")) return t("Language And Currency");
    if (path.includes("/mail-messenger/chat-with-options")) return t("Chat With Options");
    if (path.includes("/mail-messenger/compose-mail")) return t("Compose Mail");
    if (path.includes("/mail-messenger/mail-display-option")) return t("Mail Display Option");
    if (path.includes("/mail-messenger/messenger")) return t("Messanger");
    if (path.includes("/mail-messenger/sent-mail")) return t("Sent Mail");
    if (path.includes("/mail-messenger/standard-mail-settings")) {
      return t("Standard Mail Settings");
    }
    if (path.includes("/mail-messenger/standard-mail")) return t("Standard Mail");
    if (path.includes("/mail-messenger/view-inbox-message")) return t("View Inbox Message");
    if (path.includes("/mail-messenger")) return t("Mail And Messanger");
    return t("Admin");
  };

  const closeAdminDropdowns = () => {
    setIsSecurityOpen(false);
    setIsLanguageOpen(false);
    setIsMailOpen(false);
    setIsNotificationOpen(false);
  };

  const closeOtherMenus = (section) => {
    setIsSecurityOpen(section === "security" ? isSecurityOpen : false);
    setIsLanguageOpen(section === "language" ? isLanguageOpen : false);
    setIsMailOpen(section === "mail" ? isMailOpen : false);
    setIsNotificationOpen(false);
  };

  const handleSecurityClick = (e) => {
    if (location.pathname === "/admin/security-setup") {
      e.preventDefault();
      closeOtherMenus("security");
      setIsSecurityOpen((prev) => !prev);
    }
  };

  const handleLanguageClick = (e) => {
    if (location.pathname === "/admin/language-currency") {
      e.preventDefault();
      closeOtherMenus("language");
      setIsLanguageOpen((prev) => !prev);
    }
  };

  const handleMailClick = (e) => {
    if (location.pathname === "/admin/mail-messenger") {
      e.preventDefault();
      closeOtherMenus("mail");
      setIsMailOpen((prev) => !prev);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("isAdmin");
    sessionStorage.removeItem("adminEmail");
    logout();
    navigate("/auth/login");
  };

  const handleBack = () => {
    navigate(-1);
  };

  const notificationTotal = notificationItems.reduce(
    (total, item) => total + Number(item.count || 0),
    0
  );
  const displayName = getDisplayName(user);
  const displayRole = String(user?.role || user?.userType || "").replace(/_/g, " ");
  const displayBranch = resolveUserBranch(user)?.branchName || "";

  return (
    <div className="admin-navbar-shell">
      <header className="admin-sidebar-header">
        <div className="admin-header-bar">
          <div className="admin-brand-block">
            <img src={logo} alt="Peace of Mind logo" className="admin-logo" />
            <div className="admin-brand-copy">
              <span className="admin-brand-label">{t("Peace of Mind")}</span>
              <span className="admin-header-title">{getNavbarTitle()}</span>
            </div>
          </div>

          <div className="admin-header-actions">
            {/* Rendered by every admin page: admins pick the branch here; branch
                users see their pinned branch. */}
            <BranchSwitcher />
            <div className="admin-user-chip" title={displayBranch ? `${displayName} - ${displayBranch}` : user?.email || displayName}>
              <span className="admin-user-avatar">{getInitials(displayName)}</span>
              <span className="admin-user-copy">
                <strong>{displayName}</strong>
                <small>{displayBranch || displayRole || user?.email || "Logged in"}</small>
              </span>
            </div>
            <div className="admin-notification-wrap" ref={notificationRef}>
              <button
                className="notification-icon"
                type="button"
                onClick={() => setIsNotificationOpen((prev) => !prev)}
                aria-label={`Open notifications, ${notificationTotal} item${notificationTotal === 1 ? "" : "s"}`}
                title={`${notificationTotal} notification${notificationTotal === 1 ? "" : "s"}`}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span className={`notification-badge ${notificationTotal > 0 ? "has-count" : "is-empty"}`}>
                  {notificationTotal}
                </span>
              </button>

              <div className={`admin-notification-card ${isNotificationOpen ? "open" : ""}`}>
                <div className="admin-notification-head">
                  <strong>{t("Notifications")}</strong>
                  <span>{notificationTotal} {t("items")}</span>
                </div>

                <div className="admin-notification-list">
                  {notificationItems.length === 0 ? (
                    <div className="admin-notification-empty">
                      {t("No live approval, mail, or messenger notifications right now.")}
                    </div>
                  ) : (
                    notificationItems.map((item) => (
                      <Link
                        key={item.key}
                        to={item.route}
                        className={`admin-notification-item kind-${item.kind}`}
                        onClick={() => setIsNotificationOpen(false)}
                      >
                        <div>
                          <strong>{item.title}</strong>
                          <span>{item.description}</span>
                        </div>
                        <em>{item.count}</em>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
            {approvalToast ? (
              <div
                className="admin-live-approval-toast"
                role="status"
                style={{
                  position: "fixed",
                  top: "86px",
                  right: "24px",
                  zIndex: 3000,
                  minWidth: "260px",
                  maxWidth: "340px",
                  padding: "14px 16px",
                  borderRadius: "8px",
                  background: "#0f766e",
                  color: "#fff",
                  boxShadow: "0 16px 40px rgba(15, 23, 42, 0.22)",
                }}
              >
                <strong style={{ display: "block", marginBottom: "4px" }}>
                  {t("Approval Notification")}
                </strong>
                <span>{t(approvalToast)}</span>
              </div>
            ) : null}
            <button className="back-icon" onClick={handleBack} type="button" aria-label="Go back">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="logout-btn-header" onClick={handleLogout} type="button">
              {t("Log out")}
            </button>
          </div>
        </div>

        <nav className="admin-nav-menu">
          <Link
            to="/admin/dashboard"
            className={`admin-nav-link ${activeSection === "dashboard" ? "active" : ""}`}
            onClick={closeAdminDropdowns}
          >
            {t("Dashboard")}
          </Link>

          <Link
            to="/admin/approvals"
            className={`admin-nav-link ${activeSection === "approvals" ? "active" : ""}`}
            onClick={closeAdminDropdowns}
          >
            {t("Approvals")}
          </Link>

          {!location.pathname.includes("/approvals") &&
            !location.pathname.includes("/language-currency") &&
            !location.pathname.includes("/mail-messenger") && (
              <div className="admin-nav-dropdown" ref={securityRef}>
                <Link
                  to="/admin/security-setup"
                  className={`admin-nav-link admin-nav-dropdown-toggle ${activeSection === "security" ? "active" : ""}`}
                  onClick={handleSecurityClick}
                >
                  {t("Security Setup")}
                  <svg
                    className={`admin-chevron ${isSecurityOpen ? "open" : ""}`}
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M4 6L8 10L12 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
                <div
                  className={`admin-nav-dropdown-menu ${isSecurityOpen ? "open" : ""}`}
                  onClick={closeAdminDropdowns}
                >
                  <Link
                    to="/admin/security-setup/view-user"
                    className={`admin-nav-sub-link ${location.pathname.includes("/security-setup/view-user") ? "active" : ""}`}
                  >
                    {t("View User")}
                  </Link>
                  <Link
                    to="/admin/security-setup/users-logout"
                    className={`admin-nav-sub-link ${location.pathname.includes("/security-setup/users-logout") ? "active" : ""}`}
                  >
                    {t("Users Log-Out")}
                  </Link>
                  <Link
                    to="/admin/security-setup/users-log-trial"
                    className={`admin-nav-sub-link ${location.pathname.includes("/security-setup/users-log-trial") ? "active" : ""}`}
                  >
                    {t("Users Log Trial")}
                  </Link>
                  <Link
                    to="/admin/security-setup/merge-user-role"
                    className={`admin-nav-sub-link ${location.pathname.includes("/security-setup/merge-user-role") ? "active" : ""}`}
                  >
                    {t("Merge User Role")}
                  </Link>
                  <Link
                    to="/admin/security-setup/database-backup"
                    className={`admin-nav-sub-link ${location.pathname.includes("/security-setup/database-backup") ? "active" : ""}`}
                  >
                    {t("Database Backup")}
                  </Link>
                  <Link
                    to="/admin/security-setup/create-modify-user"
                    className={`admin-nav-sub-link ${location.pathname.includes("/security-setup/create-modify-user") ? "active" : ""}`}
                  >
                    {t("Create And Modify User")}
                  </Link>
                  <Link
                    to="/admin/security-setup/branch-permissions"
                    className={`admin-nav-sub-link ${location.pathname.includes("/security-setup/branch-permissions") ? "active" : ""}`}
                  >
                    {t("Branch And Permission Setup")}
                  </Link>
                  <Link
                    to="/admin/security-setup/warehouse-management"
                    className={`admin-nav-sub-link ${location.pathname.includes("/security-setup/warehouse-management") ? "active" : ""}`}
                  >
                    {t("Warehouse Management")}
                  </Link>
                  <Link
                    to="/admin/security-setup/change-user-password"
                    className={`admin-nav-sub-link ${location.pathname.includes("/security-setup/change-user-password") ? "active" : ""}`}
                  >
                    {t("Change User Password")}
                  </Link>
                  <Link
                    to="/admin/security-setup/activate-deactivate-user"
                    className={`admin-nav-sub-link ${location.pathname.includes("/security-setup/activate-deactivate-user") ? "active" : ""}`}
                  >
                    {t("Activate Or Deactivate User")}
                  </Link>
                </div>
              </div>
            )}

          {!location.pathname.includes("/approvals") &&
            !location.pathname.includes("/security-setup") &&
            !location.pathname.includes("/language-currency") && (
              <div className="admin-nav-dropdown" ref={mailRef}>
                <Link
                  to="/admin/mail-messenger"
                  className={`admin-nav-link admin-nav-dropdown-toggle ${activeSection === "mail" ? "active" : ""}`}
                  onClick={handleMailClick}
                >
                  {t("Mail And Messanger")}
                  <svg
                    className={`admin-chevron ${isMailOpen ? "open" : ""}`}
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M4 6L8 10L12 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
                <div
                  className={`admin-nav-dropdown-menu ${isMailOpen ? "open" : ""}`}
                  onClick={closeAdminDropdowns}
                >
                  <Link
                    to="/admin/mail-messenger/chat-with-options"
                    className={`admin-nav-sub-link ${location.pathname.includes("/mail-messenger/chat-with-options") ? "active" : ""}`}
                  >
                    {t("Chat With Options")}
                  </Link>
                  <Link
                    to="/admin/mail-messenger/compose-mail"
                    className={`admin-nav-sub-link ${location.pathname.includes("/mail-messenger/compose-mail") ? "active" : ""}`}
                  >
                    {t("Compose Mail")}
                  </Link>
                  <Link
                    to="/admin/mail-messenger/mail-display-option"
                    className={`admin-nav-sub-link ${location.pathname.includes("/mail-messenger/mail-display-option") ? "active" : ""}`}
                  >
                    {t("Mail Display Option")}
                  </Link>
                  <Link
                    to="/admin/mail-messenger/messenger"
                    className={`admin-nav-sub-link ${location.pathname.includes("/mail-messenger/messenger") ? "active" : ""}`}
                  >
                    {t("Messanger")}
                  </Link>
                  <Link
                    to="/admin/mail-messenger/sent-mail"
                    className={`admin-nav-sub-link ${location.pathname.includes("/mail-messenger/sent-mail") ? "active" : ""}`}
                  >
                    {t("Sent Mail")}
                  </Link>
                  <Link
                    to="/admin/mail-messenger/standard-mail-settings"
                    className={`admin-nav-sub-link ${location.pathname.includes("/mail-messenger/standard-mail-settings") ? "active" : ""}`}
                  >
                    {t("Standard Mail Settings")}
                  </Link>
                  <Link
                    to="/admin/mail-messenger/standard-mail"
                    className={`admin-nav-sub-link ${location.pathname.includes("/mail-messenger/standard-mail") ? "active" : ""}`}
                  >
                    {t("Standard Mail")}
                  </Link>
                  <Link
                    to="/admin/mail-messenger/view-inbox-message"
                    className={`admin-nav-sub-link ${location.pathname.includes("/mail-messenger/view-inbox-message") ? "active" : ""}`}
                  >
                    {t("View Inbox Message")}
                  </Link>
                </div>
              </div>
            )}

          {!location.pathname.includes("/approvals") &&
            !location.pathname.includes("/security-setup") &&
            !location.pathname.includes("/mail-messenger") && (
              <div className="admin-nav-dropdown" ref={languageRef}>
                <Link
                  to="/admin/language-currency"
                  className={`admin-nav-link admin-nav-dropdown-toggle ${activeSection === "language" ? "active" : ""}`}
                  onClick={handleLanguageClick}
                >
                  {t("Language And Currency")}
                  <svg
                    className={`admin-chevron ${isLanguageOpen ? "open" : ""}`}
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M4 6L8 10L12 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
                <div
                  className={`admin-nav-dropdown-menu ${isLanguageOpen ? "open" : ""}`}
                  onClick={closeAdminDropdowns}
                >
                  <Link
                    to="/admin/language-currency/currency-options"
                    className={`admin-nav-sub-link ${location.pathname.includes("/language-currency/currency-options") ? "active" : ""}`}
                  >
                    {t("Currency Options")}
                  </Link>
                  <Link
                    to="/admin/language-currency/language-options"
                    className={`admin-nav-sub-link ${location.pathname.includes("/language-currency/language-options") ? "active" : ""}`}
                  >
                    {t("Language Options")}
                  </Link>
                </div>
              </div>
            )}
        </nav>
      </header>
    </div>
  );
};

export default AdminNav;
