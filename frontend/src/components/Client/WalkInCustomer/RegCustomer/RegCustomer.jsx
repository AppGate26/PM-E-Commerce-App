// import React, { useState } from "react";
// import "./RegCustomer.css";
// import { Link } from "react-router-dom";
// import { apiRequest, apiRequestMultipart } from "../../../../lib/config";

// const RegCustomer = ({ toggleRegCusModal }) => {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [passportFile, setPassportFile] = useState(null);
//   const [signatureFile, setSignatureFile] = useState(null);
//   const [passportPreview, setPassportPreview] = useState(null);
//   const [signaturePreview, setSignaturePreview] = useState(null);
//   const [showSuccessModal, setShowSuccessModal] = useState(false);
  
//   const [formData, setFormData] = useState({
//     accountNumber: "",
//     surname: "",
//     firstName: "",
//     email: "",
//     dob: "",
//     phoneNumber: "",
//     occupation: "",
//     nationality: "",
//     nin: "",
//     bvn: "",
//     contactAddress: "",
//     contactStateId: "",
//     contactLgaId: "",
//     contactWardId: "",
//     officeAddress: "",
//     officeStateId: "",
//     officeLgaId: "",
//     officeWardId: "",
//     nextOfKin: "",
//     nextOfKinAddress: "",
//     nextOfKinStateId: "",
//     nextOfKinLgaId: "",
//     nextOfKinWardId: "",
//     gender: "",
//     accountName: "",
//     bankName: "",
//   });

//   const closeModal = () => {
//     toggleRegCusModal();
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
    
//     // If the field being changed is phoneNumber, auto-generate account number
//     if (name === "phoneNumber") {
//       // Remove any non-digit characters
//       let cleanedPhone = value.replace(/\D/g, "");
      
//       // Remove leading 0 if present
//       let accountNumber = cleanedPhone;
//       if (cleanedPhone.startsWith("0")) {
//         accountNumber = cleanedPhone.substring(1);
//       }
      
//       console.log(`📱 Phone number entered: ${cleanedPhone}`);
//       console.log(`🔢 Auto-generated account number: ${accountNumber}`);
      
//       setFormData(prev => ({
//         ...prev,
//         [name]: value,
//         accountNumber: accountNumber
//       }));
//     } else {
//       setFormData(prev => ({
//         ...prev,
//         [name]: value
//       }));
//     }
//   };

//   const handlePassportChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setPassportFile(file);
//       console.log("RegCustomer: Passport file selected:", file.name, file.type, file.size);
      
//       // Create preview URL
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setPassportPreview(reader.result);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleSignatureChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setSignatureFile(file);
//       console.log("RegCustomer: Signature file selected:", file.name, file.type, file.size);
      
//       // Create preview URL
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setSignaturePreview(reader.result);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");

//     // Validate required fields
//     const requiredFields = ["accountNumber", "surname", "firstName", "email", "phoneNumber", "dob", "gender"];
//     const missingFields = requiredFields.filter(field => !formData[field] || formData[field].trim() === "");

//     if (missingFields.length > 0) {
//       setError(`Please fill required fields: ${missingFields.join(", ")}`);
//       return;
//     }

//     try {
//       setLoading(true);
//       console.log("═══════════════════════════════════════════════════════════");
//       console.log("🔵 RegCustomer: ========== REGISTERING WALK-IN CUSTOMER ==========");
//       console.log("═══════════════════════════════════════════════════════════");
//       console.log("RegCustomer: Form data:", formData);
//       console.log("RegCustomer: Account Number (auto-generated from phone):", formData.accountNumber);
//       console.log("RegCustomer: Passport file:", passportFile?.name);
//       console.log("RegCustomer: Signature file:", signatureFile?.name);
//       console.log("RegCustomer: API endpoint: /admin/add-walk-in-customer");
//       console.log("RegCustomer: Method: POST");

//       // Create FormData for multipart/form-data
//       const formDataToSend = new FormData();
      
//       // Required fields
//       formDataToSend.append("accountNumber", formData.accountNumber.trim());
//       formDataToSend.append("surname", formData.surname.trim());
//       formDataToSend.append("firstName", formData.firstName.trim());
//       formDataToSend.append("email", formData.email.trim());
//       formDataToSend.append("dob", formData.dob);
//       formDataToSend.append("phoneNumber", formData.phoneNumber.trim());
//       formDataToSend.append("gender", formData.gender.toUpperCase());
      
//       // Optional fields - always send with empty string if not provided
//       formDataToSend.append("occupation", formData.occupation?.trim() || "");
//       formDataToSend.append("nationality", formData.nationality?.trim() || "");
//       formDataToSend.append("nin", formData.nin?.trim() || "");
//       formDataToSend.append("bvn", formData.bvn?.trim() || "");
//       formDataToSend.append("contactAddress", formData.contactAddress?.trim() || "");
//       formDataToSend.append("officeAddress", formData.officeAddress?.trim() || "");
//       formDataToSend.append("nextOfKin", formData.nextOfKin?.trim() || "");
//       formDataToSend.append("nextOfKinAddress", formData.nextOfKinAddress?.trim() || "");
//       formDataToSend.append("accountName", formData.accountName?.trim() || "");
//       formDataToSend.append("bankName", formData.bankName?.trim() || "");
      
//       // Add state, LGA, ward IDs - convert to numbers or send null
//       const sendNumberOrNull = (value) => {
//         if (value && value.trim() !== "") {
//           return parseInt(value);
//         }
//         return null;
//       };
      
//       // Contact location IDs
//       if (formData.contactStateId && formData.contactStateId.trim() !== "") 
//         formDataToSend.append("contactStateId", parseInt(formData.contactStateId));
//       if (formData.contactLgaId && formData.contactLgaId.trim() !== "") 
//         formDataToSend.append("contactLgaId", parseInt(formData.contactLgaId));
//       if (formData.contactWardId && formData.contactWardId.trim() !== "") 
//         formDataToSend.append("contactWardId", parseInt(formData.contactWardId));
      
//       // Office location IDs
//       if (formData.officeStateId && formData.officeStateId.trim() !== "") 
//         formDataToSend.append("officeStateId", parseInt(formData.officeStateId));
//       if (formData.officeLgaId && formData.officeLgaId.trim() !== "") 
//         formDataToSend.append("officeLgaId", parseInt(formData.officeLgaId));
//       if (formData.officeWardId && formData.officeWardId.trim() !== "") 
//         formDataToSend.append("officeWardId", parseInt(formData.officeWardId));
      
//       // Next of kin location IDs
//       if (formData.nextOfKinStateId && formData.nextOfKinStateId.trim() !== "") 
//         formDataToSend.append("nextOfKinStateId", parseInt(formData.nextOfKinStateId));
//       if (formData.nextOfKinLgaId && formData.nextOfKinLgaId.trim() !== "") 
//         formDataToSend.append("nextOfKinLgaId", parseInt(formData.nextOfKinLgaId));
//       if (formData.nextOfKinWardId && formData.nextOfKinWardId.trim() !== "") 
//         formDataToSend.append("nextOfKinWardId", parseInt(formData.nextOfKinWardId));

//       // Add files (check if they exist and are valid files)
//       if (passportFile && passportFile instanceof File) {
//         console.log("✅ Adding passport file to FormData:", passportFile.name);
//         formDataToSend.append("passport", passportFile);
//       } else {
//         console.log("⚠️ No valid passport file to add");
//       }
      
//       if (signatureFile && signatureFile instanceof File) {
//         console.log("✅ Adding signature file to FormData:", signatureFile.name);
//         formDataToSend.append("signature", signatureFile);
//       } else {
//         console.log("⚠️ No valid signature file to add");
//       }

//       console.log("RegCustomer: FormData entries:");
//       for (const [key, value] of formDataToSend.entries()) {
//         if (value instanceof File) {
//           console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
//         } else {
//           console.log(`  ${key}: ${value} (type: ${typeof value})`);
//         }
//       }

//       console.log("RegCustomer: Making API request with multipart/form-data...");
//       const response = await apiRequestMultipart("/admin/add-walk-in-customer", "POST", formDataToSend);

//       console.log("═══════════════════════════════════════════════════════════");
//       console.log("✅ RegCustomer: WALK-IN CUSTOMER REGISTERED SUCCESSFULLY");
//       console.log("═══════════════════════════════════════════════════════════");
//       console.log("RegCustomer: API response:", response);

//       // Show success modal instead of alert
//       setShowSuccessModal(true);
      
//     } catch (err) {
//       console.error("═══════════════════════════════════════════════════════════");
//       console.error("❌ RegCustomer: ERROR REGISTERING CUSTOMER");
//       console.error("═══════════════════════════════════════════════════════════");
//       console.error("RegCustomer: Error:", err);
//       console.error("RegCustomer: Error message:", err?.message);
//       console.error("RegCustomer: Error details:", err?.details);
//       console.error("RegCustomer: Error status:", err?.status);
      
//       let userMessage = "Failed to register customer. Please try again.";
      
//       // Check for specific error messages
//       if (err?.message?.includes("user_id cannot be null") || err?.message?.includes("user_id")) {
//         userMessage = "Database error: User ID missing. Please contact support.";
//       } else if (err?.message?.includes("Content-Type") && err?.message?.includes("not supported")) {
//         userMessage = "API expects multipart/form-data format. Please contact support.";
//       } else if (err?.message?.includes("413") || err?.message?.includes("Payload Too Large")) {
//         userMessage = "File too large. Please reduce image size and try again.";
//       } else if (err?.message?.includes("400") || err?.message?.includes("Bad Request")) {
//         userMessage = "Invalid data. Please check all fields and try again.";
//       } else if (err?.message?.includes("409") || err?.message?.includes("Conflict")) {
//         userMessage = "Customer with this account number or email already exists.";
//       } else if (err?.message) {
//         userMessage = err.message;
//       }
      
//       setError(userMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const resetForm = () => {
//     setFormData({
//       accountNumber: "",
//       surname: "",
//       firstName: "",
//       email: "",
//       dob: "",
//       phoneNumber: "",
//       occupation: "",
//       nationality: "",
//       nin: "",
//       bvn: "",
//       contactAddress: "",
//       contactStateId: "",
//       contactLgaId: "",
//       contactWardId: "",
//       officeAddress: "",
//       officeStateId: "",
//       officeLgaId: "",
//       officeWardId: "",
//       nextOfKin: "",
//       nextOfKinAddress: "",
//       nextOfKinStateId: "",
//       nextOfKinLgaId: "",
//       nextOfKinWardId: "",
//       gender: "",
//       accountName: "",
//       bankName: "",
//     });
//     setPassportFile(null);
//     setSignatureFile(null);
//     setPassportPreview(null);
//     setSignaturePreview(null);
    
//     // Reset file inputs
//     const passportInput = document.getElementById('passport');
//     const signatureInput = document.getElementById('signature');
//     if (passportInput) passportInput.value = "";
//     if (signatureInput) signatureInput.value = "";
//   };

//   const handleSuccessModalClose = () => {
//     setShowSuccessModal(false);
//     resetForm();
//     closeModal();
//   };

//   return (
//     <div className="reg-customer-container">
      
//       {/* Success Modal */}
//      {showSuccessModal && (
//         <div className="success-modal-overlay">
//           <div className="success-modal blue-theme">
//             <div className="success-modal-content">
//               <div className="success-icon">
//                 <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//                   <circle cx="12" cy="12" r="10" fill="#0867db"/>
//                   <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//                 </svg>
//               </div>
//               <h2 className="success-title">SUCCESSFULLY REGISTERED</h2>
//               <p className="success-message">Walk-in customer has been registered successfully!</p>
//               <button 
//                 onClick={handleSuccessModalClose}
//                 className="success-close-btn blue-btn"
//               >
//                 CLOSE
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <div className="reg-modal-header">
//         {/* Close Button */}
//         <button onClick={closeModal} className="reg-close-btn">
//           ×
//         </button>

//         {/* Page Title */}
//         <h1 className="reg-title">WALK IN CUSTOMER FORM</h1>
//       </div>

//       {/* Scrollable Content */}
//       <div className="reg-scrollable-content">
        
//         {/* Error Message */}
//         {error && (
//           <div className="reg-error-message">
//             ⚠️ {error}
//           </div>
//         )}

//         {/* Loading State */}
//         {loading && (
//           <div className="reg-loading-overlay">
//             <div className="reg-loading-spinner"></div>
//             <p>Registering customer...</p>
//           </div>
//         )}

//         <div className="reg-form-wrapper">
//           <form onSubmit={handleSubmit} className="reg-form-container">
            
//             {/* Row 1: Account Number (Auto-generated, read-only), Surname, Other Names */}
//             <div className="reg-form-row reg-three-col">
//               <div className="reg-form-group">
//                 <label className="reg-form-label">ACCOUNT NUMBER</label>
//                 <input
//                   type="text"
//                   name="accountNumber"
//                   className="reg-form-input"
//                   value={formData.accountNumber}
//                   readOnly
//                   disabled
//                   style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
//                   placeholder="Auto-generated from phone number"
//                 />
//                 <small style={{ fontSize: "11px", color: "#0867db", marginTop: "4px", display: "block" }}>
//                   ℹ️ Auto-generated from phone number
//                 </small>
//               </div>
//               <div className="reg-form-group">
//                 <label className="reg-form-label">SURNAME</label>
//                 <input
//                   type="text"
//                   name="surname"
//                   className="reg-form-input"
//                   value={formData.surname}
//                   onChange={handleChange}
//                   required
//                   disabled={loading}
//                 />
//               </div>
//               <div className="reg-form-group">
//                 <label className="reg-form-label">OTHER NAMES</label>
//                 <input
//                   type="text"
//                   name="firstName"
//                   className="reg-form-input"
//                   value={formData.firstName}
//                   onChange={handleChange}
//                   required
//                   disabled={loading}
//                 />
//               </div>
//             </div>

//             {/* Row 2: Contact Address (left), Upload Passport (center), Scan Signature (right) */}
//             <div className="reg-form-row reg-three-col">
//               <div className="reg-form-group">
//                 <label className="reg-form-label">CONTACT ADDRESS</label>
//                 <input
//                   type="text"
//                   name="contactAddress"
//                   className="reg-form-input"
//                   value={formData.contactAddress}
//                   onChange={handleChange}
//                   disabled={loading}
//                 />
//               </div>
//               <div className="reg-form-group">
//                 <label className="reg-form-label">UPLOAD PASSPORT</label>
//                 <div className="reg-file-upload-wrapper">
//                   <input
//                     type="file"
//                     id="passport"
//                     className="reg-file-input"
//                     accept="image/*"
//                     onChange={handlePassportChange}
//                     disabled={loading}
//                   />
//                   <label htmlFor="passport" className="reg-file-label">
//                     {passportPreview ? (
//                       <div className="file-preview">
//                         <img 
//                           src={passportPreview} 
//                           alt="Passport preview" 
//                           className="preview-image"
//                         />
//                         <span className="file-name">{passportFile?.name || "Passport"}</span>
//                       </div>
//                     ) : (
//                       <>
//                         <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//                           <path d="M12 15V3M12 3L8 7M12 3L16 7" stroke="#0867db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//                           <path d="M3 15V18C3 19.1046 3.89543 20 5 20H19C20.1046 20 21 19.1046 21 18V15" stroke="#0867db" strokeWidth="2" strokeLinecap="round"/>
//                         </svg>
//                         <span className="file-label-text">Choose File</span>
//                       </>
//                     )}
//                   </label>
//                 </div>
//                 {passportPreview && (
//                   <button 
//                     type="button"
//                     onClick={() => {
//                       setPassportFile(null);
//                       setPassportPreview(null);
//                       const input = document.getElementById('passport');
//                       if (input) input.value = "";
//                     }}
//                     className="clear-file-btn"
//                   >
//                     Clear
//                   </button>
//                 )}
//               </div>
//               <div className="reg-form-group">
//                 <label className="reg-form-label">SCAN SIGNATURE</label>
//                 <div className="reg-file-upload-wrapper">
//                   <input
//                     type="file"
//                     id="signature"
//                     className="reg-file-input"
//                     accept="image/*"
//                     onChange={handleSignatureChange}
//                     disabled={loading}
//                   />
//                   <label htmlFor="signature" className="reg-file-label">
//                     {signaturePreview ? (
//                       <div className="file-preview">
//                         <img 
//                           src={signaturePreview} 
//                           alt="Signature preview" 
//                           className="preview-image"
//                         />
//                         <span className="file-name">{signatureFile?.name || "Signature"}</span>
//                       </div>
//                     ) : (
//                       <>
//                         <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//                           <path d="M12 15V3M12 3L8 7M12 3L16 7" stroke="#0867db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//                           <path d="M3 15V18C3 19.1046 3.89543 20 5 20H19C20.1046 20 21 19.1046 21 18V15" stroke="#0867db" strokeWidth="2" strokeLinecap="round"/>
//                         </svg>
//                         <span className="file-label-text">Choose File</span>
//                       </>
//                     )}
//                   </label>
//                 </div>
//                 {signaturePreview && (
//                   <button 
//                     type="button"
//                     onClick={() => {
//                       setSignatureFile(null);
//                       setSignaturePreview(null);
//                       const input = document.getElementById('signature');
//                       if (input) input.value = "";
//                     }}
//                     className="clear-file-btn"
//                   >
//                     Clear
//                   </button>
//                 )}
//               </div>
//             </div>

//             {/* Row 3: Office Address (full width) */}
//             <div className="reg-form-row reg-full-width">
//               <div className="reg-form-group">
//                 <label className="reg-form-label">OFFICE ADDRESS</label>
//                 <input
//                   type="text"
//                   name="officeAddress"
//                   className="reg-form-input"
//                   value={formData.officeAddress}
//                   onChange={handleChange}
//                   disabled={loading}
//                 />
//               </div>
//             </div>

//             {/* Row 4: Gender, DOB, Email */}
//             <div className="reg-form-row reg-three-col">
//               <div className="reg-form-group">
//                 <label className="reg-form-label">GENDER</label>
//                 <select
//                   name="gender"
//                   className="reg-form-select"
//                   value={formData.gender}
//                   onChange={handleChange}
//                   required
//                   disabled={loading}
//                 >
//                   <option value="">CHOOSE</option>
//                   <option value="male">MALE</option>
//                   <option value="female">FEMALE</option>
//                 </select>
//               </div>
//               <div className="reg-form-group">
//                 <label className="reg-form-label">DOB</label>
//                 <input
//                   type="date"
//                   name="dob"
//                   className="reg-form-input"
//                   value={formData.dob}
//                   onChange={handleChange}
//                   required
//                   disabled={loading}
//                 />
//               </div>
//               <div className="reg-form-group">
//                 <label className="reg-form-label">EMAIL</label>
//                 <input
//                   type="email"
//                   name="email"
//                   className="reg-form-input"
//                   value={formData.email}
//                   onChange={handleChange}
//                   required
//                   disabled={loading}
//                 />
//               </div>
//             </div>

//             {/* Row 5: Phone Number (with auto account number generation), Occupation, Nationality */}
//             <div className="reg-form-row reg-three-col">
//               <div className="reg-form-group">
//                 <label className="reg-form-label">PHONE NUMBER</label>
//                 <input
//                   type="tel"
//                   name="phoneNumber"
//                   className="reg-form-input"
//                   value={formData.phoneNumber}
//                   onChange={handleChange}
//                   required
//                   disabled={loading}
//                   placeholder="e.g., 09064668481"
//                 />
//                 <small style={{ fontSize: "11px", color: "#28a745", marginTop: "4px", display: "block" }}>
//                   💡 Account number will be auto-generated from this number (removing leading 0)
//                 </small>
//               </div>
//               <div className="reg-form-group">
//                 <label className="reg-form-label">OCCUPATION</label>
//                 <input
//                   type="text"
//                   name="occupation"
//                   className="reg-form-input"
//                   value={formData.occupation}
//                   onChange={handleChange}
//                   disabled={loading}
//                 />
//               </div>
//               <div className="reg-form-group">
//                 <label className="reg-form-label">NATIONALITY</label>
//                 <input
//                   type="text"
//                   name="nationality"
//                   className="reg-form-input"
//                   value={formData.nationality}
//                   onChange={handleChange}
//                   disabled={loading}
//                 />
//               </div>
//             </div>

//             {/* Row 6: NIN, BVN, Next of Kin */}
//             <div className="reg-form-row reg-three-col">
//               <div className="reg-form-group">
//                 <label className="reg-form-label">NIN</label>
//                 <input
//                   type="text"
//                   name="nin"
//                   className="reg-form-input"
//                   value={formData.nin}
//                   onChange={handleChange}
//                   disabled={loading}
//                 />
//               </div>
//               <div className="reg-form-group">
//                 <label className="reg-form-label">BVN</label>
//                 <input
//                   type="text"
//                   name="bvn"
//                   className="reg-form-input"
//                   value={formData.bvn}
//                   onChange={handleChange}
//                   disabled={loading}
//                 />
//               </div>
//               <div className="reg-form-group">
//                 <label className="reg-form-label">NEXT OF KIN</label>
//                 <input
//                   type="text"
//                   name="nextOfKin"
//                   className="reg-form-input"
//                   value={formData.nextOfKin}
//                   onChange={handleChange}
//                   disabled={loading}
//                 />
//               </div>
//             </div>

//             {/* Row 7: Account Name, Bank Name */}
//             <div className="reg-form-row reg-two-col">
//               <div className="reg-form-group">
//                 <label className="reg-form-label">ACCOUNT NAME</label>
//                 <input
//                   type="text"
//                   name="accountName"
//                   className="reg-form-input"
//                   value={formData.accountName}
//                   onChange={handleChange}
//                   disabled={loading}
//                 />
//               </div>
//               <div className="reg-form-group">
//                 <label className="reg-form-label">BANK NAME</label>
//                 <input
//                   type="text"
//                   name="bankName"
//                   className="reg-form-input"
//                   value={formData.bankName}
//                   onChange={handleChange}
//                   disabled={loading}
//                 />
//               </div>
//             </div>

//             {/* Row 8: Next of Kin Address (full width) */}
//             <div className="reg-form-row reg-full-width">
//               <div className="reg-form-group">
//                 <label className="reg-form-label">NEXT OF KIN ADDRESS</label>
//                 <input
//                   type="text"
//                   name="nextOfKinAddress"
//                   className="reg-form-input"
//                   value={formData.nextOfKinAddress}
//                   onChange={handleChange}
//                   disabled={loading}
//                 />
//               </div>
//             </div>

//             {/* Form Actions */}
//             <div className="reg-form-actions">
//               <button
//                 type="submit"
//                 className="reg-register-btn"
//                 disabled={loading}
//               >
//                 {loading ? "REGISTERING..." : "REGISTER CUSTOMER DATA"}
//               </button>
//             </div>

//           </form>
//         </div>
        
//       </div>
      
//     </div>
//   );
// };

// export default RegCustomer;


import React, { useState } from "react";
import "./RegCustomer.css";
import BranchBadge from "../../../shared/BranchBadge";
import { Link } from "react-router-dom";
import { apiRequest, apiRequestMultipart } from "../../../../lib/config";
import pmLogo from "../../../../assets/images/PMlogo.png";
import {
  COUNTRY_OPTIONS,
  NIGERIA_STATES,
  getNigeriaLgas,
  isNigeriaCountry,
} from "../../../../lib/nigeriaLocations";

const findVirtualAccountNumber = (payload) => {
  if (!payload || typeof payload !== "object") return "";

  const directValue =
    payload.accountNumber ||
    payload.accountNo ||
    payload.customerAccountNumber ||
    payload.customerAccountNo ||
    payload.account_number ||
    payload.customer_account_number ||
    payload.virtualAccountNumber ||
    payload.virtual_account_number ||
    payload.dedicatedAccountNumber ||
    payload.dedicated_account_number;

  if (directValue) return String(directValue);

  for (const value of Object.values(payload)) {
    if (value && typeof value === "object") {
      const nestedValue = findVirtualAccountNumber(value);
      if (nestedValue) return nestedValue;
    }
  }

  return "";
};

const RegCustomer = ({ toggleRegCusModal }) => {
  const [loading, setLoading] = useState(false);
  const [verifyingNin, setVerifyingNin] = useState(false);
  const [verifyingBvn, setVerifyingBvn] = useState(false);
  const [error, setError] = useState("");
  const [ninError, setNinError] = useState("");
  const [bvnError, setBvnError] = useState("");
  const [passportFile, setPassportFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [passportPreview, setPassportPreview] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredAccountNumber, setRegisteredAccountNumber] = useState("");
  
  const [formData, setFormData] = useState({
    accountNumber: "",
    surname: "",
    firstName: "",
    middleName: "",
    email: "",
    dob: "",
    phoneNumber: "",
    phoneNumber2: "",
    occupation: "",
    nationality: "",
    nin: "",
    bvn: "",
    contactAddress: "",
    contactState: "",
    contactLga: "",
    officeAddress: "",
    officeState: "",
    officeLga: "",
    nextOfKin: "",
    nextOfKinAddress: "",
    nextOfKinState: "",
    nextOfKinLga: "",
    gender: "",
    accountName: "",
    bankName: "",
    maritalStatus: "",
    stateOfOrigin: "",
    lgaOfOrigin: "",
  });

  const closeModal = () => {
    toggleRegCusModal();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updates = {
        ...prev,
        [name]: value,
      };

      if (name === "nationality") {
        if (!isNigeriaCountry(value)) {
          updates.contactState = "";
          updates.contactLga = "";
          updates.officeState = "";
          updates.officeLga = "";
          updates.nextOfKinState = "";
          updates.nextOfKinLga = "";
          updates.stateOfOrigin = "";
          updates.lgaOfOrigin = "";
        } else {
          if (updates.contactState && !NIGERIA_STATES.includes(updates.contactState)) {
            updates.contactState = "";
            updates.contactLga = "";
          }
          if (updates.officeState && !NIGERIA_STATES.includes(updates.officeState)) {
            updates.officeState = "";
            updates.officeLga = "";
          }
          if (updates.nextOfKinState && !NIGERIA_STATES.includes(updates.nextOfKinState)) {
            updates.nextOfKinState = "";
            updates.nextOfKinLga = "";
          }
          if (updates.stateOfOrigin && !NIGERIA_STATES.includes(updates.stateOfOrigin)) {
            updates.stateOfOrigin = "";
            updates.lgaOfOrigin = "";
          }
        }
      }

      if (name === "contactState") {
        updates.contactLga = "";
      }
      if (name === "officeState") {
        updates.officeLga = "";
      }
      if (name === "nextOfKinState") {
        updates.nextOfKinLga = "";
      }
      if (name === "stateOfOrigin") {
        updates.lgaOfOrigin = "";
      }

      return updates;
    });
  };

  const nigeriaSelected = isNigeriaCountry(formData.nationality);
  const contactLgaOptions = getNigeriaLgas(formData.contactState);
  const officeLgaOptions = getNigeriaLgas(formData.officeState);
  const nextOfKinLgaOptions = getNigeriaLgas(formData.nextOfKinState);
  const originLgaOptions = getNigeriaLgas(formData.stateOfOrigin);

  // Verify NIN
  const handleVerifyNin = async () => {
    const nin = formData.nin.trim();
    if (!nin) {
      setNinError("Please enter NIN to verify");
      setTimeout(() => setNinError(""), 3000);
      return;
    }

    if (nin.length !== 11) {
      setNinError("NIN must be 11 digits");
      setTimeout(() => setNinError(""), 3000);
      return;
    }

    setVerifyingNin(true);
    setNinError("");

    try {
      console.log("═══════════════════════════════════════════════════════════");
      console.log("🔵 RegCustomer: Verifying NIN:", nin);
      console.log("═══════════════════════════════════════════════════════════");

      const response = await apiRequest(`/verification/nin/${nin}`, "GET");
      
      console.log("RegCustomer: NIN verification response:", response);

      let verificationData = null;
      if (response?.data) {
        verificationData = response.data;
      } else if (response?.response?.data) {
        verificationData = response.response.data;
      } else {
        verificationData = response;
      }

      console.log("RegCustomer: Processed verification data:", verificationData);

      if (verificationData && verificationData.success !== false) {
        // Auto-populate form fields with NIN data
        const updates = {};
        
        if (verificationData.firstName) updates.firstName = verificationData.firstName;
        if (verificationData.middleName) updates.middleName = verificationData.middleName;
        if (verificationData.lastName) updates.surname = verificationData.lastName;
        if (verificationData.fullName) {
          // If full name is provided but not split, we can still use it
          if (!verificationData.firstName && !verificationData.lastName) {
            const nameParts = verificationData.fullName.split(' ');
            if (nameParts.length >= 2) {
              updates.firstName = nameParts[0];
              updates.surname = nameParts[nameParts.length - 1];
              if (nameParts.length > 2) {
                updates.middleName = nameParts.slice(1, -1).join(' ');
              }
            }
          }
        }
        if (verificationData.dateOfBirth) updates.dob = verificationData.dateOfBirth.split('T')[0];
        if (verificationData.phoneNumber) updates.phoneNumber = verificationData.phoneNumber;
        if (verificationData.phoneNumber2) updates.phoneNumber2 = verificationData.phoneNumber2;
        if (verificationData.email) updates.email = verificationData.email;
        if (verificationData.gender) updates.gender = verificationData.gender.toLowerCase();
        if (verificationData.address) updates.contactAddress = verificationData.address;
        if (verificationData.state) updates.contactState = verificationData.state;
        if (verificationData.lga) updates.contactLga = verificationData.lga;
        if (verificationData.nationality) updates.nationality = verificationData.nationality;
        if (verificationData.stateOfOrigin) updates.stateOfOrigin = verificationData.stateOfOrigin;
        if (verificationData.lgaOfOrigin) updates.lgaOfOrigin = verificationData.lgaOfOrigin;
        if (verificationData.maritalStatus) updates.maritalStatus = verificationData.maritalStatus;
        
        // Confirm the name already entered on the form matches the name registered to this NIN.
        const recordFirst = (verificationData.firstName || "").trim();
        const recordLast = (verificationData.lastName || verificationData.surname || "").trim();
        const recordFullName = (verificationData.fullName || `${recordFirst} ${recordLast}`).trim();
        const tokenize = (value) =>
          new Set(String(value || "").toLowerCase().split(/\s+/).filter(Boolean));
        const recordTokens = tokenize(recordFullName);
        const formNameTyped = `${(formData.firstName || "").trim()} ${(formData.surname || "").trim()}`.trim();
        const formTokens = tokenize(formNameTyped);
        const formHadName = formTokens.size > 0;
        const formMatchesRecord = [...formTokens].every((token) => recordTokens.has(token));

        if (formHadName && recordTokens.size > 0 && !formMatchesRecord) {
          setNinError(
            `Name mismatch: the form shows "${formNameTyped}" but this NIN is registered to "${recordFullName}". Please correct the name on the form.`,
          );
          setTimeout(() => setNinError(""), 6000);
          setVerifyingNin(false);
          return;
        }

        setFormData(prev => ({ ...prev, ...updates }));

        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = 'reg-success-message';
        successMsg.innerHTML = formHadName
          ? '✅ NIN verified — name on the form matches the NIN record.'
          : '✅ NIN verified successfully! Form auto-populated.';
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);

        console.log("RegCustomer: NIN verification name-confirmed");
      } else {
        throw new Error(verificationData?.message || "NIN verification failed");
      }
      
    } catch (err) {
      console.error("RegCustomer: Error verifying NIN:", err);
      setNinError(err?.message || "Failed to verify NIN. Please check the NIN and try again.");
      setTimeout(() => setNinError(""), 5000);
    } finally {
      setVerifyingNin(false);
    }
  };

  // Verify BVN
  const handleVerifyBvn = async () => {
    const bvn = formData.bvn.trim();
    if (!bvn) {
      setBvnError("Please enter BVN to verify");
      setTimeout(() => setBvnError(""), 3000);
      return;
    }

    if (bvn.length !== 11) {
      setBvnError("BVN must be 11 digits");
      setTimeout(() => setBvnError(""), 3000);
      return;
    }

    setVerifyingBvn(true);
    setBvnError("");

    try {
      console.log("═══════════════════════════════════════════════════════════");
      console.log("🔵 RegCustomer: Verifying BVN:", bvn);
      console.log("═══════════════════════════════════════════════════════════");

      const response = await apiRequest(`/verification/bvn/${bvn}`, "GET");
      
      console.log("RegCustomer: BVN verification response:", response);

      let verificationData = null;
      if (response?.data) {
        verificationData = response.data;
      } else if (response?.response?.data) {
        verificationData = response.response.data;
      } else {
        verificationData = response;
      }

      console.log("RegCustomer: Processed verification data:", verificationData);

      if (verificationData && verificationData.success !== false) {
        // Auto-populate form fields with BVN data
        const updates = {};
        
        if (verificationData.firstName) updates.firstName = verificationData.firstName;
        if (verificationData.middleName) updates.middleName = verificationData.middleName;
        if (verificationData.lastName) updates.surname = verificationData.lastName;
        if (verificationData.fullName) {
          if (!verificationData.firstName && !verificationData.lastName) {
            const nameParts = verificationData.fullName.split(' ');
            if (nameParts.length >= 2) {
              updates.firstName = nameParts[0];
              updates.surname = nameParts[nameParts.length - 1];
              if (nameParts.length > 2) {
                updates.middleName = nameParts.slice(1, -1).join(' ');
              }
            }
          }
        }
        if (verificationData.dateOfBirth) updates.dob = verificationData.dateOfBirth.split('T')[0];
        if (verificationData.phoneNumber) updates.phoneNumber = verificationData.phoneNumber;
        if (verificationData.phoneNumber2) updates.phoneNumber2 = verificationData.phoneNumber2;
        if (verificationData.email) updates.email = verificationData.email;
        if (verificationData.gender) updates.gender = verificationData.gender.toLowerCase();
        if (verificationData.address) updates.contactAddress = verificationData.address;
        if (verificationData.state) updates.contactState = verificationData.state;
        if (verificationData.lga) updates.contactLga = verificationData.lga;
        if (verificationData.nationality) updates.nationality = verificationData.nationality;
        if (verificationData.stateOfOrigin) updates.stateOfOrigin = verificationData.stateOfOrigin;
        if (verificationData.lgaOfOrigin) updates.lgaOfOrigin = verificationData.lgaOfOrigin;
        if (verificationData.maritalStatus) updates.maritalStatus = verificationData.maritalStatus;
        
        setFormData(prev => ({ ...prev, ...updates }));
        
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = 'reg-success-message';
        successMsg.innerHTML = '✅ BVN verified successfully! Form auto-populated.';
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);
        
        console.log("RegCustomer: Form auto-populated with BVN data");
      } else {
        throw new Error(verificationData?.message || "BVN verification failed");
      }
      
    } catch (err) {
      console.error("RegCustomer: Error verifying BVN:", err);
      setBvnError(err?.message || "Failed to verify BVN. Please check the BVN and try again.");
      setTimeout(() => setBvnError(""), 5000);
    } finally {
      setVerifyingBvn(false);
    }
  };

  const handlePassportChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPassportFile(file);
      console.log("RegCustomer: Passport file selected:", file.name, file.type, file.size);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPassportPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSignatureFile(file);
      console.log("RegCustomer: Signature file selected:", file.name, file.type, file.size);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignaturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate required fields
    const requiredFields = ["surname", "firstName", "email", "phoneNumber", "dob", "gender"];
    const missingFields = requiredFields.filter(field => !formData[field] || formData[field].trim() === "");

    if (missingFields.length > 0) {
      setError(`Please fill required fields: ${missingFields.join(", ")}`);
      return;
    }

    if (!(passportFile instanceof File)) {
      setError("Please upload the customer's passport photograph before saving.");
      return;
    }

    if (!(signatureFile instanceof File)) {
      setError("Please upload the customer's scanned signature before saving.");
      return;
    }

    try {
      setLoading(true);
      console.log("═══════════════════════════════════════════════════════════");
      console.log("🔵 RegCustomer: ========== REGISTERING WALK-IN CUSTOMER ==========");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("RegCustomer: Form data:", formData);
      console.log("RegCustomer: Passport file:", passportFile?.name);
      console.log("RegCustomer: Signature file:", signatureFile?.name);
      console.log("RegCustomer: API endpoint: /admin/add-walk-in-customer");
      console.log("RegCustomer: Method: POST");
      setRegisteredAccountNumber("");

      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();
      
      // Required fields - Account number will be generated by backend, don't send it
      formDataToSend.append("surname", formData.surname.trim());
      formDataToSend.append("firstName", formData.firstName.trim());
      if (formData.middleName) formDataToSend.append("middleName", formData.middleName.trim());
      formDataToSend.append("email", formData.email.trim());
      formDataToSend.append("dob", formData.dob);
      formDataToSend.append("phoneNumber", formData.phoneNumber.trim());
      if (formData.phoneNumber2) formDataToSend.append("phoneNumber2", formData.phoneNumber2.trim());
      formDataToSend.append("gender", formData.gender.toUpperCase());
      
      // Optional fields
      formDataToSend.append("occupation", formData.occupation?.trim() || "");
      formDataToSend.append("nationality", formData.nationality?.trim() || "");
      formDataToSend.append("nin", formData.nin?.trim() || "");
      formDataToSend.append("bvn", formData.bvn?.trim() || "");
      formDataToSend.append("contactAddress", formData.contactAddress?.trim() || "");
      formDataToSend.append("officeAddress", formData.officeAddress?.trim() || "");
      formDataToSend.append("nextOfKin", formData.nextOfKin?.trim() || "");
      formDataToSend.append("nextOfKinAddress", formData.nextOfKinAddress?.trim() || "");
      formDataToSend.append("accountName", formData.accountName?.trim() || "");
      formDataToSend.append("bankName", formData.bankName?.trim() || "");

      // Add files
      if (passportFile && passportFile instanceof File) {
        console.log("✅ Adding passport file to FormData:", passportFile.name);
        formDataToSend.append("passport", passportFile);
      }
      
      if (signatureFile && signatureFile instanceof File) {
        console.log("✅ Adding signature file to FormData:", signatureFile.name);
        formDataToSend.append("signature", signatureFile);
      }

      console.log("RegCustomer: FormData entries:");
      for (const [key, value] of formDataToSend.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }

      console.log("RegCustomer: Making API request with multipart/form-data...");
      const response = await apiRequestMultipart("/admin/add-walk-in-customer", "POST", formDataToSend);

      console.log("═══════════════════════════════════════════════════════════");
      console.log("✅ RegCustomer: WALK-IN CUSTOMER REGISTERED SUCCESSFULLY");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("RegCustomer: API response:", response);
      const virtualAccountNumber = findVirtualAccountNumber(response);
      if (virtualAccountNumber) {
        setRegisteredAccountNumber(virtualAccountNumber);
        setFormData((prev) => ({
          ...prev,
          accountNumber: virtualAccountNumber,
        }));
      }

      setShowSuccessModal(true);
      
    } catch (err) {
      console.error("═══════════════════════════════════════════════════════════");
      console.error("❌ RegCustomer: ERROR REGISTERING CUSTOMER");
      console.error("═══════════════════════════════════════════════════════════");
      console.error("RegCustomer: Error:", err);
      
      let userMessage = "Failed to register customer. Please try again.";
      
      if (err?.message?.includes("409") || err?.message?.includes("already exists")) {
        userMessage = "Customer with this email or phone number already exists.";
      } else if (err?.status === 401) {
        userMessage = "Your login session is not authorized. Please log in again.";
      } else if (err?.status === 403) {
        userMessage = "You do not have permission to register walk-in customers. Ask an admin to grant access to /admin/add-walk-in-customer.";
      } else if (err?.status === 500) {
        userMessage = "Backend server error while registering the customer or generating the account number. Please check the backend log for /admin/add-walk-in-customer.";
      } else if (err?.message?.includes("413")) {
        userMessage = "File too large. Please reduce image size and try again.";
      } else if (err?.message) {
        userMessage = err.message;
      }
      
      setError(userMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      accountNumber: "",
      surname: "",
      firstName: "",
      middleName: "",
      email: "",
      dob: "",
      phoneNumber: "",
      phoneNumber2: "",
      occupation: "",
      nationality: "",
      nin: "",
      bvn: "",
      contactAddress: "",
      contactState: "",
      contactLga: "",
      officeAddress: "",
      officeState: "",
      officeLga: "",
      nextOfKin: "",
      nextOfKinAddress: "",
      nextOfKinState: "",
      nextOfKinLga: "",
      gender: "",
      accountName: "",
      bankName: "",
      maritalStatus: "",
      stateOfOrigin: "",
      lgaOfOrigin: "",
    });
    setPassportFile(null);
    setSignatureFile(null);
    setPassportPreview(null);
    setSignaturePreview(null);
    setRegisteredAccountNumber("");

    const passportInput = document.getElementById('passport');
    const signatureInput = document.getElementById('signature');
    if (passportInput) passportInput.value = "";
    if (signatureInput) signatureInput.value = "";
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    resetForm();
    closeModal();
  };

  return (
    <div className="reg-customer-container">
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="success-modal-overlay">
          <div className="success-modal blue-theme">
            <div className="success-modal-content">
              <div className="success-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="#0867db"/>
                  <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="success-title">SUCCESSFULLY REGISTERED</h2>
              <p className="success-message">Walk-in customer has been registered successfully!</p>
              {registeredAccountNumber ? (
                <p className="success-message">
                  Generated account number: <strong>{registeredAccountNumber}</strong>
                </p>
              ) : null}
              <button 
                onClick={handleSuccessModalClose}
                className="success-close-btn blue-btn"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="reg-modal-header">
        <div className="reg-brand-header">
          <div className="reg-brand-left">
            <img src={pmLogo} alt="PM Logo" className="reg-brand-logo" />
            <div className="reg-brand-text">
              <p className="reg-brand-name">PM MARKET HUB</p>
              <h1 className="reg-title">WALK IN CUSTOMER FORM</h1>
            </div>
          </div>
          <button onClick={closeModal} className="reg-close-btn">x</button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", margin: "0.5rem 0" }}>
        <BranchBadge />
      </div>

      <div className="reg-scrollable-content">
        
        {error && (
          <div className="reg-error-message">
            ⚠️ {error}
          </div>
        )}

        {loading && (
          <div className="reg-loading-overlay">
            <div className="reg-loading-spinner"></div>
            <p>Registering customer...</p>
          </div>
        )}

        <div className="reg-form-wrapper">
          <form onSubmit={handleSubmit} className="reg-form-container">
            
            {/* Row 1: Surname, First Name, Middle Name */}
            <div className="reg-form-row reg-three-col">
              <div className="reg-form-group">
                <label className="reg-form-label">SURNAME *</label>
                <input
                  type="text"
                  name="surname"
                  className="reg-form-input"
                  value={formData.surname}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="reg-form-group">
                <label className="reg-form-label">FIRST NAME *</label>
                <input
                  type="text"
                  name="firstName"
                  className="reg-form-input"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="reg-form-group">
                <label className="reg-form-label">MIDDLE NAME</label>
                <input
                  type="text"
                  name="middleName"
                  className="reg-form-input"
                  value={formData.middleName}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="reg-form-row reg-full-width">
              <div className="reg-form-group">
                <label className="reg-form-label">ACCOUNT NUMBER</label>
                <input
                  type="text"
                  name="accountNumber"
                  className="reg-form-input"
                  value={formData.accountNumber}
                  placeholder="Generated by backend after registration"
                  readOnly
                  disabled={loading}
                />
              </div>
            </div>

            {/* Row 2: Contact Address, Upload Passport, Scan Signature */}
            <div className="reg-form-row reg-three-col">
              <div className="reg-form-group">
                <label className="reg-form-label">CONTACT ADDRESS</label>
                <input
                  type="text"
                  name="contactAddress"
                  className="reg-form-input"
                  value={formData.contactAddress}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div className="reg-form-group">
                <label className="reg-form-label">UPLOAD PASSPORT *</label>
                <div className="reg-file-upload-wrapper">
                  <input
                    type="file"
                    id="passport"
                    className="reg-file-input"
                    accept="image/*"
                    onChange={handlePassportChange}
                    disabled={loading}
                  />
                  <label htmlFor="passport" className="reg-file-label">
                    {passportPreview ? (
                      <div className="file-preview">
                        <img src={passportPreview} alt="Passport preview" className="preview-image" />
                        <span className="file-name">{passportFile?.name || "Passport"}</span>
                      </div>
                    ) : (
                      <>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 15V3M12 3L8 7M12 3L16 7" stroke="#0867db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M3 15V18C3 19.1046 3.89543 20 5 20H19C20.1046 20 21 19.1046 21 18V15" stroke="#0867db" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        <span className="file-label-text">Choose File</span>
                      </>
                    )}
                  </label>
                </div>
                {passportPreview && (
                  <button type="button" onClick={() => {
                    setPassportFile(null);
                    setPassportPreview(null);
                    const input = document.getElementById('passport');
                    if (input) input.value = "";
                  }} className="clear-file-btn">Clear</button>
                )}
              </div>
              <div className="reg-form-group">
                <label className="reg-form-label">SCAN SIGNATURE *</label>
                <div className="reg-file-upload-wrapper">
                  <input
                    type="file"
                    id="signature"
                    className="reg-file-input"
                    accept="image/*"
                    onChange={handleSignatureChange}
                    disabled={loading}
                  />
                  <label htmlFor="signature" className="reg-file-label">
                    {signaturePreview ? (
                      <div className="file-preview">
                        <img src={signaturePreview} alt="Signature preview" className="preview-image" />
                        <span className="file-name">{signatureFile?.name || "Signature"}</span>
                      </div>
                    ) : (
                      <>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 15V3M12 3L8 7M12 3L16 7" stroke="#0867db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M3 15V18C3 19.1046 3.89543 20 5 20H19C20.1046 20 21 19.1046 21 18V15" stroke="#0867db" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        <span className="file-label-text">Choose File</span>
                      </>
                    )}
                  </label>
                </div>
                {signaturePreview && (
                  <button type="button" onClick={() => {
                    setSignatureFile(null);
                    setSignaturePreview(null);
                    const input = document.getElementById('signature');
                    if (input) input.value = "";
                  }} className="clear-file-btn">Clear</button>
                )}
              </div>
            </div>

            {/* Row 3: Office Address (full width) */}
            <div className="reg-form-row reg-full-width">
              <div className="reg-form-group">
                <label className="reg-form-label">OFFICE ADDRESS</label>
                <input
                  type="text"
                  name="officeAddress"
                  className="reg-form-input"
                  value={formData.officeAddress}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Row 4: Gender, DOB, Email */}
            <div className="reg-form-row reg-three-col">
              <div className="reg-form-group">
                <label className="reg-form-label">GENDER *</label>
                <select
                  name="gender"
                  className="reg-form-select"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="">CHOOSE</option>
                  <option value="male">MALE</option>
                  <option value="female">FEMALE</option>
                </select>
              </div>
              <div className="reg-form-group">
                <label className="reg-form-label">DATE OF BIRTH *</label>
                <input
                  type="date"
                  name="dob"
                  className="reg-form-input"
                  value={formData.dob}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="reg-form-group">
                <label className="reg-form-label">EMAIL *</label>
                <input
                  type="email"
                  name="email"
                  className="reg-form-input"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Row 5: Phone Number, Phone Number 2, Occupation */}
            <div className="reg-form-row reg-three-col">
              <div className="reg-form-group">
                <label className="reg-form-label">PHONE NUMBER *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  className="reg-form-input"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="e.g., 08012345678"
                />
              </div>
              <div className="reg-form-group">
                <label className="reg-form-label">ALTERNATE PHONE</label>
                <input
                  type="tel"
                  name="phoneNumber2"
                  className="reg-form-input"
                  value={formData.phoneNumber2}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div className="reg-form-group">
                <label className="reg-form-label">OCCUPATION</label>
                <input
                  type="text"
                  name="occupation"
                  className="reg-form-input"
                  value={formData.occupation}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Row 6: Nationality, Marital Status, State of Origin */}
            <div className="reg-form-row reg-three-col">
              <div className="reg-form-group">
                <label className="reg-form-label">NATIONALITY</label>
                <input
                  type="text"
                  list="walkin-country-options"
                  name="nationality"
                  className="reg-form-input"
                  value={formData.nationality}
                  onChange={handleChange}
                  disabled={loading}
                />
                <datalist id="walkin-country-options">
                  {COUNTRY_OPTIONS.map((country) => (
                    <option key={country} value={country} />
                  ))}
                </datalist>
              </div>
              <div className="reg-form-group">
                <label className="reg-form-label">MARITAL STATUS</label>
                <select
                  name="maritalStatus"
                  className="reg-form-select"
                  value={formData.maritalStatus}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="">SELECT</option>
                  <option value="single">SINGLE</option>
                  <option value="married">MARRIED</option>
                  <option value="divorced">DIVORCED</option>
                  <option value="widowed">WIDOWED</option>
                </select>
              </div>
              <div className="reg-form-group">
                <label className="reg-form-label">STATE OF ORIGIN</label>
                {nigeriaSelected ? (
                  <select
                    name="stateOfOrigin"
                    className="reg-form-select"
                    value={formData.stateOfOrigin}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="">SELECT STATE</option>
                    {NIGERIA_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state.toUpperCase()}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="stateOfOrigin"
                    className="reg-form-input"
                    value={formData.stateOfOrigin}
                    onChange={handleChange}
                    disabled={loading}
                  />
                )}
              </div>
            </div>

            {/* Row 7: LGA of Origin */}
            <div className="reg-form-row reg-full-width">
              <div className="reg-form-group">
                <label className="reg-form-label">LGA OF ORIGIN</label>
                {nigeriaSelected ? (
                  <select
                    name="lgaOfOrigin"
                    className="reg-form-select"
                    value={formData.lgaOfOrigin}
                    onChange={handleChange}
                    disabled={loading || !formData.stateOfOrigin}
                  >
                    <option value="">
                      {formData.stateOfOrigin ? "SELECT LOCAL GOVERNMENT" : "SELECT STATE FIRST"}
                    </option>
                    {originLgaOptions.map((lga) => (
                      <option key={lga} value={lga}>
                        {lga.toUpperCase()}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="lgaOfOrigin"
                    className="reg-form-input"
                    value={formData.lgaOfOrigin}
                    onChange={handleChange}
                    disabled={loading}
                  />
                )}
              </div>
            </div>

            {/* Row 8: NIN with Verify Button */}
            <div className="reg-form-row reg-two-col">
              <div className="reg-form-group">
                <label className="reg-form-label">NIN</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input
                    type="text"
                    name="nin"
                    className="reg-form-input"
                    value={formData.nin}
                    onChange={handleChange}
                    disabled={loading || verifyingNin}
                    placeholder="11-digit NIN"
                    maxLength="11"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyNin}
                    disabled={loading || verifyingNin || !formData.nin}
                    className="verify-btn"
                    style={{
                      padding: "0 20px",
                      backgroundColor: "#0867db",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: (loading || verifyingNin || !formData.nin) ? "not-allowed" : "pointer",
                      opacity: (loading || verifyingNin || !formData.nin) ? 0.6 : 1,
                      whiteSpace: "nowrap"
                    }}
                  >
                    {verifyingNin ? "VERIFYING..." : "VERIFY NIN"}
                  </button>
                </div>
                {ninError && (
                  <div style={{ color: "#d32f2f", fontSize: "13px", marginTop: "5px" }}>
                    ⚠️ {ninError}
                  </div>
                )}
              </div>
              
              {/* Row 9: BVN with Verify Button */}
              <div className="reg-form-group">
                <label className="reg-form-label">BVN</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input
                    type="text"
                    name="bvn"
                    className="reg-form-input"
                    value={formData.bvn}
                    onChange={handleChange}
                    disabled={loading || verifyingBvn}
                    placeholder="11-digit BVN"
                    maxLength="11"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyBvn}
                    disabled={loading || verifyingBvn || !formData.bvn}
                    className="verify-btn"
                    style={{
                      padding: "0 20px",
                      backgroundColor: "#0867db",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: (loading || verifyingBvn || !formData.bvn) ? "not-allowed" : "pointer",
                      opacity: (loading || verifyingBvn || !formData.bvn) ? 0.6 : 1,
                      whiteSpace: "nowrap"
                    }}
                  >
                    {verifyingBvn ? "VERIFYING..." : "VERIFY BVN"}
                  </button>
                </div>
                {bvnError && (
                  <div style={{ color: "#d32f2f", fontSize: "13px", marginTop: "5px" }}>
                    ⚠️ {bvnError}
                  </div>
                )}
              </div>
            </div>

            {/* Row 10: Contact Location Details */}
            <div className="reg-form-row reg-two-col">
              <div className="reg-form-group">
                <label className="reg-form-label">CONTACT STATE</label>
                {nigeriaSelected ? (
                  <select
                    name="contactState"
                    className="reg-form-select"
                    value={formData.contactState}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="">SELECT STATE</option>
                    {NIGERIA_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state.toUpperCase()}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="contactState"
                    className="reg-form-input"
                    value={formData.contactState}
                    onChange={handleChange}
                    disabled={loading}
                  />
                )}
              </div>
              <div className="reg-form-group">
                <label className="reg-form-label">CONTACT LGA</label>
                {nigeriaSelected ? (
                  <select
                    name="contactLga"
                    className="reg-form-select"
                    value={formData.contactLga}
                    onChange={handleChange}
                    disabled={loading || !formData.contactState}
                  >
                    <option value="">
                      {formData.contactState ? "SELECT LOCAL GOVERNMENT" : "SELECT STATE FIRST"}
                    </option>
                    {contactLgaOptions.map((lga) => (
                      <option key={lga} value={lga}>
                        {lga.toUpperCase()}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="contactLga"
                    className="reg-form-input"
                    value={formData.contactLga}
                    onChange={handleChange}
                    disabled={loading}
                  />
                )}
              </div>
            </div>

            {/* Row 11: Office Location Details */}
            <div className="reg-form-row reg-two-col">
              <div className="reg-form-group">
                <label className="reg-form-label">OFFICE STATE</label>
                {nigeriaSelected ? (
                  <select
                    name="officeState"
                    className="reg-form-select"
                    value={formData.officeState}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="">SELECT STATE</option>
                    {NIGERIA_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state.toUpperCase()}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="officeState"
                    className="reg-form-input"
                    value={formData.officeState}
                    onChange={handleChange}
                    disabled={loading}
                  />
                )}
              </div>
              <div className="reg-form-group">
                <label className="reg-form-label">OFFICE LGA</label>
                {nigeriaSelected ? (
                  <select
                    name="officeLga"
                    className="reg-form-select"
                    value={formData.officeLga}
                    onChange={handleChange}
                    disabled={loading || !formData.officeState}
                  >
                    <option value="">
                      {formData.officeState ? "SELECT LOCAL GOVERNMENT" : "SELECT STATE FIRST"}
                    </option>
                    {officeLgaOptions.map((lga) => (
                      <option key={lga} value={lga}>
                        {lga.toUpperCase()}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="officeLga"
                    className="reg-form-input"
                    value={formData.officeLga}
                    onChange={handleChange}
                    disabled={loading}
                  />
                )}
              </div>
            </div>

            {/* Row 12: Next of Kin */}
            <div className="reg-form-row reg-full-width">
              <div className="reg-form-group">
                <label className="reg-form-label">NEXT OF KIN</label>
                <input
                  type="text"
                  name="nextOfKin"
                  className="reg-form-input"
                  value={formData.nextOfKin}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Row 13: Next of Kin Address */}
            <div className="reg-form-row reg-full-width">
              <div className="reg-form-group">
                <label className="reg-form-label">NEXT OF KIN ADDRESS</label>
                <input
                  type="text"
                  name="nextOfKinAddress"
                  className="reg-form-input"
                  value={formData.nextOfKinAddress}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Row 14: Next of Kin Location Details */}
            <div className="reg-form-row reg-two-col">
              <div className="reg-form-group">
                <label className="reg-form-label">NEXT OF KIN STATE</label>
                {nigeriaSelected ? (
                  <select
                    name="nextOfKinState"
                    className="reg-form-select"
                    value={formData.nextOfKinState}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="">SELECT STATE</option>
                    {NIGERIA_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state.toUpperCase()}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="nextOfKinState"
                    className="reg-form-input"
                    value={formData.nextOfKinState}
                    onChange={handleChange}
                    disabled={loading}
                  />
                )}
              </div>
              <div className="reg-form-group">
                <label className="reg-form-label">NEXT OF KIN LGA</label>
                {nigeriaSelected ? (
                  <select
                    name="nextOfKinLga"
                    className="reg-form-select"
                    value={formData.nextOfKinLga}
                    onChange={handleChange}
                    disabled={loading || !formData.nextOfKinState}
                  >
                    <option value="">
                      {formData.nextOfKinState ? "SELECT LOCAL GOVERNMENT" : "SELECT STATE FIRST"}
                    </option>
                    {nextOfKinLgaOptions.map((lga) => (
                      <option key={lga} value={lga}>
                        {lga.toUpperCase()}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="nextOfKinLga"
                    className="reg-form-input"
                    value={formData.nextOfKinLga}
                    onChange={handleChange}
                    disabled={loading}
                  />
                )}
              </div>
            </div>

            {/* Row 15: Account Name, Bank Name */}
            <div className="reg-form-row reg-two-col">
              <div className="reg-form-group">
                <label className="reg-form-label">ACCOUNT NAME</label>
                <input
                  type="text"
                  name="accountName"
                  className="reg-form-input"
                  value={formData.accountName}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div className="reg-form-group">
                <label className="reg-form-label">BANK NAME</label>
                <input
                  type="text"
                  name="bankName"
                  className="reg-form-input"
                  value={formData.bankName}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="reg-form-actions">
              <button
                type="submit"
                className="reg-register-btn"
                disabled={loading}
              >
                {loading ? "REGISTERING..." : "REGISTER CUSTOMER DATA"}
              </button>
            </div>

          </form>
        </div>
        
      </div>
      
    </div>
  );
};

export default RegCustomer;
