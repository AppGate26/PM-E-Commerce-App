import React from "react";
import { Link } from "react-router-dom";
import AccountingReportShell from "./AccountingReportShell";
import "./AccountingReports.css";

const cards = [
  {
    to: "/Accounting/Reports/chart-of-accounts",
    title: "Chart Of Account Report",
    description: "Review the seeded general-ledger structure with account codes, groups, and classifications.",
  },
  {
    to: "/Accounting/Reports/journal",
    title: "Journal Report",
    description: "Inspect posted journal references, affected GL accounts, narration, and user trail.",
  },
  {
    to: "/Accounting/Reports/cash-flow",
    title: "Cash Flow",
    description: "Track cash and bank movement across the accounting transactions currently available.",
  },
  {
    to: "/Accounting/Reports/balance-sheet",
    title: "Balance Sheet",
    description: "Summarize assets, liabilities, and equity from the loaded accounting postings.",
  },
  {
    to: "/Accounting/Reports/trial-balance",
    title: "Trial Balance",
    description: "Compare debit and credit movement by account in a cleaner standard statement view.",
  },
  {
    to: "/Accounting/Reports/camel",
    title: "CAMEL Report",
    description: "See a compact risk and performance snapshot derived from the current accounting stream.",
  },
  {
    to: "/Accounting/Reports/profit-loss",
    title: "P&L",
    description: "Review income, expense, and net profit or loss from the transaction activity in the system.",
  },
  {
    to: "/Accounting/Reports/account-detail",
    title: "Account Detail Report",
    description: "View all registered account details with type, control account, and chart of account mappings.",
  },
];

const AccountingReportsHub = () => (
  <AccountingReportShell
    title="Accounting Reports"
    subtitle="Open the accounting statements and operational reports from one standard report hub."
    badge="Report Hub"
    summary={[
      { label: "Reports Available", value: String(cards.length) },
      { label: "Core Areas", value: "GL, Journal, Statements" },
      { label: "Standard View", value: "Enabled" },
      { label: "Coverage", value: "Accounting" },
    ]}
  >
    <div className="accounting-report-shell">
      <div className="journal-section-title-row">
        <div>
          <h3>Available Reports</h3>
          <p>Choose the accounting report you want to review.</p>
        </div>
      </div>

      <div className="accounting-report-grid">
        {cards.map((card) => (
          <Link key={card.to} to={card.to} className="accounting-report-card">
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  </AccountingReportShell>
);

export default AccountingReportsHub;
