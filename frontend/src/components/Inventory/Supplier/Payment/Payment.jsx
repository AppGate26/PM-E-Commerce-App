import React, { useState, useEffect } from "react";
import "./Payment.css";
import BranchBadge from "../../../shared/BranchBadge";
// import "./PaymentSuccess.css"; 
import Agreement from "./Agreement";
import { apiRequest } from "../../../../lib/config";
import PaymentSuccess from "./PaymentSuccess";
import {
  exportSupplierPaymentPdf,
  exportSupplierPaymentWord,
} from "../../../../lib/supplierPaymentTemplate";

const Payment = ({ togglePayment }) => {
  const closeModal = () => {
    togglePayment();
  };

  // State for modals
  const [modalPaymentSuccess, setModalPaymentSuccess] = useState(false);
  const [modalAgreementGeneration, setModalAgreementGeneration] = useState(false);
  const [agreementData, setAgreementData] = useState(null);

  // State for invoice numbers dropdown
  const [invoiceNumbers, setInvoiceNumbers] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState("");

  // State for form data
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    invoiceAmount: "",
    supplierId: "",
    periodOfPayment: "B2B",
    rulesForPayment: "",
    advancePaymentPlansDetails: "ADVANCE PAYMENT PLANS DETAILS",
    percentageMade: "",
    tenureOfDeliveryGoods: "",
    processIncaseOfNonDelivery: "",
    timelineOfDeliveryGoods: "",
    acceptedPaymentMethods: "PAYMENT METHOD",
    discountOnOrder: "",
    paymentDate: "",
  });

  // State for error, loading, and suppliers
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [suppliers, setSuppliers] = useState([]);

  // Fetch invoice numbers from goods supplied
  const fetchInvoiceNumbers = async () => {
    try {
      setLoadingInvoices(true);
      const response = await apiRequest("/admin/goods-supplied", "GET");

      let goodsList = [];
      if (Array.isArray(response)) {
        goodsList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        goodsList = response.data;
      } else if (response?.response && Array.isArray(response.response)) {
        goodsList = response.response;
      } else if (response?.response?.data && Array.isArray(response.response.data)) {
        goodsList = response.response.data;
      }

      const invoices = goodsList
        .map((item) => ({
          invoiceNumber: item.invoiceNumber,
          supplierId: item.supplierId,
          supplierName: item.supplier?.customerName || item.supplier?.companyName || `Supplier ${item.supplierId}`,
          date: item.dateSupplied,
          amount: item.totalAmount,
        }))
        .filter((item) => item.invoiceNumber);

      setInvoiceNumbers(invoices);
    } catch (err) {
      console.error("Error fetching invoice numbers", err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  // Handle invoice selection
  const handleInvoiceChange = (e) => {
    const selectedInvoiceNumber = e.target.value;
    setSelectedInvoice(selectedInvoiceNumber);

    const selected = invoiceNumbers.find(
      (inv) => inv.invoiceNumber === selectedInvoiceNumber,
    );

    if (selected) {
      setFormData((prev) => ({
        ...prev,
        invoiceNumber: selectedInvoiceNumber,
        supplierId: selected.supplierId?.toString() || "",
        invoiceAmount: selected.amount?.toString() || "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        invoiceNumber: selectedInvoiceNumber,
        supplierId: "",
        invoiceAmount: "",
      }));
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle date input with format DD/MM/YYYY
  const handleDateChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    
    if (value.length >= 2) {
      value = value.slice(0, 2) + "/" + value.slice(2);
    }
    if (value.length >= 5) {
      value = value.slice(0, 5) + "/" + value.slice(5, 9);
    }
    
    setFormData({
      ...formData,
      paymentDate: value.slice(0, 10),
    });
  };

  // Native date input returns YYYY-MM-DD already
  const convertDateForAPI = (dateStr) => {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    return dateStr;
  };

  // Handle form submission (SAVE)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.supplierId) {
      setError("Please select an invoice number first");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      setLoading(true);

      const requestBody = {
        invoiceNumber: formData.invoiceNumber || `INV-${Date.now()}`,
        invoiceAmount: parseFloat(formData.invoiceAmount) || 0,
        supplierId: parseInt(formData.supplierId),
        periodOfPayment: formData.periodOfPayment || "B2B",
        rulesForPayment: formData.rulesForPayment || "",
        advancePaymentDetails: formData.advancePaymentPlansDetails || "",
        percentageMade: formData.percentageMade ? parseFloat(formData.percentageMade) : 0,
        tenureOfDelivery: formData.tenureOfDeliveryGoods || "",
        processIncaseOfNondelivery: formData.processIncaseOfNonDelivery || "",
        timelineOfDelivery: formData.timelineOfDeliveryGoods || "",
        acceptedPaymentMethods: formData.acceptedPaymentMethods || "",
        discountOnOrder: formData.discountOnOrder ? parseFloat(formData.discountOnOrder) : 0,
        paymentDate: convertDateForAPI(formData.paymentDate),
      };

      const response = await apiRequest("/admin/payment-terms", "POST", requestBody);

      setAgreementData(response?.data || response);
      setModalPaymentSuccess(true);
      
      setTimeout(() => {
        setModalPaymentSuccess(false);
      }, 2000);
    } catch (err) {
      console.error("Error saving payment terms", err);
      if (err.response?.data) {
        setError(JSON.stringify(err.response.data) || "Validation failed");
      } else {
        setError(err?.message || "Failed to save payment terms. Please try again.");
      }
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Handle Generate Agreement
  const handleGenerateAgreement = () => {
    if (!selectedInvoice) {
      setError("Please select an invoice and fill the form first");
      setTimeout(() => setError(""), 3000);
      return;
    }
    setModalAgreementGeneration(true);
  };

  // Resolve the selected supplier record so the exported template carries full details.
  const getSelectedSupplier = () =>
    suppliers.find(
      (supplier) => String(supplier.id) === String(formData.supplierId)
    ) || {};

  const handleExport = (type) => {
    if (!formData.supplierId) {
      setError("Select an invoice / supplier before exporting the payment document.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    try {
      if (type === "pdf") {
        exportSupplierPaymentPdf(formData, getSelectedSupplier());
      } else {
        exportSupplierPaymentWord(formData, getSelectedSupplier());
      }
    } catch (err) {
      setError(err?.message || "Unable to export the payment document.");
      setTimeout(() => setError(""), 4000);
    }
  };

  // Fetch suppliers on component mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoadingSuppliers(true);
        const response = await apiRequest("/users/suppliers", "GET");
        
        let suppliersList = [];
        if (Array.isArray(response)) {
          suppliersList = response;
        } else if (response?.data && Array.isArray(response.data)) {
          suppliersList = response.data;
        } else if (response?.response?.data && Array.isArray(response.response.data)) {
          suppliersList = response.response.data;
        } else if (response?.response && Array.isArray(response.response)) {
          suppliersList = response.response;
        }

        setSuppliers(suppliersList);
      } catch (err) {
        console.error("Error fetching suppliers:", err);
        setSuppliers([]);
      } finally {
        setLoadingSuppliers(false);
      }
    };

    fetchSuppliers();
    fetchInvoiceNumbers();
  }, []);

  return (
    <>
      {!modalAgreementGeneration && !modalPaymentSuccess && (
        <div className="payment-wrapper">
          <div className="payment-modal-content">
            {/* Close and Grid Buttons */}
            <button className="payment-close-btn" onClick={closeModal}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <button className="payment-grid-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="8" height="8" />
                <rect x="13" y="3" width="8" height="8" />
                <rect x="3" y="13" width="8" height="8" />
                <rect x="13" y="13" width="8" height="8" />
              </svg>
            </button>

            <div className="payment-hero">
              <p className="payment-eyebrow">Inventory Supplier Workflow</p>
              <h1 className="payment-title">Payment Terms</h1>
              <div style={{ marginTop: "0.4rem" }}>
                <BranchBadge />
              </div>
              <p className="payment-subtitle">Define invoice-linked payment conditions, delivery expectations, discounts, and agreement details in one standard workspace.</p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="payment-alert-error">
                {error}
              </div>
            )}

            {/* Form Grid */}
            <div className="payment-form-grid">
              {/* Row 1: Invoice Number, Supplier ID, Period of Payment */}
              <div className="payment-field">
                <label>INVOICE NUMBER</label>
                <select
                  value={selectedInvoice}
                  onChange={handleInvoiceChange}
                  disabled={loadingInvoices}
                >
                  <option value="">{loadingInvoices ? "Loading..." : ""}</option>
                  {invoiceNumbers.map((invoice, idx) => (
                    <option key={idx} value={invoice.invoiceNumber}>
                      {invoice.invoiceNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className="payment-field">
                <label>SUPPLIER ID</label>
                <select
                  name="supplierId"
                  value={formData.supplierId}
                  onChange={handleChange}
                  disabled={loadingSuppliers}
                >
                  <option value="">{loadingSuppliers ? "Loading..." : ""}</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.supplierId || supplier.id} — {supplier.customerName || supplier.companyName || supplier.name || ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="payment-field">
                <label>PERIOD OF PAYMENT</label>
                <select
                  name="periodOfPayment"
                  value={formData.periodOfPayment}
                  onChange={handleChange}
                >
                  <option value="B2B">B2B</option>
                  <option value="-7">-7</option>
                  <option value="-15">-15</option>
                  <option value="-30">-30</option>
                  <option value="-60">-60</option>
                  <option value="PAY AS BUY">PAY AS BUY</option>
                </select>
              </div>

              {/* Row 2: Invoice Amount, Rules for Payment */}
              <div className="payment-field">
                <label>INVOICE AMOUNT</label>
                <input
                  type="text"
                  name="invoiceAmount"
                  value={formData.invoiceAmount}
                  onChange={handleChange}
                />
              </div>

              <div className="payment-field payment-field-span-2">
                <label>RULES FOR PAYMENT</label>
                <select
                  name="rulesForPayment"
                  value={formData.rulesForPayment}
                  onChange={handleChange}
                >
                  <option value="">RULES FOR PAYMENT</option>
                  <option value="accumulation discount">accumulation discount</option>
                  <option value="CBS">CBS</option>
                  <option value="CIA">CIA</option>
                  <option value="CND">CND</option>
                </select>
              </div>

              {/* Row 3: Advance Payment Plans Details, Percentage Made, Tenure */}
              <div className="payment-field">
                <label>ADVANCE PAYMENT PLANS DETAILS</label>
                <select
                  name="advancePaymentPlansDetails"
                  value={formData.advancePaymentPlansDetails}
                  onChange={handleChange}
                >
                  <option value="ADVANCE PAYMENT PLANS DETAILS">ADVANCE PAYMENT PLANS DETAILS</option>
                  <option value="TIMELINE OF DELIVERY">TIMELINE OF DELIVERY</option>
                  <option value="PAYMENT MILESTONES">PAYMENT MILESTONES</option>
                </select>
              </div>

              <div className="payment-field">
                <label>PERCENTAGE MADE (%)</label>
                <input
                  type="number"
                  name="percentageMade"
                  value={formData.percentageMade}
                  onChange={handleChange}
                />
              </div>

              <div className="payment-field">
                <label>TENURE OF DELIVERY GOODS</label>
                <input
                  type="text"
                  name="tenureOfDeliveryGoods"
                  value={formData.tenureOfDeliveryGoods}
                  onChange={handleChange}
                />
              </div>

              {/* Row 4: Process Incase, Timeline, Payment Methods */}
              <div className="payment-field">
                <label>PROCESS INCASE OF NON-DELIVERY</label>
                <input
                  type="text"
                  name="processIncaseOfNonDelivery"
                  value={formData.processIncaseOfNonDelivery}
                  onChange={handleChange}
                />
              </div>

              <div className="payment-field">
                <label>TIMELINE OF DELIVERY GOODS</label>
                <input
                  type="text"
                  name="timelineOfDeliveryGoods"
                  value={formData.timelineOfDeliveryGoods}
                  onChange={handleChange}
                />
              </div>

              <div className="payment-field">
                <label>ACCEPTED PAYMENT METHODS</label>
                <select
                  name="acceptedPaymentMethods"
                  value={formData.acceptedPaymentMethods}
                  onChange={handleChange}
                >
                  <option value="PAYMENT METHOD">PAYMENT METHOD</option>
                  <option value="CASH">CASH</option>
                  <option value="BANK TRANSFER">BANK TRANSFER</option>
                  <option value="CHEQUE">CHEQUE</option>
                </select>
              </div>

              {/* Row 5: Discount, Payment Date */}
              <div className="payment-field">
                <label>DISCOUNT ON ORDER</label>
                <input
                  type="text"
                  name="discountOnOrder"
                  value={formData.discountOnOrder}
                  onChange={handleChange}
                />
              </div>

              <div className="payment-field">
                <label>PAYMENT DATE</label>
                <input
                  type="date"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="payment-actions">
              <button
                className="payment-save-btn"
                onClick={handleSubmit}
                disabled={loading || !selectedInvoice}
              >
                {loading ? "SAVING..." : "SAVE"}
              </button>
              <button
                className="payment-generate-btn"
                onClick={handleGenerateAgreement}
                disabled={!selectedInvoice}
              >
                GENERATE AGREEMENT
              </button>
              <button
                type="button"
                className="payment-generate-btn"
                onClick={() => handleExport("pdf")}
                disabled={!formData.supplierId}
              >
                EXPORT PDF
              </button>
              <button
                type="button"
                className="payment-generate-btn"
                onClick={() => handleExport("word")}
                disabled={!formData.supplierId}
              >
                EXPORT WORD
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {modalPaymentSuccess && (
        <PaymentSuccess
          isOpen={modalPaymentSuccess}
          togglePaymentSuccess={() => setModalPaymentSuccess(false)}
        />
      )}

      {/* Agreement Modal */}
      {modalAgreementGeneration && (
        <Agreement
          isOpen={modalAgreementGeneration}
          toggleAgreementGeneration={() => setModalAgreementGeneration(false)}
          agreementData={{
            ...formData,
            invoiceAmount: formData.invoiceAmount,
          }}
        />
      )}
    </>
  );
};

export default Payment;
