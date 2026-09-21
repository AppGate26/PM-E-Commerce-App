import React, { useEffect, useState } from "react";
import { apiRequest, apiRequestMultipart } from "../../../../lib/config";
import "./EditProduct.css";

const parseListResponse = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.response?.data)) return response.response.data;
  if (Array.isArray(response?.response)) return response.response;
  return [];
};

const EditProductModal = ({ product, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [productImage, setProductImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(product.productImage || null);
  const [formData, setFormData] = useState({
    productName: product.productName || "",
    productDescription: product.productDescription || "",
    categoryId: product.categoryId?.toString() || "",
    subCategoryId: product.subCategoryId?.toString() || "",
    productCostPrice:
      product.costPrice?.toString() || product.productCostPrice?.toString() || "",
    productSupplierPrice:
      product.sellingPrice?.toString() ||
      product.productSellingPrice?.toString() ||
      "",
    productManufacturer: product.manufacturerName || "",
    supplierId: product.supplierId?.toString() || "",
    quantity: product.quantity?.toString() || "",
    reorderLevel: product.reorderLevel?.toString() || "",
    weightKg: product.weightKg?.toString() || "",
  });

  useEffect(() => {
    document.body.classList.add("product_active-modal");
    return () => {
      document.body.classList.remove("product_active-modal");
    };
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await apiRequest("/admin/categories", "GET");
        setCategories(parseListResponse(response));
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const loadSubCategories = async () => {
      if (!formData.categoryId) {
        setSubCategories([]);
        return;
      }

      try {
        setLoadingSubCategories(true);
        const response = await apiRequest(
          `/categories/${formData.categoryId}/sub-categories`,
          "GET"
        );
        setSubCategories(parseListResponse(response));
      } finally {
        setLoadingSubCategories(false);
      }
    };

    loadSubCategories();
  }, [formData.categoryId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProductImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const required = [
      ["productName", "product name"],
      ["productDescription", "product description"],
      ["categoryId", "product category"],
      ["subCategoryId", "product sub-category"],
      ["productCostPrice", "cost price"],
      ["productSupplierPrice", "selling price"],
      ["productManufacturer", "product manufacturer"],
    ];

    const missing = required
      .filter(([key]) => !String(formData[key] || "").trim())
      .map(([, label]) => label);

    if (missing.length) {
      setError(`Please fill out the following fields: ${missing.join(", ")}`);
      return;
    }

    try {
      setLoading(true);
      const productId = product.id || product.productId;
      if (!productId) {
        setError("Product ID is missing. Cannot update product.");
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append("productName", formData.productName.trim());
      formDataToSend.append(
        "productDescription",
        formData.productDescription.trim()
      );
      formDataToSend.append("categoryId", parseInt(formData.categoryId, 10));
      formDataToSend.append("subCategoryId", parseInt(formData.subCategoryId, 10));
      formDataToSend.append("costPrice", parseFloat(formData.productCostPrice));
      formDataToSend.append(
        "sellingPrice",
        parseFloat(formData.productSupplierPrice)
      );
      formDataToSend.append(
        "manufacturerName",
        formData.productManufacturer.trim()
      );

      if (formData.quantity) {
        formDataToSend.append("quantity", parseInt(formData.quantity, 10));
      }
      if (formData.supplierId) {
        formDataToSend.append("supplierId", parseInt(formData.supplierId, 10));
      }
      if (formData.reorderLevel) {
        formDataToSend.append(
          "reorderLevel",
          parseInt(formData.reorderLevel, 10)
        );
      }
      if (formData.weightKg) {
        formDataToSend.append("weightKg", formData.weightKg);
      }
      if (productImage) {
        formDataToSend.append("productImage", productImage);
      }

      await apiRequestMultipart(`/admin/products/${productId}`, "PUT", formDataToSend);
      onSuccess();
    } catch (submitError) {
      setError(
        submitError?.message ||
          `Failed to update product (ID: ${product.id || product.productId}). Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-product-modal">
      <div className="edit-product-modal-overlay" onClick={onClose}></div>
      <div className="edit-product-modal-content">
        <div className="edit-modal-header">
          <div className="edit-modal-title-block">
            <p className="edit-modal-eyebrow">Inventory Setup</p>
            <h2 className="edit-modal-title">Edit Product</h2>
            <p className="edit-modal-subtitle">
              Review product details, update category mapping, and keep pricing
              and stock values in sync from one standard editor.
            </p>
          </div>
          <button className="edit-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-product-form">
          <div className="row">
            <div className="col-md-6 inputs-box">
              <label>product name</label>
              <input
                name="productName"
                type="text"
                className="product-input"
                value={formData.productName}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <div className="col-md-6 inputs-box">
              <label>product category</label>
              <select
                name="categoryId"
                className="product-input"
                value={formData.categoryId}
                onChange={handleChange}
                disabled={loading || loadingCategories}
                required
              >
                <option value="">
                  {loadingCategories ? "Loading categories..." : "Select product category"}
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-12 inputs-box">
              <label>product description</label>
              <textarea
                name="productDescription"
                rows="4"
                className="description-input"
                value={formData.productDescription}
                onChange={handleChange}
                disabled={loading}
                required
              ></textarea>
            </div>

            <div className="col-md-6 inputs-box">
              <label>product sub-category</label>
              <select
                name="subCategoryId"
                className="product-input"
                value={formData.subCategoryId}
                onChange={handleChange}
                disabled={loading || !formData.categoryId || loadingSubCategories}
                required
              >
                <option value="">
                  {!formData.categoryId
                    ? "Select category first"
                    : loadingSubCategories
                    ? "Loading subcategories..."
                    : subCategories.length === 0
                    ? "No subcategories available"
                    : "Select sub-category"}
                </option>
                {subCategories.map((subCat) => (
                  <option key={subCat.id} value={subCat.id}>
                    {subCat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6 inputs-box">
              <label>supplier id (optional)</label>
              <input
                name="supplierId"
                type="number"
                className="product-input"
                value={formData.supplierId}
                onChange={handleChange}
                disabled={loading}
                placeholder="Enter supplier ID"
              />
            </div>

            <div className="col-md-6 inputs-box">
              <label>cost price</label>
              <input
                name="productCostPrice"
                type="number"
                step="0.01"
                className="product-input"
                value={formData.productCostPrice}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <div className="col-md-6 inputs-box">
              <label>selling price</label>
              <input
                name="productSupplierPrice"
                type="number"
                step="0.01"
                className="product-input"
                value={formData.productSupplierPrice}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <div className="col-md-6 inputs-box">
              <label>quantity</label>
              <input
                name="quantity"
                type="number"
                className="product-input"
                value={formData.quantity}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="col-md-6 inputs-box">
              <label>reorder level (optional)</label>
              <input
                name="reorderLevel"
                type="number"
                className="product-input"
                value={formData.reorderLevel}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="col-md-6 inputs-box">
              <label>weight (kg)</label>
              <input
                name="weightKg"
                type="number"
                min="0"
                step="0.001"
                className="product-input"
                value={formData.weightKg}
                onChange={handleChange}
                disabled={loading}
                placeholder="e.g. 2.5"
              />
            </div>

            <div className="col-md-6 inputs-box">
              <label>product manufacturer</label>
              <input
                name="productManufacturer"
                type="text"
                className="product-input"
                value={formData.productManufacturer}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <div className="col-md-6 inputs-box">
              <label>upload product image</label>
              <div className="image-uploader-box">
                <input
                  type="file"
                  id="edit-upload-input"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={loading}
                />
                <div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    className="bi bi-upload icon-uploader"
                    viewBox="0 0 16 16"
                  >
                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5" />
                    <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708z" />
                  </svg>
                </div>
              </div>
              {imagePreview && (
                <div className="image-preview-container">
                  <img src={imagePreview} alt="Product preview" className="image-preview" />
                </div>
              )}
            </div>
          </div>

          {error && <p className="login-error edit-product-error">{error}</p>}

          <div className="edit-modal-actions">
            <button
              type="button"
              className="cancel-edit-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="save-edit-btn"
              disabled={loading || loadingCategories}
            >
              {loading ? "Updating..." : "Update Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;
