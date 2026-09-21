import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { apiRequest, apiRequestMultipart, API_BASE_URL } from "../../../../lib/config";
import Cookies from "js-cookie";
import "./EditProduct.css";
import DeleteConfirmModal from "./DeleteConfirmModal";
import DeleteSuccessModal from "./DeleteSuccessModal";

const EditProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState(location.state?.product || null);
  const [loading, setLoading] = useState(!product);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [productImage, setProductImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isEditing, setIsEditing] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

  // Function to fetch image as blob with authentication
  const fetchImageWithAuth = async (imageUrl) => {
    try {
      const token = Cookies.get("authToken");
      if (!token) {
        console.error("EditProductDetail: No auth token found");
        return null;
      }

      const response = await fetch(imageUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error("EditProductDetail: Failed to fetch image:", response.status, response.statusText);
        return null;
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("EditProductDetail: Error fetching image:", error);
      return null;
    }
  };

  const buildProductImageUrl = (imagePath) => {
    console.log("EditProductDetail: buildProductImageUrl called with:", imagePath);
    console.log("EditProductDetail: API_BASE_URL:", API_BASE_URL);
    
    if (!imagePath) {
      console.log("EditProductDetail: ⚠️ No image path provided, returning null");
      return null;
    }
    
    // Clean the path - remove trailing commas, whitespace, etc.
    let cleanPath = imagePath.toString().trim().replace(/[,\s]+$/, "");
    
    // If backend already returned a full URL, clean it and return
    if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) { 
      // Remove trailing comma if present
      cleanPath = cleanPath.replace(/,$/, "");
      console.log("EditProductDetail: ✅ Detected full URL, cleaned:", cleanPath);
      return cleanPath;
    }
    
    // If it starts with /, it's already a path from the API base
    if (cleanPath.startsWith("/")) {
      const fullUrl = `${API_BASE_URL}${cleanPath}`;
      console.log("EditProductDetail: ✅ Detected path starting with /, built URL:", fullUrl);
      return fullUrl;
    }
       
    // Default: use /api/users/customer/image/product/{filename} (correct endpoint from Swagger)
    // Remove any leading slashes or path separators  
    cleanPath = cleanPath.replace(/^\/+/, "").replace(/,$/, "");
    
    // Check if path already includes "product/" prefix
    let finalPath = cleanPath;
    if (!cleanPath.includes("product/") && !cleanPath.startsWith("product/")) {
      // If it's just a filename, prepend "product/" prefix
      finalPath = `product/${cleanPath}`;
    }
    
    // Build the URL - check if API_BASE_URL already includes /api
    let baseUrl = API_BASE_URL;
    // If API_BASE_URL is like "http://18.188.177.144:8080", we need to add /api
    // If it's already "http://18.188.177.144:8080/api", use as-is
    if (!baseUrl.includes("/api")) {
      baseUrl = baseUrl.endsWith("/") ? `${baseUrl}api` : `${baseUrl}/api`;
    }
    
    const builtUrl = `${baseUrl}/users/customer/image/${finalPath}`;
    console.log("EditProductDetail: ✅ Built URL from filename using customer/image endpoint:", builtUrl);
    return builtUrl;
  };

  const [formData, setFormData] = useState({
    productId: "",
    productName: "",
    category: "",
    subCategory: "",
    description: "",
    image: "",
    supplierId: "",
    costPrice: "",
    sellingPrice: "",
    quantityInStore: "",
    manufacturerName: "",
    weightKg: "",
  });

  useEffect(() => {
    console.log("EditProductDetail: Component mounted with productId:", productId);
    if (product) {
      console.log("EditProductDetail: Product from location state:", product);
      initializeFormData(product);
    } else {
      fetchProduct();
    }
    fetchCategories();
    
    // Cleanup: revoke object URLs when component unmounts
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [productId]);

  useEffect(() => {
    if (formData.category && formData.category.trim() !== "") {
      fetchSubCategories();
    } else {
      setSubCategories([]);
    }
  }, [formData.category]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      console.log("EditProductDetail: ========== FETCHING PRODUCT ==========");
      console.log("EditProductDetail: Fetching product with ID:", productId);
      
      const response = await apiRequest(`/products/${productId}`, "GET");
      console.log("EditProductDetail: Raw API response:", response);
      console.log("EditProductDetail: Response type:", typeof response);
      console.log("EditProductDetail: Response keys:", response ? Object.keys(response) : 'null');
      
      let productData = response;
      if (response?.data) {
        console.log("EditProductDetail: Using response.data");
        productData = response.data;
      } else if (response?.response?.data) {
        console.log("EditProductDetail: Using response.response.data");
        productData = response.response.data;
      } else if (response?.response) {
        console.log("EditProductDetail: Using response.response");
        productData = response.response;
      }
      
      console.log("EditProductDetail: Final product data:", productData);
      console.log("EditProductDetail: Product image in response:", productData?.productImage);
      console.log("EditProductDetail: Product image type:", typeof productData?.productImage);
      console.log("EditProductDetail: ======================================");
      
      setProduct(productData);
      initializeFormData(productData);
    } catch (err) {
      console.error("EditProductDetail: ❌ Error fetching product:", err);
      console.error("EditProductDetail: Error details:", {
        message: err?.message,
        status: err?.status,
        data: err?.data
      });
      setError(err?.message || "Failed to load product.");
    } finally {
      setLoading(false);
    }
  };

  const initializeFormData = (productData) => {
    console.log("EditProductDetail: ========== INITIALIZING FORM DATA ==========");
    console.log("EditProductDetail: Product data received:", productData);
    console.log("EditProductDetail: Product image field:", productData.productImage);
    console.log("EditProductDetail: Product image type:", typeof productData.productImage);
    
    const categoryId = productData.category?.id || productData.categoryId;
    const subCategoryId = productData.subCategory?.id || productData.subCategoryId;
    
    // Extract image - clean it (remove trailing commas, whitespace)
    let imageValue = productData.productImage || "";
    if (imageValue) {
      // Remove trailing commas, whitespace, and clean up
      imageValue = imageValue.toString().trim().replace(/[,\s]+$/, "");
    }
    console.log("EditProductDetail: Image value from product (cleaned):", imageValue);
    
    const newFormData = {
      productId: productData.id?.toString() || productData.productId?.toString() || "",
      productName: productData.productName || "",
      category: categoryId ? categoryId.toString() : "",
      subCategory: subCategoryId ? subCategoryId.toString() : "",
      description: productData.productDescription || "",
      image: imageValue, // Store the cleaned URL or filename
      supplierId: productData.supplier?.id?.toString() || productData.supplierId?.toString() || "",
      costPrice: (productData.costPrice || productData.productCostPrice || 0).toString(),
      sellingPrice: (productData.sellingPrice || productData.productSellingPrice || 0).toString(),
      quantityInStore: (productData.quantity || 0).toString(),
      manufacturerName: productData.manufacturerName || "",
      weightKg: (productData.weightKg ?? "").toString(),
    };
    
    setFormData(newFormData);
    
    // If product has a category, fetch subcategories for that category immediately
    if (categoryId) {
      console.log("EditProductDetail: Product has category, fetching subcategories for categoryId:", categoryId);
      fetchSubCategories(categoryId.toString());
    }

    if (productData.productImage) {
      let imagePath = productData.productImage;
      console.log("EditProductDetail: Processing image path:", imagePath);
      
      // Build the image URL
      let imageUrl = null;
      if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        // Full URL - clean it (remove trailing comma)
        imageUrl = imagePath.toString().trim().replace(/[,\s]+$/, "");
        console.log("EditProductDetail: ✅ Detected full URL, cleaned:", imageUrl);
      } else if (imagePath.startsWith("/")) {
        // Path starting with /, prepend API base
        imageUrl = `${API_BASE_URL}${imagePath}`;
        console.log("EditProductDetail: ✅ Detected path starting with /, built URL:", imageUrl);
      } else {
        // Just a filename or relative path
        imageUrl = buildProductImageUrl(imagePath);
        console.log("EditProductDetail: ✅ Detected filename/relative path, built URL:", imageUrl);
      }
      
      // Fetch image with authentication and create object URL
      if (imageUrl) {
        console.log("EditProductDetail: Fetching image with authentication from:", imageUrl);
        fetchImageWithAuth(imageUrl).then((objectUrl) => {
          if (objectUrl) {
            console.log("EditProductDetail: ✅ Image fetched successfully, object URL created");
            setImagePreview(objectUrl);
          } else {
            console.error("EditProductDetail: ❌ Failed to fetch image");
            setImagePreview(null);
          }
        });
      } else {
        setImagePreview(null);
      }
    } else {
      console.log("EditProductDetail: ⚠️ No product image found in product data");
      setImagePreview(null);
    }
    console.log("EditProductDetail: Final image preview URL:", imagePreview);
    console.log("EditProductDetail: ============================================");
  };

  const fetchCategories = async () => {
    try {
      console.log("EditProductDetail: Fetching categories...");
      const response = await apiRequest("/admin/categories", "GET");
      let categoriesList = [];
      
      // Handle different response formats (matching AllProducts.jsx that works)
      if (Array.isArray(response)) {
        categoriesList = response;
        console.log("EditProductDetail: Categories list is direct array, count:", categoriesList.length);
      } else if (response?.data && Array.isArray(response.data)) {
        categoriesList = response.data;
        console.log("EditProductDetail: Categories list from response.data, count:", categoriesList.length);
      } else if (response?.response?.data && Array.isArray(response.response.data)) {
        categoriesList = response.response.data;
        console.log("EditProductDetail: Categories list from response.response.data, count:", categoriesList.length);
      } else if (response?.response && Array.isArray(response.response)) {
        categoriesList = response.response;
        console.log("EditProductDetail: Categories list from response.response, count:", categoriesList.length);
      } else {
        console.warn("EditProductDetail: Unexpected categories response format:", response);
      }
      
      console.log("EditProductDetail: Final categories list count:", categoriesList.length);
      console.log("EditProductDetail: Categories:", categoriesList);
      setCategories(categoriesList);
    } catch (err) {
      console.error("EditProductDetail: Error fetching categories:", err);
      setError("Failed to load categories. Please refresh the page.");
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchSubCategories = async (categoryIdOverride = null) => {
    const categoryIdToUse = categoryIdOverride || formData.category;
    
    if (!categoryIdToUse || categoryIdToUse.trim() === "") {
      setSubCategories([]);
      return;
    }

    try {
      setLoadingSubCategories(true);
      console.log("EditProductDetail: Fetching subcategories for category:", categoryIdToUse);
      const response = await apiRequest(
        `/categories/${categoryIdToUse}/sub-categories`,
        "GET"
      );
      
      let subCategoriesList = [];
      // Handle different response formats (matching Products.jsx that works)
      if (Array.isArray(response)) {
        subCategoriesList = response;
      } else if (response?.response?.data && Array.isArray(response.response.data)) {
        subCategoriesList = response.response.data;
      } else if (response?.data && Array.isArray(response.data)) {
        subCategoriesList = response.data;
      } else if (response?.response && Array.isArray(response.response)) {
        subCategoriesList = response.response;
      }
      
      console.log("EditProductDetail: Subcategories fetched, count:", subCategoriesList.length);
      console.log("EditProductDetail: Subcategories:", subCategoriesList);
      setSubCategories(subCategoriesList);
    } catch (err) {
      console.error("EditProductDetail: Error fetching subcategories:", err);
      setSubCategories([]);
    } finally {
      setLoadingSubCategories(false);
    }
  };

  const handleChange = (field, value) => {
    console.log("EditProductDetail: Field changed:", { field, value });
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsEditing((prev) => ({ ...prev, [field]: true }));
    if (error) setError("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("EditProductDetail: Image selected:", file.name);
      setProductImage(file);
      setFormData((prev) => ({ ...prev, image: file.name }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setIsEditing((prev) => ({ ...prev, image: true }));
    }
  };

  const handleSave = async (field) => {
    console.log("EditProductDetail: Saving field:", field);
    setSaving(true);
    setError("");

    try {
      const productIdNum = parseInt(productId, 10);
      if (isNaN(productIdNum)) {
        throw new Error("Invalid product ID");
      }

      const formDataToSend = new FormData();

      // IMPORTANT: Backend requires ALL fields for validation, so we must send all fields
      // The ModelMapper error is a backend configuration issue that needs to be fixed on the backend
      // We ensure productId is NOT sent in FormData (it's only in the URL path)
      
      // Required fields - EXACTLY matching EditProductModal format that works in Postman
      formDataToSend.append("productName", formData.productName.trim());
      formDataToSend.append("productDescription", formData.description.trim());
      
      // Send categoryId and subCategoryId as integers (EXACT format from EditProductModal)
      formDataToSend.append("categoryId", parseInt(formData.category, 10));
      formDataToSend.append("subCategoryId", parseInt(formData.subCategory, 10));
      
      // Send prices as floats (EXACT format from EditProductModal)
      formDataToSend.append("costPrice", parseFloat(formData.costPrice));
      formDataToSend.append("sellingPrice", parseFloat(formData.sellingPrice));
      formDataToSend.append("manufacturerName", formData.manufacturerName.trim());
      
      // Send quantity (optional, but send if available)
      if (formData.quantityInStore && formData.quantityInStore.trim() !== "") {
        formDataToSend.append("quantity", parseInt(formData.quantityInStore, 10));
      }
      
      // Send supplierId (optional, but send if available)
      if (formData.supplierId && formData.supplierId.trim() !== "") {
        formDataToSend.append("supplierId", parseInt(formData.supplierId, 10));
      }

      // Send weightKg (optional, but send if available)
      if (formData.weightKg && formData.weightKg.toString().trim() !== "") {
        formDataToSend.append("weightKg", formData.weightKg);
      }

      // Only send image file if a new file was selected
      // Don't send the image field as a string - only send the file
      if (productImage && productImage instanceof File) {
        formDataToSend.append("productImage", productImage);
        console.log("EditProductDetail: Adding image file to FormData:", {
          fileName: productImage.name,
          fileSize: productImage.size,
          fileType: productImage.type
        });
      }
      
      // CRITICAL: Do NOT send productId in FormData - it's already in the URL path
      // This might be causing the ModelMapper confusion

      // Log all FormData entries for debugging
      const formDataEntries = Array.from(formDataToSend.entries()).map(([key, value]) => ({
        key,
        value: value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value,
        valueType: value instanceof File ? 'File' : typeof value
      }));
      
      console.log("EditProductDetail: ========== FORM DATA BEING SENT ==========");
      console.log("EditProductDetail: Product ID:", productIdNum);
      console.log("EditProductDetail: FormData entries:", formDataEntries);
      console.log("EditProductDetail: Current formData state:", formData);
      console.log("EditProductDetail: ==========================================");

      console.log("EditProductDetail: Updating product with ID:", productIdNum);
      const response = await apiRequestMultipart(
        `/admin/products/${productIdNum}`,
        "PUT",
        formDataToSend
      );
      
      console.log("EditProductDetail: ========== BACKEND RESPONSE ==========");
      console.log("EditProductDetail: Full response object:", response);
      console.log("EditProductDetail: Response type:", typeof response);
      console.log("EditProductDetail: Response keys:", response ? Object.keys(response) : 'null');
      
      // Extract product image URL from response
      let updatedImageUrl = null;
      if (response) {
        // Try different possible response structures
        const responseData = response.data || response.response || response;
        console.log("EditProductDetail: Response data:", responseData);
        
        if (responseData) {
          updatedImageUrl = responseData.productImage || 
                           responseData.image || 
                           responseData.imageUrl ||
                           (typeof responseData === 'string' && responseData.includes('http') ? responseData : null);
          
          console.log("EditProductDetail: Extracted image URL from response:", updatedImageUrl);
          
          // Log all possible image-related fields
          console.log("EditProductDetail: All response fields:", Object.keys(responseData));
          if (responseData.productImage) {
            console.log("EditProductDetail: responseData.productImage =", responseData.productImage);
            console.log("EditProductDetail: responseData.productImage type =", typeof responseData.productImage);
          }
        }
      }
      console.log("EditProductDetail: Final updated image URL:", updatedImageUrl);
      console.log("EditProductDetail: ======================================");
      
      // Update local state
      setIsEditing((prev) => ({ ...prev, [field]: false }));
      
      // Clear the productImage file state after successful save
      if (productImage) {
        setProductImage(null);
      }
      
      // If we got an image URL from the response, update the preview immediately
      if (updatedImageUrl) {
        console.log("EditProductDetail: Updating image preview with URL from response:", updatedImageUrl);
        const finalUrl = buildProductImageUrl(updatedImageUrl);
        console.log("EditProductDetail: Built final image URL:", finalUrl);
        setImagePreview(finalUrl);
        // Also update formData with the image URL
        setFormData((prev) => ({ ...prev, image: updatedImageUrl }));
      }
      
      // Refresh product data to get updated image URL (this will override if response didn't have it)
      await fetchProduct();
    } catch (err) {
      console.error("EditProductDetail: Error updating product:", err);
      if (err?.data) {
        console.error(
          "EditProductDetail: Validation error details from server:",
          err.data
        );
      }
      
      // Provide clear error message for ModelMapper errors
      let errorMessage = err?.message || "Failed to update product. Please check required fields and try again.";
      
      if (errorMessage.includes("ModelMapper") || errorMessage.includes("setId()")) {
        errorMessage = `Backend Configuration Error: The server's ModelMapper is incorrectly configured. 
        
The backend is trying to map categoryId, subCategoryId, and supplierId all to Product.setId(), which is wrong.

This needs to be fixed on the backend by updating the ModelMapper configuration to properly map:
- categoryId → category.id
- subCategoryId → subCategory.id  
- supplierId → supplier.id

Please contact the backend team to fix this ModelMapper configuration issue.`;
      }
      
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    console.log("EditProductDetail: Deleting product with ID:", productId);
    setShowDeleteConfirm(false);
    setError(""); // Clear any previous errors
    
    try {
      // Validate product ID
      if (!productId) {
        throw new Error("Product ID is missing. Cannot delete product.");
      }

      const productIdNum = parseInt(productId, 10);
      if (isNaN(productIdNum)) {
        throw new Error(`Invalid product ID: ${productId}`);
      }

      console.log("EditProductDetail: Sending DELETE request for product ID:", productIdNum);
      
      // Use apiRequest with DELETE method
      await apiRequest(`/admin/products/${productIdNum}`, "DELETE");
      
      console.log("EditProductDetail: Product deleted successfully");
      setShowDeleteSuccess(true);
      
      // Navigate back after 2 seconds
      setTimeout(() => {
        navigate("/editProducts");
      }, 2000);
    } catch (err) {
      console.error("EditProductDetail: Error deleting product:", err);
      const errorMessage = err?.message || err?.data?.message || "Failed to delete product. Please try again.";
      setError(errorMessage);
      
      // If it's a server error, provide more helpful message
      if (err?.status === 500) {
        setError("Server error occurred while deleting product. The backend may be experiencing issues. Please try again later or contact support.");
      } else if (err?.status === 404) {
        setError("Product not found. It may have already been deleted.");
      } else if (err?.status === 403 || err?.status === 401) {
        setError("You don't have permission to delete this product. Please check your authentication.");
      }
    }
  };

  if (loading) {
    return (
      <div className="edit-product-detail-container">
        <div className="loading-message">Loading product...</div>
      </div>
    );
  }

  // Prefer the backend-generated product code; fall back to a consistent client-side
  // format (unified PM-PD- prefix) only when the code is absent.
  const formattedProductId =
    product?.productCode || `PM-PD-${String(productId).padStart(4, "0")}`;

  return (
    <div className="edit-product-detail-container">
      <nav className="edit-nav">
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
            <h1 className="edit-txt">INVENTERY HUB</h1>
          </div>
          <div>
            <Link to="/inventory">
              <button className="Log_Out-btn">Log Out</button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="edit-product-detail-content">
        <section className="edit-product-detail-hero">
          <div>
            <span className="edit-product-detail-kicker">Inventory Product Editor</span>
            <h2 className="edit-product-detail-title">Edit Product</h2>
            <p className="edit-product-detail-copy">
              Update product details, image, pricing, supplier, and category
              information from one standard workspace.
            </p>
          </div>
          <div className="edit-product-detail-actions">
            <button
              type="button"
              className="edit-product-secondary-btn"
              onClick={() => navigate("/editProducts")}
            >
              Back To Products
            </button>
            <button
              type="button"
              className="edit-product-primary-btn"
              onClick={() => handleSave()}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Product"}
            </button>
          </div>
        </section>

        {error && <div className="edit-product-status-banner">{error}</div>}

        <div className="edit-product-main">
          <div className="edit-product-left">
            <div className="product-image-section">
              <div className="edit-product-panel-head">
                <div>
                  <h3>Product Preview</h3>
                  <p>Photo and quick identity details for this item.</p>
                </div>
              </div>
              <div className="product-image-label">PRODUCT IMAGE</div>
              <div className="product-image-container">
                {imagePreview ? (
                  <img src={imagePreview} alt="Product" className="product-image-display" />
                ) : (
                  <div className="product-image-placeholder-icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="60"
                      height="60"
                      fill="#1c73de"
                      viewBox="0 0 16 16"
                    >
                      <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0" />
                      <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="product-id-display">{formattedProductId}</div>
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
              <label htmlFor="image-upload" className="change-image-btn">
                Change Image
              </label>
            </div>
          </div>

          <div className="edit-product-right">
            <button
              className="delete-product-button"
              onClick={() => {
                console.log("EditProductDetail: Delete button clicked");
                setShowDeleteConfirm(true);
              }}
            >
              DELETE PRODUCT
            </button>

            <div className="edit-product-panel-head edit-product-panel-head--spaced">
              <div>
                <h3>Product Information</h3>
                <p>Maintain clean product records and save the changes directly.</p>
              </div>
              <span className="edit-product-code-badge">{formattedProductId}</span>
            </div>

            <div className="edit-form-grid">
              <div className="edit-form-column">
                <div className="edit-field-group">
                  <label>PRODUCT ID</label>
                  <div className="edit-input-group">
                    <input
                      type="text"
                      value={formData.productId}
                      onChange={(e) => handleChange("productId", e.target.value)}
                      placeholder="PRODUCT NAME"
                      disabled
                    />
                    {isEditing.productId && (
                      <button
                        className="edit-save-btn"
                        onClick={() => handleSave("productId")}
                        disabled={saving}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                        >
                          <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <div className="edit-field-group">
                  <label>PRODUCT NAME</label>
                  <div className="edit-input-group">
                    <input
                      type="text"
                      value={formData.productName}
                      onChange={(e) => handleChange("productName", e.target.value)}
                      placeholder="CATEGORY"
                    />
                    <button
                      className="edit-icon-btn"
                      onClick={() => {
                        setIsEditing((prev) => ({ ...prev, productName: !prev.productName }));
                        if (isEditing.productName) {
                          handleSave("productName");
                        }
                      }}
                    >
                      {isEditing.productName ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                        >
                          <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          viewBox="0 0 512 512"
                        >
                          <path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152V424c0 48.6 39.4 88 88 88H360c48.6 0 88-39.4 88-88V312c0-13.3-10.7-24-24-24s-24 10.7-24 24V424c0 22.1-17.9 40-40 40H88c-22.1 0-40-17.9-40-40V152c0-22.1 17.9-40 40-40H200c13.3 0 24-10.7 24-24s-10.7-24-24-24H88z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="edit-field-group">
                  <label>SUBCATEGORY</label>
                  <div className="edit-input-group">
                    <select
                      value={formData.subCategory}
                      onChange={(e) => handleChange("subCategory", e.target.value)}
                      disabled={!formData.category || loadingSubCategories}
                    >
                      <option value="">
                        {!formData.category
                          ? "Select category first"
                          : loadingSubCategories
                          ? "Loading subcategories..."
                          : subCategories.length === 0
                          ? "No subcategories available"
                          : "Select subcategory"}
                      </option>
                      {Array.isArray(subCategories) && subCategories.length > 0 && subCategories.map((subCat) => (
                        <option key={subCat.id} value={subCat.id}>
                          {subCat.name}
                        </option>
                      ))}
                    </select>
                    <button
                      className="edit-icon-btn"
                      onClick={() => {
                        setIsEditing((prev) => ({ ...prev, subCategory: !prev.subCategory }));
                        if (isEditing.subCategory) {
                          handleSave("subCategory");
                        }
                      }}
                    >
                      {isEditing.subCategory ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                        >
                          <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          viewBox="0 0 512 512"
                        >
                          <path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152V424c0 48.6 39.4 88 88 88H360c48.6 0 88-39.4 88-88V312c0-13.3-10.7-24-24-24s-24 10.7-24 24V424c0 22.1-17.9 40-40 40H88c-22.1 0-40-17.9-40-40V152c0-22.1 17.9-40 40-40H200c13.3 0 24-10.7 24-24s-10.7-24-24-24H88z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="edit-field-group">
                  <label>DESCRIPTION</label>
                  <div className="edit-input-group">
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                      placeholder="DESCRIPTION"
                      rows="3"
                    />
                    <button
                      className="edit-icon-btn"
                      onClick={() => {
                        setIsEditing((prev) => ({ ...prev, description: !prev.description }));
                        if (isEditing.description) {
                          handleSave("description");
                        }
                      }}
                    >
                      {isEditing.description ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                        >
                          <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          viewBox="0 0 512 512"
                        >
                          <path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152V424c0 48.6 39.4 88 88 88H360c48.6 0 88-39.4 88-88V312c0-13.3-10.7-24-24-24s-24 10.7-24 24V424c0 22.1-17.9 40-40 40H88c-22.1 0-40-17.9-40-40V152c0-22.1 17.9-40 40-40H200c13.3 0 24-10.7 24-24s-10.7-24-24-24H88z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="edit-field-group">
                  <label>IMAGE</label>
                  <div className="edit-input-group">
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => handleChange("image", e.target.value)}
                      placeholder="IMAGE NAME"
                    />
                    <button
                      className="edit-icon-btn"
                      onClick={() => {
                        setIsEditing((prev) => ({ ...prev, image: !prev.image }));
                        if (isEditing.image) {
                          handleSave("image");
                        }
                      }}
                    >
                      {isEditing.image ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                        >
                          <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          viewBox="0 0 512 512"
                        >
                          <path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152V424c0 48.6 39.4 88 88 88H360c48.6 0 88-39.4 88-88V312c0-13.3-10.7-24-24-24s-24 10.7-24 24V424c0 22.1-17.9 40-40 40H88c-22.1 0-40-17.9-40-40V152c0-22.1 17.9-40 40-40H200c13.3 0 24-10.7 24-24s-10.7-24-24-24H88z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="edit-form-column">
                <div className="edit-field-group">
                  <label>SUPPLIER ID</label>
                  <div className="edit-input-group">
                    <input
                      type="text"
                      value={formData.supplierId}
                      onChange={(e) => handleChange("supplierId", e.target.value)}
                      placeholder="MANUFACTURER"
                    />
                    <button
                      className="edit-icon-btn"
                      onClick={() => {
                        setIsEditing((prev) => ({ ...prev, supplierId: !prev.supplierId }));
                        if (isEditing.supplierId) {
                          handleSave("supplierId");
                        }
                      }}
                    >
                      {isEditing.supplierId ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                        >
                          <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          viewBox="0 0 512 512"
                        >
                          <path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152V424c0 48.6 39.4 88 88 88H360c48.6 0 88-39.4 88-88V312c0-13.3-10.7-24-24-24s-24 10.7-24 24V424c0 22.1-17.9 40-40 40H88c-22.1 0-40-17.9-40-40V152c0-22.1 17.9-40 40-40H200c13.3 0 24-10.7 24-24s-10.7-24-24-24H88z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="edit-field-group">
                  <label>CATEGORY</label>
                  <div className="edit-input-group">
                    <select
                      value={formData.category}
                      onChange={(e) => handleChange("category", e.target.value)}
                      disabled={loadingCategories}
                    >
                      <option value="">
                        {loadingCategories 
                          ? "Loading..." 
                          : categories.length === 0 
                          ? "No categories available" 
                          : "Select category"}
                      </option>
                      {Array.isArray(categories) && categories.length > 0 && categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <button
                      className="edit-icon-btn"
                      onClick={() => {
                        setIsEditing((prev) => ({ ...prev, category: !prev.category }));
                        if (isEditing.category) {
                          handleSave("category");
                        }
                      }}
                    >
                      {isEditing.category ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                        >
                          <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          viewBox="0 0 512 512"
                        >
                          <path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152V424c0 48.6 39.4 88 88 88H360c48.6 0 88-39.4 88-88V312c0-13.3-10.7-24-24-24s-24 10.7-24 24V424c0 22.1-17.9 40-40 40H88c-22.1 0-40-17.9-40-40V152c0-22.1 17.9-40 40-40H200c13.3 0 24-10.7 24-24s-10.7-24-24-24H88z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="edit-field-group">
                  <label>COST PRICE</label>
                  <div className="edit-input-group">
                    <input
                      type="number"
                      value={formData.costPrice}
                      onChange={(e) => handleChange("costPrice", e.target.value)}
                      placeholder="COST PRICE"
                    />
                    <button
                      className="edit-icon-btn"
                      onClick={() => {
                        setIsEditing((prev) => ({ ...prev, costPrice: !prev.costPrice }));
                        if (isEditing.costPrice) {
                          handleSave("costPrice");
                        }
                      }}
                    >
                      {isEditing.costPrice ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                        >
                          <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          viewBox="0 0 512 512"
                        >
                          <path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152V424c0 48.6 39.4 88 88 88H360c48.6 0 88-39.4 88-88V312c0-13.3-10.7-24-24-24s-24 10.7-24 24V424c0 22.1-17.9 40-40 40H88c-22.1 0-40-17.9-40-40V152c0-22.1 17.9-40 40-40H200c13.3 0 24-10.7 24-24s-10.7-24-24-24H88z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="edit-field-group">
                  <label>SELLING PRICE</label>
                  <div className="edit-input-group">
                    <input
                      type="number"
                      value={formData.sellingPrice}
                      onChange={(e) => handleChange("sellingPrice", e.target.value)}
                      placeholder="SELLING PRICE"
                    />
                    <button
                      className="edit-icon-btn"
                      onClick={() => {
                        setIsEditing((prev) => ({ ...prev, sellingPrice: !prev.sellingPrice }));
                        if (isEditing.sellingPrice) {
                          handleSave("sellingPrice");
                        }
                      }}
                    >
                      {isEditing.sellingPrice ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                        >
                          <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          viewBox="0 0 512 512"
                        >
                          <path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152V424c0 48.6 39.4 88 88 88H360c48.6 0 88-39.4 88-88V312c0-13.3-10.7-24-24-24s-24 10.7-24 24V424c0 22.1-17.9 40-40 40H88c-22.1 0-40-17.9-40-40V152c0-22.1 17.9-40 40-40H200c13.3 0 24-10.7 24-24s-10.7-24-24-24H88z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="edit-field-group">
                  <label>QUANTITY IN STORE</label>
                  <div className="edit-input-group">
                    <input
                      type="number"
                      value={formData.quantityInStore}
                      onChange={(e) => handleChange("quantityInStore", e.target.value)}
                      placeholder="QUANTITY IN STORE"
                    />
                    <button
                      className="edit-icon-btn"
                      onClick={() => {
                        setIsEditing((prev) => ({ ...prev, quantityInStore: !prev.quantityInStore }));
                        if (isEditing.quantityInStore) {
                          handleSave("quantityInStore");
                        }
                      }}
                    >
                      {isEditing.quantityInStore ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                        >
                          <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          viewBox="0 0 512 512"
                        >
                          <path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152V424c0 48.6 39.4 88 88 88H360c48.6 0 88-39.4 88-88V312c0-13.3-10.7-24-24-24s-24 10.7-24 24V424c0 22.1-17.9 40-40 40H88c-22.1 0-40-17.9-40-40V152c0-22.1 17.9-40 40-40H200c13.3 0 24-10.7 24-24s-10.7-24-24-24H88z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="edit-field-group">
                  <label>WEIGHT (KG)</label>
                  <div className="edit-input-group">
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={formData.weightKg}
                      onChange={(e) => handleChange("weightKg", e.target.value)}
                      placeholder="WEIGHT (KG)"
                    />
                    <button
                      className="edit-icon-btn"
                      onClick={() => {
                        setIsEditing((prev) => ({ ...prev, weightKg: !prev.weightKg }));
                        if (isEditing.weightKg) {
                          handleSave("weightKg");
                        }
                      }}
                    >
                      {isEditing.weightKg ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                        >
                          <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          viewBox="0 0 512 512"
                        >
                          <path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152V424c0 48.6 39.4 88 88 88H360c48.6 0 88-39.4 88-88V312c0-13.3-10.7-24-24-24s-24 10.7-24 24V424c0 22.1-17.9 40-40 40H88c-22.1 0-40-17.9-40-40V152c0-22.1 17.9-40 40-40H200c13.3 0 24-10.7 24-24s-10.7-24-24-24H88z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="error-message" style={{ color: "red", marginTop: "1rem" }}>
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Navigation arrows */}
        <div className="product-navigation">
          <button
            className="nav-arrow-btn"
            onClick={() => navigate("/editProducts")}
          > 
            &lt;
          </button>
          <button
            className="nav-arrow-btn"
            onClick={() => navigate("/editProducts")}
          >
            &gt;
          </button>
        </div>
      </div>    

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
      />

      {/* Delete Success Modal */}
      <DeleteSuccessModal
        isOpen={showDeleteSuccess}
        onClose={() => setShowDeleteSuccess(false)}
      />
    </div>
  );
};

export default EditProductDetail;
