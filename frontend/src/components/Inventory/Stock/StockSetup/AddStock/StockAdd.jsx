import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AddStock.css";
import AddSuccessMsg from "./AddSuccessMsg";
import BranchBadge from "../../../../shared/BranchBadge";
import { apiRequest } from "../../../../../lib/config";
import { getAccountOptions } from "../../../../../lib/accountingApi";
import { APPROVAL_TYPES, createApprovalRequest } from "../../../../../lib/adminApi";
import { useAuth } from "../../../../../context/AuthContext";
import { fetchInventorySuppliers } from "../../../../../lib/inventoryApi";
import { fetchWarehouses } from "../../../../../lib/warehouseApi";

const parseListResponse = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.response)) return response.response;
  if (Array.isArray(response?.response?.data)) return response.response.data;
  if (Array.isArray(response?.response?.content)) return response.response.content;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.content)) return response.content;
  return [];
};

const withTimeout = (promise, label, timeoutMs = 12000) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} request timed out`)), timeoutMs);
    }),
  ]);

const StockAdd = ({ toggleStockAdd }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [modalAddSuccess, setModalAddSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [accountOptions, setAccountOptions] = useState([]);
  const [stockEntries, setStockEntries] = useState([]);
  const [pendingStockEntries, setPendingStockEntries] = useState([]);
  const [refNumber, setRefNumber] = useState("");
  const [productExists, setProductExists] = useState(false);
  const [existingStockDetails, setExistingStockDetails] = useState(null);
  const [sourceType, setSourceType] = useState("supplier");

  const { canSelectBranch, userBranch } = useAuth();
  const effectiveBranchId = canSelectBranch ? null : (userBranch?.id || null);

  const [formData, setFormData] = useState({
    stockDate: new Date().toISOString().split("T")[0],
    productSearch: "",
    productId: "",
    categoryId: "",
    subCategoryId: "",
    unitPrice: "",
    costPrice: "",
    sellingPrice: "",
    supplierId: "",
    warehouseId: "",
    description: "",
    quantity: "",
    reorderLevel: 0,
    accountToCredit: "",
    accountToDebit: "",
    enteredBy: 1,
    isOpeningStock: true,
  });

  const generateRefNumber = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    setRefNumber(`REF-0${random}`);
  };

  const fetchDropdownData = async () => {
    setLoadingDropdowns(true);

    const [productResult, categoryResult, supplierResult, warehouseResult] = await Promise.allSettled([
      withTimeout(apiRequest("/products?size=500", "GET"), "Products"),
      withTimeout(apiRequest("/admin/categories", "GET"), "Categories"),
      withTimeout(fetchInventorySuppliers(), "Suppliers"),
      withTimeout(fetchWarehouses(), "Warehouses"),
    ]);

    if (productResult.status === "fulfilled") {
      setProducts(parseListResponse(productResult.value));
    } else {
      setProducts([]);
    }

    if (categoryResult.status === "fulfilled") {
      setCategories(parseListResponse(categoryResult.value));
    } else {
      setCategories([]);
    }

    if (supplierResult.status === "fulfilled") {
      setSuppliers(supplierResult.value);
    } else {
      setSuppliers([]);
    }

    if (warehouseResult.status === "fulfilled") {
      setWarehouses(warehouseResult.value);
    } else {
      setWarehouses([]);
    }

    const failedSections = [
      productResult.status === "rejected" ? "products" : "",
      categoryResult.status === "rejected" ? "categories" : "",
      supplierResult.status === "rejected" ? "suppliers" : "",
      warehouseResult.status === "rejected" ? "warehouses" : "",
    ].filter(Boolean);

    if (failedSections.length > 0) {
      setError(`Some dropdown data could not load: ${failedSections.join(", ")}. You can still refresh and try again.`);
    }

    setLoadingDropdowns(false);
  };

  const fetchAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const options = await getAccountOptions();
      setAccountOptions(options);
    } catch (requestError) {
      setAccountOptions([]);
      setError(
        requestError?.message ||
          "Failed to load account details from backend. Please refresh the page."
      );
    } finally {
      setLoadingAccounts(false);
    }
  };

  const refreshSuppliers = async () => {
    try {
      const suppliersList = await withTimeout(fetchInventorySuppliers(), "Suppliers");
      setSuppliers(suppliersList);
    } catch {
      setError("Failed to refresh suppliers from backend.");
    }
  };

  const fetchSubCategories = async (categoryId) => {
    if (!categoryId) {
      setSubCategories([]);
      return;
    }

    try {
      const response = await apiRequest(
        `/categories/${categoryId}/sub-categories`,
        "GET"
      );
      setSubCategories(parseListResponse(response));
    } catch (requestError) {
      setSubCategories([]);
    }
  };

  const fetchExistingStocks = async () => {
    try {
      setLoadingStocks(true);
      const response = await apiRequest("/admin/stocks", "GET");
      const stocksList = parseListResponse(response);
      setStockEntries(
        stocksList.map((stock, index) => ({
          id: stock.id,
          sNo: index + 1,
          product: stock.productName || stock.product?.productName || `Product ${stock.productId}`,
          category: stock.categoryName || stock.category?.categoryName || `Category ${stock.categoryId}`,
          subCategory:
            stock.subCategoryName ||
            stock.subCategory?.subCategoryName ||
            `Sub ${stock.subCategoryId}`,
          description: stock.description || "",
          quantity: stock.quantity || 0,
          unitPrice: stock.unitPrice || 0,
          totalBalance: (
            parseFloat(stock.quantity || 0) * parseFloat(stock.unitPrice || 0)
          ).toFixed(2),
          acToCredit: stock.accountToCredit || "N/A",
          acToDebit: stock.accountToDebit || "N/A",
          productId: stock.productId,
        }))
      );
    } catch (requestError) {
      setStockEntries([]);
    } finally {
      setLoadingStocks(false);
    }
  };

  useEffect(() => {
    generateRefNumber();
    fetchDropdownData();
    fetchAccounts();
    fetchExistingStocks();
  }, []);

  useEffect(() => {
    if (!formData.productId) {
      setProductExists(false);
      setExistingStockDetails(null);
      setDuplicateWarning("");
      return;
    }

    const existing =
      stockEntries.find(
        (entry) => String(entry.productId) === String(formData.productId)
      ) ||
      pendingStockEntries.find(
        (entry) => String(entry.productId) === String(formData.productId)
      );

    if (!existing) {
      setProductExists(false);
      setExistingStockDetails(null);
      setDuplicateWarning("");
      return;
    }

    setProductExists(true);
    setExistingStockDetails(existing);
    setDuplicateWarning(
      "This product already has a stock entry. Update the current stock instead of creating a duplicate."
    );
  }, [formData.productId, stockEntries, pendingStockEntries]);

  const resolveProductMatch = (value) => {
    if (!value) return null;
    const normalized = value.trim().toLowerCase();
    return (
      products.find(
        (product) =>
          String(product.id) === normalized ||
          (product.productName || product.name || "").trim().toLowerCase() ===
            normalized
      ) || null
    );
  };

  const applyProduct = (product, rawValue = "") => {
    if (!product) {
      setFormData((prev) => ({
        ...prev,
        productSearch: rawValue,
        productId: "",
        categoryId: "",
        subCategoryId: "",
      }));
      setSubCategories([]);
      return;
    }

    const categoryId = product.categoryId || product.category?.id || "";
    const subCategoryId = product.subCategoryId || product.subCategory?.id || "";

    setFormData((prev) => ({
      ...prev,
      productSearch: product.productName || product.name || rawValue,
      productId: String(product.id),
      categoryId: String(categoryId),
      subCategoryId: String(subCategoryId),
      description:
        prev.description ||
        product.productDescription ||
        product.description ||
        "",
    }));

    fetchSubCategories(categoryId);
  };

  const handleProductInputChange = (e) => {
    const { value } = e.target;
    const product = resolveProductMatch(value);
    applyProduct(product, value);
    if (error) setError("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const resetForm = () => {
    setFormData((prev) => ({
      stockDate: prev.stockDate,
      productSearch: "",
      productId: "",
      categoryId: "",
      subCategoryId: "",
      unitPrice: "",
      costPrice: "",
      sellingPrice: "",
      supplierId: "",
      warehouseId: "",
      description: "",
      quantity: "",
      reorderLevel: 0,
      accountToCredit: "",
      accountToDebit: "",
      enteredBy: 1,
      isOpeningStock: true,
    }));
    setSubCategories([]);
  };

  const handleInsertRecord = (e) => {
    e.preventDefault();

    if (productExists) {
      setDuplicateWarning(
        "This product already has a stock entry. Update the current stock instead."
      );
      return;
    }

    const requiredFields = [
      "stockDate",
      "productId",
      "description",
      "quantity",
      "unitPrice",
      "accountToCredit",
      "accountToDebit",
    ];

    // Add source-specific required field
    if (sourceType === "supplier") {
      requiredFields.push("supplierId");
    } else if (sourceType === "warehouse") {
      requiredFields.push("warehouseId");
    }

    const missingFields = requiredFields.filter((field) => !formData[field]);
    if (missingFields.length > 0) {
      setError(`Please fill the following fields: ${missingFields.join(", ")}`);
      return;
    }

    setError("");
    setSuccess("");

    // Resolve account codes from the selected labels (which include both name and code)
    const selectedCreditAccount = accountOptions.find(
      (acc) => acc.label === formData.accountToCredit
    );
    const selectedDebitAccount = accountOptions.find(
      (acc) => acc.label === formData.accountToDebit
    );

    const stockRequest = {
      productId: parseInt(formData.productId, 10),
      categoryId: formData.categoryId ? parseInt(formData.categoryId, 10) : null,
      subCategoryId: formData.subCategoryId
        ? parseInt(formData.subCategoryId, 10)
        : null,
      supplierId: sourceType === "supplier" ? parseInt(formData.supplierId, 10) : null,
      warehouseId: sourceType === "warehouse" ? parseInt(formData.warehouseId, 10) : null,
      sourceType: sourceType,
      description: formData.description,
      quantity: parseInt(formData.quantity, 10),
      reorderLevel: parseInt(formData.reorderLevel, 10) || 0,
      unitPrice: formData.unitPrice.toString(),
      costPrice: formData.costPrice ? formData.costPrice.toString() : "",
      // Selling price mirrors the unit price field (which is the selling price).
      sellingPrice: formData.unitPrice ? formData.unitPrice.toString() : "",
      // Store GL code, not the display label; resolves via Account.glCode matching
      accountToCredit: selectedCreditAccount?.code || "",
      accountToDebit: selectedDebitAccount?.code || "",
      // Include branchId for branch-scoped stock writes (null = central/company-wide)
      branchId: effectiveBranchId,
      stockDate: formData.stockDate,
      enteredBy: 1,
      isOpeningStock: true,
      productName: formData.productSearch,
      categoryName: selectedCategory?.categoryName || selectedCategory?.name || "",
      subCategoryName:
        selectedSubCategory?.subCategoryName || selectedSubCategory?.name || "",
      referenceNumber: refNumber,
    };

    setPendingStockEntries((current) => [
      ...current,
      {
        ...stockRequest,
        id: `pending-${Date.now()}`,
        sNo: current.length + 1,
        product: stockRequest.productName,
        category: stockRequest.categoryName,
        subCategory: stockRequest.subCategoryName,
        totalBalance: (
          Number(stockRequest.quantity || 0) * Number(stockRequest.unitPrice || 0)
        ).toFixed(2),
        acToCredit: stockRequest.accountToCredit,
        acToDebit: stockRequest.accountToDebit,
        requestData: stockRequest,
      },
    ]);

    resetForm();
    generateRefNumber();
    setSuccess("Stock entry inserted. Click Save Inserted Goods to send it to the backend.");
  };

  const handleSavePendingEntries = async () => {
    if (pendingStockEntries.length === 0) {
      setError("Insert at least one stock entry before saving.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await Promise.all(
        pendingStockEntries.map((entry) =>
          createApprovalRequest({
            approvalType: APPROVAL_TYPES.stockAdd,
            requestedBy: user?.id || user?.userId || 0,
            requestData: entry.requestData,
            comments: "Add to stock submitted for admin approval.",
          })
        )
      );

      setPendingStockEntries([]);
      setSuccess("Inserted goods saved to the backend and sent for admin approval.");

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (requestError) {
      setError(requestError?.message || "Failed to save inserted goods.");
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find(
    (category) => String(category.id) === String(formData.categoryId)
  );
  const selectedSubCategory = subCategories.find(
    (subCategory) => String(subCategory.id) === String(formData.subCategoryId)
  );

  return (
    <>
      {!modalAddSuccess && (
        <div className="stock-add-container">
          <div className="stock-add-shell">
            <div className="stock-add-header">
              <div className="stock-add-title-block">
                <p className="stock-add-eyebrow">Inventory Setup</p>
                <h1 className="stock-add-title">Add New Stock</h1>
                <p className="stock-add-subtitle">
                  Type the product name, let the system pull its category and
                  sub-category, and post the stock against real accounting
                  account details.
                </p>
                <div style={{ marginTop: "0.5rem" }}>
                  <BranchBadge />
                </div>
              </div>
              <div className="stock-add-actions">
                <button className="icon-btn close-btn" onClick={toggleStockAdd}>
                  ×
                </button>
              </div>
            </div>

            <div className="ref-number">Reference: {refNumber} (auto generated)</div>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            {duplicateWarning && (
              <div className="stock-warning-card">
                <div className="stock-warning-icon">!</div>
                <div>
                  <h4>Product Already Has Stock</h4>
                  <p>{duplicateWarning}</p>
                  {existingStockDetails && (
                    <span>
                      Current quantity {existingStockDetails.quantity}, unit price N
                      {parseFloat(existingStockDetails.unitPrice).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            )}
            {loadingDropdowns && <div className="loading-message">Loading data...</div>}

            <form onSubmit={handleInsertRecord} className="stock-add-form">
              {/* Source Type Selector */}
              <div style={{
                marginBottom: '2rem',
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #0867db'
              }}>
                <label className="form-label" style={{ marginBottom: '0.8rem', display: 'block' }}>
                  STOCK SOURCE TYPE
                </label>
                <div style={{ display: 'flex', gap: '2rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="sourceType"
                      value="supplier"
                      checked={sourceType === "supplier"}
                      onChange={(e) => {
                        setSourceType(e.target.value);
                        setFormData(prev => ({ ...prev, warehouseId: "" }));
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontWeight: sourceType === "supplier" ? '600' : '400' }}>Supplier</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="sourceType"
                      value="warehouse"
                      checked={sourceType === "warehouse"}
                      onChange={(e) => {
                        setSourceType(e.target.value);
                        setFormData(prev => ({ ...prev, supplierId: "" }));
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontWeight: sourceType === "warehouse" ? '600' : '400' }}>Warehouse</span>
                  </label>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-column">
                  <div className="form-group">
                    <label className="form-label">DATE</label>
                    <input
                      type="date"
                      name="stockDate"
                      value={formData.stockDate}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">PRODUCT NAME</label>
                    <input
                      type="text"
                      name="productSearch"
                      value={formData.productSearch}
                      onChange={handleProductInputChange}
                      onBlur={(e) => applyProduct(resolveProductMatch(e.target.value), e.target.value)}
                      list="stock-product-options"
                      placeholder="Type product name"
                      className={`form-input ${productExists ? "input-warning" : ""}`}
                      required
                    />
                    <datalist id="stock-product-options">
                      {products.map((product) => (
                        <option
                          key={product.id}
                          value={product.productName || product.name || `Product ${product.id}`}
                        />
                      ))}
                    </datalist>
                  </div>

                  <div className="form-group">
                    <div className="linked-field-header">
                      <label className="form-label">CATEGORY</label>
                      <button
                        type="button"
                        className="linked-add-btn"
                        onClick={() => navigate("/categories")}
                      >
                        + {selectedCategory ? "Manage" : "Add"}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={selectedCategory?.categoryName || selectedCategory?.name || ""}
                      className="form-input"
                      placeholder="Category will fill automatically"
                      readOnly
                      disabled
                    />
                  </div>

                  <div className="form-group">
                    <div className="linked-field-header">
                      <label className="form-label">SUB CATEGORY</label>
                      <button
                        type="button"
                        className="linked-add-btn"
                        onClick={() => navigate("/subcategories")}
                      >
                        + {selectedSubCategory ? "Manage" : "Add"}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={
                        selectedSubCategory?.subCategoryName ||
                        selectedSubCategory?.name ||
                        ""
                      }
                      className="form-input"
                      placeholder="Sub-category will fill automatically"
                      readOnly
                      disabled
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">COST PRICE (UNIT)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="costPrice"
                      value={formData.costPrice}
                      onChange={handleChange}
                      placeholder="Enter cost price"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">SELLING PRICE (UNIT)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="unitPrice"
                      value={formData.unitPrice}
                      onChange={handleChange}
                      placeholder="Enter selling price"
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-column">
                  {sourceType === "supplier" && (
                    <div className="form-group">
                      <div className="linked-field-header">
                        <label className="form-label">SUPPLIER</label>
                        <button
                          type="button"
                          className="linked-add-btn"
                          onClick={refreshSuppliers}
                        >
                          Refresh
                        </button>
                      </div>
                      <select
                        name="supplierId"
                        value={formData.supplierId}
                        onChange={handleChange}
                        className="form-input form-select"
                        required
                      >
                        <option value="">Select supplier</option>
                        {suppliers.map((supplier, index) => (
                          <option
                            key={supplier.id || supplier.supplierId || index}
                            value={String(supplier.id || supplier.supplierId)}
                          >
                            {supplier.companyName ||
                              supplier.customerName ||
                              supplier.name ||
                              `Supplier ${supplier.id || supplier.supplierId}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {sourceType === "warehouse" && (
                    <div className="form-group">
                      <label className="form-label">WAREHOUSE</label>
                      <select
                        name="warehouseId"
                        value={formData.warehouseId}
                        onChange={handleChange}
                        className="form-input form-select"
                        required
                      >
                        <option value="">Select warehouse</option>
                        {warehouses.map((warehouse, index) => (
                          <option
                            key={warehouse.id || index}
                            value={String(warehouse.id)}
                          >
                            {warehouse.warehouseName || `Warehouse ${warehouse.id}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">DESCRIPTION</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Enter stock description"
                      className="form-input form-textarea"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">QUANTITY</label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      placeholder="Enter quantity"
                      className="form-input"
                      min="1"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">ACCOUNT TO CREDIT</label>
                    <select
                      name="accountToCredit"
                      value={formData.accountToCredit}
                      onChange={handleChange}
                      className="form-input form-select"
                      disabled={loadingAccounts}
                      required
                    >
                      <option value="">
                        {loadingAccounts ? "Loading accounts..." : "Select account detail"}
                      </option>
                      {accountOptions.map((account) => (
                        <option key={`credit-${account.code}`} value={account.label}>
                          {account.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">ACCOUNT TO DEBIT</label>
                    <select
                      name="accountToDebit"
                      value={formData.accountToDebit}
                      onChange={handleChange}
                      className="form-input form-select"
                      disabled={loadingAccounts}
                      required
                    >
                      <option value="">
                        {loadingAccounts ? "Loading accounts..." : "Select account detail"}
                      </option>
                      {accountOptions.map((account) => (
                        <option key={`debit-${account.code}`} value={account.label}>
                          {account.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="button-container">
                <button
                  type="submit"
                  className={`insert-btn ${productExists ? "btn-disabled" : ""}`}
                  disabled={loading || loadingDropdowns || loadingAccounts || productExists}
                >
                  Insert Record
                </button>
              </div>
            </form>

            <div className="stock-table-panel">
              <div className="stock-table-panel-header">
                <div>
                  <h2>Inserted Goods Ready To Save</h2>
                  <p>
                    Inserted rows stay here first. Click Save to store the request in the backend approval queue.
                  </p>
                </div>
                <button
                  type="button"
                  className="stock-save-btn"
                  onClick={handleSavePendingEntries}
                  disabled={loading || pendingStockEntries.length === 0}
                >
                  {loading ? "Saving..." : "Save Inserted Goods"}
                </button>
              </div>

              <div className="table-container pending-table-container">
                <table className="stock-table">
                  <thead>
                    <tr>
                      <th>S/N</th>
                      <th>PRODUCT</th>
                      <th>CATEGORY</th>
                      <th>SUB-CATEGORY</th>
                      <th>DESCRIPTION</th>
                      <th>QUANTITY</th>
                      <th>UNIT PRICE</th>
                      <th>TOTAL BALANCE</th>
                      <th>A/C TO CREDIT</th>
                      <th>A/C TO DEBIT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingStockEntries.length === 0 ? (
                      <tr className="empty-row">
                        <td colSpan="10">No inserted goods waiting to be saved.</td>
                      </tr>
                    ) : (
                      pendingStockEntries.map((entry, index) => (
                        <tr key={entry.id} className={index % 2 === 0 ? "even-row" : "odd-row"}>
                          <td>{index + 1}</td>
                          <td>{entry.product}</td>
                          <td>{entry.category}</td>
                          <td>{entry.subCategory}</td>
                          <td>{entry.description}</td>
                          <td>{entry.quantity}</td>
                          <td>{entry.unitPrice}</td>
                          <td>{entry.totalBalance}</td>
                          <td>{entry.acToCredit}</td>
                          <td>{entry.acToDebit}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {modalAddSuccess && <AddSuccessMsg />}
    </>
  );
};

export default StockAdd;
