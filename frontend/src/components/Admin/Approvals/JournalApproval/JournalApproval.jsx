import React from "react";
import ApprovalWorkspace from "../shared/ApprovalWorkspace";
import {
  buildKeyValueSection,
  formatCurrencyValue,
  formatDateInputValue,
  formatDateValue,
  pickValue,
  resolveApprovalData,
} from "../shared/approvalUtils";

const getJournalData = (approval) => resolveApprovalData(approval, ["journalData", "journal", "data"]);

const getJournalEntries = (approval) => {
  const journal = getJournalData(approval);
  return journal.entries || journal.details || journal.items || [];
};

const JournalApproval = () => {
  const config = {
    title: "Journal Approval",
    description:
      "Review pending journal entries with a cleaner accounting approval workspace. Reference data, posting totals, and entry lines stay visible while you decide.",
    queueTitle: "Pending Journals",
    queueDescription: "Select a journal to inspect its posting lines and confirm the approval date.",
    detailsTitle: "Journal Review",
    detailsDescription: "Header information and line-item entries for the selected journal request.",
    pendingEndpoints: ["/admin/approvals/journal/pending", "/admin/approvals/journal-entries/pending"],
    emptyState: {
      title: "No journals waiting",
      description: "Pending journal entries will appear here when they are submitted for review.",
    },
    initialExtraState: {
      useOriginalDate: false,
      approvedDate: "",
    },
    renderControls: ({ selectedApproval, extraState, setExtraState }) => (
      <div className="approval-control-grid">
        <div className="approval-control-field">
          <label htmlFor="approvedDate">Approved Date</label>
          <input
            id="approvedDate"
            className="approval-control-input"
            type="date"
            value={extraState.approvedDate}
            disabled={extraState.useOriginalDate}
            onChange={(event) =>
              setExtraState((current) => ({
                ...current,
                approvedDate: event.target.value,
              }))
            }
          />
        </div>
        <div className="approval-control-field">
          <label>Posting Date Rule</label>
          <div className="approval-checkbox-row">
            <input
              id="useOriginalDate"
              type="checkbox"
              checked={extraState.useOriginalDate}
              onChange={(event) =>
                setExtraState((current) => ({
                  ...current,
                  useOriginalDate: event.target.checked,
                }))
              }
            />
            <label htmlFor="useOriginalDate">
              Use original journal date
              {selectedApproval ? ` (${formatDateValue(pickValue(getJournalData(selectedApproval), ["date", "journalDate", "journal_date"]))})` : ""}
            </label>
          </div>
        </div>
      </div>
    ),
    buildApproveBody: ({ approval, approvedBy, extraState, buildActionBody }) => {
      const journal = getJournalData(approval);
      const approvedDate = extraState.useOriginalDate
        ? pickValue(journal, ["date", "journalDate", "journal_date"])
        : extraState.approvedDate;

      return buildActionBody(approvedBy, "", {
        approvedDate: approvedDate || undefined,
      });
    },
    errors: {
      load: "Unable to load pending journal approvals. Please try again later.",
      select: "Please select a journal to approve or decline.",
      approve: "Unable to approve journal. Please try again.",
      decline: "Unable to decline journal. Please try again.",
      declineReason: "A decline reason is required before you can reject this journal.",
    },
    success: {
      approve: "Journal approved successfully.",
      decline: "Journal declined successfully.",
    },
    labels: {
      approve: "Approve Journal",
      approving: "Approving...",
      decline: "Decline Journal",
      confirmDecline: "Confirm Decline",
      declining: "Declining...",
    },
    declinePlaceholder: "Write why this journal entry should be declined.",
    columns: [
      {
        key: "ref",
        label: "Reference",
        render: ({ approval }) => {
          const journal = getJournalData(approval);
          return (
            <div className="approval-primary-cell">
              <strong>{pickValue(journal, ["refNo", "ref_no", "referenceNumber"], `Journal #${approval.id}`)}</strong>
              <span>{formatDateValue(pickValue(journal, ["date", "journalDate", "journal_date"]))}</span>
            </div>
          );
        },
      },
      {
        key: "debit",
        label: "Total Debit",
        render: ({ approval }) =>
          formatCurrencyValue(pickValue(getJournalData(approval), ["totalDebt", "total_debt", "totalDebit", "total_debit"])),
      },
      {
        key: "credit",
        label: "Total Credit",
        render: ({ approval }) =>
          formatCurrencyValue(pickValue(getJournalData(approval), ["totalCredit", "total_credit"])),
      },
      {
        key: "lines",
        label: "Entries",
        render: ({ approval }) => `${getJournalEntries(approval).length || 0} line(s)`,
      },
      {
        key: "postedBy",
        label: "Posted By",
        render: ({ approval }) =>
          pickValue(getJournalData(approval), ["postedBy", "user.name", "createdBy"], "Not available"),
      },
    ],
    getSummary: (approval) => {
      const journal = getJournalData(approval);
      return {
        title: pickValue(journal, ["refNo", "ref_no", "referenceNumber"], "Journal request"),
        subtitle: `Journal date ${formatDateValue(pickValue(journal, ["date", "journalDate", "journal_date"]))}`,
        badges: [
          `${getJournalEntries(approval).length || 0} entries`,
          formatCurrencyValue(pickValue(journal, ["totalCredit", "total_credit"])),
        ],
      };
    },
    getDetailSections: (approval) => {
      const journal = getJournalData(approval);
      return [
        buildKeyValueSection("Journal Header", [
          { label: "Reference", value: pickValue(journal, ["refNo", "ref_no", "referenceNumber"]) },
          { label: "Date", value: formatDateValue(pickValue(journal, ["date", "journalDate", "journal_date"])) },
          { label: "Total Debit", value: formatCurrencyValue(pickValue(journal, ["totalDebt", "total_debt", "totalDebit", "total_debit"])) },
          { label: "Total Credit", value: formatCurrencyValue(pickValue(journal, ["totalCredit", "total_credit"])) },
          { label: "Posted By", value: pickValue(journal, ["postedBy", "user.name", "createdBy"]) },
          { label: "Approved Date Preview", value: formatDateValue(formatDateInputValue(pickValue(journal, ["date", "journalDate", "journal_date"]))) },
        ]),
      ];
    },
    getDetailTable: (approval) => ({
      title: "Journal Lines",
      rows: getJournalEntries(approval),
      columns: [
        { key: "sn", label: "S/N", render: ({ index }) => index + 1 },
        {
          key: "accountId",
          label: "Account ID",
          render: ({ row }) => pickValue(row, ["accountId", "account_id", "account.id"], "Not available"),
        },
        {
          key: "accountName",
          label: "Account Name",
          render: ({ row }) => pickValue(row, ["accountName", "account_name", "account.name"], "Not available"),
        },
        {
          key: "description",
          label: "Description",
          render: ({ row }) => pickValue(row, ["description", "narration"], "Not available"),
        },
        {
          key: "debit",
          label: "Debit",
          render: ({ row }) => formatCurrencyValue(pickValue(row, ["debit", "debitAmount", "debit_amount"])),
        },
        {
          key: "credit",
          label: "Credit",
          render: ({ row }) => formatCurrencyValue(pickValue(row, ["credit", "creditAmount", "credit_amount"])),
        },
      ],
    }),
  };

  return <ApprovalWorkspace config={config} />;
};

export default JournalApproval;
