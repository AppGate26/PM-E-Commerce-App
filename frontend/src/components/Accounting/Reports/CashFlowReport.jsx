import React from "react";
import AccountingReportTablePage from "./AccountingReportTablePage";
import { buildCashFlowRows } from "../../../lib/accountingReports";

const CashFlowReport = () => (
  <AccountingReportTablePage
    title="Cash Flow Report"
    subtitle="Track cash and bank movement from the accounting transactions currently loaded."
    badge="Cash Flow"
    enableDateFilter
    enableBranchFilter
    rowsBuilder={({ transactions }) => buildCashFlowRows(transactions)}
    summaryBuilder={(_, rows) => [
      { label: "Cash Accounts", value: String(rows.length) },
      { label: "Total Debit", value: rows.reduce((sum, row) => sum + row.debit, 0).toFixed(2) },
      { label: "Total Credit", value: rows.reduce((sum, row) => sum + row.credit, 0).toFixed(2) },
      { label: "Net Flow", value: rows.reduce((sum, row) => sum + row.net, 0).toFixed(2) },
    ]}
    columns={[
      { key: "account", label: "Cash / Bank Account" },
      { key: "debit", label: "Debit", className: "text-end" },
      { key: "credit", label: "Credit", className: "text-end" },
      { key: "net", label: "Net Movement", className: "text-end" },
    ]}
  />
);

export default CashFlowReport;
