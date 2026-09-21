// import React, { useState, useEffect, useRef } from "react";
// import "./CreditSales.css";
// import { FaTimes, FaShoppingCart, FaSearch, FaChevronDown } from "react-icons/fa";
// import { IoGridOutline } from "react-icons/io5";
// import { apiRequest } from "../../../../../lib/config";

// const CreditSales = ({ toggleCdsModal }) => {
//   const closeModal = () => {
//     toggleCdsModal();
//   };

//   // State for form data
//   const [formData, setFormData] = useState({
//     productInfo: {
//       productName: "",
//       productId: "",
//       referenceNo: "",
//       category: "",
//       subCategory: "",
//       description: "",
//       unitPrice: "",
//       quantity: "1",
//       discount: "",
//     },
//     customerInfo: {
//       customerName: "",
//       address: "",
//       phoneNumber: "",
//       email: "",
//       accountNumber: "",
//       surname: "",
//       firstName: "",
//       dob: "",
//       occupation: "",
//       nationality: "",
//       nin: "",
//       gender: "",
//       customerBankAccount: "",
//     },
//     loanInfo: {
//       loanType: "",
//       productAmount: "",
//       repaymentMethod: "Monthly",
//       duration: "12",
//       rate: "10",
//       interestOnLoan: "",
//       principalRepayment: "",
//       startDate: new Date().toISOString().split('T')[0],
//       expirationDate: "",
//       officerInCharge: "",
//       upfrontCharges: "0",
//       monthlyPayment: ""
//     }
//   });

//   // Search states
//   const [productSearchTerm, setProductSearchTerm] = useState("");
//   const [filteredProducts, setFilteredProducts] = useState([]);
//   const [showProductDropdown, setShowProductDropdown] = useState(false);
//   const productSearchRef = useRef(null);

//   const [customerSearchTerm, setCustomerSearchTerm] = useState("");
//   const [filteredCustomers, setFilteredCustomers] = useState([]);
//   const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
//   const customerSearchRef = useRef(null);

//   const [productTable, setProductTable] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [customers, setCustomers] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [fetching, setFetching] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [generatedSchedule, setGeneratedSchedule] = useState(null);

//   // Generate auto-reference number
//   const generateReferenceNo = () => {
//     const timestamp = Date.now().toString().slice(-8);
//     const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
//     return `PM-CR-${timestamp}${random}`;
//   };

//   // Auto-generate reference number on mount
//   useEffect(() => {
//     setFormData(prev => ({
//       ...prev,
//       productInfo: {
//         ...prev.productInfo,
//         referenceNo: generateReferenceNo()
//       }
//     }));
//   }, [productTable.length]);

//   // Filter products
//   useEffect(() => {
//     if (!productSearchTerm.trim()) {
//       setFilteredProducts([]);
//       return;
//     }

//     const term = productSearchTerm.toLowerCase();
//     const filtered = products.filter(p => {
//       const name = (p.productName || p.name || "").toLowerCase();
//       const id = (p.id?.toString() || p.productId?.toString() || "").toLowerCase();
//       const cat = (p.category?.name || p.category || "").toLowerCase();
//       return name.includes(term) || id.includes(term) || cat.includes(term);
//     }).slice(0, 10);
    
//     setFilteredProducts(filtered);
//     console.log(`🔍 Filtered products: ${filtered.length} matches for "${term}"`);
//   }, [productSearchTerm, products]);

//   // Filter customers
//   useEffect(() => {
//     if (!customerSearchTerm.trim()) {
//       setFilteredCustomers([]);
//       return;
//     }

//     const term = customerSearchTerm.toLowerCase();
//     const filtered = customers.filter(c => {
//       const name = `${c.firstName || ""} ${c.surname || ""}`.toLowerCase();
//       const account = (c.accountNumber || "").toLowerCase();
//       const email = (c.email || "").toLowerCase();
//       const phone = (c.phoneNumber || "").toLowerCase();
//       return name.includes(term) || account.includes(term) || email.includes(term) || phone.includes(term);
//     }).slice(0, 10);
    
//     setFilteredCustomers(filtered);
//     console.log(`🔍 Filtered customers: ${filtered.length} matches for "${term}"`);
//   }, [customerSearchTerm, customers]);

//   // Close dropdowns
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (productSearchRef.current && !productSearchRef.current.contains(event.target)) {
//         setShowProductDropdown(false);
//       }
//       if (customerSearchRef.current && !customerSearchRef.current.contains(event.target)) {
//         setShowCustomerDropdown(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   useEffect(() => {
//     console.log("🚀 CreditSales component mounted");
//     fetchProducts();
//     fetchCustomers();
//   }, []);

//   const fetchProducts = async () => {
//     try {
//       setFetching(true);
//       console.log("📦 Fetching products...");
//       const response = await apiRequest("/products?size=500", "GET");
      
//       let productsList = [];
//       if (response?.response?.content && Array.isArray(response.response.content)) {
//         productsList = response.response.content;
//       } else if (Array.isArray(response)) {
//         productsList = response;
//       } else if (response?.data && Array.isArray(response.data)) {
//         productsList = response.data;
//       } else if (response?.content && Array.isArray(response.content)) {
//         productsList = response.content;
//       }
      
//       console.log(`✅ Loaded ${productsList.length} products`);
//       setProducts(productsList);
//     } catch (err) {
//       console.error("❌ Error fetching products:", err);
//       setProducts([]);
//     } finally {
//       setFetching(false);
//     }
//   };

//   const fetchCustomers = async () => {
//     try {
//       setFetching(true);
//       console.log("👥 Fetching customers...");
//       const response = await apiRequest("/admin/customers", "GET");
      
//       let customersList = [];
//       if (response?.response && Array.isArray(response.response)) {
//         customersList = response.response;
//       } else if (Array.isArray(response)) {
//         customersList = response;
//       } else if (response?.data && Array.isArray(response.data)) {
//         customersList = response.data;
//       }
      
//       console.log(`✅ Loaded ${customersList.length} customers`);
//       setCustomers(customersList);
//     } catch (err) {
//       console.error("❌ Error fetching customers:", err);
//       setCustomers([]);
//     } finally {
//       setFetching(false);
//     }
//   };

//   // Calculate loan interest automatically
//   const calculateLoanInterest = (amount, rate, duration) => {
//     if (!amount || amount <= 0 || !rate || rate <= 0 || !duration || duration <= 0) {
//       return 0;
//     }
//     const interest = (amount * rate * duration) / 100 / 12;
//     console.log(`📊 Calculating interest: Amount=${amount}, Rate=${rate}%, Duration=${duration} months → Interest=${interest.toFixed(2)}`);
//     return interest;
//   };

//   // Calculate principal repayment
//   const calculatePrincipalRepayment = (amount, duration) => {
//     if (!amount || amount <= 0 || !duration || duration <= 0) {
//       return 0;
//     }
//     const principal = amount / duration;
//     console.log(`💰 Principal repayment: ${principal.toFixed(2)} per month`);
//     return principal;
//   };

//   // Calculate monthly payment
//   const calculateMonthlyPayment = (amount, duration, interest) => {
//     if (!amount || amount <= 0 || !duration || duration <= 0) {
//       return 0;
//     }
//     const principal = amount / duration;
//     const monthlyInterest = interest / duration;
//     return principal + monthlyInterest;
//   };

//   // Update loan calculations when relevant fields change
//   const updateLoanCalculations = (amount, rate, duration) => {
//     const productAmount = amount || parseFloat(formData.loanInfo.productAmount) || 0;
//     const interestRate = rate || parseFloat(formData.loanInfo.rate) || 0;
//     const loanDuration = duration || parseInt(formData.loanInfo.duration) || 0;
    
//     if (productAmount > 0 && interestRate > 0 && loanDuration > 0) {
//       const interest = calculateLoanInterest(productAmount, interestRate, loanDuration);
//       const principal = calculatePrincipalRepayment(productAmount, loanDuration);
//       const monthlyPayment = calculateMonthlyPayment(productAmount, loanDuration, interest);
      
//       console.log(`🔄 Updating loan calculations:`, {
//         productAmount,
//         interestRate,
//         loanDuration,
//         totalInterest: interest,
//         monthlyPrincipal: principal,
//         monthlyPayment: monthlyPayment.toFixed(2)
//       });
      
//       setFormData(prev => ({
//         ...prev,
//         loanInfo: {
//           ...prev.loanInfo,
//           interestOnLoan: interest.toFixed(2),
//           principalRepayment: principal.toFixed(2),
//           monthlyPayment: monthlyPayment.toFixed(2)
//         }
//       }));
//     } else {
//       setFormData(prev => ({
//         ...prev,
//         loanInfo: {
//           ...prev.loanInfo,
//           interestOnLoan: "",
//           principalRepayment: "",
//           monthlyPayment: ""
//         }
//       }));
//     }
//   };

//   // Select product
//   const selectProduct = (product) => {
//     console.log("✅ Selected product:", product);
    
//     const price = product.sellingPrice || product.price || product.unitPrice || 0;
//     const quantity = 1;
//     const productAmount = price * quantity;
    
//     console.log(`💰 Product price: ₦${price}, Quantity: ${quantity}, Total: ₦${productAmount}`);
    
//     setFormData(prev => ({
//       ...prev,
//       productInfo: {
//         ...prev.productInfo,
//         productName: product.productName || product.name || "",
//         productId: (product.id?.toString() || product.productId?.toString() || ""),
//         category: product.category?.name || product.category || "",
//         subCategory: product.subCategory?.name || product.subCategory || "",
//         description: product.productDescription || product.description || "",
//         unitPrice: price.toString(),
//         quantity: quantity.toString(),
//         discount: "",
//       },
//       loanInfo: {
//         ...prev.loanInfo,
//         productAmount: productAmount.toString()
//       }
//     }));
    
//     setProductSearchTerm(product.productName || product.name || "");
//     setShowProductDropdown(false);
    
//     setTimeout(() => {
//       updateLoanCalculations(productAmount, null, null);
//     }, 100);
//   };

//   // Select customer
//   const selectCustomer = (customer) => {
//     console.log("✅ Selected customer:", customer);
    
//     const fullName = `${customer.firstName || ""} ${customer.surname || ""}`.trim() || 
//                      customer.customerName || customer.name || "Unknown";
    
//     setFormData(prev => ({
//       ...prev,
//       customerInfo: {
//         ...prev.customerInfo,
//         customerName: fullName,
//         accountNumber: customer.accountNumber || "",
//         email: customer.email || "",
//         phoneNumber: customer.phoneNumber || "",
//         address: customer.contactAddress || customer.officeAddress || "",
//         surname: customer.surname || "",
//         firstName: customer.firstName || "",
//         dob: customer.dob || "",
//         occupation: customer.occupation || "",
//         nationality: customer.nationality || "",
//         nin: customer.nin || "",
//         gender: customer.gender || "",
//         customerBankAccount: customer.bvn || "",
//       }
//     }));
//     setCustomerSearchTerm(fullName);
//     setShowCustomerDropdown(false);
//   };

//   const handleChange = (e, section, field) => {
//     const value = e.target.value;
//     console.log(`📝 Changing ${section}.${field}:`, value);
    
//     setFormData((prev) => ({
//       ...prev,
//       [section]: {
//         ...prev[section],
//         [field]: value,
//       },
//     }));

//     if (section === "productInfo" && (field === "unitPrice" || field === "quantity" || field === "discount")) {
//       setTimeout(() => {
//         const price = parseFloat(formData.productInfo.unitPrice) || 0;
//         const quantity = parseInt(formData.productInfo.quantity) || 1;
//         const discount = parseFloat(formData.productInfo.discount) || 0;
//         const productAmount = price * quantity * (1 - discount/100);
        
//         console.log(`🔄 Product amount recalculated: ₦${productAmount.toFixed(2)}`);
        
//         setFormData(prev => ({
//           ...prev,
//           loanInfo: {
//             ...prev.loanInfo,
//             productAmount: productAmount.toFixed(2)
//           }
//         }));
        
//         setTimeout(() => {
//           updateLoanCalculations(productAmount, null, null);
//         }, 50);
//       }, 0);
//     }

//     if (section === "loanInfo" && (field === "productAmount" || field === "rate" || field === "duration")) {
//       setTimeout(() => {
//         const amount = parseFloat(formData.loanInfo.productAmount) || 0;
//         const rate = parseFloat(formData.loanInfo.rate) || 0;
//         const duration = parseInt(formData.loanInfo.duration) || 0;
        
//         console.log(`🔄 Loan calculation triggered: Amount=${amount}, Rate=${rate}%, Duration=${duration} months`);
        
//         if (amount > 0 && rate > 0 && duration > 0) {
//           updateLoanCalculations(amount, rate, duration);
//         }
//       }, 50);
//     }
//   };

//   const handleInsertRecord = (e) => {
//     e.preventDefault();
    
//     if (!formData.productInfo.productName || !formData.productInfo.unitPrice) {
//       setError("Please select a valid product");
//       setTimeout(() => setError(""), 3000);
//       return;
//     }

//     const price = parseFloat(formData.productInfo.unitPrice) || 0;
//     const quantity = parseInt(formData.productInfo.quantity) || 1;
//     const discount = parseFloat(formData.productInfo.discount) || 0;
//     const total = price * quantity * (1 - discount/100);

//     const newProduct = {
//       id: Date.now(),
//       productName: formData.productInfo.productName,
//       productId: formData.productInfo.productId || `PROD-${Date.now()}`,
//       description: formData.productInfo.description,
//       category: formData.productInfo.category,
//       subCategory: formData.productInfo.subCategory,
//       unitPrice: price,
//       quantity: quantity,
//       discount: discount,
//       total: total,
//       referenceNo: formData.productInfo.referenceNo,
//     };

//     console.log("📦 Adding product to table:", newProduct);
//     setProductTable([...productTable, newProduct]);
    
//     const newTotalAmount = calculateTotal() + total;
//     setFormData(prev => ({
//       ...prev,
//       loanInfo: {
//         ...prev.loanInfo,
//         productAmount: newTotalAmount.toFixed(2)
//       }
//     }));
    
//     setFormData((prev) => ({
//       ...prev,
//       productInfo: {
//         productName: "",
//         productId: "",
//         referenceNo: generateReferenceNo(),
//         category: "",
//         subCategory: "",
//         description: "",
//         unitPrice: "",
//         quantity: "1",
//         discount: "",
//       },
//     }));
//     setProductSearchTerm("");
    
//     setTimeout(() => {
//       updateLoanCalculations(newTotalAmount, null, null);
//     }, 100);
//   };

//   const handleGenerateSchedule = async () => {
//     if (productTable.length === 0) {
//       setError("Please add products first");
//       setTimeout(() => setError(""), 3000);
//       return;
//     }

//     const totalAmount = calculateTotal();
    
//     const loanData = {
//       productAmount: totalAmount,
//       loanType: formData.loanInfo.loanType || "Personal",
//       repaymentMethod: formData.loanInfo.repaymentMethod || "Monthly",
//       duration: parseInt(formData.loanInfo.duration) || 12,
//       rate: parseFloat(formData.loanInfo.rate) || 10,
//       startDate: formData.loanInfo.startDate || new Date().toISOString().split('T')[0]
//     };

//     console.log("📅 Generating repayment schedule with data:", loanData);
    
//     try {
//       setLoading(true);
//       setError("");
      
//       const response = await apiRequest("/sales/loan/calculate-schedule", "POST", loanData);
//       console.log("✅ Schedule response:", response);
      
//       // Extract schedule data from response
//       let scheduleData = null;
//       if (response?.response) {
//         scheduleData = response.response;
//       } else if (response?.data) {
//         scheduleData = response.data;
//       } else {
//         scheduleData = response;
//       }
      
//       console.log("📊 Processed schedule data:", scheduleData);
      
//       if (scheduleData) {
//         // Create a proper schedule object
//         const schedule = {
//           monthlyPayment: scheduleData.monthlyPayment || scheduleData.interestOnLoan / scheduleData.numberOfPayments + (scheduleData.productAmount / scheduleData.numberOfPayments) || 0,
//           totalInterest: scheduleData.interestOnLoan || 0,
//           totalRepayment: scheduleData.totalRepayment || (totalAmount + (scheduleData.interestOnLoan || 0)),
//           numberOfPayments: scheduleData.numberOfPayments || parseInt(formData.loanInfo.duration) || 12,
//           payments: []
//         };
        
//         // Build payment schedule
//         const monthlyPrincipal = totalAmount / schedule.numberOfPayments;
//         const monthlyInterest = schedule.totalInterest / schedule.numberOfPayments;
//         let remainingBalance = totalAmount;
        
//         const startDate = new Date(formData.loanInfo.startDate || new Date());
        
//         for (let i = 1; i <= schedule.numberOfPayments; i++) {
//           const dueDate = new Date(startDate);
//           dueDate.setMonth(startDate.getMonth() + i);
          
//           const principal = monthlyPrincipal;
//           const interest = monthlyInterest;
//           const totalPayment = principal + interest;
//           remainingBalance = remainingBalance - principal;
          
//           schedule.payments.push({
//             month: i,
//             dueDate: dueDate.toLocaleDateString('en-GB'),
//             principal: principal,
//             interest: interest,
//             totalPayment: totalPayment,
//             remainingBalance: remainingBalance > 0 ? remainingBalance : 0
//           });
//         }
        
//         setGeneratedSchedule(schedule);
        
//         setFormData(prev => ({
//           ...prev,
//           loanInfo: {
//             ...prev.loanInfo,
//             monthlyPayment: schedule.monthlyPayment.toFixed(2),
//             interestOnLoan: schedule.totalInterest.toFixed(2)
//           }
//         }));
        
//         setSuccess(`✅ Schedule generated! Monthly payment: ₦${schedule.monthlyPayment.toLocaleString()}`);
//         setTimeout(() => setSuccess(""), 5000);
//       } else {
//         throw new Error("Invalid response from server");
//       }
//     } catch (err) {
//       console.error("❌ Error generating schedule:", err);
//       setError(err?.message || "Failed to generate repayment schedule");
//       setTimeout(() => setError(""), 5000);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     setLoading(true);
//     setError("");
//     setSuccess("");

//     if (productTable.length === 0) {
//       setError("Please add at least one product");
//       setLoading(false);
//       return;
//     }

//     if (!formData.customerInfo.customerName || !formData.customerInfo.accountNumber) {
//       setError("Please select a valid customer");
//       setLoading(false);
//       return;
//     }

//     if (!formData.loanInfo.loanType || !formData.loanInfo.productAmount) {
//       setError("Please fill loan information");
//       setLoading(false);
//       return;
//     }

//     try {
//       console.log("📤 Submitting credit sale...");
      
//       const requestBody = {
//         productInfo: {
//           products: productTable.map(product => ({
//             productName: product.productName,
//             productId: product.productId,
//             referenceNo: product.referenceNo,
//             category: product.category,
//             subCategory: product.subCategory,
//             description: product.description,
//             price: product.unitPrice,
//             unitPrice: product.unitPrice,
//             quantity: product.quantity,
//             discount: product.discount,
//             totalAmount: product.total
//           })),
//           totalAmount: calculateTotal()
//         },
//         customerInfo: {
//           customerName: formData.customerInfo.customerName,
//           accountNumber: formData.customerInfo.accountNumber,
//           email: formData.customerInfo.email,
//           phoneNumber: formData.customerInfo.phoneNumber,
//           address: formData.customerInfo.address,
//           dob: formData.customerInfo.dob,
//           gender: formData.customerInfo.gender,
//           occupation: formData.customerInfo.occupation,
//           customerBankAccount: formData.customerInfo.customerBankAccount
//         },
//         loanInfo: {
//           loanType: formData.loanInfo.loanType,
//           productAmount: parseFloat(formData.loanInfo.productAmount) || 0,
//           repaymentMethod: formData.loanInfo.repaymentMethod || "Monthly",
//           duration: parseInt(formData.loanInfo.duration) || 12,
//           rate: parseFloat(formData.loanInfo.rate) || 0,
//           interestOnLoan: parseFloat(formData.loanInfo.interestOnLoan) || 0,
//           principalRepayment: parseFloat(formData.loanInfo.principalRepayment) || 0,
//           startDate: formData.loanInfo.startDate || new Date().toISOString().split('T')[0],
//           expirationDate: formData.loanInfo.expirationDate || "",
//           officerInCharge: formData.loanInfo.officerInCharge || "",
//           upfrontCharges: parseFloat(formData.loanInfo.upfrontCharges) || 0,
//           monthlyPayment: parseFloat(formData.loanInfo.monthlyPayment) || 0
//         }
//       };

//       console.log("📤 Sending credit sale request:", requestBody);
//       const response = await apiRequest("/sales/walk-in/credit", "POST", requestBody);
      
//       console.log("✅ Credit sale response:", response);
      
//       if (response?.status === 200 || response?.status === 201 || response?.success === true) {
//         setSuccess(`✅ Credit sale submitted successfully! Total: ₦${calculateTotal().toLocaleString()}`);
        
//         setFormData({
//           productInfo: {
//             productName: "",
//             productId: "",
//             referenceNo: generateReferenceNo(),
//             category: "",
//             subCategory: "",
//             description: "",
//             unitPrice: "",
//             quantity: "1",
//             discount: "",
//           },
//           customerInfo: {
//             customerName: "",
//             address: "",
//             phoneNumber: "",
//             email: "",
//             accountNumber: "",
//             surname: "",
//             firstName: "",
//             dob: "",
//             occupation: "",
//             nationality: "",
//             nin: "",
//             gender: "",
//             customerBankAccount: "",
//           },
//           loanInfo: {
//             loanType: "",
//             productAmount: "",
//             repaymentMethod: "Monthly",
//             duration: "12",
//             rate: "10",
//             interestOnLoan: "",
//             principalRepayment: "",
//             startDate: new Date().toISOString().split('T')[0],
//             expirationDate: "",
//             officerInCharge: "",
//             upfrontCharges: "0",
//             monthlyPayment: ""
//           }
//         });
//         setProductTable([]);
//         setProductSearchTerm("");
//         setCustomerSearchTerm("");
//         setGeneratedSchedule(null);
        
//         setTimeout(() => {
//           setSuccess("");
//         }, 3000);
//       } else {
//         throw new Error(response?.message || "Failed to submit credit sale");
//       }
//     } catch (err) {
//       console.error("❌ Submit error:", err);
//       let errorMessage = "Failed to submit credit sale. ";
//       if (err?.message) {
//         errorMessage += err.message;
//       } else if (err?.response?.data?.message) {
//         errorMessage += err.response.data.message;
//       } else {
//         errorMessage += "Please try again.";
//       }
//       setError(errorMessage);
//       setTimeout(() => setError(""), 5000);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const calculateTotal = () => {
//     return productTable.reduce((sum, product) => {
//       return sum + product.total;
//     }, 0);
//   };

//   const removeProduct = (index) => {
//     const newTable = productTable.filter((_, i) => i !== index);
//     setProductTable(newTable);
    
//     const newTotal = newTable.reduce((sum, p) => sum + p.total, 0);
//     setFormData(prev => ({
//       ...prev,
//       loanInfo: {
//         ...prev.loanInfo,
//         productAmount: newTotal.toString()
//       }
//     }));
    
//     setTimeout(() => {
//       updateLoanCalculations(newTotal, null, null);
//     }, 100);
    
//     console.log(`🗑️ Removed product, ${newTable.length} remaining, new total: ₦${newTotal}`);
//   };

//   // Format currency
//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('en-NG', {
//       style: 'currency',
//       currency: 'NGN',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0
//     }).format(amount || 0);
//   };

//   return (
//     <div className="csh-modal-wrapper">
//       <div className="Csh-container">
//         {/* Header */}
//         <div className="csh-header">
//           <div className="csh-header-left">
//             <FaShoppingCart className="csh-cart-icon" />
//           </div>
//           <h1 className="csh-title">CREDIT SALES</h1>
//           <div className="csh-header-right">
//             <IoGridOutline className="csh-grid-icon" />
//             <FaTimes className="csh-close-icon" onClick={closeModal} />
//           </div>
//         </div>

//         {error && (
//           <div className="csh-alert csh-alert-error">
//             <span>⚠️ {error}</span>
//           </div>
//         )}

//         {success && (
//           <div className="csh-alert csh-alert-success">
//             <span>✅ {success}</span>
//           </div>
//         )}

//         <form onSubmit={handleSubmit}>
//           {/* PRODUCT INFO */}
//           <div className="csh-section">
//             <div className="csh-section-header">
//               <h5>PRODUCT INFO</h5>
//             </div>
//             <div className="csh-section-body">
//               <div className="csh-grid-3">
//                 <div className="csh-field" ref={productSearchRef} style={{ position: "relative" }}>
//                   <label>SEARCH PRODUCT</label>
//                   <div style={{ position: "relative" }}>
//                     <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#999", fontSize: "14px", pointerEvents: "none" }} />
//                     <input
//                       type="text"
//                       value={productSearchTerm}
//                       onChange={(e) => {
//                         setProductSearchTerm(e.target.value);
//                         setShowProductDropdown(true);
//                       }}
//                       onFocus={() => setShowProductDropdown(true)}
//                       className="csh-input"
//                       placeholder="Name, ID, or category..."
//                       style={{ paddingLeft: "32px" }}
//                     />
//                     <FaChevronDown style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#999", fontSize: "12px", pointerEvents: "none" }} />
//                   </div>
//                   {showProductDropdown && filteredProducts.length > 0 && (
//                     <div style={{
//                       position: "absolute",
//                       top: "100%",
//                       left: 0,
//                       right: 0,
//                       maxHeight: "200px",
//                       overflowY: "auto",
//                       background: "white",
//                       border: "1px solid #ddd",
//                       borderRadius: "4px",
//                       boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
//                       zIndex: 1000,
//                       marginTop: "4px"
//                     }}>
//                       {filteredProducts.map((product) => (
//                         <div
//                           key={product.id}
//                           onClick={() => selectProduct(product)}
//                           style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #eee" }}
//                           onMouseEnter={(e) => e.target.style.background = "#f5f5f5"}
//                           onMouseLeave={(e) => e.target.style.background = "white"}
//                         >
//                           <div style={{ fontWeight: 500 }}>{product.productName || product.name}</div>
//                           <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>
//                             ID: {product.id} • ₦{product.sellingPrice || product.price}
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>

//                 <div className="csh-field">
//                   <label>PRODUCT ID</label>
//                   <input
//                     type="text"
//                     value={formData.productInfo.productId}
//                     className="csh-input"
//                     readOnly
//                     style={{ background: "#f5f5f5" }}
//                   />
//                 </div>

//                 <div className="csh-field">
//                   <label>REFERENCE NO</label>
//                   <input
//                     type="text"
//                     value={formData.productInfo.referenceNo}
//                     className="csh-input"
//                     readOnly
//                     style={{ background: "#f5f5f5", color: "#0867db", fontWeight: 500 }}
//                   />
//                 </div>

//                 <div className="csh-field">
//                   <label>CATEGORY</label>
//                   <input
//                     type="text"
//                     value={formData.productInfo.category}
//                     className="csh-input"
//                     readOnly
//                     style={{ background: "#f5f5f5" }}
//                   />
//                 </div>

//                 <div className="csh-field">
//                   <label>SUB-CATEGORY</label>
//                   <input
//                     type="text"
//                     value={formData.productInfo.subCategory}
//                     className="csh-input"
//                     readOnly
//                     style={{ background: "#f5f5f5" }}
//                   />
//                 </div>

//                 <div className="csh-field">
//                   <label>DESCRIPTION</label>
//                   <textarea
//                     value={formData.productInfo.description}
//                     className="csh-textarea"
//                     rows="2"
//                     readOnly
//                     style={{ background: "#f5f5f5", resize: "none" }}
//                   />
//                 </div>

//                 <div className="csh-field">
//                   <label>UNIT PRICE (₦)</label>
//                   <input
//                     type="number"
//                     value={formData.productInfo.unitPrice}
//                     onChange={(e) => handleChange(e, "productInfo", "unitPrice")}
//                     className="csh-input"
//                     style={{ fontWeight: "bold", color: "#2e7d32" }}
//                     step="0.01"
//                   />
//                 </div>

//                 <div className="csh-field">
//                   <label>QUANTITY</label>
//                   <input
//                     type="number"
//                     value={formData.productInfo.quantity}
//                     onChange={(e) => handleChange(e, "productInfo", "quantity")}
//                     className="csh-input"
//                     min="1"
//                     step="1"
//                   />
//                 </div>

//                 <div className="csh-field">
//                   <label>DISCOUNT (%)</label>
//                   <input
//                     type="number"
//                     value={formData.productInfo.discount}
//                     onChange={(e) => handleChange(e, "productInfo", "discount")}
//                     className="csh-input"
//                     min="0"
//                     max="100"
//                     step="0.01"
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* CUSTOMER INFO */}
//           <div className="csh-section">
//             <div className="csh-section-header">
//               <h5>CUSTOMER INFO</h5>
//             </div>
//             <div className="csh-section-body">
//               <div className="csh-grid-2">
//                 <div className="csh-field" ref={customerSearchRef} style={{ position: "relative" }}>
//                   <label>SEARCH CUSTOMER</label>
//                   <div style={{ position: "relative" }}>
//                     <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#999", fontSize: "14px", pointerEvents: "none" }} />
//                     <input
//                       type="text"
//                       value={customerSearchTerm}
//                       onChange={(e) => {
//                         setCustomerSearchTerm(e.target.value);
//                         setShowCustomerDropdown(true);
//                       }}
//                       onFocus={() => setShowCustomerDropdown(true)}
//                       className="csh-input"
//                       placeholder="Name, account, email, or phone..."
//                       style={{ paddingLeft: "32px" }}
//                     />
//                     <FaChevronDown style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#999", fontSize: "12px", pointerEvents: "none" }} />
//                   </div>
//                   {showCustomerDropdown && filteredCustomers.length > 0 && (
//                     <div style={{
//                       position: "absolute",
//                       top: "100%",
//                       left: 0,
//                       right: 0,
//                       maxHeight: "200px",
//                       overflowY: "auto",
//                       background: "white",
//                       border: "1px solid #ddd",
//                       borderRadius: "4px",
//                       boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
//                       zIndex: 1000,
//                       marginTop: "4px"
//                     }}>
//                       {filteredCustomers.map((customer) => {
//                         const name = `${customer.firstName || ""} ${customer.surname || ""}`.trim() || customer.customerName || "Unknown";
//                         return (
//                           <div
//                             key={customer.id || customer.accountNumber}
//                             onClick={() => selectCustomer(customer)}
//                             style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #eee" }}
//                             onMouseEnter={(e) => e.target.style.background = "#f5f5f5"}
//                             onMouseLeave={(e) => e.target.style.background = "white"}
//                           >
//                             <div style={{ fontWeight: 500 }}>{name}</div>
//                             <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>
//                               Acct: {customer.accountNumber || "N/A"} • {customer.phoneNumber || "No phone"}
//                             </div>
//                           </div>
//                         );
//                       })}
//                     </div>
//                   )}
//                 </div>

//                 <div className="csh-field">
//                   <label>ACCOUNT NUMBER</label>
//                   <input
//                     type="text"
//                     value={formData.customerInfo.accountNumber}
//                     className="csh-input"
//                     readOnly
//                     style={{ background: "#f5f5f5" }}
//                   />
//                 </div>
//               </div>

//               <div className="csh-grid-2">
//                 <div className="csh-field">
//                   <label>ADDRESS</label>
//                   <input
//                     type="text"
//                     value={formData.customerInfo.address}
//                     className="csh-input"
//                     readOnly
//                     style={{ background: "#f5f5f5" }}
//                   />
//                 </div>

//                 <div className="csh-field">
//                   <label>PHONE NUMBER</label>
//                   <input
//                     type="text"
//                     value={formData.customerInfo.phoneNumber}
//                     className="csh-input"
//                     readOnly
//                     style={{ background: "#f5f5f5" }}
//                   />
//                 </div>
//               </div>

//               <div className="csh-grid-2">
//                 <div className="csh-field">
//                   <label>EMAIL</label>
//                   <input
//                     type="email"
//                     value={formData.customerInfo.email}
//                     className="csh-input"
//                     readOnly
//                     style={{ background: "#f5f5f5" }}
//                   />
//                 </div>

//                 <div className="csh-field">
//                   <label>GENDER</label>
//                   <input
//                     type="text"
//                     value={formData.customerInfo.gender}
//                     className="csh-input"
//                     readOnly
//                     style={{ background: "#f5f5f5" }}
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* LOAN INFO */}
//           <div className="csh-section">
//             <div className="csh-section-header">
//               <h5>LOAN</h5>
//             </div>
//             <div className="csh-section-body">
//               <div className="csh-grid-3">
//                 <div className="csh-field">
//                   <label>LOAN TYPE</label>
//                   <select
//                     value={formData.loanInfo.loanType}
//                     onChange={(e) => handleChange(e, "loanInfo", "loanType")}
//                     className="csh-select"
//                   >
//                     <option value="">SELECT LOAN TYPE</option>
//                     <option value="Personal">Personal Loan</option>
//                     <option value="Business">Business Loan</option>
//                     <option value="Mortgage">Mortgage</option>
//                     <option value="Auto">Auto Loan</option>
//                   </select>
//                 </div>

//                 <div className="csh-field">
//                   <label>PRODUCT AMOUNT (₦)</label>
//                   <input
//                     type="number"
//                     value={formData.loanInfo.productAmount}
//                     onChange={(e) => handleChange(e, "loanInfo", "productAmount")}
//                     className="csh-input"
//                     style={{ fontWeight: "bold", color: "#2e7d32" }}
//                     step="0.01"
//                   />
//                 </div>

//                 <div className="csh-field">
//                   <label>REPAYMENT METHOD</label>
//                   <select
//                     value={formData.loanInfo.repaymentMethod}
//                     onChange={(e) => handleChange(e, "loanInfo", "repaymentMethod")}
//                     className="csh-select"
//                   >
//                     <option value="Monthly">Monthly</option>
//                     <option value="Quarterly">Quarterly</option>
//                     <option value="Bi-Annual">Bi-Annual</option>
//                     <option value="Annual">Annual</option>
//                   </select>
//                 </div>

//                 <div className="csh-field">
//                   <label>DURATION (Months)</label>
//                   <input
//                     type="number"
//                     value={formData.loanInfo.duration}
//                     onChange={(e) => handleChange(e, "loanInfo", "duration")}
//                     className="csh-input"
//                     placeholder="Enter months"
//                     min="1"
//                     step="1"
//                   />
//                 </div>

//                 <div className="csh-field">
//                   <label>INTEREST RATE (%)</label>
//                   <input
//                     type="number"
//                     value={formData.loanInfo.rate}
//                     onChange={(e) => handleChange(e, "loanInfo", "rate")}
//                     className="csh-input"
//                     placeholder="Enter interest rate"
//                     min="0"
//                     step="0.1"
//                   />
//                 </div>

//                 <div className="csh-field">
//                   <label>INTEREST ON LOAN (₦)</label>
//                   <input
//                     type="number"
//                     value={formData.loanInfo.interestOnLoan}
//                     className="csh-input"
//                     readOnly
//                     style={{ background: "#f5f5f5", fontWeight: "bold", color: "#dc3545" }}
//                   />
//                 </div>

//                 <div className="csh-field">
//                   <label>PRINCIPAL REPAYMENT (₦/month)</label>
//                   <input
//                     type="number"
//                     value={formData.loanInfo.principalRepayment}
//                     className="csh-input"
//                     readOnly
//                     style={{ background: "#f5f5f5", fontWeight: "bold", color: "#0867db" }}
//                   />
//                 </div>

//                 <div className="csh-field">
//                   <label>MONTHLY PAYMENT (₦)</label>
//                   <input
//                     type="number"
//                     value={formData.loanInfo.monthlyPayment}
//                     className="csh-input"
//                     readOnly
//                     style={{ background: "#f5f5f5", fontWeight: "bold", color: "#2e7d32" }}
//                   />
//                 </div>

//                 <div className="csh-field">
//                   <label>START DATE</label>
//                   <input
//                     type="date"
//                     value={formData.loanInfo.startDate}
//                     onChange={(e) => handleChange(e, "loanInfo", "startDate")}
//                     className="csh-input"
//                   />
//                 </div>

//                 <div className="csh-field">
//                   <label>OFFICER IN CHARGE</label>
//                   <input
//                     type="text"
//                     value={formData.loanInfo.officerInCharge}
//                     onChange={(e) => handleChange(e, "loanInfo", "officerInCharge")}
//                     className="csh-input"
//                     placeholder="Enter officer name"
//                   />
//                 </div>

//                 <div className="csh-field">
//                   <label>UPFRONT CHARGES (₦)</label>
//                   <input
//                     type="number"
//                     value={formData.loanInfo.upfrontCharges}
//                     onChange={(e) => handleChange(e, "loanInfo", "upfrontCharges")}
//                     className="csh-input"
//                     placeholder="0"
//                     min="0"
//                     step="0.01"
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* INSERT RECORD BUTTON */}
//           {formData.productInfo.productName && (
//             <div className="csh-button-container">
//               <button type="button" onClick={handleInsertRecord} className="csh-btn csh-btn-primary">
//                 ➕ INSERT RECORD
//               </button>
//             </div>
//           )}

//           {/* PRODUCT TABLE */}
//           {productTable.length > 0 && (
//             <div className="csh-section">
//               <div className="csh-section-header">
//                 <h5>PRODUCT LIST</h5>
//               </div>
//               <div className="csh-table-container" style={{ overflowX: 'auto' }}>
//                 <table className="csh-table" style={{ width: '100%' }}>
//                   <thead>
//                     <tr>
//                       <th>#</th>
//                       <th>PRODUCT</th>
//                       <th>ID</th>
//                       <th>DESCRIPTION</th>
//                       <th>CATEGORY</th>
//                       <th>PRICE</th>
//                       <th>QTY</th>
//                       <th>DISC</th>
//                       <th>TOTAL</th>
//                       <th>ACTION</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {productTable.map((product, idx) => (
//                       <tr key={product.id}>
//                         <td>{idx + 1}</td>
//                         <td style={{ fontWeight: "500" }}>{product.productName}</td>
//                         <td>{product.productId}</td>
//                         <td>{product.description?.substring(0, 30) || "-"}</td>
//                         <td>{product.category || "-"}</td>
//                         <td>₦{product.unitPrice.toLocaleString()}</td>
//                         <td>{product.quantity}</td>
//                         <td>{product.discount > 0 ? `${product.discount}%` : "-"}</td>
//                         <td style={{ fontWeight: 'bold', color: '#2e7d32' }}>₦{product.total.toLocaleString()}</td>
//                         <td>
//                           <button 
//                             onClick={() => removeProduct(idx)} 
//                             style={{ 
//                               background: '#dc3545', 
//                               color: 'white', 
//                               border: 'none', 
//                               borderRadius: '4px', 
//                               padding: '4px 10px', 
//                               cursor: 'pointer',
//                               fontSize: '12px'
//                             }}
//                           >
//                             ✕ Remove
//                           </button>
//                         </td>
//                       </tr>
//                     ))}
//                     <tr style={{ background: '#f8f9fa', fontWeight: 'bold' }}>
//                       <td colSpan="8" style={{ textAlign: 'right', fontSize: '16px' }}>GRAND TOTAL:</td>
//                       <td colSpan="2" style={{ color: '#2e7d32', fontSize: '18px', fontWeight: 'bold' }}>
//                         ₦{calculateTotal().toLocaleString()}
//                       </td>
//                     </tr>
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           )}

//           {/* BUTTONS */}
//           <div className="csh-button-container" style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginTop: '20px' }}>
//             <button 
//               type="button" 
//               onClick={handleGenerateSchedule}
//               className="csh-btn"
//               disabled={productTable.length === 0 || loading}
//               style={{ 
//                 background: '#6c757d', 
//                 color: 'white', 
//                 padding: '12px 24px', 
//                 borderRadius: '6px', 
//                 border: 'none', 
//                 cursor: productTable.length === 0 || loading ? 'not-allowed' : 'pointer', 
//                 fontWeight: '600',
//                 opacity: productTable.length === 0 || loading ? 0.6 : 1
//               }}
//             >
//               📅 GENERATE REPAYMENT SCHEDULE
//             </button>
//             <button 
//               type="submit"
//               className="csh-btn csh-btn-primary"
//               disabled={loading || productTable.length === 0 || !formData.customerInfo.customerName}
//               style={{ 
//                 background: '#0867db', 
//                 color: 'white', 
//                 padding: '12px 24px', 
//                 borderRadius: '6px', 
//                 border: 'none', 
//                 cursor: (loading || productTable.length === 0 || !formData.customerInfo.customerName) ? 'not-allowed' : 'pointer', 
//                 fontWeight: '600',
//                 opacity: (loading || productTable.length === 0 || !formData.customerInfo.customerName) ? 0.6 : 1
//               }}
//             >
//               {loading ? "💾 SAVING..." : `💾 SAVE CREDIT SALE (${productTable.length} items)`}
//             </button>
//           </div>

//           {/* Generated Schedule Display */}
//           {generatedSchedule && (
//             <div className="csh-section" style={{ marginTop: '20px' }}>
//               <div className="csh-section-header">
//                 <h5>GENERATE REPAYMENT SCHEDULE</h5>
//               </div>
//               <div className="csh-section-body">
//                 <div className="csh-grid-3">
//                   <div className="csh-field">
//                     <label>MONTHLY PAYMENT</label>
//                     <input 
//                       type="text" 
//                       value={formatCurrency(generatedSchedule.monthlyPayment)} 
//                       className="csh-input" 
//                       readOnly 
//                       style={{ background: "#f5f5f5", fontWeight: "bold", color: "#2e7d32", fontSize: "16px" }} 
//                     />
//                   </div>
//                   <div className="csh-field">
//                     <label>TOTAL INTEREST</label>
//                     <input 
//                       type="text" 
//                       value={formatCurrency(generatedSchedule.totalInterest)} 
//                       className="csh-input" 
//                       readOnly 
//                       style={{ background: "#f5f5f5", fontSize: "16px" }} 
//                     />
//                   </div>
//                   <div className="csh-field">
//                     <label>TOTAL REPAYMENT</label>
//                     <input 
//                       type="text" 
//                       value={formatCurrency(generatedSchedule.totalRepayment)} 
//                       className="csh-input" 
//                       readOnly 
//                       style={{ background: "#f5f5f5", fontWeight: "bold", fontSize: "16px" }} 
//                     />
//                   </div>
//                 </div>
                
//                 {generatedSchedule.payments && generatedSchedule.payments.length > 0 && (
//                   <div className="csh-table-container" style={{ marginTop: '20px', overflowX: 'auto' }}>
//                     <table className="csh-table" style={{ width: '100%' }}>
//                       <thead>
//                         <tr>
//                           <th>DUE DATE</th>
//                           <th>PRINCIPAL</th>
//                           <th>INTEREST</th>
//                           <th>TOTAL PAYMENT</th>
//                           <th>REMAINING BALANCE</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {generatedSchedule.payments.map((payment, idx) => (
//                           <tr key={idx}>
//                             <td>{payment.dueDate}</td>
//                             <td>{formatCurrency(payment.principal)}</td>
//                             <td>{formatCurrency(payment.interest)}</td>
//                             <td>{formatCurrency(payment.totalPayment)}</td>
//                             <td>{formatCurrency(payment.remainingBalance)}</td>
//                           </tr>
//                         ))}
//                       </tbody>
//                       <tfoot>
//                         <tr style={{ background: '#f8f9fa', fontWeight: 'bold' }}>
//                           <td colSpan="3" style={{ textAlign: 'right' }}>GRAND TOTAL:</td>
//                           <td colSpan="2">{formatCurrency(generatedSchedule.totalRepayment)}</td>
//                         </tr>
//                       </tfoot>
//                     </table>
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}
//         </form>
//       </div>
//     </div>
//   );
// };

// export default CreditSales;


import React, { useState, useEffect, useRef } from "react";
import BranchBadge from "../../../../shared/BranchBadge";
import "./CreditSales.css";
import { FaTimes, FaSearch, FaChevronDown } from "react-icons/fa";
import { IoGridOutline } from "react-icons/io5";
import * as XLSX from "xlsx";
import { apiRequest } from "../../../../../lib/config";
import { fetchSellableProducts } from "../../../../../lib/inventoryApi";
import { salesApi } from "../../../../../lib/salesApi";
import { useAuth } from "../../../../../context/AuthContext";
import pmLogo from "../../../../../assets/images/PMlogo.png";

const CreditSales = ({ toggleCdsModal }) => {
  const { user } = useAuth();

  const closeModal = () => {
    toggleCdsModal();
  };

  // State for form data
  const [paymentOptions, setPaymentOptions] = useState([]);

  const [formData, setFormData] = useState({
    fulfillmentType: "pickup",
    productInfo: {
      productName: "",
      productId: "",
      referenceNo: "",
      category: "",
      subCategory: "",
      description: "",
      price: "",
      unitPrice: "",
      quantity: "1",
      discount: "0",
      coupon: "",
    },
    customerInfo: {
      customerName: "",
      address: "",
      phoneNumber: "",
      email: "",
      accountNumber: "",
      surname: "",
      firstName: "",
      dob: "",
      occupation: "",
      nationality: "",
      nin: "",
      gender: "",
      customerBankAccount: "",
    },
    shipment: {
      shippingMethod: "",
      shippingStatus: "",
      trackingNumber: "",
      vehiclePlateNumber: "",
      shippingAddress: "",
      shippingCost: "",
    },
    loanInfo: {
      loanType: "",
      paymentOption: "",
      productAmount: "",
      repaymentMethod: "Monthly",
      duration: "12",
      rate: "10",
      interestOnLoan: "",
      principalRepayment: "",
      startDate: new Date().toISOString().split('T')[0],
      expirationDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      officerInCharge: "",
      upfrontCharges: "0",
      monthlyPayment: ""
    }
  });

  // Search states
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productSearchRef = useRef(null);

  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerSearchRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [generatedSchedule, setGeneratedSchedule] = useState(null);
  const [payingFirstInstallment, setPayingFirstInstallment] = useState(false);

  // Set once the first-installment Paystack payment is verified as successful — the
  // credit sale draft has already been filed for admin approval at that point, so the
  // form fields stay on screen (mirroring walk-in Cash Sales) purely so the cashier can
  // print a "PAID" receipt or close the modal. paidReference is the Paystack reference
  // of that confirmed payment, used on the receipt.
  const [isPaid, setIsPaid] = useState(false);
  const [paidReference, setPaidReference] = useState("");

  // Generate auto-reference number
  const generateReferenceNo = () => {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PROWIT${timestamp.slice(-4)}${random}`;
  };

  // Auto-generate reference number on mount
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      productInfo: {
        ...prev.productInfo,
        referenceNo: generateReferenceNo()
      }
    }));
  }, []);

  // Filter products
  useEffect(() => {
    if (!productSearchTerm.trim()) {
      setFilteredProducts([]);
      return;
    }

    const term = productSearchTerm.toLowerCase();
    const filtered = products.filter(p => {
      const name = (p.productName || p.name || "").toLowerCase();
      const id = (p.id?.toString() || p.productId?.toString() || "").toLowerCase();
      const cat = (p.category?.name || p.category || "").toLowerCase();
      return name.includes(term) || id.includes(term) || cat.includes(term);
    }).slice(0, 10);
    
    setFilteredProducts(filtered);
  }, [productSearchTerm, products]);

  // Filter customers — local list first, then a live backend search so accounts
  // registered after this screen opened still resolve.
  useEffect(() => {
    if (!customerSearchTerm.trim()) {
      setFilteredCustomers([]);
      return;
    }

    const term = customerSearchTerm.toLowerCase();
    const matches = (c) => {
      const name = `${c.firstName || ""} ${c.surname || ""}`.toLowerCase();
      const account = (c.accountNumber || "").toLowerCase();
      const email = (c.email || "").toLowerCase();
      const phone = (c.phoneNumber || "").toLowerCase();
      return name.includes(term) || account.includes(term) || email.includes(term) || phone.includes(term);
    };

    const localMatches = customers.filter(matches).slice(0, 10);
    setFilteredCustomers(localMatches);

    if (localMatches.length > 0 || customerSearchTerm.trim().length < 3) {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const response = await apiRequest(
          `/admin/customers/search?query=${encodeURIComponent(customerSearchTerm.trim())}`,
          "GET"
        );
        const rows =
          response?.response?.content ||
          response?.data?.content ||
          response?.content ||
          (Array.isArray(response?.response) ? response.response : null) ||
          (Array.isArray(response) ? response : null) ||
          [];
        if (!cancelled && Array.isArray(rows) && rows.length > 0) {
          setFilteredCustomers(rows.slice(0, 10));
        }
      } catch {
        // Keep the local result if the backend search fails.
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [customerSearchTerm, customers]);

  // Close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (productSearchRef.current && !productSearchRef.current.contains(event.target)) {
        setShowProductDropdown(false);
      }
      if (customerSearchRef.current && !customerSearchRef.current.contains(event.target)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchPaymentOptions();
  }, []);

  const fetchPaymentOptions = async () => {
    try {
      const response = await apiRequest("/sales/loan/payment-options", "GET");
      const options = response?.response || response?.data || response || [];
      setPaymentOptions(Array.isArray(options) ? options : []);
    } catch (err) {
      console.error("Error fetching payment options:", err);
      setPaymentOptions([]);
    }
  };

  // Sell from stock (not the product register): only in-stock products appear,
  // priced from the stock record.
  const fetchProducts = async () => {
    try {
      setFetching(true);
      const productsList = await fetchSellableProducts();
      setProducts(productsList);
    } catch (err) {
      console.error("Error fetching stock for sale:", err);
      setProducts([]);
    } finally {
      setFetching(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      setFetching(true);
      const response = await apiRequest("/admin/customers", "GET");
      
      let customersList = [];
      if (response?.response && Array.isArray(response.response)) {
        customersList = response.response;
      } else if (Array.isArray(response)) {
        customersList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        customersList = response.data;
      }
      
      setCustomers(customersList);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setCustomers([]);
    } finally {
      setFetching(false);
    }
  };

  // Calculate loan interest
  const calculateLoanInterest = (amount, rate, duration) => {
    if (!amount || amount <= 0 || !rate || rate <= 0 || !duration || duration <= 0) {
      return 0;
    }
    return (amount * rate * duration) / 100 / 12;
  };

  // Calculate principal repayment
  const calculatePrincipalRepayment = (amount, duration) => {
    if (!amount || amount <= 0 || !duration || duration <= 0) {
      return 0;
    }
    return amount / duration;
  };

  // Update loan calculations
  const updateLoanCalculations = () => {
    const productAmount = parseFloat(formData.loanInfo.productAmount) || 0;
    const interestRate = parseFloat(formData.loanInfo.rate) || 0;
    const loanDuration = parseInt(formData.loanInfo.duration) || 0;
    
    if (productAmount > 0 && interestRate > 0 && loanDuration > 0) {
      const interest = calculateLoanInterest(productAmount, interestRate, loanDuration);
      const principal = calculatePrincipalRepayment(productAmount, loanDuration);
      const monthlyPayment = principal + (interest / loanDuration);
      
      setFormData(prev => ({
        ...prev,
        loanInfo: {
          ...prev.loanInfo,
          interestOnLoan: interest.toFixed(2),
          principalRepayment: principal.toFixed(2),
          monthlyPayment: monthlyPayment.toFixed(2)
        }
      }));
    }
  };

  // Select product
  const selectProduct = (product) => {
    const price = product.sellingPrice || product.price || product.unitPrice || 0;
    const quantity = 1;
    const productAmount = price * quantity;
    
    setFormData(prev => ({
      ...prev,
      productInfo: {
        ...prev.productInfo,
        productName: product.productName || product.name || "",
        productId: (product.id?.toString() || product.productId?.toString() || ""),
        // Friendly system-generated code (PM-PD-####) for display; productId stays numeric for the API.
        // Falls back to a padded sequential code derived from the numeric id so the
        // PRODUCT ID always follows a system sequence, never a bare/blank number.
        productCode:
          product.productCode ||
          (product.id != null ? `PM-PD-${String(product.id).padStart(4, "0")}` : ""),
        category: product.category?.name || product.category || "",
        subCategory: product.subCategory?.name || product.subCategory || "",
        description: product.productDescription || product.description || "",
        price: price.toString(),
        unitPrice: price.toString(),
        quantity: quantity.toString(),
        discount: "0",
        coupon: "",
      },
      loanInfo: {
        ...prev.loanInfo,
        productAmount: productAmount.toString()
      }
    }));
    
    setProductSearchTerm(product.productName || product.name || "");
    setShowProductDropdown(false);
    
    setTimeout(() => {
      updateLoanCalculations();
    }, 100);
  };

  // Select customer
  const selectCustomer = (customer) => {
    const fullName = `${customer.firstName || ""} ${customer.surname || ""}`.trim() || 
                     customer.customerName || customer.name || "Unknown";
    
    setFormData(prev => ({
      ...prev,
      customerInfo: {
        ...prev.customerInfo,
        customerName: fullName,
        accountNumber: customer.accountNumber || "",
        email: customer.email || "",
        phoneNumber: customer.phoneNumber || "",
        address: customer.contactAddress || customer.officeAddress || "",
        surname: customer.surname || "",
        firstName: customer.firstName || "",
        dob: customer.dob || "",
        occupation: customer.occupation || "",
        nationality: customer.nationality || "",
        nin: customer.nin || "",
        gender: customer.gender ? customer.gender.toUpperCase() : "",
        customerBankAccount: customer.bvn || "",
      }
    }));
    setCustomerSearchTerm(fullName);
    setShowCustomerDropdown(false);
  };

  const handleChange = (e, section, field) => {
    const value = e.target.value;
    
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));

    // Auto-calculate product amount when quantity or discount changes
    if (section === "productInfo" && (field === "price" || field === "quantity" || field === "discount")) {
      setTimeout(() => {
        const price = parseFloat(formData.productInfo.price) || 0;
        const quantity = parseInt(formData.productInfo.quantity) || 1;
        const discount = parseFloat(formData.productInfo.discount) || 0;
        const productAmount = price * quantity * (1 - discount/100);
        
        setFormData(prev => ({
          ...prev,
          loanInfo: {
            ...prev.loanInfo,
            productAmount: productAmount.toFixed(2)
          }
        }));
        
        setTimeout(() => {
          updateLoanCalculations();
        }, 50);
      }, 0);
    }

    // Auto-calculate interest when amount, rate, or duration changes
    if (section === "loanInfo" && (field === "productAmount" || field === "rate" || field === "duration")) {
      setTimeout(() => {
        updateLoanCalculations();
      }, 50);
    }

    // Changing the duration after a schedule was generated makes that schedule stale -
    // MAKE PAYMENT must lock again until GENERATE REPAYMENT SCHEDULE is re-run for the
    // new duration (see canPayFirstInstallment, which requires generatedSchedule).
    if (section === "loanInfo" && field === "duration") {
      setGeneratedSchedule(null);
    }
  };

  const handleFulfillmentTypeChange = (value) => {
    setFormData((prev) => ({ ...prev, fulfillmentType: value }));
  };

  const handleGenerateSchedule = async () => {
    if (!formData.productInfo.productName) {
      setError("Please select a product first");
      setTimeout(() => setError(""), 3000);
      return;
    }

    const totalAmount = parseFloat(formData.loanInfo.productAmount) || 0;
    
    const loanData = {
      productAmount: totalAmount,
      loanType: formData.loanInfo.loanType || "Personal",
      repaymentMethod: formData.loanInfo.repaymentMethod || "Monthly",
      duration: parseInt(formData.loanInfo.duration) || 12,
      rate: parseFloat(formData.loanInfo.rate) || 10,
      startDate: formData.loanInfo.startDate || new Date().toISOString().split('T')[0]
    };

    try {
      setLoading(true);
      setError("");
      
      const response = await apiRequest("/sales/loan/calculate-schedule", "POST", loanData);
      
      let scheduleData = null;
      if (response?.response) {
        scheduleData = response.response;
      } else if (response?.data) {
        scheduleData = response.data;
      } else {
        scheduleData = response;
      }
      
      if (scheduleData) {
        const schedule = {
          monthlyPayment: scheduleData.perPeriodPayment || 0,
          totalInterest: scheduleData.interestOnLoan || 0,
          totalRepayment: scheduleData.totalRepayment || (totalAmount + (scheduleData.interestOnLoan || 0)),
          numberOfPayments: scheduleData.numberOfPayments || parseInt(formData.loanInfo.duration) || 12,
          payments: scheduleData.schedule || []
        };
        
        setGeneratedSchedule(schedule);
        
        setFormData(prev => ({
          ...prev,
          loanInfo: {
            ...prev.loanInfo,
            monthlyPayment: schedule.monthlyPayment.toFixed(2),
            interestOnLoan: schedule.totalInterest.toFixed(2)
          }
        }));
        
        setSuccess(`✅ Schedule generated! Monthly payment: ₦${schedule.monthlyPayment.toLocaleString()}`);
        setTimeout(() => setSuccess(""), 5000);
      }
    } catch (err) {
      console.error("Error generating schedule:", err);
      setError(err?.message || "Failed to generate repayment schedule");
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  // First installment amount owed. Prefers the backend-generated schedule's first
  // row/monthlyPayment when available, otherwise falls back to the monthly payment
  // computed client-side (updateLoanCalculations) so the pay button works before the
  // repayment schedule has been generated.
  const getFirstInstallmentAmount = () => {
    const firstPayment = generatedSchedule?.payments?.[0];
    const amount = parseFloat(
      firstPayment?.amountDue ??
        firstPayment?.totalPayment ??
        generatedSchedule?.monthlyPayment ??
        formData.loanInfo.monthlyPayment
    );
    return Number.isFinite(amount) ? amount : 0;
  };

  // Whether the MAKE PAYMENT button should be enabled: same core fields SAVE CREDIT
  // SALE requires, plus a customer email (Paystack needs it), a computed amount, and
  // a generated repayment schedule (GENERATE REPAYMENT SCHEDULE must be clicked first).
  const canPayFirstInstallment = () => {
    return !!(
      generatedSchedule &&
      formData.productInfo.productName &&
      formData.customerInfo.customerName &&
      formData.customerInfo.accountNumber &&
      formData.customerInfo.email &&
      formData.loanInfo.loanType &&
      getFirstInstallmentAmount() > 0
    );
  };

  // Pay the first installment via Paystack before the credit sale has even been submitted.
  // No SalesOrder/LoanDetails exist yet at this point, so the draft rides through Paystack's
  // metadata (see SalesService.initializeCreditFirstInstallmentPayment) and the order is
  // created immediately once the payment verifies (SalesService.verifyCreditFirstInstallmentPayment)
  // — no admin pre-approval gate, per order_rules.txt #2b.
  //
  // Opens Paystack's hosted checkout in a popup (instead of navigating this tab away) so the
  // form data entered here survives the round trip, matching walk-in Cash Sales. The popup
  // runs CreditFirstInstallmentCallback, which verifies the payment and closes itself; we
  // then re-verify (idempotent — just returns the already-created order) to learn
  // the outcome and unlock the "paid" receipt watermark without ever leaving this modal.
  const handlePayFirstInstallment = async () => {
    setError("");
    setSuccess("");

    if (!generatedSchedule) {
      setError("Please generate the repayment schedule first");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (!formData.productInfo.productName || !formData.loanInfo.loanType) {
      setError("Please select a product and loan type first");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (!formData.customerInfo.customerName || !formData.customerInfo.accountNumber) {
      setError("Please select a valid customer");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (!formData.customerInfo.email) {
      setError("Customer email is required to pay via Paystack");
      setTimeout(() => setError(""), 3000);
      return;
    }

    const firstInstallmentAmount = getFirstInstallmentAmount();
    if (firstInstallmentAmount <= 0) {
      setError("Could not determine the first installment amount");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setPayingFirstInstallment(true);
    try {
      const callbackUrl = `${window.location.origin}/orders/credit-sales/first-installment/callback`;

      const saleData = {
        productInfo: {
          productName: formData.productInfo.productName || "",
          productId: formData.productInfo.productId || "",
          referenceNo: formData.productInfo.referenceNo || "",
          category: formData.productInfo.category || "",
          subCategory: formData.productInfo.subCategory || "",
          description: formData.productInfo.description || "",
          price: parseFloat(formData.productInfo.price) || 0,
          unitPrice: parseFloat(formData.productInfo.unitPrice) || 0,
          quantity: parseInt(formData.productInfo.quantity) || 1,
          discount: parseFloat(formData.productInfo.discount) || 0,
          coupon: formData.productInfo.coupon || ""
        },
        customerInfo: {
          customerName: formData.customerInfo.customerName || "",
          accountNumber: formData.customerInfo.accountNumber || "",
          email: formData.customerInfo.email || "",
          phoneNumber: formData.customerInfo.phoneNumber || "",
          address: formData.customerInfo.address || "",
          dob: formData.customerInfo.dob || "",
          gender: formData.customerInfo.gender || "",
          occupation: formData.customerInfo.occupation || "",
          customerBankAccount: formData.customerInfo.customerBankAccount || ""
        },
        loanInfo: {
          loanType: formData.loanInfo.loanType || "",
          productAmount: parseFloat(formData.loanInfo.productAmount) || 0,
          repaymentMethod: formData.loanInfo.repaymentMethod || "Monthly",
          duration: formData.loanInfo.duration || "12",
          rate: parseFloat(formData.loanInfo.rate) || 0,
          interestOnLoan: parseFloat(formData.loanInfo.interestOnLoan) || 0,
          principalRepayment: parseFloat(formData.loanInfo.principalRepayment) || 0,
          startDate: formData.loanInfo.startDate || new Date().toISOString().split('T')[0],
          expirationDate: formData.loanInfo.expirationDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          officerInCharge: formData.loanInfo.officerInCharge || "",
          upfrontCharges: parseFloat(formData.loanInfo.upfrontCharges) || 0
        },
        fulfillmentType: formData.fulfillmentType === "delivery" ? "DELIVERY" : "PICKUP",
      };

      const response = await salesApi.initializeCreditFirstInstallmentPayment({
        saleData,
        firstInstallmentAmount,
        email: formData.customerInfo.email,
        callbackUrl,
        requestedBy: user?.id || user?.userId || 0,
        comments: "Credit sale order created after first installment payment.",
      });

      const authorizationUrl =
        response?.authorizationUrl ||
        response?.authorization_url ||
        response?.checkoutUrl ||
        response?.checkout_url;
      const reference = response?.reference;

      if (!authorizationUrl || !reference) {
        throw new Error(response?.message || "Could not start Paystack payment. Please try again.");
      }

      const popup = window.open(
        authorizationUrl,
        "paystack_credit_first_installment",
        "width=520,height=720,menubar=no,toolbar=no,location=yes,status=no"
      );

      if (!popup) {
        throw new Error("Please allow popups for this site to pay via Paystack.");
      }

      await new Promise((resolve) => {
        const interval = setInterval(() => {
          if (popup.closed) {
            clearInterval(interval);
            resolve();
          }
        }, 1200);
      });

      const result = await salesApi.verifyCreditFirstInstallmentPayment(reference);
      if (result?.status === "success") {
        setIsPaid(true);
        setPaidReference(reference);
        setSuccess(
          result?.order?.id
            ? `✅ First installment confirmed. Order #${result.order.id} created and is now in Marking as Paid.`
            : "✅ First installment confirmed. Order created."
        );
        setTimeout(() => setSuccess(""), 6000);
      } else {
        setError(
          result?.message ||
            "We could not confirm this payment. If you were debited, please contact support."
        );
        setTimeout(() => setError(""), 6000);
      }
    } catch (err) {
      console.error("First installment payment error:", err);
      setError(err.message || "Failed to start first installment payment");
      setTimeout(() => setError(""), 5000);
    } finally {
      setPayingFirstInstallment(false);
    }
  };

  // Print a receipt for the current form/loan data — same pattern as walk-in Cash Sales,
  // watermarked PAID once the first installment has been confirmed, UNPAID otherwise.
  const handlePrintReceipt = () => {
    const price = parseFloat(formData.productInfo.price) || 0;
    const quantity = parseInt(formData.productInfo.quantity) || 1;
    const discount = parseFloat(formData.productInfo.discount) || 0;
    const productTotal = price * quantity * (1 - discount / 100);

    const receipt = `
CREDIT SALES RECEIPT
${new Date().toLocaleString()}

CUSTOMER INFO
Customer: ${formData.customerInfo.customerName}
Account: ${formData.customerInfo.accountNumber}
Phone: ${formData.customerInfo.phoneNumber}
Address: ${formData.customerInfo.address}

PRODUCT
${formData.productInfo.productName} - Qty: ${quantity} x ₦${price.toLocaleString()} = ₦${productTotal.toLocaleString()}

LOAN INFO
Loan Type: ${formData.loanInfo.loanType}
Product Amount: ₦${(parseFloat(formData.loanInfo.productAmount) || 0).toLocaleString()}
Repayment Method: ${formData.loanInfo.repaymentMethod}
Duration: ${formData.loanInfo.duration} months
Interest Rate: ${formData.loanInfo.rate}%
Monthly Payment: ₦${(parseFloat(formData.loanInfo.monthlyPayment) || 0).toLocaleString()}
First Installment: ${formatCurrency(getFirstInstallmentAmount())}

Reference: ${paidReference || formData.productInfo.referenceNo}
    `;

    const watermarkText = isPaid ? "PAID" : "UNPAID";
    const watermarkColor = isPaid ? "rgba(11, 143, 58, 0.28)" : "rgba(214, 44, 44, 0.28)";

    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write(`
      <html>
        <head>
          <title>Credit Sale Receipt</title>
          <style>
            body { margin: 0; }
            .csh-receipt-wrapper { position: relative; padding: 24px; overflow: hidden; }
            .csh-receipt-watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-35deg);
              font-size: 96px;
              font-weight: bold;
              letter-spacing: 8px;
              color: ${watermarkColor};
              z-index: 9999;
              pointer-events: none;
              white-space: nowrap;
            }
            pre { position: relative; z-index: 1; margin: 0; }
          </style>
        </head>
        <body>
          <div class="csh-receipt-wrapper">
            <div class="csh-receipt-watermark">${watermarkText}</div>
            <pre>${receipt}</pre>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div className="csh-modal-wrapper">
      <div className="Csh-container">
        {/* Header */}
        <div className="csh-header">
          <div className="csh-header-left">
            <img src={pmLogo} alt="PM Logo" className="csh-logo" />
          </div>
          <h1 className="csh-title">CREDIT SALES</h1>
          <div className="csh-header-right">
            <IoGridOutline className="csh-grid-icon" />
            <FaTimes className="csh-close-icon" onClick={closeModal} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", margin: "0 0 0.75rem" }}>
          <BranchBadge />
        </div>

        {error && (
          <div className="csh-alert csh-alert-error">
            <span>⚠️ {error}</span>
          </div>
        )}

        {success && (
          <div className="csh-alert csh-alert-success">
            <span>✅ {success}</span>
          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()}>
          {/* PRODUCT INFO */}
          <div className="csh-section">
            <div className="csh-section-header">
              <h5>PRODUCT INFO</h5>
            </div>
            <div className="csh-section-body">
              <div className="csh-grid-3">
                <div className="csh-field" ref={productSearchRef} style={{ position: "relative" }}>
                  <label>SEARCH PRODUCT *</label>
                  <div style={{ position: "relative" }}>
                    <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#999", fontSize: "14px", pointerEvents: "none" }} />
                    <input
                      type="text"
                      value={productSearchTerm}
                      onChange={(e) => {
                        setProductSearchTerm(e.target.value);
                        setShowProductDropdown(true);
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                      className="csh-input"
                      placeholder="Name, ID, or category..."
                      style={{ paddingLeft: "32px" }}
                    />
                    <FaChevronDown style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#999", fontSize: "12px", pointerEvents: "none" }} />
                  </div>
                  {showProductDropdown && filteredProducts.length > 0 && (
                    <div style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      maxHeight: "200px",
                      overflowY: "auto",
                      background: "white",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      zIndex: 1000,
                      marginTop: "4px"
                    }}>
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          onClick={() => selectProduct(product)}
                          style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #eee" }}
                          onMouseEnter={(e) => e.target.style.background = "#f5f5f5"}
                          onMouseLeave={(e) => e.target.style.background = "white"}
                        >
                          <div style={{ fontWeight: 500 }}>{product.productName || product.name}</div>
                          <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>
                            Code: {product.productCode || product.id} • ₦{product.sellingPrice || product.price}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="csh-field">
                  <label>PRODUCT ID</label>
                  <input
                    type="text"
                    value={formData.productInfo.productCode || formData.productInfo.productId}
                    className="csh-input"
                    readOnly
                    style={{ background: "#f5f5f5" }}
                  />
                </div>

                <div className="csh-field">
                  <label>REFERENCE NO</label>
                  <input
                    type="text"
                    value={formData.productInfo.referenceNo}
                    className="csh-input"
                    readOnly
                    style={{ background: "#f5f5f5", color: "#0867db", fontWeight: 500 }}
                  />
                </div>

                <div className="csh-field">
                  <label>CATEGORY</label>
                  <input
                    type="text"
                    value={formData.productInfo.category}
                    className="csh-input"
                    readOnly
                    style={{ background: "#f5f5f5" }}
                  />
                </div>

                <div className="csh-field">
                  <label>SUB-CATEGORY</label>
                  <input
                    type="text"
                    value={formData.productInfo.subCategory}
                    className="csh-input"
                    readOnly
                    style={{ background: "#f5f5f5" }}
                  />
                </div>

                <div className="csh-field">
                  <label>DESCRIPTION</label>
                  <textarea
                    value={formData.productInfo.description}
                    className="csh-textarea"
                    rows="2"
                    readOnly
                    style={{ background: "#f5f5f5", resize: "none" }}
                  />
                </div>

                <div className="csh-field">
                  <label>PRICE (₦) *</label>
                  <input
                    type="number"
                    value={formData.productInfo.price}
                    onChange={(e) => handleChange(e, "productInfo", "price")}
                    className="csh-input"
                    style={{ fontWeight: "bold", color: "#2e7d32" }}
                    step="0.01"
                    required
                  />
                </div>

                <div className="csh-field">
                  <label>UNIT PRICE (₦)</label>
                  <input
                    type="number"
                    value={formData.productInfo.unitPrice}
                    onChange={(e) => handleChange(e, "productInfo", "unitPrice")}
                    className="csh-input"
                    style={{ fontWeight: "bold", color: "#2e7d32" }}
                    step="0.01"
                  />
                </div>

                <div className="csh-field">
                  <label>QUANTITY</label>
                  <input
                    type="number"
                    value={formData.productInfo.quantity}
                    onChange={(e) => handleChange(e, "productInfo", "quantity")}
                    className="csh-input"
                    min="1"
                    step="1"
                  />
                </div>

                <div className="csh-field">
                  <label>DISCOUNT (%)</label>
                  <input
                    type="number"
                    value={formData.productInfo.discount}
                    onChange={(e) => handleChange(e, "productInfo", "discount")}
                    className="csh-input"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CUSTOMER INFO */}
          <div className="csh-section">
            <div className="csh-section-header">
              <h5>CUSTOMER INFO</h5>
            </div>
            <div className="csh-section-body">
              <div className="csh-grid-2">
                <div className="csh-field" ref={customerSearchRef} style={{ position: "relative" }}>
                  <label>SEARCH CUSTOMER *</label>
                  <div style={{ position: "relative" }}>
                    <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#999", fontSize: "14px", pointerEvents: "none" }} />
                    <input
                      type="text"
                      value={customerSearchTerm}
                      onChange={(e) => {
                        setCustomerSearchTerm(e.target.value);
                        setShowCustomerDropdown(true);
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      className="csh-input"
                      placeholder="Name, account, email, or phone..."
                      style={{ paddingLeft: "32px" }}
                    />
                    <FaChevronDown style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#999", fontSize: "12px", pointerEvents: "none" }} />
                  </div>
                  {showCustomerDropdown && filteredCustomers.length > 0 && (
                    <div style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      maxHeight: "200px",
                      overflowY: "auto",
                      background: "white",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      zIndex: 1000,
                      marginTop: "4px"
                    }}>
                      {filteredCustomers.map((customer) => {
                        const name = `${customer.firstName || ""} ${customer.surname || ""}`.trim() || customer.customerName || "Unknown";
                        return (
                          <div
                            key={customer.id || customer.accountNumber}
                            onClick={() => selectCustomer(customer)}
                            style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #eee" }}
                            onMouseEnter={(e) => e.target.style.background = "#f5f5f5"}
                            onMouseLeave={(e) => e.target.style.background = "white"}
                          >
                            <div style={{ fontWeight: 500 }}>{name}</div>
                            <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>
                              Acct: {customer.accountNumber || "N/A"} • {customer.phoneNumber || "No phone"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="csh-field">
                  <label>ACCOUNT NUMBER *</label>
                  <input
                    type="text"
                    value={formData.customerInfo.accountNumber}
                    className="csh-input"
                    readOnly
                    style={{ background: "#f5f5f5" }}
                  />
                </div>
              </div>

              <div className="csh-grid-2">
                <div className="csh-field">
                  <label>ADDRESS</label>
                  <input
                    type="text"
                    value={formData.customerInfo.address}
                    className="csh-input"
                    readOnly
                    style={{ background: "#f5f5f5" }}
                  />
                </div>

                <div className="csh-field">
                  <label>PHONE NUMBER</label>
                  <input
                    type="text"
                    value={formData.customerInfo.phoneNumber}
                    className="csh-input"
                    readOnly
                    style={{ background: "#f5f5f5" }}
                  />
                </div>
              </div>

              <div className="csh-grid-2">
                <div className="csh-field">
                  <label>EMAIL</label>
                  <input
                    type="email"
                    value={formData.customerInfo.email}
                    className="csh-input"
                    readOnly
                    style={{ background: "#f5f5f5" }}
                  />
                </div>

                <div className="csh-field">
                  <label>GENDER</label>
                  <input
                    type="text"
                    value={formData.customerInfo.gender}
                    className="csh-input"
                    readOnly
                    style={{ background: "#f5f5f5" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* FULFILLMENT */}
          <div className="csh-section">
            <div className="csh-section-header">
              <h5>FULFILLMENT</h5>
            </div>
            <div className="csh-section-body">
              <div className="csh-fulfillment-toggle">
                <label className={`csh-fulfillment-option ${formData.fulfillmentType === "pickup" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="creditFulfillmentType"
                    value="pickup"
                    checked={formData.fulfillmentType === "pickup"}
                    onChange={() => handleFulfillmentTypeChange("pickup")}
                  />
                  <span>Pickup</span>
                </label>
                <label className={`csh-fulfillment-option ${formData.fulfillmentType === "delivery" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="creditFulfillmentType"
                    value="delivery"
                    checked={formData.fulfillmentType === "delivery"}
                    onChange={() => handleFulfillmentTypeChange("delivery")}
                  />
                  <span>Delivery</span>
                </label>
              </div>
            </div>
          </div>

          {/* SHIPMENT - only relevant when the customer chose delivery */}
          {formData.fulfillmentType === "delivery" && (
            <div className="csh-section">
              <div className="csh-section-header">
                <h5>SHIPMENT</h5>
              </div>
              <div className="csh-section-body">
                <div className="csh-grid-3">
                  <div className="csh-field">
                    <label>SHIPPING METHOD</label>
                    <input type="text" value={formData.shipment.shippingMethod} onChange={(e) => handleChange(e, "shipment", "shippingMethod")} className="csh-input" />
                  </div>
                  <div className="csh-field">
                    <label>SHIPPING STATUS</label>
                    <select value={formData.shipment.shippingStatus} onChange={(e) => handleChange(e, "shipment", "shippingStatus")} className="csh-select">
                      <option value="">SELECT</option>
                      <option value="Pending">Pending</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>
                  <div className="csh-field">
                    <label>TRACKING NUMBER</label>
                    <input type="text" value={formData.shipment.trackingNumber} onChange={(e) => handleChange(e, "shipment", "trackingNumber")} className="csh-input" />
                  </div>
                </div>
                <div className="csh-grid-3">
                  <div className="csh-field">
                    <label>VEHICLE PLATE</label>
                    <input type="text" value={formData.shipment.vehiclePlateNumber} onChange={(e) => handleChange(e, "shipment", "vehiclePlateNumber")} className="csh-input" />
                  </div>
                  <div className="csh-field">
                    <label>SHIPPING ADDRESS</label>
                    <input type="text" value={formData.shipment.shippingAddress} onChange={(e) => handleChange(e, "shipment", "shippingAddress")} className="csh-input" />
                  </div>
                  <div className="csh-field">
                    <label>SHIPPING COST</label>
                    <input type="number" value={formData.shipment.shippingCost} onChange={(e) => handleChange(e, "shipment", "shippingCost")} className="csh-input" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LOAN INFO */}
          <div className="csh-section">
            <div className="csh-section-header">
              <h5>LOAN</h5>
            </div>
            <div className="csh-section-body">
              <div className="csh-grid-3">
                <div className="csh-field">
                  <label>LOAN TYPE *</label>
                  <select
                    value={formData.loanInfo.loanType}
                    onChange={(e) => handleChange(e, "loanInfo", "loanType")}
                    className="csh-select"
                    required
                  >
                    <option value="">-- SELECT LOAN TYPE --</option>
                    <option value="Personal">Personal Loan</option>
                    <option value="Business">Business Loan</option>
                    <option value="Mortgage">Mortgage</option>
                    <option value="Auto">Auto Loan</option>
                  </select>
                </div>

                <div className="csh-field">
                  <label>PRODUCT AMOUNT (₦) *</label>
                  <input
                    type="number"
                    value={formData.loanInfo.productAmount}
                    onChange={(e) => handleChange(e, "loanInfo", "productAmount")}
                    className="csh-input"
                    style={{ fontWeight: "bold", color: "#2e7d32" }}
                    step="0.01"
                    readOnly
                  />
                  <small style={{ fontSize: "10px", color: "#666" }}>Auto-calculated from product price × quantity</small>
                </div>

                <div className="csh-field csh-payment-option-field">
                  <label>PAYMENT OPTION</label>
                  <select
                    value={formData.loanInfo.paymentOption}
                    onChange={(e) => handleChange(e, "loanInfo", "paymentOption")}
                    className="csh-select"
                  >
                    <option value="">-- SELECT PAYMENT OPTION --</option>
                    {paymentOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div className="csh-field">
                  <label>REPAYMENT METHOD</label>
                  <select
                    value={formData.loanInfo.repaymentMethod}
                    onChange={(e) => handleChange(e, "loanInfo", "repaymentMethod")}
                    className="csh-select"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Bi-Annual">Bi-Annual</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>

                <div className="csh-field">
                  <label>DURATION (Months)</label>
                  <input
                    type="number"
                    value={formData.loanInfo.duration}
                    onChange={(e) => handleChange(e, "loanInfo", "duration")}
                    className="csh-input"
                    placeholder="Enter months"
                    min="1"
                    step="1"
                  />
                </div>

                <div className="csh-field">
                  <label>INTEREST RATE (%)</label>
                  <input
                    type="number"
                    value={formData.loanInfo.rate}
                    onChange={(e) => handleChange(e, "loanInfo", "rate")}
                    className="csh-input"
                    placeholder="Enter interest rate"
                    min="0"
                    step="0.1"
                  />
                </div>

                <div className="csh-field">
                  <label>INTEREST ON LOAN (₦)</label>
                  <input
                    type="number"
                    value={formData.loanInfo.interestOnLoan}
                    className="csh-input"
                    readOnly
                    style={{ background: "#f5f5f5", fontWeight: "bold", color: "#dc3545" }}
                  />
                </div>

                <div className="csh-field">
                  <label>PRINCIPAL REPAYMENT (₦/month)</label>
                  <input
                    type="number"
                    value={formData.loanInfo.principalRepayment}
                    className="csh-input"
                    readOnly
                    style={{ background: "#f5f5f5", fontWeight: "bold", color: "#0867db" }}
                  />
                </div>

                <div className="csh-field">
                  <label>MONTHLY PAYMENT (₦)</label>
                  <input
                    type="number"
                    value={formData.loanInfo.monthlyPayment}
                    className="csh-input"
                    readOnly
                    style={{ background: "#f5f5f5", fontWeight: "bold", color: "#2e7d32" }}
                  />
                </div>

                <div className="csh-field">
                  <label>START DATE</label>
                  <input
                    type="date"
                    value={formData.loanInfo.startDate}
                    onChange={(e) => handleChange(e, "loanInfo", "startDate")}
                    className="csh-input"
                  />
                </div>

                <div className="csh-field">
                  <label>OFFICER IN CHARGE</label>
                  <input
                    type="text"
                    value={formData.loanInfo.officerInCharge}
                    onChange={(e) => handleChange(e, "loanInfo", "officerInCharge")}
                    className="csh-input"
                    placeholder="Enter officer name"
                  />
                </div>

              </div>
            </div>
          </div>

          {/* SCHEDULE, PAYMENT & PRINT BUTTONS */}
          <div className="csh-button-container" style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button
              type="button"
              onClick={handleGenerateSchedule}
              className="csh-btn"
              disabled={!formData.productInfo.productName || loading}
              style={{
                background: '#6c757d',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '6px',
                border: 'none',
                cursor: (!formData.productInfo.productName || loading) ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                opacity: (!formData.productInfo.productName || loading) ? 0.6 : 1,
                flex: 1
              }}
            >
              📅 GENERATE REPAYMENT SCHEDULE
            </button>
            <button
              type="button"
              onClick={handlePayFirstInstallment}
              className="csh-btn"
              style={{ background: isPaid ? "#6c757d" : "#2e7d32", color: "white", flex: 1 }}
              disabled={payingFirstInstallment || isPaid || !canPayFirstInstallment()}
              title={
                !canPayFirstInstallment()
                  ? !generatedSchedule
                    ? "Generate the repayment schedule first"
                    : "Select a product, customer (with email) and loan type first"
                  : ""
              }
            >
              {payingFirstInstallment
                ? "OPENING PAYSTACK..."
                : isPaid
                ? "PAYMENT COMPLETED"
                : `💳 MAKE PAYMENT (${formatCurrency(getFirstInstallmentAmount())})`}
            </button>
            <button
              type="button"
              onClick={handlePrintReceipt}
              className="csh-btn"
              style={{ background: "#0867db", color: "white", flex: 1 }}
              disabled={!formData.productInfo.productName || !formData.customerInfo.customerName}
            >
              🖨 PRINT RECEIPT
            </button>
          </div>

          {/* Generated Schedule Display */}
          {generatedSchedule && (
            <div className="csh-section" style={{ marginTop: '20px' }}>
              <div className="csh-section-header">
                <h5>REPAYMENT SCHEDULE</h5>
              </div>
              <div className="csh-section-body">
                <div className="csh-grid-3">
                  <div className="csh-field">
                    <label>MONTHLY PAYMENT</label>
                    <input 
                      type="text" 
                      value={formatCurrency(generatedSchedule.monthlyPayment)} 
                      className="csh-input" 
                      readOnly 
                      style={{ background: "#f5f5f5", fontWeight: "bold", color: "#2e7d32", fontSize: "16px" }} 
                    />
                  </div>
                  <div className="csh-field">
                    <label>TOTAL INTEREST</label>
                    <input 
                      type="text" 
                      value={formatCurrency(generatedSchedule.totalInterest)} 
                      className="csh-input" 
                      readOnly 
                      style={{ background: "#f5f5f5", fontSize: "16px" }} 
                    />
                  </div>
                  <div className="csh-field">
                    <label>TOTAL REPAYMENT</label>
                    <input 
                      type="text" 
                      value={formatCurrency(generatedSchedule.totalRepayment)} 
                      className="csh-input" 
                      readOnly 
                      style={{ background: "#f5f5f5", fontWeight: "bold", fontSize: "16px" }} 
                    />
                  </div>
                </div>
                
                {generatedSchedule.payments && generatedSchedule.payments.length > 0 && (
                  <div>
                    <div style={{ marginTop: '20px', marginBottom: '10px', display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const data = generatedSchedule.payments.map((p, idx) => [
                            p.dueDate || `Month ${idx + 1}`,
                            parseFloat(p.principalPortion || p.principal || 0),
                            parseFloat(p.interestPortion || p.interest || 0),
                            parseFloat(p.amountDue || p.totalPayment || 0),
                            parseFloat(p.outstandingBalance || p.remainingBalance || 0),
                          ]);
                          const ws = XLSX.utils.aoa_to_sheet([
                            ["Due Date", "Principal", "Interest", "Total Payment", "Remaining Balance"],
                            ...data,
                          ]);
                          const wb = XLSX.utils.book_new();
                          XLSX.utils.book_append_sheet(wb, ws, "Repayment Schedule");
                          XLSX.writeFile(wb, "repayment-schedule.xlsx");
                        }}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        Export to Excel
                      </button>
                    </div>
                    <div className="csh-table-container" style={{ overflowX: 'auto' }}>
                      <table className="csh-table" style={{ width: '100%' }}>
                        <thead>
                          <tr>
                            <th>DUE DATE</th>
                            <th>PRINCIPAL</th>
                            <th>INTEREST</th>
                            <th>TOTAL PAYMENT</th>
                            <th>REMAINING BALANCE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {generatedSchedule.payments.map((payment, idx) => (
                            <tr key={idx}>
                              <td>{payment.dueDate || `Month ${idx + 1}`}</td>
                              <td>{formatCurrency(payment.principalPortion || payment.principal || 0)}</td>
                              <td>{formatCurrency(payment.interestPortion || payment.interest || 0)}</td>
                              <td>{formatCurrency(payment.amountDue || payment.totalPayment || 0)}</td>
                              <td>{formatCurrency(payment.outstandingBalance || payment.remainingBalance || 0)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      </div>
    </div> 
  );
};

export default CreditSales;  
