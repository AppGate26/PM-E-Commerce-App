import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../../../../lib/config";
import "../Categories/CategoryList.css";
import { toast } from "react-toastify";

const EditCategoryDetail = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        setError("");
        console.log(
          "EditCategoryDetail: fetching category with ID:",
          categoryId
        );
        const response = await apiRequest(
          `/admin/categories/${categoryId}`,
          "GET"
        );
        console.log("EditCategoryDetail: raw category response:", response);

        // Handle API shapes like:
        // { status, message, response: { id, name, description, ... } }
        // or { data: {...} } or direct object
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

        console.log("EditCategoryDetail: parsed category data:", data);
        if (!data) {
          throw new Error("Category not found");
        }
        setFormData({
          name: data.name || "",
          description: data.description || "",
        });
      } catch (err) {
        console.error("EditCategoryDetail: error fetching category:", err);
        setError(
          err?.message || "Failed to load category. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [categoryId]);

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
      };

      console.log(
        "EditCategoryDetail: updating category with payload:",
        payload
      );

      await apiRequest(`/admin/categories/${categoryId}`, "PUT", payload);
      toast.success("Category updated successfully");
      navigate("/editCategories");
    } catch (err) {
      console.error("EditCategoryDetail: error updating category:", err);
      setError(
        err?.message || "Failed to update category. Please try again later."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="category-list-container">
        <div className="category-content">
          <div className="loading-message">Loading category...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="category-list-container">
      <nav className="category-nav">
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
            <h1 className="category-nav-title">INVENTERY HUB</h1>
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

      <div className="category-content">
        <div className="category-detail-shell">
          <section className="category-detail-hero">
            <div>
              <span className="category-detail-kicker">Inventory Setup</span>
              <h2 className="category-title">Edit Category</h2>
              <p className="category-detail-copy">
                Update the category name and description in one clean workspace.
              </p>
            </div>
            <div className="category-detail-hero-actions">
              <button
                className="category-secondary-btn"
                onClick={() => navigate("/editCategories")}
              >
                Back To Categories
              </button>
              <button
                className="category-primary-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </section>

          <div className="category-detail-card category-detail-card--standard">
            <div className="category-detail-card-header">
              <div>
                <h3>Category Details</h3>
                <p>Keep the product structure accurate and easy to manage.</p>
              </div>
              <span className="category-detail-badge">
                ID: {categoryId || "--"}
              </span>
            </div>

            <div className="edit-form-grid category-edit-grid">
              <div className="edit-form-column">
                <div className="edit-field-group">
                  <label>Category Name</label>
                  <div className="edit-input-group">
                    <input
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="CATEGORY NAME"
                    />
                  </div>
                </div>

                <div className="edit-field-group">
                  <label>Description</label>
                  <div className="edit-input-group">
                    <textarea
                      name="description"
                      rows="6"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="DESCRIPTION"
                    />
                  </div>
                </div>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="category-detail-footer">
              <button
                className="category-secondary-btn"
                onClick={() => navigate("/editCategories")}
              >
                Cancel
              </button>
              <button
                className="category-primary-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Update Category"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCategoryDetail;

