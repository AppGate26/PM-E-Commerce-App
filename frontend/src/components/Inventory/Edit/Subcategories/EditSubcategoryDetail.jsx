import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../../../../lib/config";
import "../Subcategories/SubcategoryList.css";
import { toast } from "react-toastify";

const EditSubcategoryDetail = () => {
  const { subcategoryId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryId: "",
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError("");

        console.log(
          "EditSubcategoryDetail: fetching subcategory with ID:",
          subcategoryId
        );
        const response = await apiRequest(
          `/admin/sub-categories/${subcategoryId}`,
          "GET"
        );
        console.log("EditSubcategoryDetail: raw subcategory response:", response);

        // Handle API shapes like:
        // { status, message, response: { ... } } or { data: {...} } or direct object
        let data = null;
        if (response?.data && !Array.isArray(response.data)) {
          data = response.data;
        } else if (
          response?.response &&
          !Array.isArray(response.response)
        ) {
          data = response.response;
        } else {
          data = response;
        }

        console.log("EditSubcategoryDetail: parsed subcategory data:", data);
        if (!data) {
          throw new Error("Subcategory not found");
        }

        setFormData({
          name: data.name || "",
          description: data.description || "",
          categoryId:
            data.category?.id?.toString() || data.categoryId?.toString() || "",
        });

        console.log("EditSubcategoryDetail: fetching categories for select...");
        const catRes = await apiRequest("/admin/categories", "GET");
        const catList =
          (Array.isArray(catRes) && catRes) ||
          catRes?.data ||
          catRes?.response?.data ||
          catRes?.response ||
          [];
        setCategories(catList);
      } catch (err) {
        console.error("EditSubcategoryDetail: error fetching data:", err);
        setError(
          err?.message ||
            "Failed to load subcategory. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [subcategoryId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        categoryId: parseInt(formData.categoryId, 10),
      };

      console.log(
        "EditSubcategoryDetail: updating subcategory with payload:",
        payload
      );

      await apiRequest(
        `/admin/sub-categories/${subcategoryId}`,
        "PUT",
        payload
      );
      toast.success("Subcategory updated successfully");
      navigate("/editSubcategories");
    } catch (err) {
      console.error("EditSubcategoryDetail: error updating subcategory:", err);
      setError(
        err?.message ||
          "Failed to update subcategory. Please try again later."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="subcategory-list-container">
        <div className="subcategory-content">
          <div className="loading-message">Loading subcategory...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="subcategory-list-container">
      {/* Blue INVENTERY HUB header */}
      <nav className="subcategory-nav">
        <div className="d-flex align-items-center justify-content-between gap-5">
          <div className="d-flex align-items-center gap-3">
            <div className="cart-icon-nav">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="white"
                viewBox="0 0 24 24"
              >
                <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </div>
            <h1 className="subcategory-nav-title">INVENTERY HUB</h1>
          </div>
          <div>
            <button
              className="Log_Out-btn"
              onClick={() => navigate("/inventory")}
            >
              Log Out
            </button>
          </div>
        </div>
      </nav>

      <div className="subcategory-content">
        <div className="category-detail-card">
          <h2 className="subcategory-title">EDIT SUBCATEGORY</h2>
          <div className="edit-form-grid">
            <div className="edit-form-column">
              <div className="edit-field-group">
                <label>Subcategory Name</label>
                <div className="edit-input-group">
                  <input
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="SUBCATEGORY NAME"
                  />
                </div>
              </div>
              <div className="edit-field-group">
                <label>Category</label>
                <div className="edit-input-group">
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="edit-field-group">
                <label>Description</label>
                <div className="edit-input-group">
                  <textarea
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="DESCRIPTION"
                  />
                </div>
              </div>
            </div>
          </div>
          {error && (
            <div
              className="error-message"
              style={{ color: "red", marginTop: "1rem" }}
            >
              {error}
            </div>
          )}
          <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
            <button
              className="delete-confirm-yes"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              className="delete-confirm-no"
              onClick={() => navigate("/editSubcategories")}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditSubcategoryDetail;


