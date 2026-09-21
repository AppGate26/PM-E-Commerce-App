import React, { useState } from "react";
import { apiRequest } from "../../../lib/config";
import { useLanguage } from "../../../context/LanguageContext";
import * as XLSX from "xlsx";

const CustomerLedger = () => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [allDates, setAllDates] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError("");
    try {
      const res = await apiRequest(
        `/admin/customers/search?query=${encodeURIComponent(searchQuery)}`,
        "GET"
      );
      const payload = res?.data ?? res?.response ?? res;
      const list = payload?.content ?? (Array.isArray(payload) ? payload : []);
      setSearchResults(list);
    } catch {
      setError(t("Search failed. Please try again."));
    } finally {
      setSearching(false);
    }
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setSearchResults([]);
    setSearchQuery(`${customer.firstName} ${customer.surname} — ${customer.accountNumber}`);
    setTransactions([]);
  };

  const fetchLedger = async () => {
    if (!selectedCustomer) {
      setError(t("Please select a customer first."));
      return;
    }

    const customerId = selectedCustomer.id ?? selectedCustomer.customerId;
    if (customerId == null) {
      setError(t("Selected customer has no account id. Please re-select the customer."));
      return;
    }

    setLoading(true);
    setError("");
    try {
      let url = `/cashier/customer/${customerId}/ledger`;
      if (!allDates && startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await apiRequest(url, "GET");
      // Backend wraps the ledger map under `response`; transactions may also come
      // back paged (`content`) depending on the query path.
      const ledger = res?.response ?? res?.data ?? res ?? {};
      const txData =
        ledger.transactions?.content ??
        ledger.transactions ??
        res?.transactions ??
        [];
      setTransactions(Array.isArray(txData) ? txData : []);
    } catch (err) {
      setError(err?.message || t("Failed to load ledger."));
    } finally {
      setLoading(false);
    }
  };

  const fmt = (val) =>
    val != null ? Number(val).toLocaleString("en-NG", { minimumFractionDigits: 2 }) : "—";

  const totals = transactions.reduce(
    (acc, tx) => ({
      debit: acc.debit + (Number(tx.debitAmount) || 0),
      credit: acc.credit + (Number(tx.creditAmount) || 0),
    }),
    { debit: 0, credit: 0 }
  );

  const exportCSV = () => {
    const rows = [
      ["S/N", "DATE", "DETAILS", "REF NO", "DEBIT", "CREDIT", "BALANCE"],
      ...transactions.map((tx, i) => [
        i + 1,
        tx.transactionDate,
        tx.transactionDetails,
        tx.refNo,
        tx.debitAmount,
        tx.creditAmount,
        tx.balance,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `customer_ledger_${selectedCustomer?.accountNumber || "export"}.csv`;
    a.click();
  };

  const exportXLSX = () => {
    const data = transactions.map((tx, i) => ({
      "S/N": i + 1,
      DATE: tx.transactionDate,
      DETAILS: tx.transactionDetails,
      "REF NO": tx.refNo,
      DEBIT: tx.debitAmount,
      CREDIT: tx.creditAmount,
      BALANCE: tx.balance,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, `customer_ledger_${selectedCustomer?.accountNumber || "export"}.xlsx`);
  };

  const handlePrint = () => window.print();

  return (
    <div className="p-3">
      <h5 className="fw-bold mb-3">{t("Customer Ledger")}</h5>

      {/* Customer Search */}
      <div className="mb-3">
        <label className="form-label fw-semibold">{t("Search Customer")}</label>
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder={t("Name or account number...")}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (selectedCustomer) setSelectedCustomer(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button className="btn btn-primary" onClick={handleSearch} disabled={searching}>
            {searching ? t("Searching...") : t("Search")}
          </button>
        </div>
        {searchResults.length > 0 && (
          <ul className="list-group mt-1 shadow-sm" style={{ maxHeight: 200, overflowY: "auto", zIndex: 10, position: "relative" }}>
            {searchResults.map((c) => (
              <li
                key={c.id}
                className="list-group-item list-group-item-action"
                style={{ cursor: "pointer" }}
                onClick={() => selectCustomer(c)}
              >
                <strong>{c.firstName} {c.surname}</strong>
                <span className="text-muted ms-2">({c.accountNumber})</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Date Filter */}
      <div className="mb-3">
        <div className="form-check mb-2">
          <input
            className="form-check-input"
            type="checkbox"
            id="allDatesCheck"
            checked={allDates}
            onChange={(e) => setAllDates(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="allDatesCheck">
            {t("All dates")}
          </label>
        </div>
        {!allDates && (
          <div className="row g-2">
            <div className="col-6">
              <label className="form-label">{t("Start Date")}</label>
              <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="col-6">
              <label className="form-label">{t("End Date")}</label>
              <input type="date" className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      <button className="btn btn-success mb-3" onClick={fetchLedger} disabled={loading || !selectedCustomer}>
        {loading ? t("Loading...") : t("View Ledger")}
      </button>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      {/* Ledger Table */}
      {transactions.length > 0 && (
        <>
          {/* Customer Info */}
          {selectedCustomer && (
            <div className="mb-2 text-muted small">
              <strong>{selectedCustomer.firstName} {selectedCustomer.surname}</strong>
              {" · "}{t("Account")}: <strong>{selectedCustomer.accountNumber}</strong>
            </div>
          )}

          {/* Export Actions */}
          <div className="d-flex gap-2 mb-3 flex-wrap">
            <button className="btn btn-outline-secondary btn-sm" onClick={handlePrint}>{t("Print")}</button>
            <button className="btn btn-outline-success btn-sm" onClick={exportCSV}>{t("Export CSV")}</button>
            <button className="btn btn-outline-primary btn-sm" onClick={exportXLSX}>{t("Export XLSX")}</button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="table table-bordered table-sm table-hover">
              <thead className="table-dark">
                <tr>
                  <th>{t("S/N")}</th>
                  <th>{t("Date")}</th>
                  <th>{t("Details")}</th>
                  <th>{t("Ref No")}</th>
                  <th className="text-end">{t("Debit")}</th>
                  <th className="text-end">{t("Credit")}</th>
                  <th className="text-end">{t("Balance")}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => (
                  <tr key={tx.id ?? `${tx.refNo || "tx"}-${i}`} className={tx.debitAmount > 0 ? "table-danger" : "table-success"}>
                    <td>{i + 1}</td>
                    <td>{tx.transactionDate}</td>
                    <td>{tx.transactionDetails}</td>
                    <td>{tx.refNo}</td>
                    <td className="text-end">{tx.debitAmount > 0 ? fmt(tx.debitAmount) : "—"}</td>
                    <td className="text-end">{tx.creditAmount > 0 ? fmt(tx.creditAmount) : "—"}</td>
                    <td className="text-end fw-semibold">{fmt(tx.balance)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="fw-bold">
                <tr className="table-secondary">
                  <td colSpan={4}>{t("TOTALS")}</td>
                  <td className="text-end">{fmt(totals.debit)}</td>
                  <td className="text-end">{fmt(totals.credit)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      {!loading && transactions.length === 0 && selectedCustomer && (
        <p className="text-muted text-center mt-3">{t("No transactions found.")}</p>
      )}
    </div>
  );
};

export default CustomerLedger;
