import React from "react";
import ApprovalWorkspace from "../shared/ApprovalWorkspace";
import {
  buildKeyValueSection,
  formatDateValue,
  pickValue,
  resolveApprovalData,
} from "../shared/approvalUtils";

const getEditData = (approval) =>
  resolveApprovalData(approval, ["editData", "changedFields", "data"]);

const getCustomerData = (approval) =>
  resolveApprovalData(approval, ["customerData", "customer", "currentData", "data"]);

const CustomerEditApproval = () => {
  const config = {
    title: "Customer Edit Approval",
    description:
      "Review customer profile edits before they are applied. Compare original and new values to verify changes are accurate and appropriate.",
    queueTitle: "Pending Customer Edits",
    queueDescription: "Choose a customer edit request to inspect the changes before approval.",
    detailsTitle: "Edit Review",
    detailsDescription: "Original and updated customer profile information.",
    pendingEndpoints: [
      "/admin/approvals/customer-edit/pending",
      "/admin/approvals/customers/edit/pending",
    ],
    emptyState: {
      title: "No customer edits waiting",
      description: "Customer profile edits will show here once they are submitted for admin review.",
    },
    errors: {
      load: "Unable to load pending customer edits. Please try again later.",
      select: "Please select a customer edit to approve or decline.",
      approve: "Unable to approve customer edit. Please try again.",
      decline: "Unable to decline customer edit. Please try again.",
      declineReason: "A decline reason is required before you can reject this customer edit.",
    },
    success: {
      approve: "Customer edit approved successfully.",
      decline: "Customer edit declined successfully.",
    },
    labels: {
      approve: "Approve Edit",
      approving: "Approving...",
      decline: "Decline Edit",
      confirmDecline: "Confirm Decline",
      declining: "Declining...",
    },
    declinePlaceholder: "Write why this customer edit should be declined.",
    columns: [
      {
        key: "customer",
        label: "Customer",
        render: ({ approval }) => {
          const customer = getCustomerData(approval);
          const fullName =
            pickValue(customer, ["fullName", "name"]) ||
            `${pickValue(customer, ["surname"], "")} ${pickValue(customer, ["firstName", "otherNames"], "")}`.trim();

          return (
            <div className="approval-primary-cell">
              <strong>{fullName || "Unnamed customer"}</strong>
              <span>{pickValue(customer, ["accountNumber", "account_number"], `Request #${approval.id}`)}</span>
            </div>
          );
        },
      },
      {
        key: "fields",
        label: "Fields Modified",
        render: ({ approval }) => {
          const editData = getEditData(approval);
          const fieldCount = Object.keys(editData).length;
          return `${fieldCount} field${fieldCount === 1 ? "" : "s"}`;
        },
      },
      {
        key: "contact",
        label: "Contact",
        render: ({ approval }) => {
          const customer = getCustomerData(approval);
          return pickValue(customer, ["phoneNumber", "telephoneNumber", "email"], "Not available");
        },
      },
      {
        key: "date",
        label: "Submitted",
        render: ({ approval }) =>
          formatDateValue(pickValue(getEditData(approval), ["submittedAt", "date", "createdAt"])),
      },
    ],
    getSummary: (approval) => {
      const customer = getCustomerData(approval);
      const fullName =
        pickValue(customer, ["fullName", "name"]) ||
        `${pickValue(customer, ["surname"], "")} ${pickValue(customer, ["firstName", "otherNames"], "")}`.trim();

      return {
        title: fullName || "Customer edit request",
        subtitle: pickValue(customer, ["accountNumber", "account_number", "email"], "Pending changes"),
        badges: [
          pickValue(customer, ["status"], "Customer"),
          `${Object.keys(getEditData(approval)).length} field${Object.keys(getEditData(approval)).length === 1 ? "" : "s"} changed`,
        ],
      };
    },
    getDetailSections: (approval) => {
      const editData = getEditData(approval);
      const customer = getCustomerData(approval);

      const basicFields = [];
      const contactFields = [];
      const complianceFields = [];

      const basicKeys = ["surname", "firstName", "otherNames", "gender", "dob", "dateOfBirth", "date_of_birth", "nationality", "occupation", "status"];
      const contactKeys = ["phoneNumber", "telephoneNumber", "telephone_number", "email", "contactAddress", "contact_address", "officeAddress", "office_address"];
      const complianceKeys = ["nin", "bvn", "nextOfKin", "next_of_kin", "nextOfKinAddress", "next_of_kin_address"];

      Object.entries(editData).forEach(([key, value]) => {
        const originalValue = pickValue(customer, [key]);
        const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());

        const field = {
          label: `${label} (New)`,
          value: value !== undefined && value !== null ? String(value) : "Not available",
          original: originalValue !== undefined && originalValue !== null ? String(originalValue) : "Not available",
        };

        if (basicKeys.includes(key)) basicFields.push(field);
        else if (contactKeys.includes(key)) contactFields.push(field);
        else if (complianceKeys.includes(key)) complianceFields.push(field);
      });

      const sections = [];

      if (basicFields.length > 0) {
        sections.push(buildKeyValueSection("Basic Information", basicFields));
      }

      if (contactFields.length > 0) {
        sections.push(buildKeyValueSection("Contact", contactFields));
      }

      if (complianceFields.length > 0) {
        sections.push(buildKeyValueSection("Compliance", complianceFields));
      }

      return sections;
    },
  };

  return <ApprovalWorkspace config={config} />;
};

export default CustomerEditApproval;
