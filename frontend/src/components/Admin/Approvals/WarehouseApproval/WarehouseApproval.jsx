import React, { useEffect, useState } from "react";
import ApprovalWorkspace from "../shared/ApprovalWorkspace";
import {
  buildKeyValueSection,
  formatDateValue,
  pickValue,
  resolveApprovalData,
} from "../shared/approvalUtils";
import { approveMovement, rejectMovement, fetchWarehouses } from "../../../../lib/warehouseApi";
import { fetchBranches } from "../../../../lib/branchApi";
import { fetchInventoryProducts } from "../../../../lib/inventoryApi";
import { fetchAdminUsers } from "../../../../lib/adminApi";

// Single backend queue (WarehouseController) returns all PENDING movements; each admin
// screen filters to the movement types it represents.
const WAREHOUSE_PENDING_ENDPOINT = "/admin/warehouses/movements/pending";

const MOVEMENT_TYPE_FILTERS = {
  productToStock: ["STOCK_ALLOCATION", "PRODUCT_RECEIPT"],
  productSwap: ["SWAP"],
  productTransfer: ["TRANSFER"],
  quarantineProduct: ["QUARANTINE_IN", "QUARANTINE_OUT"],
  stockBalance: null, // null => show every pending movement (review view)
  attachManager: [], // not movement-based; no backend queue yet
  warehouseStatus: [], // not movement-based; no backend queue yet
};

const isMovementBased = (type) => {
  const filter = MOVEMENT_TYPE_FILTERS[type];
  return filter === null || (Array.isArray(filter) && filter.length > 0);
};

const warehouseApprovalConfigs = {
  productToStock: {
    title: "Product Receipt & Stock Approval",
    description: "Approve or reject product receipts into warehouses and product-to-stock allocations before balances change.",
    queueTitle: "Pending Product Receipts & Stock Allocations",
    queueDescription: "Review product, branch, warehouse, and stock/quantity details.",
    pendingEndpoints: [
      "/admin/approvals/warehouse/product-to-stock/pending",
      "/admin/approvals/product-to-stock/pending",
    ],
    emptyTitle: "No product-to-stock request waiting",
    emptyDescription: "Warehouse product-to-stock approvals will appear here when submitted.",
  },
  productSwap: {
    title: "Product Swap Approval",
    description: "Approve or reject product swap requests between sending and receiving warehouses.",
    queueTitle: "Pending Product Swaps",
    queueDescription: "Review the product, sender warehouse, receiver warehouse, quantity, and ledger direction.",
    pendingEndpoints: [
      "/admin/approvals/warehouse/product-swap/pending",
      "/admin/approvals/product-swap/pending",
    ],
    emptyTitle: "No product swap request waiting",
    emptyDescription: "Product swap approvals will appear here when warehouse submits a request.",
  },
  productTransfer: {
    title: "Product Transfer Approval",
    description: "Approve or reject warehouse-to-warehouse product transfer requests.",
    queueTitle: "Pending Product Transfers",
    queueDescription: "Review movement type, reference number, quantity in/out, and warehouse balances.",
    pendingEndpoints: [
      "/admin/approvals/warehouse/product-transfer/pending",
      "/admin/approvals/product-transfer/pending",
    ],
    emptyTitle: "No product transfer request waiting",
    emptyDescription: "Product transfer approvals will appear here when submitted.",
  },
  quarantineProduct: {
    title: "Quarantine Product Approval",
    description: "Approve or reject quarantine product movement into or out of custody.",
    queueTitle: "Pending Quarantine Product",
    queueDescription: "Review quarantine flow, product details, quantity, and receiving/custodian warehouse.",
    pendingEndpoints: [
      "/admin/approvals/warehouse/quarantine-product/pending",
      "/admin/approvals/quarantine-product/pending",
    ],
    emptyTitle: "No quarantine product request waiting",
    emptyDescription: "Quarantine movement approvals will appear here when warehouse submits them.",
  },
  attachManager: {
    title: "Attach Warehouse Manager Approval",
    description: "Approve or reject requests to attach a warehouse manager to a warehouse.",
    queueTitle: "Pending Manager Attachments",
    queueDescription: "Review manager, branch, and warehouse assignment details.",
    pendingEndpoints: [
      "/admin/approvals/warehouse/attach-manager/pending",
      "/admin/approvals/attach-warehouse-manager/pending",
    ],
    emptyTitle: "No warehouse manager attachment waiting",
    emptyDescription: "Warehouse manager attachment approvals will appear here when submitted.",
  },
  warehouseStatus: {
    title: "Warehouse Status Approval",
    description: "Approve or reject warehouse activation and deactivation requests.",
    queueTitle: "Pending Warehouse Status Changes",
    queueDescription: "Review warehouse, requested status, branch, and manager details.",
    pendingEndpoints: [
      "/admin/approvals/warehouse/status/pending",
      "/admin/approvals/warehouse-activation/pending",
    ],
    emptyTitle: "No warehouse status request waiting",
    emptyDescription: "Activate/deactivate warehouse approvals will appear here when requested.",
  },
  stockBalance: {
    title: "Warehouse Stock Balance Review",
    description: "Review stock balance requests across all warehouses before Super Admin approval.",
    queueTitle: "Pending Stock Balance Reviews",
    queueDescription: "Review warehouse, branch, product, quantity, and balance-after details.",
    pendingEndpoints: [
      "/admin/approvals/warehouse/stock-balance/pending",
      "/admin/approvals/warehouse-stock-balance/pending",
    ],
    emptyTitle: "No stock balance review waiting",
    emptyDescription: "Stock balance review requests will appear here when submitted.",
  },
};

// Builds an id -> record lookup map, skipping rows with no id.
const indexById = (rows = []) =>
  Object.fromEntries(rows.filter((row) => row?.id != null).map((row) => [String(row.id), row]));

const resolveManagerName = (user) => {
  if (!user) return undefined;
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.email || undefined;
};

const WarehouseApproval = ({ type }) => {
  const setup = warehouseApprovalConfigs[type] || warehouseApprovalConfigs.productToStock;
  const movementFilter = MOVEMENT_TYPE_FILTERS[type];
  const movementBased = isMovementBased(type);

  // Movement rows from WarehouseController only carry raw foreign-key ids
  // (warehouseId, productId, branchId, ...) - no denormalized names. Load the
  // referenced directories once so getWarehouseData can resolve them to the
  // human-readable fields the detail/summary views expect (warehouseName,
  // branchName, productName, managerName, storageCapacity).
  const [lookups, setLookups] = useState({ warehouses: {}, branches: {}, products: {}, users: {} });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [warehouses, branches, products, users] = await Promise.all([
        fetchWarehouses().catch(() => []),
        fetchBranches().catch(() => []),
        fetchInventoryProducts().catch(() => []),
        fetchAdminUsers().catch(() => []),
      ]);

      if (cancelled) return;

      setLookups({
        warehouses: indexById(warehouses),
        branches: indexById(branches),
        products: indexById(products),
        users: indexById(users),
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const getWarehouseData = (approval) => {
    const raw = resolveApprovalData(approval, [
      "warehouseData",
      "warehouse",
      "stockData",
      "transferData",
      "request",
      "data",
    ]);

    const warehouse = lookups.warehouses[String(raw.warehouseId)];
    const receiverWarehouse = lookups.warehouses[String(raw.receiverWarehouseId)];
    const branch = lookups.branches[String(raw.branchId ?? warehouse?.branchId)];
    const product = lookups.products[String(raw.productId)];
    const manager = lookups.users[String(warehouse?.branchManagerId)];

    return {
      ...raw,
      warehouseName: raw.warehouseName || warehouse?.warehouseName,
      receiverWarehouse: raw.receiverWarehouse || receiverWarehouse?.warehouseName,
      branchName: raw.branchName || branch?.branchName,
      productName: raw.productName || product?.productName || product?.name,
      productCategory:
        raw.productCategory ||
        (typeof product?.category === "object" ? product.category?.name : product?.category),
      productSubCategory:
        raw.productSubCategory ||
        (typeof product?.subCategory === "object" ? product.subCategory?.name : product?.subCategory),
      managerName: raw.managerName || resolveManagerName(manager),
      storageCapacity: raw.storageCapacity ?? warehouse?.storageCapacity,
    };
  };

  const config = {
    title: setup.title,
    description: setup.description,
    queueTitle: setup.queueTitle,
    queueDescription: setup.queueDescription,
    detailsTitle: "Warehouse Request Details",
    detailsDescription: "Submitted warehouse workflow details for the selected request.",
    // Movement-based queues read the live backend endpoint; the rest keep their (speculative) paths.
    pendingEndpoints: movementBased ? [WAREHOUSE_PENDING_ENDPOINT] : setup.pendingEndpoints,
    filterPending: (rows) => {
      if (movementFilter === null) return rows;
      if (!Array.isArray(movementFilter) || movementFilter.length === 0) return [];
      return rows.filter((row) => movementFilter.includes(row.movementType));
    },
    ...(movementBased
      ? {
          approveRequest: ({ approval, approvedBy }) => approveMovement(approval.id, approvedBy),
          declineRequest: ({ approval, approvedBy, reason }) =>
            rejectMovement(approval.id, approvedBy, reason),
        }
      : {}),
    emptyState: {
      title: setup.emptyTitle,
      description: setup.emptyDescription,
    },
    errors: {
      load: "Unable to load pending warehouse approvals. Please try again later.",
      select: "Please select a warehouse request to approve or reject.",
      approve: "Unable to approve warehouse request. Please try again.",
      decline: "Unable to reject warehouse request. Please try again.",
      declineReason: "A rejection reason is required before you can reject this warehouse request.",
    },
    success: {
      approve: "Warehouse request approved successfully.",
      decline: "Warehouse request rejected successfully.",
    },
    labels: {
      approve: "Approve Request",
      approving: "Approving...",
      decline: "Reject Request",
      confirmDecline: "Confirm Reject",
      declining: "Rejecting...",
    },
    declinePlaceholder: "Write why this warehouse request should be rejected.",
    columns: [
      {
        key: "request",
        label: "Request",
        render: ({ approval }) => {
          const data = getWarehouseData(approval);
          const title = pickValue(data, ["productName", "warehouseName", "branchWarehouseName", "requestTitle"], setup.title);
          const reference = pickValue(data, ["referenceNo", "referenceNumber", "productId", "branchCode"], `Request #${approval.id}`);

          return (
            <div className="approval-primary-cell">
              <strong>{title}</strong>
              <span>{reference}</span>
            </div>
          );
        },
      },
      {
        key: "branch",
        label: "Branch",
        render: ({ approval }) =>
          pickValue(getWarehouseData(approval), ["branchName", "branchCode", "branch", "locationType"], "Not available"),
      },
      {
        key: "warehouse",
        label: "Warehouse",
        render: ({ approval }) =>
          pickValue(
            getWarehouseData(approval),
            ["warehouseName", "senderWarehouse", "senderWarehouseId", "receiverWarehouse", "receiverWarehouseId", "custodianWarehouse"],
            "Not available"
          ),
      },
      {
        key: "quantity",
        label: "Quantity",
        render: ({ approval }) =>
          pickValue(getWarehouseData(approval), ["quantity", "quantityIn", "quantityOut", "stockIncrement", "balanceAfter"], "Not available"),
      },
      {
        key: "date",
        label: "Submitted",
        render: ({ approval }) =>
          formatDateValue(pickValue(getWarehouseData(approval), ["createdAt", "receivedDate", "updatedAt"], approval.createdAt)),
      },
    ],
    getSummary: (approval) => {
      const data = getWarehouseData(approval);
      return {
        title: pickValue(data, ["productName", "warehouseName", "requestTitle"], setup.title),
        subtitle: `Submitted ${formatDateValue(pickValue(data, ["createdAt", "receivedDate", "updatedAt"], approval.createdAt))}`,
        badges: [
          pickValue(data, ["branchName", "branchCode"], "Warehouse"),
          pickValue(data, ["status", "movementType", "flow", "requestedStatus"], "Pending"),
        ],
      };
    },
    getDetailSections: (approval) => {
      const data = getWarehouseData(approval);
      return [
        buildKeyValueSection("Warehouse Information", [
          { label: "Warehouse", value: pickValue(data, ["warehouseName", "branchWarehouseName", "senderWarehouse", "senderWarehouseId"]) },
          { label: "Receiver Warehouse", value: pickValue(data, ["receiverWarehouse", "receiverWarehouseId"]) },
          { label: "Branch", value: pickValue(data, ["branchName", "branchCode"]) },
          { label: "Manager", value: pickValue(data, ["branchManager", "warehouseManager", "managerName"]) },
          { label: "Status", value: pickValue(data, ["status", "requestedStatus"]) },
          { label: "Capacity", value: pickValue(data, ["storageCapacity", "capacity"]) },
        ]),
        buildKeyValueSection("Product / Stock Details", [
          { label: "Product", value: pickValue(data, ["productName", "productNameCode", "productId"]) },
          { label: "Category", value: pickValue(data, ["productCategory", "category"]) },
          { label: "Sub Category", value: pickValue(data, ["productSubCategory", "subCategory"]) },
          { label: "Quantity", value: pickValue(data, ["quantity", "quantityIn", "quantityOut"]) },
          { label: "Stock Increase", value: pickValue(data, ["stockIncrease", "stockIncrement"]) },
          { label: "Stock Decrease", value: pickValue(data, ["stockDecrease"]) },
          { label: "Balance After", value: pickValue(data, ["balanceAfter"]) },
        ]),
        buildKeyValueSection("Reference / Accounts", [
          { label: "Reference", value: pickValue(data, ["referenceNo", "referenceNumber"]) },
          { label: "Movement Type", value: pickValue(data, ["movementType", "flow"]) },
          { label: "Account To Debit", value: pickValue(data, ["accountToDebit"]) },
          { label: "Account To Credit", value: pickValue(data, ["accountToCredit"]) },
          { label: "Location", value: pickValue(data, ["locationAddress", "stateCity", "branchAddress"]) },
          { label: "Submitted On", value: formatDateValue(pickValue(data, ["createdAt", "receivedDate", "updatedAt"], approval.createdAt)) },
        ]),
      ];
    },
  };

  return <ApprovalWorkspace config={config} />;
};

export default WarehouseApproval;
