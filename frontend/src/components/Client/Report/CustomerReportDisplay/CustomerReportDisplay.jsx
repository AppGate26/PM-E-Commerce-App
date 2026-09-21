import React, { useMemo, useState } from "react";
import "./CustomerReportDisplayModal.css";
import BranchBadge from "../../../shared/BranchBadge";
import {
  FaArrowLeft,
  FaDownload,
  FaFileExcel,
  FaSearch,
  FaTimes,
  FaUsers,
  FaUserCheck,
  FaUserSlash,
} from "react-icons/fa";
import { apiRequest } from "../../../../lib/config";
import { useBranchOptions } from "../../../../lib/useBranchOptions";
import pmLogo from "../../../../assets/images/PMlogo.png";
import * as XLSX from "xlsx";
import { useAuth } from "../../../../context/AuthContext";
import { formatBranchAddress, getUserBranchDetails } from "../../../../lib/branchAccess";

const customerListOptions = [
  { value: "ALL", label: "All Customers" },
  { value: "WALKIN CUSTOMERLIST", label: "Walk-In Customers" },
  { value: "ONLINE CUSTOMERLIST", label: "Online Customers" },
];
const DEFAULT_CLIENT_BRANCH_ADDRESS = "64 Ogui Road, Enugu State";

const orderMethodOptions = [
  { value: "", label: "ALL" },
  { value: "REFUND ORDER", label: "Refund Order" },
  { value: "CANCELLED ORDER", label: "Cancelled Order" },
  { value: "PROGRESS", label: "Progress" },
  { value: "INSTALLMENT ORDER", label: "Installment Order" },
];

const displayOptions = [
  { value: "date", label: "Sort by Date" },
  { value: "account", label: "Sort by Account Number" },
  { value: "name", label: "Sort by Name" },
];

const formatDisplayDate = (date) => {
  if (!date) return "N/A";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleDateString("en-GB");
};

const normalizeGender = (gender) => {
  if (!gender) return "N/A";
  const value = String(gender).toUpperCase();
  if (value === "MALE") return "M";
  if (value === "FEMALE") return "F";
  return value.charAt(0);
};

const normalizeStatus = (customer) => {
  if (customer.suspended === true || customer.suspended === "true") return "Suspended";
  if (customer.active === false || customer.active === "false") return "Inactive";
  return customer.status || customer.accountStatus || "Active";
};

const statusClassName = (status) => {
  const value = String(status || "").toLowerCase();
  if (value === "suspended") return "crd-status suspended";
  if (value === "inactive" || value === "pending") return "crd-status pending";
  return "crd-status active";
};

const CustomerReportDisplay = ({ closeModal }) => {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [orderMethod, setOrderMethod] = useState("");
  const [customerList, setCustomerList] = useState("ALL");
  const [branchId, setBranchId] = useState("");
  const { options: branchOptions, loading: branchesLoading } = useBranchOptions();
  const [displayOption, setDisplayOption] = useState("date");
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasGenerated, setHasGenerated] = useState(false);

  const buildFormattedCustomers = (allCustomers, selectedCustomerList) => {
    return allCustomers.map((customer, index) => {
      const firstName = customer.firstName || customer.firstname || customer.first_name || "";
      const lastName =
        customer.surname || customer.lastName || customer.lastname || customer.last_name || "";
      const customerType =
        customer.customerType ||
        customer.type ||
        (selectedCustomerList === "WALKIN CUSTOMERLIST"
          ? "WALK_IN"
          : selectedCustomerList === "ONLINE CUSTOMERLIST"
            ? "ONLINE"
            : customer.walkIn
              ? "WALK_IN"
              : "ONLINE");

      return {
        id: customer.id || customer.customerId || `temp-${index}`,
        sn: index + 1,
        firstName,
        surname: lastName,
        email: customer.email || customer.emailAddress || "",
        gender: customer.gender || customer.sex || "",
        accountNumber: customer.accountNumber || customer.accountNo || customer.account || "",
        phoneNumber: customer.phoneNumber || customer.phone || customer.phoneNo || customer.mobile || "",
        customerType,
        dateCreated: customer.createdAt || customer.createdDate || customer.dateCreated || "",
        status: normalizeStatus(customer),
        suspended: customer.suspended || false,
      };
    });
  };

  const extractCollection = (response) => {
    if (response?.response?.content && Array.isArray(response.response.content)) {
      return response.response.content;
    }
    if (response?.content && Array.isArray(response.content)) {
      return response.content;
    }
    if (response?.data && Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray(response)) {
      return response;
    }
    return [];
  };

  const handleGenerateReport = async () => {
    if (startDate && endDate && startDate > endDate) {
      setError("Start date cannot be later than end date.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setHasGenerated(false);

      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (orderMethod) params.append("orderMethod", orderMethod);

      let allCustomers = [];

      if (customerList === "ALL") {
        const walkInEndpoint = `/admin/customers/walk-in/report${params.toString() ? `?${params.toString()}` : ""}`;
        const onlineEndpoint = `/admin/customers/online/report${params.toString() ? `?${params.toString()}` : ""}`;

        const [walkInResponse, onlineResponse] = await Promise.all([
          // Walk-in customers are branch-scoped, so honour the branch filter here too.
          apiRequest(walkInEndpoint, "GET", null, true, branchId || undefined),
          apiRequest(onlineEndpoint, "GET", null, true),
        ]);

        allCustomers = [...extractCollection(walkInResponse), ...extractCollection(onlineResponse)];
      } else if (customerList === "WALKIN CUSTOMERLIST") {
        const endpoint = `/admin/customers/walk-in/report${params.toString() ? `?${params.toString()}` : ""}`;
        allCustomers = extractCollection(
          await apiRequest(endpoint, "GET", null, true, branchId || undefined)
        );
      } else {
        const endpoint = `/admin/customers/online/report${params.toString() ? `?${params.toString()}` : ""}`;
        allCustomers = extractCollection(await apiRequest(endpoint, "GET", null, true));
      }

      const formattedCustomers = buildFormattedCustomers(allCustomers, customerList);
      setCustomers(formattedCustomers);
      setHasGenerated(true);
    } catch (fetchError) {
      console.error("Error generating customer report:", fetchError);
      setError(fetchError?.message || "Failed to generate customer report.");
      setCustomers([]);
      setHasGenerated(false);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    const sorted = [...customers].sort((a, b) => {
      if (displayOption === "account") {
        return String(a.accountNumber || "").localeCompare(String(b.accountNumber || ""));
      }

      if (displayOption === "name") {
        return `${a.firstName} ${a.surname}`
          .trim()
          .toLowerCase()
          .localeCompare(`${b.firstName} ${b.surname}`.trim().toLowerCase());
      }

      return new Date(b.dateCreated || 0) - new Date(a.dateCreated || 0);
    });

    if (!searchTerm.trim()) return sorted;

    const query = searchTerm.toLowerCase();
    return sorted.filter((customer) => {
      const fullName = `${customer.firstName || ""} ${customer.surname || ""}`.toLowerCase();
      const accountNumber = String(customer.accountNumber || "");
      const email = String(customer.email || "").toLowerCase();
      const phone = String(customer.phoneNumber || "");

      return (
        fullName.includes(query) ||
        accountNumber.includes(searchTerm) ||
        email.includes(query) ||
        phone.includes(searchTerm)
      );
    });
  }, [customers, displayOption, searchTerm]);

  const stats = useMemo(() => {
    const suspended = customers.filter((customer) => String(customer.status).toLowerCase() === "suspended").length;
    const active = customers.filter((customer) => String(customer.status).toLowerCase() === "active").length;
    const inactive = Math.max(customers.length - suspended - active, 0);

    return [
      { label: "Records", value: customers.length, icon: <FaUsers /> },
      { label: "Active", value: active, icon: <FaUserCheck /> },
      { label: "Suspended", value: suspended, icon: <FaUserSlash /> },
      { label: "Other Status", value: inactive, icon: <FaFileExcel /> },
    ];
  }, [customers]);

  const selectedCustomerListLabel =
    customerListOptions.find((option) => option.value === customerList)?.label || "All Customers";
  const selectedDisplayLabel =
    displayOptions.find((option) => option.value === displayOption)?.label || "Sort by Date";
  const branchAddress = formatBranchAddress(
    getUserBranchDetails(user?.email, user),
    DEFAULT_CLIENT_BRANCH_ADDRESS
  );

  const handleExportExcel = () => {
    if (filteredCustomers.length === 0) {
      setError("No records available to export.");
      return;
    }

    setError("");

    const rows = filteredCustomers.map((customer, index) => ({
      sn: index + 1,
      name: `${customer.firstName || ""} ${customer.surname || ""}`.trim() || "N/A",
      accountNumber: customer.accountNumber || "",
      email: customer.email || "",
      phoneNumber: customer.phoneNumber || "",
      gender: normalizeGender(customer.gender),
      customerType: String(customer.customerType).toLowerCase().includes("walk") ? "Walk-In" : "Online",
      status: customer.status || "",
      dateCreated: formatDisplayDate(customer.dateCreated),
    }));

    const worksheet = XLSX.utils.aoa_to_sheet([
      ["Customer Report Display"],
      ["Generated At", new Date().toLocaleString()],
      ["Branch Address", branchAddress],
      ["Customer List", selectedCustomerListLabel],
      ["Display Option", selectedDisplayLabel],
      ["Start Date", startDate ? formatDisplayDate(startDate) : "N/A"],
      ["End Date", endDate ? formatDisplayDate(endDate) : "N/A"],
      [],
    ]);

    XLSX.utils.sheet_add_json(worksheet, rows, {
      origin: "A9",
      skipHeader: false,
    });

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 28 },
      { wch: 20 },
      { wch: 30 },
      { wch: 18 },
      { wch: 10 },
      { wch: 16 },
      { wch: 14 },
      { wch: 16 },
    ];

    worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customer Report");
    XLSX.writeFile(
      workbook,
      `customer-report-display-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const handleBackToGenerator = () => {
    setHasGenerated(false);
    setSearchTerm("");
    setError("");
  };

  return (
    <div className="crd-shell">
      <header className="crd-hero">
        <div className="crd-hero-brand">
          <img src={pmLogo} alt="PM MARKET HUB logo" className="crd-hero-logo" />
          <div className="crd-hero-copy">
            <p className="crd-hero-eyebrow">PM MARKET HUB</p>
            <p className="crd-hero-address">{branchAddress}</p>
            <h1 className="crd-title">Customer Report Generator</h1>
            <div style={{ display: "flex", justifyContent: "center", margin: "0.4rem 0" }}>
              <BranchBadge />
            </div>
            <p className="crd-hero-subtitle">
              Generate a customer list report by date range, customer source, and display method.
            </p>
          </div>
        </div>

        <button type="button" className="crd-close-btn" onClick={closeModal} aria-label="Close report generator">
          <FaTimes />
        </button>
      </header>

      {error && <div className="crd-alert error">{error}</div>}

      {!hasGenerated && (
      <section className="crd-panel">
        <div className="crd-panel-head">
          <div>
            <p className="crd-section-eyebrow">Report Setup</p>
            <h2 className="crd-section-title">Choose report filters</h2>
          </div>
        </div>

        <div className="crd-form-grid">
          <div className="crd-field">
            <label className="crd-label" htmlFor="crd-start-date">Start Date</label>
            <input
              id="crd-start-date"
              type="date"
              className="crd-input"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>

          <div className="crd-field">
            <label className="crd-label" htmlFor="crd-end-date">End Date</label>
            <input
              id="crd-end-date"
              type="date"
              className="crd-input"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>

          <div className="crd-field">
            <label className="crd-label" htmlFor="crd-order-method">Order Method</label>
            <select
              id="crd-order-method"
              className="crd-select-input"
              value={orderMethod}
              onChange={(event) => setOrderMethod(event.target.value)}
            >
              {orderMethodOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="crd-field">
            <label className="crd-label" htmlFor="crd-customer-list">Customer List</label>
            <select
              id="crd-customer-list"
              className="crd-select-input"
              value={customerList}
              onChange={(event) => {
                const next = event.target.value;
                setCustomerList(next);
                // Branch only applies to walk-in customers; clear it for online-only.
                if (next === "ONLINE CUSTOMERLIST") setBranchId("");
              }}
            >
              {customerListOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="crd-field">
            <label className="crd-label" htmlFor="crd-branch">Branch</label>
            <select
              id="crd-branch"
              className="crd-select-input"
              value={branchId}
              onChange={(event) => setBranchId(event.target.value)}
              disabled={customerList === "ONLINE CUSTOMERLIST" || branchesLoading}
              title={
                customerList === "ONLINE CUSTOMERLIST"
                  ? "Online customers are not branch-scoped"
                  : "Filter walk-in customers by branch"
              }
            >
              <option value="">
                {customerList === "ONLINE CUSTOMERLIST" ? "Not applicable" : "All Branches"}
              </option>
              {branchOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="crd-display-section">
          <p className="crd-label">Display Option</p>
          <div className="crd-chip-row">
            {displayOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`crd-chip ${displayOption === option.value ? "active" : ""}`}
                onClick={() => setDisplayOption(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="crd-actions">
            <button type="button" className="crd-secondary-btn" onClick={() => {
              setStartDate("");
              setEndDate("");
              setOrderMethod("");
              setCustomerList("ALL");
              setBranchId("");
              setDisplayOption("date");
              setSearchTerm("");
              setCustomers([]);
              setHasGenerated(false);
              setError("");
            }}>
              Reset
            </button>
            <button type="button" className="crd-primary-btn" onClick={handleGenerateReport} disabled={loading}>
              <FaDownload />
              {loading ? "Generating..." : "Generate Report"}
            </button>
          </div>
        </div>
      </section>
      )}

      <section className={`crd-results-panel ${hasGenerated ? "report-mode" : ""}`}>
        <div className="crd-results-head">
          <div>
            <p className="crd-section-eyebrow">Generated Report</p>
            <h2 className="crd-section-title">Customer list display</h2>
          </div>

          <div className="crd-results-actions">
            {hasGenerated && (
              <button type="button" className="crd-secondary-btn" onClick={handleBackToGenerator}>
                <FaArrowLeft />
                Back to Generator
              </button>
            )}
            <div className="crd-search-wrap">
              <FaSearch className="crd-search-icon" />
              <input
                type="text"
                className="crd-search-input"
                placeholder="Search name, email, phone, or account number"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <button type="button" className="crd-export-btn" onClick={handleExportExcel} disabled={filteredCustomers.length === 0}>
              <FaFileExcel />
              Export
            </button>
          </div>
        </div>

        <div className="crd-meta-strip">
          <span>{selectedCustomerListLabel}</span>
          <span>{selectedDisplayLabel}</span>
          <span>{startDate ? `From ${formatDisplayDate(startDate)}` : "No start date"}</span>
          <span>{endDate ? `To ${formatDisplayDate(endDate)}` : "No end date"}</span>
        </div>

        <div className="crd-stats-grid">
          {stats.map((stat) => (
            <article key={stat.label} className="crd-stat-card">
              <div className="crd-stat-icon">{stat.icon}</div>
              <div>
                <p className="crd-stat-label">{stat.label}</p>
                <h3 className="crd-stat-value">{stat.value}</h3>
              </div>
            </article>
          ))}
        </div>

        <div className="crd-table-card">
          <div className="crd-table-summary">
            {hasGenerated
              ? `Showing ${filteredCustomers.length} of ${customers.length} generated customer record(s).`
              : "Generate a report to display customer records here."}
          </div>

          <div className="crd-table-scroll">
            <table className="crd-table">
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>Name</th>
                  <th>Account No.</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Gender</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Date Created</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9">
                      <div className="crd-table-state">Generating customer report...</div>
                    </td>
                  </tr>
                ) : !hasGenerated ? (
                  <tr>
                    <td colSpan="9">
                      <div className="crd-table-state">Set your filters and click Generate Report.</div>
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="9">
                      <div className="crd-table-state">No customer records found for the current filters.</div>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer, index) => (
                    <tr key={customer.id}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="crd-name-cell">
                          <span className="crd-avatar">
                            {`${customer.firstName || ""} ${customer.surname || ""}`.trim().charAt(0) || "C"}
                          </span>
                          <div>
                            <p>{`${customer.firstName || ""} ${customer.surname || ""}`.trim() || "N/A"}</p>
                            <span>{customer.email || "No email"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="crd-mono">{customer.accountNumber || "N/A"}</td>
                      <td>{customer.email || "N/A"}</td>
                      <td>{customer.phoneNumber || "N/A"}</td>
                      <td>{normalizeGender(customer.gender)}</td>
                      <td>
                        <span className={`crd-type-pill ${String(customer.customerType).toLowerCase().includes("walk") ? "walkin" : "online"}`}>
                          {String(customer.customerType).toLowerCase().includes("walk") ? "Walk-In" : "Online"}
                        </span>
                      </td>
                      <td>
                        <span className={statusClassName(customer.status)}>{customer.status}</span>
                      </td>
                      <td>{formatDisplayDate(customer.dateCreated)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CustomerReportDisplay;
