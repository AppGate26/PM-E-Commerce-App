import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiBox, FiDownload, FiRefreshCw, FiRepeat, FiShield, FiTruck } from "react-icons/fi";
import { IoGridOutline } from "react-icons/io5";
import logo from "../../assets/images/PMlogo.png";
import ModuleUserChip from "../shared/ModuleUserChip";
import { useAuth } from "../../context/AuthContext";
import {
  fetchInventorySuppliers,
  fetchInventoryProducts,
  fetchInventoryCategories,
  fetchInventorySubCategories,
} from "../../lib/inventoryApi";
import { getAccountOptions } from "../../lib/accountingApi";
import { fetchBranches } from "../../lib/branchApi";
import {
  fetchWarehouses,
  submitProductReceipt,
  submitStockAllocation,
  submitWarehouseTransfer,
  submitProductSwap,
  submitQuarantineIn,
  submitQuarantineOut,
  fetchWarehouseReport,
  fetchWarehouseStockBalance,
  fetchWarehouseStock,
  fetchMovementsByType,
} from "../../lib/warehouseApi";
import "./Warehouse.css";

// Backend enums (com.appGate.warehouse.enums)
const SOURCE_TYPES = ["SUPPLIER", "TRANSFER", "SWAP", "RETURN"];
const PRODUCT_CONDITIONS = ["GOOD", "DAMAGED", "EXPIRED", "REFURBISHED"];

// Outbound workflows decrement stock from a source warehouse, so their Product picker must
// be scoped to what that warehouse actually holds. Map each form to its source-warehouse field.
// `productToWarehouse` is inbound (receipt) and keeps the global product register.
const SOURCE_WAREHOUSE_FIELD = {
  warehouseToStock: "warehouse",
  warehouseTransfer: "senderWarehouseId",
  productSwap: "senderWarehouse",
  quarantineIn: "custodianWarehouse",
  quarantineOut: "warehouse",
};

const workflowTabs = [
  { key: "productToWarehouse", label: "Product to Warehouses", icon: FiTruck },
  { key: "warehouseToStock", label: "Warehouse to Stock", icon: FiArrowRight },
  { key: "warehouseTransfer", label: "Transfer from warehouse to warehouse", icon: FiRepeat },
  { key: "productSwap", label: "Product swap", icon: FiRefreshCw },
  { key: "quarantine", label: "Quarantine Product in", icon: FiShield },
  { key: "report", label: "Report", icon: FiDownload },
];

const initialForms = {
  productToWarehouse: {
    warehouse: "",
    productId: "",
    quantityReceived: "",
    sourceType: "",
    receivedDate: "",
    costPrice: "",
    condition: "",
    supplierId: "",
    supplierName: "",
    supplierContactName: "",
    supplierPhone: "",
    supplierEmail: "",
  },
  warehouseToStock: {
    warehouse: "",
    productCategory: "",
    productSubCategory: "",
    productId: "",
    branchId: "",
    quantity: "",
    unitPrice: "",
    stockIncrement: "",
    accountToDebit: "",
    accountToCredit: "",
  },
  warehouseTransfer: {
    senderWarehouseId: "",
    receiverWarehouseId: "",
    productCategory: "",
    productSubCategory: "",
    productId: "",
    quantity: "",
    accountToDebit: "",
    accountToCredit: "",
  },
  productSwap: {
    senderWarehouse: "",
    receiverWarehouse: "",
    productCategory: "",
    productSubCategory: "",
    productId: "",
    branchId: "",
    quantity: "",
    unitPrice: "",
    accountToDebit: "",
    accountToCredit: "",
  },
  quarantineIn: {
    custodianWarehouse: "",
    productCategory: "",
    productSubCategory: "",
    productId: "",
    branchId: "",
    quantity: "",
  },
  quarantineOut: {
    warehouse: "",
    receiverWarehouse: "",
    productCategory: "",
    productSubCategory: "",
    productId: "",
    branchId: "",
    quantity: "",
  },
};

const initialRecords = {
  productToWarehouse: [],
  warehouseToStock: [],
  warehouseTransfer: [],
  productSwap: [],
  quarantine: [],
};

// field config: name, label, type, source (dynamic options key), options (static), optional
const field = (name, label, type = "text", config = {}) => ({
  name,
  label,
  type,
  source: config.source || null,
  options: config.options || null,
  optional: config.optional || false,
});

const formSchemas = {
  productToWarehouse: [
    field("warehouse", "Warehouse", "select", { source: "warehouses" }),
    field("productId", "Product", "select", { source: "products" }),
    field("quantityReceived", "Quantity received", "number"),
    field("sourceType", "Source type", "select", { options: SOURCE_TYPES }),
    field("receivedDate", "Received date", "date"),
    field("costPrice", "Cost price", "number"),
    field("condition", "Condition", "select", { options: PRODUCT_CONDITIONS }),
    field("supplierId", "Supplier ID", "select", { optional: true }),
  ],
  warehouseToStock: [
    field("warehouse", "Source warehouse", "select", { source: "warehouses" }),
    field("productCategory", "Product category", "select", { source: "categories", optional: true }),
    field("productSubCategory", "Product sub category", "select", { source: "subCategories", optional: true }),
    field("productId", "Product", "select", { source: "products" }),
    field("branchId", "Branch", "select", { source: "branches", optional: true }),
    field("quantity", "Quantity", "number"),
    field("unitPrice", "Unit price", "number"),
    field("stockIncrement", "Stock increment", "number", { optional: true }),
    field("accountToDebit", "Account to debit", "select", { source: "accounts" }),
    field("accountToCredit", "Account to credit", "select", { source: "accounts" }),
  ],
  warehouseTransfer: [
    field("senderWarehouseId", "Sender warehouse", "select", { source: "warehouses" }),
    field("receiverWarehouseId", "Receiver warehouse", "select", { source: "warehouses" }),
    field("productCategory", "Product category", "select", { source: "categories", optional: true }),
    field("productSubCategory", "Product sub category", "select", { source: "subCategories", optional: true }),
    field("productId", "Product", "select", { source: "products" }),
    field("quantity", "Quantity", "number"),
    field("accountToDebit", "Account to debit", "select", { source: "accounts" }),
    field("accountToCredit", "Account to credit", "select", { source: "accounts" }),
  ],
  productSwap: [
    field("senderWarehouse", "Sender warehouse", "select", { source: "warehouses" }),
    field("receiverWarehouse", "Receiver warehouse", "select", { source: "warehouses" }),
    field("productCategory", "Product category", "select", { source: "categories", optional: true }),
    field("productSubCategory", "Product sub category", "select", { source: "subCategories", optional: true }),
    field("productId", "Product", "select", { source: "products" }),
    field("branchId", "Branch", "select", { source: "branches", optional: true }),
    field("quantity", "Quantity", "number"),
    field("unitPrice", "Unit price", "number"),
    field("accountToDebit", "Account to debit", "select", { source: "accounts" }),
    field("accountToCredit", "Account to credit", "select", { source: "accounts" }),
  ],
  quarantineIn: [
    field("custodianWarehouse", "Custodian warehouse", "select", { source: "warehouses" }),
    field("productCategory", "Product category", "select", { source: "categories", optional: true }),
    field("productSubCategory", "Product sub category", "select", { source: "subCategories", optional: true }),
    field("productId", "Product", "select", { source: "products" }),
    field("branchId", "Branch", "select", { source: "branches", optional: true }),
    field("quantity", "Quantity", "number"),
  ],
  quarantineOut: [
    field("warehouse", "Source (quarantine) warehouse", "select", { source: "warehouses" }),
    field("receiverWarehouse", "Receiver warehouse", "select", { source: "warehouses" }),
    field("productCategory", "Product category", "select", { source: "categories", optional: true }),
    field("productSubCategory", "Product sub category", "select", { source: "subCategories", optional: true }),
    field("productId", "Product", "select", { source: "products" }),
    field("branchId", "Branch", "select", { source: "branches", optional: true }),
    field("quantity", "Quantity", "number"),
  ],
};

// Columns shown in the "inserted" table — sourced from the saved movement returned by the backend.
const movementColumns = ["referenceNo", "movementType", "product", "quantity", "balanceAfter", "approvalStatus"];

// Report views. "combined" keeps the existing per-warehouse mixed movement report / stock
// balance; the rest are the four dedicated per-movement-type reports QA asked for.
const REPORT_TYPES = [
  { key: "combined", label: "Combined movement report" },
  { key: "WAREHOUSE_STOCK", label: "Warehouse stock (total quantity on hand)" },
  { key: "PRODUCT_RECEIPT", label: "Product to warehouse report" },
  { key: "STOCK_ALLOCATION", label: "Product to stock report" },
  { key: "TRANSFER", label: "Transfer from warehouse report" },
  { key: "SWAP", label: "Product swap report" },
  { key: "QUARANTINE_IN", label: "Quarantine in report" },
  { key: "QUARANTINE_OUT", label: "Quarantine out report" },
];

const labels = {
  referenceNo: "Reference",
  movementType: "Movement",
  product: "Product",
  quantity: "Quantity",
  balanceAfter: "Balance after",
  approvalStatus: "Status",
  warehouseName: "Warehouse",
  quantityOnHand: "Qty on hand",
};

const titleCase = (value) =>
  labels[value] ||
  String(value)
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (item) => item.toUpperCase());

// --- defensive mappers for register data ---
const mapProduct = (p = {}) => ({
  id: p.id ?? p.productId ?? p.product_id,
  name: p.productName || p.name || p.product_name || `Product ${p.id ?? ""}`,
  categoryId: String(p.category?.id ?? p.categoryId ?? p.category_id ?? ""),
  subCategoryId: String(p.subCategory?.id ?? p.subCategoryId ?? p.sub_category_id ?? ""),
  costPrice: p.costPrice ?? p.cost_price ?? "",
  sellingPrice: p.sellingPrice ?? p.selling_price ?? "",
});

const mapCategory = (c = {}) => ({
  id: String(c.id ?? c.categoryId ?? ""),
  name: c.name || c.categoryName || c.category_name || `Category ${c.id ?? ""}`,
});

const mapSubCategory = (s = {}) => ({
  id: String(s.id ?? s.subCategoryId ?? ""),
  name: s.name || s.subCategoryName || s.sub_category_name || `Sub ${s.id ?? ""}`,
  categoryId: String(s.categoryId ?? s.category?.id ?? s.category_id ?? ""),
});

const getSupplierId = (supplier = {}) =>
  supplier.supplierId || supplier.id || supplier.userId || supplier.customerId || "";
const getSupplierName = (supplier = {}) =>
  supplier.companyName || supplier.customerName || supplier.name || supplier.supplierName || "";
const getSupplierPhone = (supplier = {}) =>
  supplier.contactPhoneNo || supplier.contactPhoneNumber || supplier.contactPhone || supplier.phoneNumber || supplier.phone || "";
const getSupplierEmail = (supplier = {}) =>
  supplier.contactEmail || supplier.email || supplier.customerEmail || supplier.supplierEmail || "";

const toNumberOrNull = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const today = () => new Date().toISOString().slice(0, 10);

const Warehouse = () => {
  const { user, isBranchUser, branchId: ownBranchId } = useAuth();
  const [activeTab, setActiveTab] = useState("productToWarehouse");
  const [quarantineMode, setQuarantineMode] = useState("quarantineIn");
  const [forms, setForms] = useState(initialForms);
  const [records, setRecords] = useState(initialRecords);

  const [warehouses, setWarehouses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [supplierLoadError, setSupplierLoadError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [reportFilter, setReportFilter] = useState({ reportType: "combined", warehouseId: "", from: "", to: "" });
  const [reportRows, setReportRows] = useState([]);
  const [stockBalance, setStockBalance] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  // Products currently held in the source warehouse of the active outbound form.
  const [warehouseStock, setWarehouseStock] = useState([]);

  const currentFormKey = activeTab === "quarantine" ? quarantineMode : activeTab;
  const currentForm = forms[currentFormKey];
  const currentRows = records[activeTab] || [];

  // Which warehouse (if any) the current form draws stock from, and whether it's outbound.
  const sourceWarehouseField = SOURCE_WAREHOUSE_FIELD[currentFormKey] || null;
  const sourceWarehouseId = sourceWarehouseField ? currentForm?.[sourceWarehouseField] : "";
  const isOutboundForm = Boolean(sourceWarehouseField);

  const resolveUserId = () =>
    toNumberOrNull(user?.userId ?? user?.id ?? user?.user_id ?? user?.staffId);

  const productById = useMemo(() => {
    const map = new Map();
    products.forEach((p) => map.set(String(p.id), p));
    return map;
  }, [products]);

  // Option lists ({ value, label }) for each dynamic source.
  const warehouseOptions = useMemo(
    () => warehouses.map((w) => ({ value: String(w.id), label: w.warehouseName || `Warehouse ${w.id}` })),
    [warehouses]
  );
  // A branch user only ever posts into their own branch -- the server enforces it
  // regardless, so offering the other branches here would just invite a 403.
  const branchOptions = useMemo(
    () =>
      branches
        .filter((b) => b.id != null)
        .filter((b) => !isBranchUser || String(b.id) === String(ownBranchId))
        .map((b) => ({ value: String(b.id), label: b.branchName || b.branchCode || `Branch ${b.id}` })),
    [branches, isBranchUser, ownBranchId]
  );
  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: c.id, label: c.name })),
    [categories]
  );
  const accountOptions = useMemo(
    () => accounts.map((a) => ({ value: String(a.glCode || a.code || a.value), label: a.label })),
    [accounts]
  );

  // Sub-categories filtered by the category picked in the current form.
  const subCategoryOptions = useMemo(() => {
    const selectedCategory = currentForm?.productCategory;
    const filtered = selectedCategory
      ? subCategories.filter((s) => s.categoryId === String(selectedCategory))
      : subCategories;
    return filtered.map((s) => ({ value: s.id, label: s.name }));
  }, [subCategories, currentForm?.productCategory]);

  // Products filtered by the category / sub-category chosen in the current form.
  // Only filter a product out when it actually carries the matching id — the product
  // register may omit category/sub-category metadata, and in that case a category pick
  // must not empty the product dropdown.
  const productOptions = useMemo(() => {
    const cat = currentForm?.productCategory;
    const sub = currentForm?.productSubCategory;
    return products
      .filter((p) => (cat && p.categoryId ? p.categoryId === String(cat) : true))
      .filter((p) => (sub && p.subCategoryId ? p.subCategoryId === String(sub) : true))
      .map((p) => ({ value: String(p.id), label: p.name }));
  }, [products, currentForm?.productCategory, currentForm?.productSubCategory]);

  // Outbound forms: only products actually on hand in the selected source warehouse, with the
  // available quantity shown. Names come from the global product register (warehouse rows only
  // carry productId). Still honour category/sub-category filters when the product carries them.
  const warehouseScopedProductOptions = useMemo(() => {
    const cat = currentForm?.productCategory;
    const sub = currentForm?.productSubCategory;
    return warehouseStock
      .filter((row) => (row.quantityOnHand ?? 0) > 0)
      .map((row) => ({ row, p: productById.get(String(row.productId)) }))
      .filter(({ p }) => (cat && p?.categoryId ? p.categoryId === String(cat) : true))
      .filter(({ p }) => (sub && p?.subCategoryId ? p.subCategoryId === String(sub) : true))
      .map(({ row, p }) => ({
        value: String(row.productId),
        label: `${p?.name || `Product ${row.productId}`} (available: ${row.quantityOnHand})`,
      }));
  }, [warehouseStock, productById, currentForm?.productCategory, currentForm?.productSubCategory]);

  const optionSources = {
    warehouses: warehouseOptions,
    branches: branchOptions,
    categories: categoryOptions,
    subCategories: subCategoryOptions,
    accounts: accountOptions,
    products: isOutboundForm ? warehouseScopedProductOptions : productOptions,
  };

  useEffect(() => {
    if (!saveStatus) return undefined;
    const timer = setTimeout(() => setSaveStatus(""), 4000);
    return () => clearTimeout(timer);
  }, [saveStatus]);

  useEffect(() => {
    let isMounted = true;

    const loadSuppliers = async () => {
      setLoadingSuppliers(true);
      setSupplierLoadError("");
      try {
        const rows = await fetchInventorySuppliers();
        if (isMounted) setSuppliers(rows);
      } catch (error) {
        if (isMounted) setSupplierLoadError(error?.message || "Unable to load suppliers.");
      } finally {
        if (isMounted) setLoadingSuppliers(false);
      }
    };

    const loadRegisters = async () => {
      const results = await Promise.allSettled([
        fetchWarehouses(),
        fetchBranches(),
        fetchInventoryProducts(),
        fetchInventoryCategories(),
        fetchInventorySubCategories(),
        getAccountOptions(),
      ]);
      if (!isMounted) return;

      const [wh, br, prod, cat, sub, acc] = results;
      if (wh.status === "fulfilled") setWarehouses(wh.value || []);
      if (br.status === "fulfilled") setBranches(br.value || []);

      // Preselect the branch user's own branch: it is the only one they can post to.
      if (isBranchUser && ownBranchId != null) {
        setForms((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((key) => {
            if ("branchId" in next[key]) next[key] = { ...next[key], branchId: String(ownBranchId) };
          });
          return next;
        });
      }
      if (prod.status === "fulfilled") setProducts((prod.value || []).map(mapProduct).filter((p) => p.id != null));
      if (cat.status === "fulfilled") setCategories((cat.value || []).map(mapCategory));
      if (sub.status === "fulfilled") setSubCategories((sub.value || []).map(mapSubCategory));
      if (acc.status === "fulfilled") setAccounts(acc.value || []);

      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0) {
        setLoadError("Some reference lists could not load. Check your connection / access and refresh.");
      }
    };

    loadSuppliers();
    loadRegisters();

    return () => {
      isMounted = false;
    };
  }, [isBranchUser, ownBranchId]);

  // When a category is chosen, load that category's sub-categories from the scoped
  // endpoint. The backend omits the parent id on sub-category JSON (@JsonBackReference),
  // so stamp the known category id onto each row so the sub-category dropdown populates.
  useEffect(() => {
    const categoryId = currentForm?.productCategory;
    if (!categoryId) return undefined;
    let active = true;
    (async () => {
      try {
        const rows = await fetchInventorySubCategories(categoryId);
        if (!active) return;
        setSubCategories(
          (rows || [])
            .map(mapSubCategory)
            .map((s) => ({ ...s, categoryId: String(categoryId) }))
        );
      } catch {
        // keep whatever sub-categories are already loaded
      }
    })();
    return () => {
      active = false;
    };
  }, [currentForm?.productCategory]);

  // Load the source warehouse's on-hand products whenever the outbound form's source
  // warehouse changes, so the Product picker only offers what that warehouse holds.
  useEffect(() => {
    if (!isOutboundForm || !sourceWarehouseId) {
      setWarehouseStock([]);
      return undefined;
    }
    let active = true;
    (async () => {
      try {
        const rows = await fetchWarehouseStock(sourceWarehouseId);
        if (active) setWarehouseStock(rows || []);
      } catch {
        if (active) setWarehouseStock([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [isOutboundForm, sourceWarehouseId]);

  const updateForm = (formKey, name, value) => {
    setForms((current) => {
      const nextForm = { ...current[formKey], [name]: value };
      // Cascading resets so the dependent dropdowns stay consistent.
      if (name === "productCategory") {
        nextForm.productSubCategory = "";
        nextForm.productId = "";
      } else if (name === "productSubCategory") {
        nextForm.productId = "";
      } else if (name === SOURCE_WAREHOUSE_FIELD[formKey]) {
        // Changing the source warehouse invalidates the previously-picked product.
        nextForm.productId = "";
      }
      return { ...current, [formKey]: nextForm };
    });
  };

  const handleProductSelect = (formKey, productId) => {
    const product = productById.get(String(productId));
    setForms((current) => {
      const nextForm = { ...current[formKey], productId };
      if (product) {
        if (product.categoryId && !nextForm.productCategory) nextForm.productCategory = product.categoryId;
        if (product.subCategoryId && !nextForm.productSubCategory) nextForm.productSubCategory = product.subCategoryId;
        if ("unitPrice" in nextForm && !nextForm.unitPrice && product.sellingPrice) {
          nextForm.unitPrice = String(product.sellingPrice);
        }
        if ("costPrice" in nextForm && !nextForm.costPrice && product.costPrice) {
          nextForm.costPrice = String(product.costPrice);
        }
      }
      return { ...current, [formKey]: nextForm };
    });
  };

  const handleSupplierSelect = (supplierId) => {
    const selectedSupplier = suppliers.find((s) => String(getSupplierId(s)) === String(supplierId));
    setForms((current) => ({
      ...current,
      productToWarehouse: {
        ...current.productToWarehouse,
        supplierId,
        supplierName: selectedSupplier ? getSupplierName(selectedSupplier) : "",
        supplierContactName: selectedSupplier?.contactName || "",
        supplierPhone: selectedSupplier ? getSupplierPhone(selectedSupplier) : "",
        supplierEmail: selectedSupplier ? getSupplierEmail(selectedSupplier) : "",
      },
    }));
  };

  const buildPayload = (key, form) => {
    switch (key) {
      case "productToWarehouse":
        return [
          submitProductReceipt,
          {
            warehouseId: toNumberOrNull(form.warehouse),
            productId: toNumberOrNull(form.productId),
            quantityReceived: toNumberOrNull(form.quantityReceived),
            sourceType: form.sourceType,
            receivedDate: form.receivedDate || today(),
            receivedBy: resolveUserId(),
            costPrice: toNumberOrNull(form.costPrice),
            condition: form.condition,
            supplierId: toNumberOrNull(form.supplierId),
          },
        ];
      case "warehouseToStock":
        return [
          submitStockAllocation,
          {
            warehouseId: toNumberOrNull(form.warehouse),
            productId: toNumberOrNull(form.productId),
            branchId: toNumberOrNull(form.branchId),
            quantity: toNumberOrNull(form.quantity),
            unitPrice: toNumberOrNull(form.unitPrice),
            stockIncrement: toNumberOrNull(form.stockIncrement),
            accountToDebit: form.accountToDebit,
            accountToCredit: form.accountToCredit,
          },
        ];
      case "warehouseTransfer":
        return [
          submitWarehouseTransfer,
          {
            senderWarehouseId: toNumberOrNull(form.senderWarehouseId),
            receiverWarehouseId: toNumberOrNull(form.receiverWarehouseId),
            productId: toNumberOrNull(form.productId),
            quantity: toNumberOrNull(form.quantity),
            accountToDebit: form.accountToDebit,
            accountToCredit: form.accountToCredit,
          },
        ];
      case "productSwap":
        return [
          submitProductSwap,
          {
            senderWarehouseId: toNumberOrNull(form.senderWarehouse),
            receiverWarehouseId: toNumberOrNull(form.receiverWarehouse),
            productId: toNumberOrNull(form.productId),
            branchId: toNumberOrNull(form.branchId),
            quantity: toNumberOrNull(form.quantity),
            unitPrice: toNumberOrNull(form.unitPrice),
            accountToDebit: form.accountToDebit,
            accountToCredit: form.accountToCredit,
          },
        ];
      case "quarantineIn":
        return [
          submitQuarantineIn,
          {
            warehouseId: toNumberOrNull(form.custodianWarehouse),
            productId: toNumberOrNull(form.productId),
            branchId: toNumberOrNull(form.branchId),
            quantity: toNumberOrNull(form.quantity),
          },
        ];
      case "quarantineOut":
        return [
          submitQuarantineOut,
          {
            warehouseId: toNumberOrNull(form.warehouse),
            receiverWarehouseId: toNumberOrNull(form.receiverWarehouse),
            productId: toNumberOrNull(form.productId),
            branchId: toNumberOrNull(form.branchId),
            quantity: toNumberOrNull(form.quantity),
          },
        ];
      default:
        return [null, null];
    }
  };

  const submitWorkflow = async (event) => {
    event.preventDefault();
    setSubmitError("");
    const [submitFn, payload] = buildPayload(currentFormKey, currentForm);
    if (!submitFn) return;

    setSubmitting(true);
    try {
      const saved = await submitProductMovement(submitFn, payload);
      const recordKey = activeTab === "quarantine" ? "quarantine" : activeTab;
      setRecords((current) => ({
        ...current,
        [recordKey]: [saved, ...(current[recordKey] || [])],
      }));
      const balanceText =
        saved.balanceAfter !== undefined && saved.balanceAfter !== null
          ? ` New balance: ${saved.balanceAfter}.`
          : "";
      setSaveStatus(
        `Saved (ref ${saved.referenceNo || "—"}). Awaiting Super Admin approval.${balanceText}`
      );
      setForms((current) => ({ ...current, [currentFormKey]: initialForms[currentFormKey] }));
    } catch (error) {
      setSubmitError(error?.message || "Unable to save. Please check the form and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Some backends answer a failed business rule (e.g. insufficient stock) with a 200 + message
  // and a null payload; surface that as an error instead of a silent success.
  const submitProductMovement = async (submitFn, payload) => {
    const saved = await submitFn(payload);
    if (!saved || (typeof saved === "object" && Object.keys(saved).length === 0)) {
      throw new Error("The server did not record the movement. Check stock availability and inputs.");
    }
    return saved;
  };

  // "Warehouse stock" is a stock-balance snapshot (quantity on hand), not a
  // movement listing — keep it out of the per-movement-type path.
  const isStockReport = reportFilter.reportType === "WAREHOUSE_STOCK";
  const isTypeReport =
    reportFilter.reportType &&
    reportFilter.reportType !== "combined" &&
    !isStockReport;

  const runReport = async () => {
    setReportLoading(true);
    setSubmitError("");
    try {
      if (isStockReport) {
        let balance = await fetchWarehouseStockBalance();
        if (reportFilter.warehouseId) {
          balance = (balance || []).filter(
            (row) => String(row.warehouseId) === String(reportFilter.warehouseId)
          );
        }
        setStockBalance(balance || []);
      } else if (isTypeReport) {
        // Dedicated per-type report. Backend filters by movement type across warehouses;
        // narrow to a single warehouse client-side when one is selected.
        let rows = await fetchMovementsByType(reportFilter.reportType);
        if (reportFilter.warehouseId) {
          rows = (rows || []).filter(
            (m) => String(m.warehouseId) === String(reportFilter.warehouseId)
          );
        }
        setReportRows(rows || []);
      } else if (reportFilter.warehouseId) {
        const rows = await fetchWarehouseReport(reportFilter.warehouseId, {
          from: reportFilter.from,
          to: reportFilter.to,
        });
        setReportRows(rows || []);
      } else {
        const balance = await fetchWarehouseStockBalance();
        setStockBalance(balance || []);
      }
    } catch (error) {
      setSubmitError(error?.message || "Unable to load report.");
    } finally {
      setReportLoading(false);
    }
  };

  const mapMovementRow = (movement = {}) => ({
    id: movement.id || movement.referenceNo || `${Date.now()}-${Math.random()}`,
    referenceNo: movement.referenceNo || "—",
    movementType: movement.movementType || "—",
    product:
      productById.get(String(movement.productId))?.name ||
      (movement.productId != null ? `#${movement.productId}` : "—"),
    quantity:
      movement.quantityReceived ?? movement.quantityIn ?? movement.quantityOut ?? movement.quantity ?? "—",
    balanceAfter: movement.balanceAfter ?? "—",
    approvalStatus: movement.approvalStatus || "PENDING",
  });

  const renderControl = (config) => {
    const value = currentForm[config.name] ?? "";

    // Supplier dropdown (auto-fills supplier detail, used only on product receipt).
    if (currentFormKey === "productToWarehouse" && config.name === "supplierId") {
      return (
        <label className="warehouse-field" key={config.name}>
          <span>{config.label}</span>
          <select
            value={value}
            onChange={(event) => handleSupplierSelect(event.target.value)}
            disabled={loadingSuppliers}
          >
            <option value="">{loadingSuppliers ? "Loading suppliers..." : "Select supplier (optional)"}</option>
            {suppliers.map((supplier, index) => {
              const supplierId = getSupplierId(supplier);
              return (
                <option key={supplierId || index} value={String(supplierId)}>
                  {supplierId || "N/A"} - {getSupplierName(supplier) || "Unnamed supplier"}
                </option>
              );
            })}
          </select>
          {supplierLoadError ? <small className="warehouse-field-note error">{supplierLoadError}</small> : null}
        </label>
      );
    }

    // Product dropdown (auto-fills category/sub-category/price). Outbound forms are scoped to
    // the source warehouse's on-hand products; the receipt form uses the global register.
    if (config.source === "products") {
      const resolvedProductOptions = optionSources.products;
      const emptyLabel = isOutboundForm
        ? sourceWarehouseId
          ? "No products in this warehouse"
          : "Select source warehouse first"
        : "No products registered";
      return (
        <label className="warehouse-field" key={config.name}>
          <span>{config.label}</span>
          <select
            value={value}
            onChange={(event) => handleProductSelect(currentFormKey, event.target.value)}
            required={!config.optional}
          >
            <option value="">
              {resolvedProductOptions.length === 0 ? emptyLabel : "Select product"}
            </option>
            {resolvedProductOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      );
    }

    // Dynamic-source dropdowns (warehouses, branches, categories, sub-categories, accounts).
    if (config.source) {
      const options = optionSources[config.source] || [];
      return (
        <label className="warehouse-field" key={config.name}>
          <span>{config.label}</span>
          <select
            value={value}
            onChange={(event) => updateForm(currentFormKey, config.name, event.target.value)}
            required={!config.optional}
          >
            <option value="">
              {options.length === 0 ? `No ${config.label.toLowerCase()} found` : `Select ${config.label.toLowerCase()}`}
            </option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      );
    }

    // Static-option dropdowns (enums).
    if (config.options) {
      return (
        <label className="warehouse-field" key={config.name}>
          <span>{config.label}</span>
          <select
            value={value}
            onChange={(event) => updateForm(currentFormKey, config.name, event.target.value)}
            required={!config.optional}
          >
            <option value="">Select {config.label.toLowerCase()}</option>
            {config.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      );
    }

    return (
      <label className="warehouse-field" key={config.name}>
        <span>{config.label}</span>
        <input
          type={config.type}
          value={value}
          onChange={(event) => updateForm(currentFormKey, config.name, event.target.value)}
          required={!config.optional}
        />
      </label>
    );
  };

  const renderMovementTable = (rows) => (
    <div className="warehouse-table-wrap" role="region" aria-label="Warehouse saved movements">
      <table className="warehouse-table">
        <thead>
          <tr>
            {movementColumns.map((column) => (
              <th key={column}>{titleCase(column)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={movementColumns.length}>No movement saved yet.</td>
            </tr>
          ) : (
            rows.map(mapMovementRow).map((row) => (
              <tr key={row.id}>
                {movementColumns.map((column) => (
                  <td key={column} data-label={titleCase(column)}>
                    <span>{row[column] ?? "-"}</span>
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="warehouse-page">
      <header className="warehouse-topbar">
        <div className="warehouse-brand">
          <img src={logo} alt="Peace of Mind" />
          <div>
            <span>Warehouse Module</span>
            <strong>Warehouse Operations</strong>
          </div>
        </div>
        <div className="warehouse-actions">
          <ModuleUserChip user={user} />
          <Link to="/adminDashboard" className="warehouse-icon-btn" aria-label="Dashboard">
            <IoGridOutline />
          </Link>
        </div>
      </header>

      <main className="warehouse-main">
        <section className="warehouse-hero">
          <div>
            <span className="warehouse-kicker">Warehouse Control</span>
            <h1>Product Movement Workspace</h1>
          </div>
          <div className="warehouse-count">
            <FiBox />
            <strong>{Object.values(records).flat().length}</strong>
            <span>Saved this session</span>
          </div>
        </section>

        {loadError ? (
          <div className="warehouse-save-status" role="status" style={{ background: "#fff4f4", color: "#b42318" }}>
            {loadError}
          </div>
        ) : null}
        {saveStatus ? (
          <div className="warehouse-save-status" role="status">
            {saveStatus}
          </div>
        ) : null}
        {submitError ? (
          <div className="warehouse-save-status" role="alert" style={{ background: "#fff4f4", color: "#b42318" }}>
            {submitError}
          </div>
        ) : null}

        <nav className="warehouse-workflow-nav" aria-label="Warehouse workflows">
          {workflowTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                className={activeTab === tab.key ? "active" : ""}
                onClick={() => setActiveTab(tab.key)}
              >
                <Icon />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {activeTab === "report" ? (
          <section className="warehouse-card warehouse-report-card">
            <div className="warehouse-card-head">
              <div>
                <h2>Warehouse Reports</h2>
                <p>Choose a report type. Combined shows a warehouse's mixed movements (or a stock-balance overview when no warehouse is picked); the other reports list a single movement type.</p>
              </div>
              <div className="warehouse-card-actions">
                <button type="button" onClick={runReport} disabled={reportLoading}>
                  {reportLoading ? "Loading..." : "Run report"}
                </button>
              </div>
            </div>
            <div className="warehouse-form-grid compact">
              <label className="warehouse-field">
                <span>Report type</span>
                <select
                  value={reportFilter.reportType}
                  onChange={(event) => setReportFilter((c) => ({ ...c, reportType: event.target.value }))}
                >
                  {REPORT_TYPES.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="warehouse-field">
                <span>Warehouse</span>
                <select
                  value={reportFilter.warehouseId}
                  onChange={(event) => setReportFilter((c) => ({ ...c, warehouseId: event.target.value }))}
                >
                  <option value="">
                    {isTypeReport ? "All warehouses" : "All warehouses (stock balance)"}
                  </option>
                  {warehouseOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="warehouse-field">
                <span>From date</span>
                <input
                  type="date"
                  value={reportFilter.from}
                  onChange={(event) => setReportFilter((c) => ({ ...c, from: event.target.value }))}
                />
              </label>
              <label className="warehouse-field">
                <span>To date</span>
                <input
                  type="date"
                  value={reportFilter.to}
                  onChange={(event) => setReportFilter((c) => ({ ...c, to: event.target.value }))}
                />
              </label>
            </div>
            {!isStockReport && (isTypeReport || reportFilter.warehouseId)
              ? renderMovementTable(reportRows)
              : (
                <div className="warehouse-table-wrap" role="region" aria-label="Stock balance">
                  <table className="warehouse-table">
                    <thead>
                      <tr>
                        <th>Warehouse</th>
                        <th>Product</th>
                        <th>Qty on hand</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockBalance.length === 0 ? (
                        <tr>
                          <td colSpan={3}>Run the report to load stock balances.</td>
                        </tr>
                      ) : (
                        stockBalance.map((row, index) => (
                          <tr key={row.id || index}>
                            <td data-label="Warehouse">
                              <span>
                                {warehouses.find((w) => String(w.id) === String(row.warehouseId))?.warehouseName ||
                                  row.warehouseId ||
                                  "-"}
                              </span>
                            </td>
                            <td data-label="Product">
                              <span>{productById.get(String(row.productId))?.name || `#${row.productId}`}</span>
                            </td>
                            <td data-label="Qty on hand">
                              <span>{row.quantityOnHand ?? "-"}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {stockBalance.length > 0 ? (
                      <tfoot>
                        <tr>
                          <td colSpan={2} style={{ fontWeight: 700 }}>Total stock in warehouse</td>
                          <td data-label="Total" style={{ fontWeight: 700 }}>
                            {stockBalance.reduce(
                              (sum, row) => sum + (Number(row.quantityOnHand) || 0),
                              0
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    ) : null}
                  </table>
                </div>
              )}
          </section>
        ) : (
          <section className="warehouse-layout">
            <form className="warehouse-card" onSubmit={submitWorkflow}>
              <div className="warehouse-card-head">
                <div>
                  <h2>{workflowTabs.find((tab) => tab.key === activeTab)?.label}</h2>
                  <p>Submitting creates a pending movement for Super Admin approval.</p>
                </div>
                {activeTab === "quarantine" ? (
                  <div className="warehouse-segmented">
                    <button
                      type="button"
                      className={quarantineMode === "quarantineIn" ? "active" : ""}
                      onClick={() => setQuarantineMode("quarantineIn")}
                    >
                      In
                    </button>
                    <button
                      type="button"
                      className={quarantineMode === "quarantineOut" ? "active" : ""}
                      onClick={() => setQuarantineMode("quarantineOut")}
                    >
                      Out
                    </button>
                  </div>
                ) : null}
              </div>
              <div className="warehouse-form-grid">{formSchemas[currentFormKey].map(renderControl)}</div>
              <div className="warehouse-submit-row">
                <button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Submit for approval"}
                </button>
              </div>
            </form>

            <section className="warehouse-card warehouse-table-card">
              <div className="warehouse-card-head">
                <div>
                  <h2>Saved this session</h2>
                  <p>
                    {currentRows.length} movement{currentRows.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              {renderMovementTable(currentRows)}
            </section>
          </section>
        )}
      </main>
    </div>
  );
};

export default Warehouse;
