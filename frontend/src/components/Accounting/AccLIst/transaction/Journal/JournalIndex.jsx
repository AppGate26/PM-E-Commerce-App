import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import { BsSearch } from "react-icons/bs";
import { FiEdit2, FiEye, FiTrash2, FiPlus } from "react-icons/fi";
import { toast } from "react-toastify";
import logo from "../../../../../assets/images/adminLogo.png";
import {
  getJournalEntryList,
  deleteJournalEntry,
} from "../../../../../lib/accountingApi";
import "../../../Account.css";

const formatMoney = (value) => (Number(value) || 0).toFixed(2);

const JournalNav = () => (
  <nav className="bg-primary d-flex align-items-center justify-content-between px-5">
    <Link to="/adminDashboard">
      <img src={logo} alt="pm logo" className="logo-acc" />
    </Link>
    <div className="d-flex">
      <div className="dropdown-center acc-dropdown-link">
        <button className="btn text-white dropdown-toggle" type="button" data-bs-toggle="dropdown">
          JOURNAL
        </button>
        <ul className="dropdown-menu">
          <li>
            <Link to="/Accounting/JournalEntry" className="text-decoration-none text-dark">
              All Entries
            </Link>
          </li>
          <li>
            <Link to="/Accounting/JournalEntry/new" className="text-decoration-none text-dark">
              New Entry
            </Link>
          </li>
        </ul>
      </div>
      <div className="dropdown-center acc-dropdown-link">
        <button className="btn text-white dropdown-toggle" type="button" data-bs-toggle="dropdown">
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
        </ul>
      </div>
    </div>
    <Link to="/">
      <button className="Log_Out-btn cl-log-out" id="Log_Out-btn-sm">
        Log Out
      </button>
    </Link>
  </nav>
);

export { JournalNav };

const JournalIndex = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const loadEntries = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await getJournalEntryList();
      setEntries(data);
    } catch (error) {
      console.error("Failed to load journal entries:", error);
      const message = error?.message || "Unable to load journal entries";
      setLoadError(message);
      toast.error(message);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return entries;
    return entries.filter((entry) =>
      [entry.journalReference, entry.description, entry.journalType]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term))
    );
  }, [entries, search]);

  const summary = useMemo(() => {
    return entries.reduce(
      (acc, entry) => {
        acc.total += 1;
        if (entry.balanced) acc.balanced += 1;
        else acc.unbalanced += 1;
        if (!entry.isApproved) acc.pending += 1;
        return acc;
      },
      { total: 0, balanced: 0, unbalanced: 0, pending: 0 }
    );
  }, [entries]);

  const handleDelete = async (entry) => {
    if (entry.isApproved) {
      toast.error("Cannot delete an approved journal entry.");
      return;
    }
    if (!window.confirm(`Delete journal entry ${entry.journalReference}?`)) return;
    setDeletingId(entry.id);
    try {
      await deleteJournalEntry(entry.id);
      toast.success("Journal entry deleted.");
      setEntries((prev) => prev.filter((row) => row.id !== entry.id));
    } catch (error) {
      toast.error(error?.message || "Failed to delete journal entry.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="journal-page">
      <JournalNav />

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
                <h2 className="journal-page-title">Journal Entries</h2>
                <p className="journal-page-subtitle">
                  Every journal entry with its reference and live balance status.
                </p>
              </div>
            </div>
            <div className="journal-header-badge">Accounting Journal</div>
          </div>

          <div className="journal-summary-grid">
            <div className="journal-summary-card">
              <span>Total Entries</span>
              <strong>{summary.total}</strong>
            </div>
            <div className="journal-summary-card">
              <span>Balanced</span>
              <strong>{summary.balanced}</strong>
            </div>
            <div className="journal-summary-card">
              <span>Unbalanced</span>
              <strong>{summary.unbalanced}</strong>
            </div>
            <div className="journal-summary-card">
              <span>Awaiting Approval</span>
              <strong>{summary.pending}</strong>
            </div>
          </div>

          <div className="journal-ledger-shell">
            <div className="journal-toolbar-row">
              <div className="position-relative journal-search-box">
                <input
                  type="text"
                  className="form-control border-primary-subtle"
                  placeholder="Search by reference, description or type"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <BsSearch className="position-absolute end-0 top-50 translate-middle-y me-3 text-secondary" />
              </div>
              <button
                type="button"
                className="btn btn-primary journal-create-btn d-flex align-items-center gap-2"
                onClick={() => navigate("/Accounting/JournalEntry/new")}
              >
                <FiPlus size={18} /> Create Entry
              </button>
            </div>

            <div className="table-responsive acc-type-container-table mb-3">
              <table className="table table-striped table-hover journal-index-table">
                <thead className="bg-primary text-white">
                  <tr>
                    <th className="bg-primary text-white">REFERENCE NO</th>
                    <th className="bg-primary text-white">DATE</th>
                    <th className="bg-primary text-white">TYPE</th>
                    <th className="bg-primary text-white">DESCRIPTION</th>
                    <th className="bg-primary text-white text-end">DEBIT</th>
                    <th className="bg-primary text-white text-end">CREDIT</th>
                    <th className="bg-primary text-white text-center">BALANCED</th>
                    <th className="bg-primary text-white text-center">STATUS</th>
                    <th className="bg-primary text-white text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="text-center fw-semibold py-4">
                        Loading journal entries...
                      </td>
                    </tr>
                  ) : loadError ? (
                    <tr>
                      <td colSpan="9" className="text-center py-4">
                        <div className="text-danger fw-semibold mb-2">
                          Could not load journal entries: {loadError}
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={loadEntries}
                        >
                          Retry
                        </button>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center fw-semibold py-4">
                        {entries.length === 0
                          ? "No journal entries yet. Click Create Entry to add one."
                          : "No entries match your search."}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((entry) => (
                      <tr key={entry.id ?? entry.journalReference}>
                        <td className="journal-ref-cell">{entry.journalReference || "-"}</td>
                        <td>{entry.transactionDate || "-"}</td>
                        <td>{String(entry.journalType || "").replace(/_/g, " ")}</td>
                        <td>{entry.description || "-"}</td>
                        <td className="text-end">{formatMoney(entry.totalDebit)}</td>
                        <td className="text-end">{formatMoney(entry.totalCredit)}</td>
                        <td className="text-center">
                          <span
                            className={`journal-badge ${
                              entry.balanced ? "journal-badge-balanced" : "journal-badge-unbalanced"
                            }`}
                          >
                            {entry.balanced ? "✓ Balanced" : "⚠ Unbalanced"}
                          </span>
                        </td>
                        <td className="text-center">
                          <span
                            className={`journal-badge ${
                              entry.isApproved ? "journal-badge-approved" : "journal-badge-pending"
                            }`}
                          >
                            {entry.isApproved ? "Approved" : "Pending"}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-2 justify-content-center">
                            <button
                              type="button"
                              className="journal-row-action view d-flex align-items-center gap-1"
                              onClick={() => navigate(`/Accounting/JournalEntry/${entry.id}/edit`)}
                              title="View"
                            >
                              <FiEye size={14} />
                            </button>
                            <button
                              type="button"
                              className="journal-row-action d-flex align-items-center gap-1"
                              onClick={() => navigate(`/Accounting/JournalEntry/${entry.id}/edit`)}
                              disabled={entry.isApproved}
                              title={entry.isApproved ? "Approved entries can't be edited" : "Edit"}
                            >
                              <FiEdit2 size={14} />
                            </button>
                            <button
                              type="button"
                              className="journal-row-action delete d-flex align-items-center gap-1"
                              onClick={() => handleDelete(entry)}
                              disabled={entry.isApproved || deletingId === entry.id}
                              title={entry.isApproved ? "Approved entries can't be deleted" : "Delete"}
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalIndex;
