import React, { useEffect, useMemo, useState } from "react";
import AccountingReportShell from "./AccountingReportShell";
import "./AccountingReports.css";
import { loadAccountingReportBundle, buildBalanceSheetDetail } from "../../../lib/accountingReports";
import { useBranchOptions } from "../../../lib/useBranchOptions";

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// Keep only transactions whose date falls in [dateFrom, dateTo] (both optional).
const filterTransactionsByDate = (transactions = [], dateFrom = "", dateTo = "") => {
  if (!dateFrom && !dateTo) return transactions;
  const fromTime = dateFrom ? Date.parse(`${dateFrom}T00:00:00`) : null;
  const toTime = dateTo ? Date.parse(`${dateTo}T23:59:59`) : null;
  return transactions.filter((row) => {
    const time = Date.parse(row.transactionDate || "");
    if (Number.isNaN(time)) return false;
    if (fromTime != null && time < fromTime) return false;
    if (toTime != null && time > toTime) return false;
    return true;
  });
};

const BalanceSheetReport = () => {
  const [loading, setLoading] = useState(true);
  const [bundle, setBundle] = useState({ transactions: [], accounts: [] });
  const [branchId, setBranchId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { options: branchOptions, loading: branchesLoading } = useBranchOptions();

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        const data = await loadAccountingReportBundle(branchId || undefined);
        if (active) setBundle(data);
      } catch (error) {
        console.error("Failed to load Balance Sheet Report:", error);
        if (active) setBundle({ transactions: [], accounts: [] });
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [branchId]);

  const detail = useMemo(() => {
    const transactions = filterTransactionsByDate(bundle.transactions, dateFrom, dateTo);
    return buildBalanceSheetDetail(transactions, bundle.accounts);
  }, [bundle, dateFrom, dateTo]);

  // Sum of all liabilities / assets / equities shown at the top (item 19).
  const summary = [
    { label: "Total Assets", value: formatMoney(detail.totals.assets) },
    { label: "Total Liabilities", value: formatMoney(detail.totals.liabilities) },
    { label: "Total Equity", value: formatMoney(detail.totals.equity) },
    { label: "Liabilities + Equity", value: formatMoney(detail.totals.liabilities + detail.totals.equity) },
  ];

  // Header indicator (item 20): green when balanced, red when not.
  const indicator = (
    <div
      className={`balance-sheet-indicator ${detail.isBalanced ? "is-balanced" : "not-balanced"}`}
      title={
        detail.isBalanced
          ? "Assets equal Liabilities + Equity"
          : `Out of balance by ${formatMoney(detail.totals.difference)}`
      }
    >
      <span className="balance-sheet-indicator-dot" />
      {detail.isBalanced ? "BALANCED" : "NOT BALANCED"}
    </div>
  );

  const showClear = dateFrom || dateTo || branchId;

  return (
    <AccountingReportShell
      title="Balance Sheet Report"
      subtitle="Assets, liabilities, and equity by chart of account for the selected date and branch."
      badge="Balance Sheet"
      headerRight={indicator}
      summary={summary}
    >
      <div className="accounting-report-shell">
        <div className="journal-section-title-row journal-section-title-row-tight">
          <div>
            <h3>Balance Sheet Report</h3>
            <p>Each section lists its chart of accounts; section totals are the sum of the postings.</p>
          </div>
        </div>

        <div className="accounting-report-filters">
          <div className="accounting-report-filter-field">
            <label htmlFor="balance-sheet-date-from">Date From</label>
            <input
              id="balance-sheet-date-from"
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </div>
          <div className="accounting-report-filter-field">
            <label htmlFor="balance-sheet-date-to">Date To</label>
            <input
              id="balance-sheet-date-to"
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>
          <div className="accounting-report-filter-field">
            <label htmlFor="balance-sheet-branch">Branch</label>
            <select
              id="balance-sheet-branch"
              value={branchId}
              onChange={(event) => setBranchId(event.target.value)}
              disabled={branchesLoading}
            >
              <option value="">Head Office (default)</option>
              {branchOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {showClear && (
            <button
              type="button"
              className="accounting-report-filter-clear"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                setBranchId("");
              }}
            >
              Clear
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center fw-semibold py-4">Loading report...</div>
        ) : (
          <div className="table-responsive accounting-report-table-wrap">
            <table className="table table-striped table-hover accounting-report-table balance-sheet-table">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="bg-primary text-white">Chart Of Account</th>
                  <th className="bg-primary text-white text-end">Debit</th>
                  <th className="bg-primary text-white text-end">Credit</th>
                  <th className="bg-primary text-white text-end">Balance</th>
                </tr>
              </thead>
              <tbody>
                {detail.sections.map((section) => (
                  <React.Fragment key={section.key}>
                    <tr className="balance-sheet-section-row">
                      <td colSpan={4}>{section.label}</td>
                    </tr>
                    {section.rows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center text-muted py-3">
                          No postings for this section.
                        </td>
                      </tr>
                    ) : (
                      section.rows.map((row, index) => (
                        <tr key={`${section.key}-${row.code}-${index}`}>
                          <td>
                            <span className="balance-sheet-code">{row.code}</span>
                            {row.name ? <span className="balance-sheet-name"> — {row.name}</span> : null}
                          </td>
                          <td className="text-end">{formatMoney(row.debit)}</td>
                          <td className="text-end">{formatMoney(row.credit)}</td>
                          <td className="text-end">{formatMoney(row.balance)}</td>
                        </tr>
                      ))
                    )}
                    <tr className="balance-sheet-total-row">
                      <td>Total {section.label}</td>
                      <td className="text-end">{formatMoney(section.debit)}</td>
                      <td className="text-end">{formatMoney(section.credit)}</td>
                      <td className="text-end">{formatMoney(section.balance)}</td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AccountingReportShell>
  );
};

export default BalanceSheetReport;
