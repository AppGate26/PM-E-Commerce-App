import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { apiRequest } from "../../../../lib/config";
import { getAccountOptions } from "../../../../lib/accountingApi";
import "./StockDetail.css";

const StockDetail = () => {
  const { stockId } = useParams();
  const navigate = useNavigate();
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Dropdown data
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [accountOptions, setAccountOptions] = useState([]);

  const [formData, setFormData] = useState({
    productId: "",
    categoryId: "",
    subCategoryId: "",
    supplierId: "",
    description: "",
    quantity: "",
    reorderLevel: "",
    unitPrice: "",
    accountToCredit: "",
    accountToDebit: "",
    date: "",
  });

  const [adjustQuantity, setAdjustQuantity] = useState("");
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  useEffect(() => {
    console.log("StockDetail: Component mounted with stockId:", stockId);
    fetchDropdownData();
    fetchStock();
  }, [stockId]);

  useEffect(() => {
    if (formData.categoryId) {
      fetchSubCategories(formData.categoryId);
    } else {
      setSubCategories([]);
    }
  }, [formData.categoryId]);

  const fetchDropdownData = async () => {
    try {
      // Fetch products
      try {
        let response = await apiRequest("/products?size=500", "GET");
        let productsList = [];
        if (Array.isArray(response)) {
          productsList = response;
        } else if (response?.data && Array.isArray(response.data)) {
          productsList = response.data;
        } else if (response?.content && Array.isArray(response.content)) {
          productsList = response.content;
        } else if (response?.response?.content && Array.isArray(response.response.content)) {
          productsList = response.response.content;
        }
        setProducts(productsList);
      } catch (err) {
        console.error("StockDetail: Error fetching products:", err);
      }

      // Fetch categories
      try {
        const response = await apiRequest("/admin/categories", "GET");
        let categoriesList = [];
        if (Array.isArray(response)) {
          categoriesList = response;
        } else if (response?.data && Array.isArray(response.data)) {
          categoriesList = response.data;
        } else if (response?.response?.data && Array.isArray(response.response.data)) {
          categoriesList = response.response.data;
        } else if (response?.response && Array.isArray(response.response)) {
          categoriesList = response.response;
        }
        setCategories(categoriesList);
      } catch (err) {
        console.error("StockDetail: Error fetching categories:", err);
      }

      // Fetch suppliers
      try {
        const response = await apiRequest("/users/suppliers", "GET");
        let suppliersList = [];
        if (Array.isArray(response)) {
          suppliersList = response;
        } else if (response?.data && Array.isArray(response.data)) {
          suppliersList = response.data;
        } else if (response?.response?.data && Array.isArray(response.response.data)) {
          suppliersList = response.response.data;
        } else if (response?.response && Array.isArray(response.response)) {
          suppliersList = response.response;
        }
        setSuppliers(suppliersList);
      } catch (err) {
        console.error("StockDetail: Error fetching suppliers:", err);
      }

      try {
        const accounts = await getAccountOptions();
        setAccountOptions(accounts);
      } catch (err) {
        console.error("StockDetail: Error fetching account options:", err);
        setAccountOptions([]);
        setError(err?.message || "Failed to load account details from backend.");
      }
    } catch (err) {
      console.error("StockDetail: Error fetching dropdown data:", err);
    }
  };

  const fetchSubCategories = async (categoryId) => {
    try {
      const response = await apiRequest(
        `/categories/${categoryId}/sub-categories`,
        "GET"
      );
      let subCategoriesList = [];
      if (Array.isArray(response)) {
        subCategoriesList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        subCategoriesList = response.data;
      } else if (response?.response?.data && Array.isArray(response.response.data)) {
        subCategoriesList = response.response.data;
      } else if (response?.response && Array.isArray(response.response)) {
        subCategoriesList = response.response;
      }
      setSubCategories(subCategoriesList);
    } catch (err) {
      console.error("StockDetail: Error fetching subcategories:", err);
      setSubCategories([]);
    }
  };

  const fetchStock = async () => {
    try {
      setLoading(true);
      setError("");
      
      console.log("═══════════════════════════════════════════════════════════");
      console.log("🔵 StockDetail: ========== FETCHING STOCK ==========");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("StockDetail: Stock ID:", stockId);
      console.log("StockDetail: API endpoint: /admin/stocks/" + stockId);
      console.log("StockDetail: Method: GET");
      
      const response = await apiRequest(`/admin/stocks/${stockId}`, "GET");
      console.log("StockDetail: Raw API response:", response);
      
      let stockData = response;
      if (response?.data) {
        stockData = response.data;
      } else if (response?.response?.data) {
        stockData = response.response.data;
      } else if (response?.response) {
        stockData = response.response;
      }
      
      console.log("StockDetail: Final stock data:", stockData);
      console.log("═══════════════════════════════════════════════════════════");
      console.log("✅ StockDetail: STOCK FETCHED SUCCESSFULLY");
      console.log("═══════════════════════════════════════════════════════════");
      
      setStock(stockData);
      initializeFormData(stockData);
    } catch (err) {
      console.error("═══════════════════════════════════════════════════════════");
      console.error("❌ StockDetail: ERROR FETCHING STOCK");
      console.error("═══════════════════════════════════════════════════════════");
      console.error("StockDetail: Error message:", err?.message);
      console.error("StockDetail: Error stack:", err?.stack);
      setError(err?.message || "Failed to load stock.");
    } finally {
      setLoading(false);
    }
  };

  const initializeFormData = (stockData) => {
    console.log("StockDetail: Initializing form data with:", stockData);
    
    setFormData({
      productId: stockData.productId || stockData.product?.id || "",
      categoryId: stockData.categoryId || stockData.category?.id || "",
      subCategoryId: stockData.subCategoryId || stockData.subCategory?.id || "",
      supplierId: stockData.supplierId || stockData.supplier?.id || "",
      description: stockData.description || "",
      quantity: stockData.quantity || "",
      reorderLevel: stockData.reorderLevel || "",
      unitPrice: stockData.unitPrice || "",
      accountToCredit: stockData.accountToCredit || "",
      accountToDebit: stockData.accountToDebit || "",
      date: stockData.date || stockData.createdAt || "",
    });

    // Fetch subcategories if category is set
    if (stockData.categoryId || stockData.category?.id) {
      fetchSubCategories(stockData.categoryId || stockData.category?.id);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const requiredFields = [
      "productId",
      "categoryId",
      "subCategoryId",
      "supplierId",
      "description",
      "quantity",
      "unitPrice",
      "accountToCredit",
      "accountToDebit",
      "date",
    ];
    const emptyFields = requiredFields.filter((field) => !formData[field]);
    
    if (emptyFields.length > 0) {
      setError(`Please fill the following fields: ${emptyFields.join(", ")}`);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      console.log("═══════════════════════════════════════════════════════════");
      console.log("🔵 StockDetail: UPDATING STOCK");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("StockDetail: Stock ID:", stockId);
      console.log("StockDetail: Form data:", formData);

      const requestBody = {
        productId: parseInt(formData.productId),
        categoryId: parseInt(formData.categoryId),
        subCategoryId: parseInt(formData.subCategoryId),
        supplierId: parseInt(formData.supplierId),
        description: formData.description,
        quantity: parseInt(formData.quantity),
        reorderLevel: parseInt(formData.reorderLevel) || 0,
        unitPrice: formData.unitPrice.toString(),
        accountToCredit: formData.accountToCredit,
        accountToDebit: formData.accountToDebit,
        date: formData.date,
      };

      console.log("StockDetail: Request body:", requestBody);
      console.log("StockDetail: Calling PUT /admin/stocks/" + stockId);

      const response = await apiRequest(`/admin/stocks/${stockId}`, "PUT", requestBody);

      console.log("StockDetail: API response:", response);
      console.log("═══════════════════════════════════════════════════════════");
      console.log("✅ StockDetail: STOCK UPDATED SUCCESSFULLY");
      console.log("═══════════════════════════════════════════════════════════");

      setSuccess("Stock updated successfully!");
      setStock(response?.data || response?.response?.data || response);
      
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("═══════════════════════════════════════════════════════════");
      console.error("❌ StockDetail: ERROR UPDATING STOCK");
      console.error("═══════════════════════════════════════════════════════════");
      console.error("StockDetail: Error message:", err?.message);
      console.error("StockDetail: Error stack:", err?.stack);
      setError(err?.message || "Failed to update stock. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this stock entry? This action cannot be undone.")) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      console.log("═══════════════════════════════════════════════════════════");
      console.log("🔵 StockDetail: DELETING STOCK");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("StockDetail: Stock ID:", stockId);
      console.log("StockDetail: Calling DELETE /admin/stocks/" + stockId);

      await apiRequest(`/admin/stocks/${stockId}`, "DELETE");

      console.log("═══════════════════════════════════════════════════════════");
      console.log("✅ StockDetail: STOCK DELETED SUCCESSFULLY");
      console.log("═══════════════════════════════════════════════════════════");

      setSuccess("Stock deleted successfully!");
      
      setTimeout(() => {
        navigate("/inventory/stocks");
      }, 1500);
    } catch (err) {
      console.error("═══════════════════════════════════════════════════════════");
      console.error("❌ StockDetail: ERROR DELETING STOCK");
      console.error("═══════════════════════════════════════════════════════════");
      console.error("StockDetail: Error message:", err?.message);
      console.error("StockDetail: Error stack:", err?.stack);
      setError(err?.message || "Failed to delete stock. Please try again.");
      setSaving(false);
    }
  };

  const handleAdjustQuantity = async () => {
    if (!adjustQuantity || adjustQuantity === "0") {
      setError("Please enter a valid quantity adjustment.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      console.log("═══════════════════════════════════════════════════════════");
      console.log("🔵 StockDetail: ADJUSTING STOCK QUANTITY");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("StockDetail: Stock ID:", stockId);
      console.log("StockDetail: Adjustment quantity:", adjustQuantity);
      console.log("StockDetail: Calling PATCH /admin/stocks/" + stockId + "/adjust?quantity=" + adjustQuantity);

      // PATCH /api/admin/stocks/{id}/adjust?quantity={quantity}
      const response = await apiRequest(
        `/admin/stocks/${stockId}/adjust?quantity=${parseInt(adjustQuantity)}`,
        "PATCH"
      );

      console.log("StockDetail: API response:", response);
      console.log("═══════════════════════════════════════════════════════════");
      console.log("✅ StockDetail: STOCK QUANTITY ADJUSTED SUCCESSFULLY");
      console.log("═══════════════════════════════════════════════════════════");

      setSuccess(`Stock quantity adjusted successfully! New quantity: ${response?.quantity || formData.quantity}`);
      setShowAdjustModal(false);
      setAdjustQuantity("");
      
      // Refresh stock data
      await fetchStock();
      
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("═══════════════════════════════════════════════════════════");
      console.error("❌ StockDetail: ERROR ADJUSTING STOCK QUANTITY");
      console.error("═══════════════════════════════════════════════════════════");
      console.error("StockDetail: Error message:", err?.message);
      console.error("StockDetail: Error stack:", err?.stack);
      setError(err?.message || "Failed to adjust stock quantity. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="stock-detail-container">
        <div className="stock-detail-header">
          <h1>Stock Details</h1>
          <Link to="/inventory/stocks">
            <button className="Log_Out-btn">Back to Stock List</button>
          </Link>
        </div>
        <div className="loading-message">Loading stock details...</div>
      </div>
    );
  }

  if (error && !stock) {
    return (
      <div className="stock-detail-container">
        <div className="stock-detail-header">
          <h1>Stock Details</h1>
          <Link to="/inventory/stocks">
            <button className="Log_Out-btn">Back to Stock List</button>
          </Link>
        </div>
        <div className="error-message">{error}</div>
        <button onClick={fetchStock} className="btn btn-primary mt-3">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="stock-detail-container">
      <div className="stock-detail-header">
        <h1>Stock Details</h1>
        <Link to="/inventory/stocks">
          <button className="Log_Out-btn">Back to Stock List</button>
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success" role="alert">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="stock-detail-form">
        <div className="form-grid">
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Product</label>
            <select
              name="productId"
              value={formData.productId}
              onChange={handleChange}
              required
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.productName || product.name || `Product ${product.id}`}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              required
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.categoryName || category.name || `Category ${category.id}`}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Sub-Category</label>
            <select
              name="subCategoryId"
              value={formData.subCategoryId}
              onChange={handleChange}
              required
              disabled={!formData.categoryId || subCategories.length === 0}
            >
              <option value="">Select sub-category</option>
              {subCategories.map((subCategory) => (
                <option key={subCategory.id} value={subCategory.id}>
                  {subCategory.subCategoryName || subCategory.name || `Sub-Category ${subCategory.id}`}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Supplier</label>
            <select
              name="supplierId"
              value={formData.supplierId}
              onChange={handleChange}
              required
            >
              <option value="">Select supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.companyName || supplier.name || `Supplier ${supplier.id}`}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Quantity</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label>Unit Price</label>
            <input
              type="number"
              name="unitPrice"
              value={formData.unitPrice}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label>Reorder Level</label>
            <input
              type="number"
              name="reorderLevel"
              value={formData.reorderLevel}
              onChange={handleChange}
              min="0"
            />
          </div>

          <div className="form-group">
            <label>Account to Credit</label>
            <select
              name="accountToCredit"
              value={formData.accountToCredit}
              onChange={handleChange}
              required
            >
              <option value="">Select account to credit</option>
              {accountOptions.map((account) => (
                <option key={`credit-${account.code}`} value={account.label}>
                  {account.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Account to Debit</label>
            <select
              name="accountToDebit"
              value={formData.accountToDebit}
              onChange={handleChange}
              required
            >
              <option value="">Select account to debit</option>
              {accountOptions.map((account) => (
                <option key={`debit-${account.code}`} value={account.label}>
                  {account.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group full-width">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            required
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            className="btn btn-info"
            onClick={() => setShowAdjustModal(true)}
            disabled={saving}
          >
            Adjust Quantity
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={saving}
          >
            {saving ? "Deleting..." : "Delete Stock"}
          </button>
        </div>
      </form>

      {/* Adjust Quantity Modal */}
      {showAdjustModal && (
        <div className="modal-overlay" onClick={() => setShowAdjustModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Adjust Stock Quantity</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowAdjustModal(false);
                  setAdjustQuantity("");
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Current Quantity: <strong>{formData.quantity}</strong></p>
              <p className="text-muted">
                Enter a positive number to increase, negative to decrease (e.g., +10 or -5)
              </p>
              <div className="form-group">
                <label>Adjustment Quantity</label>
                <input
                  type="number"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                  placeholder="e.g., +10 or -5"
                  className="form-control"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowAdjustModal(false);
                  setAdjustQuantity("");
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAdjustQuantity}
                disabled={saving || !adjustQuantity}
              >
                {saving ? "Adjusting..." : "Adjust Quantity"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockDetail;
