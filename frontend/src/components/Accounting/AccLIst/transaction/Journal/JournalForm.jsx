import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BranchBadge from "../../../../shared/BranchBadge";
import { IoArrowBack } from "react-icons/io5";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import { useAuth } from "../../../../../context/AuthContext";
import {
  createJournalEntry,
  updateJournalEntry,
  getJournalEntryById,
  getNextJournalReference,
  getAccountOptions,
} from "../../../../../lib/accountingApi";
import { JournalNav } from "./JournalIndex";
import AccountPicker from "../../../../shared/AccountPicker";
import "../../../Account.css";

const today = () => new Date().toISOString().slice(0, 10);

const makeBlankLine = () => ({
  key: `line-${Math.random().toString(36).slice(2, 9)}`,
  accountId: "",
  accountName: "",
  description: "",
  debit: "",
  credit: "",
});

const JournalForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  const [header, setHeader] = useState({
    journalReference: "",
    journalType: "GENERAL_JOURNAL",
    transactionDate: today(),
    description: "",
  });
  const [lines, setLines] = useState([makeBlankLine(), makeBlankLine()]);
  const [accountOptions, setAccountOptions] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const accounts = await getAccountOptions();
        setAccountOptions(accounts);
      } catch (error) {
        console.error("Failed to load account options:", error);
        toast.error(error?.message || "Unable to load accounts");
      }

      if (isEdit) {
        try {
          const entry = await getJournalEntryById(id);
          setHeader({
            journalReference: entry.journalReference || "",
            journalType: entry.journalType || "GENERAL_JOURNAL",
            transactionDate: entry.transactionDate || today(),
            description: entry.description || "",
          });
          setIsApproved(Boolean(entry.isApproved));
          setLines(
            entry.lines.length
              ? entry.lines.map((line) => ({
                  key: `line-${line.id}`,
                  accountId: String(line.accountId || ""),
                  accountName: line.accountName || "",
                  description: line.description || "",
                  debit: line.debit ? String(line.debit) : "",
                  credit: line.credit ? String(line.credit) : "",
                }))
              : [makeBlankLine(), makeBlankLine()]
          );
        } catch (error) {
          console.error("Failed to load journal entry:", error);
          toast.error(error?.message || "Unable to load journal entry");
        } finally {
          setLoading(false);
        }
      } else {
        try {
          const reference = await getNextJournalReference();
          setHeader((prev) => ({ ...prev, journalReference: reference }));
        } catch (error) {
          console.error("Failed to fetch next reference:", error);
          toast.error(error?.message || "Unable to generate reference");
        }
      }
    };

    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleHeaderChange = (event) => {
    const { name, value } = event.target;
    setHeader((prev) => ({ ...prev, [name]: value }));
  };

  const handleLineChange = (key, field, value) => {
    setLines((prev) =>
      prev.map((line) => {
        if (line.key !== key) return line;
        if (field === "accountId") {
          const account = accountOptions.find(
            (option) => String(option.value) === String(value)
          );
          return { ...line, accountId: value, accountName: account?.name || "" };
        }
        // A line carries either a debit or a credit, never both.
        if (field === "debit") return { ...line, debit: value, credit: value ? "" : line.credit };
        if (field === "credit") return { ...line, credit: value, debit: value ? "" : line.debit };
        return { ...line, [field]: value };
      })
    );
  };

  const addLine = () => setLines((prev) => [...prev, makeBlankLine()]);

  const removeLine = (key) =>
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((line) => line.key !== key)));

  const totals = useMemo(() => {
    return lines.reduce(
      (acc, line) => {
        acc.debit += Number(line.debit) || 0;
        acc.credit += Number(line.credit) || 0;
        return acc;
      },
      { debit: 0, credit: 0 }
    );
  }, [lines]);

  const difference = totals.debit - totals.credit;
  const hasAmounts = totals.debit > 0 || totals.credit > 0;
  const balanced =
    Number(totals.debit.toFixed(2)) === Number(totals.credit.toFixed(2)) &&
    totals.debit > 0;

  const validLines = lines.filter(
    (line) => Number(line.accountId) && (Number(line.debit) > 0 || Number(line.credit) > 0)
  );
  const canSave = !saving && !isApproved && balanced && validLines.length >= 2;

  const handleSave = async () => {
    const userId = Number(user?.id ?? user?.userId ?? user?.user_id);
    if (!userId) {
      toast.error("User session is missing ID. Please log in again.");
      return;
    }
    if (!header.transactionDate) {
      toast.error("Please select a transaction date.");
      return;
    }
    if (validLines.length < 2) {
      toast.error("Add at least two lines with an account and an amount.");
      return;
    }
    if (!balanced) {
      toast.error("Entry is not balanced. Total debit must equal total credit.");
      return;
    }

    const journalPayload = {
      journalReference: header.journalReference.trim() || undefined,
      journalType: header.journalType,
      transactionDate: header.transactionDate,
      description: header.description.trim(),
      journalLines: validLines.map((line) => ({
        accountId: Number(line.accountId),
        description: line.description.trim() || header.description.trim(),
        debit: Number(line.debit) || 0,
        credit: Number(line.credit) || 0,
        userId,
        referenceNo: header.journalReference.trim(),
      })),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateJournalEntry({ entryId: id, userId, journalPayload });
        toast.success("Journal entry updated successfully.");
      } else {
        await createJournalEntry({ userId, journalPayload });
        toast.success("Journal entry created successfully.");
      }
      navigate("/Accounting/JournalEntry");
    } catch (error) {
      console.error("Failed to save journal entry:", error);
      toast.error(error?.message || "Unable to save journal entry");
    } finally {
      setSaving(false);
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
                onClick={() => navigate("/Accounting/JournalEntry")}
                aria-label="Back to journal entries"
              >
                <IoArrowBack size={20} />
              </button>
              <div>
                <h2 className="journal-page-title">
                  {isEdit ? "Edit Journal Entry" : "Create Journal Entry"}
                </h2>
                <div style={{ marginTop: "0.4rem" }}>
                  <BranchBadge />
                </div>
                <p className="journal-page-subtitle">
                  {isApproved
                    ? "This entry is approved and can only be viewed."
                    : "Add balanced debit and credit lines, then save."}
                </p>
              </div>
            </div>
            <div className="journal-header-badge">{header.journalReference || "New"}</div>
          </div>

          {loading ? (
            <div className="journal-form-shell text-center fw-semibold py-5">
              Loading journal entry...
            </div>
          ) : (
            <>
              <div className="journal-form-shell">
                <div className="journal-section-title-row">
                  <div>
                    <h3>Entry Details</h3>
                    <p>The reference is generated automatically — you can override it.</p>
                  </div>
                </div>

                <div className="row g-4">
                  <div className="col-lg-6">
                    <div className="journal-panel">
                      <div className="row mb-3 align-items-center journal-field-row">
                        <label className="col-sm-4 fw-bold text-primary">Reference No.</label>
                        <div className="col-sm-8">
                          <input
                            type="text"
                            className="form-control border-primary-subtle fw-semibold"
                            name="journalReference"
                            value={header.journalReference}
                            onChange={handleHeaderChange}
                            disabled={isApproved || isEdit}
                          />
                        </div>
                      </div>
                      <div className="row mb-3 align-items-center journal-field-row">
                        <label className="col-sm-4 fw-bold text-primary">Journal Type</label>
                        <div className="col-sm-8">
                          <select
                            className="form-select border-primary-subtle fw-semibold text-secondary"
                            name="journalType"
                            value={header.journalType}
                            onChange={handleHeaderChange}
                            disabled={isApproved}
                          >
                            <option value="GENERAL_JOURNAL">GENERAL JOURNAL</option>
                            <option value="LIST">LIST</option>
                            <option value="INDIVIDUAL">INDIVIDUAL</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-6">
                    <div className="journal-panel">
                      <div className="row mb-3 align-items-center journal-field-row">
                        <label className="col-sm-4 fw-bold text-primary">Transaction Date</label>
                        <div className="col-sm-8">
                          <input
                            type="date"
                            className="form-control border-primary-subtle text-secondary"
                            name="transactionDate"
                            value={header.transactionDate}
                            onChange={handleHeaderChange}
                            disabled={isApproved}
                          />
                        </div>
                      </div>
                      <div className="row mb-0 journal-field-row">
                        <label className="col-sm-4 fw-bold text-primary">Description</label>
                        <div className="col-sm-8">
                          <textarea
                            className="form-control border-primary-subtle"
                            rows="2"
                            name="description"
                            value={header.description}
                            onChange={handleHeaderChange}
                            disabled={isApproved}
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="journal-ledger-shell">
                <div className="journal-section-title-row journal-section-title-row-tight">
                  <div>
                    <h3>Journal Lines</h3>
                    <p>Each line is a debit or a credit. Totals must match to save.</p>
                  </div>
                  {!isApproved && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2"
                      onClick={addLine}
                    >
                      <FiPlus size={16} /> Add line
                    </button>
                  )}
                </div>

                <div className="table-responsive acc-type-container-table mb-2">
                  <table className="table table-striped journal-entry-table journal-line-grid">
                    <thead className="bg-primary text-white">
                      <tr>
                        <th className="bg-primary text-white">ACCOUNT</th>
                        <th className="bg-primary text-white">DESCRIPTION</th>
                        <th className="bg-primary text-white text-end">DEBIT</th>
                        <th className="bg-primary text-white text-end">CREDIT</th>
                        {!isApproved && <th className="bg-primary text-white text-center">—</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line) => (
                        <tr key={line.key}>
                          <td style={{ minWidth: "260px" }}>
                            <AccountPicker
                              accounts={accountOptions}
                              value={line.accountId}
                              onChange={(nextValue) => handleLineChange(line.key, "accountId", nextValue)}
                              disabled={isApproved}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control border-primary-subtle"
                              value={line.description}
                              onChange={(e) => handleLineChange(line.key, "description", e.target.value)}
                              disabled={isApproved}
                            />
                          </td>
                          <td className="text-end">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="form-control border-primary-subtle text-end"
                              value={line.debit}
                              onChange={(e) => handleLineChange(line.key, "debit", e.target.value)}
                              disabled={isApproved}
                            />
                          </td>
                          <td className="text-end">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="form-control border-primary-subtle text-end"
                              value={line.credit}
                              onChange={(e) => handleLineChange(line.key, "credit", e.target.value)}
                              disabled={isApproved}
                            />
                          </td>
                          {!isApproved && (
                            <td className="text-center">
                              <button
                                type="button"
                                className="journal-line-remove"
                                onClick={() => removeLine(line.key)}
                                disabled={lines.length <= 1}
                                title="Remove line"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-primary text-white">
                        <td colSpan="2" className="bg-primary text-white fw-bold ps-4">TOTALS</td>
                        <td className="bg-primary text-white text-end fw-bold">
                          {totals.debit.toFixed(2)}
                        </td>
                        <td className="bg-primary text-white text-end fw-bold">
                          {totals.credit.toFixed(2)}
                        </td>
                        {!isApproved && <td className="bg-primary text-white"></td>}
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div
                  className={`journal-balance-callout ${
                    !hasAmounts ? "is-neutral" : balanced ? "is-balanced" : "is-unbalanced"
                  }`}
                >
                  <span className="journal-balance-status">
                    {!hasAmounts
                      ? "Enter debit and credit amounts"
                      : balanced
                      ? "✓ Entry is balanced"
                      : "⚠ Entry is not balanced"}
                  </span>
                  <div className="journal-balance-figures">
                    <span>Debit <strong>{totals.debit.toFixed(2)}</strong></span>
                    <span>Credit <strong>{totals.credit.toFixed(2)}</strong></span>
                    <span>Difference <strong>{difference.toFixed(2)}</strong></span>
                  </div>
                </div>

                {!isApproved && (
                  <div className="journal-footer-row mt-3">
                    <button
                      type="button"
                      className="btn btn-outline-primary px-4 fw-bold"
                      onClick={() => navigate("/Accounting/JournalEntry")}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary px-5 py-2 fw-bold journal-primary-btn"
                      onClick={handleSave}
                      disabled={!canSave}
                    >
                      {saving ? "SAVING..." : isEdit ? "UPDATE ENTRY" : "SAVE ENTRY"}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JournalForm;
