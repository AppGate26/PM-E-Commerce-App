import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BranchBadge from "../../../shared/BranchBadge";
import { apiRequest } from "../../../../lib/config";
import "./StockEdit.css";

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB");
};

const StockEdit = ({ toggleStockEdit }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stock, setStock] = useState(null);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);
  const [allStocks, setAllStocks] = useState([]);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [formData, setFormData] = useState({
    stockRef: "",
    generatedDate: "",
    product: "",
    category: "",
    subCategory: "",
    quantity: "",
    accountToDebit: "",
    supplierId: "",
    editedDate: new Date().toISOString().split("T")[0],
    description: "",
    unitPrice: "",
    accountToCredit: "",
  });

  useEffect(() => {
    const loadAllStocks = async () => {
      try {
        setLoadingStocks(true);
        const response = await apiRequest("/admin/stocks", "GET");
        let list = [];
        if (Array.isArray(response)) list = response;
        else if (Array.isArray(response?.data)) list = response.data;
        else if (Array.isArray(response?.response)) list = response.response;
        else if (Array.isArray(response?.response?.data)) list = response.response.data;
        setAllStocks(list);
      } catch {
        // non-fatal
      } finally {
        setLoadingStocks(false);
      }
    };
    loadAllStocks();
  }, []);

  useEffect(() => {
    if (!formData.stockRef.trim()) {
      setStock(null);
      return;
    }

    const loadStock = async () => {
      try {
        setLoading(true);
        setError("");
        const numericRef = parseInt(formData.stockRef, 10);

        if (!Number.isNaN(numericRef)) {
          const response = await apiRequest(`/admin/stocks/${numericRef}`, "GET");
          // Unwrap the BaseResponse envelope; otherwise setStock/populateForm get
          // { status, response: {...} } and every field renders blank.
          const stockObj =
            response?.response?.data ?? response?.response ?? response?.data ?? response;
          setStock(stockObj);
          populateForm(stockObj);
          return;
        }

        const response = await apiRequest("/admin/stocks", "GET");
        const stocks = Array.isArray(response)
          ? response
          : response?.data || response?.response || [];
        const foundStock = stocks.find(
          (entry) =>
            entry.id?.toString() === formData.stockRef ||
            entry.stockRef === formData.stockRef
        );

        if (!foundStock) {
          setError("Stock not found with this reference.");
          setStock(null);
          return;
        }

        setStock(foundStock);
        populateForm(foundStock);
      } catch (requestError) {
        setError("Stock not found. Please check the stock reference.");
        setStock(null);
      } finally {
        setLoading(false);
      }
    };

    loadStock();
  }, [formData.stockRef]);

  const populateForm = (stockData) => {
    setFormData((prev) => ({
      ...prev,
      stockRef: stockData.id?.toString() || stockData.stockRef || "",
      generatedDate:
        stockData.date || stockData.createdAt || stockData.stockDate || "",
      product: stockData.productName || stockData.product?.productName || "",
      category: stockData.categoryName || stockData.category?.categoryName || stockData.category?.name || "",
      subCategory:
        stockData.subCategoryName || stockData.subCategory?.subCategoryName || stockData.subCategory?.name || "",
      quantity: stockData.quantity || "",
      accountToDebit: stockData.accountToDebit || "",
      supplierId:
        stockData.supplierId?.toString() || stockData.supplier?.id?.toString() || "",
      editedDate: new Date().toISOString().split("T")[0],
      description: stockData.description || "",
      unitPrice: stockData.unitPrice || stockData.price || "",
      sellingPrice: stockData.sellingPrice || "",
      costPrice: stockData.costPrice || "",
      accountToCredit: stockData.accountToCredit || "",
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleUpdate = async () => {
    if (!stock?.id) {
      setError("Select a stock record before saving changes.");
      return;
    }

    const priceValue = Number(formData.unitPrice);
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      setError("Enter a valid current price (0 or greater).");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await apiRequest(`/admin/stocks/${stock.id}`, "PUT", {
        description: formData.description,
        quantity: parseInt(formData.quantity, 10) || 0,
        unitPrice: String(formData.unitPrice),
        accountToCredit: formData.accountToCredit,
        accountToDebit: formData.accountToDebit,
      });
      setShowUpdateSuccess(true);
      setTimeout(() => setShowUpdateSuccess(false), 1800);
    } catch (requestError) {
      setError(requestError?.message || "Failed to update stock.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!stock?.id) {
      setError("No stock selected to delete.");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to delete this stock entry? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      await apiRequest(`/admin/stocks/${stock.id}`, "DELETE");
      setShowDeleteSuccess(true);
      setStock(null);
      setFormData({
        stockRef: "",
        generatedDate: "",
        product: "",
        category: "",
        subCategory: "",
        quantity: "",
        accountToDebit: "",
        supplierId: "",
        editedDate: new Date().toISOString().split("T")[0],
        description: "",
        unitPrice: "",
        accountToCredit: "",
      });

      setTimeout(() => {
        setShowDeleteSuccess(false);
        toggleStockEdit();
      }, 1800);
    } catch (requestError) {
      setError(requestError?.message || "Failed to delete stock.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stock-edit-modal">
      <div className="stock-edit-card">
        <div className="stock-edit-header">
          <div>
            <p className="stock-edit-eyebrow">Inventory Setup</p>
            <h1 className="stock-edit-title">Stock Edit Setup</h1>
            <div style={{ marginTop: "0.4rem" }}>
              <BranchBadge />
            </div>
            <p className="stock-edit-subtitle">
              Search a stock record, review its posted values, and remove it only
              when the entry truly needs to be cleared from the register.
            </p>
          </div>
          <div className="stock-edit-header-actions">
            <Link to="/adminDashboard" className="stock-edit-dashboard-link">
              Dashboard
            </Link>
            <button type="button" className="stock-edit-close" onClick={toggleStockEdit}>
              ×
            </button>
          </div>
        </div>

        {error && <div className="stock-edit-alert stock-edit-alert-error">{error}</div>}

        <div className="stock-edit-grid">
          <div className="stock-edit-panel">
            <div className="stock-edit-field">
              <label>Stock Ref</label>
              <select
                name="stockRef"
                value={formData.stockRef}
                onChange={handleChange}
                className="stock-edit-input"
                disabled={loadingStocks}
              >
                <option value="">
                  {loadingStocks ? "Loading stocks..." : "Select stock reference"}
                </option>
                {allStocks.map((s) => (
                  <option key={s.id} value={s.id?.toString()}>
                    {s.stockRef || s.id} — {s.productName || s.product?.productName || ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="stock-edit-field">
              <label>Generated Date</label>
              <input
                type="text"
                value={formatDate(formData.generatedDate)}
                className="stock-edit-input"
                disabled
              />
            </div>
            <div className="stock-edit-field">
              <label>Product</label>
              <input type="text" value={formData.product} className="stock-edit-input" disabled />
            </div>
            <div className="stock-edit-field">
              <label>Category</label>
              <input type="text" value={formData.category} className="stock-edit-input" disabled />
            </div>
            <div className="stock-edit-field">
              <label>Sub-Category</label>
              <input
                type="text"
                value={formData.subCategory}
                className="stock-edit-input"
                disabled
              />
            </div>
            <div className="stock-edit-field">
              <label>Quantity</label>
              <input
                type="number"
                min="0"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="stock-edit-input"
                disabled={!stock}
              />
            </div>
          </div>

          <div className="stock-edit-panel">
            <div className="stock-edit-field">
              <label>Supplier Id</label>
              <input
                type="text"
                value={formData.supplierId}
                className="stock-edit-input"
                disabled
              />
            </div>
            <div className="stock-edit-field">
              <label>Edited Date</label>
              <input
                type="text"
                value={formatDate(formData.editedDate)}
                className="stock-edit-input"
                disabled
              />
            </div>
            <div className="stock-edit-field">
              <label>Description</label>
              <textarea
                value={formData.description}
                className="stock-edit-input stock-edit-textarea"
                disabled
              />
            </div>
            <div className="stock-edit-field">
              <label>Current Price (Selling)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                name="unitPrice"
                value={formData.unitPrice}
                onChange={handleChange}
                className="stock-edit-input"
                placeholder="Enter current price"
                disabled={!stock}
              />
            </div>
            <div className="stock-edit-field">
              <label>Account To Debit</label>
              <input
                type="text"
                value={formData.accountToDebit}
                className="stock-edit-input"
                disabled
              />
            </div>
            <div className="stock-edit-field">
              <label>Account To Credit</label>
              <input
                type="text"
                value={formData.accountToCredit}
                className="stock-edit-input"
                disabled
              />
            </div>
          </div>
        </div>

        <div className="stock-edit-footer">
          <button
            type="button"
            className="stock-edit-save"
            onClick={handleUpdate}
            disabled={loading || !stock}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            className="stock-edit-delete"
            onClick={handleDelete}
            disabled={loading || !stock}
          >
            {loading ? "Deleting..." : "Delete Stock"}
          </button>
        </div>
      </div>

      {showUpdateSuccess && (
        <div className="stock-edit-success-overlay">
          <div className="stock-edit-success-card">
            <div className="stock-edit-success-badge">✓</div>
            <p>Stock Updated</p>
            <h2>Successfully</h2>
          </div>
        </div>
      )}

      {showDeleteSuccess && (
        <div className="stock-edit-success-overlay">
          <div className="stock-edit-success-card">
            <div className="stock-edit-success-badge">✓</div>
            <p>Stock Deleted</p>
            <h2>Successfully</h2>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockEdit;
