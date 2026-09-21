import React, { useState, useEffect } from "react";
import { apiRequest } from "../../../../lib/config";
import * as XLSX from "xlsx";
import "./SupplierLedger.css";

const SupplierLedger = ({ toggleSupplierLedger }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ledgerData, setLedgerData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [error, setError] = useState("");
  const [addForm, setAddForm] = useState({
    transactionDate: "",
    description: "",
    referenceNo: "",
    transactionType: "DEBIT",
    debit: "",
    credit: "",
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState("");
  const [view, setView] = useState("ledger");

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await apiRequest("/users/suppliers", "GET");
        const list = Array.isArray(res) ? res : res?.response || res?.data || [];
        setSuppliers(list);
      } catch {
        setSuppliers([]);
      } finally {
        setSuppliersLoading(false);
      }
    };
    fetchSuppliers();
  }, []);

  const fetchLedger = async () => {
    if (!selectedSupplierId) {
      setError("Please select a supplier");
      setTimeout(() => setError(""), 3000);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      const url = `/inventory/supplier-ledger/supplier/${selectedSupplierId}${params.toString() ? "?" + params : ""}`;
      const res = await apiRequest(url, "GET");
      const list = res?.response?.content || res?.data?.content || res?.content || (Array.isArray(res) ? res : []);
      setLedgerData(list);
    } catch (e) {
      setError(e?.message || "Failed to load ledger");
      setLedgerData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      setError("Please select a supplier first");
      return;
    }
    setAddLoading(true);
    setError("");
    setAddSuccess("");
    try {
      const payload = {
        supplierId: Number(selectedSupplierId),
        transactionDate: addForm.transactionDate || new Date().toISOString().slice(0, 10),
        description: addForm.description,
        referenceNo: addForm.referenceNo,
        transactionType: addForm.transactionType,
        debit: addForm.debit ? Number(addForm.debit) : 0,
        credit: addForm.credit ? Number(addForm.credit) : 0,
      };
      await apiRequest("/inventory/supplier-ledger", "POST", payload);
      setAddSuccess("Ledger entry added successfully");
      setAddForm({ transactionDate: "", description: "", referenceNo: "", transactionType: "DEBIT", debit: "", credit: "" });
      fetchLedger();
      setTimeout(() => setAddSuccess(""), 3000);
    } catch (e) {
      setError(e?.message || "Failed to add entry");
    } finally {
      setAddLoading(false);
    }
  };

  const headers = ["S/N", "DATE", "DESCRIPTION", "REFERENCE NO", "TYPE", "DEBIT (₦)", "CREDIT (₦)", "BALANCE (₦)"];

  const buildRows = () =>
    ledgerData.map((item, i) => [
      i + 1,
      item.transactionDate || "N/A",
      item.description || "N/A",
      item.referenceNo || "N/A",
      item.transactionType || "N/A",
      item.debit != null ? Number(item.debit).toLocaleString() : "0.00",
      item.credit != null ? Number(item.credit).toLocaleString() : "0.00",
      item.balance != null ? Number(item.balance).toLocaleString() : "0.00",
    ]);

  const handleExportCSV = () => {
    if (!ledgerData.length) return;
    const csv = [headers, ...buildRows()].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `supplier-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportXLSX = () => {
    if (!ledgerData.length) return;
    const ws = XLSX.utils.aoa_to_sheet([headers, ...buildRows()]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Supplier Ledger");
    XLSX.writeFile(wb, `supplier-ledger-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const selectedSupplier = suppliers.find((s) => String(s.id) === String(selectedSupplierId));

  return (
    <div className="supplier-ledger-container">
      <div className="supplier-ledger-header">
        <h2>SUPPLIER LEDGER</h2>
        <button className="sl-close-btn" onClick={toggleSupplierLedger}>✕</button>
      </div>

      {error && <div className="sl-alert sl-alert-danger">{error}</div>}
      {addSuccess && <div className="sl-alert sl-alert-success">{addSuccess}</div>}

      <div className="sl-controls">
        <div className="sl-row">
          <div className="sl-field">
            <label>SUPPLIER</label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="sl-select"
            >
              <option value="">-- Select Supplier --</option>
              {suppliersLoading ? (
                <option disabled>Loading...</option>
              ) : (
                suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.customerName} ({s.supplierId})
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="sl-field">
            <label>FROM DATE</label>
            <input type="date" className="sl-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="sl-field">
            <label>TO DATE</label>
            <input type="date" className="sl-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <button className="sl-btn sl-btn-primary" onClick={fetchLedger}>VIEW LEDGER</button>
        </div>
      </div>

      <div className="sl-tabs">
        <button className={`sl-tab ${view === "ledger" ? "active" : ""}`} onClick={() => setView("ledger")}>LEDGER</button>
        <button className={`sl-tab ${view === "add" ? "active" : ""}`} onClick={() => setView("add")}>ADD ENTRY</button>
      </div>

      {view === "add" && (
        <form className="sl-add-form" onSubmit={handleAddEntry}>
          <h3>Add Ledger Entry {selectedSupplier ? `— ${selectedSupplier.customerName}` : ""}</h3>
          <div className="sl-form-row">
            <div className="sl-field">
              <label>DATE</label>
              <input type="date" className="sl-input" value={addForm.transactionDate}
                onChange={(e) => setAddForm((p) => ({ ...p, transactionDate: e.target.value }))} />
            </div>
            <div className="sl-field">
              <label>REFERENCE NO</label>
              <input type="text" className="sl-input" value={addForm.referenceNo} placeholder="REF-001"
                onChange={(e) => setAddForm((p) => ({ ...p, referenceNo: e.target.value }))} />
            </div>
            <div className="sl-field">
              <label>TYPE</label>
              <select className="sl-select" value={addForm.transactionType}
                onChange={(e) => setAddForm((p) => ({ ...p, transactionType: e.target.value }))}>
                <option value="DEBIT">DEBIT (Amount owed to supplier)</option>
                <option value="CREDIT">CREDIT (Payment made to supplier)</option>
                <option value="GOODS_SUPPLIED">GOODS SUPPLIED</option>
                <option value="PAYMENT">PAYMENT</option>
                <option value="ADVANCE">ADVANCE PAYMENT</option>
                <option value="ADJUSTMENT">ADJUSTMENT</option>
              </select>
            </div>
          </div>
          <div className="sl-form-row">
            <div className="sl-field sl-field-wide">
              <label>DESCRIPTION</label>
              <input type="text" className="sl-input" value={addForm.description} placeholder="Description of transaction"
                onChange={(e) => setAddForm((p) => ({ ...p, description: e.target.value }))} required />
            </div>
          </div>
          <div className="sl-form-row">
            <div className="sl-field">
              <label>DEBIT (₦)</label>
              <input type="number" className="sl-input" value={addForm.debit} min="0" step="0.01" placeholder="0.00"
                onChange={(e) => setAddForm((p) => ({ ...p, debit: e.target.value }))} />
            </div>
            <div className="sl-field">
              <label>CREDIT (₦)</label>
              <input type="number" className="sl-input" value={addForm.credit} min="0" step="0.01" placeholder="0.00"
                onChange={(e) => setAddForm((p) => ({ ...p, credit: e.target.value }))} />
            </div>
          </div>
          <button type="submit" className="sl-btn sl-btn-primary" disabled={addLoading}>
            {addLoading ? "SAVING..." : "ADD ENTRY"}
          </button>
        </form>
      )}

      {view === "ledger" && (
        <div className="sl-ledger-section">
          {selectedSupplier && (
            <div className="sl-supplier-info">
              <strong>{selectedSupplier.customerName}</strong>
              <span>{selectedSupplier.supplierId}</span>
              {selectedSupplier.contactPhoneNo && <span>{selectedSupplier.contactPhoneNo}</span>}
            </div>
          )}
          {loading ? (
            <div className="sl-loading">Loading ledger...</div>
          ) : (
            <>
              <div className="sl-table-wrap">
                <table className="sl-table">
                  <thead>
                    <tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {ledgerData.length > 0 ? ledgerData.map((item, i) => (
                      <tr key={i} className={item.transactionType === "CREDIT" || item.transactionType === "PAYMENT" ? "sl-credit-row" : ""}>
                        <td>{i + 1}</td>
                        <td>{item.transactionDate || "N/A"}</td>
                        <td>{item.description || "N/A"}</td>
                        <td>{item.referenceNo || "N/A"}</td>
                        <td><span className={`sl-type-badge sl-type-${(item.transactionType || "").toLowerCase()}`}>{item.transactionType}</span></td>
                        <td className="sl-amount">{item.debit != null ? Number(item.debit).toLocaleString() : "—"}</td>
                        <td className="sl-amount">{item.credit != null ? Number(item.credit).toLocaleString() : "—"}</td>
                        <td className="sl-balance">{item.balance != null ? Number(item.balance).toLocaleString() : "—"}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={8} className="sl-no-data">
                          {selectedSupplierId ? "No ledger entries found" : "Select a supplier and click VIEW LEDGER"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {ledgerData.length > 0 && (
                    <tfoot>
                      <tr className="sl-totals-row">
                        <td colSpan={5}><strong>TOTALS</strong></td>
                        <td className="sl-amount"><strong>₦{ledgerData.reduce((s, r) => s + (Number(r.debit) || 0), 0).toLocaleString()}</strong></td>
                        <td className="sl-amount"><strong>₦{ledgerData.reduce((s, r) => s + (Number(r.credit) || 0), 0).toLocaleString()}</strong></td>
                        <td className="sl-balance"><strong>₦{ledgerData.length > 0 ? Number(ledgerData[ledgerData.length - 1].balance).toLocaleString() : "0"}</strong></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
              {ledgerData.length > 0 && (
                <div className="sl-actions">
                  <button className="sl-btn sl-btn-secondary" onClick={() => window.print()}>PRINT</button>
                  <button className="sl-btn sl-btn-secondary" onClick={handleExportCSV}>EXPORT CSV</button>
                  <button className="sl-btn sl-btn-secondary" onClick={handleExportXLSX}>EXPORT XLSX</button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SupplierLedger;
