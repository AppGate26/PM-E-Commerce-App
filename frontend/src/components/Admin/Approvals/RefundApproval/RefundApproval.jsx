import React from "react";
import ApprovalWorkspace from "../shared/ApprovalWorkspace";
import {
  buildKeyValueSection,
  formatCurrencyValue,
  formatDateValue,
  pickValue,
  resolveApprovalData,
} from "../shared/approvalUtils";

// Refund.jsx submits requestData as { refundData: {...} }, which after the JSON
// round-trip through ApprovalRequest.requestData lands at approval.data.refundData
// (see approvalUtils.normalizePendingResponse) - not at a top-level "refundData" key.
const getRefundData = (approval) =>
  resolveApprovalData(approval, [
    "data.refundData",
    "requestDataParsed.refundData",
    "refundData",
    "refund",
    "request",
    "data",
  ]);

const RefundApproval = () => {
  const config = {
    title: "Refund Approval",
    description:
      "Review refund requests before funds are returned to the customer.",
    queueTitle: "Pending Refunds",
    queueDescription: "Open any pending refund request to review amount, reason, and customer details.",
    detailsTitle: "Refund Review",
    detailsDescription: "Submitted refund details for the selected request.",
    pendingEndpoints: ["/admin/approvals/refund/pending", "/admin/approvals/refunds/pending"],
    emptyState: {
      title: "No refunds waiting",
      description: "Refund requests will appear here once submitted for admin approval.",
    },
    errors: {
      load: "Unable to load pending refunds. Please try again later.",
      select: "Please select a refund to approve or decline.",
      approve: "Unable to approve refund. Please try again.",
      decline: "Unable to decline refund. Please try again.",
      declineReason: "A decline reason is required before you can reject this refund.",
    },
    success: {
      approve: "Refund approved successfully.",
      decline: "Refund declined successfully.",
    },
    labels: {
      approve: "Approve Refund",
      approving: "Approving...",
      decline: "Decline Refund",
      confirmDecline: "Confirm Decline",
      declining: "Declining...",
    },
    declinePlaceholder: "Write why this refund should be declined.",
    columns: [
      {
        key: "refund",
        label: "Refund",
        render: ({ approval }) => {
          const refund = getRefundData(approval);
          return (
            <div className="approval-primary-cell">
              <strong>{pickValue(refund, ["referenceNo"], `Refund #${approval.id}`)}</strong>
              <span>{pickValue(refund, ["customerName"], "Customer")}</span>
            </div>
          );
        },
      },
      {
        key: "amount",
        label: "Total After 15% Deduction",
        render: ({ approval }) =>
          formatCurrencyValue(pickValue(getRefundData(approval), ["totalAmount"])),
      },
      {
        key: "account",
        label: "Account",
        render: ({ approval }) =>
          pickValue(getRefundData(approval), ["accountNumber"], "Not available"),
      },
      {
        key: "date",
        label: "Submitted",
        render: ({ approval }) =>
          formatDateValue(pickValue(getRefundData(approval), ["createdAt", "submittedAt"], approval.createdAt)),
      },
    ],
    getSummary: (approval) => {
      const refund = getRefundData(approval);
      return {
        title: pickValue(refund, ["referenceNo"], "Refund request"),
        subtitle: pickValue(refund, ["customerName"], "Customer"),
        badges: [
          formatCurrencyValue(pickValue(refund, ["totalAmount"])),
          pickValue(refund, ["accountNumber"], "No account"),
        ],
      };
    },
    getDetailSections: (approval) => {
      const refund = getRefundData(approval);
      return [
        buildKeyValueSection("Refund Details", [
          { label: "Total Amount After 15% Deduction", value: formatCurrencyValue(pickValue(refund, ["totalAmount"])) },
          { label: "Reference No", value: pickValue(refund, ["referenceNo"]) },
          { label: "Product Name", value: pickValue(refund, ["productName"]) },
          { label: "Created At", value: formatDateValue(pickValue(refund, ["createdAt"], approval.createdAt)) },
        ]),
        buildKeyValueSection("Customer Details", [
          { label: "Customer Name", value: pickValue(refund, ["customerName"]) },
          { label: "Account Number", value: pickValue(refund, ["accountNumber"]) },
        ]),
      ];
    },
  };

  return <ApprovalWorkspace config={config} />;
};

export default RefundApproval;
