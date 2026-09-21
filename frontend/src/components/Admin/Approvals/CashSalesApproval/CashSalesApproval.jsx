import React from "react";
import ApprovalWorkspace from "../shared/ApprovalWorkspace";
import {
  buildKeyValueSection,
  formatCurrencyValue,
  formatDateValue,
  pickValue,
  resolveApprovalData,
} from "../shared/approvalUtils";

const getSaleData = (approval) => resolveApprovalData(approval, ["saleData", "cashSale", "sale", "data"]);

const getSaleItems = (approval) => {
  const sale = getSaleData(approval);
  return sale.items || sale.products || sale.saleItems || [];
};

const CashSalesApproval = () => {
  const config = {
    title: "Cash Sales Approval",
    description:
      "Use this queue to validate walk-in and cash sales requests before they are confirmed. The standard review panel keeps customer, amount, and line item details easy to read.",
    queueTitle: "Pending Cash Sales",
    queueDescription: "Open any pending cash sale to review the transaction summary and posted values.",
    detailsTitle: "Sale Review",
    detailsDescription: "Customer, amount, and submitted line items for the selected sale.",
    pendingEndpoints: ["/admin/approvals/cash-sales/pending"],
    emptyState: {
      title: "No cash sales waiting",
      description: "Cash sale approval requests will appear here once a transaction is submitted for review.",
    },
    errors: {
      load: "Unable to load pending cash sales. Please try again later.",
      select: "Please select a cash sale to approve or decline.",
      approve: "Unable to approve cash sale. Please try again.",
      decline: "Unable to decline cash sale. Please try again.",
      declineReason: "A decline reason is required before you can reject this cash sale.",
    },
    success: {
      approve: "Cash sale approved successfully.",
      decline: "Cash sale declined successfully.",
    },
    labels: {
      approve: "Approve Sale",
      approving: "Approving...",
      decline: "Decline Sale",
      confirmDecline: "Confirm Decline",
      declining: "Declining...",
    },
    declinePlaceholder: "Write why this cash sale should be declined.",
    columns: [
      {
        key: "sale",
        label: "Sale",
        render: ({ approval }) => {
          const sale = getSaleData(approval);
          const saleRef = pickValue(sale, ["saleRef", "sale_ref", "reference", "id"], `Sale #${approval.id}`);
          const customer = pickValue(
            sale,
            ["customerName", "customer.name", "customer.fullName", "accountName"],
            "Walk-in customer"
          );

          return (
            <div className="approval-primary-cell">
              <strong>{saleRef}</strong>
              <span>{customer}</span>
            </div>
          );
        },
      },
      {
        key: "amount",
        label: "Amount",
        render: ({ approval }) =>
          formatCurrencyValue(
            pickValue(getSaleData(approval), ["totalAmount", "amountPaid", "amount", "grandTotal"])
          ),
      },
      {
        key: "date",
        label: "Date",
        render: ({ approval }) =>
          formatDateValue(pickValue(getSaleData(approval), ["saleDate", "date", "createdAt"])),
      },
      {
        key: "channel",
        label: "Channel",
        render: ({ approval }) =>
          pickValue(getSaleData(approval), ["paymentMethod", "saleChannel", "channel"], "Cash"),
      },
      {
        key: "items",
        label: "Items",
        render: ({ approval }) => `${getSaleItems(approval).length || 0} item(s)`,
      },
    ],
    getSummary: (approval) => {
      const sale = getSaleData(approval);
      return {
        title: pickValue(sale, ["saleRef", "sale_ref", "reference"], "Cash sale request"),
        subtitle: pickValue(
          sale,
          ["customerName", "customer.name", "customer.fullName", "accountName"],
          "Walk-in customer"
        ),
        badges: [
          pickValue(sale, ["paymentMethod", "saleChannel", "channel"], "Cash"),
          formatCurrencyValue(pickValue(sale, ["totalAmount", "amountPaid", "amount", "grandTotal"])),
        ],
      };
    },
    getDetailSections: (approval) => {
      const sale = getSaleData(approval);

      return [
        buildKeyValueSection("Customer Details", [
          { label: "Customer", value: pickValue(sale, ["customerName", "customer.name", "customer.fullName", "accountName"]) },
          { label: "Account Number", value: pickValue(sale, ["accountNumber", "customer.accountNumber"]) },
          { label: "Phone", value: pickValue(sale, ["phoneNumber", "customer.phoneNumber"]) },
          { label: "Date", value: formatDateValue(pickValue(sale, ["saleDate", "date", "createdAt"])) },
        ]),
        buildKeyValueSection("Transaction Details", [
          { label: "Reference", value: pickValue(sale, ["saleRef", "sale_ref", "reference"]) },
          { label: "Amount", value: formatCurrencyValue(pickValue(sale, ["totalAmount", "amountPaid", "amount", "grandTotal"])) },
          { label: "Payment Method", value: pickValue(sale, ["paymentMethod", "saleChannel", "channel"], "Cash") },
          { label: "Posted By", value: pickValue(sale, ["postedBy", "createdBy", "user.name"]) },
          { label: "Description", value: pickValue(sale, ["description", "remarks", "narration"]) },
        ]),
      ];
    },
    getDetailTable: (approval) => ({
      title: "Line Items",
      rows: getSaleItems(approval),
      columns: [
        {
          key: "sn",
          label: "S/N",
          render: ({ index }) => index + 1,
        },
        {
          key: "item",
          label: "Item",
          render: ({ row }) => pickValue(row, ["productName", "product.name", "description"], "Not available"),
        },
        {
          key: "qty",
          label: "Quantity",
          render: ({ row }) => pickValue(row, ["quantity"], "Not available"),
        },
        {
          key: "price",
          label: "Unit Price",
          render: ({ row }) => formatCurrencyValue(pickValue(row, ["unitPrice", "price"])),
        },
        {
          key: "total",
          label: "Total",
          render: ({ row }) =>
            formatCurrencyValue(
              pickValue(row, ["totalAmount", "amount"], Number(pickValue(row, ["quantity"], 0)) * Number(pickValue(row, ["unitPrice", "price"], 0)))
            ),
        },
      ],
    }),
  };

  return <ApprovalWorkspace config={config} />;
};

export default CashSalesApproval;
