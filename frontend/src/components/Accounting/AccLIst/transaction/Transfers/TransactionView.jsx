import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CiExport } from "react-icons/ci";
import { IoArrowBack } from "react-icons/io5";
import logo from "../../../../../assets/images/adminLogo.png";
import { getAccountingTransactions } from "../../../../../lib/accountingApi";
import "../../../Account.css";

const TransactionView = () => {
  const navigate = useNavigate();
  const [loadingRows, setLoadingRows] = useState(true);
  const [rows, setRows] = useState([]);
  const [ledgerType, setLedgerType] = useState("customer");
  const [referenceSearch, setReferenceSearch] = useState("");
  const [searchMode, setSearchMode] = useState("like");

  useEffect(() => {
    let active = true;

    const loadTransactions = async () => {
      try {
        setLoadingRows(true);
        const data = await getAccountingTransactions();
        if (active) {
          setRows(data);
        }
      } catch (error) {
        console.error("Failed to load accounting transactions:", error);
        if (active) {
          setRows([]);
        }
      } finally {
        if (active) {
          setLoadingRows(false);
        }
      }
    };

    loadTransactions();
    return () => {
      active = false;
    };
  }, []);

  const filteredRows = useMemo(() => {
    const normalizedRef = referenceSearch.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesLedgerType =
        ledgerType === "general"
          ? Boolean(row.accountId || row.accountName)
          : Boolean(row.customerName || row.accountName);

      if (!matchesLedgerType) {
        return false;
      }

      if (!normalizedRef) {
        return true;
      }

      const referenceValue = (row.referenceNo || "").toLowerCase();
      return searchMode === "exact"
        ? referenceValue === normalizedRef
        : referenceValue.includes(normalizedRef);
    });
  }, [rows, ledgerType, referenceSearch, searchMode]);

  const totals = useMemo(
    () =>
      filteredRows.reduce(
        (acc, row) => {
          acc.debit += Number(row.debit || 0);
          acc.credit += Number(row.credit || 0);
          return acc;
        },
        { debit: 0, credit: 0 }
      ),
    [filteredRows]
  );

  const balance = totals.debit - totals.credit;

  // For a searched reference, surface exactly which GL account was debited and
  // which was credited (ACCOUNT #2). Derived from the affected-account rows.
  const glBreakdown = useMemo(() => {
    if (!referenceSearch.trim()) return null;
    const dedupe = (list) => [...new Set(list.filter(Boolean))];
    const debited = dedupe(
      filteredRows
        .filter((row) => Number(row.debit || 0) > 0)
        .map((row) => row.affectedAccount || row.accountName)
    );
    const credited = dedupe(
      filteredRows
        .filter((row) => Number(row.credit || 0) > 0)
        .map((row) => row.affectedAccount || row.accountName)
    );
    if (debited.length === 0 && credited.length === 0) return null;
    return { debited, credited };
  }, [filteredRows, referenceSearch]);

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
                onClick={() => navigate("/Accounting/Transaction")}
                aria-label="Go back to transaction"
              >
                <IoArrowBack size={20} />
              </button>
              <div>
                <h2 className="journal-page-title">Transaction View</h2>
                <p className="journal-page-subtitle">
                  Review generated references, affected general-ledger accounts, customer or GL names, posting dates, and approval trail in one standard workspace.
                </p>
              </div>
            </div>
            <div className="journal-header-badge">Accounting Listing</div>
          </div>

          <div className="journal-summary-grid">
            <div className="journal-summary-card">
              <span>Transactions</span>
              <strong>{filteredRows.length}</strong>
            </div>
            <div className="journal-summary-card">
              <span>Total Debit</span>
              <strong>{totals.debit.toFixed(2)}</strong>
            </div>
            <div className="journal-summary-card">
              <span>Total Credit</span>
              <strong>{totals.credit.toFixed(2)}</strong>
            </div>
            <div className="journal-summary-card">
              <span>Balance</span>
              <strong>{balance.toFixed(2)}</strong>
            </div>
          </div>

          <div className="journal-form-shell">
            <div className="journal-section-title-row">
              <div>
                <h3>Reference Filters</h3>
                <p>Search by reference number and switch between customer-focused and general-ledger-focused listings.</p>
              </div>
            </div>

            <div className="transaction-filter-shell">
              <div className="transaction-ledger-toggle">
                <label className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="ledgerType"
                    checked={ledgerType === "general"}
                    onChange={() => setLedgerType("general")}
                  />
                  <span className="form-check-label">General ledger</span>
                </label>
                <label className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="ledgerType"
                    checked={ledgerType === "customer"}
                    onChange={() => setLedgerType("customer")}
                  />
                  <span className="form-check-label">Customer&apos;s ledger</span>
                </label>
              </div>

              <div className="transaction-search-row">
                <div className="transaction-search-group">
                  <label className="fw-bold text-primary">Reference Number</label>
                  <input
                    type="text"
                    className="form-control border-primary-subtle"
                    value={referenceSearch}
                    onChange={(event) => setReferenceSearch(event.target.value)}
                    placeholder="Enter transaction reference"
                  />
                </div>
                <div className="transaction-search-actions">
                  <button
                    className={`btn ${searchMode === "like" ? "btn-primary" : "btn-outline-primary"} fw-bold`}
                    type="button"
                    onClick={() => setSearchMode("like")}
                  >
                    Display Like
                  </button>
                  <button
                    className={`btn ${searchMode === "exact" ? "btn-primary" : "btn-outline-primary"} fw-bold`}
                    type="button"
                    onClick={() => setSearchMode("exact")}
                  >
                    Display Exact
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="journal-ledger-shell">
            <div className="journal-section-title-row journal-section-title-row-tight">
              <div>
                <h3>Transaction Listing</h3>
                <p>Each reference shows the affected GL account, customer or ledger name, description, user trail, and posting values.</p>
              </div>
              <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2 journal-export-btn">
                Export to excel <CiExport size={20} />
              </button>
            </div>

            {glBreakdown ? (
              <div className="journal-summary-grid" style={{ marginBottom: "12px" }}>
                <div className="journal-summary-card" style={{ gridColumn: "span 2" }}>
                  <span>GL Account(s) Debited</span>
                  <strong>{glBreakdown.debited.length ? glBreakdown.debited.join(", ") : "—"}</strong>
                </div>
                <div className="journal-summary-card" style={{ gridColumn: "span 2" }}>
                  <span>GL Account(s) Credited</span>
                  <strong>{glBreakdown.credited.length ? glBreakdown.credited.join(", ") : "—"}</strong>
                </div>
              </div>
            ) : null}

            <div className="table-responsive acc-type-container-table mb-3 journal-table-wrap" style={{ height: "430px" }}>
              <table className="table table-striped table-hover journal-entry-table">
                <thead className="bg-primary text-white">
                  <tr>
                    <th className="bg-primary text-white">DATE</th>
                    <th className="bg-primary text-white">SOURCE</th>
                    <th className="bg-primary text-white">REF. NO</th>
                    <th className="bg-primary text-white">AFFECTED GL ACCOUNT</th>
                    <th className="bg-primary text-white">CUSTOMER / GL NAME</th>
                    <th className="bg-primary text-white">DESCRIPTION</th>
                    <th className="bg-primary text-white text-end">DEBIT</th>
                    <th className="bg-primary text-white text-end">CREDIT</th>
                    <th className="bg-primary text-white">USER</th>
                    <th className="bg-primary text-white">APPROVED BY</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingRows ? (
                    <tr>
                      <td colSpan="10" className="text-center fw-semibold py-4">
                        Loading transactions...
                      </td>
                    </tr>
                  ) : filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="text-center fw-semibold py-4">
                        No transactions found for the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.transactionDate || "-"}</td>
                        <td>{row.sourceType.replaceAll("_", " ")}</td>
                        <td>{row.referenceNo || "-"}</td>
                        <td>{row.affectedAccount || "-"}</td>
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
                    <td colSpan="6" className="bg-primary text-white fw-bold ps-4">
                      TOTALS
                    </td>
                    <td className="bg-primary text-white text-end fw-bold">
                      {totals.debit.toFixed(2)}
                    </td>
                    <td className="bg-primary text-white text-end fw-bold">
                      {totals.credit.toFixed(2)}
                    </td>
                    <td colSpan="2" className="bg-primary text-white"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="journal-footer-row">
              <div className="transaction-footnote">
                References are grouped from journal entries and fund transfers so you can see which general-ledger accounts were touched by each transaction.
              </div>
              <div className="journal-balance-box">
                <label className="fw-bold text-primary">BALANCE</label>
                <input
                  type="text"
                  className="form-control border-primary-subtle text-end"
                  value={balance.toFixed(2)}
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

export default TransactionView;
