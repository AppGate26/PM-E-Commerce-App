import React from "react";
import AccountingReportTablePage from "./AccountingReportTablePage";
import { buildJournalReportRows } from "../../../lib/accountingReports";

const JournalReport = () => (
  <AccountingReportTablePage
    title="Journal Report"
    subtitle="List journal references with affected GL accounts, names, narration, and posting values."
    badge="Journal Report"
    enableDateFilter
    enableBranchFilter
    rowsBuilder={({ transactions }) => buildJournalReportRows(transactions)}
    summaryBuilder={({ transactions }, rows) => [
      { label: "Journal Rows", value: String(rows.length) },
      { label: "Sources", value: "Journal Entries" },
      { label: "Total Debit", value: rows.reduce((sum, row) => sum + row.debit, 0).toFixed(2) },
      { label: "Total Credit", value: rows.reduce((sum, row) => sum + row.credit, 0).toFixed(2) },
    ]}
    columns={[
      { key: "date", label: "Date" },
      { key: "reference", label: "Reference" },
      { key: "account", label: "Affected GL Account" },
      { key: "name", label: "Customer / GL Name" },
      { key: "description", label: "Description" },
      { key: "debit", label: "Debit", className: "text-end" },
      { key: "credit", label: "Credit", className: "text-end" },
      { key: "user", label: "User" },
    ]}
  />
);

export default JournalReport;
