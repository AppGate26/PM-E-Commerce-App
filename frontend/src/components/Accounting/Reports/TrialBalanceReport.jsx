import React, { useEffect, useMemo, useState } from "react";
import AccountingReportShell from "./AccountingReportShell";
import "./AccountingReports.css";
import { loadAccountingReportBundle, buildTrialBalanceDetail } from "../../../lib/accountingReports";
import { useBranchOptions } from "../../../lib/useBranchOptions";

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const TrialBalanceReport = () => {
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
        console.error("Failed to load Trial Balance Report:", error);
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

  // Opening balance needs postings before dateFrom, so the builder gets the full
  // transaction set plus the range (rather than pre-filtered transactions).
  const detail = useMemo(
    () => buildTrialBalanceDetail(bundle.transactions, bundle.accounts, { dateFrom, dateTo }),
    [bundle, dateFrom, dateTo]
  );

  const summary = [
    { label: "Accounts Listed", value: String(detail.rows.length) },
    { label: "Total Debit", value: formatMoney(detail.totals.debit) },
    { label: "Total Credit", value: formatMoney(detail.totals.credit) },
    { label: "Closing Balance", value: formatMoney(detail.totals.closing) },
  ];

  const showClear = dateFrom || dateTo || branchId;

  return (
    <AccountingReportShell
      title="Trial Balance Report"
      subtitle="Opening balance, period movement, and closing balance by account for the selected date and branch."
      badge="Trial Balance"
      summary={summary}
    >
      <div className="accounting-report-shell">
        <div className="journal-section-title-row journal-section-title-row-tight">
          <div>
            <h3>Trial Balance Report</h3>
            <p>Account code combines the chart-of-account and account-details codes.</p>
          </div>
        </div>

        <div className="accounting-report-filters">
          <div className="accounting-report-filter-field">
            <label htmlFor="trial-balance-date-from">Date From</label>
            <input
              id="trial-balance-date-from"
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </div>
          <div className="accounting-report-filter-field">
            <label htmlFor="trial-balance-date-to">Date To</label>
            <input
              id="trial-balance-date-to"
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>
          <div className="accounting-report-filter-field">
            <label htmlFor="trial-balance-branch">Branch</label>
            <select
              id="trial-balance-branch"
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
            <table className="table table-striped table-hover accounting-report-table">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="bg-primary text-white">Account Code</th>
                  <th className="bg-primary text-white">Account Name</th>
                  <th className="bg-primary text-white text-end">Opening Balance</th>
                  <th className="bg-primary text-white text-end">Credit</th>
                  <th className="bg-primary text-white text-end">Debit</th>
                  <th className="bg-primary text-white text-end">Closing Balance</th>
                </tr>
              </thead>
              <tbody>
                {detail.rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center fw-semibold py-4">
                      No report rows available.
                    </td>
                  </tr>
                ) : (
                  detail.rows.map((row) => (
                    <tr key={row.key}>
                      <td>
                        <span className="balance-sheet-code">{row.code}</span>
                      </td>
                      <td>{row.name || "-"}</td>
                      <td className="text-end">{formatMoney(row.opening)}</td>
                      <td className="text-end">{formatMoney(row.credit)}</td>
                      <td className="text-end">{formatMoney(row.debit)}</td>
                      <td className="text-end">{formatMoney(row.closing)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {detail.rows.length > 0 && (
                <tfoot>
                  <tr className="balance-sheet-total-row">
                    <td colSpan={2}>Totals</td>
                    <td className="text-end">{formatMoney(detail.totals.opening)}</td>
                    <td className="text-end">{formatMoney(detail.totals.credit)}</td>
                    <td className="text-end">{formatMoney(detail.totals.debit)}</td>
                    <td className="text-end">{formatMoney(detail.totals.closing)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </AccountingReportShell>
  );
};

export default TrialBalanceReport;
