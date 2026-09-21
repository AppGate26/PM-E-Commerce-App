import React, { useState, useEffect } from "react";
import PMlogo from "../../../../assets/images/PMlogo.png";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../../../lib/config";
import { useBranchOptions } from "../../../../lib/useBranchOptions";

const OpeningStockReport = ({ toggleReportOrModal }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportData, setReportData] = useState([]);
  const [branchId, setBranchId] = useState("");
  const { options: branchOptions, loading: branchesLoading } = useBranchOptions();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleClose = () => {
    if (toggleReportOrModal) {
      toggleReportOrModal();
    } else {
      navigate(-1);
    }
  };

  // Fetch opening stock data
  useEffect(() => {
    const fetchOpeningStock = async () => {
      try {
        setLoading(true);
        setError("");
        console.log("🔵 OpeningStockReport: Fetching opening stock data");

        const response = await apiRequest(
          "/admin/inventory/reports/opening-stock",
          "GET",
          null,
          true,
          branchId || undefined
        );

        console.log("✅ OpeningStockReport: Data fetched successfully", response);
        
        let stockData = [];
        
        if (response?.response?.openingStocks && Array.isArray(response.response.openingStocks)) {
          stockData = response.response.openingStocks;
        }
        else if (response?.response?.data && Array.isArray(response.response.data)) {
          stockData = response.response.data;
        } else if (response?.response && Array.isArray(response.response)) {
          stockData = response.response;
        } else if (response?.data && Array.isArray(response.data)) {
          stockData = response.data;
        } else if (Array.isArray(response)) {
          stockData = response;
        }
        
        setReportData(stockData);
        setCurrentPage(1);

      } catch (err) {
        console.error("❌ OpeningStockReport: Error fetching data", err);
        setError("Failed to load opening stock report. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOpeningStock();
  }, [branchId]);

  // Get current page items
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return reportData.slice(startIndex, endIndex);
  };

  const currentItems = getCurrentPageItems();
  const totalPages = Math.ceil(reportData.length / itemsPerPage);

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

  // Generate page numbers for pagination
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
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pageNumbers.push(i);
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pageNumbers.push(i);
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  // Format currency
  const formatCurrency = (value) => {
    if (!value && value !== 0) return "N/A";
    return Number(value).toLocaleString();
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "30px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <img src={PMlogo} alt="Logo" style={{ width: "70px", height: "auto" }} />
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
          OPENING STOCK
        </h2>
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

      {/* Branch selector */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          margin: "0 0 24px 0",
          padding: "14px 18px",
          background: "#f4f8ff",
          border: "1px solid #d9e6fb",
          borderRadius: "12px",
        }}
      >
        <label
          htmlFor="opening-stock-branch"
          style={{ fontWeight: 700, color: "#274b78", fontSize: "0.9rem" }}
        >
          Branch
        </label>
        <select
          id="opening-stock-branch"
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          disabled={branchesLoading}
          style={{
            minWidth: "220px",
            padding: "10px 14px",
            border: "1.5px solid #c6daf7",
            borderRadius: "8px",
            fontSize: "0.95rem",
            background: "white",
            color: "#274b78",
            cursor: "pointer",
          }}
        >
          <option value="">All Branches</option>
          {branchOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {branchesLoading && (
          <span style={{ color: "#5c7ba6", fontSize: "0.85rem" }}>Loading branches…</span>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: "20px" }}>
          <div style={{ width: "50px", height: "50px", border: "4px solid #e9ecef", borderTop: "4px solid #0d6efd", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
          <p style={{ color: "#0d6efd", fontSize: "1.1rem", fontWeight: "500" }}>
            Loading opening stock data...
          </p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: "20px" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="#dc3545" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
          </svg>
          <div style={{ color: "#dc3545", fontSize: "1.2rem", fontWeight: "600" }}>
            {error}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              padding: "12px 30px",
              backgroundColor: "#0d6efd",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "600"
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Data Display */}
      {!loading && !error && (
        <>
          {/* Filter Icon */}
          {reportData.length > 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
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
          )}

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#0d6efd", color: "white" }}>
                  <th style={{ padding: "15px 20px", textAlign: "left", fontWeight: "600", fontSize: "0.95rem" }}>S/N</th>
                  <th style={{ padding: "15px 20px", textAlign: "left", fontWeight: "600", fontSize: "0.95rem" }}>Product</th>
                  <th style={{ padding: "15px 20px", textAlign: "left", fontWeight: "600", fontSize: "0.95rem" }}>Product description</th>
                  <th style={{ padding: "15px 20px", textAlign: "center", fontWeight: "600", fontSize: "0.95rem" }}>Price</th>
                  <th style={{ padding: "15px 20px", textAlign: "center", fontWeight: "600", fontSize: "0.95rem" }}>Quantity</th>
                  <th style={{ padding: "15px 20px", textAlign: "left", fontWeight: "600", fontSize: "0.95rem" }}>Category</th>
                  <th style={{ padding: "15px 20px", textAlign: "left", fontWeight: "600", fontSize: "0.95rem" }}>Sub-category</th>
                </tr>
              </thead>
              <tbody>
                {reportData.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: "80px 20px", textAlign: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="#ccc" viewBox="0 0 16 16">
                          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                          <path d="M4.285 12.433a.5.5 0 0 0 .683-.183A3.5 3.5 0 0 1 8 10.5c1.295 0 2.426.703 3.032 1.75a.5.5 0 0 0 .866-.5A4.5 4.5 0 0 0 8 9.5a4.5 4.5 0 0 0-3.898 2.25.5.5 0 0 0 .183.683zM7 6.5C7 7.328 6.552 8 6 8s-1-.672-1-1.5S5.448 5 6 5s1 .672 1 1.5zm4 0c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S9.448 5 10 5s1 .672 1 1.5z"/>
                        </svg>
                        <h3 style={{ color: "#666", fontSize: "1.5rem", margin: 0 }}>
                          No Opening Stock Found
                        </h3>
                        <p style={{ color: "#999", fontSize: "1rem", maxWidth: "400px", margin: 0 }}>
                          There are no opening stock records available in the system.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((item, index) => {
                    const actualIndex = (currentPage - 1) * itemsPerPage + index;
                    const rowColor = index % 2 === 0 ? "white" : "#eef6ff";
                    
                    return (
                      <tr key={item.stockId || item.id || actualIndex} style={{ backgroundColor: rowColor }}>
                        <td style={{ padding: "15px 20px", color: "#666", fontWeight: "500" }}>
                          {actualIndex + 1}
                        </td>
                        <td style={{ padding: "15px 20px", color: "#666", fontWeight: "500" }}>
                          {item.productName || item.product || "-"}
                        </td>
                        <td style={{ padding: "15px 20px", color: "#666", fontWeight: "500" }}>
                          {item.description || item.productDescription || "-"}
                        </td>
                        <td style={{ padding: "15px 20px", textAlign: "center", color: "#666", fontWeight: "500" }}>
                          {formatCurrency(item.unitPrice || item.price || item.costPrice)}
                        </td>
                        <td style={{ padding: "15px 20px", textAlign: "center", color: "#666", fontWeight: "500" }}>
                          {item.quantity || 0}
                        </td>
                        <td style={{ padding: "15px 20px", color: "#666", fontWeight: "500" }}>
                          {item.category || item.categoryName || "-"}
                        </td>
                        <td style={{ padding: "15px 20px", color: "#666", fontWeight: "500" }}>
                          {item.subCategory || item.subCategoryName || "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Empty Rows for Spacing - only show if there's data */}
          {reportData.length > 0 && (
            <div style={{ marginTop: "30px" }}>
              <div style={{ height: "50px", backgroundColor: "#eef6ff", marginBottom: "15px" }}></div>
              <div style={{ height: "50px", backgroundColor: "#eef6ff" }}></div>
            </div>
          )}

          {/* Pagination Controls */}
          {reportData.length > 0 && totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: "40px", paddingTop: "20px", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                style={{
                  padding: "10px 20px",
                  backgroundColor: currentPage === 1 ? "#e9ecef" : "#0d6efd",
                  color: currentPage === 1 ? "#6c757d" : "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  fontSize: "1rem",
                  fontWeight: "600"
                }}
              >
                ← Prev
              </button>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={index} style={{ padding: "10px 12px", color: "#666", fontWeight: "600" }}>...</span>
                  ) : (
                    <button
                      key={index}
                      onClick={() => goToPage(page)}
                      style={{
                        padding: "10px 15px",
                        backgroundColor: currentPage === page ? "#0d6efd" : "white",
                        color: currentPage === page ? "white" : "#0d6efd",
                        border: currentPage === page ? "none" : "2px solid #0d6efd",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "1rem",
                        fontWeight: "600",
                        minWidth: "45px"
                      }}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                style={{
                  padding: "10px 20px",
                  backgroundColor: currentPage === totalPages ? "#e9ecef" : "#0d6efd",
                  color: currentPage === totalPages ? "#6c757d" : "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  fontSize: "1rem",
                  fontWeight: "600"
                }}
              >
                Next →
              </button>
            </div>
          )}

          {/* Simple Prev/Next when only one page */}
          {reportData.length > 0 && totalPages <= 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px", paddingTop: "20px" }}>
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#0d6efd",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  cursor: "not-allowed",
                  opacity: 0.5
                }}
                disabled
              >
                Prev
              </button>
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#0d6efd",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  cursor: "not-allowed",
                  opacity: 0.5
                }}
                disabled
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OpeningStockReport;