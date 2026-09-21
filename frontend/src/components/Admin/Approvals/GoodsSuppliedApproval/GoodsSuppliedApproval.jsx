import React from "react";
import ApprovalWorkspace from "../shared/ApprovalWorkspace";
import {
  buildKeyValueSection,
  formatCurrencyValue,
  formatDateValue,
  pickValue,
  resolveApprovalData,
} from "../shared/approvalUtils";

const getGoodsData = (approval) => resolveApprovalData(approval, ["goodsData", "goods", "data"]);

const getGoodsItems = (approval) => {
  const goods = getGoodsData(approval);
  return goods.items || goods.goodsItems || goods.products || [];
};

const GoodsSuppliedApproval = () => {
  const config = {
    title: "Goods Supplied Approval",
    description:
      "Review goods supplied requests in a standard card-and-table layout. Supplier, shipment, and line item values are grouped clearly before admin approval.",
    queueTitle: "Pending Goods Supplied",
    queueDescription: "Open a request to inspect delivery references, warehouse details, and item rows.",
    detailsTitle: "Supply Review",
    detailsDescription: "Supplier and line-item details for the selected goods supplied request.",
    pendingEndpoints: ["/admin/approvals/goods-supplied/pending"],
    emptyState: {
      title: "No goods supplied requests waiting",
      description: "Submitted goods supplied requests will appear here once they reach the admin queue.",
    },
    errors: {
      load: "Unable to load pending goods supplied requests. Please try again later.",
      select: "Please select a goods supplied request to approve or decline.",
      approve: "Unable to approve goods supplied request. Please try again.",
      decline: "Unable to decline goods supplied request. Please try again.",
      declineReason: "A decline reason is required before you can reject this goods supplied request.",
    },
    success: {
      approve: "Goods supplied request approved successfully.",
      decline: "Goods supplied request declined successfully.",
    },
    labels: {
      approve: "Approve Request",
      approving: "Approving...",
      decline: "Decline Request",
      confirmDecline: "Confirm Decline",
      declining: "Declining...",
    },
    declinePlaceholder: "Write why this goods supplied request should be declined.",
    columns: [
      {
        key: "invoice",
        label: "Invoice",
        render: ({ approval }) => {
          const goods = getGoodsData(approval);
          return (
            <div className="approval-primary-cell">
              <strong>{pickValue(goods, ["invoiceNumber", "invoice_number"], `Request #${approval.id}`)}</strong>
              <span>{pickValue(goods, ["supplier.companyName", "supplier.name", "supplierId", "supplier_id"], "Supplier pending")}</span>
            </div>
          );
        },
      },
      {
        key: "warehouse",
        label: "Warehouse",
        render: ({ approval }) =>
          pickValue(getGoodsData(approval), ["warehouseName", "warehouse.name"], "Not available"),
      },
      {
        key: "date",
        label: "Date",
        render: ({ approval }) =>
          formatDateValue(pickValue(getGoodsData(approval), ["date", "supplyDate", "supply_date"])),
      },
      {
        key: "items",
        label: "Items",
        render: ({ approval }) => `${getGoodsItems(approval).length || 0} row(s)`,
      },
      {
        key: "vehicle",
        label: "Vehicle",
        render: ({ approval }) =>
          pickValue(getGoodsData(approval), ["vehicleNumber", "vehicle_number"], "Not available"),
      },
    ],
    getSummary: (approval) => {
      const goods = getGoodsData(approval);
      return {
        title: pickValue(goods, ["invoiceNumber", "invoice_number"], "Goods supplied request"),
        subtitle: pickValue(goods, ["supplier.companyName", "supplier.name", "supplierId", "supplier_id"], "Supplier pending"),
        badges: [
          pickValue(goods, ["warehouseName", "warehouse.name"], "Warehouse pending"),
          `${getGoodsItems(approval).length || 0} items`,
        ],
      };
    },
    getDetailSections: (approval) => {
      const goods = getGoodsData(approval);
      return [
        buildKeyValueSection("Supply Details", [
          { label: "Supplier ID", value: pickValue(goods, ["supplierId", "supplier_id", "supplier.id"]) },
          { label: "Date", value: formatDateValue(pickValue(goods, ["date", "supplyDate", "supply_date"])) },
          { label: "Vehicle Number", value: pickValue(goods, ["vehicleNumber", "vehicle_number"]) },
          { label: "Warehouse", value: pickValue(goods, ["warehouseName", "warehouse.name"]) },
        ]),
        buildKeyValueSection("Document References", [
          { label: "Invoice Number", value: pickValue(goods, ["invoiceNumber", "invoice_number"]) },
          { label: "LPO Number", value: pickValue(goods, ["lpoNumber", "lpo_number"]) },
          { label: "Waybill Number", value: pickValue(goods, ["waybillNumber", "waybill_number"]) },
          { label: "Item GL Code", value: pickValue(goods, ["itemGlCode", "item_gl_code"]) },
        ]),
      ];
    },
    getDetailTable: (approval) => ({
      title: "Supplied Items",
      rows: getGoodsItems(approval),
      columns: [
        { key: "sn", label: "S/N", render: ({ index }) => index + 1 },
        {
          key: "category",
          label: "Category",
          render: ({ row }) => pickValue(row, ["category", "product.category"], "Not available"),
        },
        {
          key: "description",
          label: "Description",
          render: ({ row }) => pickValue(row, ["description", "product.name", "productName"], "Not available"),
        },
        {
          key: "cost",
          label: "Cost Unit",
          render: ({ row }) => formatCurrencyValue(pickValue(row, ["costUnit", "cost_unit", "unitCost", "unitPrice", "unit_price"])),
        },
        {
          key: "amount",
          label: "Amount",
          render: ({ row }) =>
            formatCurrencyValue(
              pickValue(row, ["amount", "totalAmount", "total_amount"], Number(pickValue(row, ["quantity"], 0)) * Number(pickValue(row, ["unitPrice", "unit_price"], 0)))
            ),
        },
        {
          key: "gl",
          label: "GL Account",
          render: ({ row }) => pickValue(row, ["glAccount", "gl_account", "glAccountToCredit"], "Not available"),
        },
      ],
    }),
  };

  return <ApprovalWorkspace config={config} />;
};

export default GoodsSuppliedApproval;
