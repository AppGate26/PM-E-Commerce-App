import React from "react";
import ApprovalWorkspace from "../shared/ApprovalWorkspace";
import {
  buildKeyValueSection,
  pickValue,
  resolveApprovalData,
} from "../shared/approvalUtils";

const getSuspensionCustomer = (approval) =>
  resolveApprovalData(approval, ["customerData", "customer", "data"]);
const getSuspensionMeta = (approval) =>
  resolveApprovalData(approval, ["suspensionData", "suspension"]);

const SuspendedCustomersApproval = () => {
  const config = {
    title: "Suspended Customer Approval",
    description:
      "Review customer suspension requests in a standard admin layout before the suspension is finalized.",
    queueTitle: "Pending Suspension Requests",
    queueDescription: "Select any suspension request to review the customer account and submitted reason.",
    detailsTitle: "Suspension Review",
    detailsDescription: "Customer profile and suspension reason for the selected request.",
    pendingEndpoints: ["/admin/approvals/suspensions/pending"],
    emptyState: {
      title: "No suspension requests waiting",
      description: "New customer suspension requests will appear here when they are routed to admin.",
    },
    errors: {
      load: "Unable to load pending suspension requests. Please try again later.",
      select: "Please select a suspension request to approve or decline.",
      approve: "Unable to approve suspension request. Please try again.",
      decline: "Unable to decline suspension request. Please try again.",
      declineReason: "A decline reason is required before you can reject this suspension request.",
    },
    success: {
      approve: "Suspension request approved successfully.",
      decline: "Suspension request declined successfully.",
    },
    labels: {
      approve: "Approve Suspension",
      approving: "Approving...",
      decline: "Decline Suspension",
      confirmDecline: "Confirm Decline",
      declining: "Declining...",
    },
    declinePlaceholder: "Write why this suspension request should be declined.",
    columns: [
      {
        key: "customer",
        label: "Customer",
        render: ({ approval }) => {
          const customer = getSuspensionCustomer(approval);
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
          pickValue(getSuspensionMeta(approval), ["reasonForSuspension", "reason_for_suspension", "reason"], "Not available"),
      },
      {
        key: "contact",
        label: "Contact",
        render: ({ approval }) =>
          pickValue(getSuspensionCustomer(approval), ["phoneNumber", "telephoneNumber", "email"], "Not available"),
      },
      {
        key: "passport",
        label: "Passport",
        render: ({ approval }) =>
          pickValue(getSuspensionCustomer(approval), ["passport", "passportImage", "passport_image"]) ? "Attached" : "Not available",
      },
    ],
    getSummary: (approval) => {
      const customer = getSuspensionCustomer(approval);
      return {
        title:
          pickValue(customer, ["fullName", "name"]) ||
          `${pickValue(customer, ["firstName", "first_name"], "")} ${pickValue(customer, ["surname"], "")}`.trim() ||
          "Suspension request",
        subtitle: pickValue(customer, ["accountNumber", "account_number", "accountNo"], "Customer account pending"),
        badges: ["Suspension request"],
      };
    },
    getDetailSections: (approval) => {
      const customer = getSuspensionCustomer(approval);
      const suspension = getSuspensionMeta(approval);

      return [
        buildKeyValueSection("Customer Details", [
          { label: "Account Number", value: pickValue(customer, ["accountNumber", "account_number", "accountNo"]) },
          { label: "Customer Name", value: pickValue(customer, ["fullName", "name"]) || `${pickValue(customer, ["firstName", "first_name"], "")} ${pickValue(customer, ["surname"], "")}`.trim() },
          { label: "Phone", value: pickValue(customer, ["phoneNumber", "telephoneNumber", "email"]) },
          { label: "Passport", value: pickValue(customer, ["passport", "passportImage", "passport_image"]) ? "Attached" : "Not available" },
        ]),
        buildKeyValueSection("Suspension Details", [
          { label: "Reason", value: pickValue(suspension, ["reasonForSuspension", "reason_for_suspension", "reason"]) },
          { label: "Submitted By", value: pickValue(suspension, ["submittedBy", "createdBy", "user.name"]) },
        ]),
      ];
    },
  };

  return <ApprovalWorkspace config={config} />;
};

export default SuspendedCustomersApproval;
