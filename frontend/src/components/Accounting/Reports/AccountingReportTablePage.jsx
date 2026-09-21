import React, { useEffect, useMemo, useState } from "react";
import AccountingReportShell from "./AccountingReportShell";
import "./AccountingReports.css";
import { loadAccountingReportBundle } from "../../../lib/accountingReports";
import { useBranchOptions } from "../../../lib/useBranchOptions";

const formatValue = (value) => {
  if (typeof value === "number") {
    return value.toFixed(2);
  }
  return value ?? "-";
};

// Keep only transactions whose date falls in [dateFrom, dateTo] (both optional).
// dateTo is inclusive to the end of that day.
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

const AccountingReportTablePage = ({
  title,
  subtitle,
  badge,
  summaryBuilder,
  rowsBuilder,
  columns,
  enableDateFilter = false,
  enableBranchFilter = false,
}) => {
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
        const data = await loadAccountingReportBundle(
          enableBranchFilter ? branchId || undefined : undefined
        );
        if (active) {
          setBundle(data);
        }
      } catch (error) {
        console.error(`Failed to load ${title}:`, error);
        if (active) {
          setBundle({ transactions: [], accounts: [] });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [title, branchId, enableBranchFilter]);

  const filteredBundle = useMemo(() => {
    if (!enableDateFilter || (!dateFrom && !dateTo)) return bundle;
    return {
      ...bundle,
      transactions: filterTransactionsByDate(bundle.transactions, dateFrom, dateTo),
    };
  }, [bundle, enableDateFilter, dateFrom, dateTo]);

  const rows = useMemo(() => rowsBuilder(filteredBundle), [filteredBundle, rowsBuilder]);
  const summary = useMemo(
    () => summaryBuilder(filteredBundle, rows),
    [filteredBundle, rows, summaryBuilder]
  );

  const showFilters = enableDateFilter || enableBranchFilter;

  return (
    <AccountingReportShell title={title} subtitle={subtitle} badge={badge} summary={summary}>
      <div className="accounting-report-shell">
        <div className="journal-section-title-row journal-section-title-row-tight">
          <div>
            <h3>{title}</h3>
            <p>{subtitle}</p>
          </div>
        </div>

        {showFilters && (
          <div className="accounting-report-filters">
            {enableDateFilter && (
              <>
                <div className="accounting-report-filter-field">
                  <label htmlFor={`${title}-date-from`}>Date From</label>
                  <input
                    id={`${title}-date-from`}
                    type="date"
                    value={dateFrom}
                    max={dateTo || undefined}
                    onChange={(event) => setDateFrom(event.target.value)}
                  />
                </div>
                <div className="accounting-report-filter-field">
                  <label htmlFor={`${title}-date-to`}>Date To</label>
                  <input
                    id={`${title}-date-to`}
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={(event) => setDateTo(event.target.value)}
                  />
                </div>
              </>
            )}
            {enableBranchFilter && (
              <div className="accounting-report-filter-field">
                <label htmlFor={`${title}-branch`}>Branch</label>
                <select
                  id={`${title}-branch`}
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
            )}
            {(dateFrom || dateTo || branchId) && (
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
        )}

        <div className="table-responsive accounting-report-table-wrap">
          <table className="table table-striped table-hover accounting-report-table">
            <thead className="bg-primary text-white">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className="bg-primary text-white">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="text-center fw-semibold py-4">
                    Loading report...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center fw-semibold py-4">
                    No report rows available.
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={row.id ?? row.code ?? row.reference ?? `${title}-${index}`}>
                    {columns.map((column) => (
                      <td key={column.key} className={column.className || ""}>
                        {formatValue(row[column.key])}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AccountingReportShell>
  );
};

export default AccountingReportTablePage;
