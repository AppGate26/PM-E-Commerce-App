import React, { useState, useEffect } from "react";
import "./Proforma.css";
import BranchBadge from "../../../shared/BranchBadge";
import "./ProformaQuery.css";
import { apiRequest } from "../../../../lib/config";
import PMlogo from "../../../../assets/images/PMlogo.png";

const Proforma = () => {
  const [modalProInvoice, setModalProInvoice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [invoiceData, setInvoiceData] = useState(null);
  const [invoiceNumbers, setInvoiceNumbers] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState("");

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Unwrap the various response envelopes used across the API.
  const unwrapList = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.response)) return response.response;
    if (Array.isArray(response?.response?.data)) return response.response.data;
    if (Array.isArray(response?.response?.content)) return response.response.content;
    return [];
  };

  const unwrapObject = (response) =>
    response?.data ?? response?.response?.data ?? response?.response ?? response ?? null;

  const fetchInvoices = async () => {
    try {
      setLoadingInvoices(true);
      setError("");
      const response = await apiRequest("/admin/invoices", "GET");
      const list = unwrapList(response);
      const numbers = list
        .map((r) => r.invoiceNumber)
        .filter(Boolean)
        .filter((v, i, a) => a.indexOf(v) === i);
      setInvoiceNumbers(numbers);
    } catch (err) {
      setError("Failed to load invoices.");
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!selectedInvoice) {
      setError("Please select an invoice number");
      return;
    }
    try {
      setLoading(true);
      // Generate the proforma view from the real invoice (full line items + totals).
      const response = await apiRequest(
        `/admin/invoices/proforma/${encodeURIComponent(selectedInvoice)}`,
        "GET"
      );
      const proforma = unwrapObject(response);
      if (!proforma || (!proforma.items && !proforma.proformaNumber)) {
        setError("Could not generate proforma for the selected invoice.");
        return;
      }
      setInvoiceData(proforma);
      setModalProInvoice(true);
    } catch (err) {
      setError("Failed to generate proforma.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {!modalProInvoice && (
        <div className="proforma-container">
          <div className="proforma-hero">
            <p className="proforma-eyebrow">Inventory Supplier Workflow</p>
            <h1 className="proforma-title">Generate Proforma</h1>
            <div style={{ marginTop: "0.4rem" }}>
              <BranchBadge />
            </div>
            <p className="proforma-subtitle">Select an existing invoice and generate a cleaner proforma document from one standard approval-ready screen.</p>
          </div>
          <label>Select invoice number</label>
          {error && (
            <div className="mb-3 alert alert-danger" role="alert">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div style={{ position: "relative", width: "100%" }}>
              <select
                name="invoiceNumber"
                className="invoice_input"
                value={selectedInvoice}
                onChange={(e) => setSelectedInvoice(e.target.value)}
                disabled={loading || loadingInvoices}
                style={{
                  width: "100%",
                  padding: "12px 15px",
                  border: "1px solid #ced4da",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  backgroundColor: "white",
                  cursor: loadingInvoices ? "not-allowed" : "pointer",
                  color: selectedInvoice ? "#333" : "#999",
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 15px center",
                  paddingRight: "40px",
                }}
              >
                <option value="">
                  {loadingInvoices ? "Loading invoices..." : "-- Select Invoice Number --"}
                </option>
                {invoiceNumbers.length === 0 && !loadingInvoices ? (
                  <option value="" disabled>No invoices found</option>
                ) : (
                  invoiceNumbers.map((invoiceNumber, index) => (
                    <option key={index} value={invoiceNumber}>
                      {invoiceNumber}
                    </option>
                  ))
                )}
              </select>
              {selectedInvoice && (
                <small style={{ 
                  display: "block", 
                  marginTop: "5px", 
                  fontSize: "0.8rem", 
                  color: "#28a745",
                }}>
                  ✓ Selected: {selectedInvoice}
                </small>
              )}
            </div>
            <input 
              type="submit" 
              value={loading ? "LOADING..." : "GENERATE PROFORMA"} 
              className="invoice-enter"
              disabled={loading || !selectedInvoice}
              style={{
                backgroundColor: !selectedInvoice ? "#ccc" : "",
                cursor: !selectedInvoice ? "not-allowed" : "pointer",
              }}
            />
          </form>
        </div>
      )}
      
      <ProformaModal
        isOpen={modalProInvoice}
        onClose={() => {
          setModalProInvoice(false);
          setInvoiceData(null);
        }}
        invoiceData={invoiceData}
      />
    </div>
  );
};

// Proforma Modal Component
const ProformaModal = ({ isOpen, onClose, invoiceData }) => {
  if (!isOpen) return null;

  console.log("📄 ProformaModal: Rendering with data:", invoiceData);

  // Format currency
  const formatCurrency = (value) => {
    if (!value) return "0.00";
    return Number(value).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString();
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "16px",
          maxWidth: "900px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Logo */}
        <div style={{
          padding: "20px 30px",
          borderBottom: "2px solid #e0e0e0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#f8f9fa",
          borderRadius: "16px 16px 0 0",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <img src={PMlogo} alt="Logo" style={{ width: "50px", height: "auto" }} />
            <div>
              <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "700", color: "#0867db" }}>
                PROFORMA INVOICE
              </h2>
              <p style={{ margin: "5px 0 0", fontSize: "0.8rem", color: "#666" }}>
                PM MARKET HUB LTD
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#666",
              padding: "5px 10px",
              borderRadius: "50%",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = "#f0f0f0"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
          >
            ✕
          </button>
        </div>

        {/* Company Info */}
        <div style={{
          padding: "20px 30px",
          backgroundColor: "#f5f5f5",
          borderBottom: "1px solid #e0e0e0",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
            <div>
              <p style={{ margin: "5px 0", fontSize: "0.9rem", color: "#666" }}>Company Name:</p>
              <p style={{ margin: "0 0 10px", fontWeight: "500" }}>{invoiceData?.companyName || "PM MARKET HUB LTD"}</p>
              <p style={{ margin: "5px 0", fontSize: "0.9rem", color: "#666" }}>Address:</p>
              <p style={{ margin: "0 0 10px", fontWeight: "500" }}>{invoiceData?.companyAddress || invoiceData?.address || "Your Business Address"}</p>
            </div>
            <div>
              <p style={{ margin: "5px 0", fontSize: "0.9rem", color: "#666" }}>Phone:</p>
              <p style={{ margin: "0 0 10px", fontWeight: "500" }}>{invoiceData?.companyPhone || invoiceData?.phone || "Your Phone Number"}</p>
              <p style={{ margin: "5px 0", fontSize: "0.9rem", color: "#666" }}>Email:</p>
              <p style={{ margin: "0", fontWeight: "500" }}>{invoiceData?.companyEmail || invoiceData?.email || "Your Email Address"}</p>
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div style={{
          padding: "20px 30px",
          borderBottom: "1px solid #e0e0e0",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
            <div>
              <p style={{ margin: "5px 0", fontSize: "0.85rem", color: "#666" }}>Proforma No:</p>
              <p style={{ margin: "0 0 15px", fontWeight: "600", color: "#0867db" }}>
                {invoiceData?.proformaNumber || invoiceData?.invoiceNumber || "PF-001"}
              </p>
              <p style={{ margin: "5px 0", fontSize: "0.85rem", color: "#666" }}>Date:</p>
              <p style={{ margin: "0", fontWeight: "500" }}>{formatDate(invoiceData?.date || invoiceData?.createdAt)}</p>
            </div>
            <div>
              <p style={{ margin: "5px 0", fontSize: "0.85rem", color: "#666" }}>Customer Name:</p>
              <p style={{ margin: "0 0 15px", fontWeight: "500" }}>{invoiceData?.customerName || "—"}</p>
              <p style={{ margin: "5px 0", fontSize: "0.85rem", color: "#666" }}>Phone:</p>
              <p style={{ margin: "0 0 15px", fontWeight: "500" }}>{invoiceData?.customerPhone || "—"}</p>
              <p style={{ margin: "5px 0", fontSize: "0.85rem", color: "#666" }}>Customer Address:</p>
              <p style={{ margin: "0", fontWeight: "500" }}>{invoiceData?.customerAddress || "—"}</p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div style={{
          padding: "20px 30px",
          overflowX: "auto",
        }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.9rem",
          }}>
            <thead>
              <tr style={{
                backgroundColor: "#f5f5f5",
                borderBottom: "2px solid #ddd",
              }}>
                <th style={{ padding: "12px", textAlign: "left" }}>S/N</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Description</th>
                <th style={{ padding: "12px", textAlign: "center" }}>Quantity</th>
                <th style={{ padding: "12px", textAlign: "right" }}>Unit Price (₦)</th>
                <th style={{ padding: "12px", textAlign: "right" }}>Total (₦)</th>
                </tr>
            </thead>
            <tbody>
              {invoiceData?.items && invoiceData.items.length > 0 ? (
                invoiceData.items.map((item, index) => (
                  <tr key={index} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "10px 12px" }}>{index + 1}</td>
                    <td style={{ padding: "10px 12px" }}>{item.description || item.productName || "—"}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>{item.quantity || 1}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>₦{formatCurrency(item.unitPrice)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>₦{formatCurrency(item.total ?? item.totalPrice)}</td>
                  </tr>
                ))
              ) : (
                <>
                  <tr><td colSpan="5" style={{ padding: "40px", textAlign: "center", color: "#999" }}>No items found</td></tr>
                  <tr><td colSpan="5" style={{ padding: "8px" }}></td></tr>
                  <tr><td colSpan="5" style={{ padding: "8px" }}></td></tr>
                  <tr><td colSpan="5" style={{ padding: "8px" }}></td></tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div style={{
          padding: "20px 30px",
          borderTop: "2px solid #e0e0e0",
          backgroundColor: "#fafafa",
        }}>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "40px" }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: "5px 0", fontSize: "0.9rem", color: "#666" }}>Subtotal:</p>
              <p style={{ margin: "5px 0", fontSize: "0.9rem", color: "#666" }}>Discount:</p>
              <p style={{ margin: "10px 0 0", fontSize: "1.1rem", fontWeight: "bold", color: "#0867db" }}>Total Amount:</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: "5px 0", fontWeight: "500" }}>₦{formatCurrency(invoiceData?.subtotal || invoiceData?.totalAmount)}</p>
              <p style={{ margin: "5px 0", fontWeight: "500" }}>₦{formatCurrency(invoiceData?.discount || 0)}</p>
              <p style={{ margin: "10px 0 0", fontSize: "1.1rem", fontWeight: "bold", color: "#0867db" }}>
                ₦{formatCurrency(invoiceData?.totalAmount || invoiceData?.grandTotal)}
              </p>
            </div>
          </div>
        </div>

        {/* Bank Details & Terms */}
        <div style={{
          padding: "20px 30px",
          borderTop: "1px solid #e0e0e0",
        }}>
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ margin: "0 0 10px", fontSize: "1rem", color: "#0867db" }}>Bank Details:</h4>
            <p style={{ margin: "5px 0", fontSize: "0.9rem" }}>Bank Name: {invoiceData?.bankName || "—"}</p>
            <p style={{ margin: "5px 0", fontSize: "0.9rem" }}>Account Name: PM MARKET HUB LTD</p>
            <p style={{ margin: "5px 0", fontSize: "0.9rem" }}>Account Number: {invoiceData?.accountNumber || "—"}</p>
          </div>

          <div>
            <h4 style={{ margin: "0 0 10px", fontSize: "1rem", color: "#0867db" }}>Terms & Conditions:</h4>
            <ul style={{ margin: "0", paddingLeft: "20px", fontSize: "0.85rem", color: "#666" }}>
              <li>This is a Proforma Invoice and not a final tax invoice.</li>
              <li>Payment must be completed before goods are delivered.</li>
              <li>Prices may change after confirmation.</li>
            </ul>
          </div>

          <div style={{
            marginTop: "30px",
            paddingTop: "20px",
            borderTop: "1px solid #e0e0e0",
            display: "flex",
            justifyContent: "flex-end",
          }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: "0 0 30px", fontSize: "0.9rem" }}>_________________________</p>
              <p style={{ margin: "0", fontSize: "0.85rem", color: "#666" }}>Authorized Signature</p>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div style={{
          padding: "20px 30px",
          borderTop: "1px solid #e0e0e0",
          display: "flex",
          justifyContent: "flex-end",
          gap: "15px",
          backgroundColor: "#f8f9fa",
          borderRadius: "0 0 16px 16px",
        }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: "#0867db",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "12px 40px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: "pointer",
              letterSpacing: "0.5px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = "#0756b8"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "#0867db"}
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export default Proforma;
