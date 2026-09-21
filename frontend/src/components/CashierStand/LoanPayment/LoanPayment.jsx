import { useEffect, useMemo, useState } from "react";
import BranchBadge from "../../shared/BranchBadge";
import "../../../Styles/CashierStand/loanPayment/LoanPayment.css";
import { Link } from "react-router-dom";
import { cashierApi } from "../../../lib/cashierApi";
import CashierBackButton from "../CashierBackButton";

// Cashier "Payment" page: funds a selected customer's wallet via Paystack hosted checkout.
// User can choose to pay by card or bank transfer on Paystack's page.
// Loan repayment was removed from this screen per the wallet-funding redesign.
const LoanPayment = ({ toggleLPayModal, selectedAccountNumber = "" }) => {
  const [walletFunding, setWalletFunding] = useState({
    accountNumber: "",
    amount: "",
    fundingMethod: "",
    enteredBy: "",
    description: "",
  });
  const [walletCustomerData, setWalletCustomerData] = useState(null);
  const [searchingWalletCustomer, setSearchingWalletCustomer] = useState(false);
  const [customerDirectoryOptions, setCustomerDirectoryOptions] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [filteredCustomerOptions, setFilteredCustomerOptions] = useState([]);

  const [walletFundingLoading, setWalletFundingLoading] = useState(false);
  const [walletFundingMessage, setWalletFundingMessage] = useState("");
  const [error, setError] = useState("");

  const closeModal = () => {
    toggleLPayModal();
  };

  const handleWalletFundingChange = (e) => {
    const { name, value } = e.target;
    setWalletFunding((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  const parseAmount = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  };

  const formatMoney = (value) =>
    parseAmount(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const getWalletBalance = (item) => {
    const walletKeys = [
      "walletBalance",
      "wallet_balance",
      "wallet",
      "balance",
      "availableBalance",
      "available_balance",
      "mainBalance",
      "currentBalance",
      "customerBalance",
      "depositBalance",
      "totalWalletBalance",
    ];

    for (const key of walletKeys) {
      const value = item?.[key];
      if (value !== undefined && value !== null && value !== "") {
        return parseAmount(value);
      }
    }

    return null;
  };

  // Load the customer directory once so the wallet search field can offer a typeahead.
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const directory = await cashierApi.getCustomerDirectory();
        setCustomerDirectoryOptions(directory || []);
      } catch (fetchError) {
        console.error("Payment: failed to load customer directory", fetchError);
        setCustomerDirectoryOptions([]);
      }
    };

    fetchCustomers();
  }, []);

  // Prefill the search box when the page is opened for a specific account.
  useEffect(() => {
    if (selectedAccountNumber) {
      setWalletFunding((prev) => ({
        ...prev,
        accountNumber: prev.accountNumber || selectedAccountNumber,
      }));
    }
  }, [selectedAccountNumber]);

  const walletAccountNumber =
    walletCustomerData?.accountNumber ||
    walletCustomerData?.accountNo ||
    walletFunding.accountNumber ||
    "";

  const walletCustomerName =
    walletCustomerData?.customerName ||
    walletCustomerData?.accountName ||
    walletCustomerData?.name ||
    "";

  const walletCustomerEmail =
    walletCustomerData?.email ||
    walletCustomerData?.customerEmail ||
    walletCustomerData?.emailAddress ||
    "";

  // Wallet balance is intentionally not surfaced in the customer display (QA #11):
  // the cashier sees the wallet number, not the balance. getWalletBalance is still
  // used after a successful funding to report the new balance in the toast message.

  const numericCustomerId = useMemo(() => {
    const id = Number(
      walletCustomerData?.id ??
        walletCustomerData?.customerId ??
        walletCustomerData?.userId,
    );
    return Number.isFinite(id) && id > 0 ? id : null;
  }, [walletCustomerData]);

  const walletSearchSuggestions = useMemo(() => {
    const searchText = walletFunding.accountNumber.trim().toLowerCase();
    const seen = new Set();

    return (customerDirectoryOptions || [])
      .filter((customer) => {
        const accountNumber = String(customer?.accountNumber || "").toLowerCase();
        const customerName = String(customer?.customerName || "").toLowerCase();
        if (!searchText) return true;
        return accountNumber.includes(searchText) || customerName.includes(searchText);
      })
      .slice(0, 20)
      .flatMap((customer) => {
        const accountNumber = String(customer?.accountNumber || "").trim();
        const customerName = String(customer?.customerName || "").trim();
        const options = [];

        if (accountNumber && !seen.has(`account-${accountNumber}`)) {
          seen.add(`account-${accountNumber}`);
          options.push({
            key: `account-${accountNumber}`,
            value: accountNumber,
            label: customerName ? `${customerName} - ${accountNumber}` : accountNumber,
          });
        }

        if (customerName && !seen.has(`name-${customerName.toLowerCase()}`)) {
          seen.add(`name-${customerName.toLowerCase()}`);
          options.push({
            key: `name-${customerName.toLowerCase()}`,
            value: customerName,
            label: accountNumber ? `${accountNumber} - ${customerName}` : customerName,
          });
        }

        return options;
      });
  }, [customerDirectoryOptions, walletFunding.accountNumber]);



  const handleCustomerInputChange = (e) => {
    const value = e.target.value;
    setWalletFunding((prev) => ({
      ...prev,
      accountNumber: value,
    }));

    // Show dropdown with filtered options as user types
    if (value.trim()) {
      const searchLower = value.toLowerCase();
      const filtered = (customerDirectoryOptions || []).filter((customer) => {
        const accountNumber = String(customer?.accountNumber || "").toLowerCase();
        const customerName = String(customer?.customerName || "").toLowerCase();
        return accountNumber.includes(searchLower) || customerName.includes(searchLower);
      });
      setFilteredCustomerOptions(filtered);
      setShowCustomerDropdown(true);
    } else {
      setShowCustomerDropdown(false);
      setFilteredCustomerOptions([]);
    }
  };

  const handleSelectCustomerFromDropdown = (customer) => {
    setWalletCustomerData(customer);
    setWalletFunding((prev) => ({
      ...prev,
      accountNumber: customer?.accountNumber || customer?.accountNo || "",
    }));
    setShowCustomerDropdown(false);
    setFilteredCustomerOptions([]);
    setError("");
    setWalletFundingMessage("");
  };

  const handleSearchWalletCustomer = async () => {
    const searchValue = walletFunding.accountNumber?.trim();
    if (!searchValue) {
      setError("Enter customer name or account number before searching");
      setTimeout(() => setError(""), 4000);
      return;
    }

    try {
      setSearchingWalletCustomer(true);
      setError("");
      setWalletFundingMessage("");
      setShowCustomerDropdown(false);

      // First try to find the customer in the directory
      const searchLower = searchValue.toLowerCase();
      const foundInDirectory = (customerDirectoryOptions || []).find((customer) => {
        const accountNumber = String(customer?.accountNumber || "").toLowerCase();
        const customerName = String(customer?.customerName || "").toLowerCase();
        return accountNumber === searchLower || customerName === searchLower;
      });

      if (foundInDirectory) {
        setWalletCustomerData(foundInDirectory);
        return;
      }

      // Fall back to API search if not found in directory
      const response = await cashierApi.searchCustomerByAccount(searchValue);
      setWalletCustomerData(response || null);
      if (!response) {
        setError("No customer information found for this search");
        setTimeout(() => setError(""), 4000);
      }
    } catch (err) {
      setWalletCustomerData(null);
      setError(err.message || "Unable to load customer information");
      setTimeout(() => setError(""), 5000);
    } finally {
      setSearchingWalletCustomer(false);
    }
  };

  const handleClearCustomer = () => {
    setWalletCustomerData(null);
    setWalletFunding((prev) => ({
      ...prev,
      accountNumber: "",
    }));
    setShowCustomerDropdown(false);
    setFilteredCustomerOptions([]);
  };


  const validateAndStartPayment = (method) => {
    setError("");
    setWalletFundingMessage("");

    if (!walletAccountNumber) {
      setError("Search and select a customer before funding");
      setTimeout(() => setError(""), 4000);
      return false;
    }
    if (parseAmount(walletFunding.amount) <= 0) {
      setError("Enter a valid funding amount");
      setTimeout(() => setError(""), 4000);
      return false;
    }
    if (!walletFunding.enteredBy.trim()) {
      setError("Enter the cashier name");
      setTimeout(() => setError(""), 4000);
      return false;
    }
    if (!walletFunding.description.trim()) {
      setError("Enter a funding note");
      setTimeout(() => setError(""), 4000);
      return false;
    }
    return true;
  };

  const selectCardMethod = async () => {
    if (!validateAndStartPayment("CARD")) return;

    setWalletFunding((prev) => ({
      ...prev,
      fundingMethod: "CARD",
    }));

    try {
      setWalletFundingLoading(true);
      await initializePaystackHostedCheckout("CARD");
    } catch (err) {
      setError(err.message || "Could not start Paystack payment. Please try again.");
      setTimeout(() => setError(""), 5000);
      setWalletFunding((prev) => ({
        ...prev,
        fundingMethod: "",
      }));
    } finally {
      setWalletFundingLoading(false);
    }
  };

  const selectBankTransferMethod = async () => {
    if (!validateAndStartPayment("BANK_TRANSFER")) return;

    setWalletFunding((prev) => ({
      ...prev,
      fundingMethod: "BANK_TRANSFER",
    }));

    try {
      setWalletFundingLoading(true);
      await initializePaystackHostedCheckout("BANK_TRANSFER");
    } catch (err) {
      setError(err.message || "Could not start Paystack payment. Please try again.");
      setTimeout(() => setError(""), 5000);
      setWalletFunding((prev) => ({
        ...prev,
        fundingMethod: "",
      }));
    } finally {
      setWalletFundingLoading(false);
    }
  };

  // The FUND WALLET button is enabled once the cashier has selected a customer, chosen a
  // method, and filled amount + entered-by + note (and, for CARD, picked a company card).
  const canInitiatePayment =
    !!walletAccountNumber &&
    parseAmount(walletFunding.amount) > 0 &&
    !!walletFunding.enteredBy.trim() &&
    !!walletFunding.description.trim();

  // Initialize Paystack hosted checkout. Supports both card and bank transfer payment methods.
  // User selects payment method on Paystack's hosted page.
  const initializePaystackHostedCheckout = async (paymentChannel) => {
    const callbackUrl = `${window.location.origin}/cashier/payment/callback`;
    const requestBody = {
      accountNumber: walletAccountNumber,
      customerName: walletCustomerName,
      amount: parseAmount(walletFunding.amount),
      email: walletCustomerEmail,
      enteredBy: walletFunding.enteredBy.trim(),
      description: walletFunding.description.trim(),
      paymentChannel: paymentChannel, // "CARD" or "BANK_TRANSFER"
      callbackUrl,
    };
    if (numericCustomerId) {
      requestBody.customerId = numericCustomerId;
    }

    // Call backend to initialize Paystack hosted checkout
    const response = await cashierApi.initializePaystackCheckout(requestBody);
    const authorizationUrl =
      response?.authorizationUrl ||
      response?.authorization_url ||
      response?.checkoutUrl ||
      response?.checkout_url ||
      response?.data?.authorizationUrl ||
      response?.data?.authorization_url ||
      response?.data?.checkoutUrl ||
      response?.data?.checkout_url;

    if (!authorizationUrl) {
      throw new Error(
        response?.message || "Could not start Paystack payment. Please try again.",
      );
    }

    // Redirect to Paystack hosted checkout
    window.location.assign(authorizationUrl);
  };

  return (
    <div className='lp-shell'>
      <div className='lp-container'>
        <header className='lp-header'>
          <div className='lp-topbar'>
            <CashierBackButton onClick={closeModal} />
            <Link to='/adminDashboard' className='lp-dashboard-link'>
              Dashboard
            </Link>
            <button
              type='button'
              className='adjust-cancel-btn lp-close-btn'
              onClick={closeModal}
            >
              X
            </button>
          </div>

          <div className='lp-title-wrap'>
            <h1>Payment</h1>
            <div style={{ display: "flex", justifyContent: "center", margin: "0.4rem 0" }}>
              <BranchBadge />
            </div>
            <p>Fund a customer&apos;s wallet via Paystack (card or bank transfer)</p>
          </div>
        </header>

        {error && (
          <div className='alert alert-danger' role='alert'>
            {error}
          </div>
        )}

        <div className='lp-grid'>
          <section className='lp-card lp-wallet-card'>
            <div className='lp-wallet-head'>
              <div className='lp-wallet-title-block'>
                <span className='lp-wallet-kicker'>Wallet Funding</span>
                <h3 className='lp-card-title'>Fund Walk-in Wallet</h3>
                <p>
                  Credit the selected customer wallet through a company card or Paystack
                  bank transfer.
                </p>
              </div>
            </div>

            {walletFundingMessage && (
              <div className='alert alert-success lp-wallet-alert' role='alert'>
                {walletFundingMessage}
              </div>
            )}

            <div className='lp-wallet-quick-summary'>
              <span>
                Wallet Number: <strong>{walletAccountNumber || "Search customer first"}</strong>
              </span>
              <span className='lp-wallet-badge'>Paystack Wallet</span>
            </div>

            <div className='lp-wallet-grid'>
              <div className='lp-wallet-form-stack'>
                <div className='lp-wallet-panel'>
                  <div className='lp-wallet-panel-head'>
                    <span>1</span>
                    <div>
                      <h4>Customer Information</h4>
                      <p>Search with customer name or account number before funding.</p>
                    </div>
                  </div>
                  {!walletCustomerData ? (
                    <div>
                      <label className='lp-label'>Search Customer</label>
                      <div style={{ position: "relative", marginBottom: "16px" }}>
                        <div className='lp-wallet-search-row'>
                          <input
                            type='text'
                            value={walletFunding.accountNumber}
                            onChange={handleCustomerInputChange}
                            onFocus={() => walletFunding.accountNumber && setShowCustomerDropdown(true)}
                            className='lp-input'
                            placeholder='Enter customer name or account number'
                            autoComplete='off'
                          />
                          <button
                            type='button'
                            className='lp-search-btn'
                            onClick={handleSearchWalletCustomer}
                            disabled={searchingWalletCustomer || !walletFunding.accountNumber}
                          >
                            {searchingWalletCustomer ? "Searching..." : "Search"}
                          </button>
                        </div>

                        {showCustomerDropdown && filteredCustomerOptions.length > 0 && (
                          <div
                            style={{
                              position: "absolute",
                              top: "100%",
                              left: 0,
                              right: 0,
                              backgroundColor: "#fff",
                              border: "1px solid #ddd",
                              borderRadius: "6px",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                              zIndex: 1000,
                              maxHeight: "300px",
                              overflowY: "auto",
                              marginTop: "4px",
                            }}
                          >
                            {filteredCustomerOptions.map((customer, idx) => (
                              <div
                                key={`${customer.id}-${idx}`}
                                onClick={() => handleSelectCustomerFromDropdown(customer)}
                                style={{
                                  padding: "12px 16px",
                                  borderBottom: "1px solid #f0f0f0",
                                  cursor: "pointer",
                                  transition: "background-color 0.2s",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.backgroundColor = "#f5f5f5")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.backgroundColor = "transparent")
                                }
                              >
                                <div style={{ fontWeight: "600", color: "#2c3e50" }}>
                                  {customer?.accountNumber || customer?.accountNo}
                                </div>
                                <div style={{ fontSize: "0.9rem", color: "#666" }}>
                                  {customer?.customerName || customer?.accountName}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className='lp-customer-selected-card'>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <h5 style={{ margin: 0, fontSize: "1rem", fontWeight: "600", color: "#2c3e50" }}>
                          ✓ Customer Selected
                        </h5>
                        <button
                          type='button'
                          onClick={handleClearCustomer}
                          style={{
                            padding: "6px 12px",
                            fontSize: "0.85rem",
                            border: "1px solid #007bff",
                            backgroundColor: "transparent",
                            color: "#007bff",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: "500",
                          }}
                        >
                          Change Customer
                        </button>
                      </div>
                      <div
                        style={{
                          backgroundColor: "#f8f9fa",
                          border: "1px solid #dee2e6",
                          borderRadius: "6px",
                          padding: "12px",
                        }}
                      >
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                          <div>
                            <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "4px" }}>
                              Account Number
                            </div>
                            <div style={{ fontWeight: "600", color: "#2c3e50" }}>
                              {walletAccountNumber}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "4px" }}>
                              Customer Name
                            </div>
                            <div style={{ fontWeight: "600", color: "#2c3e50" }}>
                              {walletCustomerName}
                            </div>
                          </div>
                          {walletCustomerEmail && (
                            <div>
                              <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "4px" }}>
                                Email
                              </div>
                              <div style={{ fontWeight: "500", color: "#555" }}>
                                {walletCustomerEmail}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className='lp-wallet-panel'>
                  <div className='lp-wallet-panel-head'>
                    <span>2</span>
                    <div>
                      <h4>Funding Details</h4>
                      <p>Choose payment channel and enter the amount to credit.</p>
                    </div>
                  </div>

                  <label className='lp-label'>Funding Method</label>
                  <div className='lp-wallet-methods'>
                    <button
                      type='button'
                      className={`lp-method-btn ${
                        walletFunding.fundingMethod === "CARD" ? "active" : ""
                      }`}
                      onClick={selectCardMethod}
                      disabled={walletFundingLoading || !canInitiatePayment}
                      title={!canInitiatePayment ? "Fill all required fields to pay with card" : ""}
                    >
                      {walletFundingLoading && walletFunding.fundingMethod === "CARD"
                        ? "OPENING PAYSTACK..."
                        : "Card"}
                    </button>
                    <button
                      type='button'
                      className={`lp-method-btn ${
                        walletFunding.fundingMethod === "BANK_TRANSFER" ? "active" : ""
                      }`}
                      onClick={selectBankTransferMethod}
                      disabled={walletFundingLoading || !canInitiatePayment}
                      title={!canInitiatePayment ? "Fill all required fields to pay with bank transfer" : ""}
                    >
                      {walletFundingLoading && walletFunding.fundingMethod === "BANK_TRANSFER"
                        ? "OPENING PAYSTACK..."
                        : "Bank Transfer"}
                    </button>
                  </div>

                  {walletFunding.fundingMethod && (
                    <div className='lp-wallet-note'>
                      Click "{walletFunding.fundingMethod === "CARD" ? "Card" : "Bank Transfer"}" above
                      to open Paystack and complete the payment. The customer wallet is credited
                      automatically once payment succeeds.
                    </div>
                  )}

                  <div className='lp-wallet-field-grid'>
                    <div>
                      <label className='lp-label'>Amount To Fund</label>
                      <input
                        type='number'
                        name='amount'
                        value={walletFunding.amount}
                        onChange={handleWalletFundingChange}
                        className='lp-input'
                        step='0.01'
                        min='0'
                        placeholder='0.00'
                      />
                    </div>
                    <div>
                      <label className='lp-label'>Entered By</label>
                      <input
                        type='text'
                        name='enteredBy'
                        value={walletFunding.enteredBy}
                        onChange={handleWalletFundingChange}
                        className='lp-input'
                        placeholder='Cashier name'
                      />
                    </div>
                  </div>

                  <label className='lp-label'>Funding Note</label>
                  <textarea
                    name='description'
                    value={walletFunding.description}
                    onChange={handleWalletFundingChange}
                    className='lp-textarea'
                    rows='3'
                    placeholder='Enter a funding note'
                  />
                </div>
              </div>

              <aside className='lp-wallet-summary'>
                <div className='lp-wallet-summary-head'>
                  <span>Review</span>
                  <strong>Wallet Credit</strong>
                </div>
                <div className='lp-wallet-summary-row'>
                  <span>Wallet Number</span>
                  <strong>{walletAccountNumber || "No wallet customer selected"}</strong>
                </div>
                <div className='lp-wallet-summary-row'>
                  <span>Customer</span>
                  <strong>{walletCustomerName || "No customer selected"}</strong>
                </div>
                <div className='lp-wallet-summary-row'>
                  <span>Funding Amount</span>
                  <strong>NGN {formatMoney(walletFunding.amount)}</strong>
                </div>
                <div className='lp-wallet-summary-row'>
                  <span>Funding Method</span>
                  <strong>
                    {walletFunding.fundingMethod === "CARD"
                      ? "Card (via Paystack)"
                      : walletFunding.fundingMethod === "BANK_TRANSFER"
                        ? "Bank Transfer (via Paystack)"
                        : "Select a method above"}
                  </strong>
                </div>
                <div className='lp-wallet-note'>
                  This funds the selected customer wallet only. Payment is processed through Paystack.
                </div>
              </aside>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
};

export default LoanPayment;
