import React, { useEffect, useState } from "react";
import "../../../Styles/CashierStand/BalanceEnquiry/Balance.css";
import { Link } from "react-router-dom";
import { cashierApi } from "../../../lib/cashierApi";
import CashierBackButton from "../CashierBackButton";

const formatDateForQuery = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const Balance = ({ toggleBalanceModal }) => {
  const [showLedgerSection, setShowLedgerSection] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [balanceInfo, setBalanceInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ledgerError, setLedgerError] = useState("");
  const [ledgerInfo, setLedgerInfo] = useState("");
  const [ledgerRows, setLedgerRows] = useState([]);
  const [debugLedger, setDebugLedger] = useState(null);
  const [debugProfile, setDebugProfile] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [customerDirectory, setCustomerDirectory] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCustomerAccountNumber, setSelectedCustomerAccountNumber] =
    useState("");
  const [ledgerFilters, setLedgerFilters] = useState(() => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      startDate: formatDateForQuery(monthStart),
      endDate: formatDateForQuery(today),
    };
  });

  const closeModal = () => {
    toggleBalanceModal();
  };

  const formatCurrency = (value, zeroIfEmpty = false) => {
    if (value === undefined || value === null || value === "") {
      return zeroIfEmpty ? "₦0.00" : "-";
    }

    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
      return zeroIfEmpty ? "₦0.00" : "-";
    }

    return `₦${numericValue.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const toNumber = (value) => {
    if (value === undefined || value === null || value === "") {
      return null;
    }

    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }

    const cleaned = value
      .toString()
      .replace(/[^0-9.-]/g, "")
      .trim();

    if (!cleaned || cleaned === "-" || cleaned === "." || cleaned === "-.") {
      return null;
    }

    const numericValue = Number(cleaned);
    return Number.isFinite(numericValue) ? numericValue : null;
  };

  const getFirstNumber = (item, keys) => {
    for (const key of keys) {
      const parsed = toNumber(item?.[key]);
      if (parsed !== null) return parsed;
    }
    return null;
  };

  const inferDebitCreditFromAmount = (item) => {
    const amount = getFirstNumber(item, [
      "amount",
      "transactionAmount",
      "value",
      "totalAmount",
    ]);

    const typeText = `${item?.transactionType || item?.type || item?.entryType || item?.description || ""}`
      .toLowerCase()
      .replace(/[_-]/g, " ");

    if (amount === null) {
      return { debit: null, credit: null };
    }

    if (
      typeText.includes("credit") ||
      typeText.includes("deposit") ||
      typeText.includes("payment in") ||
      typeText.includes("cash in")
    ) {
      return { debit: null, credit: Math.abs(amount) };
    }

    if (
      typeText.includes("debit") ||
      typeText.includes("withdraw") ||
      typeText.includes("deduct") ||
      typeText.includes("deduction") ||
      typeText.includes("loan given") ||
      typeText.includes("loan disburse") ||
      typeText.includes("disbursement")
    ) {
      return { debit: Math.abs(amount), credit: null };
    }

    if (amount < 0) {
      return { debit: Math.abs(amount), credit: null };
    }

    return { debit: null, credit: amount };
  };

  const getFirstDateValue = (item, keys) => {
    for (const key of keys) {
      const value = item?.[key];
      if (value) return value;
    }
    return null;
  };

  const normalizeLedgerRow = (item, index) => {
    if (!item || typeof item !== "object") return null;

    const dateRaw = getFirstDateValue(item, [
      "date",
      "transactionDate",
      "entryDate",
      "createdAt",
      "postingDate",
      "valueDate",
      "transDate",
    ]);

    const description =
      item.description ||
      item.narration ||
      item.remark ||
      item.transactionType ||
      item.type ||
      item.channel ||
      "-";

    const inferred = inferDebitCreditFromAmount(item);
    const debitValue =
      getFirstNumber(item, [
        "debit",
        "debitAmount",
        "amountDebit",
        "drAmount",
        "withdrawalAmount",
        "deductionAmount",
        "loanGivenAmount",
        "loanDisbursedAmount",
        "loanDisbursementAmount",
        "debit_value",
      ]) ?? inferred.debit;

    const creditValue =
      getFirstNumber(item, [
        "credit",
        "creditAmount",
        "amountCredit",
        "crAmount",
        "depositAmount",
        "repaymentAmount",
        "credit_value",
      ]) ?? inferred.credit;

    const balanceValue = getFirstNumber(item, [
      "balance",
      "runningBalance",
      "totalBalance",
      "closingBalance",
      "newBalance",
      "availableBalance",
      "ledgerBalance",
    ]);

    return {
      _rowId: item.id || item.transactionId || `${dateRaw || "row"}-${index}`,
      _dateRaw: dateRaw,
      _description: description,
      _debit: debitValue,
      _credit: creditValue,
      _balance: balanceValue,
      _raw: item,
    };
  };

  const buildSummaryRowsFromProfile = (profile) => {
    if (!profile || typeof profile !== "object") return [];

    const keyEntries = Object.entries(profile);
    const rows = [];
    const today = new Date().toISOString();

    const makeRow = (description, debit = null, credit = null, balance = null) => ({
      id: `summary-${description}`,
      transactionDate: today,
      description,
      debitAmount: debit,
      creditAmount: credit,
      runningBalance: balance,
    });

    const firstLoan = getFirstNumber(profile, [
      "loanGivenAmount",
      "loanDisbursedAmount",
      "loanDisbursementAmount",
      "principalLoanBalance",
      "loanBalance",
      "principalBalance",
    ]);

    if (firstLoan !== null && firstLoan > 0) {
      rows.push(makeRow("Loan Given / Principal", Math.abs(firstLoan), null, firstLoan));
    }

    const walletBalance = getFirstNumber(profile, [
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
    ]);

    if (walletBalance !== null) {
      rows.push(makeRow("Wallet Balance", null, Math.max(walletBalance, 0), walletBalance));
    }

    const interestValue = getFirstNumber(profile, [
      "loanAccruedInterest",
      "interestBalance",
      "accruedInterest",
    ]);
    if (interestValue !== null && interestValue > 0) {
      rows.push(makeRow("Loan Accrued Interest", Math.abs(interestValue), null));
    }

    const depositKeys = keyEntries.filter(([key]) =>
      /deposit|credit|paymentIn|cashIn/i.test(key),
    );
    depositKeys.forEach(([key, value]) => {
      const amount = toNumber(value);
      if (amount !== null && amount !== 0) {
        rows.push(
          makeRow(
            key
              .replace(/([a-z])([A-Z])/g, "$1 $2")
              .replace(/_/g, " "),
            null,
            Math.abs(amount),
          ),
        );
      }
    });

    const deductionKeys = keyEntries.filter(([key]) =>
      /deduct|debit|withdraw|loanGiven|loanDisbursed|disbursement/i.test(key),
    );
    deductionKeys.forEach(([key, value]) => {
      const amount = toNumber(value);
      if (amount !== null && amount !== 0) {
        rows.push(
          makeRow(
            key
              .replace(/([a-z])([A-Z])/g, "$1 $2")
              .replace(/_/g, " "),
            Math.abs(amount),
            null,
          ),
        );
      }
    });

    const seen = new Set();
    return rows.filter((row) => {
      const signature = `${row.description}-${row.debitAmount}-${row.creditAmount}`;
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    });
  };

  const flattenObjectArrays = (value, depth = 0) => {
    if (!value || depth > 4) return [];

    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value !== "object") {
      return [];
    }

    const prioritizedKeys = [
      "ledger",
      "ledgerEntries",
      "ledgerTransactions",
      "transactions",
      "transactionHistory",
      "history",
      "entries",
      "content",
      "records",
      "items",
      "data",
      "response",
    ];

    for (const key of prioritizedKeys) {
      const next = value?.[key];
      if (Array.isArray(next)) return next;
      const fromNested = flattenObjectArrays(next, depth + 1);
      if (fromNested.length > 0) return fromNested;
    }

    for (const nested of Object.values(value)) {
      const fromNested = flattenObjectArrays(nested, depth + 1);
      if (fromNested.length > 0) return fromNested;
    }

    return [];
  };

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoadingCustomers(true);
        const customers = await cashierApi.getCustomerDirectory();
        setCustomerDirectory(customers || []);
      } catch (err) {
        console.error("BalanceEnquiry: Failed to load customer directory", err);
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);


  const suggestions =
    accountName.trim().length === 0
      ? []
      : customerDirectory
          .filter((item) => {
            const query = accountName.trim().toLowerCase();
            const name = item.customerName != null ? String(item.customerName).toLowerCase() : "";
            const account = item.accountNumber != null ? String(item.accountNumber).toLowerCase() : "";
            return name.includes(query) || account.includes(query);
          })
          .slice(0, 8);

  const normalizeId = (value) => {
    if (value === undefined || value === null || value === "") return "";
    return value.toString().trim();
  };

  const getCustomerIdFromProfile = (profile) =>
    profile?.customerId ||
    profile?.id ||
    profile?.userId ||
    profile?.customer_id ||
    profile?.user_id ||
    null;

  const mergeProfile = (base, incoming) => {
    const nextBase = base || {};
    const nextIncoming = incoming || {};
    return {
      ...nextBase,
      ...nextIncoming,
      customerId:
        nextBase?.customerId ||
        nextBase?.userId ||
        nextBase?.id ||
        nextIncoming?.customerId ||
        nextIncoming?.userId ||
        nextIncoming?.id ||
        null,
      userId:
        nextBase?.userId ||
        nextBase?.customerId ||
        nextBase?.id ||
        nextIncoming?.userId ||
        nextIncoming?.customerId ||
        nextIncoming?.id ||
        null,
    };
  };

  const isNumericLike = (value) => /^\d+$/.test((value || "").toString().trim());

  const getMatchedDirectoryCustomer = (profile) => {
    const normalize = (value) => (value || "").toString().trim().toLowerCase();
    const profileId = profile?.customerId || profile?.id || profile?.userId;
    const profileAccount = normalize(
      profile?.accountNumber || profile?.accountNo || profile?.acctNo,
    );
    const profileName = normalize(
      profile?.customerName || profile?.accountName || profile?.name,
    );

    if (profileId) {
      const byId = customerDirectory.find(
        (item) => normalizeId(item.id) === normalizeId(profileId),
      );
      if (byId) return byId;
    }

    if (selectedCustomerId) {
      const bySelectedId = customerDirectory.find(
        (item) => normalizeId(item.id) === normalizeId(selectedCustomerId),
      );
      if (bySelectedId) return bySelectedId;
    }

    return customerDirectory.find((item) => {
      const account = normalize(item.accountNumber);
      const name = normalize(item.customerName);
      return (
        (profileAccount && account === profileAccount) ||
        (profileName && name === profileName)
      );
    });
  };

  const resolveCustomerIdFromDirectory = (profile, searchValue) => {
    const normalize = (value) => (value || "").toString().trim().toLowerCase();
    const query = normalize(searchValue);
    const profileAccount = normalize(
      profile?.accountNumber || profile?.accountNo || profile?.acctNo,
    );
    const profileName = normalize(profile?.customerName || profile?.accountName);

    const exactMatch = customerDirectory.find((item) => {
      const account = normalize(item.accountNumber);
      const name = normalize(item.customerName);
      return (
        (query && (account === query || name === query)) ||
        (profileAccount && account === profileAccount) ||
        (profileName && name === profileName)
      );
    });

    if (exactMatch?.id) {
      return exactMatch.id;
    }

    if (selectedCustomerId) {
      return selectedCustomerId;
    }

    return null;
  };

  const handleViewReport = async (e) => {
    if (e) e.preventDefault();

    if (!accountName || accountName.trim() === "") {
      setError("Please enter customer name or account number");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (!ledgerFilters.startDate || !ledgerFilters.endDate) {
      setError("Please provide start and end dates");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setLoading(true);
    setError("");
    setLedgerError("");
    setLedgerInfo("");
    setDebugLedger(null);
    setDebugProfile(null);

    try {
      const query = accountName.trim();
      let profileData = {};

      const exactDirectoryMatch = customerDirectory.find((item) => {
        const itemName = (item.customerName || "").toLowerCase();
        const itemAccount = (item.accountNumber || "").toLowerCase();
        const lookup = query.toLowerCase();
        return itemName === lookup || itemAccount === lookup;
      });

      const accountNumberForLookup =
        selectedCustomerAccountNumber ||
        exactDirectoryMatch?.accountNumber ||
        (isNumericLike(query) ? query : "") ||
        "";

      // Run profile lookups in parallel to reduce report startup delay.
      const profileRequests = [
        cashierApi.getBalanceEnquiry(accountNumberForLookup || query),
        accountNumberForLookup || isNumericLike(query)
          ? cashierApi.searchCustomerByAccount(accountNumberForLookup || query)
          : Promise.resolve(null),
      ];

      const [balanceResult, accountResult] = await Promise.allSettled(
        profileRequests,
      );

      if (balanceResult.status === "fulfilled" && balanceResult.value) {
        profileData = mergeProfile(profileData, balanceResult.value);
      }

      if (accountResult.status === "fulfilled" && accountResult.value) {
        profileData = mergeProfile(profileData, accountResult.value);
      }

      if (exactDirectoryMatch) {
        profileData = mergeProfile(profileData, exactDirectoryMatch);
      }

      setBalanceInfo(profileData);
      setDebugProfile(profileData);

      // Also resolve by the account number we actually looked up (handles the case where the user
      // typed a name but the matching account/customer id lives in the directory).
      const accountDirectoryMatch = customerDirectory.find((item) => {
        const itemAccount = (item.accountNumber || "").toLowerCase();
        const lookup = (accountNumberForLookup || "").toLowerCase();
        return lookup && itemAccount === lookup;
      });

      const customerId =
        getCustomerIdFromProfile(profileData) ||
        selectedCustomerId ||
        exactDirectoryMatch?.id ||
        accountDirectoryMatch?.id ||
        resolveCustomerIdFromDirectory(profileData, accountName);

      if (!customerId) {
        // Nothing in the customer directory, the balance-enquiry lookup, or the
        // account search matched this input -- don't open the report shell for
        // a customer that doesn't exist, just say so and stay on the search form.
        setLedgerRows([]);
        setBalanceInfo({});
        setDebugProfile(profileData);
        setDebugLedger({
          source: "id-resolution-failed",
          totalRows: 0,
          sample: [],
          query,
        });
        setShowLedgerSection(false);
        setError(
          `No customer found matching "${query}". Pick a customer from the suggestions list, or check the name/account number.`,
        );
        setTimeout(() => setError(""), 5000);
        return;
      }

      let rows = [];
      let ledgerSource = "none";

      const [cashierSelectedLedger, adminSelectedLedger] = await Promise.allSettled([
        cashierApi.getCustomerLedger({
          customerId,
          startDate: ledgerFilters.startDate,
          endDate: ledgerFilters.endDate,
        }),
        cashierApi.getAdminCustomerLedger({
          userId: customerId,
          startDate: ledgerFilters.startDate,
          endDate: ledgerFilters.endDate,
        }),
      ]);

      const selectedCashierRows =
        cashierSelectedLedger.status === "fulfilled"
          ? cashierSelectedLedger.value || []
          : [];
      const selectedAdminRows =
        adminSelectedLedger.status === "fulfilled"
          ? adminSelectedLedger.value || []
          : [];

      if (selectedCashierRows.length > 0) {
        rows = selectedCashierRows;
        ledgerSource = "ledger-endpoint:selected-range";
      } else if (selectedAdminRows.length > 0) {
        rows = selectedAdminRows;
        ledgerSource = "admin-ledger:selected-range";
        setLedgerInfo("Showing transaction history from admin ledger source.");
      }

      if ((rows || []).length === 0) {
        const today = formatDateForQuery(new Date());

        const [cashierHistoryLedger, adminHistoryLedger] = await Promise.allSettled([
          cashierApi.getCustomerLedger({
            customerId,
            startDate: "2000-01-01",
            endDate: today,
          }),
          cashierApi.getAdminCustomerLedger({
            userId: customerId,
            startDate: "2000-01-01",
            endDate: today,
          }),
        ]);

        const historyCashierRows =
          cashierHistoryLedger.status === "fulfilled"
            ? cashierHistoryLedger.value || []
            : [];
        const historyAdminRows =
          adminHistoryLedger.status === "fulfilled"
            ? adminHistoryLedger.value || []
            : [];

        if (historyCashierRows.length > 0) {
          rows = historyCashierRows;
          ledgerSource = "ledger-endpoint:full-history";
          setLedgerInfo(
            "No entries found in selected dates. Showing full available transaction history.",
          );
        } else if (historyAdminRows.length > 0) {
          rows = historyAdminRows;
          ledgerSource = "admin-ledger:full-history";
          setLedgerInfo(
            "No entries found in selected dates. Showing full transaction history from admin ledger source.",
          );
        }
      }

      if ((rows || []).length === 0) {
        const fallbackRows = flattenObjectArrays(profileData);
        if (fallbackRows.length > 0) {
          rows = fallbackRows;
          ledgerSource = "balance-enquiry-payload:fallback";
          setLedgerInfo(
            "Showing transaction history from balance-enquiry response format.",
          );
        }
      }

      if ((rows || []).length === 0) {
        const summaryRows = buildSummaryRowsFromProfile(profileData);
        if (summaryRows.length > 0) {
          rows = summaryRows;
          ledgerSource = "balance-summary:fallback";
        }
      }

      const normalizedRows = (rows || [])
        .map((item, index) => normalizeLedgerRow(item, index))
        .filter(Boolean);

      setDebugLedger({
        source: ledgerSource,
        totalRows: normalizedRows.length,
        sample: normalizedRows.slice(0, 3).map((row) => row._raw),
      });

      setLedgerRows(normalizedRows);
      setShowLedgerSection(true);
    } catch (err) {
      const message = err.message || "Failed to generate report";
      setLedgerError(message);
      setShowLedgerSection(true);
    } finally {
      setLoading(false);
    }
  };

  const matchedDirectoryCustomer = getMatchedDirectoryCustomer(balanceInfo);
  const rawCustomerName =
    balanceInfo?.customerName || balanceInfo?.accountName || balanceInfo?.name || "";
  const rawAccountNumber =
    balanceInfo?.accountNumber || balanceInfo?.accountNo || balanceInfo?.acctNo || "";

  const displayAccountNumber =
    rawAccountNumber ||
    matchedDirectoryCustomer?.accountNumber ||
    (isNumericLike(rawCustomerName) ? rawCustomerName : "") ||
    (isNumericLike(accountName) ? accountName : "") ||
    "-";

  const displayCustomerName =
    (!isNumericLike(rawCustomerName) && rawCustomerName) ||
    matchedDirectoryCustomer?.customerName ||
    "-";

  const walletBalance =
    getFirstNumber(balanceInfo, [
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
    ]) ??
    getFirstNumber(matchedDirectoryCustomer, [
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
    ]) ??
    0;

  const totals = ledgerRows.reduce(
    (acc, row) => ({
      debit: acc.debit + (Number(row?._debit) || 0),
      credit: acc.credit + (Number(row?._credit) || 0),
    }),
    { debit: 0, credit: 0 },
  );

  return (
    <div className='be-shell'>
      <div className='be-container'>
        <header className='be-header'>
          <div className='be-topbar'>
            <CashierBackButton onClick={closeModal} />
            <Link to='/adminDashboard' className='be-dashboard-link'>
              Dashboard
            </Link>
            <button
              type='button'
              className='adjust-cancel-btn be-close-btn'
              onClick={closeModal}
            >
              X
            </button>
          </div>

          <div className='be-title-wrap'>
            <h1>Ledger Balance Enquiry</h1>
            <p>Enter customer name or account number, pick date range, then generate report</p>
          </div>
        </header>

        {error && (
          <div className='alert alert-danger be-alert' role='alert'>
            {error}
          </div>
        )}

        <section className='be-card'>
          <form onSubmit={handleViewReport}>
            <div className='be-ledger-filters'>
              <div>
                <label className='be-label'>Customer Name / Account No</label>
                <input
                  type='text'
                  name='accountName'
                  autoComplete='off'
                  value={accountName}
                  onChange={(e) => {
                    setAccountName(e.target.value);
                    setSelectedCustomerId(null);
                    setSelectedCustomerAccountNumber("");
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                  className='be-input'
                  placeholder='Type customer name or account no'
                  required
                />
                {showSuggestions && (
                  <div className='be-suggestions'>
                    {loadingCustomers ? (
                      <button type='button' className='be-suggestion-item' disabled>
                        Loading customers...
                      </button>
                    ) : accountName.trim().length === 0 ? (
                      <button type='button' className='be-suggestion-item' disabled>
                        Start typing to search {customerDirectory.length} customers
                      </button>
                    ) : suggestions.length === 0 ? (
                      <button type='button' className='be-suggestion-item' disabled>
                        No matches
                      </button>
                    ) : (
                      suggestions.map((item, index) => (
                        <button
                          key={`${item.id || item.accountNumber || item.customerName}-${index}`}
                          type='button'
                          className='be-suggestion-item'
                          onMouseDown={() => {
                            const selectedValue =
                              item.accountNumber || item.customerName;
                            setAccountName(selectedValue);
                            setSelectedCustomerId(item.id || null);
                            setSelectedCustomerAccountNumber(
                              item.accountNumber || "",
                            );
                            setShowSuggestions(false);
                          }}
                        >
                          <span>{item.customerName || "-"}</span>
                          <small>{item.accountNumber || "No account no"}</small>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className='be-label'>Start Date</label>
                <input
                  type='date'
                  value={ledgerFilters.startDate}
                  onChange={(e) =>
                    setLedgerFilters((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                  className='be-input'
                  required
                />
              </div>

              <div>
                <label className='be-label'>End Date</label>
                <input
                  type='date'
                  value={ledgerFilters.endDate}
                  onChange={(e) =>
                    setLedgerFilters((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                  className='be-input'
                  required
                />
              </div>

              <div className='be-filter-actions'>
                <button type='submit' className='be-primary-btn' disabled={loading}>
                  {loading ? "Generating..." : "View Report"}
                </button>
                <button
                  type='button'
                  className='be-secondary-btn'
                  onClick={() => setShowDebug((prev) => !prev)}
                >
                  {showDebug ? "Hide Debug" : "Show Debug"}
                </button>
              </div>
            </div>
          </form>
        </section>

        {showLedgerSection && (
          <section className='be-card'>
            {ledgerError && (
              <div className='alert alert-danger' role='alert'>
                {ledgerError}
              </div>
            )}
            {ledgerInfo && (
              <div className='alert alert-info' role='alert'>
                {ledgerInfo}
              </div>
            )}

            <div className='be-info-grid'>
              <div className='be-info-col'>
                <h5>BVN: {balanceInfo.bvn || "-"}</h5>
                <h5>
                  Loan Accrued Interest:{" "}
                  {formatCurrency(
                    balanceInfo.loanAccruedInterest ??
                      balanceInfo.interestBalance ??
                      balanceInfo.accruedInterest,
                  )}
                </h5>
                <h5>
                  Principal Loan Balance:{" "}
                  {formatCurrency(
                    balanceInfo.principalLoanBalance ??
                      balanceInfo.principalBalance ??
                      balanceInfo.loanBalance,
                  )}
                </h5>
              </div>

              <div className='be-info-col'>
                <h5>Customer Name: {displayCustomerName}</h5>
                <h5>Account Number: {displayAccountNumber}</h5>
                <h5>Wallet Balance: {formatCurrency(walletBalance, true)}</h5>
                <h5>
                  Interest Balance:{" "}
                  {formatCurrency(
                    balanceInfo.interestBalance ??
                      balanceInfo.loanAccruedInterest ??
                      balanceInfo.accruedInterest,
                  )}
                </h5>
              </div>

              <div className='be-passport-col'>
                <h5>Passport</h5>
                <div className='be-passport-box'>
                  {balanceInfo.passport ? (
                    <img
                      src={balanceInfo.passport}
                      alt='Passport'
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span>No image</span>
                  )}
                </div>
              </div>
            </div>

            <div className='be-table-wrap'>
              <table>
                <thead>
                  <tr>
                    <th>s/n</th>
                    <th>date</th>
                    <th>description</th>
                    <th>debit</th>
                    <th>credit</th>
                    <th>balance</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerRows.length === 0 ? (
                    <tr>
                      <td colSpan='6' className='be-empty-cell'>
                        No ledger entries found for selected period.
                      </td>
                    </tr>
                  ) : (
                    ledgerRows.map((item, index) => {
                      const dateRaw = item._dateRaw || null;
                      const dateText = dateRaw
                        ? new Date(dateRaw).toLocaleDateString("en-GB")
                        : "-";

                      return (
                        <tr key={item._rowId || index}>
                          <td>{index + 1}</td>
                          <td>{dateText}</td>
                          <td>{item._description}</td>
                          <td className='be-debit-value'>
                            {formatCurrency(item._debit, true)}
                          </td>
                          <td>{formatCurrency(item._credit, true)}</td>
                          <td>
                            {formatCurrency(item._balance, true)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                  {ledgerRows.length > 0 && (
                    <tr className='be-total-row'>
                      <td colSpan='3'>Total</td>
                      <td className='be-debit-value'>
                        {formatCurrency(totals.debit, true)}
                      </td>
                      <td>{formatCurrency(totals.credit, true)}</td>
                      <td>{formatCurrency(0, true)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {showDebug && debugProfile && (
              <div className='be-debug'>
                <h5>Debug: Raw Balance Enquiry Payload</h5>
                <pre>{JSON.stringify(debugProfile, null, 2)}</pre>
              </div>
            )}

            {showDebug && debugLedger && (
              <div className='be-debug'>
                <h5>Debug: Ledger Mapping</h5>
                <pre>{JSON.stringify(debugLedger, null, 2)}</pre>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default Balance;
