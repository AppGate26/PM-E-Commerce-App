// import React, { useState, useEffect } from "react";
// import "./EditCustomerInfo.css";
// import { apiRequest, apiRequestMultipart } from "../../../../lib/config";

// const EditCustomerInfo = ({ customerId, onClose, onUpdateSuccess }) => {
//   const [loading, setLoading] = useState(false);
//   const [fetching, setFetching] = useState(true);
//   const [error, setError] = useState("");
//   const [passportFile, setPassportFile] = useState(null);
//   const [signatureFile, setSignatureFile] = useState(null);
//   const [passportPreview, setPassportPreview] = useState(null);
//   const [signaturePreview, setSignaturePreview] = useState(null);
//   const [originalPassportUrl, setOriginalPassportUrl] = useState(null);
//   const [originalSignatureUrl, setOriginalSignatureUrl] = useState(null);
//   const [showSuccessModal, setShowSuccessModal] = useState(false);

//   const [formData, setFormData] = useState({
//     accountNumber: "",
//     firstName: "",
//     surname: "",
//     email: "",
//     dob: "",
//     phoneNumber: "",
//     occupation: "",
//     nationality: "",
//     nin: "",
//     bvn: "",
//     contactAddress: "",
//     officeAddress: "",
//     nextOfKin: "",
//     nextOfKinAddress: "",
//     gender: "",
//     accountName: "",
//     bankName: "",
//   });

//   // Fetch single online customer data
//   const fetchCustomerData = async () => {
//     try {
//       setFetching(true);
//       setError("");

//       console.log("═══════════════════════════════════════════════════════════");
//       console.log("🔵 EDIT ONLINE: FETCHING CUSTOMER DATA");
//       console.log("═══════════════════════════════════════════════════════════");
//       console.log("Customer ID:", customerId);

//       if (!customerId) {
//         console.error("❌ No customer ID provided");
//         setError("No customer selected");
//         setFetching(false);
//         return;
//       }

//       console.log("📡 Fetching online customers to find customer ID:", customerId);
//       const response = await apiRequest("/admin/customers/online/report", "GET");
//       console.log("📦 Online customers response:", response);

//       let customersList = [];

//       // Extract customers from your API response format
//       if (response && response.response && response.response.content && Array.isArray(response.response.content)) {
//         customersList = response.response.content;
//         console.log("✅ Found customers list, count:", customersList.length);
//       } else if (Array.isArray(response)) {
//         customersList = response;
//         console.log("✅ Direct array response, count:", response.length);
//       } else {
//         console.log("⚠️ Could not extract customers list from response");
//         customersList = [];
//       }

//       // Find the specific customer
//       const foundCustomer = customersList.find(cust =>
//         cust.id == customerId || cust.customerId == customerId
//       );

//       if (foundCustomer) {
//         console.log("✅ Customer found:", foundCustomer);
//         setFormData({
//           accountNumber: foundCustomer.accountNumber || "",
//           firstName: foundCustomer.firstName || "",
//           surname: foundCustomer.surname || "",
//           email: foundCustomer.email || "",
//           dob: foundCustomer.dob || "",
//           phoneNumber: foundCustomer.phoneNumber || "",
//           occupation: foundCustomer.occupation || "",
//           nationality: foundCustomer.nationality || "",
//           nin: foundCustomer.nin || "",
//           bvn: foundCustomer.bvn || "",
//           contactAddress: foundCustomer.contactAddress || "",
//           officeAddress: foundCustomer.officeAddress || "",
//           nextOfKin: foundCustomer.nextOfKin || "",
//           nextOfKinAddress: foundCustomer.nextOfKinAddress || "",
//           gender: foundCustomer.gender?.toLowerCase() || "",
//           accountName: foundCustomer.accountName || "",
//           bankName: foundCustomer.bankName || "",
//         });

//         // Store original image URLs for display
//         setOriginalPassportUrl(foundCustomer.passport || null);
//         setOriginalSignatureUrl(foundCustomer.signature || null);

//         if (foundCustomer.passport) {
//           console.log("📸 Original passport URL:", foundCustomer.passport);
//         }
//         if (foundCustomer.signature) {
//           console.log("📝 Original signature URL:", foundCustomer.signature);
//         }
//       } else {
//         console.log("❌ Customer not found in list");
//         setError("Customer data not found. Please try again.");
//       }

//     } catch (err) {
//       console.error("═══════════════════════════════════════════════════════════");
//       console.error("❌ ERROR FETCHING CUSTOMER DATA");
//       console.error("═══════════════════════════════════════════════════════════");
//       console.error("Error:", err);
//       console.error("Message:", err?.message);
//       setError("Failed to load customer data. Please try again.");
//     } finally {
//       setFetching(false);
//     }
//   };

//   useEffect(() => {
//     if (customerId) {
//       fetchCustomerData();
//     }
//   }, [customerId]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handlePassportChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setPassportFile(file);
//       console.log("EditOnline: Passport file selected:", file.name, file.type, file.size);

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
//       console.log("EditOnline: Signature file selected:", file.name, file.type, file.size);

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
//     setLoading(true);

//     console.log("═══════════════════════════════════════════════════════════");
//     console.log("🔄 EDIT ONLINE: UPDATING CUSTOMER");
//     console.log("═══════════════════════════════════════════════════════════");
//     console.log("Customer ID:", customerId);
//     console.log("Form data:", formData);
//     console.log("Passport file:", passportFile?.name);
//     console.log("Signature file:", signatureFile?.name);

//     try {
//       // Validate required fields
//       const requiredFields = ["accountNumber", "firstName", "surname", "email", "phoneNumber", "dob"];
//       const missingFields = requiredFields.filter(field => !formData[field] || formData[field].trim() === "");
//       if (missingFields.length > 0) {
//         throw new Error(`Please fill required fields: ${missingFields.join(", ")}`);
//       }

//       console.log("📤 Preparing multipart/form-data request...");
//       console.log("Endpoint: /api/admin/update-online-customer/" + customerId);
//       console.log("Method: PUT");

//       // Create FormData for multipart/form-data
//       const formDataToSend = new FormData();

//       // Add all form fields
//       formDataToSend.append("accountNumber", formData.accountNumber.trim());
//       formDataToSend.append("firstName", formData.firstName.trim());
//       formDataToSend.append("surname", formData.surname.trim());
//       formDataToSend.append("email", formData.email.trim());
//       formDataToSend.append("dob", formData.dob);
//       formDataToSend.append("phoneNumber", formData.phoneNumber.trim());
//       formDataToSend.append("occupation", formData.occupation?.trim() || "");

//       // Add optional fields if present
//       if (formData.nationality?.trim()) formDataToSend.append("nationality", formData.nationality.trim());
//       if (formData.nin?.trim()) formDataToSend.append("nin", formData.nin.trim());
//       if (formData.bvn?.trim()) formDataToSend.append("bvn", formData.bvn.trim());
//       if (formData.contactAddress?.trim()) formDataToSend.append("contactAddress", formData.contactAddress.trim());
//       if (formData.officeAddress?.trim()) formDataToSend.append("officeAddress", formData.officeAddress.trim());
//       if (formData.nextOfKin?.trim()) formDataToSend.append("nextOfKin", formData.nextOfKin.trim());
//       if (formData.nextOfKinAddress?.trim()) formDataToSend.append("nextOfKinAddress", formData.nextOfKinAddress.trim());
//       if (formData.gender) formDataToSend.append("gender", formData.gender.toUpperCase());
//       if (formData.accountName?.trim()) formDataToSend.append("accountName", formData.accountName.trim());
//       if (formData.bankName?.trim()) formDataToSend.append("bankName", formData.bankName.trim());

//       // Add files if selected
//       if (passportFile && passportFile instanceof File) {
//         console.log("✅ Adding passport file to FormData:", passportFile.name);
//         formDataToSend.append("passport", passportFile);
//       } else {
//         console.log("⚠️ No new passport file selected, keeping existing");
//       }

//       if (signatureFile && signatureFile instanceof File) {
//         console.log("✅ Adding signature file to FormData:", signatureFile.name);
//         formDataToSend.append("signature", signatureFile);
//       } else {
//         console.log("⚠️ No new signature file selected, keeping existing");
//       }

//       // Log FormData contents for debugging
//       console.log("📦 FormData entries:");
//       for (const [key, value] of formDataToSend.entries()) {
//         if (value instanceof File) {
//           console.log(` ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
//         } else {
//           console.log(` ${key}: ${value}`);
//         }
//       }

//       // Make the API call with multipart/form-data
//       console.log("📡 Making API request with multipart/form-data...");
//       const response = await apiRequestMultipart(
//         `/api/admin/update-online-customer/${customerId}`,
//         "PUT",
//         formDataToSend
//       );

//       console.log("═══════════════════════════════════════════════════════════");
//       console.log("✅ CUSTOMER UPDATED SUCCESSFULLY");
//       console.log("═══════════════════════════════════════════════════════════");
//       console.log("API Response:", response);

//       // Show success modal
//       setShowSuccessModal(true);

//     } catch (err) {
//       console.error("═══════════════════════════════════════════════════════════");
//       console.error("❌ ERROR UPDATING CUSTOMER");
//       console.error("═══════════════════════════════════════════════════════════");
//       console.error("Error:", err);
//       console.error("Message:", err?.message);
//       console.error("Details:", err?.details);
//       console.error("Status:", err?.status);

//       let userMessage = "Failed to update customer. Please try again.";

//       if (err?.message?.includes("Content-Type") && err?.message?.includes("not supported")) {
//         userMessage = "API expects multipart/form-data format. Please contact support.";
//       } else if (err?.message?.includes("413") || err?.message?.includes("Payload Too Large")) {
//         userMessage = "File too large. Please reduce image size and try again.";
//       } else if (err?.message?.includes("400") || err?.message?.includes("Bad Request")) {
//         userMessage = "Invalid data. Please check all fields and try again.";
//       } else if (err?.message?.includes("404")) {
//         userMessage = "Customer not found. Please refresh the list and try again.";
//       } else if (err?.message?.includes("500")) {
//         userMessage = "Server error. Please try again later.";
//       } else if (err?.message) {
//         userMessage = err.message;
//       }

//       setError(userMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSuccessModalClose = () => {
//     setShowSuccessModal(false);

//     // Call success callback
//     if (onUpdateSuccess) {
//       onUpdateSuccess();
//     }

//     // Close modal
//     if (onClose) {
//       onClose();
//     }
//   };

//   if (fetching) {
//     return (
//       <div className="edit-customer-modal-container">
//         <div className="edit-loading-state">
//           <div className="edit-loading-spinner"></div>
//           Loading online customer information...
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="edit-customer-modal-container">
//       {/* Success Modal */}
//       {showSuccessModal && (
//         <div className="success-modal-overlay">
//           <div className="success-modal blue-theme">
//             <div className="success-modal-content">
//               <div className="success-icon">
//                 <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//                   <circle cx="12" cy="12" r="10" fill="#0867db"/>
//                   <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//                 </svg>
//               </div>
//               <h2 className="text-primary">SUCCESSFULLY UPDATED</h2>
//               <p className="success-message">Online customer has been updated successfully!</p>
//               <button
//                 onClick={handleSuccessModalClose}
//                 className="text-white btn btn-primary"
//                 style={{
//                   padding: '12px 40px',
//                   borderRadius: '6px',
//                   fontSize: '16px',
//                   fontWeight: '600',
//                   transition: 'all 0.3s ease',
//                   marginTop: '10px',
//                   textTransform: 'uppercase',
//                   letterSpacing: '1px'
//                 }}
//               >
//                 CLOSE
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <div className="edit-modal-header">
//         <button onClick={onClose} className="edit-close-btn">×</button>
//         <h1 className="edit-title">EDIT ONLINE CUSTOMER FORM</h1>
//       </div>

//       <div className="edit-scrollable-content">
//         {error && (
//           <div className="edit-error-message" style={{
//             backgroundColor: '#f8d7da',
//             color: '#721c24',
//             padding: '12px',
//             borderRadius: '4px',
//             marginBottom: '15px',
//             border: '1px solid #f5c6cb'
//           }}>
//             ⚠️ {error}
//           </div>
//         )}

//         <div className="edit-form-wrapper">
//           <form onSubmit={handleSubmit} className="edit-form-container">
//             {/* Row 1: Account Number, First Name, Surname */}
//             <div className="edit-form-row edit-three-col">
//               <div className="edit-form-group">
//                 <label className="edit-form-label">ACCOUNT NUMBER</label>
//                 <input
//                   type="text"
//                   className="edit-form-input"
//                   value={formData.accountNumber}
//                   disabled
//                   readOnly
//                 />
//               </div>
//               <div className="edit-form-group">
//                 <label className="edit-form-label">FIRST NAME *</label>
//                 <input
//                   type="text"
//                   name="firstName"
//                   className="edit-form-input"
//                   value={formData.firstName}
//                   onChange={handleChange}
//                   disabled={loading}
//                   required
//                 />
//               </div>
//               <div className="edit-form-group">
//                 <label className="edit-form-label">SURNAME *</label>
//                 <input
//                   type="text"
//                   name="surname"
//                   className="edit-form-input"
//                   value={formData.surname}
//                   onChange={handleChange}
//                   disabled={loading}
//                   required
//                 />
//               </div>
//             </div>

//             {/* Row 2: Contact Address, Upload Passport, Scanned Signature */}
//             <div className="edit-form-row edit-three-col">
//               <div className="edit-form-group">
//                 <label className="edit-form-label">CONTACT ADDRESS</label>
//                 <input
//                   type="text"
//                   name="contactAddress"
//                   className="edit-form-input"
//                   value={formData.contactAddress}
//                   onChange={handleChange}
//                   disabled={loading}
//                 />
//               </div>
//               <div className="edit-form-group">
//                 <label className="edit-form-label">PASSPORT</label>
//                 <div className="edit-file-upload-wrapper">
//                   <input
//                     type="file"
//                     id="edit-passport"
//                     className="edit-file-input"
//                     accept="image/*"
//                     onChange={handlePassportChange}
//                     disabled={loading}
//                   />
//                   <label htmlFor="edit-passport" className="edit-file-label">
//                     {passportPreview ? (
//                       <div className="file-preview">
//                         <img
//                           src={passportPreview}
//                           alt="Passport preview"
//                           className="preview-image"
//                         />
//                         <span className="file-name">{passportFile?.name || "New Passport"}</span>
//                       </div>
//                     ) : originalPassportUrl ? (
//                       <div className="file-preview">
//                         <img
//                           src={originalPassportUrl}
//                           alt="Existing passport"
//                           className="preview-image"
//                           onError={(e) => {
//                             console.log("Failed to load original passport image");
//                             e.target.style.display = "none";
//                             e.target.parentElement.innerHTML = '<div>Existing Image</div>';
//                           }}
//                         />
//                         <span className="file-name">Existing Passport</span>
//                       </div>
//                     ) : (
//                       <>
//                         <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
//                           <path d="M12 15V3M12 3L8 7M12 3L16 7" stroke="#0867db" strokeWidth="2"/>
//                           <path d="M3 15V18C3 19.1046 3.89543 20 5 20H19C20.1046 20 21 19.1046 21 18V15" stroke="#0867db" strokeWidth="2"/>
//                         </svg>
//                         <span className="file-label-text">Choose File</span>
//                       </>
//                     )}
//                   </label>
//                 </div>
//                 {(passportPreview || originalPassportUrl) && (
//                   <button
//                     type="button"
//                     onClick={() => {
//                       setPassportFile(null);
//                       setPassportPreview(null);
//                       const input = document.getElementById('edit-passport');
//                       if (input) input.value = "";
//                     }}
//                     className="clear-file-btn"
//                   >
//                     {passportPreview ? "Clear New" : "Keep Existing"}
//                   </button>
//                 )}
//               </div>
//               <div className="edit-form-group">
//                 <label className="edit-form-label">SIGNATURE</label>
//                 <div className="edit-file-upload-wrapper">
//                   <input
//                     type="file"
//                     id="edit-signature"
//                     className="edit-file-input"
//                     accept="image/*"
//                     onChange={handleSignatureChange}
//                     disabled={loading}
//                   />
//                   <label htmlFor="edit-signature" className="edit-file-label">
//                     {signaturePreview ? (
//                       <div className="file-preview">
//                         <img
//                           src={signaturePreview}
//                           alt="Signature preview"
//                           className="preview-image"
//                         />
//                         <span className="file-name">{signatureFile?.name || "New Signature"}</span>
//                       </div>
//                     ) : originalSignatureUrl ? (
//                       <div className="file-preview">
//                         <img
//                           src={originalSignatureUrl}
//                           alt="Existing signature"
//                           className="preview-image"
//                           onError={(e) => {
//                             console.log("Failed to load original signature image");
//                             e.target.style.display = "none";
//                             e.target.parentElement.innerHTML = '<div>Existing Image</div>';
//                           }}
//                         />
//                         <span className="file-name">Existing Signature</span>
//                       </div>
//                     ) : (
//                       <>
//                         <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
//                           <path d="M12 15V3M12 3L8 7M12 3L16 7" stroke="#0867db" strokeWidth="2"/>
//                           <path d="M3 15V18C3 19.1046 3.89543 20 5 20H19C20.1046 20 21 19.1046 21 18V15" stroke="#0867db" strokeWidth="2"/>
//                         </svg>
//                         <span className="file-label-text">Choose File</span>
//                       </>
//                     )}
//                   </label>
//                 </div>
//                 {(signaturePreview || originalSignatureUrl) && (
//                   <button
//                     type="button"
//                     onClick={() => {
//                       setSignatureFile(null);
//                       setSignaturePreview(null);
//                       const input = document.getElementById('edit-signature');
//                       if (input) input.value = "";
//                     }}
//                     className="clear-file-btn"
//                   >
//                     {signaturePreview ? "Clear New" : "Keep Existing"}
//                   </button>
//                 )}
//               </div>
//             </div>

//             {/* Row 3: Email (full width) */}
//             <div className="edit-form-row edit-full-width">
//               <div className="edit-form-group">
//                 <label className="edit-form-label">EMAIL *</label>
//                 <input
//                   type="email"
//                   name="email"
//                   className="edit-form-input"
//                   value={formData.email}
//                   onChange={handleChange}
//                   disabled={loading}
//                   required
//                 />
//               </div>
//             </div>

//             {/* Row 4: DOB, Gender, Phone Number */}
//             <div className="edit-form-row edit-three-col">
//               <div className="edit-form-group">
//                 <label className="edit-form-label">DOB *</label>
//                 <input
//                   type="date"
//                   name="dob"
//                   className="edit-form-input"
//                   value={formData.dob}
//                   onChange={handleChange}
//                   disabled={loading}
//                   required
//                 />
//               </div>
//               <div className="edit-form-group">
//                 <label className="edit-form-label">GENDER *</label>
//                 <select
//                   name="gender"
//                   className="edit-form-select"
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
//               <div className="edit-form-group">
//                 <label className="edit-form-label">PHONE NUMBER *</label>
//                 <input
//                   type="tel"
//                   name="phoneNumber"
//                   className="edit-form-input"
//                   value={formData.phoneNumber}
//                   onChange={handleChange}
//                   disabled={loading}
//                   required
//                 />
//               </div>
//             </div>

//             {/* Row 5: Occupation, Nationality, Office Address */}
//             <div className="edit-form-row edit-three-col">
//               <div className="edit-form-group">
//                 <label className="edit-form-label">OCCUPATION</label>
//                 <input
//                   type="text"
//                   name="occupation"
//                   className="edit-form-input"
//                   value={formData.occupation}
//                   onChange={handleChange}
//                   disabled={loading}
//                 />
//               </div>
//               <div className="edit-form-group">
//                 <label className="edit-form-label">NATIONALITY</label>
//                 <input
//                   type="text"
//                   name="nationality"
//                   className="edit-form-input"
//                   value={formData.nationality}
//                   onChange={handleChange}
//                   disabled={loading}
//                 />
//               </div>
//               <div className="edit-form-group">
//                 <label className="edit-form-label">OFFICE ADDRESS</label>
//                 <input
//                   type="text"
//                   name="officeAddress"
//                   className="edit-form-input"
//                   value={formData.officeAddress}
//                   onChange={handleChange}
//                   disabled={loading}
//                 />
//               </div>
//             </div>

//             {/* Row 6: NIN, BVN, Next of Kin */}
//             <div className="edit-form-row edit-three-col">
//               <div className="edit-form-group">
//                 <label className="edit-form-label">NIN</label>
//                 <input
//                   type="text"
//                   name="nin"
//                   className="edit-form-input"
//                   value={formData.nin}
//                   onChange={handleChange}
//                   disabled={loading}
//                 />
//               </div>
//               <div className="edit-form-group">
//                 <label className="edit-form-label">BVN</label>
//                 <input
//                   type="text"
//                   name="bvn"
//                   className="edit-form-input"
//                   value={formData.bvn}
//                   onChange={handleChange}
//                   disabled={loading}
//                 />
//               </div>
//               <div className="edit-form-group">
//                 <label className="edit-form-label">NEXT OF KIN</label>
//                 <input
//                   type="text"
//                   name="nextOfKin"
//                   className="edit-form-input"
//                   value={formData.nextOfKin}
//                   onChange={handleChange}
//                   disabled={loading}
//                 />
//               </div>
//             </div>

//             {/* Row 7: Next of Kin Address (full width) */}
//             <div className="edit-form-row edit-full-width">
//               <div className="edit-form-group">
//                 <label className="edit-form-label">NEXT OF KIN ADDRESS</label>
//                 <input
//                   type="text"
//                   name="nextOfKinAddress"
//                   className="edit-form-input"
//                   value={formData.nextOfKinAddress}
//                   onChange={handleChange}
//                   disabled={loading}
//                 />
//               </div>
//             </div>

//             {/* Row 8: Account Name, Bank Name */}
//             <div className="edit-form-row edit-two-col">
//               <div className="edit-form-group">
//                 <label className="edit-form-label">ACCOUNT NAME</label>
//                 <input
//                   type="text"
//                   name="accountName"
//                   className="edit-form-input"
//                   value={formData.accountName}
//                   onChange={handleChange}
//                   disabled={loading}
//                 />
//               </div>
//               <div className="edit-form-group">
//                 <label className="edit-form-label">BANK NAME</label>
//                 <input
//                   type="text"
//                   name="bankName"
//                   className="edit-form-input"
//                   value={formData.bankName}
//                   onChange={handleChange}
//                   disabled={loading}
//                 />
//               </div>
//             </div>

//             <div className="edit-form-actions">
//               <button
//                 type="submit"
//                 className="edit-register-btn"
//                 disabled={loading}
//                 style={{
//                   opacity: loading ? 0.7 : 1,
//                   cursor: loading ? 'not-allowed' : 'pointer'
//                 }}
//               >
//                 {loading ? "UPDATING..." : "UPDATE CUSTOMER DATA"}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EditCustomerInfo;

import React, { useState, useEffect } from "react";
import "./EditCustomerInfo.css";
import BranchBadge from "../../../shared/BranchBadge";
import { apiRequest, apiRequestMultipart } from "../../../../lib/config";

const EditCustomerInfo = ({ customerId, customerData, onClose, onUpdateSuccess }) => {
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

  const [formData, setFormData] = useState({
    accountNumber: "",
    email: "",
    surname: "",
    firstName: "",
    dob: "",
    phoneNumber: "",
    occupation: "",
    // Additional fields from your original form
    address: "",
    bank: "",
    nationality: "",
    nin: "",
    bvn: "",
  });

  const applyCustomerDataToForm = (customer = {}) => {
    setFormData({
      accountNumber: customer.accountNumber || "",
      email: customer.email || customer.emailAddress || "",
      surname: customer.surname || customer.lastName || "",
      firstName: customer.firstName || customer.firstname || "",
      dob: customer.dob || customer.dateOfBirth || "",
      phoneNumber: customer.phoneNumber || customer.phone || "",
      occupation: customer.occupation || customer.jobTitle || "",
      address: customer.address || customer.contactAddress || "",
      bank: customer.bank || customer.bankName || "",
      nationality: customer.nationality || customer.country || "",
      nin: customer.nin || customer.nationalId || "",
      bvn: customer.bvn || customer.bankVerificationNumber || "",
    });

    setOriginalPassportUrl(
      customer.passport || customer.passportUrl || customer.profileImage || null
    );
    setOriginalSignatureUrl(customer.signature || customer.signatureUrl || null);
  };

  // Fetch single customer data
  const fetchCustomerData = async () => {
    try {
      setFetching(true);
      setError("");
      
      console.log("═══════════════════════════════════════════════════════════");
      console.log("🔵 EDIT ONLINE CUSTOMER: FETCHING CUSTOMER DATA");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("Customer ID:", customerId);
      
      if (!customerId) {
        console.error("❌ No customer ID provided");
        setError("No customer selected");
        setFetching(false);
        return;
      }

      // Fetch all online customers and find the specific one
      console.log("📡 Fetching online customers to find customer ID:", customerId);
      const response = await apiRequest("/admin/customers/online/report", "GET");
      console.log("📦 Online customers response:", response);
      
      let customersList = [];
      
      // Extract customers from your API response format
      if (response && response.response && response.response.content && Array.isArray(response.response.content)) {
        customersList = response.response.content;
        console.log("✅ Found customers list, count:", customersList.length);
      } else if (Array.isArray(response)) {
        customersList = response;
        console.log("✅ Direct array response, count:", response.length);
      } else if (response && response.data && Array.isArray(response.data)) {
        customersList = response.data;
        console.log("✅ Found customers in response.data, count:", response.data.length);
      } else if (response && response.content && Array.isArray(response.content)) {
        customersList = response.content;
        console.log("✅ Found customers in response.content, count:", response.content.length);
      } else {
        console.log("⚠️ Could not extract customers list from response");
        customersList = [];
      }
      
      // Find the specific customer
      const foundCustomer = customersList.find(cust => 
        cust.id == customerId || cust.customerId == customerId || cust.accountNumber == customerId
      );
      
      if (foundCustomer) {
        console.log("✅ Customer found:", foundCustomer);
        applyCustomerDataToForm(foundCustomer);
        
        if (foundCustomer.passport || foundCustomer.passportUrl) {
          console.log("📸 Original passport URL:", foundCustomer.passport || foundCustomer.passportUrl);
        }
        if (foundCustomer.signature || foundCustomer.signatureUrl) {
          console.log("📝 Original signature URL:", foundCustomer.signature || foundCustomer.signatureUrl);
        }
      } else {
        console.log("❌ Customer not found in list");
        setError("Customer data not found. Please try again.");
      }
      
    } catch (err) {
      console.error("═══════════════════════════════════════════════════════════");
      console.error("❌ ERROR FETCHING CUSTOMER DATA");
      console.error("═══════════════════════════════════════════════════════════");
      console.error("Error:", err);
      console.error("Message:", err?.message);
      setError("Failed to load customer data. Please try again.");
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

    if (customerId) {
      fetchCustomerData();
      return;
    }

    setFetching(false);
  }, [customerId, customerData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePassportChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPassportFile(file);
      console.log("EditOnline: Passport file selected:", file.name, file.type, file.size);
      
      // Create preview URL
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
      console.log("EditOnline: Signature file selected:", file.name, file.type, file.size);
      
      // Create preview URL
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
    setLoading(true);
    
    console.log("═══════════════════════════════════════════════════════════");
    console.log("🔄 EDIT ONLINE CUSTOMER: UPDATING CUSTOMER");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("Customer ID:", customerId);
    console.log("Form data:", formData);
    console.log("Passport file:", passportFile?.name);
    console.log("Signature file:", signatureFile?.name);
    
    try {
      // Validate required fields from API screenshot
      const requiredFields = ["accountNumber", "email", "surname", "firstName", "dob", "phoneNumber", "occupation"];
      const missingFields = requiredFields.filter(field => !formData[field] || formData[field].trim() === "");

      if (missingFields.length > 0) {
        throw new Error(`Please fill required fields: ${missingFields.join(", ")}`);
      }
      
      console.log("📤 Preparing multipart/form-data request...");
      console.log("Endpoint: /admin/update-online-customer/" + customerId);
      console.log("Method: PUT");
      
      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();
      
      // Add all form fields from API screenshot
      formDataToSend.append("accountNumber", formData.accountNumber.trim());
      formDataToSend.append("email", formData.email.trim());
      formDataToSend.append("surname", formData.surname.trim());
      formDataToSend.append("firstName", formData.firstName.trim());
      formDataToSend.append("dob", formData.dob);
      formDataToSend.append("phoneNumber", formData.phoneNumber.trim());
      formDataToSend.append("occupation", formData.occupation.trim());
      
      // Add optional fields if they exist. The backend's CustomerDto has no "address" or
      // "bank" field - only "contactAddress" - so those keys were silently dropped by
      // Spring's @ModelAttribute binding and never persisted despite the form reporting
      // success. "bank" has no backing column on Customer at all; drop it rather than
      // send a field that can never be saved.
      if (formData.address?.trim()) formDataToSend.append("contactAddress", formData.address.trim());
      if (formData.nationality?.trim()) formDataToSend.append("nationality", formData.nationality.trim());
      if (formData.nin?.trim()) formDataToSend.append("nin", formData.nin.trim());
      if (formData.bvn?.trim()) formDataToSend.append("bvn", formData.bvn.trim());

      // Add files if selected
      if (passportFile && passportFile instanceof File) {
        console.log("✅ Adding passport file to FormData:", passportFile.name);
        formDataToSend.append("passport", passportFile);
      } else {
        console.log("⚠️ No new passport file selected, keeping existing");
      }
      
      if (signatureFile && signatureFile instanceof File) {
        console.log("✅ Adding signature file to FormData:", signatureFile.name);
        formDataToSend.append("signature", signatureFile);
      } else {
        console.log("⚠️ No new signature file selected, keeping existing");
      }

      // Log FormData contents for debugging
      console.log("📦 FormData entries:");
      for (const [key, value] of formDataToSend.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }

      // Make the API call with multipart/form-data - USING PUT
      console.log("📡 Making API request with multipart/form-data...");
      const response = await apiRequestMultipart(
        `/admin/update-online-customer/${customerId}`, 
        "PUT", 
        formDataToSend
      );
      
      console.log("═══════════════════════════════════════════════════════════");
      console.log("✅ ONLINE CUSTOMER UPDATED SUCCESSFULLY");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("API Response:", response);

      // Show success modal
      setShowSuccessModal(true);
      
    } catch (err) {
      console.error("═══════════════════════════════════════════════════════════");
      console.error("❌ ERROR UPDATING ONLINE CUSTOMER");
      console.error("═══════════════════════════════════════════════════════════");
      console.error("Error:", err);
      console.error("Message:", err?.message);
      console.error("Details:", err?.details);
      console.error("Status:", err?.status);
      
      let userMessage = "Failed to update customer. Please try again.";
      
      if (err?.message?.includes("Content-Type") && err?.message?.includes("not supported")) {
        userMessage = "API expects multipart/form-data format. Please contact support.";
      } else if (err?.message?.includes("413") || err?.message?.includes("Payload Too Large")) {
        userMessage = "File too large. Please reduce image size and try again.";
      } else if (err?.message?.includes("400") || err?.message?.includes("Bad Request")) {
        userMessage = "Invalid data. Please check all fields and try again.";
      } else if (err?.message?.includes("404")) {
        userMessage = "Customer not found. Please refresh the list and try again.";
      } else if (err?.message?.includes("500")) {
        userMessage = "Server error. Please try again later.";
      } else if (err?.message) {
        userMessage = err.message;
      }
      
      setError(userMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    
    // Call success callback
    if (onUpdateSuccess) {
      onUpdateSuccess();
    }
    
    // Close modal
    if (onClose) {
      onClose();
    }
  };

  if (fetching) {
    return (
      <div className="edit-customer-modal-container">
        <div className="edit-loading-state">
          <div className="edit-loading-spinner"></div>
          Loading online customer information...
        </div>
      </div>
    );
  }

  return (
    <div className="edit-customer-modal-container">
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
              <h2 className="text-primary">SUCCESSFULLY UPDATED</h2>
              <p className="success-message">Online customer has been updated successfully!</p>
              <button 
                onClick={handleSuccessModalClose}
                className="text-white btn btn-primary"
                style={{
                  padding: '12px 40px',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  marginTop: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="edit-modal-header">
        <button onClick={onClose} className="edit-close-btn">×</button>
        <h1 className="edit-title">EDIT ONLINE CUSTOMER FORM</h1>
      </div>

      <div style={{ display: "flex", justifyContent: "center", margin: "0.5rem 0" }}>
        <BranchBadge />
      </div>

      <div className="edit-scrollable-content">
        {error && (
          <div className="edit-error-message" style={{ 
            backgroundColor: '#f8d7da', 
            color: '#721c24',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '15px',
            border: '1px solid #f5c6cb'
          }}>
            ⚠️ {error}
          </div>
        )}

        <div className="edit-form-wrapper">
          <form onSubmit={handleSubmit} className="edit-form-container">
            {/* Row 1: Account Number, First Name, Surname */}
            <div className="edit-form-row edit-three-col">
              <div className="edit-form-group">
                <label className="edit-form-label">ACCOUNT NUMBER *</label>
                <input
                  type="text"
                  className="edit-form-input"
                  value={formData.accountNumber}
                  disabled
                  readOnly
                />
              </div>
              <div className="edit-form-group">
                <label className="edit-form-label">FIRST NAME *</label>
                <input
                  type="text"
                  name="firstName"
                  className="edit-form-input"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
              <div className="edit-form-group">
                <label className="edit-form-label">SURNAME *</label>
                <input
                  type="text"
                  name="surname"
                  className="edit-form-input"
                  value={formData.surname}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Row 2: Address, Upload Passport, Scanned Signature */}
            <div className="edit-form-row edit-three-col">
              <div className="edit-form-group">
                <label className="edit-form-label">ADDRESS</label>
                <input
                  type="text"
                  name="address"
                  className="edit-form-input"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div className="edit-form-group">
                <label className="edit-form-label">PASSPORT</label>
                <div className="edit-file-upload-wrapper">
                  <input 
                    type="file" 
                    id="edit-passport"
                    className="edit-file-input" 
                    accept="image/*"
                    onChange={handlePassportChange}
                    disabled={loading}
                  />
                  <label htmlFor="edit-passport" className="edit-file-label">
                    {passportPreview ? (
                      <div className="file-preview">
                        <img 
                          src={passportPreview} 
                          alt="Passport preview" 
                          className="preview-image"
                        />
                        <span className="file-name">{passportFile?.name || "New Passport"}</span>
                      </div>
                    ) : originalPassportUrl ? (
                      <div className="file-preview">
                        <img 
                          src={originalPassportUrl} 
                          alt="Existing passport" 
                          className="preview-image"
                          onError={(e) => {
                            console.log("Failed to load original passport image");
                            e.target.style.display = "none";
                            e.target.parentElement.innerHTML = '<div>Existing Image</div>';
                          }}
                        />
                        <span className="file-name">Existing Passport</span>
                      </div>
                    ) : (
                      <>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                          <path d="M12 15V3M12 3L8 7M12 3L16 7" stroke="#0867db" strokeWidth="2"/>
                          <path d="M3 15V18C3 19.1046 3.89543 20 5 20H19C20.1046 20 21 19.1046 21 18V15" stroke="#0867db" strokeWidth="2"/>
                        </svg>
                        <span className="file-label-text">Choose File</span>
                      </>
                    )}
                  </label>
                </div>
                {(passportPreview || originalPassportUrl) && (
                  <button 
                    type="button"
                    onClick={() => {
                      setPassportFile(null);
                      setPassportPreview(null);
                      const input = document.getElementById('edit-passport');
                      if (input) input.value = "";
                    }}
                    className="clear-file-btn"
                  >
                    {passportPreview ? "Clear New" : "Keep Existing"}
                  </button>
                )}
              </div>
              <div className="edit-form-group">
                <label className="edit-form-label">SIGNATURE</label>
                <div className="edit-file-upload-wrapper">
                  <input 
                    type="file" 
                    id="edit-signature"
                    className="edit-file-input" 
                    accept="image/*"
                    onChange={handleSignatureChange}
                    disabled={loading}
                  />
                  <label htmlFor="edit-signature" className="edit-file-label">
                    {signaturePreview ? (
                      <div className="file-preview">
                        <img 
                          src={signaturePreview} 
                          alt="Signature preview" 
                          className="preview-image"
                        />
                        <span className="file-name">{signatureFile?.name || "New Signature"}</span>
                      </div>
                    ) : originalSignatureUrl ? (
                      <div className="file-preview">
                        <img 
                          src={originalSignatureUrl} 
                          alt="Existing signature" 
                          className="preview-image"
                          onError={(e) => {
                            console.log("Failed to load original signature image");
                            e.target.style.display = "none";
                            e.target.parentElement.innerHTML = '<div>Existing Image</div>';
                          }}
                        />
                        <span className="file-name">Existing Signature</span>
                      </div>
                    ) : (
                      <>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                          <path d="M12 15V3M12 3L8 7M12 3L16 7" stroke="#0867db" strokeWidth="2"/>
                          <path d="M3 15V18C3 19.1046 3.89543 20 5 20H19C20.1046 20 21 19.1046 21 18V15" stroke="#0867db" strokeWidth="2"/>
                        </svg>
                        <span className="file-label-text">Choose File</span>
                      </>
                    )}
                  </label>
                </div>
                {(signaturePreview || originalSignatureUrl) && (
                  <button 
                    type="button"
                    onClick={() => {
                      setSignatureFile(null);
                      setSignaturePreview(null);
                      const input = document.getElementById('edit-signature');
                      if (input) input.value = "";
                    }}
                    className="clear-file-btn"
                  >
                    {signaturePreview ? "Clear New" : "Keep Existing"}
                  </button>
                )}
              </div>
            </div>

            {/* Row 3: Email (full width) */}
            <div className="edit-form-row edit-full-width">
              <div className="edit-form-group">
                <label className="edit-form-label">EMAIL *</label>
                <input
                  type="email"
                  name="email"
                  className="edit-form-input"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Row 4: DOB, Phone Number */}
            <div className="edit-form-row edit-two-col">
              <div className="edit-form-group">
                <label className="edit-form-label">DATE OF BIRTH *</label>
                <input
                  type="date"
                  name="dob"
                  className="edit-form-input"
                  value={formData.dob}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
              <div className="edit-form-group">
                <label className="edit-form-label">PHONE NUMBER *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  className="edit-form-input"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Row 5: Occupation */}
            <div className="edit-form-row edit-full-width">
              <div className="edit-form-group">
                <label className="edit-form-label">OCCUPATION *</label>
                <input
                  type="text"
                  name="occupation"
                  className="edit-form-input"
                  value={formData.occupation}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Row 6: Nationality */}
            <div className="edit-form-row edit-two-col">
              <div className="edit-form-group">
                <label className="edit-form-label">NATIONALITY</label>
                <input
                  type="text"
                  name="nationality"
                  className="edit-form-input"
                  value={formData.nationality}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Row 7: NIN, BVN */}
            <div className="edit-form-row edit-two-col">
              <div className="edit-form-group">
                <label className="edit-form-label">NIN</label>
                <input
                  type="text"
                  name="nin"
                  className="edit-form-input"
                  value={formData.nin}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div className="edit-form-group">
                <label className="edit-form-label">BVN</label>
                <input
                  type="text"
                  name="bvn"
                  className="edit-form-input"
                  value={formData.bvn}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="edit-form-actions">
              <button 
                type="submit" 
                className="edit-register-btn" 
                disabled={loading}
                style={{
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? "UPDATING..." : "UPDATE CUSTOMER DATA"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditCustomerInfo;
