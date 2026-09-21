import React, { useState, useEffect } from "react";
import { apiRequest } from "../../../../lib/config";
import "../Ledger/SupplierLedger.css";

const PaySupplier = ({ togglePaySupplier }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [form, setForm] = useState({
    amountPaid: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: "BANK_TRANSFER",
    paymentReference: "",
    invoiceNumber: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  useEffect(() => {
    if (!selectedSupplierId) {
      setBalance(null);
      setHistory([]);
      return;
    }
    fetchBalanceAndHistory(selectedSupplierId);
  }, [selectedSupplierId]);

  const fetchBalanceAndHistory = async (supplierId) => {
    setBalanceLoading(true);
    try {
      const res = await apiRequest(
        `/inventory/supplier-ledger/supplier/${supplierId}?page=0&size=1000`,
        "GET"
      );
      const list =
        res?.response?.content || res?.data?.content || res?.content || (Array.isArray(res) ? res : []);
      setBalance(list.length > 0 ? Number(list[list.length - 1].balance) : 0);
    } catch {
      setBalance(null);
    } finally {
      setBalanceLoading(false);
    }

    setHistoryLoading(true);
    try {
      const res = await apiRequest(`/admin/supplier-payments/supplier/${supplierId}`, "GET");
      const list = res?.response || res?.data || (Array.isArray(res) ? res : []);
      setHistory(Array.isArray(list) ? list : []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      setError("Please select a supplier");
      setTimeout(() => setError(""), 3000);
      return;
    }
    if (!form.amountPaid || Number(form.amountPaid) <= 0) {
      setError("Please enter a valid amount paid");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await apiRequest("/admin/supplier-payments", "POST", {
        supplierId: Number(selectedSupplierId),
        amountPaid: Number(form.amountPaid),
        paymentDate: form.paymentDate || null,
        paymentMethod: form.paymentMethod,
        paymentReference: form.paymentReference || null,
        invoiceNumber: form.invoiceNumber || null,
        notes: form.notes || null,
      });
      setSuccess("Payment recorded successfully. The supplier's balance has been updated.");
      setForm({
        amountPaid: "",
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMethod: "BANK_TRANSFER",
        paymentReference: "",
        invoiceNumber: "",
        notes: "",
      });
      fetchBalanceAndHistory(selectedSupplierId);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err?.message || "Failed to record payment");
      setTimeout(() => setError(""), 4000);
    } finally {
      setSaving(false);
    }
  };

  const selectedSupplier = suppliers.find((s) => String(s.id) === String(selectedSupplierId));

  return (
    <div className="supplier-ledger-container">
      <div className="supplier-ledger-header">
        <h2>PAY SUPPLIER</h2>
        <button className="sl-close-btn" onClick={togglePaySupplier}>✕</button>
      </div>

      {error && <div className="sl-alert sl-alert-danger">{error}</div>}
      {success && <div className="sl-alert sl-alert-success">{success}</div>}

      <div className="sl-controls">
        <div className="sl-row">
          <div className="sl-field sl-field-wide">
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
        </div>
      </div>

      {selectedSupplierId && (
        <div className="sl-supplier-info">
          <strong>{selectedSupplier?.customerName}</strong>
          <span>{selectedSupplier?.supplierId}</span>
          <span>
            {balanceLoading
              ? "Loading balance..."
              : balance != null
              ? `Amount owed: ₦${balance.toLocaleString()}`
              : "Amount owed: N/A"}
          </span>
        </div>
      )}

      {selectedSupplierId && (
        <form className="sl-add-form" onSubmit={handleSubmit}>
          <h3>Record Payment</h3>
          <div className="sl-form-row">
            <div className="sl-field">
              <label>AMOUNT PAID (₦)</label>
              <input
                type="number"
                className="sl-input"
                value={form.amountPaid}
                min="0.01"
                step="0.01"
                placeholder="0.00"
                onChange={(e) => setForm((p) => ({ ...p, amountPaid: e.target.value }))}
                required
              />
            </div>
            <div className="sl-field">
              <label>PAYMENT DATE</label>
              <input
                type="date"
                className="sl-input"
                value={form.paymentDate}
                onChange={(e) => setForm((p) => ({ ...p, paymentDate: e.target.value }))}
              />
            </div>
            <div className="sl-field">
              <label>PAYMENT METHOD</label>
              <select
                className="sl-select"
                value={form.paymentMethod}
                onChange={(e) => setForm((p) => ({ ...p, paymentMethod: e.target.value }))}
              >
                <option value="BANK_TRANSFER">BANK TRANSFER</option>
                <option value="CASH">CASH</option>
                <option value="CHEQUE">CHEQUE</option>
                <option value="CARD">CARD</option>
              </select>
            </div>
          </div>
          <div className="sl-form-row">
            <div className="sl-field">
              <label>PAYMENT REFERENCE</label>
              <input
                type="text"
                className="sl-input"
                value={form.paymentReference}
                placeholder="e.g. transaction/cheque number"
                onChange={(e) => setForm((p) => ({ ...p, paymentReference: e.target.value }))}
              />
            </div>
            <div className="sl-field">
              <label>INVOICE NUMBER (OPTIONAL)</label>
              <input
                type="text"
                className="sl-input"
                value={form.invoiceNumber}
                placeholder="Goods-supplied invoice being settled"
                onChange={(e) => setForm((p) => ({ ...p, invoiceNumber: e.target.value }))}
              />
            </div>
          </div>
          <div className="sl-form-row">
            <div className="sl-field sl-field-wide">
              <label>NOTES</label>
              <input
                type="text"
                className="sl-input"
                value={form.notes}
                placeholder="Optional notes"
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>
          </div>
          <button type="submit" className="sl-btn sl-btn-primary" disabled={saving}>
            {saving ? "SAVING..." : "RECORD PAYMENT"}
          </button>
        </form>
      )}

      {selectedSupplierId && (
        <div className="sl-ledger-section">
          <div className="sl-table-wrap">
            <table className="sl-table">
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>DATE</th>
                  <th>AMOUNT PAID (₦)</th>
                  <th>METHOD</th>
                  <th>REFERENCE</th>
                  <th>INVOICE NO</th>
                </tr>
              </thead>
              <tbody>
                {historyLoading ? (
                  <tr>
                    <td colSpan={6} className="sl-no-data">Loading payment history...</td>
                  </tr>
                ) : history.length > 0 ? (
                  history.map((p, i) => (
                    <tr key={p.id || i}>
                      <td>{i + 1}</td>
                      <td>{p.paymentDate || "N/A"}</td>
                      <td className="sl-amount">{p.amountPaid != null ? Number(p.amountPaid).toLocaleString() : "0.00"}</td>
                      <td>{p.paymentMethod || "N/A"}</td>
                      <td>{p.paymentReference || "N/A"}</td>
                      <td>{p.invoiceNumber || "N/A"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="sl-no-data">No payments recorded yet for this supplier</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaySupplier;
