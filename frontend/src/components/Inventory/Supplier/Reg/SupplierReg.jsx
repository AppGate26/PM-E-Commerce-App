import React, { useState } from "react";
import "./SupplierReg.css";
import ".//SupplierRegQuery.css";
import ModalSuccessReg from "./ModalSuccessReg";
import BranchBadge from "../../../shared/BranchBadge";
import { Link } from "react-router-dom";
import { APPROVAL_TYPES, createApprovalRequest } from "../../../../lib/adminApi";
import { useAuth } from "../../../../context/AuthContext";

const SupplierReg = ({ toggleGoods }) => {
  const { user } = useAuth();

  //CANCEL MODAL
  const closeModal = () => {
    toggleGoods();
  };
  const [modalSuccessReg, setModalSuccessReg] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passportFile, setPassportFile] = useState(null);

  const [formData, setFormData] = useState({
    supplierId: "", // This will remain empty as backend handles it
    taxIdNumber: "",
    companyName: "",
    paymentTerms: "",
    contactPersonName: "",
    deliveryTerms: "",
    contactEmail: "",
    customerPassport: "",
    contactPhoneNumber: "",
    address: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPassportFile(file);
      console.log("SupplierReg: Passport file selected:", file.name, file.size, "bytes");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validate required fields (EXCLUDED supplierId from validation)
    const requiredFields = {
      taxIdNumber: formData.taxIdNumber,
      companyName: formData.companyName,
      paymentTerms: formData.paymentTerms,
      contactPersonName: formData.contactPersonName,
      deliveryTerms: formData.deliveryTerms,
      contactEmail: formData.contactEmail,
      contactPhoneNumber: formData.contactPhoneNumber,
      address: formData.address,
    };
    
    const unfilledFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value || value.trim() === "")
      .map(([key]) => key);

    if (unfilledFields.length > 0) {
      const unfilledFieldsString = unfilledFields.join(", ");
      setError(`Please fill out the following fields: ${unfilledFieldsString}`);
      return;
    }

    try {
      setLoading(true);
      
      const supplierRequest = {
        companyName: formData.companyName.trim(),
        customerName: formData.companyName.trim(),
        contactPersonName: formData.contactPersonName.trim(),
        contactName: formData.contactPersonName.trim(),
        contactPhoneNumber: formData.contactPhoneNumber.trim(),
        contactPhoneNo: formData.contactPhoneNumber.trim(),
        taxIdNumber: formData.taxIdNumber.trim(),
        taxId: formData.taxIdNumber.trim(),
        contactEmail: formData.contactEmail.trim(),
        address: formData.address.trim(),
        paymentTerms: formData.paymentTerms.trim(),
        deliveryTerms: formData.deliveryTerms.trim(),
        customerPassport: formData.customerPassport.trim(),
        passportImageName: passportFile?.name || "",
        submittedAt: new Date().toISOString(),
      };

      await createApprovalRequest({
        approvalType: APPROVAL_TYPES.supplierRegistration,
        requestedBy: user?.id || user?.userId || 0,
        requestData: supplierRequest,
        comments: "Supplier registration submitted for admin approval.",
      });
      
      // Reset form
      setFormData({
        supplierId: "",
        taxIdNumber: "",
        companyName: "",
        paymentTerms: "",
        contactPersonName: "",
        deliveryTerms: "",
        contactEmail: "",
        customerPassport: "",
        contactPhoneNumber: "",
        address: "",
      });
      setPassportFile(null);
      const fileInput = document.querySelector(".reg-file-upload");
      if (fileInput) fileInput.value = "";

      window.dispatchEvent(new CustomEvent("approval-request-created"));
      setModalSuccessReg(true);
    } catch (err) {
      setError(err?.message || "Failed to register supplier. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!modalSuccessReg && (
        <div className="supplier-bg bg-reg-container">
          <button
            className="btn btn-primary fw-bold"
            style={{ position: "absolute", top: "3em" }}
          >
            <Link to="/adminDashboard" className="text-white">
              Dashboard
            </Link>
          </button>
          <h1 className="supplier-reg-h1">supplier registration</h1>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <BranchBadge />
          </div>
          <span
            className=" adjust-cancel-btn"
            id="reg-supplier-cancel"
            onClick={closeModal}
          >
            X
          </span>
          <div className="container ">
            <div className="md-row grid-supplier-reg grid-supplier-reg_supplier">
              <div className="grid-supplier-reg_supplier-col-1">
                <div className="col-sm-6 col-md-12 reg-form">
                  <label>supplier's id</label>
                  <div>
                    <input
                      type="text"
                      name="supplierId"
                      className="reg-inputs"
                      placeholder="Auto-generated by system"
                      readOnly // Makes it non-clickable/non-editable
                      style={{ backgroundColor: "#e9ecef", cursor: "not-allowed" }} // Optional visual hint
                      value={formData.supplierId}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="col-sm-6 col-md-12 reg-form">
                  <label>company name </label>
                  <div>
                    <input
                      type="text"
                      name="companyName"
                      className="reg-inputs"
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="col-sm-6 col-md-12 reg-form">
                  <label>contact person name </label>
                  <div>
                    <input
                      type="text"
                      name="contactPersonName"
                      className="reg-inputs"
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="col-sm-6 col-md-12 reg-form">
                  <label>contact email</label>
                  <div>
                    <input
                      type="email"
                      name="contactEmail"
                      className="reg-inputs"
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="col-sm-6 col-md-12 reg-form">
                  <label>contact phone number</label>
                  <div>
                    <input
                      type="number"
                      name="contactPhoneNumber"
                      className="reg-inputs"
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="col-sm-6 col-md-12 reg-form">
                  <label id="ls-label-my">
                    address (street, city, state, postal code)
                  </label>
                  <div>
                    <input
                      type="text"
                      name="address"
                      className="reg-inputs"
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="grid-supplier-reg_supplier-col-2">
                <div className="col-sm-6 col-md-12 c reg-form form-end ">
                  <label>tax id number</label>
                  <form action="">
                    <input
                      type="text"
                      name="taxIdNumber"
                      className="reg-inputs"
                      onChange={handleChange}
                    />
                  </form>
                </div>
                <div className="col-sm-6 col-md-12 reg-form form-end">
                  <label>payment terms</label>
                  <div>
                    <input
                      type="text"
                      name="paymentTerms"
                      className="reg-inputs"
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="col-sm-6 col-md-12 reg-form form-end">
                  <label>delivery terms</label>
                  <div>
                    <input
                      type="text"
                      name="deliveryTerms"
                      className="reg-inputs"
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="col-sm-6 col-md-12 reg-form form-end">
                  <label>customer's passport photography</label>
                  <div>
                    <input
                      type="text"
                      name="customerPassport"
                      className="reg-inputs"
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="col-sm-6 col-md-12 reg-form form-end">
                  <label>upload passport photography</label>
                  <div id="reg-uploader">
                    <form action="">
                      <input 
                        type="file" 
                        className="reg-file-upload" 
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      <div className="">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          className="bi bi-upload icon-reg-uploader"
                          viewBox="0 0 16 16"
                        >
                          <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5" />
                          <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708z" />
                        </svg>
                      </div>
                    </form>
                    {passportFile && (
                      <small className="text-success d-block mt-1">
                        Selected: {passportFile.name}
                      </small>
                    )}
                  </div>
                </div>

                <div className="text-end">
                  {error && (
                    <div className="alert alert-danger mb-3" role="alert">
                      {error}
                    </div>
                  )}
                  <form action="" onSubmit={handleSubmit}>
                    <input 
                      type="submit" 
                      value={loading ? "SAVING..." : "SAVE"} 
                      id="save-reg-btn"
                      disabled={loading}
                    />
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <ModalSuccessReg
        isOpen={modalSuccessReg}
        toggleModalSuccessReg={() => setModalSuccessReg(false)}
        setModalSuccess={setModalSuccessReg}
      />
    </>
  );
};

export default SupplierReg;
