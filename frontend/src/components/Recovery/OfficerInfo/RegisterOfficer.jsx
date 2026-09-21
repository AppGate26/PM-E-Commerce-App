import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BranchBadge from "../../shared/BranchBadge";
import "../../../Styles/Recovery/Recovery.css";
import { apiRequestMultipart } from "../../../lib/config";

const initialFormData = {
  firstName: "",
  lastName: "",
  contactAddress: "",
  officeAddress: "",
  gender: "",
  dob: "",
  email: "",
  phoneNumber: "",
  password: "",
  nationality: "",
  nin: "",
  bvn: "",
  nextOfKin: "",
  nextOfKinAddress: "",
  passportFile: null,
  licencesFile: null,
  signatureFile: null,
};

const RegisterOfficer = ({ toggleInfoModal }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [passportPreview, setPassportPreview] = useState("");
  const [signaturePreview, setSignaturePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    return () => {
      if (passportPreview) URL.revokeObjectURL(passportPreview);
      if (signaturePreview) URL.revokeObjectURL(signaturePreview);
    };
  }, [passportPreview, signaturePreview]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (field, event) => {
    const file = event.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, [field]: file }));

    if (field === "passportFile") {
      if (passportPreview) URL.revokeObjectURL(passportPreview);
      setPassportPreview(file ? URL.createObjectURL(file) : "");
    }

    if (field === "signatureFile") {
      if (signaturePreview) URL.revokeObjectURL(signaturePreview);
      setSignaturePreview(file ? URL.createObjectURL(file) : "");
    }
  };

  const requiredFields = {
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    phoneNumber: "Phone Number",
    password: "Password",
    contactAddress: "Contact Address",
    officeAddress: "Office Address",
    dob: "Date of Birth",
    gender: "Gender",
    nationality: "Nationality",
    nin: "NIN",
    bvn: "BVN",
    nextOfKin: "Next of Kin",
    nextOfKinAddress: "Next of Kin Address",
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const missing = Object.entries(requiredFields)
      .filter(([key]) => !String(formData[key] || "").trim())
      .map(([, label]) => label);

    if (missing.length > 0) {
      setError(`Please fill in all required fields: ${missing.join(", ")}`);
      setLoading(false);
      return;
    }

    try {
      const payload = new FormData();
      payload.append("firstName", formData.firstName.trim());
      payload.append("lastName", formData.lastName.trim());
      payload.append("contactAddress", formData.contactAddress.trim());
      payload.append("officeAddress", formData.officeAddress.trim());
      payload.append("gender", formData.gender.toUpperCase());
      payload.append("dob", formData.dob);
      payload.append("email", formData.email.trim());
      payload.append("phoneNumber", formData.phoneNumber.trim());
      payload.append("password", formData.password);
      payload.append("nationality", formData.nationality.trim());
      payload.append("nin", formData.nin.trim());
      payload.append("bvn", formData.bvn.trim());
      payload.append("nextOfKin", formData.nextOfKin.trim());
      payload.append("nextOfKinAddress", formData.nextOfKinAddress.trim());

      if (formData.passportFile) payload.append("passport", formData.passportFile);
      if (formData.licencesFile) payload.append("licences", formData.licencesFile);
      if (formData.signatureFile) payload.append("signature", formData.signatureFile);

      await apiRequestMultipart("/admin/create-recovery-agent", "POST", payload);

      setSuccess(true);
      setFormData(initialFormData);
      if (passportPreview) URL.revokeObjectURL(passportPreview);
      if (signaturePreview) URL.revokeObjectURL(signaturePreview);
      setPassportPreview("");
      setSignaturePreview("");

      setTimeout(() => {
        setSuccess(false);
        toggleInfoModal();
      }, 1800);
    } catch (err) {
      setError(err?.message || "Failed to register recovery officer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recovery-officer-shell">
      <div className="recovery-officer-topbar">
        <Link to="/adminDashboard" className="recovery-officer-dashboard-btn">
          Dashboard
        </Link>
        <button type="button" className="recovery-officer-close" onClick={toggleInfoModal}>
          X
        </button>
      </div>

      <header className="recovery-officer-header">
        <h1>Recovery Officer Form</h1>
        <div style={{ display: "flex", justifyContent: "center", margin: "0.4rem 0" }}>
          <BranchBadge />
        </div>
        <p>Mobile-ready registration form for recovery officers</p>
      </header>

      {error && <div className="recovery-officer-alert recovery-officer-alert-error">{error}</div>}
      {success && <div className="recovery-officer-alert recovery-officer-alert-success">Recovery officer registered successfully.</div>}

      <form onSubmit={handleSubmit} className="recovery-officer-form">
        <section className="recovery-officer-card">
          <h2>Personal Details</h2>
          <div className="recovery-officer-grid">
            <label>
              <span>First Name</span>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
            </label>
            <label>
              <span>Last Name</span>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
            </label>
            <label>
              <span>Gender</span>
              <select name="gender" value={formData.gender} onChange={handleInputChange} required>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>
            <label>
              <span>Date of Birth</span>
              <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} required />
            </label>
            <label>
              <span>Nationality</span>
              <input type="text" name="nationality" value={formData.nationality} onChange={handleInputChange} required />
            </label>
            <label>
              <span>NIN</span>
              <input type="text" name="nin" value={formData.nin} onChange={handleInputChange} required />
            </label>
            <label>
              <span>BVN</span>
              <input type="text" name="bvn" value={formData.bvn} onChange={handleInputChange} required />
            </label>
          </div>
        </section>

        <section className="recovery-officer-card">
          <h2>Contact & Account</h2>
          <div className="recovery-officer-grid">
            <label>
              <span>Email</span>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
            </label>
            <label>
              <span>Phone Number</span>
              <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} required />
            </label>
            <label className="recovery-officer-span-2">
              <span>Password</span>
              <input type="password" name="password" value={formData.password} onChange={handleInputChange} required />
            </label>
            <label className="recovery-officer-span-2">
              <span>Contact Address</span>
              <textarea name="contactAddress" value={formData.contactAddress} onChange={handleInputChange} required />
            </label>
            <label className="recovery-officer-span-2">
              <span>Office Address</span>
              <textarea name="officeAddress" value={formData.officeAddress} onChange={handleInputChange} required />
            </label>
          </div>
        </section>

        <section className="recovery-officer-card">
          <h2>Next of Kin</h2>
          <div className="recovery-officer-grid">
            <label>
              <span>Next of Kin</span>
              <input type="text" name="nextOfKin" value={formData.nextOfKin} onChange={handleInputChange} required />
            </label>
            <label className="recovery-officer-span-2">
              <span>Next of Kin Address</span>
              <textarea name="nextOfKinAddress" value={formData.nextOfKinAddress} onChange={handleInputChange} required />
            </label>
          </div>
        </section>

        <section className="recovery-officer-card">
          <h2>Uploads</h2>
          <div className="recovery-officer-upload-grid">
            <label className="recovery-officer-upload">
              <span>Passport</span>
              <input type="file" accept="image/*" onChange={(e) => handleFileChange("passportFile", e)} />
              <div className="recovery-officer-upload-preview">
                {passportPreview ? <img src={passportPreview} alt="Passport preview" /> : <span>No image</span>}
              </div>
            </label>

            <label className="recovery-officer-upload">
              <span>Licences</span>
              <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange("licencesFile", e)} />
              <div className="recovery-officer-upload-file">
                {formData.licencesFile ? formData.licencesFile.name : "No file selected"}
              </div>
            </label>

            <label className="recovery-officer-upload">
              <span>Signature</span>
              <input type="file" accept="image/*" onChange={(e) => handleFileChange("signatureFile", e)} />
              <div className="recovery-officer-upload-preview">
                {signaturePreview ? <img src={signaturePreview} alt="Signature preview" /> : <span>No image</span>}
              </div>
            </label>
          </div>
        </section>

        <div className="recovery-officer-submit-wrap">
          <button type="submit" disabled={loading} className="recovery-officer-submit-btn">
            {loading ? "Registering..." : "Register Officer"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterOfficer;
