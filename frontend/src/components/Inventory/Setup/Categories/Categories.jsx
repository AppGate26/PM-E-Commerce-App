import React, { useState } from "react";
import "./Categories.css";
import CategoryModalSuccess from "./categoryModalSuccess.jsx";
import "./CategoryQuery.css";
import { Link } from "react-router-dom";
import { apiRequest } from "../../../../lib/config";

const Categories = ({ toggleModalCategory }) => {
  const closeModal = () => {
    toggleModalCategory(); // Call toggleModal function to close the modal
  };

  const [modalCatSuccess, setModalCatSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    categoryName: "",
    categoryDescription: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate form fields
    const unfilledFields = [];
    if (formData.categoryName.trim() === "") {
      unfilledFields.push("category name");
    }
    if (formData.categoryDescription.trim() === "") {
      unfilledFields.push("category description");
    }

    if (unfilledFields.length > 0) {
      const unfilledFieldsString = unfilledFields.join(", ");
      setError(`Please fill out the following fields: ${unfilledFieldsString}`);
      return;
    }

    setLoading(true);

    try {
      // Prepare payload matching API requirements
      const payload = {
        name: formData.categoryName.trim(),
        description: formData.categoryDescription.trim(),
      };

      // Make API call
      await apiRequest("/admin/categories", "POST", payload);

      // Reset form on success
      setFormData({
        categoryName: "",
        categoryDescription: "",
      });

      // Show success modal
      setModalCatSuccess(true);
      console.log("Categories: Category added successfully, showing success modal");
    } catch (submitError) {
      console.error("Categories: Error adding category:", submitError);
      setError(
        submitError?.message || "Failed to create category. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!modalCatSuccess && (
        <div className='category-standard-shell'>
          <div className='category-box category-standard-card'>
            <div className='category-standard-header'>
              <div className='category-standard-title'>
                <p className='category-standard-eyebrow'>Inventory Setup</p>
                <h1 className='category-header pt-2'>add new category</h1>
                <p className='category-standard-subtitle'>
                  Create a clean inventory category with a clear name and
                  description so products and reports stay organized.
                </p>
              </div>
              <div className='category-standard-actions'>
                <Link to='/adminDashboard' className='category-standard-link'>
                  Dashboard
                </Link>
                <button
                  type='button'
                  className='category-standard-close'
                  onClick={closeModal}
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className='category-standard-form'>
              <div className='col-sm-12'>
                <label>category name</label>
                <input
                  type='text'
                  name='categoryName'
                  value={formData.categoryName}
                  className='category-input'
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div className='col-sm-12'>
                <label>category description</label>
                <textarea
                  name='categoryDescription'
                  cols='30'
                  rows='10'
                  value={formData.categoryDescription}
                  className='message-input'
                  onChange={handleChange}
                  disabled={loading}
                ></textarea>
              </div>
              {error && (
                <p className='login-error category-standard-error' role='alert'>
                  {error}
                </p>
              )}
              <div className='category-standard-submit-wrap'>
                <input
                  type='submit'
                  value={loading ? "Adding..." : "Add Category"}
                  id='add-btn'
                  disabled={loading}
                />
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Category Modal */}

      <CategoryModalSuccess
        isOpen={modalCatSuccess}
        setModalSuccess={setModalCatSuccess}
      />
    </>
  );
};

export default Categories;
