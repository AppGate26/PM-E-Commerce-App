import React, { useState, useEffect } from "react";
import { apiRequest } from "../../../../lib/config";
import { useBranchOptions } from "../../../../lib/useBranchOptions";
import { useAuth } from "../../../../context/AuthContext";
import BranchBadge from "../../../shared/BranchBadge";
import PMlogo from "../../../../assets/images/PMlogo.png";

const StockDisplay = ({ toggleDisplay }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // Multi-select suppliers (INV #5): empty array = All Suppliers.
  const [selectedSupplierIds, setSelectedSupplierIds] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [branchId, setBranchId] = useState("");
  const { options: branchOptions, loading: branchesLoading } = useBranchOptions();
  // INV #5a: only admin / head-office users may pick another branch; a branch
  // user is auto-scoped by the backend and must not choose one here.
  const { canSelectBranch, branch: userBranch } = useAuth();
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [stockSummary, setStockSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // Toggle a supplier in/out of the multi-select (INV #5).
  const toggleSupplier = (id) => {
    const key = String(id);
    setSelectedSupplierIds((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  };

  // Human-readable label for the selected suppliers (shown on the report header).
  const supplierName =
    selectedSupplierIds.length === 0
      ? "All Suppliers"
      : suppliers
          .filter((s) => selectedSupplierIds.includes(String(s.id)))
          .map((s) => s.customerName || s.companyName || s.name || `Supplier ${s.id}`)
          .join(", ");

  // A branch user always reports on their own branch; head-office/admin can pick.
  const effectiveBranchId = canSelectBranch ? branchId : userBranch?.id || "";

  const handleDisplay = async () => {
    try {
      setLoading(true);
      setError("");

      // Build the endpoint with supplier and date filters
      const stockParams = new URLSearchParams();
      if (selectedSupplierIds.length > 0) {
        stockParams.set("supplierIds", selectedSupplierIds.join(","));
      }
      if (startDate && endDate) {
        stockParams.set("startDate", startDate);
        stockParams.set("endDate", endDate);
      }
      const stockQuery = stockParams.toString();
      const stockEndpoint = `/admin/inventory/reports/stock${stockQuery ? `?${stockQuery}` : ""}`;
      console.log("Fetching stock report from:", stockEndpoint, "with suppliers:", selectedSupplierIds);

      const stockResponse = await apiRequest(
        stockEndpoint,
        "GET",
        null,
        true,
        effectiveBranchId || undefined
      );
      console.log("Stock response:", stockResponse);

      // Handle stock report data - FIXED: looking for "stocks" (plural) as per your API
      let stockData = [];

      // Check for different response structures
      if (stockResponse?.response?.stocks && Array.isArray(stockResponse.response.stocks)) {
        stockData = stockResponse.response.stocks;
        console.log("✅ Found stocks array with", stockData.length, "items");
      } else if (
        stockResponse?.response?.data &&
        Array.isArray(stockResponse.response.data)
      ) {
        stockData = stockResponse.response.data;
      } else if (
        stockResponse?.response &&
        Array.isArray(stockResponse.response)
      ) {
        stockData = stockResponse.response;
      } else if (stockResponse?.data && Array.isArray(stockResponse.data)) {
        stockData = stockResponse.data;
      } else if (Array.isArray(stockResponse)) {
        stockData = stockResponse;
      }

      // Server-side filtering is now handled by the backend with the supplierIds query parameter
      console.log("Server-side filtered stock data:", stockData.length, "items");

      console.log("Final stockData:", stockData);

      // Fetch stock summary
      const summaryResponse = await apiRequest(
        "/admin/inventory/stock-summary",
        "GET",
        null,
        true,
        effectiveBranchId || undefined
      );
      console.log("Summary response:", summaryResponse);

      let summary = null;
      if (summaryResponse?.response) {
        // Extract summary data from your API structure
        summary = {
          totalValue: summaryResponse.response.totalValue,
          totalQuantity: summaryResponse.response.totalQuantity,
          stockStatus: {
            inStock: summaryResponse.response.inStockCount || 0,
            lowStock: summaryResponse.response.lowStockCount || 0,
            outOfStock: summaryResponse.response.outOfStockCount || 0
          }
        };
      } else if (summaryResponse?.data) {
        summary = summaryResponse.data;
      } else {
        summary = summaryResponse;
      }

      setReportData(stockData);
      setStockSummary(summary);
      setShowReport(true);
      setCurrentPage(1); // Reset to first page
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
      <StockReport
        data={reportData}
        summary={stockSummary}
        onClose={handleBackToFilters}
        onExit={handleClose}
        supplierName={supplierName}
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
                64 OCUI ROAD,ENUGU-STATE
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
          STOCK DISPLAY SECTION
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
              <div
                style={{
                  border: "1.5px solid #ddd",
                  borderRadius: "8px",
                  maxHeight: "180px",
                  overflowY: "auto",
                  backgroundColor: "white",
                }}
              >
                {/* All Suppliers = clear selection */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 15px",
                    borderBottom: "1px solid #eee",
                    cursor: "pointer",
                    fontWeight: "600",
                    color: "#0d6efd",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedSupplierIds.length === 0}
                    onChange={() => setSelectedSupplierIds([])}
                  />
                  All Suppliers
                </label>
                {loadingSuppliers ? (
                  <div style={{ padding: "12px 15px", color: "#999" }}>
                    Loading suppliers...
                  </div>
                ) : suppliers.length === 0 ? (
                  <div style={{ padding: "12px 15px", color: "#999" }}>
                    No suppliers found.
                  </div>
                ) : (
                  suppliers.map((supplier) => {
                    const key = String(supplier.id);
                    return (
                      <label
                        key={supplier.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px 15px",
                          cursor: "pointer",
                          color: "#333",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSupplierIds.includes(key)}
                          onChange={() => toggleSupplier(supplier.id)}
                        />
                        {supplier.customerName ||
                          supplier.companyName ||
                          supplier.name ||
                          `Supplier ${supplier.id}`}
                      </label>
                    );
                  })
                )}
              </div>
              <small style={{ color: "#666", display: "block", marginTop: "8px" }}>
                {selectedSupplierIds.length === 0
                  ? "All suppliers included"
                  : `${selectedSupplierIds.length} supplier(s) selected`}
              </small>
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
                value={selectedSupplierIds.join(", ")}
                readOnly
                placeholder="All"
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
            {canSelectBranch ? (
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
            ) : (
              <>
                <input
                  type="text"
                  value={
                    [userBranch?.branchCode, userBranch?.branchName]
                      .filter(Boolean)
                      .join(" · ") || "Your branch"
                  }
                  readOnly
                  disabled
                  style={{
                    width: "100%",
                    padding: "12px 15px",
                    border: "1.5px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    outline: "none",
                    backgroundColor: "#f8f9fa",
                    color: "#666",
                    cursor: "not-allowed",
                  }}
                />
                <small style={{ color: "#666", display: "block", marginTop: "8px" }}>
                  Branch users can only view their own branch. Sign in with a
                  head-office account to select another branch.
                </small>
              </>
            )}
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

// Stock Report Component
const StockReport = ({
  data,
  summary,
  onClose,
  onExit,
  supplierName,
  startDate,
  endDate,
}) => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get current page items
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const currentItems = getCurrentPageItems();
  const totalPages = Math.ceil(data.length / itemsPerPage);

  // Pagination handlers
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pageNumbers.push(i);
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pageNumbers.push(i);
      } else {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++)
          pageNumbers.push(i);
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  };

  // Format currency
  const formatCurrency = (value) => {
    if (!value && value !== 0) return "N/A";
    return `₦${Number(value).toLocaleString()}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
          STOCK REPORT
        </h2>
        <div style={{ display: "flex", gap: "10px" }}>
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

      {/* Summary Section */}
      {data.length > 0 && summary && (
        <div
          style={{
            backgroundColor: "#eef6ff",
            padding: "15px 20px",
            borderRadius: "8px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "15px",
          }}
        >
          <div>
            <span style={{ color: "#666", fontWeight: "600" }}>
              Total Items:{" "}
            </span>
            <span style={{ color: "#0d6efd", fontWeight: "700" }}>
              {data.length}
            </span>
          </div>
          {summary.totalQuantity && (
            <div>
              <span style={{ color: "#666", fontWeight: "600" }}>
                Total Quantity:{" "}
              </span>
              <span style={{ color: "#28a745", fontWeight: "700" }}>
                {summary.totalQuantity}
              </span>
            </div>
          )}
          {summary.totalValue && (
            <div>
              <span style={{ color: "#666", fontWeight: "600" }}>
                Total Value:{" "}
              </span>
              <span style={{ color: "#0d6efd", fontWeight: "700" }}>
                {formatCurrency(summary.totalValue)}
              </span>
            </div>
          )}
          {summary.stockStatus && (
            <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
              <span style={{ color: "#28a745" }}>
                ✅ In Stock: {summary.stockStatus.inStock || 0}
              </span>
              <span style={{ color: "#ffc107" }}>
                ⚠️ Low Stock: {summary.stockStatus.lowStock || 0}
              </span>
              <span style={{ color: "#dc3545" }}>
                ❌ Out of Stock: {summary.stockStatus.outOfStock || 0}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Filter Info */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", gap: "20px", color: "#666", flexWrap: "wrap" }}>
          {startDate && endDate && (
            <span>
              📅 {formatDate(startDate)} - {formatDate(endDate)}
            </span>
          )}
          {supplierName && <span>🏢 {supplierName}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "#666", fontWeight: "600" }}>
            Showing:{" "}
            {data.length > 0
              ? `${Math.min((currentPage - 1) * itemsPerPage + 1, data.length)} - ${Math.min(currentPage * itemsPerPage, data.length)} of ${data.length}`
              : "0 items"}
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
                Description
              </th>
              <th
                style={{
                  padding: "15px 20px",
                  textAlign: "center",
                  fontWeight: "600",
                }}
              >
                Cost Price
              </th>
              <th
                style={{
                  padding: "15px 20px",
                  textAlign: "center",
                  fontWeight: "600",
                }}
              >
                Quantity
              </th>
              <th
                style={{
                  padding: "15px 20px",
                  textAlign: "left",
                  fontWeight: "600",
                }}
              >
                Category
              </th>
              <th
                style={{
                  padding: "15px 20px",
                  textAlign: "left",
                  fontWeight: "600",
                }}
              >
                Sub-category
              </th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  style={{ padding: "80px 20px", textAlign: "center" }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "20px",
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="80"
                      height="80"
                      fill="#ccc"
                      viewBox="0 0 16 16"
                    >
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                      <path d="M4.285 12.433a.5.5 0 0 0 .683-.183A3.5 3.5 0 0 1 8 10.5c1.295 0 2.426.703 3.032 1.75a.5.5 0 0 0 .866-.5A4.5 4.5 0 0 0 8 9.5a4.5 4.5 0 0 0-3.898 2.25.5.5 0 0 0 .183.683zM7 6.5C7 7.328 6.552 8 6 8s-1-.672-1-1.5S5.448 5 6 5s1 .672 1 1.5zm4 0c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S9.448 5 10 5s1 .672 1 1.5z" />
                    </svg>
                    <h3
                      style={{ color: "#666", fontSize: "1.8rem", margin: 0 }}
                    >
                      No Stock Records Found
                    </h3>
                    <p
                      style={{
                        color: "#999",
                        fontSize: "1.1rem",
                        maxWidth: "400px",
                      }}
                    >
                      No stock records match your selected filters. Try
                      adjusting the date range or supplier selection.
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
              currentItems.map((item, index) => {
                const actualIndex = (currentPage - 1) * itemsPerPage + index;
                const rowColor = index % 2 === 0 ? "white" : "#eef6ff";

                return (
                  <tr
                    key={item.stockId || item.id || actualIndex}
                    style={{ backgroundColor: rowColor }}
                  >
                    <td
                      style={{
                        padding: "15px 20px",
                        color: "#666",
                        fontWeight: "500",
                      }}
                    >
                      {actualIndex + 1}
                    </td>
                    <td
                      style={{
                        padding: "15px 20px",
                        color: "#666",
                        fontWeight: "500",
                      }}
                    >
                      {item.stockDate ? formatDate(item.stockDate) : item.date ? formatDate(item.date) : item.createdAt ? formatDate(item.createdAt) : "N/A"}
                    </td>
                    <td
                      style={{
                        padding: "15px 20px",
                        color: "#666",
                        fontWeight: "500",
                      }}
                    >
                      {item.productName || "-"}
                    </td>
                    <td
                      style={{
                        padding: "15px 20px",
                        color: "#666",
                        fontWeight: "500",
                      }}
                    >
                      {item.description || "-"}
                    </td>
                    <td
                      style={{
                        padding: "15px 20px",
                        textAlign: "center",
                        color: "#666",
                        fontWeight: "500",
                      }}
                    >
                      {formatCurrency(item.costPrice || item.unitPrice)}
                    </td>
                    <td
                      style={{
                        padding: "15px 20px",
                        textAlign: "center",
                        color: "#666",
                        fontWeight: "500",
                      }}
                    >
                      {item.quantity || 0}
                    </td>
                    <td
                      style={{
                        padding: "15px 20px",
                        color: "#666",
                        fontWeight: "500",
                      }}
                    >
                      {item.categoryName || item.category?.categoryName || item.category?.name || item.category || "-"}
                    </td>
                    <td
                      style={{
                        padding: "15px 20px",
                        color: "#666",
                        fontWeight: "500",
                      }}
                    >
                      {item.subCategoryName || item.subCategory?.subCategoryName || item.subCategory?.name || item.subCategory || "-"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Spacer rows */}
      {data.length > 0 && (
        <>
          <div style={{ height: "50px" }}></div>
          <div
            className="mb-3"
            style={{
              height: "50px",
              backgroundColor: "#eef6ff",
              width: "100%",
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

      {/* Pagination */}
      {data.length > 0 && totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "20px",
            marginBottom: "20px",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            style={{
              padding: "8px 16px",
              backgroundColor: currentPage === 1 ? "#e9ecef" : "#0d6efd",
              color: currentPage === 1 ? "#6c757d" : "white",
              border: "none",
              borderRadius: "5px",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              fontSize: "1rem",
              fontWeight: "500",
            }}
          >
            ← Prev
          </button>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {getPageNumbers().map((page, index) =>
              page === "..." ? (
                <span
                  key={index}
                  style={{ padding: "8px 12px", color: "#666" }}
                >
                  ...
                </span>
              ) : (
                <button
                  key={index}
                  onClick={() => goToPage(page)}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: currentPage === page ? "#0d6efd" : "white",
                    color: currentPage === page ? "white" : "#0d6efd",
                    border: currentPage === page ? "none" : "1px solid #0d6efd",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontSize: "1rem",
                    fontWeight: "500",
                    minWidth: "40px",
                  }}
                >
                  {page}
                </button>
              ),
            )}
          </div>

          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            style={{
              padding: "8px 16px",
              backgroundColor:
                currentPage === totalPages ? "#e9ecef" : "#0d6efd",
              color: currentPage === totalPages ? "#6c757d" : "white",
              border: "none",
              borderRadius: "5px",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              fontSize: "1rem",
              fontWeight: "500",
            }}
          >
            Next →
          </button>
        </div>
      )}

      {/* Simple Prev/Next when only one page */}
      {data.length > 0 && totalPages <= 1 && (
        <div className="d-flex justify-content-between mt-4">
          <button
            className="btn btn-link text-decoration-none fw-bold"
            style={{
              fontSize: "1.2rem",
              color: "#0d6efd",
              cursor: "not-allowed",
              opacity: 0.5,
            }}
            disabled
          >
            Prev
          </button>
          <button
            className="btn btn-link text-decoration-none fw-bold"
            style={{
              fontSize: "1.2rem",
              color: "#0d6efd",
              cursor: "not-allowed",
              opacity: 0.5,
            }}
            disabled
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default StockDisplay;