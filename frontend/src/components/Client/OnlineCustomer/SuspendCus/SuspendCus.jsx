import React, { useEffect, useMemo, useState } from "react";
import "./SupCus.css";
import { apiRequest } from "../../../../lib/config";
import pmLogo from "../../../../assets/images/PMlogo.png";

const SuspendCus = ({ toggleSupCusModal }) => {
  const [activeTab, setActiveTab] = useState("suspend");
  const [loading, setLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [allOnlineCustomers, setAllOnlineCustomers] = useState([]);
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
    toggleSupCusModal();
  };

  const fetchAllOnlineCustomers = async () => {
    try {
      setLoadingCustomers(true);
      setError("");

      const response = await apiRequest("/admin/customers/online/report?size=500", "GET", null, true);

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

      setAllOnlineCustomers(customersList);
    } catch (err) {
      setError(err?.message || "Failed to load online customers.");
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    fetchAllOnlineCustomers();
  }, []);

  const currentForm = useMemo(() => {
    return activeTab === "suspend" ? suspendForm : unblockForm;
  }, [activeTab, suspendForm, unblockForm]);

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const resetSelectedCustomer = () => {
    setSelectedCustomer(null);
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    resetSelectedCustomer();
    resetMessages();
  };

  const applyFoundCustomer = (customer, isSuspendTab) => {
    const normalized = {
      ...customer,
      id: customer.id || customer.customerId,
      firstName: customer.firstName || customer.firstname || customer.givenName || "",
      surname: customer.surname || customer.lastName || customer.lastname || "",
      accountNumber: customer.accountNumber || customer.accountNo || customer.account || "",
      passportUrl:
        customer.passportUrl ||
        customer.passport ||
        customer.imageUrl ||
        customer.profileImageUrl ||
        "",
    };

    setSelectedCustomer(normalized);

    const name = `${normalized.firstName} ${normalized.surname}`.trim();

    if (isSuspendTab) {
      setSuspendForm((prev) => ({
        ...prev,
        accountNumber: normalized.accountNumber || prev.accountNumber,
        name,
      }));
    } else {
      setUnblockForm((prev) => ({
        ...prev,
        accountNumber: normalized.accountNumber || prev.accountNumber,
        name,
      }));
    }
  };

  const searchCustomerByAccount = async (queryValue, isSuspendTab = true) => {
    const query = String(queryValue || "").trim().toLowerCase();

    if (!query) {
      resetSelectedCustomer();
      if (isSuspendTab) {
        setSuspendForm((prev) => ({ ...prev, name: "" }));
      } else {
        setUnblockForm((prev) => ({ ...prev, name: "" }));
      }
      setLoadingSearch(false);
      return;
    }

    resetMessages();
    setLoadingSearch(true);

    const found = allOnlineCustomers.find((customer) => {
      const account = String(
        customer?.accountNumber || customer?.accountNo || customer?.account || ""
      ).toLowerCase();
      const name = `${customer?.firstName || customer?.firstname || ""} ${
        customer?.surname || customer?.lastName || customer?.lastname || ""
      }`
        .trim()
        .toLowerCase();

      return account === query || account.includes(query) || name.includes(query);
    });

    if (found) {
      applyFoundCustomer(found, isSuspendTab);
      setLoadingSearch(false);
      return;
    }

    try {
      const response = await apiRequest(`/admin/customers/search?query=${encodeURIComponent(queryValue)}`, "GET");

      // BaseResponse wraps a Spring Page, so rows live under response.response.content.
      const rows =
        (Array.isArray(response) && response) ||
        response?.response?.content ||
        response?.data?.content ||
        response?.content ||
        (Array.isArray(response?.response) ? response.response : null) ||
        (Array.isArray(response?.data) ? response.data : null) ||
        [];
      const list = Array.isArray(rows) ? rows : [];

      // Prefer an exact account-number match over the first result.
      const result =
        list.find(
          (customer) =>
            String(
              customer?.accountNumber || customer?.accountNo || customer?.account || ""
            ).toLowerCase() === query
        ) || list[0] || null;

      if (!result) {
        resetSelectedCustomer();
        setError("No online customer found for this account number.");
      } else {
        applyFoundCustomer(result, isSuspendTab);
      }
    } catch (err) {
      resetSelectedCustomer();
      setError(err?.message || "Unable to search for customer.");
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSuspendChange = (event) => {
    const { name, value } = event.target;
    setSuspendForm((prev) => ({ ...prev, [name]: value }));

    if (name === "accountNumber") {
      searchCustomerByAccount(value, true);
    }
  };

  const handleUnblockChange = (event) => {
    const { name, value } = event.target;
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

  const handleSuspendSubmit = async (event) => {
    event.preventDefault();
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
          `/admin/suspend-customer/${customerId}`,
          `/admin/customers/online/suspend/${customerId}`,
          `/admin/customers/online/${customerId}/suspend`,
        ],
        "PUT",
        payload
      );

      setSuccess("Customer blocked successfully.");
      setSelectedCustomer((prev) => (prev ? { ...prev, suspended: true } : prev));
      await fetchAllOnlineCustomers();
    } catch (err) {
      setError(err?.message || "Failed to block customer.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockSubmit = async (event) => {
    event.preventDefault();
    resetMessages();

    if (!selectedCustomer) {
      setError("Search and select a customer first.");
      return;
    }

    if (!unblockForm.reasonForUnblocking || unblockForm.reasonForUnblocking.trim().length < 10) {
      setError("Reason for unblocking must be at least 10 characters.");
      return;
    }

    if (selectedCustomer?.suspended !== true) {
      setError("This customer is not currently blocked.");
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
          `/admin/unblock-customer/${customerId}`,
          `/admin/customers/online/unblock/${customerId}`,
          `/admin/customers/online/${customerId}/unblock`,
        ],
        "PUT",
        payload
      );

      setSuccess("Customer unblocked successfully.");
      setSelectedCustomer((prev) => (prev ? { ...prev, suspended: false } : prev));
      await fetchAllOnlineCustomers();
    } catch (err) {
      setError(err?.message || "Failed to unblock customer.");
    } finally {
      setLoading(false);
    }
  };

  const imageUrl = selectedCustomer?.passportUrl || "";

  return (
    <div className="online-suspend-container">
      <div className="online-suspend-header">
        <div className="online-suspend-brand-header">
          <div className="online-suspend-brand-left">
            <img src={pmLogo} alt="PM Logo" className="online-suspend-brand-logo" />
            <div className="online-suspend-brand-text">
              <p className="online-suspend-brand-name">PM MARKET HUB</p>
              <h2 className="online-suspend-brand-title">
                {activeTab === "suspend" ? "BLOCK ONLINE CUSTOMER FORM" : "UNBLOCK ONLINE CUSTOMER FORM"}
              </h2>
            </div>
          </div>
        </div>
        <button onClick={closeModal} className="online-suspend-close-btn" disabled={loading}>
          x
        </button>
      </div>

      {error && (
        <div className="online-suspend-error">
          <span className="online-suspend-message-icon">!</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="online-suspend-success">
          <span className="online-suspend-message-icon">i</span>
          <span>{success}</span>
        </div>
      )}

      <div className="online-suspend-tabs">
        <button
          className={`online-suspend-tab ${activeTab === "suspend" ? "active" : ""}`}
          onClick={() => handleTabSwitch("suspend")}
          disabled={loading}
        >
          Block Online Customer
        </button>
        <button
          className={`online-suspend-tab ${activeTab === "unblock" ? "active" : ""}`}
          onClick={() => handleTabSwitch("unblock")}
          disabled={loading}
        >
          Unblock Online Customer
        </button>
      </div>

      <div className="online-suspend-scrollable">
        {loadingCustomers && <div className="online-suspend-hint">Loading online customer data...</div>}

        <div className="online-suspend-content">
          <div className="online-suspend-toolbar">
            <div>
              <p className="online-suspend-section-label">Customer Lookup</p>
              <h3 className="online-suspend-section-title">
                {activeTab === "suspend" ? "Prepare block request" : "Prepare unblock request"}
              </h3>
            </div>
            <div className={`online-suspend-badge ${selectedCustomer?.suspended ? "blocked" : "active"}`}>
              {selectedCustomer ? (selectedCustomer?.suspended ? "Blocked" : "Active") : "No customer selected"}
            </div>
          </div>

          <p className="online-suspend-hint">
            {activeTab === "suspend"
              ? "Enter an account number to find an online customer, review the profile card, then provide the block reason."
              : "Enter an account number for a blocked online customer, confirm the profile, then provide the unblock reason."}
          </p>

          {activeTab === "suspend" && (
            <form onSubmit={handleSuspendSubmit} className="online-suspend-form">
              <div className="online-suspend-row">
                <div className="online-suspend-group">
                  <label className="online-suspend-label">Account Number *</label>
                  <input
                    type="text"
                    name="accountNumber"
                    className="online-suspend-input"
                    value={suspendForm.accountNumber}
                    onChange={handleSuspendChange}
                    required
                    disabled={loading}
                    placeholder="Type account number..."
                  />
                  {loadingSearch && <small className="online-suspend-hint">Searching...</small>}
                </div>
                <div className="online-suspend-group">
                  <label className="online-suspend-label">Customer Name *</label>
                  <input
                    type="text"
                    className="online-suspend-input"
                    value={suspendForm.name}
                    disabled
                    readOnly
                    placeholder="Customer name will appear here"
                  />
                </div>
                <div className="online-suspend-group">
                  <label className="online-suspend-label">Profile Photo</label>
                  <div className="online-suspend-passport">
                    {imageUrl ? (
                      <img src={imageUrl} alt="Customer" className="online-suspend-photo" />
                    ) : (
                      <span>{selectedCustomer ? "No image" : "Search customer first"}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="online-suspend-row-full">
                <div className="online-suspend-group-full">
                  <label className="online-suspend-label">Reason for Blocking *</label>
                  <textarea
                    name="reasonForSuspension"
                    className="online-suspend-textarea"
                    rows="5"
                    value={suspendForm.reasonForSuspension}
                    onChange={handleSuspendChange}
                    required
                    disabled={loading || !selectedCustomer}
                    minLength="10"
                    placeholder="Provide a clear reason for blocking this customer account."
                  ></textarea>
                </div>
              </div>

              <div className="online-suspend-actions">
                <button type="button" onClick={closeModal} className="online-suspend-btn-cancel" disabled={loading}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="online-suspend-btn online-suspend-btn-danger"
                  disabled={loading || !selectedCustomer || suspendForm.reasonForSuspension.trim().length < 10}
                >
                  {loading ? "Blocking..." : "Block Customer"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "unblock" && (
            <form onSubmit={handleUnblockSubmit} className="online-suspend-form">
              <div className="online-suspend-row">
                <div className="online-suspend-group">
                  <label className="online-suspend-label">Account Number *</label>
                  <input
                    type="text"
                    name="accountNumber"
                    className="online-suspend-input"
                    value={unblockForm.accountNumber}
                    onChange={handleUnblockChange}
                    required
                    disabled={loading}
                    placeholder="Type account number..."
                  />
                  {loadingSearch && <small className="online-suspend-hint">Searching...</small>}
                </div>
                <div className="online-suspend-group">
                  <label className="online-suspend-label">Customer Name *</label>
                  <input
                    type="text"
                    className="online-suspend-input"
                    value={unblockForm.name}
                    disabled
                    readOnly
                    placeholder="Customer name will appear here"
                  />
                </div>
                <div className="online-suspend-group">
                  <label className="online-suspend-label">Profile Photo</label>
                  <div className="online-suspend-passport">
                    {imageUrl ? (
                      <img src={imageUrl} alt="Customer" className="online-suspend-photo" />
                    ) : (
                      <span>{selectedCustomer ? "No image" : "Search customer first"}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="online-suspend-row-full">
                <div className="online-suspend-group-full">
                  <label className="online-suspend-label">Reason for Unblocking *</label>
                  <textarea
                    name="reasonForUnblocking"
                    className="online-suspend-textarea"
                    rows="5"
                    value={unblockForm.reasonForUnblocking}
                    onChange={handleUnblockChange}
                    required
                    disabled={loading || !selectedCustomer}
                    minLength="10"
                    placeholder="Provide a clear reason for unblocking this customer account."
                  ></textarea>
                </div>
              </div>

              <div className="online-suspend-actions">
                <button type="button" onClick={closeModal} className="online-suspend-btn-cancel" disabled={loading}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="online-suspend-btn online-suspend-btn-success"
                  disabled={
                    loading ||
                    !selectedCustomer ||
                    unblockForm.reasonForUnblocking.trim().length < 10 ||
                    selectedCustomer?.suspended !== true
                  }
                >
                  {loading ? "Unblocking..." : "Unblock Customer"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuspendCus;
