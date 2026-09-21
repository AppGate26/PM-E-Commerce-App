import React from "react";
import AccountingReportTablePage from "./AccountingReportTablePage";
import { buildChartOfAccountRows } from "../../../lib/accountingReports";

const ChartOfAccountReport = () => (
  <AccountingReportTablePage
    title="Chart Of Account Report"
    subtitle="Review the accounting chart with account codes, group prefixes, and classifications."
    badge="Chart Report"
    rowsBuilder={({ accounts }) => buildChartOfAccountRows(accounts)}
    summaryBuilder={({ accounts }) => [
      { label: "Accounts", value: String(accounts.length) },
      { label: "Types", value: "Asset, Liability, Equity, Income, Expense" },
      { label: "Seeded Chart", value: "Loaded" },
      { label: "Module", value: "Accounting" },
    ]}
    columns={[
      { key: "sn", label: "S/N" },
      { key: "code", label: "Account Code" },
      { key: "name", label: "Account Name" },
      { key: "type", label: "Type" },
      { key: "group", label: "Group Prefix" },
    ]}
  />
);

export default ChartOfAccountReport;
