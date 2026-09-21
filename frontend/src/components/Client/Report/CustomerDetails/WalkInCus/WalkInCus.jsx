import React, { useEffect, useState } from "react";
import "./WalkInCus.css";
import { FaTimes, FaChevronLeft, FaChevronRight, FaFileExcel, FaCheck } from "react-icons/fa";
import { IoGridOutline } from "react-icons/io5";
import { apiRequest } from "../../../../../lib/config";
import * as XLSX from "xlsx";

const WalkInCus = ({ closeModal }) => {
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

  const fetchWalkInCustomers = async (page = 0, appliedStartDate = startDate, appliedEndDate = endDate) => {
    try {
      setLoading(true);
      setApiError("");

      const params = new URLSearchParams({
        page: String(page),
        size: String(pageSize),
      });

      if (appliedStartDate) params.append("startDate", appliedStartDate);
      if (appliedEndDate) params.append("endDate", appliedEndDate);

      const endpoint = `/admin/customers/walk-in/report?${params.toString()}`;
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
        id: customer.id || customer.customerId || `walkin-${index}`,
        firstName: customer.firstName || customer.firstname || customer.givenName || "",
        surname: customer.surname || customer.lastName || customer.lastname || customer.familyName || "",
        email: customer.email || customer.emailAddress || "",
        gender: customer.gender || customer.sex || "",
        accountNumber: customer.accountNumber || customer.accountNo || customer.account || "",
        status: customer.status || (customer.suspended ? "Suspended" : "Verified") || "Verified",
        customerType: customer.customerType || "WALKIN",
        branchName:
          customer.branchName ||
          customer.branch?.branchName ||
          customer.branch?.name ||
          customer.branchCode ||
          customer.branch?.branchCode ||
          "",
        dateCreated: customer.dateCreated || customer.createdAt || customer.registrationDate || "",
      }));

      setCustomers(formattedCustomers);
      setTotalItems(totalCount);
      setTotalPages(Math.ceil(totalCount / pageSize) || 1);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching walk-in customer report:", error);
      setApiError("Failed to load walk-in customers report. Please try again.");
      setCustomers([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalkInCustomers(0);
  }, []);

  const handleDateFilterApply = () => {
    fetchWalkInCustomers(0, startDate, endDate);
  };

  const handleClearDateFilters = () => {
    setStartDate("");
    setEndDate("");
    fetchWalkInCustomers(0, "", "");
  };

  const filteredCustomers = customers.filter((customer) => {
    if (!searchTerm.trim()) return true;

    const searchLower = searchTerm.toLowerCase();
    const fullName = `${customer.firstName || ""} ${customer.surname || ""}`.toLowerCase();
    const email = customer.email?.toLowerCase() || "";
    const accountNumber = customer.accountNumber?.toString() || "";

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
      fetchWalkInCustomers(newPage, startDate, endDate);
    }
  };

  const handleExportExcel = () => {
    try {
      if (filteredCustomers.length === 0) {
        setApiError("No walk-in customers to export.");
        return;
      }

      setApiError("");

      const rows = filteredCustomers.map((customer, index) => ({
        sn: index + 1,
        name: `${customer.firstName || ""} ${customer.surname || ""}`.trim() || "N/A",
        email: customer.email || "N/A",
        branch: customer.branchName || "N/A",
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
        ["Walk-In Customers Information Report"],
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
        { wch: 20 },
        { wch: 10 },
        { wch: 20 },
        { wch: 16 },
      ];
      worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Walk-In Customers");
      XLSX.writeFile(workbook, `walkin-customers-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) {
      console.error("Error exporting walk-in customers:", error);
      setApiError("Failed to export walk-in customers.");
    }
  };

  const displayPage = currentPage + 1;
  const startIndex = currentPage * pageSize;
  const displayedCustomers = filteredCustomers.slice(startIndex, startIndex + pageSize);

  return (
    <div className="walkin-report-standard">
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
          marginBottom: "12px",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => setShowDateFilters(!showDateFilters)}
            style={{
              backgroundColor: "transparent",
              color: "#0867db",
              border: "1px solid #0867db",
              padding: "9px 14px",
              borderRadius: "10px",
              fontSize: "0.9rem",
              fontWeight: "700",
              cursor: "pointer",
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
                background: "#f7fbff",
                border: "1px solid #d6e7fb",
                borderRadius: "12px",
                padding: "10px 12px",
              }}
            >
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  padding: "8px 10px",
                  border: "1px solid #c6daf7",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                }}
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  padding: "8px 10px",
                  border: "1px solid #c6daf7",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                }}
              />
              <button
                onClick={handleDateFilterApply}
                style={{
                  background: "#1f9d55",
                  color: "#fff",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                Apply
              </button>
              <button
                onClick={handleClearDateFilters}
                style={{
                  background: "#dc3545",
                  color: "#fff",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleExportExcel}
          disabled={loading || filteredCustomers.length === 0}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            borderRadius: "10px",
            border: `1px solid ${filteredCustomers.length === 0 ? "#cfd9e5" : "#1f9d55"}`,
            background: filteredCustomers.length === 0 ? "#eef2f6" : "#ffffff",
            color: filteredCustomers.length === 0 ? "#8ea0b5" : "#1f9d55",
            padding: "10px 14px",
            fontSize: "0.92rem",
            fontWeight: "700",
            cursor: filteredCustomers.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          <FaFileExcel />
          Export to Excel
        </button>
      </div>

      <div className="search-div">
        <input
          className="search"
          type="text"
          placeholder="Search by customer name, email, or account number"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {apiError && (
        <div
          style={{
            marginBottom: "12px",
            padding: "10px 14px",
            borderRadius: "12px",
            border: "1px solid #f3c7cc",
            background: "#fff2f4",
            color: "#a42034",
            fontSize: "0.92rem",
            fontWeight: "600",
          }}
        >
          {apiError}
        </div>
      )}

      <div className="table-div">
        <div>
          <p className="heading2">WALK-IN CUSTOMERS INFORMATION REPORT</p>
        </div>

        <div style={{ width: "100%", overflow: "auto" }}>
          <div className="tr1">
            <div style={{ width: "6%", textAlign: "center" }}>S/N</div>
            <div style={{ width: "18%", textAlign: "left", paddingLeft: "10px" }}>NAME</div>
            <div style={{ width: "22%", textAlign: "left", paddingLeft: "10px" }}>EMAIL</div>
            <div style={{ width: "14%", textAlign: "center" }}>BRANCH</div>
            <div style={{ width: "8%", textAlign: "center" }}>GENDER</div>
            <div style={{ width: "17%", textAlign: "center" }}>ACCOUNT NO.</div>
            <div style={{ width: "15%", textAlign: "center" }}>STATUS</div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#4f6788", fontSize: "0.95rem" }}>
              Loading walk-in customers report...
            </div>
          ) : customers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#4f6788", fontSize: "0.95rem" }}>
              No walk-in customers found in the system.
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#4f6788", fontSize: "0.95rem" }}>
              No walk-in customers match the current search.
            </div>
          ) : (
            displayedCustomers.map((customer, index) => {
              const fullName = `${customer.firstName || ""} ${customer.surname || ""}`.trim();
              const displayIndex = startIndex + index + 1;
              const statusColor = getStatusBadgeColor(customer.status);

              return (
                <div
                  key={customer.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    minHeight: "54px",
                    borderBottom: "1px solid #edf2f8",
                    background: index % 2 === 0 ? "#ffffff" : "#f9fbff",
                    color: "#164476",
                    fontSize: "0.88rem",
                  }}
                >
                  <div style={{ width: "6%", textAlign: "center", fontWeight: "700" }}>{displayIndex}</div>
                  <div style={{ width: "18%", paddingLeft: "10px", fontWeight: "700" }}>{fullName || "N/A"}</div>
                  <div style={{ width: "22%", paddingLeft: "10px", wordBreak: "break-word" }}>{customer.email || "N/A"}</div>
                  <div style={{ width: "14%", textAlign: "center", fontWeight: "700", wordBreak: "break-word" }}>{customer.branchName || "N/A"}</div>
                  <div style={{ width: "8%", textAlign: "center", fontWeight: "700" }}>
                    {customer.gender
                      ? customer.gender === "MALE"
                        ? "M"
                        : customer.gender === "FEMALE"
                          ? "F"
                          : customer.gender.charAt(0).toUpperCase()
                      : "N/A"}
                  </div>
                  <div style={{ width: "17%", textAlign: "center", fontFamily: "monospace", fontWeight: "700" }}>
                    {customer.accountNumber || "N/A"}
                  </div>
                  <div style={{ width: "15%", textAlign: "center" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        justifyContent: "center",
                        minWidth: "100px",
                        padding: "5px 10px",
                        borderRadius: "999px",
                        background: `${statusColor}15`,
                        color: statusColor,
                        border: `1px solid ${statusColor}30`,
                        fontSize: "0.78rem",
                        fontWeight: "800",
                        textTransform: "uppercase",
                      }}
                    >
                      <FaCheck style={{ fontSize: "0.7rem" }} />
                      {customer.status || "N/A"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {!loading && filteredCustomers.length > 0 && totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              padding: "12px 16px",
              borderTop: "1px solid #d6e7fb",
              background: "#f7fbff",
              color: "#36597e",
              fontSize: "0.88rem",
            }}
          >
            <div>
              Showing {startIndex + 1} to {Math.min((currentPage + 1) * pageSize, totalItems)} of {totalItems} customers
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  background: currentPage === 0 ? "#dbe5f1" : "#0867db",
                  color: currentPage === 0 ? "#7d90a7" : "#fff",
                  cursor: currentPage === 0 ? "not-allowed" : "pointer",
                }}
              >
                <FaChevronLeft />
                Previous
              </button>

              <span style={{ fontWeight: "700" }}>
                Page {displayPage} of {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  background: currentPage === totalPages - 1 ? "#dbe5f1" : "#0867db",
                  color: currentPage === totalPages - 1 ? "#7d90a7" : "#fff",
                  cursor: currentPage === totalPages - 1 ? "not-allowed" : "pointer",
                }}
              >
                Next
                <FaChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalkInCus;
