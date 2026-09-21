import React, { useEffect, useMemo, useState } from "react";
import {
  FaEdit,
  FaSearch,
  FaTimes,
  FaUserCheck,
  FaUserClock,
  FaUserSlash,
  FaUsers,
} from "react-icons/fa";
import "./WalkInCustomerInfo.css";
import EditWalkInCustomerInfoModal from "../EditWalkInCustomerInfo/EditWalkInCustomerInfoModal";
import { apiRequest } from "../../../../lib/config";

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
      className: "walkin-status-pill suspended",
    };
  }

  const status = (customer.status || "").toLowerCase();
  if (status === "pending" || status === "inactive") {
    return {
      label: customer.status || "Pending",
      className: "walkin-status-pill pending",
    };
  }

  return {
    label: customer.status || "Active",
    className: "walkin-status-pill active",
  };
};

const WalkInCustomerInfo = ({ onClose }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCustomerData, setSelectedCustomerData] = useState(null);
  const [error, setError] = useState("");

  const fetchWalkInCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiRequest("/admin/customers/walk-in/report", "GET");

      let customersList = [];

      if (response?.response?.content && Array.isArray(response.response.content)) {
        customersList = response.response.content;
      } else if (Array.isArray(response)) {
        customersList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        customersList = response.data;
      } else if (response?.content && Array.isArray(response.content)) {
        customersList = response.content;
      }

      setCustomers(customersList);
    } catch (err) {
      console.error("Error fetching walk-in customers:", err);
      setError("Failed to load walk-in customers. Please try again.");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalkInCustomers();
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
      { label: "Total Customers", value: customers.length, icon: <FaUsers /> },
      { label: "Active", value: active, icon: <FaUserCheck /> },
      { label: "Pending", value: pending, icon: <FaUserClock /> },
      { label: "Suspended", value: suspended, icon: <FaUserSlash /> },
    ];
  }, [customers]);

  const handleEditClick = (customerId, customerData) => {
    setSelectedCustomerId(customerId);
    setSelectedCustomerData(customerData || null);
    setShowEditModal(true);
  };

  const handleClose = () => {
    if (onClose) onClose();
  };

  return (
    <div className="walkin-customer-info-standard">
      <header className="walkin-customer-header">
        <div className="walkin-customer-branding">
          <p className="walkin-customer-eyebrow">Customer Management</p>
          <h1>Walk-In Customers Information</h1>
          <p className="walkin-customer-subtitle">
            Search registered walk-in customers, review account details, and open records for edits.
          </p>
        </div>

        <div className="walkin-customer-header-actions">
          <button type="button" className="walkin-header-icon-button" aria-label="Search customers">
            <FaSearch />
          </button>
          <button
            type="button"
            className="walkin-header-icon-button close"
            aria-label="Close customer information"
            onClick={handleClose}
          >
            <FaTimes />
          </button>
        </div>
      </header>

      {error && <div className="walkin-customer-alert">{error}</div>}

      <section className="walkin-stats-grid">
        {stats.map((stat) => (
          <article key={stat.label} className="walkin-stat-card">
            <div className="walkin-stat-icon">{stat.icon}</div>
            <div>
              <p className="walkin-stat-label">{stat.label}</p>
              <h2 className="walkin-stat-value">{stat.value}</h2>
            </div>
          </article>
        ))}
      </section>

      <section className="walkin-table-card">
        <div className="walkin-table-toolbar">
          <div>
            <p className="walkin-table-eyebrow">Directory</p>
            <h2 className="walkin-table-title">Customer records</h2>
          </div>

          <div className="walkin-search-panel">
            <label htmlFor="walkin-customer-search">Search customer</label>
            <div className="walkin-search-input-wrap">
              <FaSearch className="walkin-search-icon" />
              <input
                id="walkin-customer-search"
                type="text"
                className="walkin-search-input"
                placeholder="Name, email, or account number"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="walkin-table-summary">
          <p>
            {searchTerm
              ? `Found ${filteredCustomers.length} matching customer${
                  filteredCustomers.length === 1 ? "" : "s"
                }.`
              : `Showing ${filteredCustomers.length} of ${customers.length} customers.`}
          </p>
          {searchTerm && (
            <button type="button" className="walkin-clear-search-button" onClick={() => setSearchTerm("")}>
              Clear search
            </button>
          )}
        </div>

        <div className="walkin-table-scroll">
          <table className="walkin-customer-table">
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
                    <div className="walkin-table-state">Loading walk-in customers...</div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="walkin-table-state">
                      {searchTerm
                        ? `No walk-in customers found for "${searchTerm}".`
                        : "No walk-in customers found."}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, index) => {
                  const fullName = `${customer.firstName || ""} ${customer.surname || ""}`.trim() || "N/A";
                  const status = getStatusDetails(customer);

                  return (
                    <tr key={customer.id || index}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="walkin-name-cell">
                          <span className="walkin-avatar">{fullName.charAt(0)}</span>
                          <div>
                            <p>{fullName}</p>
                            <span>{customer.customerType || "WALK-IN"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="walkin-email-cell">{customer.email || "N/A"}</td>
                      <td>{normalizeGender(customer.gender)}</td>
                      <td className="walkin-account-cell">{customer.accountNumber || "N/A"}</td>
                      <td>
                        <span className={status.className}>{status.label}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="walkin-edit-button"
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
      </section>

      <EditWalkInCustomerInfoModal
        isOpen={showEditModal}
        customerId={selectedCustomerId}
        customerData={selectedCustomerData}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCustomerData(null);
        }}
        onUpdateSuccess={() => {
          setShowEditModal(false);
          setSelectedCustomerData(null);
          fetchWalkInCustomers();
        }}
      />
    </div>
  );
};

export default WalkInCustomerInfo;
