import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Cookies from "js-cookie";
import { API_BASE_URL, apiRequest, apiRequestMultipart } from "../../../../lib/config";
import PMlogo from "../../../../assets/images/PMlogo.png";
import "./SupplierDetail.css";

const SupplierDetail = () => {
  const { supplierId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passportFile, setPassportFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    contactName: "",
    contactPhoneNo: "",
    contactEmail: "",
    taxId: "",
    paymentTerms: "",
    deliveryTerms: "",
    address: "",
    passportImage: "",
  });

  useEffect(() => {
    if (location.state?.supplier) {
      const supplierFromState = location.state.supplier;
      setSupplier(supplierFromState);
      initializeFormData(supplierFromState);
      setLoading(false);
    } else {
      fetchSupplier();
    }

    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [supplierId, location.state]);

  const fetchImageWithAuth = async (imageUrl) => {
    try {
      setImageLoading(true);
      const token = Cookies.get("authToken");
      if (!token) {
        return null;
      }

      const response = await fetch(imageUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (fetchError) {
      console.error("SupplierDetail: Error fetching image:", fetchError);
      return null;
    } finally {
      setImageLoading(false);
    }
  };

  const buildImageUrl = (imagePath) => {
    if (!imagePath) {
      return null;
    }

    let cleanPath = imagePath.toString().trim().replace(/[,\s]+$/, "");

    if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
      return cleanPath.replace(/,$/, "");
    }

    if (cleanPath.startsWith("/")) {
      return `${API_BASE_URL}${cleanPath}`;
    }

    cleanPath = cleanPath.replace(/^\/+/, "").replace(/,$/, "");
    let baseUrl = API_BASE_URL;
    if (!baseUrl.includes("/api")) {
      baseUrl = baseUrl.endsWith("/") ? `${baseUrl}api` : `${baseUrl}/api`;
    }

    return `${baseUrl}/users/customer/image/${cleanPath}`;
  };

  const fetchSupplier = async () => {
    try {
      setLoading(true);
      setError("");

      const isNumeric = /^\d+$/.test(supplierId);
      let supplierData = null;

      if (!isNumeric) {
        const allSuppliersResponse = await apiRequest("/users/suppliers", "GET");

        let allSuppliers = [];
        if (Array.isArray(allSuppliersResponse)) {
          allSuppliers = allSuppliersResponse;
        } else if (allSuppliersResponse?.data && Array.isArray(allSuppliersResponse.data)) {
          allSuppliers = allSuppliersResponse.data;
        } else if (allSuppliersResponse?.response?.data && Array.isArray(allSuppliersResponse.response.data)) {
          allSuppliers = allSuppliersResponse.response.data;
        }

        supplierData = allSuppliers.find(
          (item) => item.supplierId === supplierId || item.id?.toString() === supplierId,
        );

        if (!supplierData) {
          throw new Error(`Supplier with ID ${supplierId} not found`);
        }
      } else {
        const response = await apiRequest(`/users/suppliers/${supplierId}`, "GET");

        if (response?.data) {
          supplierData = response.data;
        } else if (response?.response?.data) {
          supplierData = response.response.data;
        } else if (response?.response) {
          supplierData = response.response;
        } else {
          supplierData = response;
        }
      }

      setSupplier(supplierData);
      initializeFormData(supplierData);
    } catch (err) {
      console.error("SupplierDetail: Error fetching supplier:", err);
      setError(err?.message || "Failed to load supplier.");
    } finally {
      setLoading(false);
    }
  };

  const initializeFormData = async (supplierData) => {
    const formDataInit = {
      customerName:
        supplierData.customerName ||
        supplierData.companyName ||
        supplierData.name ||
        supplierData.supplierName ||
        "",
      contactName:
        supplierData.contactName ||
        supplierData.contactPersonName ||
        supplierData.contactPerson ||
        supplierData.personName ||
        "",
      contactPhoneNo:
        supplierData.contactPhoneNo ||
        supplierData.contactPhoneNumber ||
        supplierData.phoneNumber ||
        supplierData.phone ||
        supplierData.contactPhone ||
        "",
      contactEmail:
        supplierData.contactEmail ||
        supplierData.email ||
        supplierData.contactEmailAddress ||
        "",
      taxId:
        supplierData.taxId ||
        supplierData.taxIdNumber ||
        supplierData.taxIdNo ||
        supplierData.taxNumber ||
        "",
      paymentTerms: supplierData.paymentTerms || "",
      deliveryTerms: supplierData.deliveryTerms || "",
      address:
        supplierData.address ||
        supplierData.supplierAddress ||
        supplierData.location ||
        "",
      passportImage:
        supplierData.passportImage ||
        supplierData.passportPhoto ||
        supplierData.passport ||
        "",
    };

    setFormData(formDataInit);

    if (supplierData.passportImage) {
      const imageUrl = buildImageUrl(supplierData.passportImage);
      if (imageUrl) {
        const previewUrl = await fetchImageWithAuth(imageUrl);
        if (previewUrl) {
          setImagePreview(previewUrl);
        }
      }
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (error) {
      setError("");
    }
  };

  const handleFileChange = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const file = event.target.files[0];
    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size should be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    setPassportFile(file);
    const previewUrl = URL.createObjectURL(file);
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(previewUrl);
    setError("");
  };

  const handleRemoveImage = () => {
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setPassportFile(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    setError("");
    setSuccess("");

    const requiredFields = {
      "Company Name": formData.customerName,
      "Contact Name": formData.contactName,
      "Contact Phone": formData.contactPhoneNo,
      "Contact Email": formData.contactEmail,
      "Tax ID": formData.taxId,
      Address: formData.address,
    };

    const unfilledFields = Object.entries(requiredFields)
      .filter(([, value]) => !value || value.trim() === "")
      .map(([key]) => key);

    if (unfilledFields.length > 0) {
      setError(`Please fill out: ${unfilledFields.join(", ")}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.contactEmail && !emailRegex.test(formData.contactEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setSaving(true);

      const numericId = supplier?.id || supplier?.supplierId;
      if (!numericId) {
        throw new Error("Supplier ID not found");
      }

      const numericIdStr = numericId.toString();
      if (!/^\d+$/.test(numericIdStr)) {
        throw new Error("Invalid supplier ID format");
      }

      const formDataToSend = new FormData();

      if (formData.customerName?.trim()) {
        formDataToSend.append("customerName", formData.customerName.trim());
      }
      if (formData.contactName?.trim()) {
        formDataToSend.append("contactName", formData.contactName.trim());
      }
      if (formData.contactPhoneNo?.trim()) {
        formDataToSend.append("contactPhoneNo", formData.contactPhoneNo.trim());
      }
      if (formData.contactEmail?.trim()) {
        formDataToSend.append("contactEmail", formData.contactEmail.trim());
      }
      if (formData.taxId?.trim()) {
        formDataToSend.append("taxId", formData.taxId.trim());
      }
      if (formData.paymentTerms?.trim()) {
        formDataToSend.append("paymentTerms", formData.paymentTerms.trim());
      }
      if (formData.deliveryTerms?.trim()) {
        formDataToSend.append("deliveryTerms", formData.deliveryTerms.trim());
      }
      if (formData.address?.trim()) {
        formDataToSend.append("address", formData.address.trim());
      }

      if (passportFile) {
        formDataToSend.append("passportImage", passportFile);
      }

      await apiRequestMultipart(`/users/suppliers/${numericIdStr}`, "PUT", formDataToSend);

      setSuccess("Supplier updated successfully! Redirecting...");
      setTimeout(() => {
        navigate("/inventory/suppliers");
      }, 1500);
    } catch (err) {
      console.error("Error updating supplier:", err);
      let errorMessage = "Failed to update supplier. ";
      if (err?.message) {
        errorMessage += err.message;
      } else {
        errorMessage += "Please try again.";
      }
      setError(errorMessage);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setSaving(false);
    }
  };

  const renderNav = () => (
    <nav className="supplier-nav">
      <div className="supplier-nav-shell">
        <div className="supplier-nav-brand">
          <div className="cart-icon-nav">
            <img src={PMlogo} alt="Peace of Mind logo" className="supplier-nav-logo" />
          </div>
          <div className="supplier-nav-copy">
            <p className="supplier-nav-eyebrow">Inventory Module</p>
            <h1 className="supplier-nav-title">Supplier Profile</h1>
            <p className="supplier-nav-subtitle">Review and update supplier records from one standard page.</p>
          </div>
        </div>

        <Link to="/inventory/suppliers" className="supplier-back-link">
          <button type="button" className="supplier-back-btn">Back to Suppliers</button>
        </Link>
      </div>
    </nav>
  );

  if (loading) {
    return (
      <div className="supplier-detail-container">
        {renderNav()}
        <div className="supplier-content">
          <div className="supplier-loading-card">
            <div className="loading-message">Loading supplier details...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="supplier-detail-container">
      {renderNav()}

      <div className="supplier-content">
        <section className="supplier-hero">
          <div className="supplier-hero-copy">
            <h2 className="supplier-title">Supplier Details</h2>
            <p className="supplier-description">
              Update the supplier profile with clean contact information, operating terms, address details, and a passport photograph before saving the changes back to the system.
            </p>
          </div>
          <div className="supplier-status-pill">
            {supplier?.supplierId || supplier?.id ? `ID ${supplier?.supplierId || supplier?.id}` : "Supplier Record"}
          </div>
        </section>

        {error && (
          <div className="supplier-alert supplier-alert-danger">
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className="supplier-alert supplier-alert-success">
            <strong>Success!</strong> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="supplier-form" noValidate>
          <div className="supplier-layout">
            <div className="supplier-main-card">
              <div className="supplier-section-head">
                <h3>Supplier Information</h3>
                <p>Keep the supplier record complete and easy to review by using clear business, contact, and location details.</p>
              </div>

              <div className="supplier-form-grid">
                <div className="supplier-field-group">
                  <label>Company Name *</label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(event) => handleChange("customerName", event.target.value)}
                    placeholder="Company name"
                    required
                    disabled={saving}
                  />
                </div>

                <div className="supplier-field-group">
                  <label>Contact Name *</label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(event) => handleChange("contactName", event.target.value)}
                    placeholder="Contact person name"
                    required
                    disabled={saving}
                  />
                </div>

                <div className="supplier-field-group">
                  <label>Contact Email *</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(event) => handleChange("contactEmail", event.target.value)}
                    placeholder="contact@example.com"
                    required
                    disabled={saving}
                  />
                </div>

                <div className="supplier-field-group">
                  <label>Contact Phone Number *</label>
                  <input
                    type="tel"
                    value={formData.contactPhoneNo}
                    onChange={(event) => handleChange("contactPhoneNo", event.target.value)}
                    placeholder="Phone number"
                    required
                    disabled={saving}
                  />
                </div>

                <div className="supplier-field-group">
                  <label>Tax ID *</label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={(event) => handleChange("taxId", event.target.value)}
                    placeholder="Tax ID number"
                    required
                    disabled={saving}
                  />
                </div>

                <div className="supplier-field-group">
                  <label>Payment Terms</label>
                  <input
                    type="text"
                    value={formData.paymentTerms}
                    onChange={(event) => handleChange("paymentTerms", event.target.value)}
                    placeholder="Payment terms"
                    disabled={saving}
                  />
                </div>

                <div className="supplier-field-group supplier-field-group-full">
                  <label>Delivery Terms</label>
                  <input
                    type="text"
                    value={formData.deliveryTerms}
                    onChange={(event) => handleChange("deliveryTerms", event.target.value)}
                    placeholder="Delivery terms"
                    disabled={saving}
                  />
                </div>

                <div className="supplier-field-group supplier-field-group-full">
                  <label>Address *</label>
                  <textarea
                    value={formData.address}
                    onChange={(event) => handleChange("address", event.target.value)}
                    placeholder="Street, city, state, postal code"
                    rows="4"
                    required
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="supplier-form-actions">
                <Link to="/inventory/suppliers" className="supplier-back-link">
                  <button type="button" className="supplier-action-btn supplier-action-btn-secondary" disabled={saving}>
                    Cancel
                  </button>
                </Link>
                <button type="submit" disabled={saving} className="supplier-action-btn supplier-action-btn-primary">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>

            <aside className="supplier-side-card">
              <div className="supplier-section-head">
                <h3>Passport Photograph</h3>
                <p>Upload a clean supplier image for quick verification across the inventory workflow.</p>
              </div>

              <div className="supplier-photo-shell">
                <div className="supplier-photo-preview">
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Supplier passport preview" />
                      {!saving && (
                        <button type="button" onClick={handleRemoveImage} className="supplier-remove-image">
                          ×
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="supplier-photo-placeholder">
                      <div>
                        <strong>No passport image uploaded</strong>
                        <span>Add a JPG or PNG image up to 5MB.</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="supplier-photo-actions">
                  <label
                    htmlFor="passport-upload"
                    className={`supplier-upload-btn ${saving ? "supplier-upload-btn-disabled" : ""}`}
                  >
                    {imagePreview ? "Change Photo" : "Upload Photo"}
                  </label>
                  <input
                    id="passport-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                    disabled={saving}
                  />
                  {passportFile && <span className="supplier-file-name">{passportFile.name}</span>}
                </div>

                <p className="supplier-photo-meta">
                  Max file size: 5MB. Supported image formats include JPG, PNG, and GIF.
                </p>

                <div className="supplier-meta-list">
                  <div className="supplier-meta-item">
                    <span>Supplier Number</span>
                    <strong>{supplier?.supplierId || supplier?.id || "Not available"}</strong>
                  </div>
                  <div className="supplier-meta-item">
                    <span>Email on Record</span>
                    <strong>{formData.contactEmail || "Not set"}</strong>
                  </div>
                  <div className="supplier-meta-item">
                    <span>Image Status</span>
                    <strong>
                      {imageLoading ? "Loading image..." : imagePreview ? "Passport image available" : "No image selected"}
                    </strong>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierDetail;
