import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./Product.css";
import "./ProductQuery.css";
import ModalSuccess from "./ModalSuccess.jsx";
import { Link } from "react-router-dom";
import { apiRequestMultipart } from "../../../../lib/config";
import {
  fetchInventoryCategories,
  fetchInventoryProducts,
  fetchInventorySubCategories,
  fetchInventorySuppliers,
} from "../../../../lib/inventoryApi";

const Products = ({
  toggleModal,
  openCategoryFromProductModal,
  openSubCategoryFromProductModal,
}) => {
  //CANCEL MODAL
  const closeModal = () => {
    toggleModal();
  };

  const openCategoryModal = () => {
    openCategoryFromProductModal();
  };

  const openSubCategoryModal = () => {
    openSubCategoryFromProductModal();
  };

  const [modalSuccess, setModalSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [productImage, setProductImage] = useState(null);

  const [formData, setFormData] = useState({
    productName: "",
    productDescription: "",
    categoryId: "",
    subCategoryId: "",
    productManufacturer: "",
    supplierId: "",
    costPrice: "",
    sellingPrice: "",
    weightKg: "",
  });

  // Fetch categories on component mount
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        setLoadingCategories(true);
        const [categoriesList, productsList, suppliersList] = await Promise.all([
          fetchInventoryCategories(),
          fetchInventoryProducts(500).catch(() => []),
          fetchInventorySuppliers().catch(() => []),
        ]);
        setCategories(categoriesList);
        setProducts(Array.isArray(productsList) ? productsList : []);
        setSuppliers(Array.isArray(suppliersList) ? suppliersList : []);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Failed to load product setup data. Please refresh the page.");
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchDropdownData();
  }, []);

  // Fetch subcategories when category is selected
  useEffect(() => {
    const fetchSubCategories = async () => {
      if (!formData.categoryId) {
        setSubCategories([]);
        return;
      }

      try {
        setLoadingSubCategories(true);
        const subCategoriesList = await fetchInventorySubCategories(
          formData.categoryId
        );
        setSubCategories(subCategoriesList);
        setFormData((prev) => {
          const subCategoryStillExists = subCategoriesList.some(
            (subCategory) =>
              String(subCategory.id) === String(prev.subCategoryId)
          );

          return subCategoryStillExists
            ? prev
            : { ...prev, subCategoryId: "" };
        });
      } catch (err) {
        console.error("Error fetching subcategories:", err);
        setSubCategories([]);
      } finally {
        setLoadingSubCategories(false);
      }
    };

    fetchSubCategories();
  }, [formData.categoryId]);

  const resolveProductMatch = (rawValue) => {
    const normalized = rawValue.trim().toLowerCase();
    if (!normalized) return null;

    return (
      products.find((product) => {
        const productName = (
          product.productName ||
          product.name ||
          ""
        ).trim().toLowerCase();
        return productName === normalized;
      }) || null
    );
  };

  const applyMatchedProduct = (matchedProduct, rawValue = "") => {
    if (!matchedProduct) {
      setFormData((prev) => ({
        ...prev,
        productName: rawValue,
      }));
      return;
    }

    const categoryId =
      matchedProduct.categoryId || matchedProduct.category?.id || "";
    const subCategoryId =
      matchedProduct.subCategoryId || matchedProduct.subCategory?.id || "";
    const supplierId =
      matchedProduct.supplierId || matchedProduct.supplier?.id || "";

    setFormData((prev) => ({
      ...prev,
      productName: matchedProduct.productName || matchedProduct.name || rawValue,
      productDescription:
        prev.productDescription ||
        matchedProduct.productDescription ||
        matchedProduct.description ||
        "",
      categoryId: categoryId ? String(categoryId) : prev.categoryId,
      subCategoryId: subCategoryId ? String(subCategoryId) : prev.subCategoryId,
      supplierId: supplierId ? String(supplierId) : prev.supplierId,
      costPrice:
        prev.costPrice ||
        (matchedProduct.costPrice != null ? String(matchedProduct.costPrice) : ""),
      sellingPrice:
        prev.sellingPrice ||
        (matchedProduct.sellingPrice != null ? String(matchedProduct.sellingPrice) : ""),
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "productName") {
      const matchedProduct = resolveProductMatch(value);
      applyMatchedProduct(matchedProduct, value);
      if (error) setError("");
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductImage(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate required fields
    const unfilledFields = [];
    if (formData.productName.trim() === "") {
      unfilledFields.push("product name");
    }
    if (formData.productDescription.trim() === "") {
      unfilledFields.push("product description");
    }
    if (!formData.categoryId || formData.categoryId === "") {
      unfilledFields.push("product category");
    }
    if (!formData.subCategoryId || formData.subCategoryId === "") {
      unfilledFields.push("product sub-category");
    }
    if (formData.productManufacturer.trim() === "") {
      unfilledFields.push("product manufacturer");
    }

    if (unfilledFields.length > 0) {
      const unfilledFieldsString = unfilledFields.join(", ");
      setError(`Please fill out the following fields: ${unfilledFieldsString}`);
      return;
    }

    // Backend requires a description of at least 10 characters.
    if (formData.productDescription.trim().length < 10) {
      setError("Product description must be at least 10 characters long.");
      return;
    }

    // Backend requires cost price and selling price greater than 0.
    const costPriceValue = Number(formData.costPrice);
    const sellingPriceValue = Number(formData.sellingPrice);
    if (!Number.isFinite(costPriceValue) || costPriceValue <= 0) {
      setError("Cost price must be greater than 0.");
      return;
    }
    if (!Number.isFinite(sellingPriceValue) || sellingPriceValue <= 0) {
      setError("Selling price must be greater than 0.");
      return;
    }

    setLoading(true);

    try {
      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();
      formDataToSend.append("productName", formData.productName.trim());
      formDataToSend.append(
        "productDescription",
        formData.productDescription.trim()
      );
      formDataToSend.append("categoryId", parseInt(formData.categoryId, 10));
      formDataToSend.append(
        "subCategoryId",
        parseInt(formData.subCategoryId, 10)
      );
      formDataToSend.append("costPrice", costPriceValue);
      formDataToSend.append("sellingPrice", sellingPriceValue);
      formDataToSend.append(
        "manufacturerName",
        formData.productManufacturer.trim()
      );
      formDataToSend.append("quantity", 0);

      // Add optional fields if provided
      if (formData.supplierId && formData.supplierId !== "") {
        formDataToSend.append("supplierId", parseInt(formData.supplierId, 10));
      }
      if (formData.weightKg && formData.weightKg !== "") {
        formDataToSend.append("weightKg", formData.weightKg);
      }
      if (productImage) {
        formDataToSend.append("productImage", productImage);
      }

      // Make API call
      await apiRequestMultipart("/admin/products", "POST", formDataToSend);

      // Reset form on success
      setFormData({
        productName: "",
        productDescription: "",
        categoryId: "",
        subCategoryId: "",
        productManufacturer: "",
        supplierId: "",
        costPrice: "",
        sellingPrice: "",
        weightKg: "",
      });
      setProductImage(null);
      // Reset file input
      const fileInput = document.getElementById("upload-input");
      if (fileInput) fileInput.value = "";

      // Show success modal
      setModalSuccess(true);
    } catch (submitError) {
      setError(
        submitError?.message || "Failed to create product. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!modalSuccess && (
        <div className='product-standard-shell'>
          <div className='add-product-box product-standard-card'>
            <div className='product-standard-header'>
              <div className='product-standard-title'>
                <p className='product-standard-eyebrow'>Inventory Setup</p>
                <h1 className='product-header'>add new product</h1>
                <p className='product-standard-subtitle'>
                  Create product records with clean category mapping, pricing,
                  stock, and supplier information in one standard form.
                </p>
              </div>
              <div className='product-standard-actions'>
                <Link to='/adminDashboard' className='product-standard-link'>
                  Dashboard
                </Link>
                <button
                  type='button'
                  className='product-standard-close'
                  onClick={closeModal}
                >
                  ×
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className='row form-container product-standard-form'>
              <div className='col-sm-6 col-md-6 inputs-box'>
                <label>product name</label>
                <input
                  name='productName'
                  type='text'
                  className='product-input'
                  value={formData.productName}
                  onChange={handleChange}
                  onBlur={(e) =>
                    applyMatchedProduct(
                      resolveProductMatch(e.target.value),
                      e.target.value
                    )
                  }
                  list='inventory-product-options'
                  disabled={loading}
                  placeholder='Type product name'
                  required
                />
                <datalist id='inventory-product-options'>
                  {products.map((product) => (
                    <option
                      key={product.id}
                      value={product.productName || product.name || `Product ${product.id}`}
                    />
                  ))}
                </datalist>
              </div>
              <div className='col-sm-6 col-md-6 inputs-box'>
                <div className='product-linked-header'>
                  <label>product category</label>
                  <button
                    type='button'
                    className='product-linked-add-btn product-linked-add-link'
                    onClick={openCategoryModal}
                  >
                    + add
                  </button>
                </div>
                <select
                  name='categoryId'
                  className='product-input'
                  value={formData.categoryId}
                  onChange={handleChange}
                  disabled={loading || loadingCategories}
                  required
                >
                  <option value=''>
                    {loadingCategories
                      ? "Loading categories..."
                      : "select product category"}
                  </option>
                  {Array.isArray(categories) &&
                    categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className='col-sm-6 col-md-6 inputs-box'>
                <label>product description</label>
                <textarea
                  name='productDescription'
                  cols='30'
                  rows='10'
                  className='description-input'
                  value={formData.productDescription}
                  onChange={handleChange}
                  disabled={loading}
                  required
                ></textarea>
              </div>
              <div className='col-sm-6 col-md-6'>
                <div className='col-md-12 inputs-box'>
                  <div className='product-linked-header'>
                    <label>product sub-category</label>
                    <button
                      type='button'
                      className='product-linked-add-btn product-linked-add-link'
                      onClick={openSubCategoryModal}
                    >
                      + add
                    </button>
                  </div>
                  <select
                    name='subCategoryId'
                    className='product-input w-100'
                    value={formData.subCategoryId}
                    onChange={handleChange}
                    disabled={
                      loading || !formData.categoryId || loadingSubCategories
                    }
                    required
                  >
                    <option value=''>
                      {!formData.categoryId
                        ? "Select category first"
                        : loadingSubCategories
                        ? "Loading subcategories..."
                        : subCategories.length === 0
                        ? "No subcategories available"
                        : "select sub-category"}
                    </option>
                    {Array.isArray(subCategories) &&
                      subCategories.map((subCat) => (
                        <option key={subCat.id} value={subCat.id}>
                          {subCat.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className='col-md-12 inputs-box'>
                  <label>supplier</label>
                  <select
                    name='supplierId'
                    className='product-input w-100'
                    value={formData.supplierId}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value=''>select supplier</option>
                    {Array.isArray(suppliers) &&
                      suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.companyName || supplier.name || `Supplier ${supplier.id}`}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div className='col-sm-6 col-md-6 inputs-box'>
                <label>upload product image</label>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#555",
                    margin: "0 0 6px",
                    lineHeight: 1.4,
                  }}
                >
                  Recommended: square image <strong>1000&nbsp;×&nbsp;1000&nbsp;px</strong> (1:1),
                  min 800&nbsp;×&nbsp;800&nbsp;px. Fits both the website product grid and the
                  mobile app. JPG or PNG, under 2&nbsp;MB, on a plain white background.
                </p>
                <div className='image-uploader-box'>
                  <input
                    type='file'
                    id='upload-input'
                    accept='image/*'
                    onChange={handleImageChange}
                    disabled={loading}
                  />
                  <div className=''>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='16'
                      height='16'
                      className='bi bi-upload icon-uploader'
                      viewBox='0 0 16 16'
                    >
                      <path d='M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5' />
                      <path d='M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708z' />
                    </svg>
                  </div>
                </div>
                {productImage && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "green",
                      marginTop: "5px",
                    }}
                  >
                    Selected: {productImage.name}
                  </p>
                )}
              </div>
              <div className='col-sm-6 col-md-6 inputs-box'>
                <label>product manufacturer</label>
                <input
                  name='productManufacturer'
                  type='text'
                  className='product-input'
                  value={formData.productManufacturer}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
                {error && (
                  <p className='login-error product-standard-error' role='alert'>
                    {error}
                  </p>
                )}
              </div>
              <div className='col-sm-6 col-md-6 inputs-box'>
                <label>cost price</label>
                <input
                  name='costPrice'
                  type='number'
                  min='0'
                  step='0.01'
                  className='product-input'
                  value={formData.costPrice}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder='0.00'
                  required
                />
              </div>
              <div className='col-sm-6 col-md-6 inputs-box'>
                <label>selling price</label>
                <input
                  name='sellingPrice'
                  type='number'
                  min='0'
                  step='0.01'
                  className='product-input'
                  value={formData.sellingPrice}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder='0.00'
                  required
                />
              </div>
              <div className='col-sm-6 col-md-6 inputs-box'>
                <label>weight (kg)</label>
                <input
                  name='weightKg'
                  type='number'
                  min='0'
                  step='0.001'
                  className='product-input'
                  value={formData.weightKg}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder='e.g. 2.5'
                />
              </div>
              <div className='product-standard-submit-wrap'>
                <input
                  type='submit'
                  value={loading ? "Saving..." : "Save Product"}
                  id='save-btn'
                  disabled={loading || loadingCategories}
                />
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <ModalSuccess isOpen={modalSuccess} setModalSuccess={setModalSuccess} />
    </>
  );
};

Products.propTypes = {
  toggleModal: PropTypes.func.isRequired,
  openCategoryFromProductModal: PropTypes.func.isRequired,
  openSubCategoryFromProductModal: PropTypes.func.isRequired,
};

export default Products;
