import React from "react";
import ApprovalWorkspace from "../shared/ApprovalWorkspace";
import { apiRequest } from "../../../../lib/config";
import {
  buildKeyValueSection,
  formatDateValue,
  pickValue,
} from "../shared/approvalUtils";

// ReturnRequest rows are flat (no requestData wrapper), so the approval object *is*
// the return request - see ReturnRequestController (GET /api/returns) and the
// ReturnRequest entity.
const getReturnData = (approval) => approval || {};

const ReturnApproval = () => {
  const config = {
    title: "Return Approval",
    description:
      "Review return requests before pickup, replacement, or refund processing continues.",
    queueTitle: "Pending Returns",
    queueDescription: "Open any pending return request to review product, reason, and customer details.",
    detailsTitle: "Return Review",
    detailsDescription: "Submitted return details for the selected request.",
    pendingEndpoints: ["/returns?status=PENDING&size=200"],
    emptyState: {
      title: "No returns waiting",
      description: "Return requests will appear here once submitted for admin approval.",
    },
    errors: {
      load: "Unable to load pending returns. Please try again later.",
      select: "Please select a return to approve or decline.",
      approve: "Unable to approve return. Please try again.",
      decline: "Unable to decline return. Please try again.",
      declineReason: "A decline reason is required before you can reject this return.",
    },
    success: {
      approve: "Return approved successfully.",
      decline: "Return declined successfully.",
    },
    labels: {
      approve: "Approve Return",
      approving: "Approving...",
      decline: "Decline Return",
      confirmDecline: "Confirm Decline",
      declining: "Declining...",
    },
    declinePlaceholder: "Write why this return should be declined.",
    // Both actions hit ReturnRequestController's PUT /returns/{id}/status (UpdateReturnStatusDto),
    // not the generic ApprovalController - return requests are their own resource, not rows in
    // the generic admin_approvals table.
    approveRequest: async ({ approval, approvedBy }) =>
      apiRequest(`/returns/${approval.id}/status`, "PUT", {
        status: "APPROVED",
        reviewedBy: approvedBy,
      }),
    declineRequest: async ({ approval, approvedBy, reason }) =>
      apiRequest(`/returns/${approval.id}/status`, "PUT", {
        status: "REJECTED",
        adminNotes: reason,
        reviewedBy: approvedBy,
      }),
    columns: [
      {
        key: "return",
        label: "Return",
        render: ({ approval }) => {
          const request = getReturnData(approval);
          return (
            <div className="approval-primary-cell">
              <strong>{pickValue(request, ["referenceNo"], `Return #${approval.id}`)}</strong>
              <span>{pickValue(request, ["customerName"], "Customer")}</span>
            </div>
          );
        },
      },
      {
        key: "reason",
        label: "Reason",
        render: ({ approval }) => pickValue(getReturnData(approval), ["reason"], "Not available"),
      },
      {
        key: "method",
        label: "Return / Refund Method",
        render: ({ approval }) => {
          const request = getReturnData(approval);
          const returnMethod = pickValue(request, ["returnMethod"]);
          const refundMethod = pickValue(request, ["refundMethod"]);
          return [returnMethod, refundMethod].filter(Boolean).join(" / ") || "Not available";
        },
      },
      {
        key: "date",
        label: "Submitted",
        render: ({ approval }) =>
          formatDateValue(pickValue(getReturnData(approval), ["createdAt"], approval.createdAt)),
      },
    ],
    getSummary: (approval) => {
      const request = getReturnData(approval);
      return {
        title: pickValue(request, ["referenceNo"], "Return request"),
        subtitle: pickValue(request, ["customerName"], "Customer"),
        badges: [
          pickValue(request, ["returnMethod"], "Return"),
          pickValue(request, ["refundMethod"], "No refund method"),
        ],
      };
    },
    getDetailSections: (approval) => {
      const request = getReturnData(approval);
      return [
        buildKeyValueSection("Return Details", [
          { label: "Reference", value: pickValue(request, ["referenceNo"]) },
          { label: "Sales Order ID", value: pickValue(request, ["salesOrderId"]) },
          { label: "Reason", value: pickValue(request, ["reason"]) },
          { label: "Submitted", value: formatDateValue(pickValue(request, ["createdAt"], approval.createdAt)) },
        ]),
        buildKeyValueSection("Customer And Method", [
          { label: "Customer", value: pickValue(request, ["customerName"]) },
          { label: "Return Method", value: pickValue(request, ["returnMethod"]) },
          { label: "Refund Method", value: pickValue(request, ["refundMethod"]) },
          { label: "Replacement Product", value: pickValue(request, ["replacementProductName"]) },
        ]),
      ];
    },
  };

  return <ApprovalWorkspace config={config} />;
};

export default ReturnApproval;
