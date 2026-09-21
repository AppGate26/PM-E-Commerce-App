import React, { useEffect, useMemo, useState } from "react";
import "./WalkInSupCus.css";
import { apiRequest } from "../../../../lib/config";
import pmLogo from "../../../../assets/images/PMlogo.png";

const WalkInSupCus = ({ toggleWalkInSupModal }) => {
  const [activeTab, setActiveTab] = useState("suspend");
  const [loading, setLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [allWalkInCustomers, setAllWalkInCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [suspendForm, setSuspendForm] = useState({
    accountNumber: "",
    name: "",
    reasonForSuspension: "",
  });

  const [unblockForm, setUnblockForm] = useState({
    accountNumber: "",
    name: "",
    reasonForUnblocking: "",
  });

  const closeModal = () => {
    toggleWalkInSupModal();
  };

  const currentForm = useMemo(() => {
    return activeTab === "suspend" ? suspendForm : unblockForm;
  }, [activeTab, suspendForm, unblockForm]);

  const fetchAllWalkInCustomers = async () => {
    try {
      setLoadingCustomers(true);
      setError("");

      const response = await apiRequest("/admin/customers/walk-in/report", "GET");

      let customersList = [];
      if (response?.response?.content && Array.isArray(response.response.content)) {
        customersList = response.response.content;
      } else if (response?.content && Array.isArray(response.content)) {
        customersList = response.content;
      } else if (response?.data && Array.isArray(response.data)) {
        customersList = response.data;
      } else if (Array.isArray(response)) {
        customersList = response;
      }

      setAllWalkInCustomers(customersList);
    } catch (err) {
      setError(err?.message || "Failed to load walk-in customers.");
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    fetchAllWalkInCustomers();
  }, []);

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setSelectedCustomer(null);
    resetMessages();
  };

  const applyFoundCustomer = (customer, isSuspendTab) => {
    setSelectedCustomer(customer);

    const name = `${customer?.firstName || ""} ${customer?.surname || customer?.lastName || ""}`.trim();

    if (isSuspendTab) {
      setSuspendForm((prev) => ({
        ...prev,
        accountNumber: customer?.accountNumber || prev.accountNumber,
        name,
      }));
    } else {
      setUnblockForm((prev) => ({
        ...prev,
        accountNumber: customer?.accountNumber || prev.accountNumber,
        name,
      }));
    }
  };

  const searchCustomerByAccount = (queryValue, isSuspendTab = true) => {
    const query = String(queryValue || "").trim().toLowerCase();

    if (!query) {
      setSelectedCustomer(null);
      if (isSuspendTab) {
        setSuspendForm((prev) => ({ ...prev, name: "" }));
      } else {
        setUnblockForm((prev) => ({ ...prev, name: "" }));
      }
      return;
    }

    setLoadingSearch(true);

    const found = allWalkInCustomers.find((cust) => {
      const acc = String(cust?.accountNumber || "").toLowerCase();
      const name = `${cust?.firstName || ""} ${cust?.surname || cust?.lastName || ""}`.trim().toLowerCase();
      return acc === query || acc.includes(query) || name.includes(query);
    });

    if (!found) {
      setSelectedCustomer(null);
      if (isSuspendTab) {
        setSuspendForm((prev) => ({ ...prev, name: "" }));
      } else {
        setUnblockForm((prev) => ({ ...prev, name: "" }));
      }
      setError("No customer found for this account number.");
      setLoadingSearch(false);
      return;
    }

    applyFoundCustomer(found, isSuspendTab);
    setError("");
    setLoadingSearch(false);
  };

  const handleSuspendChange = (e) => {
    const { name, value } = e.target;
    setSuspendForm((prev) => ({ ...prev, [name]: value }));

    if (name === "accountNumber") {
      searchCustomerByAccount(value, true);
    }
  };

  const handleUnblockChange = (e) => {
    const { name, value } = e.target;
    setUnblockForm((prev) => ({ ...prev, [name]: value }));

    if (name === "accountNumber") {
      searchCustomerByAccount(value, false);
    }
  };

  const callWithFallback = async (paths, method, body) => {
    let lastError = null;

    for (const path of paths) {
      try {
        return await apiRequest(path, method, body);
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error("Request failed");
  };

  const handleSuspendSubmit = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!selectedCustomer) {
      setError("Search and select a customer first.");
      return;
    }

    if (!suspendForm.reasonForSuspension || suspendForm.reasonForSuspension.trim().length < 10) {
      setError("Reason for suspension must be at least 10 characters.");
      return;
    }

    try {
      setLoading(true);

      const customerId = selectedCustomer?.id || selectedCustomer?.customerId;
      const payload = {
        reasonForSuspension: suspendForm.reasonForSuspension.trim(),
      };

      await callWithFallback(
        [
          `/admin/customers/walk-in/suspend/${customerId}`,
          `/admin/customers/walk-in/${customerId}/suspend`,
          `/admin/walk-in-customers/${customerId}/suspend`,
        ],
        "PUT",
        payload
      );

      setSuccess("Customer suspended successfully.");
      setSelectedCustomer((prev) => (prev ? { ...prev, suspended: true } : prev));
      await fetchAllWalkInCustomers();
    } catch (err) {
      setError(err?.message || "Failed to suspend customer.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockSubmit = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!selectedCustomer) {
      setError("Search and select a customer first.");
      return;
    }

    if (!unblockForm.reasonForUnblocking || unblockForm.reasonForUnblocking.trim().length < 10) {
      setError("Reason for unblocking must be at least 10 characters.");
      return;
    }

    try {
      setLoading(true);

      const customerId = selectedCustomer?.id || selectedCustomer?.customerId;
      const payload = {
        reasonForUnblocking: unblockForm.reasonForUnblocking.trim(),
      };

      await callWithFallback(
        [
          `/admin/customers/walk-in/unblock/${customerId}`,
          `/admin/customers/walk-in/${customerId}/unblock`,
          `/admin/walk-in-customers/${customerId}/unblock`,
        ],
        "PUT",
        payload
      );

      setSuccess("Customer unblocked successfully.");
      setSelectedCustomer((prev) => (prev ? { ...prev, suspended: false } : prev));
      await fetchAllWalkInCustomers();
    } catch (err) {
      setError(err?.message || "Failed to unblock customer.");
    } finally {
      setLoading(false);
    }
  };

  const imageUrl =
    selectedCustomer?.passportUrl ||
    selectedCustomer?.imageUrl ||
    selectedCustomer?.profileImageUrl ||
    selectedCustomer?.passport ||
    "";

  return (
    <div className="walkin-suspend-container">
      <div className="walkin-suspend-header">
        <div className="walkin-suspend-brand-header">
          <div className="walkin-suspend-brand-left">
            <img src={pmLogo} alt="PM Logo" className="walkin-suspend-brand-logo" />
            <div className="walkin-suspend-brand-text">
              <p className="walkin-suspend-brand-name">PM MARKET HUB</p>
              <h2 className="walkin-suspend-brand-title">SUSPEND CUSTOMER FORM</h2>
            </div>
          </div>
        </div>
        <button onClick={closeModal} className="walkin-suspend-close-btn" disabled={loading}>
          x
        </button>
      </div>

      {error && (
        <div className="walkin-suspend-error">
          <span className="walkin-suspend-message-icon">!</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="walkin-suspend-success">
          <span className="walkin-suspend-message-icon">?</span>
          <span>{success}</span>
        </div>
      )}

      <div className="walkin-suspend-tabs">
        <button
          className={`walkin-suspend-tab ${activeTab === "suspend" ? "active" : ""}`}
          onClick={() => handleTabSwitch("suspend")}
          disabled={loading}
        >
          SUSPEND WALK-IN CUSTOMER
        </button>
        <button
          className={`walkin-suspend-tab ${activeTab === "unblock" ? "active" : ""}`}
          onClick={() => handleTabSwitch("unblock")}
          disabled={loading}
        >
          UNBLOCK WALK-IN CUSTOMER
        </button>
      </div>

      <div className="walkin-suspend-scrollable">
        {loadingCustomers && <div className="walkin-suspend-hint">Loading customer data...</div>}

        {activeTab === "suspend" && (
          <div className="walkin-suspend-content">
            <p className="walkin-suspend-hint">Enter account number to search for customer. Name and photo auto-fill.</p>
            <form onSubmit={handleSuspendSubmit} className="walkin-suspend-form">
              <div className="walkin-suspend-row">
                <div className="walkin-suspend-group">
                  <label className="walkin-suspend-label">ACCOUNT NUMBER *</label>
                  <input
                    type="text"
                    name="accountNumber"
                    className="walkin-suspend-input"
                    value={suspendForm.accountNumber}
                    onChange={handleSuspendChange}
                    required
                    disabled={loading}
                    placeholder="Type account number..."
                  />
                  {loadingSearch && <small className="walkin-suspend-hint">Searching...</small>}
                </div>
                <div className="walkin-suspend-group">
                  <label className="walkin-suspend-label">CUSTOMER NAME *</label>
                  <input type="text" className="walkin-suspend-input" value={suspendForm.name} disabled readOnly />
                </div>
                <div className="walkin-suspend-group">
                  <label className="walkin-suspend-label">PROFILE PHOTO</label>
                  <div className="walkin-suspend-passport">
                    {imageUrl ? <img src={imageUrl} alt="Customer" className="walkin-suspend-photo" /> : <span>No image</span>}
                  </div>
                </div>
              </div>

              <div className="walkin-suspend-row-full">
                <div className="walkin-suspend-group-full">
                  <label className="walkin-suspend-label">REASON FOR SUSPENSION *</label>
                  <textarea
                    name="reasonForSuspension"
                    className="walkin-suspend-textarea"
                    rows="5"
                    value={suspendForm.reasonForSuspension}
                    onChange={handleSuspendChange}
                    required
                    disabled={loading || !selectedCustomer}
                    minLength="10"
                  ></textarea>
                </div>
              </div>

              <div className="walkin-suspend-actions">
                <button type="button" onClick={closeModal} className="walkin-suspend-btn-cancel" disabled={loading}>
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="walkin-suspend-btn walkin-suspend-btn-danger"
                  disabled={loading || !selectedCustomer || suspendForm.reasonForSuspension.trim().length < 10}
                >
                  {loading ? "SUSPENDING..." : "SUSPEND CUSTOMER"}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === "unblock" && (
          <div className="walkin-suspend-content">
            <p className="walkin-suspend-hint">Enter account number to search suspended customer. Name and photo auto-fill.</p>
            <form onSubmit={handleUnblockSubmit} className="walkin-suspend-form">
              <div className="walkin-suspend-row">
                <div className="walkin-suspend-group">
                  <label className="walkin-suspend-label">ACCOUNT NUMBER *</label>
                  <input
                    type="text"
                    name="accountNumber"
                    className="walkin-suspend-input"
                    value={unblockForm.accountNumber}
                    onChange={handleUnblockChange}
                    required
                    disabled={loading}
                    placeholder="Type account number..."
                  />
                  {loadingSearch && <small className="walkin-suspend-hint">Searching...</small>}
                </div>
                <div className="walkin-suspend-group">
                  <label className="walkin-suspend-label">CUSTOMER NAME *</label>
                  <input type="text" className="walkin-suspend-input" value={unblockForm.name} disabled readOnly />
                </div>
                <div className="walkin-suspend-group">
                  <label className="walkin-suspend-label">PROFILE PHOTO</label>
                  <div className="walkin-suspend-passport">
                    {imageUrl ? <img src={imageUrl} alt="Customer" className="walkin-suspend-photo" /> : <span>No image</span>}
                  </div>
                </div>
              </div>

              <div className="walkin-suspend-row-full">
                <div className="walkin-suspend-group-full">
                  <label className="walkin-suspend-label">REASON FOR UNBLOCK *</label>
                  <textarea
                    name="reasonForUnblocking"
                    className="walkin-suspend-textarea"
                    rows="5"
                    value={unblockForm.reasonForUnblocking}
                    onChange={handleUnblockChange}
                    required
                    disabled={loading || !selectedCustomer}
                    minLength="10"
                  ></textarea>
                </div>
              </div>

              <div className="walkin-suspend-actions">
                <button type="button" onClick={closeModal} className="walkin-suspend-btn-cancel" disabled={loading}>
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="walkin-suspend-btn walkin-suspend-btn-success"
                  disabled={
                    loading ||
                    !selectedCustomer ||
                    unblockForm.reasonForUnblocking.trim().length < 10 ||
                    selectedCustomer?.suspended !== true
                  }
                >
                  {loading ? "UNBLOCKING..." : "UNBLOCK CUSTOMER"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalkInSupCus;
