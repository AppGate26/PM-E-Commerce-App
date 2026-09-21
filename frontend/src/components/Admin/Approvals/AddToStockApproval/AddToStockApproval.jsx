import React from "react";
import ApprovalWorkspace from "../shared/ApprovalWorkspace";
import {
  buildKeyValueSection,
  formatCurrencyValue,
  formatDateValue,
  pickValue,
  resolveApprovalData,
} from "../shared/approvalUtils";

const getStockData = (approval) => resolveApprovalData(approval, ["stockData", "stock", "data"]);

const AddToStockApproval = () => {
  const config = {
    title: "Add To Stock Approval",
    description:
      "Review incoming stock additions before they move forward. Each request shows the submitted item, quantity, pricing, and ledger target in one standard workspace.",
    queueTitle: "Pending Stock Requests",
    queueDescription: "Select any request to inspect the stock details and approve or decline it.",
    detailsTitle: "Request Details",
    detailsDescription: "Submitted stock information and financial values for the selected request.",
    pendingEndpoints: ["/admin/approvals/stock/pending", "/admin/approvals/stocks/pending"],
    emptyState: {
      title: "No stock additions waiting",
      description: "New add-to-stock requests will appear here as soon as they are submitted.",
    },
    errors: {
      load: "Unable to load pending stock additions. Please try again later.",
      select: "Please select a stock addition to approve or decline.",
      approve: "Unable to approve stock addition. Please try again.",
      decline: "Unable to decline stock addition. Please try again.",
      declineReason: "A decline reason is required before you can reject this stock addition.",
    },
    success: {
      approve: "Stock addition approved successfully.",
      decline: "Stock addition declined successfully.",
    },
    labels: {
      approve: "Approve Request",
      approving: "Approving...",
      decline: "Decline Request",
      confirmDecline: "Confirm Decline",
      declining: "Declining...",
    },
    declinePlaceholder: "Write why this stock addition should be declined.",
    columns: [
      {
        key: "request",
        label: "Request",
        render: ({ approval }) => {
          const stock = getStockData(approval);
          const product = pickValue(stock, ["productName", "product", "description"], "Unknown product");
          const reference = pickValue(stock, ["stockRef", "stock_ref", "referenceNumber"], `Request #${approval.id}`);

          return (
            <div className="approval-primary-cell">
              <strong>{product}</strong>
              <span>{reference}</span>
            </div>
          );
        },
      },
      {
        key: "category",
        label: "Category",
        render: ({ approval }) => {
          const stock = getStockData(approval);
          return pickValue(stock, ["categoryName", "category", "subCategoryName", "subCategory"], "Not available");
        },
      },
      {
        key: "quantity",
        label: "Quantity",
        render: ({ approval }) => pickValue(getStockData(approval), ["quantity"], "Not available"),
      },
      {
        key: "unitPrice",
        label: "Unit Price",
        render: ({ approval }) =>
          formatCurrencyValue(pickValue(getStockData(approval), ["unitPrice", "price"])),
      },
      {
        key: "account",
        label: "Account To Credit",
        render: ({ approval }) =>
          pickValue(getStockData(approval), ["accountToCredit", "glAccount", "account_name"], "Not available"),
      },
    ],
    getSummary: (approval) => {
      const stock = getStockData(approval);
      return {
        title: pickValue(stock, ["productName", "product"], "Stock addition request"),
        subtitle: `Submitted ${formatDateValue(pickValue(stock, ["createdAt", "date", "generatedDate"]))}`,
        badges: [
          pickValue(stock, ["categoryName", "category"], "Stock"),
          `${pickValue(stock, ["quantity"], "0")} units`,
        ],
      };
    },
    getDetailSections: (approval) => {
      const stock = getStockData(approval);
      const quantity = Number(pickValue(stock, ["quantity"], 0));
      const unitPrice = Number(pickValue(stock, ["unitPrice", "price"], 0));

      return [
        buildKeyValueSection("Stock Information", [
          { label: "Reference", value: pickValue(stock, ["stockRef", "stock_ref", "referenceNumber"]) },
          { label: "Product", value: pickValue(stock, ["productName", "product"]) },
          { label: "Category", value: pickValue(stock, ["categoryName", "category"]) },
          { label: "Sub Category", value: pickValue(stock, ["subCategoryName", "subCategory"]) },
          { label: "Description", value: pickValue(stock, ["description"]) },
          { label: "Requested On", value: formatDateValue(pickValue(stock, ["createdAt", "date", "generatedDate"])) },
        ]),
        buildKeyValueSection("Financial Details", [
          { label: "Quantity", value: pickValue(stock, ["quantity"], "Not available") },
          { label: "Unit Price", value: formatCurrencyValue(pickValue(stock, ["unitPrice", "price"])) },
          { label: "Total Balance", value: formatCurrencyValue(quantity * unitPrice) },
          { label: "Account To Credit", value: pickValue(stock, ["accountToCredit", "glAccount"]) },
        ]),
      ];
    },
  };

  return <ApprovalWorkspace config={config} />;
};

export default AddToStockApproval;
