import React, { useEffect, useMemo, useState } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaSearch,
  FaTimes,
  FaUsers,
  FaUserCheck,
  FaUserClock,
  FaUserSlash,
} from "react-icons/fa";
import "./CustomerInfo.css";
import EditCustomerInfoModal from "../EditCustomerInfo/EditCustomerInfoModal";
import { apiRequest } from "../../../../lib/config";
import pmLogo from "../../../../assets/images/PMlogo.png";
import { useAuth } from "../../../../context/AuthContext";
import { formatBranchAddress, getUserBranchDetails } from "../../../../lib/branchAccess";

const PAGE_SIZE = 6;
const DEFAULT_CLIENT_BRANCH_ADDRESS = "64 Ogui Road, Enugu State";

const normalizeGender = (gender) => {
  if (!gender) return "N/A";
  const value = String(gender).toUpperCase();
  if (value === "MALE") return "M";
  if (value === "FEMALE") return "F";
  return value.charAt(0);
};

const getStatusDetails = (customer) => {
  if (customer.suspended === true) {
    return {
      label: "Suspended",
      className: "status-pill suspended",
    };
  }

  const status = (customer.status || "").toLowerCase();

  if (status === "pending" || status === "inactive") {
    return {
      label: status || "Pending",
      className: "status-pill pending",
    };
  }

  return {
    label: customer.status || "Active",
    className: "status-pill active",
  };
};

const CustomerInfo = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCustomerData, setSelectedCustomerData] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [apiError, setApiError] = useState("");

  const fetchOnlineCustomers = async (page = 0) => {
    try {
      setLoading(true);
      setApiError("");

      const endpoint = "/admin/customers/online/report";
      const params = new URLSearchParams({
        page: String(page),
        size: String(PAGE_SIZE),
        sortBy: "date",
      });

      const response = await apiRequest(`${endpoint}?${params.toString()}`, "GET", null, true);

      let customersData = [];
      let totalCount = 0;

      if (response?.response?.content && Array.isArray(response.response.content)) {
        customersData = response.response.content;
        totalCount = response.response.totalElements || customersData.length;
      } else if (response?.data && Array.isArray(response.data)) {
        customersData = response.data;
        totalCount = customersData.length;
      } else if (response?.content && Array.isArray(response.content)) {
        customersData = response.content;
        totalCount = response.totalElements || customersData.length;
      } else if (Array.isArray(response)) {
        customersData = response;
        totalCount = response.length;
      } else if (response && typeof response === "object") {
        const possibleKeys = ["customers", "items", "list", "records", "results"];
        for (const key of possibleKeys) {
          if (Array.isArray(response[key])) {
            customersData = response[key];
            break;
          }
        }
        totalCount = response.total || response.totalItems || response.count || customersData.length;
      }

      const formattedCustomers = customersData.map((customer, index) => ({
        id: customer.id || customer.customerId || `temp-${index}`,
        firstName: customer.firstName || customer.firstname || customer.givenName || "",
        surname:
          customer.surname || customer.lastName || customer.lastname || customer.familyName || "",
        email: customer.email || customer.emailAddress || "",
        gender: customer.gender || customer.sex || "",
        accountNumber: customer.accountNumber || customer.accountNo || customer.account || "",
        status: customer.status || customer.accountStatus || "Active",
        suspended: customer.suspended || false,
        customerType: customer.customerType || "ONLINE",
        passportUrl: customer.passport || customer.passportUrl || customer.imageUrl || "",
      }));

      setCustomers(formattedCustomers);
      setTotalItems(totalCount);
      setTotalPages(Math.max(1, Math.ceil(totalCount / PAGE_SIZE)));
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching online customers:", error);
      setApiError("Unable to load online customers. Please try again.");
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

  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers;

    const query = searchTerm.toLowerCase();
    return customers.filter((customer) => {
      const fullName = `${customer.firstName || ""} ${customer.surname || ""}`.toLowerCase();
      const email = (customer.email || "").toLowerCase();
      const accountNumber = String(customer.accountNumber || "");

      return fullName.includes(query) || email.includes(query) || accountNumber.includes(searchTerm);
    });
  }, [customers, searchTerm]);

  const stats = useMemo(() => {
    const suspended = customers.filter((customer) => customer.suspended === true).length;
    const pending = customers.filter((customer) => {
      const status = (customer.status || "").toLowerCase();
      return status === "pending" || status === "inactive";
    }).length;
    const active = Math.max(customers.length - suspended - pending, 0);

    return [
      {
        label: "Total Customers",
        value: totalItems || customers.length,
        icon: <FaUsers />,
      },
      {
        label: "Active",
        value: active,
        icon: <FaUserCheck />,
      },
      {
        label: "Pending",
        value: pending,
        icon: <FaUserClock />,
      },
      {
        label: "Suspended",
        value: suspended,
        icon: <FaUserSlash />,
      },
    ];
  }, [customers, totalItems]);

  const handleEditClick = (customerId, customerData) => {
    setSelectedCustomerId(customerId);
    setSelectedCustomerData(customerData || null);
    setShowEditModal(true);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      fetchOnlineCustomers(newPage);
    }
  };

  const paginationNumbers = useMemo(() => {
    const visiblePages = Math.min(5, totalPages);

    return Array.from({ length: visiblePages }, (_, index) => {
      if (totalPages <= 5) return index;
      if (currentPage <= 2) return index;
      if (currentPage >= totalPages - 3) return totalPages - 5 + index;
      return currentPage - 2 + index;
    });
  }, [currentPage, totalPages]);

  const showingFrom = totalItems === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const showingTo = Math.min((currentPage + 1) * PAGE_SIZE, totalItems);
  const branchAddress = formatBranchAddress(
    getUserBranchDetails(user?.email, user),
    DEFAULT_CLIENT_BRANCH_ADDRESS
  );

  return (
    <div className="online-customer-info-standard">
      <header className="online-customer-header">
        <div className="online-customer-brand-shell">
          <div className="online-customer-brand-lockup">
            <img src={pmLogo} alt="PM MARKET HUB logo" className="online-customer-brand-logo" />
            <div className="online-customer-brand-copy">
              <p className="online-customer-eyebrow">PM MARKET HUB</p>
              <p className="online-customer-address">{branchAddress}</p>
              <h1>Online Customers Information</h1>
              <p className="online-customer-subtitle">
                Review customer records, search accounts, and open a profile for updates.
              </p>
            </div>
          </div>
        </div>

        <div className="online-customer-header-actions">
          <button type="button" className="header-icon-button" aria-label="Search customers">
            <FaSearch />
          </button>
          <button
            type="button"
            className="header-icon-button close"
            aria-label="Close customer information"
            onClick={() => window.history.back()}
          >
            <FaTimes />
          </button>
        </div>
      </header>

      {apiError && <div className="customer-info-alert">{apiError}</div>}

      <section className="customer-stats-grid">
        {stats.map((stat) => (
          <article key={stat.label} className="customer-stat-card">
            <div className="customer-stat-icon">{stat.icon}</div>
            <div>
              <p className="customer-stat-label">{stat.label}</p>
              <h2 className="customer-stat-value">{stat.value}</h2>
            </div>
          </article>
        ))}
      </section>

      <section className="customer-table-card">
        <div className="customer-table-toolbar">
          <div>
            <p className="customer-table-eyebrow">Directory</p>
            <h2 className="customer-table-title">Customer records</h2>
          </div>

          <div className="customer-search-panel">
            <label htmlFor="online-customer-search">Search customer</label>
            <div className="customer-search-input-wrap">
              <FaSearch className="customer-search-icon" />
              <input
                id="online-customer-search"
                type="text"
                className="customer-search-input"
                placeholder="Name, email, or account number"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="customer-table-summary">
          <p>
            {searchTerm
              ? `Found ${filteredCustomers.length} matching customer${
                  filteredCustomers.length === 1 ? "" : "s"
                } on this page.`
              : `Showing ${showingFrom}-${showingTo} of ${totalItems} customers.`}
          </p>
          {searchTerm && (
            <button type="button" className="clear-search-button" onClick={() => setSearchTerm("")}>
              Clear search
            </button>
          )}
        </div>

        <div className="customer-table-scroll">
          <table className="customer-table">
            <thead>
              <tr>
                <th>S/N</th>
                <th>Name</th>
                <th>Email Address</th>
                <th>Gender</th>
                <th>Account No.</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7">
                    <div className="customer-table-state">Loading online customers...</div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="customer-table-state">
                      {searchTerm
                        ? `No online customers found for "${searchTerm}".`
                        : "No online customers found."}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, index) => {
                  const fullName = `${customer.firstName || ""} ${customer.surname || ""}`.trim() || "N/A";
                  const status = getStatusDetails(customer);

                  return (
                    <tr key={customer.id}>
                      <td>{currentPage * PAGE_SIZE + index + 1}</td>
                      <td>
                        <div className="customer-name-cell">
                          <span className="customer-avatar">{fullName.charAt(0)}</span>
                          <div>
                            <p>{fullName}</p>
                            <span>{customer.customerType || "ONLINE"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="customer-email-cell">{customer.email || "N/A"}</td>
                      <td>{normalizeGender(customer.gender)}</td>
                      <td className="customer-account-cell">{customer.accountNumber || "N/A"}</td>
                      <td>
                        <span className={status.className}>{status.label}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="edit-customer-button"
                          onClick={() => handleEditClick(customer.id, customer)}
                        >
                          <FaEdit />
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalPages > 1 && (
          <div className="customer-pagination">
            <p className="customer-pagination-meta">
              Page {currentPage + 1} of {totalPages}
            </p>

            <div className="customer-pagination-controls">
              <button
                type="button"
                className="pagination-button"
                disabled={currentPage === 0}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                <FaChevronLeft />
                Previous
              </button>

              <div className="pagination-number-group">
                {paginationNumbers.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    className={`pagination-number ${pageNumber === currentPage ? "active" : ""}`}
                    onClick={() => handlePageChange(pageNumber)}
                  >
                    {pageNumber + 1}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="pagination-button"
                disabled={currentPage === totalPages - 1}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next
                <FaChevronRight />
              </button>
            </div>
          </div>
        )}
      </section>

      <EditCustomerInfoModal
        isOpen={showEditModal}
        customerId={selectedCustomerId}
        customerData={selectedCustomerData}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCustomerData(null);
        }}
        onUpdateSuccess={() => {
          fetchOnlineCustomers(currentPage);
        }}
      />
    </div>
  );
};

export default CustomerInfo;
