import React, { useEffect, useState } from "react";
import "./OnlineCusModal.css";
import { FaTimes, FaChevronLeft, FaChevronRight, FaFileExcel, FaCheck } from "react-icons/fa";
import { IoGridOutline } from "react-icons/io5";
import { apiRequest } from "../../../../../lib/config";
import * as XLSX from "xlsx";

const OnlineCus = ({ closeModal }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [apiError, setApiError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDateFilters, setShowDateFilters] = useState(false);

  const fetchOnlineCustomers = async (page = 0, appliedStartDate = startDate, appliedEndDate = endDate) => {
    try {
      setLoading(true);
      setApiError("");

      const params = new URLSearchParams({
        page: String(page),
        size: String(pageSize),
      });

      if (appliedStartDate) params.append("startDate", appliedStartDate);
      if (appliedEndDate) params.append("endDate", appliedEndDate);

      const endpoint = `/admin/customers/online/report?${params.toString()}`;
      const response = await apiRequest(endpoint, "GET", null, true);

      let customersList = [];
      let totalCount = 0;

      if (response?.response?.content && Array.isArray(response.response.content)) {
        customersList = response.response.content;
        totalCount = response.response.totalElements || customersList.length;
      } else if (response?.content && Array.isArray(response.content)) {
        customersList = response.content;
        totalCount = response.totalElements || response.total || customersList.length;
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
        firstName: customer.firstName || customer.firstname || customer.givenName || "",
        surname: customer.surname || customer.lastName || customer.lastname || customer.familyName || "",
        email: customer.email || customer.emailAddress || "",
        gender: customer.gender || customer.sex || "",
        accountNumber: customer.accountNumber || customer.accountNo || customer.account || "",
        status: customer.status || (customer.suspended ? "Suspended" : "Verified") || "Verified",
        suspended: customer.suspended || false,
        customerType: customer.customerType || "ONLINE",
        dateCreated: customer.dateCreated || customer.createdAt || customer.registrationDate || "",
      }));

      setCustomers(formattedCustomers);
      setTotalItems(totalCount);
      setTotalPages(Math.ceil(totalCount / pageSize) || 1);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching online customer report:", error);
      setApiError("Failed to load online customers report. Please try again.");
      setCustomers([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnlineCustomers(0);
  }, []);

  const handleDateFilterApply = () => {
    fetchOnlineCustomers(0, startDate, endDate);
  };

  const handleClearDateFilters = () => {
    setStartDate("");
    setEndDate("");
    fetchOnlineCustomers(0, "", "");
  };

  const filteredCustomers = customers.filter((cust) => {
    if (!searchTerm.trim()) return true;

    const searchLower = searchTerm.toLowerCase();
    const fullName = `${cust.firstName || ""} ${cust.surname || ""}`.toLowerCase();
    const email = cust.email?.toLowerCase() || "";
    const accountNumber = cust.accountNumber?.toString() || "";

    return (
      fullName.includes(searchLower) ||
      email.includes(searchLower) ||
      accountNumber.includes(searchTerm)
    );
  });

  const getStatusBadgeColor = (status) => {
    if (status?.toLowerCase() === "verified") return "#0867db";
    if (status?.toLowerCase() === "pending") return "#ffc107";
    if (status?.toLowerCase() === "suspended") return "#dc3545";
    return "#6c757d";
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      fetchOnlineCustomers(newPage);
    }
  };

  const handleExportExcel = () => {
    try {
      if (filteredCustomers.length === 0) {
        setApiError("No online customers to export.");
        return;
      }

      setApiError("");

      const rows = filteredCustomers.map((customer, index) => ({
        sn: index + 1,
        name: `${customer.firstName || ""} ${customer.surname || ""}`.trim() || "N/A",
        email: customer.email || "N/A",
        gender: customer.gender
          ? customer.gender === "MALE"
            ? "M"
            : customer.gender === "FEMALE"
              ? "F"
              : customer.gender.charAt(0).toUpperCase()
          : "N/A",
        accountNumber: customer.accountNumber || "N/A",
        status: customer.status || "N/A",
      }));

      const worksheet = XLSX.utils.aoa_to_sheet([
        ["Online Customers Information Report"],
        ["Generated At", new Date().toLocaleString()],
        ["Start Date", startDate || "N/A"],
        ["End Date", endDate || "N/A"],
        [],
      ]);

      XLSX.utils.sheet_add_json(worksheet, rows, { origin: "A6", skipHeader: false });
      worksheet["!cols"] = [
        { wch: 8 },
        { wch: 28 },
        { wch: 30 },
        { wch: 10 },
        { wch: 20 },
        { wch: 16 },
      ];
      worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Online Customers");
      XLSX.writeFile(workbook, `online-customers-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) {
      console.error("Error exporting online customers:", error);
      setApiError("Failed to export online customers.");
    }
  };

  const displayPage = currentPage + 1;
  const startIndex = currentPage * pageSize;
  const displayedCustomers = filteredCustomers.slice(startIndex, startIndex + pageSize);

  return (
    <div className="online-report-standard">
      <div className="heading">
        <div></div>
        <div style={{ textAlign: "center" }}>
          <h1 className="heading1">PM MARKET HUB</h1>
          <p className="p1">64 OGUI ROAD, ENUGU-STATE</p>
          <p className="p1">TEL: 0800XXXXX</p>
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
                  }}
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
                  }}
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
            disabled={loading || filteredCustomers.length === 0}
            style={{
              backgroundColor: filteredCustomers.length === 0 ? "#e9ecef" : "transparent",
              color: filteredCustomers.length === 0 ? "#999" : "#28a745",
              border: `2px solid ${filteredCustomers.length === 0 ? "#ced4da" : "#28a745"}`,
              padding: "10px 20px",
              borderRadius: "6px",
              fontSize: "1.3rem",
              fontWeight: "600",
              cursor: filteredCustomers.length === 0 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s",
              height: "44px",
              whiteSpace: "nowrap",
            }}
          >
            <FaFileExcel size={18} />
            Export to Excel
            {filteredCustomers.length > 0 && ` (${filteredCustomers.length})`}
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
          }}
        >
          <span style={{ fontSize: "1.5rem" }}>!</span>
          <span>{apiError}</span>
          <button
            onClick={() => {
              setApiError("");
              fetchOnlineCustomers(0);
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
          <p className="heading2">ONLINE CUSTOMERS INFORMATION REPORT</p>
        </div>

        <div style={{ width: "100%" }}>
          <div className="tr1">
            <div style={{ width: "6%", textAlign: "center" }}>S/N</div>
            <div style={{ width: "20%", textAlign: "left", paddingLeft: "10px" }}>NAME</div>
            <div style={{ width: "25%", textAlign: "left", paddingLeft: "10px" }}>EMAIL</div>
            <div style={{ width: "10%", textAlign: "center" }}>GENDER</div>
            <div style={{ width: "20%", textAlign: "center" }}>ACCOUNT NO.</div>
            <div style={{ width: "15%", textAlign: "center" }}>STATUS</div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#666", backgroundColor: "#ffffff", borderBottom: "1px solid #dee2e6", fontSize: "1.4rem" }}>
              Loading online customers report...
            </div>
          ) : customers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#666", backgroundColor: "#ffffff", borderBottom: "1px solid #dee2e6", fontSize: "1.4rem" }}>
              No online customers found in the system
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#666", backgroundColor: "#ffffff", borderBottom: "1px solid #dee2e6", fontSize: "1.4rem" }}>
              {searchTerm ? `No online customers found matching "${searchTerm}"` : "No online customers match the current filter"}
            </div>
          ) : (
            <>
              {displayedCustomers.map((customer, index) => {
                const fullName = `${customer.firstName || ""} ${customer.surname || ""}`.trim();
                const displayIndex = startIndex + index + 1;
                const statusColor = getStatusBadgeColor(customer.status);

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
                    <div style={{ width: "6%", textAlign: "center", fontWeight: "500", color: "#0867db" }}>{displayIndex}</div>
                    <div style={{ width: "20%", fontWeight: "500", color: "#0867db", paddingLeft: "10px" }}>{fullName || "N/A"}</div>
                    <div style={{ width: "25%", color: "#0867db", paddingLeft: "10px", fontSize: "1.25rem", wordBreak: "break-word" }}>{customer.email || "N/A"}</div>
                    <div style={{ width: "10%", textAlign: "center", fontWeight: "500", color: "#0867db" }}>
                      {customer.gender ? (customer.gender === "MALE" ? "M" : customer.gender === "FEMALE" ? "F" : customer.gender.charAt(0).toUpperCase()) : "N/A"}
                    </div>
                    <div style={{ width: "20%", fontFamily: "monospace", fontWeight: "500", textAlign: "center", color: "#0867db", letterSpacing: "0.5px", fontSize: "1.25rem" }}>
                      {customer.accountNumber || "N/A"}
                    </div>
                    <div style={{ width: "15%", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "5px 12px",
                          borderRadius: "12px",
                          fontSize: "1.2rem",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          backgroundColor: `${statusColor}15`,
                          color: statusColor,
                          border: `1px solid ${statusColor}30`,
                          minWidth: "100px",
                          justifyContent: "center",
                        }}
                      >
                        <span
                          style={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "50%",
                            backgroundColor: statusColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: "0.8rem",
                          }}
                        >
                          <FaCheck />
                        </span>
                        {customer.status || "N/A"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {!loading && filteredCustomers.length > 0 && totalPages > 1 && (
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
                  }}
                >
                  <FaChevronLeft size={12} />
                  Previous
                </button>

                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i;
                    else if (currentPage <= 2) pageNum = i;
                    else if (currentPage >= totalPages - 3) pageNum = totalPages - 5 + i;
                    else pageNum = currentPage - 2 + i;

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
                  }}
                >
                  Next
                  <FaChevronRight size={12} />
                </button>
              </div>

              <div style={{ fontSize: "1.2rem", color: "#666", fontWeight: "500" }}>Page {displayPage} of {totalPages}</div>
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
                <>No online customers found in the system</>
              ) : filteredCustomers.length === 0 ? (
                <>No customers match the current search criteria</>
              ) : searchTerm ? (
                <>
                  Found {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? "s" : ""} matching "{searchTerm}"
                  {totalItems > filteredCustomers.length && ` (out of ${totalItems} total customers)`}
                </>
              ) : (
                <>
                  Total: {totalItems} online customer{totalItems !== 1 ? "s" : ""}
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

export default OnlineCus;
