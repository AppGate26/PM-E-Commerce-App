import React, { useState, useEffect } from "react";
import "./EditSubCat.css";
import "./EditSubCatQuery.css";
import { apiRequest } from "../../../../lib/config";

const EditSubCat = ({ handleSave, toggleEditSubCat }) => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCatId, setSelectedCatId] = useState("");
  const [selectedSubId, setSelectedSubId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await apiRequest("/admin/categories", "GET");
        let list = [];
        if (Array.isArray(response)) list = response;
        else if (Array.isArray(response?.data)) list = response.data;
        else if (Array.isArray(response?.response)) list = response.response;
        else if (Array.isArray(response?.response?.data)) list = response.response.data;
        setCategories(list);
      } catch {
        setError("Failed to load categories.");
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleSelectCategory = async (e) => {
    const catId = e.target.value;
    setSelectedCatId(catId);
    setSelectedSubId("");
    setName("");
    setDescription("");
    setEditingName(false);
    setEditingDesc(false);
    setError("");
    setSuccess("");
    if (!catId) {
      setSubcategories([]);
      return;
    }
    try {
      setLoadingSubs(true);
      const response = await apiRequest(`/categories/${catId}/sub-categories`, "GET");
      let list = [];
      if (Array.isArray(response)) list = response;
      else if (Array.isArray(response?.data)) list = response.data;
      else if (Array.isArray(response?.response)) list = response.response;
      else if (Array.isArray(response?.response?.data)) list = response.response.data;
      setSubcategories(list);
    } catch {
      setError("Failed to load subcategories for this category.");
      setSubcategories([]);
    } finally {
      setLoadingSubs(false);
    }
  };

  const handleSelectSub = (e) => {
    const id = e.target.value;
    setSelectedSubId(id);
    setEditingName(false);
    setEditingDesc(false);
    setError("");
    setSuccess("");
    if (!id) {
      setName("");
      setDescription("");
      return;
    }
    const sub = subcategories.find((s) => String(s.id) === String(id));
    if (sub) {
      setName(sub.name || sub.subCategoryName || "");
      setDescription(sub.description || "");
    }
  };

  const handleSubmit = async () => {
    if (!selectedSubId) {
      setError("Please select a sub-category first.");
      return;
    }
    if (!name.trim()) {
      setError("Sub-category name cannot be empty.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      await apiRequest(`/admin/sub-categories/${selectedSubId}`, "PUT", {
        name: name.trim(),
        description: description.trim(),
        categoryId: selectedCatId ? parseInt(selectedCatId) : undefined,
      });
      setSuccess("Sub-category updated successfully.");
      setEditingName(false);
      setEditingDesc(false);
      setTimeout(() => {
        handleSave();
      }, 1200);
    } catch (err) {
      setError(err?.message || "Failed to update sub-category.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sub-container-box">
      <span
        className="adjust-cancel-btn"
        id="sm-modal-edit-cat"
        style={{ left: "50em", top: "-1em" }}
        onClick={toggleEditSubCat}
      >
        X
      </span>

      {error && (
        <div style={{ color: "#dc3545", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ color: "#28a745", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
          {success}
        </div>
      )}

      <div className="dropdown">
        <div>
          <select
            className="cat-category-id-dropdown px-4"
            value={selectedCatId}
            onChange={handleSelectCategory}
            disabled={loading}
          >
            <option value="">{loading ? "Loading categories..." : "Select category"}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={String(cat.id)}>
                {cat.id} — {cat.name || cat.categoryName}
              </option>
            ))}
          </select>
        </div>
      </div>
      <br />
      <div>
        <select
          className="cat-category-id-dropdown"
          value={selectedSubId}
          onChange={handleSelectSub}
          disabled={loadingSubs || !selectedCatId}
        >
          <option value="">
            {loadingSubs ? "Loading..." : selectedCatId ? "Select sub-category" : "Select a category first"}
          </option>
          {subcategories.map((sub) => (
            <option key={sub.id} value={String(sub.id)}>
              {sub.name || sub.subCategoryName}
            </option>
          ))}
        </select>
      </div>

      <div className="d-flex align-items-center justify-content-between check-cat_name">
        {editingName ? (
          <input
            type="text"
            className="cat-category-id-dropdown"
            style={{ flex: 1, marginRight: "0.5rem" }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sub-category name"
          />
        ) : (
          <p style={{ flex: 1 }}>{name || "Select a sub-category to see its name"}</p>
        )}
        <div
          className="bg-icon"
          id="bg-edit-sub"
          onClick={() => selectedSubId && setEditingName((v) => !v)}
          style={{ cursor: selectedSubId ? "pointer" : "not-allowed", opacity: selectedSubId ? 1 : 0.4 }}
        >
          {editingName ? (
            <div className="bg-check-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="check-icon">
                <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
              </svg>
            </div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="custom-icon">
              <path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152V424c0 48.6 39.4 88 88 88H360c48.6 0 88-39.4 88-88V312c0-13.3-10.7-24-24-24s-24 10.7-24 24V424c0 22.1-17.9 40-40 40H88c-22.1 0-40-17.9-40-40V152c0-22.1 17.9-40 40-40H200c13.3 0 24-10.7 24-24s-10.7-24-24-24H88z" />
            </svg>
          )}
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-between check-cat_name check-cat_desc">
        {editingDesc ? (
          <input
            type="text"
            className="cat-category-id-dropdown"
            style={{ flex: 1, marginRight: "0.5rem" }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Sub-category description"
          />
        ) : (
          <p style={{ flex: 1 }}>{description || "Select a sub-category to see its description"}</p>
        )}
        <div
          className="bg-icon shift-icon"
          id="bg-edit-sub"
          onClick={() => selectedSubId && setEditingDesc((v) => !v)}
          style={{ cursor: selectedSubId ? "pointer" : "not-allowed", opacity: selectedSubId ? 1 : 0.4 }}
        >
          {editingDesc ? (
            <div className="bg-check-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="check-icon">
                <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
              </svg>
            </div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="custom-icon">
              <path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152V424c0 48.6 39.4 88 88 88H360c48.6 0 88-39.4 88-88V312c0-13.3-10.7-24-24-24s-24 10.7-24 24V424c0 22.1-17.9 40-40 40H88c-22.1 0-40-17.9-40-40V152c0-22.1 17.9-40 40-40H200c13.3 0 24-10.7 24-24s-10.7-24-24-24H88z" />
            </svg>
          )}
        </div>
      </div>

      <button className="sub-btn-save" onClick={handleSubmit} disabled={saving || !selectedSubId}>
        {saving ? "Saving..." : "save"}
      </button>
    </div>
  );
};

export default EditSubCat;
