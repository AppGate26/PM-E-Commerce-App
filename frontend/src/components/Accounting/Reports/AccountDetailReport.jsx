import React from "react";
import AccountingReportTablePage from "./AccountingReportTablePage";
import { buildAccountDetailRows } from "../../../lib/accountingReports";

const AccountDetailReport = () => (
  <AccountingReportTablePage
    title="Account Detail Report"
    subtitle="View all registered account details with their type, control account, and chart of account mappings."
    badge="Account Detail"
    rowsBuilder={({ accounts }) => buildAccountDetailRows(accounts)}
    summaryBuilder={({ accounts }) => [
      { label: "Total Accounts", value: String(accounts.length) },
      { label: "Scope", value: "All account details" },
      { label: "Hierarchy", value: "Type → Control → Chart → Detail" },
      { label: "Module", value: "Accounting" },
    ]}
    columns={[
      { key: "sn", label: "S/N" },
      { key: "name", label: "Account Name" },
      { key: "type", label: "Type" },
      { key: "controlAccount", label: "Control Account" },
      { key: "chartOfAccount", label: "Chart Of Account" },
    ]}
  />
);

export default AccountDetailReport;
