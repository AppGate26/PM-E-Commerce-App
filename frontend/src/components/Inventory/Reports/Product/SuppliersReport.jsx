import React, { useState, useEffect } from "react";
import PMlogo from "../../../../assets/images/PMlogo.png";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../../../lib/config";

const SuppliersReport = ({ toggleReportOrModal }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportData, setReportData] = useState({
    suppliers: [],
    totalSuppliers: 0
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Show 10 suppliers per page

  const handleClose = () => {
    if (toggleReportOrModal) {
      toggleReportOrModal();
    } else {
      navigate(-1);
    }
  };

  // Fetch suppliers report data
  useEffect(() => {
    const fetchSuppliersReport = async () => {
      try {
        setLoading(true);
        console.log("🔵 SuppliersReport: Fetching suppliers report data");
        
        const response = await apiRequest("/admin/inventory/reports/suppliers", "GET");
        
        console.log("✅ SuppliersReport: Data fetched successfully", response);
        
        // Handle different response structures
        let suppliers = [];
        let totalSuppliers = 0;
        
        if (response?.response) {
          suppliers = response.response.suppliers || [];
          totalSuppliers = response.response.totalSuppliers || suppliers.length;
        } else if (response?.data) {
          suppliers = response.data.suppliers || [];
          totalSuppliers = response.data.totalSuppliers || suppliers.length;
        } else {
          suppliers = response.suppliers || [];
          totalSuppliers = response.totalSuppliers || suppliers.length;
        }
        
        setReportData({
          suppliers: suppliers,
          totalSuppliers: totalSuppliers
        });
        
      } catch (err) {
        console.error("❌ SuppliersReport: Error fetching data", err);
        setError("Failed to load suppliers report. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliersReport();
  }, []);

  // Get current page suppliers
  const getCurrentPageSuppliers = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return reportData.suppliers.slice(startIndex, endIndex);
  };

  const currentSuppliers = getCurrentPageSuppliers();
  const totalPages = Math.ceil(reportData.suppliers.length / itemsPerPage);

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

  return (
    <div
      style={{
        backgroundColor: "white",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1000,
        overflowY: "auto",
        padding: "20px",
      }}
    >
      <div className="container">
        {/* Header */}
        <div className="row align-items-center mb-4">
          <div className="col-3">
            <img src={PMlogo} alt="Logo" style={{ width: "80px", height: "auto" }} />
          </div>
          <div className="col-6 text-center">
            <h2 style={{ color: "#0d6efd", fontWeight: "bold" }}>SUPPLIERS REPORT</h2>
          </div>
          <div className="col-3 text-end">
            <button
              onClick={handleClose}
              style={{ border: "none", background: "transparent", cursor: "pointer" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="30"
                height="30"
                fill="#0d6efd"
                className="bi bi-x-circle-fill"
                viewBox="0 0 16 16"
              >
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="container text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3" style={{ color: "#0d6efd", fontSize: "1.2rem" }}>
              Loading suppliers report...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="container text-center py-5">
            <div style={{ color: "#dc3545", fontSize: "1.2rem" }}>
              {error}
            </div>
            <button 
              onClick={() => window.location.reload()} 
              style={{
                marginTop: "20px",
                padding: "10px 20px",
                backgroundColor: "#0d6efd",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Filter Section and Table */}
        {!loading && !error && (
          <>
            {/* Filter Section */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span style={{ color: "#555", fontSize: "1.1rem" }}>
                Total Suppliers: <strong>{reportData.totalSuppliers}</strong>
              </span>
              <div className="d-flex align-items-center" style={{ color: "#555", fontSize: "1.1rem" }}>
                <span className="me-2">All Suppliers</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-funnel" viewBox="0 0 16 16" style={{color: "#0d6efd"}}>
                  <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2zm1 .5v1.308l4.372 4.858A.5.5 0 0 1 7 8.5v5.306l2-.666V8.5a.5.5 0 0 1 .128-.334L13.5 3.308V2h-11z"/>
                </svg>
              </div>
            </div>

            {/* Page Info */}
            <div className="text-end mb-2" style={{ color: "#666", fontSize: "0.9rem" }}>
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, reportData.suppliers.length)} - {Math.min(currentPage * itemsPerPage, reportData.suppliers.length)} of {reportData.suppliers.length} suppliers
            </div>

            {/* Table */}
            <div className="table-responsive">
              <table className="table table-borderless align-middle" style={{textAlign: "left"}}>
                <thead style={{ backgroundColor: "#0d6efd", color: "white" }}>
                  <tr>
                    <th className="py-3 ps-4" style={{ backgroundColor: "#0d6efd", color: "white" }}>S/N</th>
                    <th className="py-3" style={{ backgroundColor: "#0d6efd", color: "white" }}>Suppliers' name</th>
                    <th className="py-3" style={{ backgroundColor: "#0d6efd", color: "white" }}>Suppliers' ID</th>
                    <th className="py-3" style={{ backgroundColor: "#0d6efd", color: "white" }}>Email</th>
                    <th className="py-3" style={{ backgroundColor: "#0d6efd", color: "white" }}>Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSuppliers.length > 0 ? (
                    currentSuppliers.map((supplier, index) => {
                      const serialNumber = (currentPage - 1) * itemsPerPage + index + 1;
                      const rowColor = index % 2 === 0 ? "white" : "#eef6ff";
                      
                      return (
                        <tr key={supplier.supplierId || index} style={{ backgroundColor: rowColor }}>
                          <td className="py-3 ps-4" style={{ backgroundColor: rowColor, fontWeight: "500", color: "#555" }}>
                            {serialNumber}
                          </td>
                          <td className="py-3" style={{ backgroundColor: rowColor, fontWeight: "500", color: "#555" }}>
                            {supplier.customerName || "N/A"}
                          </td>
                          <td className="py-3" style={{ backgroundColor: rowColor, fontWeight: "500", color: "#555" }}>
                            {supplier.supplierId || "N/A"}
                          </td>
                          <td className="py-3" style={{ backgroundColor: rowColor, fontWeight: "500", color: "#555" }}>
                            {supplier.contactEmail || "N/A"}
                          </td>
                          <td className="py-3" style={{ backgroundColor: rowColor, fontWeight: "500", color: "#555" }}>
                            {supplier.contactPhone || "N/A"}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-4" style={{ color: "#666" }}>
                        No suppliers found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              
              {/* Blue bars at bottom */}
              <div className="mb-3" style={{height: "50px", backgroundColor: "#eef6ff", width: "100%"}}></div>
              <div className="mb-5" style={{height: "50px", backgroundColor: "#eef6ff", width: "100%"}}></div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center", 
                marginTop: "20px",
                marginBottom: "20px",
                gap: "10px",
                flexWrap: "wrap"
              }}>
                {/* Previous Button */}
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
                    fontWeight: "500"
                  }}
                >
                  ← Prev
                </button>

                {/* Page Numbers */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                      <span key={index} style={{ padding: "8px 12px", color: "#666" }}>...</span>
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
                          minWidth: "40px"
                        }}
                      >
                        {page}
                      </button>
                    )
                  ))}
                </div>

                {/* Next Button */}
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: currentPage === totalPages ? "#e9ecef" : "#0d6efd",
                    color: currentPage === totalPages ? "#6c757d" : "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    fontSize: "1rem",
                    fontWeight: "500"
                  }}
                >
                  Next →
                </button>
              </div>
            )}

            {/* Simple Prev/Next as per your original design (optional) */}
            {totalPages <= 1 && (
              <div className="d-flex justify-content-between mt-4">
                <button 
                  className="btn btn-link text-decoration-none fw-bold" 
                  style={{ fontSize: "1.2rem", color: "#0d6efd", cursor: "not-allowed", opacity: 0.5 }}
                  disabled
                >
                  Prev
                </button>
                <button 
                  className="btn btn-link text-decoration-none fw-bold" 
                  style={{ fontSize: "1.2rem", color: "#0d6efd", cursor: "not-allowed", opacity: 0.5 }}
                  disabled
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SuppliersReport;