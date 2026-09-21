import React, { useEffect, useMemo, useState } from "react";
import "./EditWalkInCustomerInfo.css";
import BranchBadge from "../../../shared/BranchBadge";
import { apiRequest, apiRequestMultipart } from "../../../../lib/config";
import pmLogo from "../../../../assets/images/PMlogo.png";

const EditWalkInCustomerInfo = ({ customerId, customerData, onClose, onUpdateSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [passportFile, setPassportFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [passportPreview, setPassportPreview] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [originalPassportUrl, setOriginalPassportUrl] = useState(null);
  const [originalSignatureUrl, setOriginalSignatureUrl] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [allCustomers, setAllCustomers] = useState([]);
  const [searchKey, setSearchKey] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const [formData, setFormData] = useState({
    accountNumber: "",
    firstName: "",
    surname: "",
    email: "",
    dob: "",
    phoneNumber: "",
    occupation: "",
    nationality: "",
    nin: "",
    bvn: "",
    contactAddress: "",
    officeAddress: "",
    nextOfKin: "",
    nextOfKinAddress: "",
    gender: "",
    accountName: "",
    bankName: "",
  });

  const effectiveCustomerId = useMemo(
    () => customerId || customerData?.id || customerData?.customerId || null,
    [customerId, customerData]
  );

  const applyCustomerDataToForm = (customer = {}) => {
    const fullName = `${customer.firstName || ""} ${customer.surname || customer.lastName || ""}`.trim();
    setSearchKey(customer.accountNumber || fullName || "");

    setFormData({
      accountNumber: customer.accountNumber || "",
      firstName: customer.firstName || "",
      surname: customer.surname || customer.lastName || "",
      email: customer.email || customer.emailAddress || "",
      dob: customer.dob || customer.dateOfBirth || "",
      phoneNumber: customer.phoneNumber || customer.phone || "",
      occupation: customer.occupation || "",
      nationality: customer.nationality || "",
      nin: customer.nin || "",
      bvn: customer.bvn || "",
      contactAddress: customer.contactAddress || customer.address || "",
      officeAddress: customer.officeAddress || "",
      nextOfKin: customer.nextOfKin || "",
      nextOfKinAddress: customer.nextOfKinAddress || "",
      gender: (customer.gender || "").toString().toLowerCase(),
      accountName: customer.accountName || "",
      bankName: customer.bankName || customer.bank || "",
    });

    setOriginalPassportUrl(customer.passport || customer.passportUrl || null);
    setOriginalSignatureUrl(customer.signature || customer.signatureUrl || null);
    setSelectedCustomerId(customer.id || customer.customerId || customer.accountNumber || null);
  };

  const fetchCustomerData = async () => {
    try {
      setFetching(true);
      setError("");

      const response = await apiRequest("/admin/customers/walk-in/report?page=0&size=200", "GET");

      let customersList = [];
      if (response?.response?.content && Array.isArray(response.response.content)) {
        customersList = response.response.content;
      } else if (response?.content && Array.isArray(response.content)) {
        customersList = response.content;
      } else if (response?.data && Array.isArray(response.data)) {
        customersList = response.data;
      } else if (Array.isArray(response)) {
        customersList = response;
      }
      setAllCustomers(customersList);

      if (!effectiveCustomerId) {
        setFetching(false);
        return;
      }

      const foundCustomer = customersList.find(
        (cust) =>
          String(cust.id) === String(effectiveCustomerId) ||
          String(cust.customerId) === String(effectiveCustomerId) ||
          String(cust.accountNumber) === String(effectiveCustomerId)
      );

      if (!foundCustomer) {
        setError("Customer data not found. Please try again.");
        return;
      }

      applyCustomerDataToForm(foundCustomer);
    } catch (err) {
      setError(err?.message || "Failed to load customer data. Please try again.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (customerData) {
      applyCustomerDataToForm(customerData);
      setFetching(false);
      return;
    }

    fetchCustomerData();
  }, [effectiveCustomerId, customerData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearchCustomer = (value) => {
    setSearchKey(value);
    const query = String(value || "").trim().toLowerCase();
    if (!query) return;

    const matches = allCustomers.filter((cust) => {
      const fullName = `${cust.firstName || ""} ${cust.surname || cust.lastName || ""}`.trim().toLowerCase();
      const accNo = String(cust.accountNumber || "").toLowerCase();
      return fullName.includes(query) || accNo.includes(query);
    });

    const exactMatch =
      matches.find(
        (cust) =>
          String(cust.accountNumber || "").toLowerCase() === query ||
          `${cust.firstName || ""} ${cust.surname || cust.lastName || ""}`.trim().toLowerCase() === query
      ) || (matches.length === 1 ? matches[0] : null);

    if (exactMatch) {
      applyCustomerDataToForm(exactMatch);
      setError("");
    }
  };

  const readPreview = (file, setFile, setPreview) => {
    if (!file) return;
    setFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedCustomerId) {
      setError("Please search and select customer by account number or name.");
      return;
    }

    const requiredFields = ["accountNumber", "firstName", "surname", "email", "phoneNumber", "dob"];
    const missing = requiredFields.filter((field) => !String(formData[field] || "").trim());
    if (missing.length > 0) {
      setError(`Please fill required fields: ${missing.join(", ")}`);
      return;
    }

    try {
      setLoading(true);
      const body = new FormData();

      Object.entries({
        accountNumber: formData.accountNumber,
        firstName: formData.firstName,
        surname: formData.surname,
        email: formData.email,
        dob: formData.dob,
        phoneNumber: formData.phoneNumber,
        occupation: formData.occupation,
        nationality: formData.nationality,
        nin: formData.nin,
        bvn: formData.bvn,
        contactAddress: formData.contactAddress,
        officeAddress: formData.officeAddress,
        nextOfKin: formData.nextOfKin,
        nextOfKinAddress: formData.nextOfKinAddress,
        gender: formData.gender ? formData.gender.toUpperCase() : "",
        accountName: formData.accountName,
        bankName: formData.bankName,
      }).forEach(([key, value]) => body.append(key, value || ""));

      if (passportFile instanceof File) body.append("passport", passportFile);
      if (signatureFile instanceof File) body.append("signature", signatureFile);

      await apiRequestMultipart(`/admin/update-walk-in-customer/${selectedCustomerId}`, "PUT", body);
      setShowSuccessModal(true);
    } catch (err) {
      setError(err?.message || "Failed to update customer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const closeSuccess = () => {
    setShowSuccessModal(false);
    onUpdateSuccess?.();
    onClose?.();
  };

  if (fetching) {
    return (
      <div className="edit-customer-modal-container">
        <div className="edit-loading-state">
          <div className="edit-loading-spinner"></div>
          Loading walk-in customer information...
        </div>
      </div>
    );
  }

  return (
    <div className="edit-customer-modal-container">
      {showSuccessModal && (
        <div className="success-modal-overlay">
          <div className="success-modal blue-theme">
            <div className="success-modal-content">
              <h2 className="text-primary">SUCCESSFULLY UPDATED</h2>
              <p className="success-message">Walk-in customer has been updated successfully.</p>
              <button onClick={closeSuccess} className="text-white btn btn-primary">
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="edit-modal-header">
        <div className="edit-brand-header">
          <div className="edit-brand-left">
            <img src={pmLogo} alt="PM Logo" className="edit-brand-logo" />
            <div className="edit-brand-text">
              <p className="edit-brand-name">PM MARKET HUB</p>
              <h1 className="edit-title">EDIT CUSTOMER INFO MODAL FORM</h1>
              <div style={{ display: "flex", justifyContent: "center", margin: "0.4rem 0" }}>
                <BranchBadge />
              </div>
            </div>
          </div>
          <button onClick={onClose} className="edit-close-btn">×</button>
        </div>
      </div>

      <div className="edit-scrollable-content">
        {error && (
          <div className="edit-error-message" style={{ backgroundColor: "#f8d7da", color: "#721c24" }}>
            {error}
          </div>
        )}

        <div className="edit-form-wrapper">
          <form onSubmit={handleSubmit} className="edit-form-container">
            <section className="edit-section">
              <h3 className="edit-section-title">Customer Lookup</h3>
              <div className="edit-form-row edit-full-width">
                <div className="edit-form-group">
                  <label className="edit-form-label">SEARCH BY ACCOUNT NO OR NAME</label>
                  <input
                    className="edit-form-input"
                    list="walkin-edit-customer-options"
                    value={searchKey}
                    onChange={(e) => handleSearchCustomer(e.target.value)}
                    placeholder="Type account number or customer name"
                  />
                  <datalist id="walkin-edit-customer-options">
                    {allCustomers.map((cust, index) => {
                      const fullName = `${cust.firstName || ""} ${cust.surname || cust.lastName || ""}`.trim();
                      const acc = cust.accountNumber || "";
                      return (
                        <option key={`${cust.id || cust.customerId || acc || index}-acc`} value={acc}>
                          {fullName}
                        </option>
                      );
                    })}
                    {allCustomers.map((cust, index) => {
                      const fullName = `${cust.firstName || ""} ${cust.surname || cust.lastName || ""}`.trim();
                      const acc = cust.accountNumber || "";
                      return (
                        <option key={`${cust.id || cust.customerId || fullName || index}-name`} value={fullName}>
                          {acc}
                        </option>
                      );
                    })}
                  </datalist>
                  <small className="edit-helper-text">
                    Selected Account No: {formData.accountNumber || "-"}
                  </small>
                </div>
              </div>
            </section>

            <section className="edit-section">
              <h3 className="edit-section-title">Personal Details</h3>
              <div className="edit-form-row edit-three-col">
                <div className="edit-form-group">
                  <label className="edit-form-label">FIRST NAME *</label>
                  <input name="firstName" className="edit-form-input" value={formData.firstName} onChange={handleChange} required />
                </div>
                <div className="edit-form-group">
                  <label className="edit-form-label">SURNAME *</label>
                  <input name="surname" className="edit-form-input" value={formData.surname} onChange={handleChange} required />
                </div>
                <div className="edit-form-group">
                  <label className="edit-form-label">EMAIL *</label>
                  <input type="email" name="email" className="edit-form-input" value={formData.email} onChange={handleChange} required />
                </div>
              </div>

              <div className="edit-form-row edit-three-col">
                <div className="edit-form-group">
                  <label className="edit-form-label">DOB *</label>
                  <input type="date" name="dob" className="edit-form-input" value={formData.dob} onChange={handleChange} required />
                </div>
                <div className="edit-form-group">
                  <label className="edit-form-label">GENDER</label>
                  <select name="gender" className="edit-form-select" value={formData.gender} onChange={handleChange}>
                    <option value="">CHOOSE</option>
                    <option value="male">MALE</option>
                    <option value="female">FEMALE</option>
                  </select>
                </div>
                <div className="edit-form-group">
                  <label className="edit-form-label">PHONE NUMBER *</label>
                  <input name="phoneNumber" className="edit-form-input" value={formData.phoneNumber} onChange={handleChange} required />
                </div>
              </div>
            </section>

            <section className="edit-section">
              <h3 className="edit-section-title">Address & Media</h3>
              <div className="edit-form-row edit-three-col">
                <div className="edit-form-group">
                  <label className="edit-form-label">CONTACT ADDRESS</label>
                  <input name="contactAddress" className="edit-form-input" value={formData.contactAddress} onChange={handleChange} />
                </div>
                <div className="edit-form-group">
                  <label className="edit-form-label">OFFICE ADDRESS</label>
                  <input name="officeAddress" className="edit-form-input" value={formData.officeAddress} onChange={handleChange} />
                </div>
                <div className="edit-form-group">
                  <label className="edit-form-label">NATIONALITY</label>
                  <input name="nationality" className="edit-form-input" value={formData.nationality} onChange={handleChange} />
                </div>
              </div>

              <div className="edit-form-row edit-two-col">
                <div className="edit-form-group">
                  <label className="edit-form-label">PASSPORT</label>
                  <input type="file" accept="image/*" className="edit-form-input" onChange={(e) => readPreview(e.target.files?.[0], setPassportFile, setPassportPreview)} />
                  {(passportPreview || originalPassportUrl) && <img className="preview-image" src={passportPreview || originalPassportUrl} alt="passport" />}
                </div>
                <div className="edit-form-group">
                  <label className="edit-form-label">SIGNATURE</label>
                  <input type="file" accept="image/*" className="edit-form-input" onChange={(e) => readPreview(e.target.files?.[0], setSignatureFile, setSignaturePreview)} />
                  {(signaturePreview || originalSignatureUrl) && <img className="preview-image" src={signaturePreview || originalSignatureUrl} alt="signature" />}
                </div>
              </div>
            </section>

            <section className="edit-section">
              <h3 className="edit-section-title">Identity & Next Of Kin</h3>
              <div className="edit-form-row edit-three-col">
                <div className="edit-form-group">
                  <label className="edit-form-label">OCCUPATION</label>
                  <input name="occupation" className="edit-form-input" value={formData.occupation} onChange={handleChange} />
                </div>
                <div className="edit-form-group">
                  <label className="edit-form-label">NIN</label>
                  <input name="nin" className="edit-form-input" value={formData.nin} onChange={handleChange} />
                </div>
                <div className="edit-form-group">
                  <label className="edit-form-label">BVN</label>
                  <input name="bvn" className="edit-form-input" value={formData.bvn} onChange={handleChange} />
                </div>
              </div>

              <div className="edit-form-row edit-two-col">
                <div className="edit-form-group">
                  <label className="edit-form-label">NEXT OF KIN</label>
                  <input name="nextOfKin" className="edit-form-input" value={formData.nextOfKin} onChange={handleChange} />
                </div>
                <div className="edit-form-group">
                  <label className="edit-form-label">NEXT OF KIN ADDRESS</label>
                  <input name="nextOfKinAddress" className="edit-form-input" value={formData.nextOfKinAddress} onChange={handleChange} />
                </div>
              </div>
            </section>

            <section className="edit-section">
              <h3 className="edit-section-title">Bank Details</h3>
              <div className="edit-form-row edit-two-col">
                <div className="edit-form-group">
                  <label className="edit-form-label">ACCOUNT NAME</label>
                  <input name="accountName" className="edit-form-input" value={formData.accountName} onChange={handleChange} />
                </div>
                <div className="edit-form-group">
                  <label className="edit-form-label">BANK NAME</label>
                  <input name="bankName" className="edit-form-input" value={formData.bankName} onChange={handleChange} />
                </div>
              </div>
            </section>

            <div className="edit-form-actions">
              <button type="submit" className="edit-register-btn" disabled={loading}>
                {loading ? "UPDATING..." : "UPDATE CUSTOMER DATA"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditWalkInCustomerInfo;
