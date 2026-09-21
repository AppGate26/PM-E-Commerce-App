import React from "react";
import ApprovalWorkspace from "../shared/ApprovalWorkspace";
import {
  buildKeyValueSection,
  formatCurrencyValue,
  formatDateValue,
  pickValue,
  resolveApprovalData,
} from "../shared/approvalUtils";

const getStockDeleteData = (approval) => resolveApprovalData(approval, ["stockData", "stock", "data"]);

const StockDeleteApproval = () => {
  const config = {
    title: "Stock Delete Approval",
    description:
      "Review delete requests against the original stock record before they are allowed through. The layout keeps stock reference, product details, and debit values together.",
    queueTitle: "Pending Stock Delete Requests",
    queueDescription: "Select a stock delete request to review the affected record and accounting impact.",
    detailsTitle: "Delete Request Review",
    detailsDescription: "Original stock record data and debit information for the selected request.",
    pendingEndpoints: ["/admin/approvals/stock-delete/pending", "/admin/approvals/stock-deletes/pending"],
    emptyState: {
      title: "No stock delete requests waiting",
      description: "Submitted stock delete requests will appear here once they are routed to admin.",
    },
    errors: {
      load: "Unable to load pending stock delete requests. Please try again later.",
      select: "Please select a stock delete request to approve or decline.",
      approve: "Unable to approve stock delete request. Please try again.",
      decline: "Unable to decline stock delete request. Please try again.",
      declineReason: "A decline reason is required before you can reject this stock delete request.",
    },
    success: {
      approve: "Stock delete request approved successfully.",
      decline: "Stock delete request declined successfully.",
    },
    labels: {
      approve: "Approve Delete",
      approving: "Approving...",
      decline: "Decline Delete",
      confirmDecline: "Confirm Decline",
      declining: "Declining...",
    },
    declinePlaceholder: "Write why this stock delete request should be declined.",
    columns: [
      {
        key: "stock",
        label: "Stock Reference",
        render: ({ approval }) => {
          const stock = getStockDeleteData(approval);
          return (
            <div className="approval-primary-cell">
              <strong>{pickValue(stock, ["stockRef", "stock_ref", "referenceNumber"], `Request #${approval.id}`)}</strong>
              <span>{pickValue(stock, ["product", "productName", "product.name"], "Product pending")}</span>
            </div>
          );
        },
      },
      {
        key: "category",
        label: "Category",
        render: ({ approval }) =>
          pickValue(getStockDeleteData(approval), ["category", "product.category"], "Not available"),
      },
      {
        key: "quantity",
        label: "Quantity",
        render: ({ approval }) =>
          pickValue(getStockDeleteData(approval), ["quantity", "quantityToDelete", "quantity_to_delete"], "Not available"),
      },
      {
        key: "amount",
        label: "Amount To Debit",
        render: ({ approval }) =>
          formatCurrencyValue(pickValue(getStockDeleteData(approval), ["amountToDebit", "amount_to_debit", "totalAmount", "total_amount"])),
      },
      {
        key: "edited",
        label: "Edited Date",
        render: ({ approval }) =>
          formatDateValue(pickValue(getStockDeleteData(approval), ["editedDate", "edited_date", "updatedAt"])),
      },
    ],
    getSummary: (approval) => {
      const stock = getStockDeleteData(approval);
      return {
        title: pickValue(stock, ["stockRef", "stock_ref", "referenceNumber"], "Stock delete request"),
        subtitle: pickValue(stock, ["product", "productName", "product.name"], "Product pending"),
        badges: [
          pickValue(stock, ["category", "product.category"], "Stock"),
          `${pickValue(stock, ["quantity", "quantityToDelete", "quantity_to_delete"], "0")} units`,
        ],
      };
    },
    getDetailSections: (approval) => {
      const stock = getStockDeleteData(approval);
      return [
        buildKeyValueSection("Stock Record", [
          { label: "Stock Ref", value: pickValue(stock, ["stockRef", "stock_ref", "referenceNumber"]) },
          { label: "Supplier ID", value: pickValue(stock, ["supplierId", "supplier_id", "supplier.id"]) },
          { label: "Product", value: pickValue(stock, ["product", "productName", "product.name"]) },
          { label: "Description", value: pickValue(stock, ["description"]) },
          { label: "Category", value: pickValue(stock, ["category", "product.category"]) },
          { label: "Sub Category", value: pickValue(stock, ["subCategory", "sub_category", "product.subCategory"]) },
        ]),
        buildKeyValueSection("Financial Impact", [
          { label: "Quantity", value: pickValue(stock, ["quantity", "quantityToDelete", "quantity_to_delete"]) },
          { label: "Unit Price", value: formatCurrencyValue(pickValue(stock, ["unitPrice", "unit_price", "price"])) },
          { label: "Amount To Debit", value: formatCurrencyValue(pickValue(stock, ["amountToDebit", "amount_to_debit", "totalAmount", "total_amount"])) },
          { label: "Account To Credit", value: pickValue(stock, ["accountToCredit", "account_to_credit", "glAccount", "gl_account"]) },
          { label: "Generated Date", value: formatDateValue(pickValue(stock, ["generatedDate", "generated_date", "createdAt"])) },
          { label: "Edited Date", value: formatDateValue(pickValue(stock, ["editedDate", "edited_date", "updatedAt"])) },
        ]),
      ];
    },
  };

  return <ApprovalWorkspace config={config} />;
};

export default StockDeleteApproval;
