import React from "react";
import ApprovalWorkspace from "../shared/ApprovalWorkspace";
import {
  buildKeyValueSection,
  pickValue,
  resolveApprovalData,
} from "../shared/approvalUtils";

const getUnblockCustomer = (approval) =>
  resolveApprovalData(approval, ["customerData", "customer", "data"]);
const getUnblockMeta = (approval) =>
  resolveApprovalData(approval, ["unblockData", "unblock"]);

const UnblockCustomersApproval = () => {
  const config = {
    title: "Unblock Customer Approval",
    description:
      "Review customer unblock requests in a standard approval layout before access is restored.",
    queueTitle: "Pending Unblock Requests",
    queueDescription: "Select an unblock request to review the account and the submitted reason.",
    detailsTitle: "Unblock Review",
    detailsDescription: "Customer profile and unblock justification for the selected request.",
    pendingEndpoints: ["/admin/approvals/unblocks/pending"],
    emptyState: {
      title: "No unblock requests waiting",
      description: "Customer unblock requests will appear here as soon as they are submitted for review.",
    },
    errors: {
      load: "Unable to load pending unblock requests. Please try again later.",
      select: "Please select an unblock request to approve or decline.",
      approve: "Unable to approve unblock request. Please try again.",
      decline: "Unable to decline unblock request. Please try again.",
      declineReason: "A decline reason is required before you can reject this unblock request.",
    },
    success: {
      approve: "Unblock request approved successfully.",
      decline: "Unblock request declined successfully.",
    },
    labels: {
      approve: "Approve Unblock",
      approving: "Approving...",
      decline: "Decline Unblock",
      confirmDecline: "Confirm Decline",
      declining: "Declining...",
    },
    declinePlaceholder: "Write why this unblock request should be declined.",
    columns: [
      {
        key: "customer",
        label: "Customer",
        render: ({ approval }) => {
          const customer = getUnblockCustomer(approval);
          return (
            <div className="approval-primary-cell">
              <strong>
                {pickValue(customer, ["fullName", "name"]) ||
                  `${pickValue(customer, ["firstName", "first_name"], "")} ${pickValue(customer, ["surname"], "")}`.trim() ||
                  "Customer"}
              </strong>
              <span>{pickValue(customer, ["accountNumber", "account_number", "accountNo"], `Request #${approval.id}`)}</span>
            </div>
          );
        },
      },
      {
        key: "reason",
        label: "Reason",
        render: ({ approval }) =>
          pickValue(getUnblockMeta(approval), ["reasonForUnblocking", "reason_for_unblocking", "reason"], "Not available"),
      },
      {
        key: "contact",
        label: "Contact",
        render: ({ approval }) =>
          pickValue(getUnblockCustomer(approval), ["phoneNumber", "telephoneNumber", "email"], "Not available"),
      },
      {
        key: "passport",
        label: "Passport",
        render: ({ approval }) =>
          pickValue(getUnblockCustomer(approval), ["passport", "passportImage", "passport_image"]) ? "Attached" : "Not available",
      },
    ],
    getSummary: (approval) => {
      const customer = getUnblockCustomer(approval);
      return {
        title:
          pickValue(customer, ["fullName", "name"]) ||
          `${pickValue(customer, ["firstName", "first_name"], "")} ${pickValue(customer, ["surname"], "")}`.trim() ||
          "Unblock request",
        subtitle: pickValue(customer, ["accountNumber", "account_number", "accountNo"], "Customer account pending"),
        badges: ["Unblock request"],
      };
    },
    getDetailSections: (approval) => {
      const customer = getUnblockCustomer(approval);
      const unblock = getUnblockMeta(approval);

      return [
        buildKeyValueSection("Customer Details", [
          { label: "Account Number", value: pickValue(customer, ["accountNumber", "account_number", "accountNo"]) },
          { label: "Customer Name", value: pickValue(customer, ["fullName", "name"]) || `${pickValue(customer, ["firstName", "first_name"], "")} ${pickValue(customer, ["surname"], "")}`.trim() },
          { label: "Phone", value: pickValue(customer, ["phoneNumber", "telephoneNumber", "email"]) },
          { label: "Passport", value: pickValue(customer, ["passport", "passportImage", "passport_image"]) ? "Attached" : "Not available" },
        ]),
        buildKeyValueSection("Unblock Details", [
          { label: "Reason", value: pickValue(unblock, ["reasonForUnblocking", "reason_for_unblocking", "reason"]) },
          { label: "Submitted By", value: pickValue(unblock, ["submittedBy", "createdBy", "user.name"]) },
        ]),
      ];
    },
  };

  return <ApprovalWorkspace config={config} />;
};

export default UnblockCustomersApproval;
