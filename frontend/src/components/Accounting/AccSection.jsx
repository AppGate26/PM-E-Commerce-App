import React from "react";
import "./Account.css";
import logo from "../../assets/images/adminLogo.png";
import { Link } from "react-router-dom";
import fig from "../../assets/images/AccSection.png";
import fig2 from "../../assets/images/smacc.png";
import fig3 from "../../assets/images/smacc2.png";
import AccDashboard from "./AccDashboard";
import AccountNavSm from "./AccountNavSm";
import "../../Styles/ModuleStandard.css";
import { useAuth } from "../../context/AuthContext";
import ModuleUserChip from "../shared/ModuleUserChip";
const AccSection = () => {
  const { allowedModules, isAdmin, user } = useAuth();
  const canAccessMessenger = isAdmin || allowedModules?.includes("mail_messenger");
  return (
    <div className="module-page-shell">
      <div className="AccountNavSm">

      <AccountNavSm />
      </div>
      <nav className="bg-primary d-flex align-items-center justify-content-between py-3 px-5 rm-acc-Nav-sm module-desktop-nav">
        <Link to="/adminDashboard" className="module-brand-link">
          <img src={logo} alt="pm logo" className="logo-acc module-brand-logo" />
          <div className="module-brand-copy">
            <span className="module-brand-title">Accounting Module</span>
            <span className="module-brand-subtitle">Accounts, setup, and transactions</span>
          </div>
        </Link>

        <div className="d-flex align-items-center gap-3">
          {canAccessMessenger ? (
            <Link to="/messenger" className="module-nav-pill module-quick-link">
              Mail / Messenger
            </Link>
          ) : null}
          <Link to="/">
            <button className="Log_Out-btn cl-log-out module-logout-btn" id="Log_Out-btn-sm">
              Log Out
            </button>
          </Link>
        </div>
      </nav>

      <div className="module-content-shell module-surface">
        <div className="module-heading-band">
          <div className="module-heading-copy">
            <h1>Accounting Operations</h1>
            <p>Access accounting setup, dashboards, journals, transfers, and account configuration tools.</p>
          </div>
          <div className="module-heading-actions">
            <ModuleUserChip user={user} />
            <div className="module-heading-badge">Accounting</div>
          </div>
        </div>
      <div className=" acc-section-box">
        <div className="rm-acc-dashboard">
          <AccDashboard />
        </div>
        <div className="acc-section-box-fig">
          <img src={fig} alt="pm logo" className="account-stock-rafiki" />

          <div className="acc-section-box-fig-sm">
            <div>
              <img src={fig2} alt="" />
            </div>
            <div>
              <img src={fig3} alt="" />
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default AccSection;
