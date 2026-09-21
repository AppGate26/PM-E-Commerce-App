import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./SubCategories.css";
import "./SubCatQuery.css";
import SubCatModalSucc from "./SubCatModalSucc.jsx";
import { Link } from "react-router-dom";
import { apiRequest } from "../../../../lib/config";
import { fetchInventoryCategories } from "../../../../lib/inventoryApi";

const SubCategories = ({ toggleModalSubCategory }) => {
  const closeModal = () => {
    toggleModalSubCategory(); // Call toggleModal function to close the modal
  };
  const [modalSubCatSuccess, setModalSubCatSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");

  const [formData, setFormData] = useState({
    subcategoryName: "",
    subcategoryDescription: "",
    categoryId: "",
  });

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        setCategoriesError("");
        const categoriesList = await fetchInventoryCategories();
        setCategories(categoriesList);
      } catch (err) {
        setCategoriesError(
          "Failed to load categories. Please refresh the page."
        );
        console.error("Error fetching categories:", err);
        setCategories([]); // Ensure categories is always an array
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

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
    if (formData.subcategoryName.trim() === "") {
      unfilledFields.push("sub-category name");
    }
    if (formData.subcategoryDescription.trim() === "") {
      unfilledFields.push("sub-category description");
    }
    if (!formData.categoryId || formData.categoryId === "") {
      unfilledFields.push("category");
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
        name: formData.subcategoryName.trim(),
        description: formData.subcategoryDescription.trim(),
        categoryId: parseInt(formData.categoryId, 10),
      };

      // Make API call
      await apiRequest("/admin/sub-categories", "POST", payload);

      // Reset form on success
      setFormData({
        subcategoryName: "",
        subcategoryDescription: "",
        categoryId: "",
      });

      // Show success modal
      setModalSubCatSuccess(true);
      console.log("SubCategory: Subcategory added successfully, showing success modal");
    } catch (submitError) {
      console.error("SubCategory: Error adding subcategory:", submitError);
      setError(
        submitError?.message ||
          "Failed to create subcategory. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!modalSubCatSuccess && (
        <div className='subcategory-box'>
          <div className=''>
            <button
              className='btn btn-primary  fw-bold'
              style={{ position: "absolute", left: "4em", top: "3em" }}
            >
              <Link to='/adminDashboard' className='text-white'>
                Dashboard
              </Link>
            </button>

            <h1 className='subcategory-header'>add new subcategory</h1>

            <span
              className='adjust-cancel-btn '
              id='sm-cancel-subCat'
              style={{ left: "44em", top: "-5em" }}
              onClick={closeModal}
            >
              X
            </span>
            <form onSubmit={handleSubmit}>
              <div className='col-sm-12'>
                <label>sub-category name</label>
                <input
                  type='text'
                  name='subcategoryName'
                  value={formData.subcategoryName}
                  className='subcategory-input'
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div className='col-sm-12'>
                <label>category</label>
                <select
                  name='categoryId'
                  value={formData.categoryId}
                  className='subcategory-input'
                  onChange={handleChange}
                  disabled={loading || loadingCategories}
                >
                  <option value=''>
                    {loadingCategories
                      ? "Loading categories..."
                      : categoriesError
                      ? "Error loading categories"
                      : "select category"}
                  </option>
                  {Array.isArray(categories) &&
                    categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
                {categoriesError && (
                  <p
                    style={{
                      color: "red",
                      fontSize: "12px",
                      marginTop: "5px",
                    }}
                  >
                    {categoriesError}
                  </p>
                )}
              </div>
              <div className='col-sm-12'>
                <label>sub-category description</label>
                <textarea
                  name='subcategoryDescription'
                  cols='30'
                  rows='10'
                  value={formData.subcategoryDescription}
                  className='message-input'
                  onChange={handleChange}
                  disabled={loading}
                ></textarea>
              </div>
              {error && (
                <p
                  className='login-error'
                  role='alert'
                  style={{ color: "red", marginTop: "10px" }}
                >
                  {error}
                </p>
              )}
              <input
                type='submit'
                value={loading ? "Adding..." : "add"}
                className='add-btn-sub'
                disabled={loading || loadingCategories}
              />
            </form>
          </div>
        </div>
      )}
      <SubCatModalSucc
        isOpen={modalSubCatSuccess}
        setModalSubCatSuccess={setModalSubCatSuccess}
      />
    </>
  );
};

SubCategories.propTypes = {
  toggleModalSubCategory: PropTypes.func.isRequired,
};

export default SubCategories;
