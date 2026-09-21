import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { CiExport } from "react-icons/ci";
import { IoArrowBack } from "react-icons/io5";
import logo from "../../../../../assets/images/adminLogo.png";
import { getAccountLedger, getAccounts } from "../../../../../lib/accountingApi";
import "../../../Account.css";

const TransactionByAccount = () => {
  const navigate = useNavigate();
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [accounts, setAccounts] = useState([]);
  // The full selected account object is kept in state (not just its id) so the
  // summary cards never have to re-derive it from a lookup — a lookup that can
  // race the account list finishing its own load.
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [codeFilter, setCodeFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loadingLedger, setLoadingLedger] = useState(false);
  const [ledgerRows, setLedgerRows] = useState([]);
  const [ledgerTotals, setLedgerTotals] = useState({ debit: 0, credit: 0 });

  useEffect(() => {
    let active = true;

    const loadAccounts = async () => {
      try {
        setLoadingAccounts(true);
        const accountData = await getAccounts({ activeOnly: true });
        if (active) {
          setAccounts(accountData);
        }
      } catch (error) {
        console.error("Failed to load accounts:", error);
        if (active) {
          setAccounts([]);
        }
      } finally {
        if (active) {
          setLoadingAccounts(false);
        }
      }
    };

    loadAccounts();
    return () => {
      active = false;
    };
  }, []);

  const accountOptions = useMemo(() => {
    // Match transactions by the account's backend DB id (journal lines reference
    // account.id), but display the human GL code (e.g. 1020101). The two must be
    // tracked separately or selecting an account shows no history.
    return accounts
      .filter((account) => account.code || account.name)
      .map((account) => ({
        // `id` is unique (used as the React key and for selection); `accountId` is
        // the real ledger Account.id and is only set when one actually exists —
        // never fall back to a synthetic id here, it would let the ledger call
        // silently hit an unrelated account.
        id: String(account.id || account.accountId || account.code || "").trim(),
        accountId: account.accountId || null,
        code: String(account.code || "").trim(),
        name: String(account.name || "").trim(),
      }))
      .sort((left, right) => `${left.code} ${left.name}`.localeCompare(`${right.code} ${right.name}`));
  }, [accounts]);

  useEffect(() => {
    if (!selectedAccount && accountOptions.length > 0) {
      // Prefer an account that can actually show history over the first one
      // alphabetically, which may have no linked ledger account at all.
      setSelectedAccount(accountOptions.find((option) => option.accountId) || accountOptions[0]);
    }
  }, [accountOptions, selectedAccount]);

  const visibleAccountOptions = useMemo(() => {
    const normalizedCode = codeFilter.trim().toLowerCase();
    const normalizedName = nameFilter.trim().toLowerCase();

    return accountOptions.filter((option) => {
      const matchesCode = !normalizedCode || option.code.toLowerCase().includes(normalizedCode);
      const matchesName = !normalizedName || option.name.toLowerCase().includes(normalizedName);
      return matchesCode && matchesName;
    });
  }, [accountOptions, codeFilter, nameFilter]);

  useEffect(() => {
    let active = true;

    if (!selectedAccount?.accountId) {
      setLedgerRows([]);
      setLedgerTotals({ debit: 0, credit: 0 });
      return () => {
        active = false;
      };
    }

    const loadLedger = async () => {
      try {
        setLoadingLedger(true);
        const data = await getAccountLedger(selectedAccount.accountId, { startDate, endDate });
        if (active) {
          setLedgerRows(data.transactions);
          setLedgerTotals({ debit: data.totalDebit, credit: data.totalCredit });
        }
      } catch (error) {
        console.error("Failed to load account ledger:", error);
        if (active) {
          setLedgerRows([]);
          setLedgerTotals({ debit: 0, credit: 0 });
        }
      } finally {
        if (active) {
          setLoadingLedger(false);
        }
      }
    };

    loadLedger();
    return () => {
      active = false;
    };
  }, [selectedAccount, startDate, endDate]);

  const movement = ledgerTotals.debit - ledgerTotals.credit;

  const handleExport = () => {
    if (ledgerRows.length === 0) return;
    const data = ledgerRows.map((row, index) => ({
      "S/N": index + 1,
      DATE: row.transactionDate || "",
      "REF NO": row.referenceNo || "",
      SOURCE: (row.sourceType || "").replaceAll("_", " "),
      "CUSTOMER / GL NAME": row.customerName || row.accountName || "",
      DESCRIPTION: row.description || "",
      DEBIT: row.debit,
      CREDIT: row.credit,
      USER: row.user || "",
      "APPROVED BY": row.approvedBy || "",
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Account History");
    XLSX.writeFile(workbook, `transaction-by-account-${selectedAccount?.code || "export"}.xlsx`);
  };

  return (
    <div className="journal-page">
      <nav className="bg-primary d-flex align-items-center justify-content-between px-5">
        <Link to="/adminDashboard">
          <img src={logo} alt="pm logo" className="logo-acc" />
        </Link>
        <div className="d-flex">
          <div className="dropdown-center acc-dropdown-link">
            <button
              className="btn text-white dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              JOURNAL
            </button>
            <ul className="dropdown-menu">
              <li>
                <Link to="/Accounting/JournalEntry" className="text-decoration-none text-dark">
                  Journal Entry
                </Link>
              </li>
              <li>
                <Link to="/Accounting/JournalEdit" className="text-decoration-none text-dark">
                  Journal Edit
                </Link>
              </li>
            </ul>
          </div>
          <div className="dropdown-center acc-dropdown-link">
            <button
              className="btn text-white dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              TRANSFERS
            </button>
            <ul className="dropdown-menu">
              <li>
                <Link to="/Accounting/FundTransfers" className="text-decoration-none text-dark">
                  Fund transfers
                </Link>
              </li>
              <li>
                <Link to="/Accounting/TransactionView" className="text-decoration-none text-dark">
                  Transaction View
                </Link>
              </li>
              <li>
                <Link to="/Accounting/TransactionByAccount" className="text-decoration-none text-dark">
                  Transaction by Account
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <Link to="/">
          <button className="Log_Out-btn cl-log-out" id="Log_Out-btn-sm">
            Log Out
          </button>
        </Link>
      </nav>

      <div className="container-fluid mt-4 journal-container">
        <div className="journal-standard-shell">
          <div className="journal-header-card">
            <div className="d-flex align-items-center gap-3">
              <button
                type="button"
                className="acc-type-back-btn"
                onClick={() => navigate("/Accounting/TransactionView")}
                aria-label="Go back to transaction view"
              >
                <IoArrowBack size={20} />
              </button>
              <div>
                <h2 className="journal-page-title">Transaction by Account</h2>
                <p className="journal-page-subtitle">
                  Review the history of a backend general-ledger account, including every reference, narration, customer or GL name, and debit-credit movement.
                </p>
              </div>
            </div>
            <div className="journal-header-badge">GL History</div>
          </div>

          <div className="journal-summary-grid">
            <div className="journal-summary-card">
              <span>Selected Account</span>
              <strong>{selectedAccount?.code || "N/A"}</strong>
            </div>
            <div className="journal-summary-card">
              <span>Account Name</span>
              <strong className="transaction-card-title">{selectedAccount?.name || "No account selected"}</strong>
            </div>
            <div className="journal-summary-card">
              <span>Total Debit</span>
              <strong>{ledgerTotals.debit.toFixed(2)}</strong>
            </div>
            <div className="journal-summary-card">
              <span>Total Credit</span>
              <strong>{ledgerTotals.credit.toFixed(2)}</strong>
            </div>
          </div>

          <div className="journal-form-shell">
            <div className="journal-section-title-row">
              <div>
                <h3>Account Filters</h3>
                <p>Choose an account code and date range to display its ledger history.</p>
              </div>
            </div>

            <div className="transaction-account-layout">
              <div className="transaction-account-sidebar">
                <h4 className="sidebar-title">Select Account</h4>
                <div className="transaction-account-filters">
                  <input
                    type="text"
                    className="form-control border-primary-subtle"
                    placeholder="Search by account code"
                    autoComplete="off"
                    value={codeFilter}
                    onChange={(event) => setCodeFilter(event.target.value)}
                  />
                  <input
                    type="text"
                    className="form-control border-primary-subtle"
                    placeholder="Search by account name"
                    autoComplete="off"
                    value={nameFilter}
                    onChange={(event) => setNameFilter(event.target.value)}
                  />
                </div>

                <div className="transaction-account-list">
                  {loadingAccounts ? (
                    <div className="transaction-account-empty">Loading accounts...</div>
                  ) : (
                    <>
                      {visibleAccountOptions.map((option) => (
                        <button
                          key={option.id || option.code || option.name}
                          type="button"
                          className={`transaction-account-item ${selectedAccount?.id === option.id ? "active" : ""}`}
                          onClick={() => setSelectedAccount(option)}
                        >
                          <strong>{option.code || "NO CODE"}</strong>
                          <span>{option.name || "Unnamed GL account"}</span>
                        </button>
                      ))}
                      {visibleAccountOptions.length === 0 && (
                        <div className="transaction-account-empty">No accounts match the current search.</div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="transaction-account-main">
                <div className="transaction-filters-section">
                  <h4 className="filters-title">Date Range</h4>
                  <div className="transaction-date-row">
                    <div className="transaction-search-group">
                      <label className="fw-bold text-primary">Start Date</label>
                      <input
                        type="date"
                        className="form-control border-primary-subtle"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                      />
                    </div>
                    <div className="transaction-search-group">
                      <label className="fw-bold text-primary">End Date</label>
                      <input
                        type="date"
                        className="form-control border-primary-subtle"
                        value={endDate}
                        onChange={(event) => setEndDate(event.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2 journal-export-btn mt-auto"
                      onClick={handleExport}
                      disabled={ledgerRows.length === 0}
                    >
                      Export to excel <CiExport size={20} />
                    </button>
                  </div>
                </div>

                <div className="transaction-account-hero">
                  <h3>{selectedAccount?.name || "Transaction by Account"}</h3>
                  <p>
                    Ledger history for <strong>{selectedAccount?.code || "selected account"}</strong>. Every row below shows the reference, narration, customer or GL label, user trail, and posting movement for this account.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="journal-ledger-shell">
            <div className="journal-section-title-row journal-section-title-row-tight">
              <div>
                <h3>Account History</h3>
                <p>Detailed postings for the selected general-ledger account.</p>
              </div>
            </div>

            <div className="table-responsive acc-type-container-table mb-3 journal-table-wrap" style={{ height: "420px" }}>
              <table className="table table-striped table-hover journal-entry-table">
                <thead className="bg-primary text-white">
                  <tr>
                    <th className="bg-primary text-white">DATE</th>
                    <th className="bg-primary text-white">REF. NO</th>
                    <th className="bg-primary text-white">SOURCE</th>
                    <th className="bg-primary text-white">CUSTOMER / GL NAME</th>
                    <th className="bg-primary text-white">DESCRIPTION</th>
                    <th className="bg-primary text-white text-end">DEBIT</th>
                    <th className="bg-primary text-white text-end">CREDIT</th>
                    <th className="bg-primary text-white">USER</th>
                    <th className="bg-primary text-white">APPROVED BY</th>
                  </tr>
                </thead>
                <tbody>
                  {!selectedAccount ? (
                    <tr>
                      <td colSpan="9" className="text-center fw-semibold py-4">
                        Select an account to view its history.
                      </td>
                    </tr>
                  ) : !selectedAccount.accountId ? (
                    <tr>
                      <td colSpan="9" className="text-center fw-semibold py-4">
                        This GL code has no linked ledger account yet, so it has never received a
                        posting. Ask an admin to link {selectedAccount.code} to a ledger account.
                      </td>
                    </tr>
                  ) : loadingLedger ? (
                    <tr>
                      <td colSpan="9" className="text-center fw-semibold py-4">
                        Loading account history...
                      </td>
                    </tr>
                  ) : ledgerRows.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center fw-semibold py-4">
                        No transactions found for the selected account and date range.
                      </td>
                    </tr>
                  ) : (
                    ledgerRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.transactionDate || "-"}</td>
                        <td>{row.referenceNo || "-"}</td>
                        <td>{(row.sourceType || "").replaceAll("_", " ") || "-"}</td>
                        <td>{row.customerName || row.accountName || "-"}</td>
                        <td>{row.description || "-"}</td>
                        <td className="text-end">{Number(row.debit).toFixed(2)}</td>
                        <td className="text-end">{Number(row.credit).toFixed(2)}</td>
                        <td>{row.user || "-"}</td>
                        <td>{row.approvedBy || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="position-sticky bottom-0">
                  <tr className="bg-primary text-white">
                    <td colSpan="5" className="bg-primary text-white fw-bold ps-4">
                      TOTALS
                    </td>
                    <td className="bg-primary text-white text-end fw-bold">
                      {ledgerTotals.debit.toFixed(2)}
                    </td>
                    <td className="bg-primary text-white text-end fw-bold">
                      {ledgerTotals.credit.toFixed(2)}
                    </td>
                    <td colSpan="2" className="bg-primary text-white"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="journal-footer-row">
              <div className="transaction-footnote">
                This view follows a single GL account and shows its full journal-posting trail.
              </div>
              <div className="journal-balance-box">
                <label className="fw-bold text-primary">MOVEMENT</label>
                <input
                  type="text"
                  className="form-control border-primary-subtle text-end"
                  value={movement.toFixed(2)}
                  disabled
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionByAccount;
