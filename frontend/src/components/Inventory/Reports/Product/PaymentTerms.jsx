import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { apiRequest } from "../../../../lib/config";
import PMlogo from "../../../../assets/images/PMlogo.png";

const PaymentTermsDisplay = ({ toggleDisplay }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [agreementData, setAgreementData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSuppliers();
  }, []);

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
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const handleDisplay = async () => {
    try {
      setLoading(true);
      setError("");

      // Build query params
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (supplierId) params.append("supplierId", supplierId);

      const endpoint = `/admin/inventory/reports/payment-terms${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await apiRequest(endpoint, "GET");

      let agreementInfo = null;
      if (Array.isArray(response) && response.length > 0) {
        agreementInfo = response[0];
      } else if (response?.data) {
        agreementInfo = Array.isArray(response.data) ? response.data[0] : response.data;
      } else if (response?.response) {
        agreementInfo = Array.isArray(response.response) ? response.response[0] : response.response;
      } else {
        agreementInfo = response;
      }

      setAgreementData(agreementInfo);
      setShowAgreement(true);
    } catch (err) {
      console.error("Error fetching payment terms:", err);
      setError("Failed to load payment terms. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (toggleDisplay) {
      toggleDisplay();
    } else {
      // Fallback when route mounts this component directly with no prop
      window.history.back();
    }
  };

  if (showAgreement) {
    return (
      <GeneratedAgreement
        data={agreementData}
        onClose={() => setShowAgreement(false)}
        onExit={handleClose}
      />
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "#f5f5f5",
        zIndex: 9999,
        overflowY: "auto",
      }}
    >
      <div style={{ backgroundColor: "white", minHeight: "100vh", padding: "30px 50px" }}>
        {/* Header Section */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <img src={PMlogo} alt="Logo" style={{ width: "70px", height: "auto" }} />
            <div>
              <h3 style={{ color: "#0d6efd", fontSize: "1.5rem", fontWeight: "700", margin: 0, letterSpacing: "1px" }}>
                PM MARKET HUB
              </h3>
              <p style={{ color: "#999", fontSize: "0.9rem", margin: "5px 0 0 0" }}>64 OGUI ROAD,ENUGU-STATE</p>
              <p style={{ color: "#999", fontSize: "0.9rem", margin: "2px 0 0 0" }}>TEL: 080XXXXX</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <button
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "5px",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                fill="#0d6efd"
                viewBox="0 0 16 16"
              >
                <rect x="1" y="1" width="6" height="6" fill="#0d6efd"/>
                <rect x="9" y="1" width="6" height="6" fill="#0d6efd"/>
                <rect x="1" y="9" width="6" height="6" fill="#0d6efd"/>
                <rect x="9" y="9" width="6" height="6" fill="#0d6efd"/>
              </svg>
            </button>
            <button
              onClick={handleClose}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "5px",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                fill="#0d6efd"
                viewBox="0 0 16 16"
              >
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Title */}
        <h2
          style={{
            color: "#0d6efd",
            fontSize: "2rem",
            fontWeight: "700",
            textAlign: "center",
            margin: "30px 0 40px 0",
            letterSpacing: "2px",
          }}
        >
          PAYMENT TERMS  DISPLAY
        </h2>

        {/* Error Message */}
        {error && (
          <div style={{ backgroundColor: "#f8d7da", color: "#842029", padding: "15px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #f5c2c7" }}>
            {error}
          </div>
        )}

        {/* Filter Box */}
        <div
          style={{
            border: "2px solid #0d6efd",
            borderRadius: "12px",
            padding: "50px 60px",
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >
          {/* Date Filters */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginBottom: "35px" }}>
            <div>
              <label style={{ display: "block", color: "#666", fontSize: "0.85rem", marginBottom: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                START DATE
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: "#999", zIndex: 1 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
                  </svg>
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 15px 12px 45px",
                    border: "1.5px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    outline: "none",
                    color: "#666",
                  }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: "block", color: "#666", fontSize: "0.85rem", marginBottom: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                END DATE
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: "#999", zIndex: 1 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
                  </svg>
                </span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 15px 12px 45px",
                    border: "1.5px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    outline: "none",
                    color: "#666",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Supplier Filters */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginBottom: "45px" }}>
            <div>
              <label style={{ display: "block", color: "#666", fontSize: "0.85rem", marginBottom: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                NAME OF SUPPLIER
              </label>
              <select
                value={supplierId}
                onChange={(e) => {
                  setSupplierId(e.target.value);
                  const selected = suppliers.find(s => String(s.id) === String(e.target.value));
                  setSupplierName(selected ? (selected.customerName || selected.companyName || selected.name) : "");
                }}
                disabled={loadingSuppliers}
                style={{
                  width: "100%",
                  padding: "12px 15px",
                  border: "1.5px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  outline: "none",
                  backgroundColor: "white",
                  cursor: "pointer",
                  color: supplierId ? "#333" : "#999",
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 15px center",
                  paddingRight: "40px",
                }}
              >
                <option value="">Select Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.customerName || supplier.companyName || supplier.name || `Supplier ${supplier.id}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", color: "#666", fontSize: "0.85rem", marginBottom: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                SUPPLIER'S ID
              </label>
              <input
                type="text"
                value={supplierId}
                readOnly
                placeholder=""
                style={{
                  width: "100%",
                  padding: "12px 15px",
                  border: "1.5px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  outline: "none",
                  backgroundColor: "#f8f9fa",
                  color: "#666",
                }}
              />
            </div>
          </div>

          {/* Display Button */}
          <div style={{ textAlign: "center" }}>
            <button
              onClick={handleDisplay}
              disabled={loading}
              style={{
                backgroundColor: "#0d6efd",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "14px 60px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: "1px",
                textTransform: "uppercase",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "LOADING..." : "DISPLAY"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Generated Agreement Modal Component
const GeneratedAgreement = ({ data, onClose, onExit }) => {
  const handleExportExcel = () => {
    const rows = [
      { Field: "Invoice Number", Value: data?.invoiceNumber || "-" },
      { Field: "Supplier ID", Value: data?.supplierId || "-" },
      { Field: "Period of Payment", Value: data?.paymentPeriod || "-" },
      { Field: "Invoice Amount", Value: data?.invoiceAmount || "-" },
      { Field: "Rules for Payment", Value: data?.paymentRules || "-" },
      { Field: "Advance Payment Plans Details", Value: data?.advancePaymentDetails || "-" },
      { Field: "Percentage Made", Value: data?.percentageMade || "-" },
      { Field: "Tenure of Delivery Goods", Value: data?.deliveryTenure || "-" },
      { Field: "Process Incase of Non-Delivery", Value: data?.nonDeliveryProcess || "-" },
      { Field: "Accepted Payment Method", Value: data?.paymentMethod || "-" },
      { Field: "Payment Date", Value: data?.paymentDate || "-" },
    ];
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PaymentTerms");
    XLSX.writeFile(wb, `PaymentTermsReport_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          maxWidth: "600px",
          width: "100%",
          padding: "40px 50px",
          position: "relative",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
        }}
      >
        {/* Header with Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "30px" }}>
          <img src={PMlogo} alt="Logo" style={{ width: "60px", height: "auto" }} />
          <h2 style={{ color: "#666", fontSize: "1.5rem", fontWeight: "600", margin: 0 }}>
            GENERATED AGREEMENT
          </h2>
        </div>

        {/* Agreement Details */}
        <div style={{ marginBottom: "30px" }}>
          {/* Invoice Number */}
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "15px", marginBottom: "15px" }}>
            <span style={{ color: "#666", fontWeight: "500", fontSize: "0.95rem" }}>INVOICE NUMBER</span>
            <span style={{ color: "#666", fontWeight: "600", fontSize: "0.95rem" }}>
              {data?.invoiceNumber || "-"}
            </span>
          </div>

          {/* Supplier ID */}
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "15px", marginBottom: "15px" }}>
            <span style={{ color: "#666", fontWeight: "500", fontSize: "0.95rem" }}>SUPPLIER ID</span>
            <span style={{ color: "#666", fontWeight: "600", fontSize: "0.95rem" }}>
              {data?.supplierId || "-"}
            </span>
          </div>

          {/* Period of Payment */}
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "15px", marginBottom: "15px" }}>
            <span style={{ color: "#666", fontWeight: "500", fontSize: "0.95rem" }}>PERIOUD OF PAYMENT</span>
            <span style={{ color: "#666", fontWeight: "600", fontSize: "0.95rem" }}>
              {data?.paymentPeriod || "-7"}
            </span>
          </div>

          {/* Invoice Amount */}
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "15px", marginBottom: "15px" }}>
            <span style={{ color: "#666", fontWeight: "500", fontSize: "0.95rem" }}>INVOICE AMOUNT</span>
            <span style={{ color: "#666", fontWeight: "600", fontSize: "0.95rem" }}>
              {data?.invoiceAmount || "#400,000"}
            </span>
          </div>

          {/* Rules for Payment */}
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "15px", marginBottom: "15px" }}>
            <span style={{ color: "#666", fontWeight: "500", fontSize: "0.95rem" }}>RULES FOR PAYMENT</span>
            <span style={{ color: "#666", fontWeight: "600", fontSize: "0.95rem" }}>
              {data?.paymentRules || "CBS"}
            </span>
          </div>

          {/* Advance Payment Plans Details */}
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "15px", marginBottom: "15px" }}>
            <span style={{ color: "#666", fontWeight: "500", fontSize: "0.95rem" }}>ADVANCE PAYMENT PLANS DETAILS</span>
            <span style={{ color: "#666", fontWeight: "600", fontSize: "0.95rem" }}>
              {data?.advancePaymentDetails || "TIMELINE OF DELIVERY"}
            </span>
          </div>

          {/* Percentage Made */}
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "15px", marginBottom: "15px" }}>
            <span style={{ color: "#666", fontWeight: "500", fontSize: "0.95rem" }}>PERCENTAGE MADE</span>
            <span style={{ color: "#666", fontWeight: "600", fontSize: "0.95rem" }}>
              {data?.percentageMade || "20%"}
            </span>
          </div>

          {/* Tenure of Delivery Goods */}
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "15px", marginBottom: "15px" }}>
            <span style={{ color: "#666", fontWeight: "500", fontSize: "0.95rem" }}>TENURE OF DELIVERY GOODS</span>
            <span style={{ color: "#666", fontWeight: "600", fontSize: "0.95rem" }}>
              {data?.deliveryTenure || "2WEEKS"}
            </span>
          </div>

          {/* Process Incase of Non-Delivery */}
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "15px", marginBottom: "15px" }}>
            <span style={{ color: "#666", fontWeight: "500", fontSize: "0.95rem" }}>PROCESS INCASE OF NON-DELIVERY</span>
            <span style={{ color: "#666", fontWeight: "600", fontSize: "0.95rem" }}>
              {data?.nonDeliveryProcess || "PROCESS INCASE OF NON-DELIVERY"}
            </span>
          </div>

          {/* Accepted Payment Method */}
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "15px", marginBottom: "15px" }}>
            <span style={{ color: "#666", fontWeight: "500", fontSize: "0.95rem" }}>ACCEPED PAYMENT METHOD</span>
            <span style={{ color: "#666", fontWeight: "600", fontSize: "0.95rem" }}>
              {data?.paymentMethod || "BANK TRANSFER"}
            </span>
          </div>

          {/* Payment Date */}
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "15px", marginBottom: "15px" }}>
            <span style={{ color: "#666", fontWeight: "500", fontSize: "0.95rem" }}>PAYMENT DATE</span>
            <span style={{ color: "#666", fontWeight: "600", fontSize: "0.95rem" }}>
              {data?.paymentDate || "06/06/2024"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={onClose}
            style={{ backgroundColor: "#0d6efd", color: "white", border: "none", borderRadius: "6px", padding: "10px 30px", fontSize: "0.95rem", fontWeight: "600", cursor: "pointer" }}
          >
            ← BACK TO FILTERS
          </button>
          <button
            onClick={handleExportExcel}
            style={{ backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "6px", padding: "10px 20px", fontSize: "0.95rem", fontWeight: "600", cursor: "pointer" }}
          >
            Export Excel
          </button>
          <button
            onClick={() => window.print()}
            style={{ backgroundColor: "#6c757d", color: "white", border: "none", borderRadius: "6px", padding: "10px 20px", fontSize: "0.95rem", fontWeight: "600", cursor: "pointer" }}
          >
            Print / PDF
          </button>
          {onExit && (
            <button
              onClick={onExit}
              style={{ backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "6px", padding: "10px 20px", fontSize: "0.95rem", fontWeight: "600", cursor: "pointer" }}
            >
              CLOSE
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentTermsDisplay;
