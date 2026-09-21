import React, { useEffect, useMemo, useState } from "react";
import AccountingReportShell from "./AccountingReportShell";
import "./AccountingReports.css";
import { loadAccountingReportBundle, buildProfitAndLossDetail } from "../../../lib/accountingReports";
import { useBranchOptions } from "../../../lib/useBranchOptions";

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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

const ProfitLossReport = () => {
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
        console.error("Failed to load Profit & Loss Report:", error);
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
    return buildProfitAndLossDetail(transactions, bundle.accounts);
  }, [bundle, dateFrom, dateTo]);

  const summary = [
    { label: "Total Income", value: formatMoney(detail.totals.income) },
    { label: "Total Expense", value: formatMoney(detail.totals.expense) },
    { label: "Net Profit / Loss", value: formatMoney(detail.totals.netProfit) },
  ];

  const showClear = dateFrom || dateTo || branchId;

  return (
    <AccountingReportShell
      title="Profit & Loss Report"
      subtitle="Income and expense account details with credit, debit, and balance for the selected date and branch."
      badge="P&L"
      summary={summary}
    >
      <div className="accounting-report-shell">
        <div className="journal-section-title-row journal-section-title-row-tight">
          <div>
            <h3>Profit &amp; Loss Report</h3>
            <p>Each section lists its account details; the net profit or loss is income less expense.</p>
          </div>
        </div>

        <div className="accounting-report-filters">
          <div className="accounting-report-filter-field">
            <label htmlFor="profit-loss-date-from">Date From</label>
            <input
              id="profit-loss-date-from"
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </div>
          <div className="accounting-report-filter-field">
            <label htmlFor="profit-loss-date-to">Date To</label>
            <input
              id="profit-loss-date-to"
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>
          <div className="accounting-report-filter-field">
            <label htmlFor="profit-loss-branch">Branch</label>
            <select
              id="profit-loss-branch"
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
                  <th className="bg-primary text-white">Account Code</th>
                  <th className="bg-primary text-white">Account Name</th>
                  <th className="bg-primary text-white text-end">Credit</th>
                  <th className="bg-primary text-white text-end">Debit</th>
                  <th className="bg-primary text-white text-end">Balance</th>
                </tr>
              </thead>
              <tbody>
                {detail.sections.map((section) => (
                  <React.Fragment key={section.key}>
                    <tr className="balance-sheet-section-row">
                      <td colSpan={5}>{section.label}</td>
                    </tr>
                    {section.rows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-3">
                          No postings for this section.
                        </td>
                      </tr>
                    ) : (
                      section.rows.map((row, index) => (
                        <tr key={`${section.key}-${row.code}-${index}`}>
                          <td>
                            <span className="balance-sheet-code">{row.code}</span>
                          </td>
                          <td>{row.name || "-"}</td>
                          <td className="text-end">{formatMoney(row.credit)}</td>
                          <td className="text-end">{formatMoney(row.debit)}</td>
                          <td className="text-end">{formatMoney(row.balance)}</td>
                        </tr>
                      ))
                    )}
                    <tr className="balance-sheet-total-row">
                      <td colSpan={2}>Total {section.label}</td>
                      <td className="text-end">{formatMoney(section.credit)}</td>
                      <td className="text-end">{formatMoney(section.debit)}</td>
                      <td className="text-end">{formatMoney(section.balance)}</td>
                    </tr>
                  </React.Fragment>
                ))}
                <tr className="balance-sheet-total-row">
                  <td colSpan={4}>Net Profit / Loss</td>
                  <td className="text-end">{formatMoney(detail.totals.netProfit)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AccountingReportShell>
  );
};

export default ProfitLossReport;
