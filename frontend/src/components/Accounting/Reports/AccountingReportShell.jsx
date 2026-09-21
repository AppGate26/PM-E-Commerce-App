import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import logo from "../../../assets/images/adminLogo.png";
import BranchBadge from "../../shared/BranchBadge";
import "../Account.css";

const reportLinks = [
  { to: "/Accounting/Reports", label: "Report Hub" },
  { to: "/Accounting/Reports/chart-of-accounts", label: "Chart Of Account" },
  { to: "/Accounting/Reports/journal", label: "Journal Report" },
  { to: "/Accounting/Reports/cash-flow", label: "Cash Flow" },
  { to: "/Accounting/Reports/balance-sheet", label: "Balance Sheet" },
  { to: "/Accounting/Reports/trial-balance", label: "Trial Balance" },
  { to: "/Accounting/Reports/camel", label: "CAMEL Report" },
  { to: "/Accounting/Reports/profit-loss", label: "P&L" },
  { to: "/Accounting/Reports/account-detail", label: "Account Detail" },
];

const AccountingReportShell = ({ title, subtitle, badge = "Accounting Report", headerRight = null, summary = [], children }) => {
  const navigate = useNavigate();

  return (
    <div className="journal-page">
      <nav className="bg-primary d-flex align-items-center justify-content-between px-5">
        <Link to="/adminDashboard">
          <img src={logo} alt="pm logo" className="logo-acc" />
        </Link>
        <div className="d-flex">
          <div className="dropdown-center acc-dropdown-link">
            <button className="btn text-white dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
              REPORT
            </button>
            <ul className="dropdown-menu">
              {reportLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-decoration-none text-dark">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Link to="/">
          <button className="Log_Out-btn cl-log-out" id="Log_Out-btn-sm">
            Log Out
          </button>
        </Link>
      </nav>

      <div className="container-fluid mt-4 journal-container">
        <div className="journal-standard-shell">
          <div className="journal-header-card">
            <div className="d-flex align-items-center gap-3">
              <button
                type="button"
                className="acc-type-back-btn"
                onClick={() => navigate("/Accounting")}
                aria-label="Go back to accounting"
              >
                <IoArrowBack size={20} />
              </button>
              <div>
                <h2 className="journal-page-title">{title}</h2>
                <p className="journal-page-subtitle">{subtitle}</p>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              {/* Which branch this report covers: a branch user sees their branch,
                  a head-office user sees the branch selected (or All Branches). */}
              <BranchBadge />
              {headerRight != null ? headerRight : <div className="journal-header-badge">{badge}</div>}
            </div>
          </div>

          {summary.length ? (
            <div className="journal-summary-grid">
              {summary.map((item) => (
                <div className="journal-summary-card" key={item.label}>
                  <span>{item.label}</span>
                  <strong className="transaction-card-title">{item.value}</strong>
                </div>
              ))}
            </div>
          ) : null}

          {children}
        </div>
      </div>
    </div>
  );
};

export default AccountingReportShell;
