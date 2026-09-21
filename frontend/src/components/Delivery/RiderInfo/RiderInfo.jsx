import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import BranchBadge from "../../shared/BranchBadge";
import { deliveryApi } from "../../../lib/deliveryApi";

const EMPTY_FORM = {
  surName: "",
  otherName: "",
  email: "",
  phoneNumber: "",
  gender: "",
  modeOfTransport: "",
  dob: "",
  contactAddress: "",
  officeAddress: "",
  nationality: "",
  nin: "",
  bvn: "",
  nextOfKin: "",
  nextOfKinAddress: "",
};

// riderId, when provided, switches the form from "register a new rider" into
// "edit an existing rider": it fetches and prefills the record, submits to
// updateRiderInfo instead of createRiderInfo, and doesn't require the
// passport/licence/signature files to be re-selected since they already
// exist on the record.
const RiderInfo = ({ toggleInfoModal, riderId = null, onSaved }) => {
  const isEditMode = Boolean(riderId);

  const closeModal = () => {
    toggleInfoModal();
  };

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [existingFiles, setExistingFiles] = useState({
    passport: "",
    licences: "",
    signature: "",
  });

  const [files, setFiles] = useState({
    passport: null,
    licences: null,
    signature: null,
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [initialLoadError, setInitialLoadError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!isEditMode) return;

    let cancelled = false;

    (async () => {
      try {
        setInitialLoading(true);
        setInitialLoadError("");
        const rider = await deliveryApi.getRiderById(riderId);
        if (!rider || cancelled) return;

        setFormData({
          surName: rider.surName || rider.surname || "",
          otherName: rider.otherName || rider.otherNames || rider.othernames || rider.other_names || "",
          email: rider.email || "",
          phoneNumber: rider.phoneNumber || rider.telephoneNo || rider.telephone || rider.phone || "",
          gender: (rider.gender || "").toUpperCase(),
          modeOfTransport: (rider.modeOfTransport || rider.mode_of_transport || "").toUpperCase(),
          dob: rider.dob || rider.dateOfBirth || rider.date_of_birth || "",
          contactAddress: rider.contactAddress || rider.contact_address || "",
          officeAddress: rider.officeAddress || rider.office_address || "",
          nationality: rider.nationality || "",
          nin: rider.nin || rider.ninNumber || "",
          bvn: rider.bvn || rider.bvnNumber || "",
          nextOfKin: rider.nextOfKin || rider.next_of_kin || "",
          nextOfKinAddress: rider.nextOfKinAddress || rider.next_of_kin_address || "",
        });
        setExistingFiles({
          passport: rider.passport || rider.passportImage || rider.passport_image || "",
          licences: rider.licences || rider.licenseImage || rider.license_image || rider.licenceImage || "",
          signature: rider.signature || rider.signatureImage || rider.signature_image || "",
        });
      } catch (err) {
        if (!cancelled) {
          setInitialLoadError(err?.message || "Failed to load rider details.");
        }
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isEditMode, riderId]);

  // App colors
  const colors = {
    primary: "#0867db",
    primaryHover: "#0756b8",
    text: "#111",
    textMuted: "#6c757d",
    border: "#c0c0c0",
    white: "#ffffff",
    bgLight: "#f8f9fa",
    danger: "#dc3545",
    success: "#28a745",
    warning: "#ffc107",
    warningText: "#856404",
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear field-specific error when user types
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: null });
    }
    if (error) setError("");
  };

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (file) {
      setFiles({ ...files, [fileType]: file });
      console.log(`📁 ${fileType} selected:`, file.name);
      // Clear field-specific error when file selected
      if (fieldErrors[fileType]) {
        setFieldErrors({ ...fieldErrors, [fileType]: null });
      }
    }
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    // Required text fields
    const requiredFields = [
      "surName", "otherName", "email", "phoneNumber",
      "gender", "modeOfTransport", "dob", "nextOfKin", "nextOfKinAddress"
    ];
    
    requiredFields.forEach(field => {
      if (!formData[field]?.trim()) {
        errors[field] = `${field} is required`;
        isValid = false;
      }
    });

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.email = "Please enter a valid email address";
      isValid = false;
    }

    // Phone number validation (basic)
    const phoneRegex = /^[0-9+\-\s]{10,15}$/;
    if (formData.phoneNumber && !phoneRegex.test(formData.phoneNumber)) {
      errors.phoneNumber = "Please enter a valid phone number";
      isValid = false;
    }

    // NIN validation (11 digits)
    if (formData.nin && formData.nin.length !== 11) {
      errors.nin = "NIN must be 11 digits";
      isValid = false;
    }

    // BVN validation (11 digits)
    if (formData.bvn && formData.bvn.length !== 11) {
      errors.bvn = "BVN must be 11 digits";
      isValid = false;
    }

    // File validations - only required when registering a new rider; an
    // edit keeps the existing file on record unless a replacement is picked.
    if (!isEditMode) {
      if (!files.passport) {
        errors.passport = "Passport image is required";
        isValid = false;
      }
      if (!files.licences) {
        errors.licences = "Licence file is required";
        isValid = false;
      }
      if (!files.signature) {
        errors.signature = "Signature image is required";
        isValid = false;
      }
    }

    // File type validation
    if (files.passport && !files.passport.type.startsWith('image/')) {
      errors.passport = "Passport must be an image file";
      isValid = false;
    }
    if (files.signature && !files.signature.type.startsWith('image/')) {
      errors.signature = "Signature must be an image file";
      isValid = false;
    }
    // Licence can be image or PDF
    if (files.licences && !files.licences.type.startsWith('image/') && files.licences.type !== 'application/pdf') {
      errors.licences = "Licence must be an image or PDF file";
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  // Function to parse duplicate entry errors from the database
  const parseDuplicateError = (errorMessage) => {
    console.log("🔍 Parsing error:", errorMessage);
    
    // Check for duplicate email
    if (errorMessage.includes("UK_6dotkott2kjsp8vw4d0m25fb7") || 
        errorMessage.includes("email") && errorMessage.includes("Duplicate")) {
      return {
        field: "email",
        message: `Email "${formData.email}" is already registered. Please use a different email address.`
      };
    }
    
    // Check for duplicate phone number
    if (errorMessage.includes("UK_phone_number") || 
        errorMessage.includes("phone_number") && errorMessage.includes("Duplicate") ||
        errorMessage.includes("phoneNumber") && errorMessage.includes("Duplicate")) {
      return {
        field: "phoneNumber",
        message: `Phone number "${formData.phoneNumber}" is already registered. Please use a different phone number.`
      };
    }
    
    // Check for duplicate BVN
    if (errorMessage.includes("UK_bvn") || 
        errorMessage.includes("bvn") && errorMessage.includes("Duplicate")) {
      return {
        field: "bvn",
        message: `BVN "${formData.bvn}" is already registered. Please use a different BVN.`
      };
    }
    
    // Check for duplicate NIN
    if (errorMessage.includes("UK_nin") || 
        errorMessage.includes("nin") && errorMessage.includes("Duplicate")) {
      return {
        field: "nin",
        message: `NIN "${formData.nin}" is already registered. Please use a different NIN.`
      };
    }
    
    // Generic duplicate
    if (errorMessage.includes("Duplicate entry")) {
      // Try to extract the duplicate value
      const match = errorMessage.match(/'([^']+)'/);
      const duplicateValue = match ? match[1] : "value";
      return {
        field: null,
        message: `The ${duplicateValue} is already registered. Please use a different value.`
      };
    }
    
    return null;
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    setError("Please fix the errors below");
    return;
  }

  try {
    setLoading(true);
    setError("");
    setSuccess("");
    console.log("📝 Submitting rider info...");

    const data = new FormData();
    
    // Append all form fields
    Object.keys(formData).forEach(key => {
      if (formData[key]?.trim()) {
        data.append(key, formData[key].trim());
        console.log(`✅ Appending field: ${key}`);
      }
    });

    // Append files
    if (files.passport) {
      data.append("passport", files.passport);
      console.log("✅ Appending passport file");
    }
    if (files.licences) {
      data.append("licences", files.licences);
      console.log("✅ Appending licences file");
    }
    if (files.signature) {
      data.append("signature", files.signature);
      console.log("✅ Appending signature file");
    }

    const response = isEditMode
      ? await deliveryApi.updateRider(riderId, data)
      : await deliveryApi.createRider(data);

    console.log(`✅ Rider ${isEditMode ? "updated" : "registered"} successfully:`, response);
    setSuccess(isEditMode ? "Rider updated successfully!" : "Rider registered successfully!");

    if (!isEditMode) {
      setFormData(EMPTY_FORM);
    }
    setFiles({
      passport: null,
      licences: null,
      signature: null,
    });

    setTimeout(() => {
      setSuccess("");
      if (onSaved) onSaved();
      closeModal();
    }, 2000);
  } catch (err) {
    console.error(`❌ Error ${isEditMode ? "updating" : "registering"} rider:`, err);
    console.error("❌ Full error data:", err.data);
    console.error("❌ Error message:", err.message);

    let errorMessage = isEditMode ? "Failed to update rider" : "Failed to register rider";
    let fieldToHighlight = null;
    
    // Check for duplicate entry errors
    if (err.data?.message?.includes("Duplicate entry") || 
        err.message?.includes("Duplicate entry")) {
      
      const errorSource = err.data?.message || err.message;
      console.log("🔍 Error source:", errorSource);
      
      // Extract the duplicate value (the one in quotes)
      const valueMatch = errorSource.match(/'([^']+)'/);
      const duplicateValue = valueMatch ? valueMatch[1] : "";
      
      console.log("🔍 Duplicate value:", duplicateValue);
      
      // Check which field this value belongs to by comparing with form data
      if (duplicateValue === formData.email) {
        errorMessage = `Email "${formData.email}" is already registered. Please use a different email address.`;
        fieldToHighlight = "email";
      } 
      else if (duplicateValue === formData.phoneNumber) {
        errorMessage = `Phone number "${formData.phoneNumber}" is already registered. Please use a different phone number.`;
        fieldToHighlight = "phoneNumber";
      }
      else if (duplicateValue === formData.bvn) {
        errorMessage = `BVN "${formData.bvn}" is already registered. Please use a different BVN.`;
        fieldToHighlight = "bvn";
      }
      else if (duplicateValue === formData.nin) {
        errorMessage = `NIN "${formData.nin}" is already registered. Please use a different NIN.`;
        fieldToHighlight = "nin";
      }
      else {
        // If we can't match, try to guess from the constraint name
        if (errorSource.includes("UK_6dotkott2kjsp8vw4d0m25fb7")) {
          errorMessage = `Email "${formData.email}" is already registered. Please use a different email address.`;
          fieldToHighlight = "email";
        } else if (errorSource.includes("phone")) {
          errorMessage = `Phone number "${formData.phoneNumber}" is already registered. Please use a different phone number.`;
          fieldToHighlight = "phoneNumber";
        } else {
          errorMessage = `The value "${duplicateValue}" is already registered. Please use a different value.`;
        }
      }
      
      // Highlight the specific field with error
      if (fieldToHighlight) {
        setFieldErrors(prev => ({
          ...prev,
          [fieldToHighlight]: errorMessage
        }));
      }
    } 
    // File upload errors
    else if (err.data?.message?.includes("file is null") || err.message?.includes("file is null")) {
      errorMessage = "Please select all required files (passport, licence, signature)";
    }
    // Other errors
    else if (err.data?.message) {
      errorMessage = err.data.message;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};

  // Helper to render field error
  const renderFieldError = (fieldName) => {
    if (fieldErrors[fieldName]) {
      return (
        <div style={{ color: colors.danger, fontSize: "0.8rem", marginTop: "0.3rem" }}>
          ⚠️ {fieldErrors[fieldName]}
        </div>
      );
    }
    return null;
  };

  if (initialLoading) {
    return (
      <div style={{ maxWidth: "600px", width: "100%", padding: "3rem 2rem", textAlign: "center" }}>
        <p>Loading rider details...</p>
      </div>
    );
  }

  if (initialLoadError) {
    return (
      <div style={{ maxWidth: "600px", width: "100%", padding: "2rem" }}>
        <div style={{
          backgroundColor: "#f8d7da",
          color: "#721c24",
          padding: "12px 20px",
          borderRadius: "6px",
          border: "1px solid #f5c6cb",
        }}>
          <strong>❌ Error:</strong> {initialLoadError}
        </div>
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <button
            onClick={closeModal}
            style={{
              padding: "0.6rem 1.5rem",
              backgroundColor: colors.primary,
              color: colors.white,
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: "1100px",
      width: "100%",
      padding: "2rem",
      backgroundColor: colors.white,
      borderRadius: "12px",
      position: "relative",
      boxSizing: "border-box",
      maxHeight: "90vh",
      overflowY: "auto"
    }}>
      {/* Dashboard Button */}
      <button
        style={{
          position: "absolute",
          top: "1.5rem",
          left: "2rem",
          backgroundColor: colors.primary,
          color: colors.white,
          border: "none",
          borderRadius: "5px",
          padding: "0.5rem 1rem",
          fontWeight: 600,
          cursor: "pointer",
          fontSize: "0.9rem",
          zIndex: 10
        }}
      >
        <Link to="/adminDashboard" style={{ color: colors.white, textDecoration: "none" }}>
          Dashboard
        </Link>
      </button>

      {/* Logo */}
      <div style={{
        position: "absolute",
        top: "1.5rem",
        left: "50%",
        transform: "translateX(-50%)"
      }}>
        <svg width="50" height="40" viewBox="0 0 100 80" fill="none">
          <path d="M10 20 L40 20 L45 40 L85 40 L90 20" stroke={colors.primary} strokeWidth="6" fill="none"/>
          <circle cx="35" cy="55" r="8" fill={colors.primary}/>
          <circle cx="75" cy="55" r="8" fill={colors.primary}/>
          <path d="M50 15 L65 5 L80 15" stroke="#dc3545" strokeWidth="6" fill="none"/>
        </svg>
      </div>

      {/* Title */}
      <h1 style={{
        fontSize: "1.8rem",
        textTransform: "uppercase",
        color: colors.primary,
        textAlign: "center",
        fontWeight: 700,
        margin: "3.5rem 0 1rem",
        letterSpacing: "1px"
      }}>
        {isEditMode ? "EDIT RIDER" : "RIDER'S FORM"}
      </h1>
      <div style={{ display: "flex", justifyContent: "center", margin: "0 0 1rem" }}>
        <BranchBadge />
      </div>

      {/* Auto-generated ID */}
      <p style={{
        textAlign: "center",
        color: colors.primary,
        fontWeight: 600,
        fontSize: "1rem",
        marginBottom: "2rem",
        letterSpacing: "0.5px"
      }}>
        PM/RD/{isEditMode ? riderId : "ID"}/AUTOGEN
      </p>

      {/* Close Button */}
      <span
        onClick={closeModal}
        style={{
          position: "absolute",
          right: "2rem",
          top: "1.5rem",
          fontSize: "1.5rem",
          color: colors.primary,
          cursor: "pointer",
          fontWeight: 600,
          width: "36px",
          height: "36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          border: `2px solid ${colors.primary}`,
          zIndex: 10
        }}
      >
        ←
      </span>

      {/* Alerts */}
      {error && (
        <div style={{
          backgroundColor: "#f8d7da",
          color: "#721c24",
          padding: "12px 20px",
          borderRadius: "6px",
          marginBottom: "1.5rem",
          border: "1px solid #f5c6cb"
        }}>
          <strong>❌ Error:</strong> {error}
        </div>
      )}
      
      {success && (
        <div style={{
          backgroundColor: "#d4edda",
          color: "#155724",
          padding: "12px 20px",
          borderRadius: "6px",
          marginBottom: "1.5rem",
          border: "1px solid #c3e6cb"
        }}>
          <strong>✅ Success!</strong> {success}
        </div>
      )}

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        {/* Main Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "3rem",
          marginBottom: "2rem"
        }}>
          {/* Left Column */}
          <div>
            {/* Surname */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: colors.textMuted,
                marginBottom: "0.4rem",
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                SURNAME <span style={{ color: colors.danger }}>*</span>
              </label>
              <input
                type="text"
                name="surName"
                value={formData.surName}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.9rem 1rem",
                  border: `1px solid ${fieldErrors.surName ? colors.danger : colors.border}`,
                  borderRadius: "6px",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box",
                  backgroundColor: colors.white
                }}
              />
              {renderFieldError("surName")}
            </div>

            {/* Other Names */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: colors.textMuted,
                marginBottom: "0.4rem",
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                OTHER NAMES <span style={{ color: colors.danger }}>*</span>
              </label>
              <input
                type="text"
                name="otherName"
                value={formData.otherName}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.9rem 1rem",
                  border: `1px solid ${fieldErrors.otherName ? colors.danger : colors.border}`,
                  borderRadius: "6px",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
              {renderFieldError("otherName")}
            </div>

            {/* Contact Address */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: colors.textMuted,
                marginBottom: "0.4rem",
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                CONTACT ADDRESS
              </label>
              <textarea
                name="contactAddress"
                value={formData.contactAddress}
                onChange={handleChange}
                rows="2"
                style={{
                  width: "100%",
                  padding: "0.9rem 1rem",
                  border: `1px solid ${colors.border}`,
                  borderRadius: "6px",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box",
                  resize: "vertical",
                  minHeight: "70px"
                }}
              />
            </div>

            {/* Office Address */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: colors.textMuted,
                marginBottom: "0.4rem",
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                OFFICE ADDRESS
              </label>
              <textarea
                name="officeAddress"
                value={formData.officeAddress}
                onChange={handleChange}
                rows="2"
                style={{
                  width: "100%",
                  padding: "0.9rem 1rem",
                  border: `1px solid ${colors.border}`,
                  borderRadius: "6px",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box",
                  resize: "vertical",
                  minHeight: "70px"
                }}
              />
            </div>

            {/* Gender */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: colors.textMuted,
                marginBottom: "0.4rem",
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                GENDER <span style={{ color: colors.danger }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "0.9rem 3rem 0.9rem 1rem",
                    border: `1px solid ${fieldErrors.gender ? colors.danger : colors.border}`,
                    borderRadius: "6px",
                    fontSize: "1rem",
                    fontFamily: "inherit",
                    outline: "none",
                    boxSizing: "border-box",
                    appearance: "none",
                    backgroundColor: colors.white,
                    cursor: "pointer",
                    color: formData.gender ? colors.text : colors.textMuted
                  }}
                >
                  <option value="">Select</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
                <svg 
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: colors.textMuted,
                    pointerEvents: "none"
                  }}
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
              {renderFieldError("gender")}
            </div>

            {/* Mode of Transport */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: colors.textMuted,
                marginBottom: "0.4rem",
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                MODE OF TRANSPORT <span style={{ color: colors.danger }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <select
                  name="modeOfTransport"
                  value={formData.modeOfTransport}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "0.9rem 3rem 0.9rem 1rem",
                    border: `1px solid ${fieldErrors.modeOfTransport ? colors.danger : colors.border}`,
                    borderRadius: "6px",
                    fontSize: "1rem",
                    fontFamily: "inherit",
                    outline: "none",
                    boxSizing: "border-box",
                    appearance: "none",
                    backgroundColor: colors.white,
                    cursor: "pointer",
                    color: formData.modeOfTransport ? colors.text : colors.textMuted
                  }}
                >
                  <option value="">Select</option>
                  <option value="BICYCLE">Bicycle</option>
                  <option value="MOTORCYCLE">Motorcycle</option>
                  <option value="CAR">Car</option>
                  <option value="TRICYCLE">Tricycle</option>
                  <option value="TRUCK">Truck</option>
                  <option value="VAN">Van</option>
                </select>
                <svg
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: colors.textMuted,
                    pointerEvents: "none"
                  }}
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
              {renderFieldError("modeOfTransport")}
            </div>

            {/* DOB */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: colors.textMuted,
                marginBottom: "0.4rem",
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                DOB <span style={{ color: colors.danger }}>*</span>
              </label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.9rem 1rem",
                  border: `1px solid ${fieldErrors.dob ? colors.danger : colors.border}`,
                  borderRadius: "6px",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
              {renderFieldError("dob")}
            </div>

            {/* Email */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: colors.textMuted,
                marginBottom: "0.4rem",
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                E-MAIL <span style={{ color: colors.danger }}>*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.9rem 1rem",
                  border: `1px solid ${fieldErrors.email ? colors.danger : colors.border}`,
                  borderRadius: "6px",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
              {renderFieldError("email")}
            </div>

            {/* Telephone */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: colors.textMuted,
                marginBottom: "0.4rem",
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                TELEPHONE NO <span style={{ color: colors.danger }}>*</span>
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.9rem 1rem",
                  border: `1px solid ${fieldErrors.phoneNumber ? colors.danger : colors.border}`,
                  borderRadius: "6px",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
              {renderFieldError("phoneNumber")}
            </div>
          </div>

          {/* Right Column */}
          <div>
            {/* Nationality */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: colors.textMuted,
                marginBottom: "0.4rem",
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                NATIONALITY
              </label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.9rem 1rem",
                  border: `1px solid ${colors.border}`,
                  borderRadius: "6px",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>

            {/* NIN */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: colors.textMuted,
                marginBottom: "0.4rem",
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                NIN
              </label>
              <input
                type="text"
                name="nin"
                value={formData.nin}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.9rem 1rem",
                  border: `1px solid ${fieldErrors.nin ? colors.danger : colors.border}`,
                  borderRadius: "6px",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
              {renderFieldError("nin")}
            </div>

            {/* BVN */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: colors.textMuted,
                marginBottom: "0.4rem",
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                BVN
              </label>
              <input
                type="text"
                name="bvn"
                value={formData.bvn}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.9rem 1rem",
                  border: `1px solid ${fieldErrors.bvn ? colors.danger : colors.border}`,
                  borderRadius: "6px",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
              {renderFieldError("bvn")}
            </div>

            {/* Next of Kin */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: colors.textMuted,
                marginBottom: "0.4rem",
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                NEXT OF KIN <span style={{ color: colors.danger }}>*</span>
              </label>
              <input
                type="text"
                name="nextOfKin"
                value={formData.nextOfKin}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.9rem 1rem",
                  border: `1px solid ${fieldErrors.nextOfKin ? colors.danger : colors.border}`,
                  borderRadius: "6px",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
              {renderFieldError("nextOfKin")}
            </div>

            {/* Next of Kin Address */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: colors.textMuted,
                marginBottom: "0.4rem",
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                NEXT OF KIN ADDRESS <span style={{ color: colors.danger }}>*</span>
              </label>
              <textarea
                name="nextOfKinAddress"
                value={formData.nextOfKinAddress}
                onChange={handleChange}
                rows="2"
                style={{
                  width: "100%",
                  padding: "0.9rem 1rem",
                  border: `1px solid ${fieldErrors.nextOfKinAddress ? colors.danger : colors.border}`,
                  borderRadius: "6px",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box",
                  resize: "vertical",
                  minHeight: "70px"
                }}
              />
              {renderFieldError("nextOfKinAddress")}
            </div>

            {/* Upload Passport */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: colors.textMuted,
                marginBottom: "0.4rem",
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                UPLOAD PASSPORT {!isEditMode && <span style={{ color: colors.danger }}>*</span>}
              </label>
              <div
                onClick={() => document.getElementById('passport').click()}
                style={{
                  width: "100%",
                  padding: "1.5rem",
                  border: `2px dashed ${fieldErrors.passport ? colors.danger : colors.border}`,
                  borderRadius: "6px",
                  textAlign: "center",
                  cursor: "pointer",
                  backgroundColor: colors.bgLight,
                  boxSizing: "border-box"
                }}
              >
                <input
                  type="file"
                  id="passport"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'passport')}
                  style={{ display: "none" }}
                />
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke={colors.primary} 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                {files.passport ? (
                  <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", color: colors.success }}>
                    ✓ {files.passport.name}
                  </p>
                ) : existingFiles.passport ? (
                  <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", color: colors.textMuted }}>
                    On record - click to replace
                  </p>
                ) : (
                  <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", color: colors.textMuted }}>
                    Click to select passport image
                  </p>
                )}
              </div>
              {renderFieldError("passport")}
            </div>

            {/* Upload Licence */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: colors.textMuted,
                marginBottom: "0.4rem",
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                UPLOAD LICENCES {!isEditMode && <span style={{ color: colors.danger }}>*</span>}
              </label>
              <div
                onClick={() => document.getElementById('licences').click()}
                style={{
                  width: "100%",
                  padding: "1.5rem",
                  border: `2px dashed ${fieldErrors.licences ? colors.danger : colors.border}`,
                  borderRadius: "6px",
                  textAlign: "center",
                  cursor: "pointer",
                  backgroundColor: colors.bgLight,
                  boxSizing: "border-box"
                }}
              >
                <input
                  type="file"
                  id="licences"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(e, 'licences')}
                  style={{ display: "none" }}
                />
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke={colors.primary} 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                {files.licences ? (
                  <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", color: colors.success }}>
                    ✓ {files.licences.name}
                  </p>
                ) : existingFiles.licences ? (
                  <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", color: colors.textMuted }}>
                    On record - click to replace
                  </p>
                ) : (
                  <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", color: colors.textMuted }}>
                    Click to select licence file
                  </p>
                )}
              </div>
              {renderFieldError("licences")}
            </div>

            {/* Scan Signature */}
            <div style={{ marginBottom: "1.2rem" }}>
              <label style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: colors.textMuted,
                marginBottom: "0.4rem",
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                SCAN IN SIGNATURE {!isEditMode && <span style={{ color: colors.danger }}>*</span>}
              </label>
              <div
                onClick={() => document.getElementById('signature').click()}
                style={{
                  width: "100%",
                  padding: "1.5rem",
                  border: `2px dashed ${fieldErrors.signature ? colors.danger : colors.border}`,
                  borderRadius: "6px",
                  textAlign: "center",
                  cursor: "pointer",
                  backgroundColor: colors.bgLight,
                  boxSizing: "border-box"
                }}
              >
                <input
                  type="file"
                  id="signature"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'signature')}
                  style={{ display: "none" }}
                />
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke={colors.primary} 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                {files.signature ? (
                  <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", color: colors.success }}>
                    ✓ {files.signature.name}
                  </p>
                ) : existingFiles.signature ? (
                  <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", color: colors.textMuted }}>
                    On record - click to replace
                  </p>
                ) : (
                  <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", color: colors.textMuted }}>
                    Click to select signature image
                  </p>
                )}
              </div>
              {renderFieldError("signature")}
            </div>
          </div>
        </div>

        {/* Register Button */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.9rem 4rem",
              fontSize: "0.9rem",
              fontWeight: 600,
              textTransform: "uppercase",
              backgroundColor: colors.primary,
              color: colors.white,
              border: "none",
              borderRadius: "6px",
              cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: "0.5px",
              opacity: loading ? 0.6 : 1,
              transition: "background-color 0.2s",
              minWidth: "180px"
            }}
            onMouseEnter={(e) => {
              if (!loading) e.target.style.backgroundColor = colors.primaryHover;
            }}
            onMouseLeave={(e) => {
              if (!loading) e.target.style.backgroundColor = colors.primary;
            }}
          >
            {loading
              ? (isEditMode ? "SAVING..." : "REGISTERING...")
              : (isEditMode ? "SAVE CHANGES" : "REGISTER")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RiderInfo;

