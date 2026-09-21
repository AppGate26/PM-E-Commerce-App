import React from "react";
import AccountingReportTablePage from "./AccountingReportTablePage";
import { buildCamelRows } from "../../../lib/accountingReports";

const CamelReport = () => (
  <AccountingReportTablePage
    title="CAMEL Report"
    subtitle="Display a compact CAMEL-style operational snapshot derived from the current accounting activity."
    badge="CAMEL"
    rowsBuilder={({ transactions, accounts }) => buildCamelRows(transactions, accounts)}
    summaryBuilder={(_, rows) => [
      { label: "Metrics", value: String(rows.length) },
      { label: "Capital", value: (rows.find((row) => row.metric === "Capital Adequacy")?.value || 0).toFixed(2) },
      { label: "Earnings", value: (rows.find((row) => row.metric === "Earnings")?.value || 0).toFixed(2) },
      { label: "Liquidity", value: (rows.find((row) => row.metric === "Liquidity")?.value || 0).toFixed(2) },
    ]}
    columns={[
      { key: "metric", label: "Metric" },
      { key: "value", label: "Value", className: "text-end" },
      { key: "note", label: "Note" },
    ]}
  />
);

export default CamelReport;
