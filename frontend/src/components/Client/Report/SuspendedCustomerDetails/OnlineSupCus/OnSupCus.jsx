import React, { useEffect, useState } from "react";
import "./OnSupCus.css";
import { FaTimes, FaChevronLeft, FaChevronRight, FaFileExcel } from "react-icons/fa";
import { IoGridOutline } from "react-icons/io5";
import { apiRequest } from "../../../../../lib/config";
import * as XLSX from "xlsx";

const OnSupCus = ({ closeModal }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [apiError, setApiError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDateFilters, setShowDateFilters] = useState(false);

  const fetchSuspendedOnlineCustomers = async (page = 0, appliedStartDate = startDate, appliedEndDate = endDate) => {
    try {
      setLoading(true);
      setApiError("");

      const params = new URLSearchParams({
        page: String(page),
        size: String(pageSize),
      });

      if (appliedStartDate) params.append("startDate", appliedStartDate);
      if (appliedEndDate) params.append("endDate", appliedEndDate);

      const endpoint = `/admin/customers/online/suspended/report?${params.toString()}`;
      const response = await apiRequest(endpoint, "GET", null, true);

      let customersList = [];
      let totalCount = 0;

      if (response?.response?.content && Array.isArray(response.response.content)) {
        customersList = response.response.content;
        totalCount = response.response.totalElements || customersList.length;
      } else if (response?.content && Array.isArray(response.content)) {
        customersList = response.content;
        totalCount = response.totalElements || customersList.length;
      } else if (Array.isArray(response)) {
        customersList = response;
        totalCount = response.length;
      } else if (response?.data && Array.isArray(response.data)) {
        customersList = response.data;
        totalCount = response.total || customersList.length;
      }

      const formattedCustomers = customersList.map((customer, index) => ({
        id: customer.id || customer.customerId || `temp-${index}`,
        sn: index + 1,
        firstName: customer.firstName || customer.firstname || "",
        surname: customer.surname || customer.lastName || customer.lastname || "",
        email: customer.email || customer.emailAddress || "",
        gender: customer.gender || customer.sex || "",
        accountNumber: customer.accountNumber || customer.accountNo || customer.account || "",
        reason: customer.reasonForSuspension || customer.suspensionReason || customer.reason || "Suspended",
        suspended: customer.suspended ?? true,
        customerType: customer.customerType || "ONLINE",
        dateCreated: customer.createdAt || customer.createdDate || "",
        dateSuspended: customer.updatedAt || customer.suspendedDate || customer.dateCreated || "",
        phoneNumber: customer.phoneNumber || customer.phone || "",
      }));

      setCustomers(formattedCustomers);
      setTotalItems(totalCount);
      setTotalPages(Math.ceil(totalCount / pageSize) || 1);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching suspended online customer report:", error);

      if (error.message && error.message.includes("Network Error")) {
        setApiError("Network error. Please check your internet connection.");
      } else if (error.message && error.message.includes("401")) {
        setApiError("Authentication failed. Please log in again.");
      } else if (error.message && error.message.includes("403")) {
        setApiError("You don't have permission to access suspended customer data.");
      } else if (error.message && error.message.includes("404")) {
        setApiError("Suspended online customer report endpoint not found.");
      } else if (error.message && error.message.includes("500")) {
        setApiError("Server error. Please try again later.");
      } else {
        setApiError("Failed to load suspended online customers report. Please try again.");
      }

      setCustomers([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuspendedOnlineCustomers(0);
  }, []);

  const handleDateFilterApply = () => {
    fetchSuspendedOnlineCustomers(0, startDate, endDate);
  };

  const handleClearDateFilters = () => {
    setStartDate("");
    setEndDate("");
    fetchSuspendedOnlineCustomers(0, "", "");
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      fetchSuspendedOnlineCustomers(newPage);
    }
  };

  const handleExportExcel = () => {
    try {
      if (customers.length === 0) {
        setApiError("No suspended online customers to export.");
        return;
      }

      setApiError("");

      const rows = customers.map((customer, index) => ({
        sn: index + 1,
        date: formatDateForDisplay(customer.dateSuspended || customer.dateCreated),
        fullName: `${customer.firstName || ""} ${customer.surname || ""}`.trim() || "N/A",
        gender: customer.gender
          ? customer.gender === "MALE"
            ? "M"
            : customer.gender === "FEMALE"
              ? "F"
              : customer.gender.charAt(0).toUpperCase()
          : "N/A",
        accountNumber: customer.accountNumber || "N/A",
        reason: customer.reason || "Suspended",
      }));

      const worksheet = XLSX.utils.aoa_to_sheet([
        ["Suspended Online Customer Report"],
        ["Generated At", new Date().toLocaleString()],
        ["Start Date", startDate || "N/A"],
        ["End Date", endDate || "N/A"],
        [],
      ]);

      XLSX.utils.sheet_add_json(worksheet, rows, {
        origin: "A6",
        skipHeader: false,
      });

      worksheet["!cols"] = [
        { wch: 8 },
        { wch: 16 },
        { wch: 28 },
        { wch: 10 },
        { wch: 20 },
        { wch: 34 },
      ];
      worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Suspended Online");
      XLSX.writeFile(workbook, `suspended-online-customers-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      setApiError("Failed to export suspended online customers.");
    }
  };

  const displayPage = currentPage + 1;
  const startIndex = currentPage * pageSize;
  const displayedCustomers = customers.slice(startIndex, startIndex + pageSize);

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return dateString;

      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  return (
    <div className="online-suspended-report-standard">
      <div className="heading">
        <div></div>
        <div style={{ textAlign: "center" }}>
          <h1 className="heading1">PM MARKET HUB</h1>
          <p className="p1">64-00U1 ROAD.BNJOU-STATE</p>
          <p className="p1">TEL: 0800XXXX</p>
        </div>
        <div className="icon-div">
          <IoGridOutline className="icon1" style={{ fontSize: "2.2rem" }} />
          <FaTimes className="icon2" onClick={closeModal} />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px",
          flexWrap: "wrap",
          gap: "15px",
        }}
      >
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => setShowDateFilters(!showDateFilters)}
            style={{
              backgroundColor: "transparent",
              color: "#0867db",
              border: "1px solid #0867db",
              padding: "8px 16px",
              borderRadius: "6px",
              fontSize: "1.2rem",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#0867db";
              e.target.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "transparent";
              e.target.style.color = "#0867db";
            }}
          >
            {showDateFilters ? "Hide Date Filters" : "Show Date Filters"}
          </button>

          {showDateFilters && (
            <div
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
                flexWrap: "wrap",
                backgroundColor: "#f8f9fa",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #dee2e6",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <label style={{ fontSize: "1.2rem", color: "#495057", fontWeight: "500" }}>From:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    padding: "8px",
                    border: "1px solid #dee2e6",
                    borderRadius: "4px",
                    fontSize: "1.2rem",
                    minWidth: "150px",
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <label style={{ fontSize: "1.2rem", color: "#495057", fontWeight: "500" }}>To:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    padding: "8px",
                    border: "1px solid #dee2e6",
                    borderRadius: "4px",
                    fontSize: "1.2rem",
                    minWidth: "150px",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "5px" }}>
                <button
                  onClick={handleDateFilterApply}
                  style={{
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    fontSize: "1.2rem",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = "#218838")}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = "#28a745")}
                >
                  Apply
                </button>
                <button
                  onClick={handleClearDateFilters}
                  style={{
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    fontSize: "1.2rem",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = "#c82333")}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = "#dc3545")}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        <div>
          <button
            onClick={handleExportExcel}
            disabled={loading || customers.length === 0}
            style={{
              backgroundColor: customers.length === 0 ? "#e9ecef" : "transparent",
              color: customers.length === 0 ? "#999" : "#28a745",
              border: `2px solid ${customers.length === 0 ? "#ced4da" : "#28a745"}`,
              padding: "10px 20px",
              borderRadius: "6px",
              fontSize: "1.3rem",
              fontWeight: "600",
              cursor: customers.length === 0 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s",
              height: "44px",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (customers.length > 0) {
                e.target.style.backgroundColor = "#28a745";
                e.target.style.color = "white";
              }
            }}
            onMouseLeave={(e) => {
              if (customers.length > 0) {
                e.target.style.backgroundColor = "transparent";
                e.target.style.color = "#28a745";
              }
            }}
          >
            <FaFileExcel size={18} />
            Export to Excel
            {customers.length > 0 && ` (${customers.length})`}
          </button>
        </div>
      </div>

      {apiError && (
        <div
          style={{
            backgroundColor: "#f8d7da",
            color: "#721c24",
            padding: "12px",
            marginBottom: "15px",
            borderRadius: "4px",
            border: "1px solid #f5c6cb",
            textAlign: "center",
            fontSize: "1.3rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "1.5rem" }}>!</span>
          <span>{apiError}</span>
          <button
            onClick={() => {
              setApiError("");
              fetchSuspendedOnlineCustomers(0);
            }}
            style={{
              backgroundColor: "transparent",
              color: "#721c24",
              border: "1px solid #721c24",
              padding: "4px 12px",
              borderRadius: "4px",
              fontSize: "1.1rem",
              cursor: "pointer",
              marginLeft: "10px",
            }}
          >
            Retry
          </button>
        </div>
      )}

      <div className="table-div">
        <div>
          <p className="heading2">SUSPENDED ONLINE CUSTOMER REPORT</p>
        </div>

        <div style={{ width: "100%" }}>
          <div className="tr1">
            <div style={{ width: "10%", textAlign: "center" }}>S/N</div>
            <div style={{ width: "15%", textAlign: "center" }}>DATE</div>
            <div style={{ width: "25%", textAlign: "center" }}>FULL-NAME</div>
            <div style={{ width: "10%", textAlign: "center" }}>GENDER</div>
            <div style={{ width: "20%", textAlign: "center" }}>ACCOUNT NUMBER</div>
            <div style={{ width: "20%", textAlign: "center" }}>REASON</div>
          </div>

          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px",
                color: "#666",
                backgroundColor: "#ffffff",
                borderBottom: "1px solid #dee2e6",
                fontSize: "1.4rem",
              }}
            >
              Loading suspended online customers report...
            </div>
          ) : customers.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px",
                color: "#666",
                backgroundColor: "#ffffff",
                borderBottom: "1px solid #dee2e6",
                fontSize: "1.4rem",
              }}
            >
              No suspended online customers found in the system
            </div>
          ) : (
            <>
              {displayedCustomers.map((customer, index) => {
                const fullName = `${customer.firstName || ""} ${customer.surname || ""}`.trim();
                const displayIndex = startIndex + index + 1;
                const displayDate = formatDateForDisplay(customer.dateSuspended || customer.dateCreated);

                return (
                  <div
                    key={customer.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                      padding: "12px 10px",
                      borderBottom: "1px solid #dee2e6",
                      backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa",
                      fontSize: "1.3rem",
                      minHeight: "55px",
                    }}
                  >
                    <div style={{ width: "10%", textAlign: "center", fontWeight: "500", color: "#0867db" }}>
                      {displayIndex}
                    </div>

                    <div style={{ width: "15%", fontWeight: "500", color: "#0867db", textAlign: "center" }}>
                      {displayDate}
                    </div>

                    <div style={{ width: "25%", fontWeight: "500", color: "#0867db", textAlign: "center" }}>
                      {fullName || "N/A"}
                    </div>

                    <div style={{ width: "10%", textAlign: "center", fontWeight: "500", color: "#0867db" }}>
                      {customer.gender
                        ? customer.gender === "MALE"
                          ? "M"
                          : customer.gender === "FEMALE"
                            ? "F"
                            : customer.gender.charAt(0).toUpperCase()
                        : "N/A"}
                    </div>

                    <div
                      style={{
                        width: "20%",
                        fontFamily: "monospace",
                        fontWeight: "500",
                        textAlign: "center",
                        color: "#0867db",
                        letterSpacing: "0.5px",
                        fontSize: "1.25rem",
                      }}
                    >
                      {customer.accountNumber || "N/A"}
                    </div>

                    <div style={{ width: "20%", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "6px 12px",
                          borderRadius: "12px",
                          fontSize: "1.2rem",
                          fontWeight: "500",
                          backgroundColor: "#f8d7da",
                          color: "#721c24",
                          maxWidth: "200px",
                          textAlign: "center",
                          wordBreak: "break-word",
                        }}
                      >
                        {customer.reason || "Suspended"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {!loading && customers.length > 0 && totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "15px 20px",
                backgroundColor: "#f8f9fa",
                borderTop: "2px solid #dee2e6",
                marginTop: "5px",
                flexWrap: "wrap",
                gap: "15px",
              }}
            >
              <div style={{ fontSize: "1.3rem", color: "#0867db" }}>
                Showing {startIndex + 1} to {Math.min((currentPage + 1) * pageSize, totalItems)} of {totalItems} customers
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: currentPage === 0 ? "#e9ecef" : "#0867db",
                    color: currentPage === 0 ? "#999" : "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: currentPage === 0 ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    fontSize: "1.3rem",
                    fontWeight: "500",
                    transition: "background-color 0.2s",
                  }}
                >
                  <FaChevronLeft size={12} />
                  Previous
                </button>

                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i;
                    } else if (currentPage <= 2) {
                      pageNum = i;
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 5 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    if (pageNum < 0 || pageNum >= totalPages) return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        style={{
                          padding: "8px 12px",
                          backgroundColor: currentPage === pageNum ? "#0867db" : "#e9ecef",
                          color: currentPage === pageNum ? "white" : "#495057",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          minWidth: "40px",
                          fontWeight: currentPage === pageNum ? "bold" : "normal",
                          fontSize: "1.3rem",
                          transition: "background-color 0.2s",
                        }}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: currentPage === totalPages - 1 ? "#e9ecef" : "#0867db",
                    color: currentPage === totalPages - 1 ? "#999" : "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: currentPage === totalPages - 1 ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    fontSize: "1.3rem",
                    fontWeight: "500",
                    transition: "background-color 0.2s",
                  }}
                >
                  Next
                  <FaChevronRight size={12} />
                </button>
              </div>

              <div style={{ fontSize: "1.2rem", color: "#666", fontWeight: "500" }}>
                Page {displayPage} of {totalPages}
              </div>
            </div>
          )}

          {!loading && (
            <div
              style={{
                padding: "15px 20px",
                backgroundColor: "#e9ecef",
                borderTop: totalPages <= 1 ? "2px solid #dee2e6" : "none",
                textAlign: "center",
                fontSize: "1.3rem",
                color: "#495057",
                fontWeight: "500",
              }}
            >
              {customers.length === 0 ? (
                <>No suspended online customers found in the system</>
              ) : (
                <>
                  Total: {totalItems} suspended online customer{totalItems !== 1 ? "s" : ""}
                  {totalPages > 1 && ` • Page ${displayPage} of ${totalPages}`}
                  {startDate && ` • Filtered from ${startDate}`}
                  {endDate && ` to ${endDate}`}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnSupCus;
