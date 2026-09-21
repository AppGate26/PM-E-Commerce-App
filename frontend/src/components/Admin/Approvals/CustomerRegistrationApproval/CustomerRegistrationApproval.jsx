import React from "react";
import ApprovalWorkspace from "../shared/ApprovalWorkspace";
import {
  buildKeyValueSection,
  formatDateValue,
  pickValue,
  resolveApprovalData,
} from "../shared/approvalUtils";

const getCustomerData = (approval) =>
  resolveApprovalData(approval, ["customerData", "customer", "data"]);

const CustomerRegistrationApproval = () => {
  const config = {
    title: "Customer Registration Approval",
    description:
      "Review new customer registrations in a cleaner standard layout. Identity, contact, and compliance fields are grouped so admin approval is faster and easier to verify.",
    queueTitle: "Pending Customer Registrations",
    queueDescription: "Choose a customer registration to inspect the submitted profile before approval.",
    detailsTitle: "Registration Review",
    detailsDescription: "Identity, address, and compliance data for the selected customer request.",
    pendingEndpoints: [
      "/admin/approvals/customers/pending",
      "/admin/approvals/customer-registration/pending",
    ],
    emptyState: {
      title: "No customer registrations waiting",
      description: "New customer registrations will show here once they are submitted for admin review.",
    },
    errors: {
      load: "Unable to load pending customer registrations. Please try again later.",
      select: "Please select a customer registration to approve or decline.",
      approve: "Unable to approve customer registration. Please try again.",
      decline: "Unable to decline customer registration. Please try again.",
      declineReason: "A decline reason is required before you can reject this customer registration.",
    },
    success: {
      approve: "Customer registration approved successfully.",
      decline: "Customer registration declined successfully.",
    },
    labels: {
      approve: "Approve Registration",
      approving: "Approving...",
      decline: "Decline Registration",
      confirmDecline: "Confirm Decline",
      declining: "Declining...",
    },
    declinePlaceholder: "Write why this customer registration should be declined.",
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
        key: "contact",
        label: "Contact",
        render: ({ approval }) =>
          pickValue(getCustomerData(approval), ["phoneNumber", "telephoneNumber", "email"], "Not available"),
      },
      {
        key: "identity",
        label: "Identity",
        render: ({ approval }) =>
          pickValue(getCustomerData(approval), ["nin", "bvn"], "Not available"),
      },
      {
        key: "nationality",
        label: "Nationality",
        render: ({ approval }) =>
          pickValue(getCustomerData(approval), ["nationality"], "Not available"),
      },
      {
        key: "date",
        label: "Submitted",
        render: ({ approval }) =>
          formatDateValue(pickValue(getCustomerData(approval), ["createdAt", "date", "dob"])),
      },
    ],
    getSummary: (approval) => {
      const customer = getCustomerData(approval);
      const fullName =
        pickValue(customer, ["fullName", "name"]) ||
        `${pickValue(customer, ["surname"], "")} ${pickValue(customer, ["firstName", "otherNames"], "")}`.trim();

      return {
        title: fullName || "Customer registration request",
        subtitle: pickValue(customer, ["accountNumber", "account_number", "email"], "Pending profile"),
        badges: [
          pickValue(customer, ["nationality"], "Customer"),
          pickValue(customer, ["occupation"], "Pending registration"),
        ],
      };
    },
    getDetailSections: (approval) => {
      const customer = getCustomerData(approval);

      return [
        buildKeyValueSection("Identity", [
          { label: "Account Number", value: pickValue(customer, ["accountNumber", "account_number"]) },
          { label: "Surname", value: pickValue(customer, ["surname"]) },
          { label: "Other Names", value: pickValue(customer, ["firstName", "otherNames", "other_names"]) },
          { label: "Gender", value: pickValue(customer, ["gender"]) },
          { label: "Date Of Birth", value: formatDateValue(pickValue(customer, ["dob", "dateOfBirth", "date_of_birth"])) },
          { label: "Nationality", value: pickValue(customer, ["nationality"]) },
        ]),
        buildKeyValueSection("Contact", [
          { label: "Telephone", value: pickValue(customer, ["phoneNumber", "telephoneNumber", "telephone_number"]) },
          { label: "Email", value: pickValue(customer, ["email"]) },
          { label: "Contact Address", value: pickValue(customer, ["contactAddress", "contact_address"]) },
          { label: "Office Address", value: pickValue(customer, ["officeAddress", "office_address"]) },
          { label: "Occupation", value: pickValue(customer, ["occupation"]) },
        ]),
        buildKeyValueSection("Compliance", [
          { label: "NIN", value: pickValue(customer, ["nin"]) },
          { label: "BVN", value: pickValue(customer, ["bvn"]) },
          { label: "Next Of Kin", value: pickValue(customer, ["nextOfKin", "next_of_kin"]) },
          { label: "Next Of Kin Address", value: pickValue(customer, ["nextOfKinAddress", "next_of_kin_address"]) },
          { label: "Passport", value: pickValue(customer, ["passport", "passportImage", "passport_image"]) ? "Attached" : "Not available" },
          { label: "Signature", value: pickValue(customer, ["signature", "scanInSignature", "scan_in_signature"]) ? "Attached" : "Not available" },
        ]),
      ];
    },
  };

  return <ApprovalWorkspace config={config} />;
};

export default CustomerRegistrationApproval;
