import React from "react";
import ApprovalWorkspace from "../shared/ApprovalWorkspace";
import {
  buildKeyValueSection,
  pickValue,
  resolveApprovalData,
} from "../shared/approvalUtils";

const getSupplierData = (approval) =>
  resolveApprovalData(approval, ["supplierData", "supplier", "data"]);

const getSupplierSubmittedDate = (approval, supplier) =>
  pickValue(
    supplier,
    ["submittedAt", "createdAt", "dateCreated"],
    pickValue(approval, ["createdAt", "requestDate", "submittedAt"], "Not available")
  );

const SupplierRegApproval = () => {
  const config = {
    className: "supplier-approval-workspace",
    title: "Supplier Registration Approval",
    description:
      "Review supplier onboarding requests before they become active vendor records.",
    queueTitle: "Pending Supplier Registrations",
    queueDescription: "Check company identity, contact details, tax reference, and terms before saving the supplier.",
    detailsTitle: "Supplier Review",
    detailsDescription: "Supplier registration details for the selected request.",
    tableActionLabel: "Save",
    pendingEndpoints: [
      "/admin/approvals/suppliers/pending",
      "/admin/approvals/supplier-registration/pending",
    ],
    emptyState: {
      title: "No supplier registrations waiting",
      description: "Supplier registrations will appear here once they are submitted for admin review.",
    },
    errors: {
      load: "Unable to load pending supplier registrations. Please try again later.",
      select: "Please select a supplier registration to approve or decline.",
      approve: "Unable to approve supplier registration. Please try again.",
      decline: "Unable to decline supplier registration. Please try again.",
      declineReason: "A decline reason is required before you can reject this supplier registration.",
    },
    success: {
      approve: "Supplier registration approved successfully.",
      decline: "Supplier registration declined successfully.",
    },
    labels: {
      approve: "Approve Supplier",
      approving: "Approving...",
      decline: "Decline Supplier",
      confirmDecline: "Confirm Decline",
      declining: "Declining...",
    },
    declinePlaceholder: "Write why this supplier registration should be declined.",
    columns: [
      {
        key: "supplier",
        label: "Company",
        render: ({ approval }) => {
          const supplier = getSupplierData(approval);
          return (
            <div className="approval-primary-cell">
              <strong>{pickValue(supplier, ["companyName", "customerName"], "Supplier registration")}</strong>
              <span>{pickValue(supplier, ["taxIdNumber", "taxId", "tax_id_number"], `Request #${approval.id}`)}</span>
            </div>
          );
        },
      },
      {
        key: "contact",
        label: "Contact Details",
        render: ({ approval }) => {
          const supplier = getSupplierData(approval);
          return (
            <div className="approval-primary-cell supplier-contact-cell">
              <strong>{pickValue(supplier, ["contactPersonName", "contactName"], "Not available")}</strong>
              <span>{pickValue(supplier, ["contactEmail", "contact_email", "email"], "No email")}</span>
            </div>
          );
        },
      },
      {
        key: "phone",
        label: "Phone",
        render: ({ approval }) =>
          pickValue(getSupplierData(approval), ["contactPhoneNumber", "contactPhoneNo", "contact_phone_number"], "Not available"),
      },
      {
        key: "terms",
        label: "Terms",
        render: ({ approval }) => {
          const supplier = getSupplierData(approval);
          return (
            <div className="supplier-terms-stack">
              <span>{pickValue(supplier, ["paymentTerms", "payment_terms"], "Payment pending")}</span>
              <em>{pickValue(supplier, ["deliveryTerms", "delivery_terms"], "Delivery pending")}</em>
            </div>
          );
        },
      },
      {
        key: "submitted",
        label: "Submitted",
        render: ({ approval }) => {
          const supplier = getSupplierData(approval);
          return getSupplierSubmittedDate(approval, supplier);
        },
      },
    ],
    getSummary: (approval) => {
      const supplier = getSupplierData(approval);
      return {
        title: pickValue(supplier, ["companyName", "customerName"], "Supplier registration request"),
        subtitle: pickValue(supplier, ["contactEmail", "contact_email", "email"], "Pending supplier"),
        badges: [
          pickValue(supplier, ["paymentTerms", "payment_terms"], "Payment terms pending"),
          pickValue(supplier, ["deliveryTerms", "delivery_terms"], "Delivery terms pending"),
        ],
      };
    },
    getDetailSections: (approval) => {
      const supplier = getSupplierData(approval);
      return [
        buildKeyValueSection("Company Details", [
          { label: "Supplier ID", value: pickValue(supplier, ["supplierId", "supplier_id", "id"]) },
          { label: "Company Name", value: pickValue(supplier, ["companyName", "customerName", "company_name"]) },
          { label: "Contact Person", value: pickValue(supplier, ["contactPersonName", "contactName", "contact_person_name"]) },
          { label: "Contact Email", value: pickValue(supplier, ["contactEmail", "contact_email", "email"]) },
          { label: "Phone Number", value: pickValue(supplier, ["contactPhoneNumber", "contactPhoneNo", "contact_phone_number"]) },
          { label: "Contact Address", value: pickValue(supplier, ["contactPersonAddress", "address", "contact_person_address"]) },
        ]),
        buildKeyValueSection("Commercial Terms", [
          { label: "Tax ID", value: pickValue(supplier, ["taxIdNumber", "taxId", "tax_id_number", "tax_id"]) },
          { label: "Payment Terms", value: pickValue(supplier, ["paymentTerms", "payment_terms"]) },
          { label: "Delivery Terms", value: pickValue(supplier, ["deliveryTerms", "delivery_terms"]) },
          { label: "Passport", value: pickValue(supplier, ["passportImage", "passport", "passport_image"]) ? "Attached" : "Not available" },
        ]),
      ];
    },
  };

  return <ApprovalWorkspace config={config} />;
};

export default SupplierRegApproval;
