import React from "react";
import ApprovalWorkspace from "../shared/ApprovalWorkspace";
import {
  buildKeyValueSection,
  formatDateValue,
  pickValue,
  resolveApprovalData,
  formatCurrencyValue,
} from "../shared/approvalUtils";

const getProductData = (approval) =>
  resolveApprovalData(approval, ["productData", "product", "data"]);

const getWarehouseData = (approval) =>
  resolveApprovalData(approval, ["warehouseData", "warehouse", "data"]);

const getRequestData = (approval) =>
  resolveApprovalData(approval, ["requestData", "request", "data"]);

const getOperationType = (approval) => {
  const request = getRequestData(approval);
  const type = request?.type || request?.operationType || "";

  if (type.includes("TRANSFER") || type === "WAREHOUSE_TRANSFER") return "Warehouse Transfer";
  if (type.includes("ADD") || type === "ADD_TO_WAREHOUSE") return "Add to Warehouse";
  if (type.includes("ALLOCATION") || type === "PRODUCT_ALLOCATION") return "Product Allocation";
  return "Product Movement";
};

const ProductToWarehouseApproval = () => {
  const config = {
    title: "Product To Warehouse Approval",
    description:
      "Review product movements to warehouses including transfers from inventory, inter-warehouse movements, and new product allocations. Verify quantities, destinations, and product details.",
    queueTitle: "Pending Product Movements",
    queueDescription: "Choose a product movement to inspect the details before approval.",
    detailsTitle: "Movement Review",
    detailsDescription: "Product, warehouse, and movement details for the selected request.",
    pendingEndpoints: [
      "/admin/approvals/product-to-warehouse/pending",
      "/admin/approvals/warehouse-movements/pending",
    ],
    emptyState: {
      title: "No product movements waiting",
      description: "Product to warehouse movements will show here once they are submitted for admin review.",
    },
    errors: {
      load: "Unable to load pending product movements. Please try again later.",
      select: "Please select a product movement to approve or decline.",
      approve: "Unable to approve product movement. Please try again.",
      decline: "Unable to decline product movement. Please try again.",
      declineReason: "A decline reason is required before you can reject this product movement.",
    },
    success: {
      approve: "Product movement approved successfully.",
      decline: "Product movement declined successfully.",
    },
    labels: {
      approve: "Approve Movement",
      approving: "Approving...",
      decline: "Decline Movement",
      confirmDecline: "Confirm Decline",
      declining: "Declining...",
    },
    declinePlaceholder: "Write why this product movement should be declined.",
    columns: [
      {
        key: "operation",
        label: "Operation",
        render: ({ approval }) => {
          const type = getOperationType(approval);
          return (
            <div className="approval-primary-cell">
              <strong>{type}</strong>
              <span>{`Request #${approval.id}`}</span>
            </div>
          );
        },
      },
      {
        key: "product",
        label: "Product",
        render: ({ approval }) => {
          const product = getProductData(approval);
          const name = pickValue(product, ["productName", "name", "description"]);
          const code = pickValue(product, ["productCode", "code", "sku"]);
          return code ? `${name} (${code})` : name || "Unknown product";
        },
      },
      {
        key: "warehouse",
        label: "Destination Warehouse",
        render: ({ approval }) => {
          const warehouse = getWarehouseData(approval);
          const request = getRequestData(approval);
          return pickValue(warehouse, ["warehouseName", "name"]) ||
                 pickValue(request, ["destinationWarehouse", "targetWarehouse", "warehouseName"]) ||
                 "Not specified";
        },
      },
      {
        key: "quantity",
        label: "Quantity",
        render: ({ approval }) => {
          const request = getRequestData(approval);
          const quantity = pickValue(request, ["quantity", "qty", "amount"]);
          return quantity || "Not available";
        },
      },
      {
        key: "date",
        label: "Submitted",
        render: ({ approval }) =>
          formatDateValue(pickValue(getRequestData(approval), ["createdAt", "date", "submittedAt"])),
      },
    ],
    getSummary: (approval) => {
      const product = getProductData(approval);
      const warehouse = getWarehouseData(approval);
      const request = getRequestData(approval);
      const type = getOperationType(approval);

      const productName = pickValue(product, ["productName", "name", "description"]) || "Unknown product";
      const warehouseName = pickValue(warehouse, ["warehouseName", "name"]) ||
                           pickValue(request, ["destinationWarehouse", "targetWarehouse", "warehouseName"]) ||
                           "Destination warehouse";

      return {
        title: `${type}: ${productName}`,
        subtitle: `To: ${warehouseName}`,
        badges: [
          type,
          `Qty: ${pickValue(request, ["quantity", "qty", "amount"], "N/A")}`,
        ],
      };
    },
    getDetailSections: (approval) => {
      const product = getProductData(approval);
      const warehouse = getWarehouseData(approval);
      const request = getRequestData(approval);

      return [
        buildKeyValueSection("Product Information", [
          { label: "Product Name", value: pickValue(product, ["productName", "name", "description"]) },
          { label: "Product Code", value: pickValue(product, ["productCode", "code", "sku"]) },
          { label: "Category", value: pickValue(product, ["category", "categoryName"]) },
          { label: "Unit Price", value: formatCurrencyValue(pickValue(product, ["unitPrice", "price", "cost"])) },
          { label: "Current Stock", value: pickValue(product, ["currentStock", "stock", "quantity"]) },
        ]),
        buildKeyValueSection("Movement Details", [
          { label: "Operation Type", value: getOperationType(approval) },
          { label: "Source", value: pickValue(request, ["sourceWarehouse", "origin", "fromWarehouse"], "General Inventory") },
          { label: "Destination Warehouse", value: pickValue(warehouse, ["warehouseName", "name"]) || pickValue(request, ["destinationWarehouse", "targetWarehouse", "warehouseName"]) },
          { label: "Quantity", value: pickValue(request, ["quantity", "qty", "amount"]) },
          { label: "Unit of Measure", value: pickValue(request, ["unit", "uom", "unitOfMeasure"]) },
          { label: "Total Value", value: formatCurrencyValue(pickValue(request, ["totalValue", "value", "amount"])) },
        ]),
        buildKeyValueSection("Warehouse Details", [
          { label: "Warehouse Name", value: pickValue(warehouse, ["warehouseName", "name"]) },
          { label: "Warehouse Type", value: pickValue(warehouse, ["type", "warehouseType"]) },
          { label: "Location", value: pickValue(warehouse, ["location", "address"]) },
          { label: "Manager", value: pickValue(warehouse, ["manager", "managerName", "managerEmail"]) },
        ]),
        buildKeyValueSection("Request Information", [
          { label: "Requested By", value: pickValue(request, ["requestedBy", "submittedBy", "submittedByName"]) },
          { label: "Date Submitted", value: formatDateValue(pickValue(request, ["createdAt", "date", "submittedAt"])) },
          { label: "Reason/Notes", value: pickValue(request, ["reason", "notes", "comments", "description"]) },
          { label: "Reference", value: pickValue(request, ["reference", "referenceNumber", "refNumber"]) },
        ]),
      ];
    },
  };

  return <ApprovalWorkspace config={config} />;
};

export default ProductToWarehouseApproval;
