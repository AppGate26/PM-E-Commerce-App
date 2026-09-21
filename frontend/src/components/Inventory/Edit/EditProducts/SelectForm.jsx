import React, { useState, useRef } from "react";
import { apiRequest } from "../../../../lib/config";

const SelectForm = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [checkedMap, setCheckedMap] = useState({});
  const [editValues, setEditValues] = useState({});
  const searchRef = useRef(null);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    try {
      setSearching(true);
      setError("");
      const response = await apiRequest(
        `/products/search?query=${encodeURIComponent(searchTerm)}&size=20`,
        "GET"
      );
      let list = [];
      if (Array.isArray(response)) list = response;
      else if (Array.isArray(response?.content)) list = response.content;
      else if (Array.isArray(response?.data)) list = response.data;
      else if (Array.isArray(response?.response?.content)) list = response.response.content;
      else if (Array.isArray(response?.response)) list = response.response;
      setSearchResults(list);
      if (list.length === 0) setError("No products found for this search.");
    } catch (err) {
      setError(err?.message || "Search failed.");
    } finally {
      setSearching(false);
    }
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setSearchResults([]);
    setSearchTerm(product.productName || product.name || "");
    setCheckedMap({});
    setEditValues({
      productName: product.productName || product.name || "",
      supplierId: product.supplierId || product.supplier?.id || "",
      category: product.category?.name || product.categoryName || "",
      subCategory: product.subCategory?.name || product.subCategoryName || "",
      description: product.description || "",
      costPrice: product.costPrice || product.cost || "",
      sellingPrice: product.sellingPrice || product.price || "",
      quantity: product.quantity || "",
      manufacturer: product.manufacturer || "",
    });
    setError("");
    setSuccess("");
  };

  const toggleCheck = (fieldKey) => {
    if (!selectedProduct) return;
    setCheckedMap((prev) => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  const handleEditChange = (fieldKey, value) => {
    setEditValues((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const handleSave = async () => {
    if (!selectedProduct) {
      setError("Please select a product first.");
      return;
    }
    const changedFields = Object.keys(checkedMap).filter((k) => checkedMap[k]);
    if (changedFields.length === 0) {
      setError("Click the edit icon next to a field to mark it for update.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      const payload = {};
      changedFields.forEach((key) => {
        payload[key] = editValues[key];
      });
      await apiRequest(`/admin/products/${selectedProduct.id}`, "PUT", {
        ...payload,
        productName: editValues.productName,
      });
      setSuccess("Product updated successfully.");
      setCheckedMap({});
    } catch (err) {
      setError(err?.message || "Failed to update product.");
    } finally {
      setSaving(false);
    }
  };

  const FIELD_GROUPS = [
    {
      title: "Search And Lookup",
      fields: [
        { key: "productName", label: "Product Name", placeholder: "Product name" },
        { key: "supplierId", label: "Supplier Id", placeholder: "Supplier id", readOnly: true },
      ],
    },
    {
      title: "Product Structure",
      fields: [
        { key: "category", label: "Category", placeholder: "Category", readOnly: true },
        { key: "subCategory", label: "Subcategory", placeholder: "Subcategory", readOnly: true },
        { key: "description", label: "Description", placeholder: "Description" },
      ],
    },
    {
      title: "Pricing And Stock",
      fields: [
        { key: "costPrice", label: "Cost Price", placeholder: "Cost price" },
        { key: "sellingPrice", label: "Selling Price", placeholder: "Selling price" },
        { key: "quantity", label: "Quantity In Store", placeholder: "Quantity in store", readOnly: true },
        { key: "manufacturer", label: "Manufacturer", placeholder: "Manufacturer name" },
      ],
    },
  ];

  return (
    <div className="select-form-bg edit-workspace">
      <div className="edit-workspace-header">
        <div>
          <p className="edit-workspace-eyebrow">Editor Panel</p>
          <h3 className="edit-workspace-title">Product Selection Workspace</h3>
          <p className="edit-workspace-subtitle">
            Search for the product you want, click the edit icon to unlock a field, update it, then save.
          </p>
        </div>
        <div className="edit-workspace-summary">
          <span>Standard workflow</span>
          <strong>Search, review, update</strong>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ padding: "0 1rem 1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <input
          ref={searchRef}
          type="text"
          className="products-form"
          placeholder="Search by name or product id"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          style={{ flex: 1 }}
        />
        <button
          type="button"
          className="btn-save"
          style={{ padding: "0.4rem 1.2rem", whiteSpace: "nowrap" }}
          onClick={handleSearch}
          disabled={searching}
        >
          {searching ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Search results dropdown */}
      {searchResults.length > 0 && (
        <ul
          style={{
            margin: "0 1rem 1rem",
            padding: 0,
            listStyle: "none",
            border: "1px solid #dee2e6",
            borderRadius: "6px",
            maxHeight: "200px",
            overflowY: "auto",
            backgroundColor: "#fff",
            zIndex: 10,
            position: "relative",
          }}
        >
          {searchResults.map((p) => (
            <li
              key={p.id}
              style={{
                padding: "0.6rem 1rem",
                cursor: "pointer",
                borderBottom: "1px solid #f0f0f0",
              }}
              onClick={() => handleSelectProduct(p)}
            >
              <strong>{p.productName || p.name}</strong>
              <span style={{ color: "#888", marginLeft: "0.5rem" }}>
                (ID: {p.id})
              </span>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <div style={{ color: "#dc3545", padding: "0 1rem 0.5rem", fontSize: "0.85rem" }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ color: "#28a745", padding: "0 1rem 0.5rem", fontSize: "0.85rem" }}>
          {success}
        </div>
      )}

      <div className="edit-workspace-groups">
        {FIELD_GROUPS.map((group, groupIndex) => (
          <section key={group.title} className="edit-workspace-group">
            <div className="edit-workspace-group-header">
              <span className="edit-workspace-step">0{groupIndex + 1}</span>
              <div>
                <h4>{group.title}</h4>
                <p>Work through this block before moving to the next one.</p>
              </div>
            </div>

            <div className="edit-workspace-grid">
              {group.fields.map((field) => {
                const isChecked = Boolean(checkedMap[field.key]);
                const isEditable = isChecked && !field.readOnly && !!selectedProduct;

                return (
                  <div key={field.key} className="edit-workspace-field">
                    <label className="label-product">{field.label}</label>
                    <div className="edit-input-shell">
                      <input
                        type="text"
                        disabled={!isEditable}
                        className="products-form"
                        placeholder={field.placeholder}
                        value={selectedProduct ? (editValues[field.key] ?? "") : ""}
                        onChange={(e) => handleEditChange(field.key, e.target.value)}
                        style={{
                          backgroundColor: isEditable ? "#fff" : "#f8f9fa",
                          color: selectedProduct ? "#111" : "#999",
                        }}
                      />
                      {!field.readOnly && (
                        <button
                          type="button"
                          className={`bg-icon edit-toggle-btn ${isChecked ? "is-active" : ""}`}
                          onClick={() => toggleCheck(field.key)}
                          aria-label={`Toggle ${field.label}`}
                          disabled={!selectedProduct}
                          style={{ opacity: selectedProduct ? 1 : 0.4 }}
                        >
                          {isChecked ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="check-icon">
                              <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="custom-icon">
                              <path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152V424c0 48.6 39.4 88 88 88H360c48.6 0 88-39.4 88-88V312c0-13.3-10.7-24-24-24s-24 10.7-24 24V424c0 22.1-17.9 40-40 40H88c-22.1 0-40-17.9-40-40V152c0-22.1 17.9-40 40-40H200c13.3 0 24-10.7 24-24s-10.7-24-24-24H88z" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {selectedProduct && (
        <div style={{ padding: "1rem", textAlign: "right" }}>
          <button
            type="button"
            className="btn-save"
            onClick={handleSave}
            disabled={saving}
            style={{ padding: "0.5rem 2rem" }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
};

export default SelectForm;
