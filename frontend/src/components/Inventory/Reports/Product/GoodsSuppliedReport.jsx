import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import BranchBadge from "../../../shared/BranchBadge";
import { apiRequest } from "../../../../lib/config";
import { useBranchOptions } from "../../../../lib/useBranchOptions";
import PMlogo from "../../../../assets/images/PMlogo.png";

const GoodsSuppliedDisplay = ({ toggleDisplay }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [branchId, setBranchId] = useState("");
  const { options: branchOptions, loading: branchesLoading } = useBranchOptions();
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalValue, setTotalValue] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);

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
      } else if (
        response?.response?.data &&
        Array.isArray(response.response.data)
      ) {
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

      const endpoint = `/admin/inventory/reports/goods-supplied${params.toString() ? `?${params.toString()}` : ""}`;
      console.log("Fetching from:", endpoint);

      const response = await apiRequest(
        endpoint,
        "GET",
        null,
        true,
        branchId || undefined
      );
      console.log("Raw API response:", response);

      let dataList = [];
      let totalVal = 0;
      let totalRec = 0;

      // Handle the actual response structure from your API
      if (
        response?.response?.goodsSupplied &&
        Array.isArray(response.response.goodsSupplied)
      ) {
        dataList = response.response.goodsSupplied;
        totalVal = response.response.totalValue || 0;
        totalRec = response.response.totalRecords || dataList.length;
        console.log("Found goodsSupplied array:", dataList.length, "items");
      }
      // Fallbacks for other possible structures
      else if (Array.isArray(response)) {
        dataList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        dataList = response.data;
      } else if (response?.response && Array.isArray(response.response)) {
        dataList = response.response;
      }

      console.log("Final dataList:", dataList);
      setReportData(dataList);
      setTotalValue(totalVal);
      setTotalRecords(totalRec);
      setShowReport(true);
    } catch (err) {
      console.error("Error fetching report:", err);
      setError("Failed to load report. Please try again.");
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

  const handleBackToFilters = () => {
    setShowReport(false);
  };

  if (showReport) {
    return (
      <GoodsSuppliedReport
        data={reportData}
        onClose={handleBackToFilters}
        onExit={handleClose}
        supplierName={supplierName}
        totalValue={totalValue}
        totalRecords={totalRecords}
        startDate={startDate}
        endDate={endDate}
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
      <div
        style={{
          backgroundColor: "white",
          minHeight: "100vh",
          padding: "30px 50px",
        }}
      >
        {/* Header Section */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "40px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <img
              src={PMlogo}
              alt="Logo"
              style={{ width: "70px", height: "auto" }}
            />
            <div>
              <h3
                style={{
                  color: "#0d6efd",
                  fontSize: "1.5rem",
                  fontWeight: "700",
                  margin: 0,
                  letterSpacing: "1px",
                }}
              >
                PM MARKET HUB
              </h3>
              <p
                style={{
                  color: "#999",
                  fontSize: "0.9rem",
                  margin: "5px 0 0 0",
                }}
              >
                64 OCUI ROAD ENUGU-STATE
              </p>
              <p
                style={{
                  color: "#999",
                  fontSize: "0.9rem",
                  margin: "2px 0 0 0",
                }}
              >
                TEL: 080XXXXX
              </p>
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
                <rect x="1" y="1" width="6" height="6" fill="#0d6efd" />
                <rect x="9" y="1" width="6" height="6" fill="#0d6efd" />
                <rect x="1" y="9" width="6" height="6" fill="#0d6efd" />
                <rect x="9" y="9" width="6" height="6" fill="#0d6efd" />
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
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.5rem" }}>
          <BranchBadge />
        </div>
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
          GOODS SUPPLIED DISPLAY SECTION
        </h2>

        {/* Error Message */}
        {error && (
          <div
            style={{
              backgroundColor: "#f8d7da",
              color: "#842029",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
              border: "1px solid #f5c2c7",
            }}
          >
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "40px",
              marginBottom: "35px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  color: "#666",
                  fontSize: "0.85rem",
                  marginBottom: "10px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                START DATE
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 15px",
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
              <label
                style={{
                  display: "block",
                  color: "#666",
                  fontSize: "0.85rem",
                  marginBottom: "10px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                END DATE
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 15px",
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "40px",
              marginBottom: "45px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  color: "#666",
                  fontSize: "0.85rem",
                  marginBottom: "10px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                NAME OF SUPPLIER
              </label>
              <select
                value={supplierId}
                onChange={(e) => {
                  setSupplierId(e.target.value);
                  const selected = suppliers.find(
                    (s) => String(s.id) === String(e.target.value),
                  );
                  setSupplierName(
                    selected
                      ? selected.customerName ||
                          selected.companyName ||
                          selected.name
                      : "",
                  );
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
                    {supplier.customerName ||
                      supplier.companyName ||
                      supplier.name ||
                      `Supplier ${supplier.id}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  color: "#666",
                  fontSize: "0.85rem",
                  marginBottom: "10px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
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

          {/* Branch Filter */}
          <div style={{ marginBottom: "45px" }}>
            <label
              style={{
                display: "block",
                color: "#666",
                fontSize: "0.85rem",
                marginBottom: "10px",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              BRANCH
            </label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              disabled={branchesLoading}
              style={{
                width: "100%",
                padding: "12px 15px",
                border: "1.5px solid #ddd",
                borderRadius: "8px",
                fontSize: "1rem",
                outline: "none",
                backgroundColor: "white",
                cursor: "pointer",
                color: branchId ? "#333" : "#666",
                appearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 15px center",
                paddingRight: "40px",
              }}
            >
              <option value="">All Branches</option>
              {branchOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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

// Report Component
const GoodsSuppliedReport = ({
  data,
  onClose,
  onExit,
  supplierName,
  totalValue,
  totalRecords,
  startDate,
  endDate,
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleExportExcel = () => {
    const rows = data.map((item, index) => ({
      "S/N": index + 1,
      Date: item.dateSupplied ? formatDate(item.dateSupplied) : "-",
      Product: item.suppliedProduct || "-",
      "Invoice No": item.invoiceNumber || "-",
      "Vehicle No": item.vehicleNumber || "-",
      Warehouse: item.warehouseName || "-",
      "Amount (₦)": item.totalAmount || 0,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "GoodsSupplied");
    XLSX.writeFile(wb, `GoodsSuppliedReport_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "white",
        zIndex: 10000,
        overflowY: "auto",
        padding: "30px 50px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "30px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <img
            src={PMlogo}
            alt="Logo"
            style={{ width: "70px", height: "auto" }}
          />
          <div>
            <h3
              style={{
                color: "#0d6efd",
                fontSize: "1.5rem",
                fontWeight: "700",
                margin: 0,
              }}
            >
              PM MARKET HUB
            </h3>
            <p
              style={{ color: "#999", fontSize: "0.9rem", margin: "5px 0 0 0" }}
            >
              64 OCUI ROAD ENUGU-STATE
            </p>
          </div>
        </div>
        <h2
          style={{
            color: "#0d6efd",
            fontSize: "2rem",
            fontWeight: "700",
            margin: 0,
            letterSpacing: "2px",
          }}
        >
          GOODS SUPPLIED REPORT
        </h2>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid #0d6efd",
              borderRadius: "5px",
              padding: "8px 15px",
              color: "#0d6efd",
              fontSize: "0.9rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            ← BACK TO FILTERS
          </button>
          <button
            onClick={handleExportExcel}
            style={{
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "5px",
              padding: "8px 15px",
              fontSize: "0.9rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Export Excel
          </button>
          <button
            onClick={() => window.print()}
            style={{
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "5px",
              padding: "8px 15px",
              fontSize: "0.9rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Print / PDF
          </button>
          <button
            onClick={onExit}
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

      {/* Filter Summary */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#eef6ff",
          padding: "15px 20px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", gap: "30px", flexWrap: "wrap" }}>
          <div>
            <span
              style={{ color: "#666", fontSize: "0.9rem", fontWeight: "600" }}
            >
              DATE RANGE:{" "}
            </span>
            <span style={{ color: "#333", fontWeight: "500" }}>
              {startDate ? formatDate(startDate) : "All"} -{" "}
              {endDate ? formatDate(endDate) : "All"}
            </span>
          </div>
          <div>
            <span
              style={{ color: "#666", fontSize: "0.9rem", fontWeight: "600" }}
            >
              SUPPLIER:{" "}
            </span>
            <span style={{ color: "#333", fontWeight: "500" }}>
              {supplierName || "All Suppliers"}
            </span>
          </div>
          <div>
            <span
              style={{ color: "#666", fontSize: "0.9rem", fontWeight: "600" }}
            >
              TOTAL RECORDS:{" "}
            </span>
            <span style={{ color: "#0d6efd", fontWeight: "700" }}>
              {data.length}
            </span>
          </div>
          {totalValue > 0 && (
            <div>
              <span
                style={{ color: "#666", fontSize: "0.9rem", fontWeight: "600" }}
              >
                TOTAL VALUE:{" "}
              </span>
              <span style={{ color: "#28a745", fontWeight: "700" }}>
                ₦{totalValue.toLocaleString()}
              </span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "#666", fontWeight: "600", fontSize: "1rem" }}>
            {supplierName || "All Suppliers"}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill="#0d6efd"
            viewBox="0 0 16 16"
          >
            <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2zm1 .5v1.308l4.372 4.858A.5.5 0 0 1 7 8.5v5.306l2-.666V8.5a.5.5 0 0 1 .128-.334L13.5 3.308V2h-11z" />
          </svg>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#0d6efd", color: "white" }}>
              <th
                style={{
                  padding: "15px 20px",
                  textAlign: "left",
                  fontWeight: "600",
                }}
              >
                S/N
              </th>
              <th
                style={{
                  padding: "15px 20px",
                  textAlign: "left",
                  fontWeight: "600",
                }}
              >
                Date
              </th>
              <th
                style={{
                  padding: "15px 20px",
                  textAlign: "left",
                  fontWeight: "600",
                }}
              >
                Product
              </th>
              <th
                style={{
                  padding: "15px 20px",
                  textAlign: "left",
                  fontWeight: "600",
                }}
              >
                Invoice No
              </th>
              <th
                style={{
                  padding: "15px 20px",
                  textAlign: "center",
                  fontWeight: "600",
                }}
              >
                Vehicle No
              </th>
              <th
                style={{
                  padding: "15px 20px",
                  textAlign: "center",
                  fontWeight: "600",
                }}
              >
                Warehouse
              </th>
              <th
                style={{
                  padding: "15px 20px",
                  textAlign: "center",
                  fontWeight: "600",
                }}
              >
                Amount (₦)
              </th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  style={{ padding: "60px 20px", textAlign: "center" }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "15px",
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="60"
                      height="60"
                      fill="#ccc"
                      viewBox="0 0 16 16"
                    >
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                      <path d="M4.285 12.433a.5.5 0 0 0 .683-.183A3.5 3.5 0 0 1 8 10.5c1.295 0 2.426.703 3.032 1.75a.5.5 0 0 0 .866-.5A4.5 4.5 0 0 0 8 9.5a4.5 4.5 0 0 0-3.898 2.25.5.5 0 0 0 .183.683zM7 6.5C7 7.328 6.552 8 6 8s-1-.672-1-1.5S5.448 5 6 5s1 .672 1 1.5zm4 0c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S9.448 5 10 5s1 .672 1 1.5z" />
                    </svg>
                    <h3
                      style={{ color: "#666", fontSize: "1.5rem", margin: 0 }}
                    >
                      No Goods Supplied Records Found
                    </h3>
                    <p
                      style={{
                        color: "#999",
                        fontSize: "1rem",
                        maxWidth: "400px",
                      }}
                    >
                      No records match your selected filters. Try adjusting the
                      date range or supplier selection.
                    </p>
                    <button
                      onClick={onClose}
                      style={{
                        backgroundColor: "#0d6efd",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        padding: "10px 25px",
                        fontSize: "1rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        marginTop: "10px",
                      }}
                    >
                      BACK TO FILTERS
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={item.id || index}
                  style={{
                    backgroundColor: index % 2 === 0 ? "white" : "#eef6ff",
                  }}
                >
                  <td
                    style={{
                      padding: "15px 20px",
                      color: "#666",
                      fontWeight: "500",
                    }}
                  >
                    {index + 1}
                  </td>
                  <td
                    style={{
                      padding: "15px 20px",
                      color: "#666",
                      fontWeight: "500",
                    }}
                  >
                    {item.dateSupplied ? formatDate(item.dateSupplied) : "-"}
                  </td>
                  <td
                    style={{
                      padding: "15px 20px",
                      color: "#666",
                      fontWeight: "500",
                    }}
                  >
                    {item.suppliedProduct || "-"}
                  </td>
                  <td
                    style={{
                      padding: "15px 20px",
                      color: "#666",
                      fontWeight: "500",
                    }}
                  >
                    {item.invoiceNumber || "-"}
                  </td>
                  <td
                    style={{
                      padding: "15px 20px",
                      textAlign: "center",
                      color: "#666",
                      fontWeight: "500",
                    }}
                  >
                    {item.vehicleNumber || "-"}
                  </td>
                  <td
                    style={{
                      padding: "15px 20px",
                      textAlign: "center",
                      color: "#666",
                      fontWeight: "500",
                    }}
                  >
                    {item.warehouseName || "-"}
                  </td>
                  <td
                    style={{
                      padding: "15px 20px",
                      textAlign: "center",
                      color: "#666",
                      fontWeight: "500",
                    }}
                  >
                    {item.totalAmount
                      ? `₦${item.totalAmount.toLocaleString()}`
                      : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Navigation - Only show if there's data */}
      {data.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "40px",
            paddingTop: "20px",
          }}
        >
          <button
            style={{
              background: "transparent",
              border: "none",
              color: "#0d6efd",
              fontSize: "1.1rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            ← Prev
          </button>
          <button
            style={{
              background: "transparent",
              border: "none",
              color: "#0d6efd",
              fontSize: "1.1rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Next →
          </button>
        </div>
      )}

      {/* Blue bars at bottom (as in your design) */}
      {data.length > 0 && (
        <>
          <div
            className="mb-3"
            style={{
              height: "50px",
              backgroundColor: "#eef6ff",
              width: "100%",
              marginTop: "30px",
            }}
          ></div>
          <div
            className="mb-5"
            style={{
              height: "50px",
              backgroundColor: "#eef6ff",
              width: "100%",
            }}
          ></div>
        </>
      )}
    </div>
  );
};

export default GoodsSuppliedDisplay;
