// // import React, { useState, useEffect } from "react";
// // import "./OnOneSales.css";
// // import Dashboard from "../../../../ui/DashboardBtn";
// // import { apiRequest } from "../../../../../lib/config";

// // const OnOneSales = ({ toggleOosModal }) => {
// //   const closeModal = () => {
// //     toggleOosModal();
// //   };

// //   const [formData, setFormData] = useState({
// //     productInfo: {
// //       productName: "",
// //       productId: "",
// //       referenceNo: "",
// //       category: "",
// //       subCategory: "",
// //       description: "",
// //       price: "",
// //       coupon: "",
// //     },
// //     customerInfo: {
// //       customerName: "",
// //       address: "",
// //       phoneNumber: "",
// //       email: "",
// //     },
// //     shipment: {
// //       shipmentMethod: "",
// //       shipmentStatus: "",
// //       trackingNumber: "",
// //       vehiclePlateNumber: "",
// //       shippingAddress: "",
// //       shippingCost: "",
// //     },
// //     vat: {
// //       vat: "",
// //       discount: "",
// //     },
// //   });

// //   const [products, setProducts] = useState([]);
// //   const [customers, setCustomers] = useState([]);
// //   const [loading, setLoading] = useState(false);
// //   const [fetching, setFetching] = useState(false);
// //   const [error, setError] = useState("");
// //   const [success, setSuccess] = useState(false);

// //   useEffect(() => {
// //     console.log("🚀 OnOneSales component mounted");
// //     fetchProducts();
// //     fetchCustomers();
// //   }, []);

// //   const fetchProducts = async () => {
// //     try {
// //       console.log("📦 OnOneSales: Fetching products from API...");
// //       console.log("🔗 Trying multiple product endpoints...");
// //       setFetching(true);
      
// //       let response;
      
// //       // Try multiple endpoints like in OnCreditSales
// //       try {
// //         console.log("🔄 Trying product endpoint: /api/products?size=500");
// //         response = await apiRequest("/api/products?size=500", "GET");
// //         console.log("✅ Success from /api/products:", response);
// //       } catch (err) {
// //         console.log("❌ Failed for /api/products:", err.message);
// //         try {
// //           console.log("🔄 Trying product endpoint: /products?size=500");
// //           response = await apiRequest("/products?size=500", "GET");
// //           console.log("✅ Success from /products:", response);
// //         } catch (err2) {
// //           console.log("❌ Failed for /products:", err2.message);
// //           try {
// //             console.log("🔄 Trying fallback product endpoint: /admin/products?size=500");
// //             response = await apiRequest("/admin/products?size=500", "GET");
// //             console.log("✅ Success from /admin/products:", response);
// //           } catch (fallbackErr) {
// //             console.log("❌ All product endpoints failed");
// //             throw new Error("Could not fetch products");
// //           }
// //         }
// //       }
      
// //       let productsList = [];
      
// //       // Check multiple response formats like in OnCreditSales
// //       if (response?.response?.content && Array.isArray(response.response.content)) {
// //         productsList = response.response.content;
// //         console.log(`✅ Found ${productsList.length} products in response.response.content`);
// //       } else if (Array.isArray(response)) {
// //         productsList = response;
// //         console.log(`✅ Found ${response.length} products in array response`);
// //       } else if (response?.data && Array.isArray(response.data)) {
// //         productsList = response.data;
// //         console.log(`✅ Found ${response.data.length} products in response.data`);
// //       } else if (response?.content && Array.isArray(response.content)) {
// //         productsList = response.content;
// //         console.log(`✅ Found ${response.content.length} products in response.content`);
// //       } else if (response?.response && Array.isArray(response.response)) {
// //         productsList = response.response;
// //         console.log(`✅ Found ${response.response.length} products in response.response`);
// //       } else if (response?.items && Array.isArray(response.items)) {
// //         productsList = response.items;
// //         console.log(`✅ Found ${response.items.length} products in response.items`);
// //       } else {
// //         console.warn("⚠️ Unexpected response format for products:", response);
// //         if (response) {
// //           for (const key in response) {
// //             if (Array.isArray(response[key])) {
// //               console.log(`📦 Found products in property '${key}'`);
// //               productsList = response[key];
// //               break;
// //             }
// //           }
// //         }
// //       }
      
// //       if (productsList.length === 0) {
// //         console.log("📝 No products found in API response");
// //       } else {
// //         console.log("📋 Sample product data:", productsList[0]);
// //       }
      
// //       console.log(`✅ Processed ${productsList.length} products`);
// //       setProducts(productsList);
      
// //     } catch (err) {
// //       console.error("❌ OnOneSales: Error fetching products:", err);
// //       console.error("Error details:", err.response || err);
// //       setProducts([]);
// //     } finally {
// //       setFetching(false);
// //     }
// //   };

// //   const fetchCustomers = async () => {
// //     try {
// //       console.log("👥 OnOneSales: Fetching customers from API...");
// //       console.log("🔗 Trying multiple customer endpoints...");
// //       setFetching(true);
      
// //       let response;
      
// //       // Try multiple endpoints like in OnCreditSales
// //       try {
// //         console.log("🔄 Trying customer endpoint: /api/admin/customers");
// //         response = await apiRequest("/api/admin/customers", "GET");
// //         console.log("✅ Success from /api/admin/customers:", response);
// //       } catch (err) {
// //         console.log("❌ Failed for /api/admin/customers:", err.message);
// //         try {
// //           console.log("🔄 Trying customer endpoint: /admin/customers");
// //           response = await apiRequest("/admin/customers", "GET");
// //           console.log("✅ Success from /admin/customers:", response);
// //         } catch (fallbackErr) {
// //           console.log("❌ All customer endpoints failed");
// //           throw new Error("Could not fetch customers");
// //         }
// //       }
      
// //       let customersList = [];
      
// //       // Check multiple response formats like in OnCreditSales
// //       if (response?.response && Array.isArray(response.response)) {
// //         customersList = response.response;
// //         console.log(`✅ Found ${customersList.length} customers in response.response`);
// //       } else if (Array.isArray(response)) {
// //         customersList = response;
// //         console.log(`✅ Found ${customersList.length} customers in array response`);
// //       } else if (response?.data && Array.isArray(response.data)) {
// //         customersList = response.data;
// //         console.log(`✅ Found ${response.data.length} customers in response.data`);
// //       } else if (response?.content && Array.isArray(response.content)) {
// //         customersList = response.content;
// //         console.log(`✅ Found ${response.content.length} customers in response.content`);
// //       } else {
// //         console.warn("⚠️ Unexpected response format for customers:", response);
// //       }
      
// //       if (customersList.length === 0) {
// //         console.log("📝 No customers found in API response");
// //       } else {
// //         console.log("📋 Sample customer data:", customersList[0]);
// //       }
      
// //       console.log(`✅ Processed ${customersList.length} customers`);
// //       setCustomers(customersList);
      
// //     } catch (err) {
// //       console.error("❌ OnOneSales: Error fetching customers:", err);
// //       console.error("Error details:", err.response?.data || err.response || err);
// //       setCustomers([]);
// //     } finally {
// //       setFetching(false);
// //     }
// //   };

// //   const handleChange = (e, section, field) => {
// //     const value = e.target.value;
// //     console.log(`📝 OnOneSales: Changing ${section}.${field} to:`, value);
    
// //     setFormData((prev) => ({
// //       ...prev,
// //       [section]: {
// //         ...prev[section],
// //         [field]: value,
// //       },
// //     }));

// //     // When product is selected by NAME - auto-fill all product fields (like OnCreditSales)
// //     if (section === "productInfo" && field === "productName") {
// //       console.log("🔍 OnOneSales: Looking for product with name:", value);
// //       const selectedProduct = products.find((p) => 
// //         (p.productName && p.productName.toLowerCase() === value.toLowerCase()) ||
// //         (p.name && p.name.toLowerCase() === value.toLowerCase())
// //       );
      
// //       if (selectedProduct) {
// //         console.log("✅ OnOneSales: Found product:", selectedProduct);
// //         setFormData((prev) => ({
// //           ...prev,
// //           productInfo: {
// //             ...prev.productInfo,
// //             productName: selectedProduct.productName || selectedProduct.name || "",
// //             productId: selectedProduct.id?.toString() || selectedProduct.productId || "",
// //             category: selectedProduct.category?.name || selectedProduct.category || "",
// //             subCategory: selectedProduct.subCategory?.name || selectedProduct.subCategory || selectedProduct.subcategory || "",
// //             description: selectedProduct.productDescription || selectedProduct.description || "",
// //             price: selectedProduct.sellingPrice?.toString() || selectedProduct.price?.toString() || selectedProduct.unitPrice?.toString() || "",
// //           },
// //         }));
// //       }
// //     }

// //     // When product is selected by ID (like OnCreditSales)
// //     if (section === "productInfo" && field === "productId") {
// //       console.log("🔍 OnOneSales: Looking for product with ID:", value);
// //       const selectedProduct = products.find((p) => 
// //         (p.id && p.id.toString() === value) ||
// //         (p.productId && p.productId.toString() === value)
// //       );
      
// //       if (selectedProduct) {
// //         console.log("✅ OnOneSales: Found product:", selectedProduct);
// //         setFormData((prev) => ({
// //           ...prev,
// //           productInfo: {
// //             ...prev.productInfo,
// //             productId: value,
// //             productName: selectedProduct.productName || selectedProduct.name || "",
// //             category: selectedProduct.category?.name || selectedProduct.category || "",
// //             subCategory: selectedProduct.subCategory?.name || selectedProduct.subCategory || selectedProduct.subcategory || "",
// //             description: selectedProduct.productDescription || selectedProduct.description || "",
// //             price: selectedProduct.sellingPrice?.toString() || selectedProduct.price?.toString() || selectedProduct.unitPrice?.toString() || "",
// //           },
// //         }));
// //       }
// //     }

// //     // When customer is selected - auto-fill customer details (like OnCreditSales)
// //     if (section === "customerInfo" && field === "customerName") {
// //       console.log("🔍 OnOneSales: Looking for customer with selection:", value);
      
// //       let accountNumber = "";
// //       let customerName = value;
      
// //       // Extract account number from parentheses like in OnCreditSales
// //       if (value.includes("(") && value.includes(")")) {
// //         const match = value.match(/\(([^)]+)\)/);
// //         if (match) {
// //           accountNumber = match[1].trim();
// //           customerName = value.split("(")[0].trim();
// //           console.log("🔍 OnOneSales: Extracted account number:", accountNumber);
// //           console.log("🔍 OnOneSales: Customer name:", customerName);
// //         }
// //       }
      
// //       const selectedCustomer = customers.find((c) => {
// //         const fullName = `${c.firstName || ""} ${c.surname || ""}`.trim();
// //         return (
// //           (c.accountNumber && c.accountNumber === accountNumber) ||
// //           (fullName && fullName.toLowerCase() === customerName.toLowerCase()) ||
// //           (c.customerName && c.customerName.toLowerCase() === customerName.toLowerCase()) ||
// //           (c.name && c.name.toLowerCase() === customerName.toLowerCase())
// //         );
// //       });
      
// //       if (selectedCustomer) {
// //         console.log("✅ OnOneSales: Found customer:", selectedCustomer);
        
// //         // Auto-populate all customer fields
// //         const customerData = {
// //           customerName: `${selectedCustomer.firstName || ""} ${selectedCustomer.surname || ""}`.trim() || 
// //                         selectedCustomer.customerName || selectedCustomer.name || customerName,
// //           address: selectedCustomer.contactAddress || selectedCustomer.officeAddress || selectedCustomer.address || "",
// //           phoneNumber: selectedCustomer.phoneNumber || selectedCustomer.phone || "",
// //           email: selectedCustomer.email || "",
// //         };
        
// //         console.log("📝 OnOneSales: Auto-populating customer form with:", customerData);
        
// //         setFormData((prev) => ({
// //           ...prev,
// //           customerInfo: customerData,
// //         }));
// //       }
// //     }
// //   };

// //   const handleSubmit = async (e) => {
// //     e.preventDefault();
// //     console.log("🚀 OnOneSales: Submitting online one-off sale...");
// //     console.log("📊 Form data:", formData);
    
// //     setLoading(true);
// //     setError("");
// //     setSuccess(false);

// //     // Basic validation
// //     if (!formData.productInfo.productName || !formData.productInfo.price) {
// //       const errorMsg = "Please select a product and enter price.";
// //       console.log("❌ OnOneSales: Validation failed:", errorMsg);
// //       setError(errorMsg);
// //       setLoading(false);
// //       return;
// //     }

// //     if (!formData.customerInfo.customerName || !formData.customerInfo.email) {
// //       const errorMsg = "Please select a customer and enter email.";
// //       console.log("❌ OnOneSales: Validation failed:", errorMsg);
// //       setError(errorMsg);
// //       setLoading(false);
// //       return;
// //     }

// //     try {
// //       console.log("📊 OnOneSales: Preparing request body for API...");
// //       console.log("🔗 Endpoint: /api/sales/online/one-off");
      
// //       // Create request body matching your API structure
// //       const price = parseFloat(formData.productInfo.price) || 0;
// //       const vatAmount = parseFloat(formData.vat.vat) || 0;
// //       const shippingCost = parseFloat(formData.shipment.shippingCost) || 0;
// //       const discount = parseFloat(formData.vat.discount) || 0;
      
// //       // Calculate total amount
// //       const totalAmount = price + vatAmount + shippingCost - discount;

// //       // Map to API structure from your screenshot with proper field mapping
// //       const requestBody = {
// //         productInfo: {
// //           productUser: formData.productInfo.productName || "string",
// //           retransmable: formData.productInfo.referenceNo || "string",
// //           category1: formData.productInfo.category || "string",
// //           packageKey: formData.productInfo.subCategory || "string",
// //           descriptionId: formData.productInfo.description || "string",
// //           getAll: 1, // Default value for quantity
// //           contentInfo: price,
// //           contentType: 0, // Default value
// //           statusUrl: 0, // Default value
// //           request: formData.productInfo.coupon || "string"
// //         },
// //         customerInfo: {
// //           customerName: formData.customerInfo.customerName || "string",
// //           email: formData.customerInfo.email || "string",
// //           password: "string", // Default value from screenshot
// //           address: formData.customerInfo.address || "string",
// //           code: "string", // Default value from screenshot
// //           gender: "string", // Default value from screenshot
// //           researcher: "string", // Default value from screenshot
// //           customerEnvironment: "string", // Default value from screenshot
// //           phoneNumber: formData.customerInfo.phoneNumber || "string"
// //         },
// //         foundInfo: {
// //           familyUrl: "string" // Default value from screenshot
// //         },
// //         shipment: {
// //           shipmentMethod: formData.shipment.shipmentMethod || "",
// //           shipmentStatus: formData.shipment.shipmentStatus || "",
// //           trackingNumber: formData.shipment.trackingNumber || "",
// //           vehiclePlateNumber: formData.shipment.vehiclePlateNumber || "",
// //           shippingAddress: formData.shipment.shippingAddress || formData.customerInfo.address || "",
// //           shippingCost: shippingCost
// //         },
// //         vat: {
// //           vat: vatAmount,
// //           discount: discount
// //         },
// //         totalAmount: totalAmount
// //       };

// //       console.log("📤 OnOneSales: Request body for API:", JSON.stringify(requestBody, null, 2));
// //       console.log(`💰 OnOneSales: Calculations - Price: ₦${price}, VAT: ₦${vatAmount}, Shipping: ₦${shippingCost}, Discount: ₦${discount}, Total: ₦${totalAmount}`);
      
// //       console.log("📨 OnOneSales: Sending API request to /api/sales/online/one-off");
      
// //       const response = await apiRequest("/sales/online/one-off", "POST", requestBody);
      
// //       console.log("✅ OnOneSales: API response received:", response);
      
// //       // Check if response is successful
// //       const isSuccessful = response?.status === 200 || 
// //                           response?.status === 201 || 
// //                           response?.status === "success" ||
// //                           response?.response?.status === "successful" ||
// //                           (response && typeof response === 'object' && !response.error);
      
// //       if (isSuccessful) {
// //         const successMsg = "Online one-off sale submitted successfully!";
// //         console.log("🎉 OnOneSales: Success:", successMsg);
// //         setSuccess(successMsg);
        
// //         // Reset form
// //         setFormData({
// //           productInfo: {
// //             productName: "",
// //             productId: "",
// //             referenceNo: "",
// //             category: "",
// //             subCategory: "",
// //             description: "",
// //             price: "",
// //             coupon: "",
// //           },
// //           customerInfo: {
// //             customerName: "",
// //             address: "",
// //             phoneNumber: "",
// //             email: "",
// //           },
// //           shipment: {
// //             shipmentMethod: "",
// //             shipmentStatus: "",
// //             trackingNumber: "",
// //             vehiclePlateNumber: "",
// //             shippingAddress: "",
// //             shippingCost: "",
// //           },
// //           vat: {
// //             vat: "",
// //             discount: "",
// //           },
// //         });
        
// //         console.log("🔄 OnOneSales: Form reset to initial state");

// //         setTimeout(() => {
// //           setSuccess("");
// //         }, 5000);
// //       } else {
// //         throw new Error("API returned unsuccessful response");
// //       }
      
// //     } catch (err) {
// //       console.error("❌ OnOneSales: Submit error:", err);
// //       console.error("🔍 OnOneSales: Error details:", err.response?.data || err.response || err.message || err);
      
// //       let errorMsg = "Failed to submit online one-off sale. ";
// //       if (err.response?.data?.message) {
// //         errorMsg += err.response.data.message;
// //       } else if (err.response?.data?.error) {
// //         errorMsg += err.response.data.error;
// //       } else if (err.message) {
// //         errorMsg += err.message;
// //       } else if (err.response?.statusText) {
// //         errorMsg += err.response.statusText;
// //       } else {
// //         errorMsg += "Please check your network connection and try again.";
// //       }
      
// //       setError(errorMsg);
// //       setTimeout(() => setError(""), 5000);
// //     } finally {
// //       setLoading(false);
// //       console.log("🏁 OnOneSales: Submit process completed");
// //     }
// //   };

// //   return (
// //     <div>
// //       <div className=" Csh-container" style={{ scrollbarWidth: "none" }}>
// //         <div className="sticky-top">
// //           <Dashboard style={{ position: "absolute", top: "3em" }} />
// //           <h1 className="text-center">ONLINE ONE OFF SALES</h1>
// //           <span className="adjust-cancel-btn " onClick={closeModal}>
// //             X
// //           </span>
// //         </div>

// //         {error && (
// //           <div className="alert alert-danger" role="alert">
// //             {error}
// //           </div>
// //         )}

// //         {success && (
// //           <div className="alert alert-success" role="alert">
// //             Online one-off sale submitted successfully!
// //           </div>
// //         )}

// //         {fetching && (
// //           <div className="alert alert-info" role="alert">
// //             Loading data...
// //           </div>
// //         )}

// //         <form onSubmit={handleSubmit}>
// //           {/* SECTION 1: PRODUCT INFO */}
// //           <div className="online-oneoff-section">
// //             <div className="section-header">
// //               <h5>PRODUCT INFO</h5>
// //             </div>
// //             <div className="product-box">  
// //               <div className="product-box_grid">
// //                 <div>
// //                   <label>PRODUCT NAME</label>
// //                   <br />
// //                   <select
// //                     name="productName"
// //                     className="py-1 product-box-select"
// //                     value={formData.productInfo.productName}
// //                     onChange={(e) => handleChange(e, "productInfo", "productName")}
// //                     disabled={fetching}
// //                   >
// //                     <option value="">
// //                       {products.length === 0 ? "NO PRODUCTS" : "CHOOSE PRODUCT"}
// //                     </option>
// //                     {products.map((product) => (
// //                       <option key={product.id || product.productId} value={product.productName || product.name}>
// //                         {product.productName || product.name} 
// //                         {product.sellingPrice ? ` - ₦${product.sellingPrice}` : 
// //                          product.price ? ` - ₦${product.price}` : 
// //                          product.unitPrice ? ` - ₦${product.unitPrice}` : ''}
// //                       </option>
// //                     ))}
// //                   </select>
// //                   <label>CATEGORY</label>
// //                   <br />
// //                   <input
// //                     type="text"
// //                     className="product-box-inputs"
// //                     name="category"
// //                     value={formData.productInfo.category}
// //                     onChange={(e) => handleChange(e, "productInfo", "category")}
// //                     disabled
// //                   />
// //                 </div>

// //                 <div>
// //                   <label>PRODUCT ID</label>
// //                   <br />
// //                   <select
// //                     name="productId"
// //                     className="py-1 product-box-select"
// //                     value={formData.productInfo.productId}
// //                     onChange={(e) => handleChange(e, "productInfo", "productId")}
// //                     disabled={fetching}
// //                   >
// //                     <option value="">
// //                       {products.length === 0 ? "NO PRODUCTS" : "SELECT PRODUCT"}
// //                     </option>
// //                     {products.map((product) => (
// //                       <option key={product.id || product.productId} value={product.id || product.productId}>
// //                         {product.productId || product.id} - {product.productName || product.name}
// //                       </option>
// //                     ))}
// //                   </select>
// //                   <label>SUB-CATEGORY</label>
// //                   <br />
// //                   <input
// //                     type="text"
// //                     name="subCategory"
// //                     className="product-box-inputs"
// //                     value={formData.productInfo.subCategory}
// //                     onChange={(e) => handleChange(e, "productInfo", "subCategory")}
// //                     disabled
// //                   />
// //                 </div>

// //                 <div>
// //                   <label>REFERENCE NO</label>
// //                   <br />
// //                   <input
// //                     type="text"
// //                     name="refNo"
// //                     className="product-box-inputs"
// //                     value={formData.productInfo.referenceNo}
// //                     onChange={(e) => handleChange(e, "productInfo", "referenceNo")}
// //                   />
// //                   <label>DESCRIPTION</label>
// //                   <br />
// //                   <textarea
// //                     name="description"
// //                     className="product-msg-box"
// //                     cols="30"
// //                     rows="4"
// //                     value={formData.productInfo.description}
// //                     onChange={(e) => handleChange(e, "productInfo", "description")}
// //                   ></textarea>
// //                 </div>
// //               </div>
              
// //               {/* PRICE and COUPON in separate columns */}
// //               <div className="customer-info-grid" style={{ marginTop: "2rem" }}>
// //                 <div>
// //                   <label>PRICE</label>
// //                   <br />
// //                   <input
// //                     type="number"
// //                     name="price"
// //                     className="product-box-inputs"
// //                     value={formData.productInfo.price}
// //                     onChange={(e) => handleChange(e, "productInfo", "price")}
// //                   />
// //                 </div>

// //                 <div>
// //                   <label>COUPON</label>
// //                   <br />
// //                   <input
// //                     type="text"
// //                     name="coupon"
// //                     className="product-box-inputs"
// //                     value={formData.productInfo.coupon}
// //                     onChange={(e) => handleChange(e, "productInfo", "coupon")}
// //                   />
// //                 </div>
// //               </div>
// //             </div>
// //           </div>

// //           {/* SECTION 2: CUSTOMER INFO */}
// //           <div className="online-oneoff-section">
// //             <div className="section-header">
// //               <h5>CUSTOMER INFO</h5>
// //             </div>
// //             <div className="product-box">
// //               <div className="customer-info-grid">
// //                 <div>
// //                   <label>CUSTOMER NAME</label>
// //                   <br />
// //                   <select
// //                     name="customerName"
// //                     className="py-1 product-box-select"
// //                     value={formData.customerInfo.customerName}
// //                     onChange={(e) => handleChange(e, "customerInfo", "customerName")}
// //                     disabled={fetching}
// //                   >
// //                     <option value="">
// //                       {customers.length === 0 ? "NO CUSTOMERS" : "SEARCH CUSTOMER"}
// //                     </option>
// //                     {customers.map((customer) => {
// //                       const fullName = `${customer.firstName || ""} ${customer.surname || ""}`.trim() || 
// //                                      customer.customerName || customer.name || "Unknown";
// //                       const displayText = `${fullName} (${customer.accountNumber || customer.accountNo || "No Account"})`;
// //                       return (
// //                         <option key={customer.id || customer.accountNumber} value={displayText}>
// //                           {displayText}
// //                         </option>
// //                       );
// //                     })}
// //                   </select>
// //                   <label>ADDRESS</label>
// //                   <br />
// //                   <input
// //                     type="text"
// //                     className="product-box-inputs"
// //                     name="address"
// //                     value={formData.customerInfo.address}
// //                     onChange={(e) => handleChange(e, "customerInfo", "address")}
// //                   />
// //                 </div>

// //                 <div>
// //                   <label>PHONE NUMBER</label>
// //                   <br />
// //                   <input
// //                     type="text"
// //                     name="phoneNumber"
// //                     className="product-box-inputs"
// //                     value={formData.customerInfo.phoneNumber}
// //                     onChange={(e) => handleChange(e, "customerInfo", "phoneNumber")}
// //                   />
// //                   <label>EMAIL</label>
// //                   <br />
// //                   <input
// //                     type="email"
// //                     name="email"
// //                     className="product-box-inputs"
// //                     value={formData.customerInfo.email}
// //                     onChange={(e) => handleChange(e, "customerInfo", "email")}
// //                   />
// //                 </div>
// //               </div>
// //             </div>
// //           </div>

// //           {/* SECTION 3: SHIPPMENT */}
// //           <div className="online-oneoff-section">
// //             <div className="section-header">
// //               <h5>SHIPPMENT</h5>
// //             </div>
// //             <div className="product-box">
// //               <div className="product-box_grid">
// //                 <div>
// //                   <label>SHIPPMENT METHOD</label>
// //                   <br />
// //                   <input
// //                     type="text"
// //                     className="product-box-inputs"
// //                     name="shipmentMethod"
// //                     value={formData.shipment.shipmentMethod}
// //                     onChange={(e) => handleChange(e, "shipment", "shipmentMethod")}
// //                   />
// //                 </div>

// //                 <div>
// //                   <label>SHIPPMENT STATUS</label>
// //                   <br />
// //                   <input
// //                     type="text"
// //                     className="product-box-inputs"
// //                     name="shipmentStatus"
// //                     value={formData.shipment.shipmentStatus}
// //                     onChange={(e) => handleChange(e, "shipment", "shipmentStatus")}
// //                   />
// //                 </div>

// //                 <div>
// //                   <label>TRACKING NUMBER</label>
// //                   <br />
// //                   <input
// //                     type="text"
// //                     className="product-box-inputs"
// //                     name="trackingNumber"
// //                     value={formData.shipment.trackingNumber}
// //                     onChange={(e) => handleChange(e, "shipment", "trackingNumber")}
// //                   />
// //                 </div>

// //                 <div>
// //                   <label>VEHICLE PLATE NUMBER</label>
// //                   <br />
// //                   <input
// //                     type="text"
// //                     className="product-box-inputs"
// //                     name="vehiclePlateNumber"
// //                     value={formData.shipment.vehiclePlateNumber}
// //                     onChange={(e) => handleChange(e, "shipment", "vehiclePlateNumber")}
// //                   />
// //                 </div>

// //                 <div>
// //                   <label>SHIPPING ADDRESS</label>
// //                   <br />
// //                   <input
// //                     type="text"
// //                     className="product-box-inputs"
// //                     name="shippingAddress"
// //                     value={formData.shipment.shippingAddress}
// //                     onChange={(e) => handleChange(e, "shipment", "shippingAddress")}
// //                   />
// //                 </div>

// //                 <div>
// //                   <label>SHIPPING COST</label>
// //                   <br />
// //                   <input
// //                     type="number"
// //                     className="product-box-inputs"
// //                     name="shippingCost"
// //                     value={formData.shipment.shippingCost}
// //                     onChange={(e) => handleChange(e, "shipment", "shippingCost")}
// //                   />
// //                 </div>
// //               </div>
// //             </div>
// //           </div>

// //           {/* SECTION 4: VAT */}
// //           <div className="online-oneoff-section">
// //             <div className="section-header">
// //               <h5>VAT</h5>
// //             </div>
// //             <div className="product-box">
// //               <div className="customer-info-grid">
// //                 <div>
// //                   <label>VAT</label>
// //                   <br />
// //                   <input
// //                     type="number"
// //                     className="product-box-inputs"
// //                     name="vat"
// //                     value={formData.vat.vat}
// //                     onChange={(e) => handleChange(e, "vat", "vat")}
// //                   />
// //                 </div>

// //                 <div>
// //                   <label>DISCOUNT</label>
// //                   <br />
// //                   <input
// //                     type="number"
// //                     className="product-box-inputs"
// //                     name="discount"
// //                     value={formData.vat.discount}
// //                     onChange={(e) => handleChange(e, "vat", "discount")}
// //                   />
// //                 </div>
// //               </div>
// //             </div>
// //           </div>

// //           {/* SAVE BUTTON */}
// //           <div className="my-4 text-center">
// //             <button
// //               type="submit"
// //               className="px-5 py-3 btn btn-primary btn-lg"
// //               disabled={loading || fetching}
// //               style={{ 
// //                 fontSize: "1.1rem",
// //                 fontWeight: "bold",
// //                 minWidth: "200px",
// //                 backgroundColor: "#0867db",
// //                 color: "white",
// //                 border: "none",
// //                 borderRadius: "8px",
// //                 padding: "1.4rem 2rem"
// //               }}
// //             >
// //               {loading ? "SUBMITTING..." : "SAVE"}
// //             </button>
// //           </div>
// //         </form>
// //       </div>
// //     </div>
// //   );
// // };

// // export default OnOneSales;


// import React, { useState, useEffect } from "react";
// import "./OnOneSales.css";
// import Dashboard from "../../../../ui/DashboardBtn";
// import { apiRequest } from "../../../../../lib/config";

// const OnOneSales = ({ toggleOosModal }) => {
//   const closeModal = () => {
//     toggleOosModal();
//   };

//   const [formData, setFormData] = useState({
//     productInfo: {
//       productName: "",
//       productId: "",
//       referenceNo: "",
//       category: "",
//       subCategory: "",
//       description: "",
//       price: "",
//       coupon: "",
//     },
//     customerInfo: {
//       customerName: "",
//       address: "",
//       phoneNumber: "",
//       email: "",
//     },
//     shipment: {
//       shipmentMethod: "",
//       shipmentStatus: "",
//       trackingNumber: "",
//       vehiclePlateNumber: "",
//       shippingAddress: "",
//       shippingCost: "",
//     },
//     vat: {
//       vat: "",
//       discount: "",
//     },
//   });

//   const [products, setProducts] = useState([]);
//   const [customers, setCustomers] = useState([]);
//   const [referenceNumbers, setReferenceNumbers] = useState([]);
//   const [loadingReferences, setLoadingReferences] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [fetching, setFetching] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState(false);

//   useEffect(() => {
//     console.log("🚀 OnOneSales component mounted");
//     fetchProducts();
//     fetchCustomers();
//     fetchReferenceNumbers();
//   }, []);

//   const fetchReferenceNumbers = async () => {
//     try {
//       setLoadingReferences(true);
//       console.log("🔵 OnOneSales: Fetching reference numbers...");
//       console.log("📡 API Call: GET /api/sales/reports/orders");
      
//       const response = await apiRequest("/sales/reports/orders", "GET");
//       console.log("✅ Orders response:", response);
      
//       let ordersList = [];
//       if (Array.isArray(response)) {
//         ordersList = response;
//       } else if (response?.data && Array.isArray(response.data)) {
//         ordersList = response.data;
//       } else if (response?.response && Array.isArray(response.response)) {
//         ordersList = response.response;
//       } else if (response?.content && Array.isArray(response.content)) {
//         ordersList = response.content;
//       }
      
//       // Extract reference numbers from orders
//       const references = ordersList
//         .filter(order => order.referenceNo || order.orderNumber)
//         .map(order => ({
//           referenceNo: order.referenceNo || order.orderNumber,
//           customerName: order.customerName || order.customer?.name,
//           customerEmail: order.customerEmail || order.email,
//           customerPhone: order.customerPhone || order.phoneNumber,
//           productName: order.productName || order.items?.[0]?.productName,
//           productPrice: order.totalAmount || order.amount,
//           productId: order.productId || order.items?.[0]?.productId,
//           category: order.category,
//           subCategory: order.subCategory,
//           description: order.description,
//           orderDetails: order
//         }));
      
//       setReferenceNumbers(references);
//       console.log(`✅ Loaded ${references.length} reference numbers`);
//     } catch (err) {
//       console.error("❌ Error fetching orders:", err);
//     } finally {
//       setLoadingReferences(false);
//     }
//   };

//   // Fetch order details by reference number
//   const fetchOrderByReference = async (referenceNo) => {
//     try {
//       console.log(`🔍 Fetching order details for reference: ${referenceNo}`);
//       const response = await apiRequest(`/sales/orders/reference/${referenceNo}`, "GET");
//       console.log("✅ Order details:", response);
      
//       let orderData = response?.data || response?.response || response;
      
//       // Auto-fill product info
//       if (orderData.productName || orderData.items?.[0]?.productName) {
//         const product = products.find(p => 
//           p.productName === orderData.productName || 
//           p.name === orderData.productName ||
//           p.id?.toString() === orderData.productId?.toString()
//         );
        
//         setFormData(prev => ({
//           ...prev,
//           productInfo: {
//             ...prev.productInfo,
//             referenceNo: referenceNo,
//             productName: orderData.productName || orderData.items?.[0]?.productName || "",
//             productId: orderData.productId || orderData.items?.[0]?.productId || "",
//             category: product?.category?.name || orderData.category || "",
//             subCategory: product?.subCategory?.name || orderData.subCategory || "",
//             description: orderData.description || orderData.items?.[0]?.description || "",
//             price: orderData.totalAmount || orderData.amount || orderData.items?.[0]?.price || "",
//           }
//         }));
//       }
      
//       // Auto-fill customer info
//       if (orderData.customerName || orderData.customer?.name) {
//         setFormData(prev => ({
//           ...prev,
//           customerInfo: {
//             ...prev.customerInfo,
//             customerName: orderData.customerName || orderData.customer?.name || "",
//             address: orderData.customerAddress || orderData.customer?.address || "",
//             phoneNumber: orderData.customerPhone || orderData.customer?.phoneNumber || "",
//             email: orderData.customerEmail || orderData.customer?.email || "",
//           }
//         }));
//       }
      
//     } catch (err) {
//       console.error("❌ Error fetching order by reference:", err);
//       setError("Failed to load order details for this reference");
//       setTimeout(() => setError(""), 3000);
//     }
//   };

//   const handleReferenceChange = (e) => {
//     const selectedRef = e.target.value;
//     console.log(`📝 Reference selected: ${selectedRef}`);
//     setFormData(prev => ({
//       ...prev,
//       productInfo: {
//         ...prev.productInfo,
//         referenceNo: selectedRef,
//       }
//     }));
    
//     // Find and auto-fill from selected reference
//     if (selectedRef) {
//       const selectedReference = referenceNumbers.find(ref => ref.referenceNo === selectedRef);
//       if (selectedReference) {
//         console.log("✅ Found reference details:", selectedReference);
        
//         // Auto-fill product info
//         setFormData(prev => ({
//           ...prev,
//           productInfo: {
//             ...prev.productInfo,
//             referenceNo: selectedRef,
//             productName: selectedReference.productName || "",
//             productId: selectedReference.productId || "",
//             category: selectedReference.category || "",
//             subCategory: selectedReference.subCategory || "",
//             description: selectedReference.description || "",
//             price: selectedReference.productPrice || "",
//           },
//           customerInfo: {
//             ...prev.customerInfo,
//             customerName: selectedReference.customerName || "",
//             email: selectedReference.customerEmail || "",
//             phoneNumber: selectedReference.customerPhone || "",
//           }
//         }));
        
//         // Fetch full details for more info
//         fetchOrderByReference(selectedRef);
//       }
//     }
//   };

//   const fetchProducts = async () => {
//     try {
//       console.log("📦 OnOneSales: Fetching products...");
//       setFetching(true);
      
//       let response;
//       try {
//         response = await apiRequest("/api/products?size=500", "GET");
//       } catch (err) {
//         response = await apiRequest("/products?size=500", "GET");
//       }
      
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
      
//       setProducts(productsList);
//       console.log(`✅ Loaded ${productsList.length} products`);
//     } catch (err) {
//       console.error("❌ Error fetching products:", err);
//       setProducts([]);
//     } finally {
//       setFetching(false);
//     }
//   };

//   const fetchCustomers = async () => {
//     try {
//       console.log("👥 OnOneSales: Fetching customers...");
//       setFetching(true);
      
//       let response;
//       try {
//         response = await apiRequest("/api/admin/customers", "GET");
//       } catch (err) {
//         response = await apiRequest("/admin/customers", "GET");
//       }
      
//       let customersList = [];
//       if (response?.response && Array.isArray(response.response)) {
//         customersList = response.response;
//       } else if (Array.isArray(response)) {
//         customersList = response;
//       } else if (response?.data && Array.isArray(response.data)) {
//         customersList = response.data;
//       }
      
//       setCustomers(customersList);
//       console.log(`✅ Loaded ${customersList.length} customers`);
//     } catch (err) {
//       console.error("❌ Error fetching customers:", err);
//       setCustomers([]);
//     } finally {
//       setFetching(false);
//     }
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

//     // When product is selected by NAME - auto-fill all product fields
//     if (section === "productInfo" && field === "productName") {
//       const selectedProduct = products.find((p) => 
//         (p.productName && p.productName.toLowerCase() === value.toLowerCase()) ||
//         (p.name && p.name.toLowerCase() === value.toLowerCase())
//       );
      
//       if (selectedProduct) {
//         setFormData((prev) => ({
//           ...prev,
//           productInfo: {
//             ...prev.productInfo,
//             productName: selectedProduct.productName || selectedProduct.name || "",
//             productId: selectedProduct.id?.toString() || selectedProduct.productId || "",
//             category: selectedProduct.category?.name || selectedProduct.category || "",
//             subCategory: selectedProduct.subCategory?.name || selectedProduct.subCategory || "",
//             description: selectedProduct.productDescription || selectedProduct.description || "",
//             price: selectedProduct.sellingPrice?.toString() || selectedProduct.price?.toString() || selectedProduct.unitPrice?.toString() || "",
//           },
//         }));
//       }
//     }

//     // When product is selected by ID
//     if (section === "productInfo" && field === "productId") {
//       const selectedProduct = products.find((p) => 
//         (p.id && p.id.toString() === value) ||
//         (p.productId && p.productId.toString() === value)
//       );
      
//       if (selectedProduct) {
//         setFormData((prev) => ({
//           ...prev,
//           productInfo: {
//             ...prev.productInfo,
//             productId: value,
//             productName: selectedProduct.productName || selectedProduct.name || "",
//             category: selectedProduct.category?.name || selectedProduct.category || "",
//             subCategory: selectedProduct.subCategory?.name || selectedProduct.subCategory || "",
//             description: selectedProduct.productDescription || selectedProduct.description || "",
//             price: selectedProduct.sellingPrice?.toString() || selectedProduct.price?.toString() || selectedProduct.unitPrice?.toString() || "",
//           },
//         }));
//       }
//     }

//     // When customer is selected - auto-fill customer details
//     if (section === "customerInfo" && field === "customerName") {
//       let accountNumber = "";
//       let customerName = value;
      
//       if (value.includes("(") && value.includes(")")) {
//         const match = value.match(/\(([^)]+)\)/);
//         if (match) {
//           accountNumber = match[1].trim();
//           customerName = value.split("(")[0].trim();
//         }
//       }
      
//       const selectedCustomer = customers.find((c) => {
//         const fullName = `${c.firstName || ""} ${c.surname || ""}`.trim();
//         return (
//           (c.accountNumber && c.accountNumber === accountNumber) ||
//           (fullName && fullName.toLowerCase() === customerName.toLowerCase()) ||
//           (c.customerName && c.customerName.toLowerCase() === customerName.toLowerCase()) ||
//           (c.name && c.name.toLowerCase() === customerName.toLowerCase())
//         );
//       });
      
//       if (selectedCustomer) {
//         const customerData = {
//           customerName: `${selectedCustomer.firstName || ""} ${selectedCustomer.surname || ""}`.trim() || 
//                         selectedCustomer.customerName || selectedCustomer.name || customerName,
//           address: selectedCustomer.contactAddress || selectedCustomer.officeAddress || selectedCustomer.address || "",
//           phoneNumber: selectedCustomer.phoneNumber || selectedCustomer.phone || "",
//           email: selectedCustomer.email || "",
//         };
        
//         setFormData((prev) => ({
//           ...prev,
//           customerInfo: customerData,
//         }));
//       }
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     console.log("🚀 OnOneSales: Submitting online one-off sale...");
    
//     setLoading(true);
//     setError("");
//     setSuccess(false);

//     if (!formData.productInfo.productName || !formData.productInfo.price) {
//       setError("Please select a product and enter price.");
//       setLoading(false);
//       return;
//     }

//     if (!formData.customerInfo.customerName || !formData.customerInfo.email) {
//       setError("Please select a customer and enter email.");
//       setLoading(false);
//       return;
//     }

//     try {
//       const price = parseFloat(formData.productInfo.price) || 0;
//       const vatAmount = parseFloat(formData.vat.vat) || 0;
//       const shippingCost = parseFloat(formData.shipment.shippingCost) || 0;
//       const discount = parseFloat(formData.vat.discount) || 0;
//       const totalAmount = price + vatAmount + shippingCost - discount;

//       const requestBody = {
//         productInfo: {
//           productName: formData.productInfo.productName,
//           productId: formData.productInfo.productId,
//           referenceNo: formData.productInfo.referenceNo,
//           category: formData.productInfo.category,
//           subCategory: formData.productInfo.subCategory,
//           description: formData.productInfo.description,
//           price: price,
//           unitPrice: price,
//           quantity: 1,
//           discount: discount,
//           coupon: formData.productInfo.coupon,
//         },
//         customerInfo: {
//           customerName: formData.customerInfo.customerName,
//           email: formData.customerInfo.email,
//           phoneNumber: formData.customerInfo.phoneNumber,
//           address: formData.customerInfo.address,
//         },
//         shipment: {
//           shipmentMethod: formData.shipment.shipmentMethod,
//           shipmentStatus: formData.shipment.shipmentStatus,
//           trackingNumber: formData.shipment.trackingNumber,
//           vehiclePlateNumber: formData.shipment.vehiclePlateNumber,
//           shippingAddress: formData.shipment.shippingAddress || formData.customerInfo.address,
//           shippingCost: shippingCost
//         },
//         vat: {
//           vat: vatAmount,
//           discount: discount
//         },
//         totalAmount: totalAmount
//       };

//       console.log("📤 Request body:", requestBody);
      
//       const response = await apiRequest("/sales/online/one-off", "POST", requestBody);
//       console.log("✅ Response:", response);
      
//       setSuccess(true);
//       setFormData({
//         productInfo: { productName: "", productId: "", referenceNo: "", category: "", subCategory: "", description: "", price: "", coupon: "" },
//         customerInfo: { customerName: "", address: "", phoneNumber: "", email: "" },
//         shipment: { shipmentMethod: "", shipmentStatus: "", trackingNumber: "", vehiclePlateNumber: "", shippingAddress: "", shippingCost: "" },
//         vat: { vat: "", discount: "" },
//       });
      
//       setTimeout(() => setSuccess(false), 3000);
//     } catch (err) {
//       console.error("❌ Submit error:", err);
//       setError(err?.message || "Failed to submit sale");
//       setTimeout(() => setError(""), 5000);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div>
//       <div className="Csh-container" style={{ scrollbarWidth: "none" }}>
//         <div className="sticky-top">
//           <Dashboard style={{ position: "absolute", top: "3em" }} />
//           <h1 className="text-center">ONLINE ONE OFF SALES</h1>
//           <span className="adjust-cancel-btn" onClick={closeModal}>
//             X
//           </span>
//         </div>

//         {error && <div className="alert alert-danger">{error}</div>}
//         {success && <div className="alert alert-success">✅ Online one-off sale submitted successfully!</div>}
//         {fetching && <div className="alert alert-info">Loading data...</div>}

//         <form onSubmit={handleSubmit}>
//           {/* SECTION 1: REFERENCE NUMBER - DROPDOWN */}
//           <div className="online-oneoff-section">
//             <div className="section-header">
//               <h5>REFERENCE NUMBER</h5>
//             </div>
//             <div className="product-box">
//               <div className="product-box_grid">
//                 <div>
//                   <label>SELECT REFERENCE NUMBER</label>
//                   <br />
//                   <select
//                     name="referenceNo"
//                     className="py-1 product-box-select"
//                     value={formData.productInfo.referenceNo}
//                     onChange={handleReferenceChange}
//                     disabled={loadingReferences}
//                     style={{ width: "100%" }}
//                   >
//                     <option value="">
//                       {loadingReferences ? "Loading references..." : "-- Select Reference Number --"}
//                     </option>
//                     {referenceNumbers.length === 0 && !loadingReferences ? (
//                       <option value="" disabled>No references found</option>
//                     ) : (
//                       referenceNumbers.map((ref, index) => (
//                         <option key={index} value={ref.referenceNo}>
//                           {ref.referenceNo} {ref.customerName ? `- ${ref.customerName}` : ""}
//                         </option>
//                       ))
//                     )}
//                   </select>
//                   {formData.productInfo.referenceNo && (
//                     <small style={{ fontSize: "11px", color: "#28a745", marginTop: "4px", display: "block" }}>
//                       ✓ Selected: {formData.productInfo.referenceNo}
//                     </small>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* SECTION 2: PRODUCT INFO */}
//           <div className="online-oneoff-section">
//             <div className="section-header">
//               <h5>PRODUCT INFO</h5>
//             </div>
//             <div className="product-box">  
//               <div className="product-box_grid">
//                 <div>
//                   <label>PRODUCT NAME</label>
//                   <br />
//                   <select
//                     name="productName"
//                     className="py-1 product-box-select"
//                     value={formData.productInfo.productName}
//                     onChange={(e) => handleChange(e, "productInfo", "productName")}
//                     disabled={fetching}
//                   >
//                     <option value="">
//                       {products.length === 0 ? "NO PRODUCTS" : "CHOOSE PRODUCT"}
//                     </option>
//                     {products.map((product) => (
//                       <option key={product.id || product.productId} value={product.productName || product.name}>
//                         {product.productName || product.name} 
//                         {product.sellingPrice ? ` - ₦${product.sellingPrice}` : 
//                          product.price ? ` - ₦${product.price}` : 
//                          product.unitPrice ? ` - ₦${product.unitPrice}` : ''}
//                       </option>
//                     ))}
//                   </select>
//                   <label>CATEGORY</label>
//                   <br />
//                   <input
//                     type="text"
//                     className="product-box-inputs"
//                     name="category"
//                     value={formData.productInfo.category}
//                     onChange={(e) => handleChange(e, "productInfo", "category")}
//                     disabled
//                   />
//                 </div>

//                 <div>
//                   <label>PRODUCT ID</label>
//                   <br />
//                   <select
//                     name="productId"
//                     className="py-1 product-box-select"
//                     value={formData.productInfo.productId}
//                     onChange={(e) => handleChange(e, "productInfo", "productId")}
//                     disabled={fetching}
//                   >
//                     <option value="">
//                       {products.length === 0 ? "NO PRODUCTS" : "SELECT PRODUCT"}
//                     </option>
//                     {products.map((product) => (
//                       <option key={product.id || product.productId} value={product.id || product.productId}>
//                         {product.productId || product.id} - {product.productName || product.name}
//                       </option>
//                     ))}
//                   </select>
//                   <label>SUB-CATEGORY</label>
//                   <br />
//                   <input
//                     type="text"
//                     name="subCategory"
//                     className="product-box-inputs"
//                     value={formData.productInfo.subCategory}
//                     onChange={(e) => handleChange(e, "productInfo", "subCategory")}
//                     disabled
//                   />
//                 </div>

//                 <div>
//                   <label>REFERENCE NO</label>
//                   <br />
//                   <input
//                     type="text"
//                     name="refNo"
//                     className="product-box-inputs"
//                     value={formData.productInfo.referenceNo}
//                     readOnly
//                     disabled
//                     style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
//                   />
//                   <label>DESCRIPTION</label>
//                   <br />
//                   <textarea
//                     name="description"
//                     className="product-msg-box"
//                     cols="30"
//                     rows="4"
//                     value={formData.productInfo.description}
//                     onChange={(e) => handleChange(e, "productInfo", "description")}
//                   ></textarea>
//                 </div>
//               </div>
              
//               {/* PRICE and COUPON */}
//               <div className="customer-info-grid" style={{ marginTop: "2rem" }}>
//                 <div>
//                   <label>PRICE (₦)</label>
//                   <br />
//                   <input
//                     type="number"
//                     name="price"
//                     className="product-box-inputs"
//                     value={formData.productInfo.price}
//                     onChange={(e) => handleChange(e, "productInfo", "price")}
//                   />
//                 </div>
//                 <div>
//                   <label>COUPON</label>
//                   <br />
//                   <input
//                     type="text"
//                     name="coupon"
//                     className="product-box-inputs"
//                     value={formData.productInfo.coupon}
//                     onChange={(e) => handleChange(e, "productInfo", "coupon")}
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* SECTION 3: CUSTOMER INFO */}
//           <div className="online-oneoff-section">
//             <div className="section-header">
//               <h5>CUSTOMER INFO</h5>
//             </div>
//             <div className="product-box">
//               <div className="customer-info-grid">
//                 <div>
//                   <label>CUSTOMER NAME</label>
//                   <br />
//                   <select
//                     name="customerName"
//                     className="py-1 product-box-select"
//                     value={formData.customerInfo.customerName}
//                     onChange={(e) => handleChange(e, "customerInfo", "customerName")}
//                     disabled={fetching}
//                   >
//                     <option value="">
//                       {customers.length === 0 ? "NO CUSTOMERS" : "SELECT CUSTOMER"}
//                     </option>
//                     {customers.map((customer) => {
//                       const fullName = `${customer.firstName || ""} ${customer.surname || ""}`.trim() || 
//                                      customer.customerName || customer.name || "Unknown";
//                       const displayText = `${fullName} (${customer.accountNumber || customer.accountNo || "No Account"})`;
//                       return (
//                         <option key={customer.id || customer.accountNumber} value={displayText}>
//                           {displayText}
//                         </option>
//                       );
//                     })}
//                   </select>
//                   <label>ADDRESS</label>
//                   <br />
//                   <input
//                     type="text"
//                     className="product-box-inputs"
//                     name="address"
//                     value={formData.customerInfo.address}
//                     onChange={(e) => handleChange(e, "customerInfo", "address")}
//                   />
//                 </div>

//                 <div>
//                   <label>PHONE NUMBER</label>
//                   <br />
//                   <input
//                     type="text"
//                     name="phoneNumber"
//                     className="product-box-inputs"
//                     value={formData.customerInfo.phoneNumber}
//                     onChange={(e) => handleChange(e, "customerInfo", "phoneNumber")}
//                   />
//                   <label>EMAIL</label>
//                   <br />
//                   <input
//                     type="email"
//                     name="email"
//                     className="product-box-inputs"
//                     value={formData.customerInfo.email}
//                     onChange={(e) => handleChange(e, "customerInfo", "email")}
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* SECTION 4: SHIPMENT */}
//           <div className="online-oneoff-section">
//             <div className="section-header">
//               <h5>SHIPMENT</h5>
//             </div>
//             <div className="product-box">
//               <div className="product-box_grid">
//                 <div>
//                   <label>SHIPMENT METHOD</label>
//                   <br />
//                   <input
//                     type="text"
//                     className="product-box-inputs"
//                     name="shipmentMethod"
//                     value={formData.shipment.shipmentMethod}
//                     onChange={(e) => handleChange(e, "shipment", "shipmentMethod")}
//                   />
//                 </div>
//                 <div>
//                   <label>SHIPMENT STATUS</label>
//                   <br />
//                   <input
//                     type="text"
//                     className="product-box-inputs"
//                     name="shipmentStatus"
//                     value={formData.shipment.shipmentStatus}
//                     onChange={(e) => handleChange(e, "shipment", "shipmentStatus")}
//                   />
//                 </div>
//                 <div>
//                   <label>TRACKING NUMBER</label>
//                   <br />
//                   <input
//                     type="text"
//                     className="product-box-inputs"
//                     name="trackingNumber"
//                     value={formData.shipment.trackingNumber}
//                     onChange={(e) => handleChange(e, "shipment", "trackingNumber")}
//                   />
//                 </div>
//                 <div>
//                   <label>VEHICLE PLATE NUMBER</label>
//                   <br />
//                   <input
//                     type="text"
//                     className="product-box-inputs"
//                     name="vehiclePlateNumber"
//                     value={formData.shipment.vehiclePlateNumber}
//                     onChange={(e) => handleChange(e, "shipment", "vehiclePlateNumber")}
//                   />
//                 </div>
//                 <div>
//                   <label>SHIPPING ADDRESS</label>
//                   <br />
//                   <input
//                     type="text"
//                     className="product-box-inputs"
//                     name="shippingAddress"
//                     value={formData.shipment.shippingAddress}
//                     onChange={(e) => handleChange(e, "shipment", "shippingAddress")}
//                   />
//                 </div>
//                 <div>
//                   <label>SHIPPING COST (₦)</label>
//                   <br />
//                   <input
//                     type="number"
//                     className="product-box-inputs"
//                     name="shippingCost"
//                     value={formData.shipment.shippingCost}
//                     onChange={(e) => handleChange(e, "shipment", "shippingCost")}
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* SECTION 5: VAT */}
//           <div className="online-oneoff-section">
//             <div className="section-header">
//               <h5>VAT & DISCOUNT</h5>
//             </div>
//             <div className="product-box">
//               <div className="customer-info-grid">
//                 <div>
//                   <label>VAT (₦)</label>
//                   <br />
//                   <input
//                     type="number"
//                     className="product-box-inputs"
//                     name="vat"
//                     value={formData.vat.vat}
//                     onChange={(e) => handleChange(e, "vat", "vat")}
//                   />
//                 </div>
//                 <div>
//                   <label>DISCOUNT (₦)</label>
//                   <br />
//                   <input
//                     type="number"
//                     className="product-box-inputs"
//                     name="discount"
//                     value={formData.vat.discount}
//                     onChange={(e) => handleChange(e, "vat", "discount")}
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* SAVE BUTTON */}
//           <div className="my-4 text-center">
//             <button
//               type="submit"
//               className="px-5 py-3 btn btn-primary btn-lg"
//               disabled={loading || fetching}
//               style={{ 
//                 fontSize: "1.1rem",
//                 fontWeight: "bold",
//                 minWidth: "200px",
//                 backgroundColor: "#0867db",
//                 color: "white",
//                 border: "none",
//                 borderRadius: "8px",
//                 padding: "1.4rem 2rem"
//               }}
//             >
//               {loading ? "SUBMITTING..." : "SAVE"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default OnOneSales; 


import React, { useState, useEffect } from "react";
import BranchBadge from "../../../../shared/BranchBadge";
import Dashboard from "../../../../ui/DashboardBtn";
import { apiRequest } from "../../../../../lib/config";
import { fetchSellableProducts } from "../../../../../lib/inventoryApi";

const OnOneSales = ({ toggleOosModal }) => {
  const closeModal = () => {
    toggleOosModal();
  };

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [referenceNumbers, setReferenceNumbers] = useState([]);
  const [loadingRefs, setLoadingRefs] = useState(false);
  // Order currently under review (for approve/reject) + decision in-flight flag.
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [decisionLoading, setDecisionLoading] = useState(false);

  // Submit or reject the selected online one-off order (QA #5a). "Submit for approval"
  // forwards the order to the admin's Online Sales Approvals queue rather than approving
  // it outright - only an admin approving it there moves it into PROCESSING. Rejecting
  // reverses whatever the customer already paid back into their wallet (handled server-side).
  const handleDecision = async (decision) => {
    if (!selectedOrderId) {
      setError("Select a reference number first.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    setDecisionLoading(true);
    setError("");
    setSuccess("");
    try {
      const endpoint = decision === "approve" ? "submit-for-approval" : "reject";
      await apiRequest(`/sales/orders/${selectedOrderId}/${endpoint}`, "PUT", { comment: "" });
      setSuccess(`Order ${decision === "approve" ? "submitted for admin approval" : "rejected"} successfully.`);
      setSelectedOrderId("");
      setFormData((prev) => ({ ...prev, referenceNo: "" }));
      await fetchReferenceNumbers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err?.message || `Failed to ${decision} order.`);
      setTimeout(() => setError(""), 5000);
    } finally {
      setDecisionLoading(false);
    }
  };
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [formData, setFormData] = useState({
    referenceNo: "",
    productInfo: {
      productName: "",
      productId: "",
      category: "",
      subCategory: "",
      description: "",
      price: "",
      quantity: "1",
      discount: "0",
      coupon: ""
    },
    customerInfo: {
      customerName: "",
      accountNumber: "",
      email: "",
      phoneNumber: "",
      address: "",
      dob: "",
      gender: "",
      occupation: ""
    },
    charges: {
      insurance: "0",
      deliveryCharges: "0",
      vat: "0"
    },
    shipment: {
      shipmentMethod: "",
      trackingNumber: "",
      shippingAddress: ""
    }
  });

  // Fetch reference numbers on mount
  useEffect(() => {
    fetchReferenceNumbers();
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchReferenceNumbers = async () => {
    try {
      setLoadingRefs(true);
      console.log("🔵 Fetching one-off orders with a generated sales reference...");

      // Only orders that have had a sales reference generated (via "Generate Sales
      // Reference" on the One-Off Order screen) should be selectable here.
      // incomplete-payments is the same reliable, server-computed source
      // OneOfOrder.jsx uses, and now also carries salesReference.
      const response = await apiRequest("/sales/orders/incomplete-payments?size=500", "GET");

      let ordersList = [];
      if (response?.response?.content && Array.isArray(response.response.content)) {
        ordersList = response.response.content;
      } else if (response?.data && Array.isArray(response.data)) {
        ordersList = response.data;
      } else if (Array.isArray(response)) {
        ordersList = response;
      }

      const refs = ordersList
        .filter((order) => order.referenceNo)
        .filter((order) => order.salesReference)
        .map(order => ({
          referenceNo: order.referenceNo,
          orderId: order.orderId || order.id,
          customerName: order.customerName,
          accountNumber: order.accountNumber,
          productName: order.productName,
          productId: order.productId,
          totalAmount: order.totalAmount,
          salesReference: order.salesReference,
          order: order
        }));

      setReferenceNumbers(refs);
      console.log(`✅ Loaded ${refs.length} reference numbers with a generated sales reference`);
    } catch (err) {
      console.error("Error fetching reference numbers:", err);
    } finally {
      setLoadingRefs(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setFetching(true);
      // Sell from stock (on-hand quantity + stock price), not the product register.
      const productsList = await fetchSellableProducts();
      setProducts(productsList);
      console.log(`✅ Loaded ${productsList.length} in-stock products`);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setFetching(false);
    }
  };

  const fetchCustomers = async () => {
    try {
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
      console.log(`✅ Loaded ${customersList.length} customers`);
    } catch (err) {
      console.error("Error fetching customers:", err);
    }
  };

  const handleReferenceSelect = async (e) => {
    const selectedRef = e.target.value;
    console.log(`Selected reference: ${selectedRef}`);
    
    if (!selectedRef) {
      setFormData(prev => ({ ...prev, referenceNo: "" }));
      setSelectedOrderId("");
      return;
    }

    setLoading(true);

    try {
      const selected = referenceNumbers.find(ref => ref.referenceNo === selectedRef);

      if (selected) {
        setSelectedOrderId(selected.orderId);
        // Fetch full order details
        const orderResponse = await apiRequest(`/sales/orders/${selected.orderId}/details`, "GET");
        let details = orderResponse?.data || orderResponse?.response || orderResponse;
        
        // Auto-populate form
        setFormData({
          referenceNo: selectedRef,
          productInfo: {
            productName: selected.productName || details?.productName || "",
            productId: selected.productId || details?.productId || "",
            category: details?.category || "",
            subCategory: details?.subCategory || "",
            description: details?.description || "",
            price: selected.totalAmount || details?.totalAmount || 0,
            quantity: details?.quantity || "1",
            discount: details?.discount || "0",
            coupon: ""
          },
          customerInfo: {
            customerName: selected.customerName || details?.customerName || "",
            accountNumber: selected.accountNumber || details?.accountNumber || "",
            email: details?.email || "",
            phoneNumber: details?.phoneNumber || "",
            address: details?.address || "",
            dob: details?.dob || "",
            gender: details?.gender || "",
            occupation: details?.occupation || ""
          },
          charges: {
            insurance: "0",
            deliveryCharges: "0",
            vat: "0"
          },
          shipment: {
            shipmentMethod: "",
            trackingNumber: "",
            shippingAddress: details?.address || ""
          }
        });
        
        console.log("✅ Form auto-populated");
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
      setError("Failed to load order details");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const calculateTotal = () => {
    const price = parseFloat(formData.productInfo.price) || 0;
    const discount = parseFloat(formData.productInfo.discount) || 0;
    const insurance = parseFloat(formData.charges.insurance) || 0;
    const delivery = parseFloat(formData.charges.deliveryCharges) || 0;
    const vat = parseFloat(formData.charges.vat) || 0;
    
    return price - discount + insurance + delivery + vat;
  };


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const totalAmount = calculateTotal();

  const styles = {
    container: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "20px",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      backgroundColor: "#fff",
      borderRadius: "20px"
    },
    header: {
      position: "relative",
      marginBottom: "28px",
      textAlign: "center"
    },
    title: {
      fontSize: "1.75rem",
      fontWeight: "600",
      color: "#0867db",
      margin: "0",
      letterSpacing: "-0.5px"
    },
    closeBtn: {
      position: "absolute",
      top: "-8px",
      right: "-8px",
      background: "transparent",
      border: "none",
      fontSize: "1.5rem",
      cursor: "pointer",
      color: "#999",
      width: "36px",
      height: "36px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "50%",
      transition: "all 0.2s ease"
    },
    sectionTitle: {
      fontSize: "1.2rem",
      fontWeight: "600",
      color: "#0867db",
      margin: "20px 0 15px 0",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      borderBottom: "2px solid #0867db",
      display: "inline-block",
      paddingBottom: "5px"
    },
    formBox: {
      backgroundColor: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: "12px",
      padding: "20px",
      marginBottom: "20px"
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: "20px"
    },
    field: {
      marginBottom: "15px"
    },
    label: {
      display: "block",
      fontSize: "0.75rem",
      fontWeight: "600",
      color: "#6b7280",
      textTransform: "uppercase",
      marginBottom: "5px",
      letterSpacing: "0.5px"
    },
    input: {
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      fontSize: "0.875rem",
      fontFamily: "inherit",
      transition: "border-color 0.2s ease",
      outline: "none",
      backgroundColor: "#fff"
    },
    select: {
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      fontSize: "0.875rem",
      fontFamily: "inherit",
      backgroundColor: "#fff",
      cursor: "pointer"
    },
    textarea: {
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      fontSize: "0.875rem",
      fontFamily: "inherit",
      resize: "vertical",
      minHeight: "80px"
    },
    readonlyInput: {
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      fontSize: "0.875rem",
      backgroundColor: "#f9fafb",
      color: "#6b7280"
    },
    button: {
      width: "100%",
      padding: "12px",
      backgroundColor: "#0867db",
      color: "white",
      border: "none",
      borderRadius: "10px",
      fontSize: "1rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s ease",
      marginTop: "20px"
    },
    buttonDisabled: {
      backgroundColor: "#9ca3af",
      cursor: "not-allowed"
    },
    alert: {
      padding: "12px 16px",
      borderRadius: "10px",
      marginBottom: "20px",
      fontSize: "0.875rem",
      fontWeight: "500",
      textAlign: "center"
    },
    alertError: {
      backgroundColor: "#fee2e2",
      color: "#dc2626",
      border: "1px solid #fecaca"
    },
    alertSuccess: {
      backgroundColor: "#dcfce7",
      color: "#16a34a",
      border: "1px solid #bbf7d0"
    },
    loadingSpinner: {
      textAlign: "center",
      padding: "20px",
      color: "#6b7280"
    },
    spinner: {
      border: "3px solid #f3f4f6",
      borderTop: "3px solid #0867db",
      borderRadius: "50%",
      width: "32px",
      height: "32px",
      animation: "spin 1s linear infinite",
      margin: "0 auto 12px"
    },
    calculationBox: {
      backgroundColor: "#f9fafb",
      padding: "15px",
      borderRadius: "8px",
      marginTop: "15px"
    },
    calculationRow: {
      display: "flex",
      justifyContent: "space-between",
      padding: "8px 0",
      borderBottom: "1px solid #e5e7eb"
    },
    calculationLabel: {
      fontSize: "0.8rem",
      fontWeight: "500",
      color: "#6b7280"
    },
    calculationValue: {
      fontSize: "0.9rem",
      fontWeight: "600",
      color: "#0867db"
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Online One-Off Order</h1>
        <div style={{ display: "flex", justifyContent: "center", margin: "0.4rem 0" }}>
          <BranchBadge />
        </div>
        <button 
          onClick={closeModal} 
          style={styles.closeBtn}
          onMouseEnter={(e) => e.target.style.backgroundColor = "#f3f4f6"}
          onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
        >
          ×
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{ ...styles.alert, ...styles.alertError }}>
          {error}
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div style={{ ...styles.alert, ...styles.alertSuccess }}>
          {success}
        </div>
      )}

      {loadingRefs && (
        <div style={styles.loadingSpinner}>
          <div style={styles.spinner}></div>
          <p>Loading reference numbers...</p>
        </div>
      )}

      <div>
        {/* Reference Number Selection */}
        <div style={styles.formBox}>
          <div style={styles.field}>
            <label style={styles.label}>Reference Number *</label>
            <select 
              value={formData.referenceNo}
              onChange={handleReferenceSelect}
              style={styles.select}
              disabled={loading}
            >
              <option value="">-- Select Reference Number --</option>
              {referenceNumbers.map((ref) => (
                <option key={ref.referenceNo} value={ref.referenceNo}>
                  {ref.referenceNo} {ref.customerName ? `- ${ref.customerName}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div style={styles.loadingSpinner}>
            <div style={styles.spinner}></div>
            <p>Loading order details...</p>
          </div>
        )}

        {!loading && formData.referenceNo && (
          <>
            {/* Product Info - Read Only */}
            <h3 style={styles.sectionTitle}>Product Information</h3>
            <div style={styles.formBox}>
              <div style={styles.grid}>
                <div style={styles.field}>
                  <label style={styles.label}>Product Name</label>
                  <input type="text" value={formData.productInfo.productName} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Product ID</label>
                  <input type="text" value={formData.productInfo.productId} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Category</label>
                  <input type="text" value={formData.productInfo.category} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Sub-Category</label>
                  <input type="text" value={formData.productInfo.subCategory} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Price (₦)</label>
                  <input type="text" value={formatCurrency(formData.productInfo.price)} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Quantity</label>
                  <input type="text" value={formData.productInfo.quantity} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Discount (₦)</label>
                  <input type="text" value={formatCurrency(formData.productInfo.discount)} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Description</label>
                  <textarea value={formData.productInfo.description} style={styles.readonlyInput} readOnly rows="2" />
                </div>
              </div>
            </div>

            {/* Customer Info - Read Only */}
            <h3 style={styles.sectionTitle}>Customer Information</h3>
            <div style={styles.formBox}>
              <div style={styles.grid}>
                <div style={styles.field}>
                  <label style={styles.label}>Customer Name</label>
                  <input type="text" value={formData.customerInfo.customerName} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Account Number</label>
                  <input type="text" value={formData.customerInfo.accountNumber} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Email</label>
                  <input type="text" value={formData.customerInfo.email} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Phone Number</label>
                  <input type="text" value={formData.customerInfo.phoneNumber} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Address</label>
                  <input type="text" value={formData.customerInfo.address} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Date of Birth</label>
                  <input type="text" value={formData.customerInfo.dob} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Gender</label>
                  <input type="text" value={formData.customerInfo.gender} style={styles.readonlyInput} readOnly />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Occupation</label>
                  <input type="text" value={formData.customerInfo.occupation} style={styles.readonlyInput} readOnly />
                </div>
              </div>
            </div>

            {/* Charges - Editable */}
            <h3 style={styles.sectionTitle}>Additional Charges</h3>
            <div style={styles.formBox}>
              <div style={styles.grid}>
                <div style={styles.field}>
                  <label style={styles.label}>Insurance (₦)</label>
                  <input 
                    type="number" 
                    value={formData.charges.insurance}
                    onChange={(e) => handleChange("charges", "insurance", e.target.value)}
                    style={styles.input}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Delivery Charges (₦)</label>
                  <input 
                    type="number" 
                    value={formData.charges.deliveryCharges}
                    onChange={(e) => handleChange("charges", "deliveryCharges", e.target.value)}
                    style={styles.input}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>VAT (₦)</label>
                  <input 
                    type="number" 
                    value={formData.charges.vat}
                    onChange={(e) => handleChange("charges", "vat", e.target.value)}
                    style={styles.input}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Total Calculation */}
              <div style={styles.calculationBox}>
                <div style={styles.calculationRow}>
                  <span style={styles.calculationLabel}>Product Price</span>
                  <span style={styles.calculationValue}>{formatCurrency(formData.productInfo.price)}</span>
                </div>
                <div style={styles.calculationRow}>
                  <span style={styles.calculationLabel}>Discount</span>
                  <span style={styles.calculationValue}>- {formatCurrency(formData.productInfo.discount)}</span>
                </div>
                <div style={styles.calculationRow}>
                  <span style={styles.calculationLabel}>Insurance</span>
                  <span style={styles.calculationValue}>+ {formatCurrency(formData.charges.insurance)}</span>
                </div>
                <div style={styles.calculationRow}>
                  <span style={styles.calculationLabel}>Delivery Charges</span>
                  <span style={styles.calculationValue}>+ {formatCurrency(formData.charges.deliveryCharges)}</span>
                </div>
                <div style={styles.calculationRow}>
                  <span style={styles.calculationLabel}>VAT</span>
                  <span style={styles.calculationValue}>+ {formatCurrency(formData.charges.vat)}</span>
                </div>
                <div style={{ ...styles.calculationRow, borderBottom: "none", marginTop: "10px", paddingTop: "10px", borderTop: "2px solid #0867db" }}>
                  <span style={{ ...styles.calculationLabel, fontWeight: "bold", color: "#0867db" }}>TOTAL AMOUNT</span>
                  <span style={{ ...styles.calculationValue, fontSize: "1.1rem", fontWeight: "bold", color: "#10b981" }}>
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipment Details - Editable */}
            <h3 style={styles.sectionTitle}>Shipment Details</h3>
            <div style={styles.formBox}>
              <div style={styles.grid}>
                <div style={styles.field}>
                  <label style={styles.label}>Shipment Method</label>
                  <input 
                    type="text" 
                    value={formData.shipment.shipmentMethod}
                    onChange={(e) => handleChange("shipment", "shipmentMethod", e.target.value)}
                    style={styles.input}
                    placeholder="e.g., Courier, Pickup, etc."
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Tracking Number</label>
                  <input 
                    type="text" 
                    value={formData.shipment.trackingNumber}
                    onChange={(e) => handleChange("shipment", "trackingNumber", e.target.value)}
                    style={styles.input}
                    placeholder="Enter tracking number"
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Shipping Address</label>
                  <textarea 
                    value={formData.shipment.shippingAddress}
                    onChange={(e) => handleChange("shipment", "shippingAddress", e.target.value)}
                    style={styles.textarea}
                    placeholder="Enter shipping address"
                    rows="2"
                  />
                </div>
              </div>
            </div>

            {/* Approve / Reject the selected online order (QA #5a) */}
            {selectedOrderId ? (
              <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => handleDecision("approve")}
                  disabled={decisionLoading}
                  style={{
                    ...styles.button,
                    backgroundColor: decisionLoading ? "#9ca3af" : "#10b981",
                    cursor: decisionLoading ? "not-allowed" : "pointer",
                    flex: 1,
                  }}
                >
                  {decisionLoading ? "SUBMITTING..." : "SUBMIT FOR APPROVAL"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision("reject")}
                  disabled={decisionLoading}
                  style={{
                    ...styles.button,
                    backgroundColor: decisionLoading ? "#9ca3af" : "#dc2626",
                    cursor: decisionLoading ? "not-allowed" : "pointer",
                    flex: 1,
                  }}
                >
                  {decisionLoading ? "SUBMITTING..." : "REJECT"}
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default OnOneSales;