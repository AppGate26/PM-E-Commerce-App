import React, { useState, useEffect } from "react";
import "./Goods.css";
import BranchBadge from "../../../shared/BranchBadge";
import Inserted from "./Inserted";
import GoodsSuccess from "./GoodsSuccess";
import { Link } from "react-router-dom";
import { apiRequest } from "../../../../lib/config";
import { getAccountOptions } from "../../../../lib/accountingApi";
import { fetchWarehouses } from "../../../../lib/warehouseApi";
import AccountPicker from "../../../shared/AccountPicker";

const Goods = ({ toggleGoods }) => {
  //CANCEL MODAL
  const closeModal = () => {
    toggleGoods();
  };

  // State for controlling the insert modal
  const [modalInsert, setModalInsert] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [accountOptions, setAccountOptions] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);

  // Resolve a GL account picker value (account id) to its human GL code (e.g. 1020201)
  const glCodeFor = (val) => {
    if (!val) return "";
    const acct = accountOptions.find((a) => String(a.value) === String(val));
    return acct?.code || String(val);
  };

  // Function to toggle the insert modal
  const toggleInserted = () => {
    setModalInsert(!modalInsert);
  };

  // State for storing goods records
  const [goodsRecords, setGoodsRecords] = useState([]);

  // Fetch suppliers and existing goods supplied records on component mount
  useEffect(() => {
    fetchSuppliers();
    fetchAccountOptions();
    fetchWarehouseOptions();
  }, []);

  const fetchWarehouseOptions = async () => {
    try {
      setLoadingWarehouses(true);
      const list = await fetchWarehouses();
      setWarehouses(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Goods: Failed to load warehouses:", err);
      setWarehouses([]);
    } finally {
      setLoadingWarehouses(false);
    }
  };

  const fetchAccountOptions = async () => {
    try {
      setLoadingAccounts(true);
      const accounts = await getAccountOptions();
      setAccountOptions(accounts);
    } catch (err) {
      console.error("Goods: Failed to load backend account options:", err);
      setError(err?.message || "Failed to load account details from backend.");
      setAccountOptions([]);
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Fetch existing goods supplied records
  const fetchExistingGoodsSupplied = async () => {
    try {
      console.log("═══════════════════════════════════════════════════════════");
      console.log("🔵 Goods: ========== FETCHING EXISTING GOODS SUPPLIED ==========");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("Goods: API endpoint: /admin/goods-supplied");
      console.log("Goods: Method: GET");
      
      const response = await apiRequest("/admin/goods-supplied", "GET");
      
      console.log("Goods: Raw API response:", response);
      
      let goodsList = [];
      if (Array.isArray(response)) {
        goodsList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        goodsList = response.data;
      } else if (response?.response?.data && Array.isArray(response.response.data)) {
        goodsList = response.response.data;
      } else if (response?.response && Array.isArray(response.response)) {
        goodsList = response.response;
      } else if (response?.response?.content && Array.isArray(response.response.content)) {
        goodsList = response.response.content;
      }
      
      console.log("═══════════════════════════════════════════════════════════");
      console.log("✅ Goods: LOADED", goodsList.length, "EXISTING GOODS SUPPLIED RECORDS");
      console.log("═══════════════════════════════════════════════════════════");
      
      // Map API response to match our record structure
      const mappedRecords = goodsList.map((record) => ({
        supplierId: record.supplierId || record.supplier?.id || "",
        productId: record.productId || record.product?.id || "",
        suppliedProduct: record.suppliedProduct || record.product?.productName || "",
        vehicleNumber: record.vehicleNumber || "",
        lpoNo: record.lpoNumber || record.lpoNo || "",
        warehouseNumber: record.warehouseName || record.warehouseNumber || "",
        date: record.dateSupplied || record.date || "",
        invoiceNumber: record.invoiceNumber || "",
        waybillNo: record.waybillNumber || record.waybillNo || "",
        glDebitCode: record.glDebitCode || "",
        glCreditCode: record.glCreditCode || "",
        categoryName: record.product?.category?.name || record.categoryName || "",
        description: record.description || "",
        quantity: record.quantity || "",
        costUnit: record.unitPrice || record.costUnit || "",
        amount: record.totalAmount || record.amount || "",
        saved: true, // Mark as already saved
      }));
      
      setGoodsRecords(mappedRecords);
    } catch (err) {
      console.error("═══════════════════════════════════════════════════════════");
      console.error("❌ Goods: ERROR FETCHING EXISTING GOODS SUPPLIED");
      console.error("═══════════════════════════════════════════════════════════");
      console.error("Goods: Error message:", err?.message);
      // Don't show error to user, just log it (records might not exist yet)
    }
  };

  const fetchSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      setError("");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("🔵 Goods: ========== FETCHING SUPPLIERS ==========");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("Goods: API endpoint: /users/suppliers");
      console.log("Goods: Method: GET");
      
      const response = await apiRequest("/users/suppliers", "GET");
      
      console.log("Goods: Raw API response:", response);
      
      let suppliersList = [];
      if (Array.isArray(response)) {
        suppliersList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        suppliersList = response.data;
      } else if (response?.response?.data && Array.isArray(response.response.data)) {
        suppliersList = response.response.data;
      } else if (response?.response && Array.isArray(response.response)) {
        suppliersList = response.response;
      }
      
      console.log("═══════════════════════════════════════════════════════════");
      console.log("✅ Goods: LOADED", suppliersList.length, "SUPPLIERS");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("Goods: Suppliers list:", suppliersList);
      
      setSuppliers(suppliersList);
      
      if (suppliersList.length === 0) {
        console.warn("Goods: ⚠️ No suppliers found. User needs to register suppliers first.");
      }
    } catch (err) {
      console.error("═══════════════════════════════════════════════════════════");
      console.error("❌ Goods: ERROR FETCHING SUPPLIERS");
      console.error("═══════════════════════════════════════════════════════════");
      console.error("Goods: Error message:", err?.message);
      console.error("Goods: Error stack:", err?.stack);
      setError("Failed to load suppliers. Please refresh the page.");
      setSuppliers([]);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  // State for storing data to be inserted
  const [insertData, setInsertData] = useState({
    supplierId: "",
    productId: "",
    suppliedProduct: "",
    vehicleNumber: "",
    lpoNo: "",
    warehouseNumber: "",
    date: "",
    invoiceNumber: "",
    waybillNo: "",
    glDebitCode: "",
    glCreditCode: "",
    terminalCode: "",
  });

  // State for products
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      setError("");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("🔵 Goods: ========== FETCHING PRODUCTS ==========");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("Goods: API endpoint: /products?size=500");
      console.log("Goods: Method: GET");
      
      // Use same endpoint and size as other components (AllProducts, StockAdd)
      const response = await apiRequest("/products?size=500", "GET");
      
      console.log("Goods: Raw API response:", response);
      console.log("Goods: Response type:", typeof response);
      console.log("Goods: Is array?", Array.isArray(response));
      console.log("Goods: Response keys:", response ? Object.keys(response) : 'null');
      
      let productsList = [];
      
      // Handle different response formats (matching AllProducts and StockAdd logic)
      if (Array.isArray(response)) {
        productsList = response;
        console.log("Goods: Products list is direct array, count:", productsList.length);
      } else if (response?.data && Array.isArray(response.data)) {
        productsList = response.data;
        console.log("Goods: Products list from response.data, count:", productsList.length);
      } else if (response?.content && Array.isArray(response.content)) {
        productsList = response.content;
        console.log("Goods: Products list from response.content, count:", productsList.length);
      } else if (response?.response?.content && Array.isArray(response.response.content)) {
        productsList = response.response.content;
        console.log("Goods: Products list from response.response.content, count:", productsList.length);
      } else if (response?.response?.data && Array.isArray(response.response.data)) {
        productsList = response.response.data;
        console.log("Goods: Products list from response.response.data, count:", productsList.length);
      } else if (response?.response && Array.isArray(response.response)) {
        productsList = response.response;
        console.log("Goods: Products list from response.response, count:", productsList.length);
      } else {
        console.warn("Goods: Unexpected response format:", response);
      }
      
      console.log("═══════════════════════════════════════════════════════════");
      console.log("✅ Goods: LOADED", productsList.length, "PRODUCTS");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("Goods: Sample product:", productsList[0]);
      
      setProducts(productsList);
      
      if (productsList.length === 0) {
        console.warn("Goods: ⚠️ No products found. User needs to add products first.");
      }
    } catch (err) {
      console.error("═══════════════════════════════════════════════════════════");
      console.error("❌ Goods: ERROR FETCHING PRODUCTS");
      console.error("═══════════════════════════════════════════════════════════");
      console.error("Goods: Error message:", err?.message);
      console.error("Goods: Error stack:", err?.stack);
      setError("Failed to load products. Please refresh the page.");
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Function to handle changes in input fields
  const handleChange1 = (e) => {
    const { name, value } = e.target;
    // Check if the target element is a select dropdown
    if (e.target.tagName.toLowerCase() === "select") {
      setInsertData({
        ...insertData,
        [name]: value,
      });
    } else {
      // Handle input fields
      setInsertData({
        ...insertData,
        [name]: value,
      });
    }
  };

  // Function to insert a record into goodsRecords
  const insertRecord = () => {
    // Check if any required field is empty (including productId - required by API)
    const requiredFields = [
      "supplierId",
      "productId", // Required by API
      "vehicleNumber",
      "lpoNo",
      "warehouseNumber",
      "waybillNo",
    ];
    const emptyFields = requiredFields.filter((field) => !insertData[field] || insertData[field].trim() === "");

    // If any required field is empty, show alert
    if (emptyFields.length > 0) {
      setError(`Please fill the following fields: ${emptyFields.join(", ")}`);
      return;
    }

    // Set date and invoice number if not set
    // Auto-generate invoice number if not provided (don't require it)
    const invoiceNumber = insertData.invoiceNumber || `INV-${Date.now()}`;
    
    // Get productId from form (user must select product)
    if (!insertData.productId) {
      setError("Please select a product before inserting record.");
      return;
    }
    
    const productId = insertData.productId;
    const selectedProduct = products.find(p => String(p.id) === String(productId));
    
    if (!selectedProduct) {
      setError("Selected product not found. Please select a valid product.");
      return;
    }
    
    const suppliedProduct = selectedProduct.productName || insertData.suppliedProduct || "Product";
    
    // Get category name from nested structure: product.category.name
    const categoryName = selectedProduct?.category?.name || "";
    
    const recordToAdd = {
      ...insertData,
      productId: productId,
      date: insertData.date || new Date().toISOString().split('T')[0],
      invoiceNumber: invoiceNumber, // Auto-generated if not provided
      suppliedProduct: suppliedProduct, // Auto-filled from selected product
      categoryName: categoryName, // Auto-filled from product
      saved: false, // Mark as new (not yet saved)
      // glDebitCode / glCreditCode carried from insertData (optional)
    };

    // Create a copy of goodsRecords and add new record
    setGoodsRecords([...goodsRecords, recordToAdd]);

    // Show temporary success message instead of modal
    setSuccessMessage("✅ Record inserted! Now fill the form below and click SAVE to persist to database.");
    
    // Clear error if any
    setError("");
  };

  // Function to handle form submission
  const handleSubmit1 = (e) => {
    e.preventDefault();
    
    // Check required fields (including productId - required by API)
    const requiredFields = [
      "supplierId",
      "productId", // Required by API
      "vehicleNumber",
      "lpoNo",
      "warehouseNumber",
      "waybillNo",
    ];
    
    const unfilledFields = requiredFields.filter((field) => !insertData[field] || insertData[field].trim() === "");
    
    if (unfilledFields.length === 0) {
      // Form submitted successfully
      // Insert the record (productId will be auto-set inside insertRecord)
      insertRecord();
      // Clear the input fields after submitting
      setInsertData({
        supplierId: "",
        productId: "",
        suppliedProduct: "",
        vehicleNumber: "",
        lpoNo: "",
        warehouseNumber: "",
        date: "",
        invoiceNumber: "",
        waybillNo: "",
        glDebitCode: "",
        glCreditCode: "",
      });
    } else {
      const unfilledFieldsString = unfilledFields.join(", ");
      setError(`Please fill out the following required fields: ${unfilledFieldsString}`);
    }
  };

  // State for controlling the success modal for saved records
  const [modalGoodSuccess, setModalGoodSuccess] = useState(false);

  // State for storing form data for saved records
  const [formData, setFormData] = useState({
    name: "",
    invoiceAmount: "",
    grossAmount: "",
    discount: "",
    vat: "",
    customerMessage: "",
    bankName: "",
    accountNumber: "",
  });

  // Function to handle changes in form data for saved records
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Auto-calculate grossAmount = invoiceAmount + vat - discount
  useEffect(() => {
    const invoice = parseFloat(formData.invoiceAmount) || 0;
    const vat = parseFloat(formData.vat) || 0;
    const discount = parseFloat(formData.discount) || 0;
    const gross = invoice + vat - discount;
    setFormData((prev) => ({ ...prev, grossAmount: gross > 0 ? gross.toFixed(2) : "" }));
  }, [formData.invoiceAmount, formData.vat, formData.discount]);

  // Function to handle form submission for saved records
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // Validate required fields
    const requiredFields = ["name", "invoiceAmount", "grossAmount"];
    const unfilledFields = requiredFields.filter((field) => !formData[field] || formData[field].trim() === "");

    if (unfilledFields.length > 0) {
      const unfilledFieldsString = unfilledFields.join(", ");
      setError(`Please fill out the following fields: ${unfilledFieldsString}`);
      return;
    }

    // Check if there are goods records
    if (goodsRecords.length === 0) {
      setError("Please insert at least one goods record before saving.");
      return;
    }

    try {
      setLoading(true);
      console.log("═══════════════════════════════════════════════════════════");
      console.log("🔵 Goods: ========== SAVING GOODS SUPPLIED ==========");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("Goods: Form data:", formData);
      console.log("Goods: Goods records:", goodsRecords);
      console.log("Goods: API endpoint: /users/goods-supplied");
      console.log("Goods: Method: POST");

      // Prepare request body according to Swagger API specification
      // API expects: supplierId, productId, suppliedProduct, unitPrice, deliveryFee, totalAmount,
      // dateSupplied, vehicleNumber, invoiceNumber, lpoNumber, waybillNumber, warehouseName, terminalCode
      
      // Get the first record for common fields
      const firstRecord = goodsRecords[0];
      
      if (!firstRecord) {
        setError("Please insert at least one goods record before saving.");
        return;
      }
      
      // Validate required fields
      if (!firstRecord.supplierId) {
        setError("Please ensure supplier is selected in the record.");
        return;
      }
      
      if (!firstRecord.productId) {
        setError("Please ensure product is selected in the record.");
        return;
      }
      
      const productId = firstRecord.productId;
      
      // Auto-generate invoice number if not provided
      const invoiceNumber = firstRecord?.invoiceNumber || 
                           formData.invoiceNumber || 
                           `INV-${Date.now()}`;
      
      // Calculate amounts from form data
      // unitPrice = gross amount (price per unit) - required
      // deliveryFee = delivery fee - required (using discount field or set to 0)
      // totalAmount = invoice amount (total including all fees) - required
      const unitPrice = parseFloat(formData.grossAmount) || 0;
      const deliveryFee = parseFloat(formData.discount) || 0; // Using discount as delivery fee
      const totalAmount = parseFloat(formData.invoiceAmount) || unitPrice;
      
      // Validate required numeric fields
      if (unitPrice <= 0 || totalAmount <= 0) {
        setError("Please enter valid amounts (Gross Amount and Invoice Amount are required).");
        return;
      }
      
      // Get product details for suppliedProduct
      const selectedProduct = products.find(p => String(p.id) === String(productId));
      const suppliedProduct = selectedProduct?.productName || firstRecord.suppliedProduct || "Product";
      
      // Prepare request body matching Swagger exactly
      // Only save new records (not already saved ones)
      const newRecords = goodsRecords.filter(record => !record.saved);
      
      if (newRecords.length === 0) {
        setError("No new records to save. All records are already saved.");
        return;
      }
      
      // Save each new record
      const savePromises = newRecords.map(async (record) => {
        const recordProductId = record.productId || productId;
        const recordProduct = products.find(p => String(p.id) === String(recordProductId));
        const recordSuppliedProduct = recordProduct?.productName || record.suppliedProduct || "Product";
        
        const requestBody = {
          supplierId: parseInt(record.supplierId || firstRecord.supplierId),
          productId: parseInt(recordProductId),
          suppliedProduct: recordSuppliedProduct,
          unitPrice: unitPrice,
          deliveryFee: deliveryFee,
          totalAmount: totalAmount,
          dateSupplied: record.date || firstRecord.date || new Date().toISOString().split('T')[0],
          vehicleNumber: record.vehicleNumber || "",
          invoiceNumber: record.invoiceNumber || invoiceNumber,
          lpoNumber: record.lpoNo || "", // Note: API expects lpoNumber, not lpoNo
          waybillNumber: record.waybillNo || "", // Note: API expects waybillNumber, not waybillNo
          warehouseName: record.warehouseNumber || "", // Note: API expects warehouseName, not warehouseNumber
          glDebitCode: glCodeFor(record.glDebitCode) || "", // GL account to debit
          glCreditCode: glCodeFor(record.glCreditCode) || "", // GL account to credit
          terminalCode: "", // Not in form, set to empty string
        };
        
        return apiRequest("/admin/goods-supplied", "POST", requestBody);
      });
      
      console.log("Goods: Saving", newRecords.length, "new record(s)...");
      console.log("Goods: Request bodies:", newRecords.map(r => ({
        supplierId: r.supplierId,
        productId: r.productId,
        suppliedProduct: r.suppliedProduct
      })));

      await Promise.all(savePromises);

      console.log("═══════════════════════════════════════════════════════════");
      console.log("✅ Goods: GOODS SUPPLIED SAVED SUCCESSFULLY");
      console.log("═══════════════════════════════════════════════════════════");

      // Clear the table after successful save
      setGoodsRecords([]);

      // Clear the form data
      setFormData({
        name: "",
        invoiceAmount: "",
        grossAmount: "",
        discount: "",
        vat: "",
        customerMessage: "",
        bankName: "",
        accountNumber: "",
      });

      // Show success modal only when saved
      setModalGoodSuccess(true);
    } catch (err) {
      console.error("═══════════════════════════════════════════════════════════");
      console.error("❌ Goods: ERROR SAVING GOODS SUPPLIED");
      console.error("═══════════════════════════════════════════════════════════");
      console.error("Goods: Error message:", err?.message);
      console.error("Goods: Error stack:", err?.stack);
      setError(err?.message || "Failed to save goods supplied. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Count unsaved records
  const unsavedCount = goodsRecords.filter(record => !record.saved).length;

  return (
    <>
      {!modalInsert && !modalGoodSuccess && (
        <div className="">
          <div className="goods-container">
            <div className="bg-white header-box-goods sticky-top goods-header-shell">
              <div className="goods-header-row">
              <button
                className="btn btn-primary fw-bold goods-dashboard-btn"
              >
                <Link to="/adminDashboard" className="text-white text-decoration-none">
                  Dashboard
                </Link>
              </button>
              <span className="modal-cancel_icon" onClick={closeModal}>
                ×
              </span>
              </div>
              <div className="goods-hero">
                <p className="goods-eyebrow">Inventory Supplier Workflow</p>
                <h1>Goods Supplied</h1>
                <div style={{ marginTop: "0.4rem" }}>
                  <BranchBadge />
                </div>
                <p className="goods-subtitle">
                  Record incoming supplied goods, review inserted rows, and complete the accounting details from one cleaner standard workspace.
                </p>
              </div>
            </div>

            {/* Workflow Guide Banner */}
            <div className="workflow-guide goods-workflow-guide">
              <span style={{ fontSize: '1.5rem' }}>📋</span>
              <div>
                <strong style={{ color: '#0867db', fontSize: '1.1rem' }}>2-Step Process:</strong>
                <div style={{ display: 'flex', gap: '2rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                  <span>1️⃣ <strong>INSERT RECORD</strong> (adds to table above)</span>
                  <span>➡️</span>
                  <span>2️⃣ Fill bottom form & <strong>SAVE</strong> (persists to database)</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger mx-3 mt-3" role="alert">
                ❌ {error}
              </div>
            )}

            {successMessage && (
              <div className="alert alert-success mx-3 mt-3" role="alert" style={{
                backgroundColor: '#d4edda',
                borderColor: '#c3e6cb',
                color: '#155724',
                borderLeft: '5px solid #28a745'
              }}>
                {successMessage}
              </div>
            )}

            {/* Unsaved Records Indicator */}
            {unsavedCount > 0 && (
              <div style={{
                backgroundColor: '#fff3cd',
                borderLeft: '5px solid #ffc107',
                padding: '0.8rem 1.5rem',
                margin: '0 1.5rem 1rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem',
                fontSize: '0.95rem'
              }}>
                <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                <span>
                  <strong>{unsavedCount}</strong> unsaved record(s) in table above. 
                  <span style={{ color: '#856404', marginLeft: '0.5rem' }}>
                    Complete the form below and click SAVE.
                  </span>
                </span>
              </div>
            )}

            <div className="container-fluid goods-body-shell">
              <div className="goods-grid">
                <div className="">
                  <form action="">
                    <label className="goods-label">supplier id</label>
                    <select
                      name="supplierId"
                      className="goods-input"
                      id="glCode-option"
                      value={insertData.supplierId || ""}
                      onChange={handleChange1}
                      disabled={loadingSuppliers}
                      style={{ 
                        color: insertData.supplierId ? '#111' : '#868e96',
                        cursor: loadingSuppliers ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <option value="" style={{ color: '#868e96' }}>
                        {loadingSuppliers ? "Loading suppliers..." : "Select supplier id"}
                      </option>
                      {suppliers.length === 0 && !loadingSuppliers ? (
                        <option value="" disabled style={{ color: '#999' }}>
                          No suppliers found. Please register a supplier first.
                        </option>
                      ) : (
                        suppliers.map((supplier) => {
                          // Use field names that match backend response (customerName, not companyName)
                          const supplierName = supplier.customerName || 
                                              supplier.companyName || 
                                              supplier.name ||
                                              "Unknown";
                          const supplierId = supplier.supplierId || supplier.id;
                          
                          return (
                            <option 
                              key={supplier.id || supplier.supplierId} 
                              value={String(supplier.id || supplier.supplierId)}
                              style={{ color: '#111' }}
                            >
                              {supplierId} - {supplierName}
                            </option>
                          );
                        })
                      )}
                    </select>
                    {insertData.supplierId && (
                      <small style={{ color: '#28a745', display: 'block', marginTop: '0.5rem' }}>
                        Selected: {suppliers.find(s => String(s.id || s.supplierId) === String(insertData.supplierId))?.customerName || 
                                   suppliers.find(s => String(s.id || s.supplierId) === String(insertData.supplierId))?.companyName || 
                                   insertData.supplierId}
                      </small>
                    )}
                    {suppliers.length === 0 && !loadingSuppliers && (
                      <small style={{ color: '#dc3545', display: 'block', marginTop: '0.5rem' }}>
                        No suppliers available. Go to Supplier Registration to add one.
                      </small>
                    )}
                  </form>
                  {/* Product Selection - Required by API but not in Figma */}
                  <form action="">
                    <label className="goods-label">product *</label>
                    <select
                      name="productId"
                      className="goods-input"
                      id="glCode-option"
                      value={insertData.productId || ""}
                      onChange={handleChange1}
                      disabled={loadingProducts}
                      style={{ 
                        color: insertData.productId ? '#111' : '#868e96',
                        cursor: loadingProducts ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <option value="" style={{ color: '#868e96' }}>
                        {loadingProducts ? "Loading products..." : "Select product"}
                      </option>
                      {products.length === 0 && !loadingProducts ? (
                        <option value="" disabled style={{ color: '#999' }}>
                          No products found. Please add products first.
                        </option>
                      ) : (
                        products.map((product) => (
                          <option 
                            key={product.id} 
                            value={String(product.id)}
                            style={{ color: '#111' }}
                          >
                            {product.productName || product.name || `Product ${product.id}`}
                          </option>
                        ))
                      )}
                    </select>
                    {insertData.productId && (
                      <small style={{ color: '#28a745', display: 'block', marginTop: '0.5rem' }}>
                        Selected: {products.find(p => String(p.id) === String(insertData.productId))?.productName || insertData.productId}
                      </small>
                    )}
                  </form>
                  {/*  */}
                  <form action="">
                    <label className="goods-label">vehicle number</label>
                    <input
                      type="text"
                      placeholder="vehicle-no-110058"
                      className="goods-input"
                      name="vehicleNumber"
                      value={insertData.vehicleNumber}
                      onChange={handleChange1}
                    />
                  </form>
                  <form action="">
                    <label className="goods-label">l.p.o no.</label>
                    <input
                      className="goods-input"
                      type="text"
                      placeholder="l.p.o no."
                      name="lpoNo"
                      value={insertData.lpoNo}
                      onChange={handleChange1}
                    />
                  </form>
                  <form action="">
                    <label className="goods-label">warehouse name</label>
                    <select
                      className="goods-input"
                      name="warehouseNumber"
                      value={insertData.warehouseNumber || ""}
                      onChange={handleChange1}
                      disabled={loadingWarehouses}
                      style={{
                        color: insertData.warehouseNumber ? "#111" : "#868e96",
                        cursor: loadingWarehouses ? "not-allowed" : "pointer",
                      }}
                    >
                      <option value="" style={{ color: "#868e96" }}>
                        {loadingWarehouses ? "Loading warehouses..." : "Select warehouse"}
                      </option>
                      {warehouses.length === 0 && !loadingWarehouses ? (
                        <option value="" disabled style={{ color: "#999" }}>
                          No warehouses found. Please create a warehouse first.
                        </option>
                      ) : (
                        warehouses.map((wh) => (
                          <option
                            key={wh.id}
                            value={wh.warehouseName}
                            style={{ color: "#111" }}
                          >
                            {wh.warehouseName}
                          </option>
                        ))
                      )}
                    </select>
                  </form>
                  <form action="" onSubmit={handleSubmit1}>
                    <input
                      type="submit"
                      value="INSERT RECORD"
                      className="insert-btn"
                    />
                  </form>
                </div>

                <div className="">
                  <form action="">
                    <label className="goods-label">date</label>
                    <input
                      type="date"
                      name="date"
                      className="goods-input  "
                      value={insertData.date || new Date().toISOString().split('T')[0]}
                      onChange={handleChange1}
                    />
                  </form>
             <form action="">
  <label className="goods-label">invoice number</label>
  <input
    className="goods-input"
    type="text"
    placeholder="Auto-generated by system"
    name="invoiceNumber"
    value={insertData.invoiceNumber || "Will be auto-generated on save"}
    readOnly
    disabled
    style={{ 
      backgroundColor: '#f5f5f5',
      cursor: 'not-allowed',
      color: '#6c757d'
    }}
  />
  <small style={{ color: '#6c757d', display: 'block', marginTop: '0.5rem', fontSize: '0.9rem', fontStyle: 'italic' }}>
    ⚡ Invoice number is automatically generated by the system when saving
  </small>
</form>
                  <form action="">
                    <label className="goods-label">waybill no.</label>
                    <input
                      className="goods-input"
                      type="text"
                      placeholder="waybill no."
                      name="waybillNo"
                      value={insertData.waybillNo}
                      onChange={handleChange1}
                    />
                  </form>
                  <div className="">
                    <label className="goods-label">GL to debit</label>
                    <AccountPicker
                      accounts={accountOptions}
                      value={insertData.glDebitCode}
                      onChange={(val) =>
                        setInsertData((prev) => ({ ...prev, glDebitCode: val }))
                      }
                      disabled={loadingAccounts}
                      placeholder={
                        loadingAccounts ? "Loading GL accounts..." : "Search GL to debit by code or name"
                      }
                    />
                  </div>
                  <div className="" style={{ marginTop: "1rem" }}>
                    <label className="goods-label">GL to credit</label>
                    <AccountPicker
                      accounts={accountOptions}
                      value={insertData.glCreditCode}
                      onChange={(val) =>
                        setInsertData((prev) => ({ ...prev, glCreditCode: val }))
                      }
                      disabled={loadingAccounts}
                      placeholder={
                        loadingAccounts ? "Loading GL accounts..." : "Search GL to credit by code or name"
                      }
                    />
                  </div>
                </div>
              </div>
              {/*  */}

              <div className="goods-table ">
                <div className="table-scroll-bar">
                  <table>
                    <thead>
                      <tr>
                        <th>S/N</th>
                        <th>CATEGORY</th>
                        <th>DESCRIPTION</th>
                        <th>QUANTITY</th>
                        <th>COST UNIT</th>
                        <th>AMOUNT</th>
                        <th>GL TO DEBIT</th>
                        <th>GL TO CREDIT</th>
                      </tr>
                    </thead>

                    <tbody>
                      {/* Render existing records */}
                      {goodsRecords.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                            No records yet. Use the form above to insert records.
                          </td>
                        </tr>
                      ) : (
                        goodsRecords.map((record, index) => {
                          const product = products.find(p => String(p.id) === String(record.productId));
                          // Get category name from nested structure: product.category.name
                          const categoryName = product?.category?.name || 
                                              record.categoryName || 
                                              "";
                          return (
                            <tr key={index} style={!record.saved ? { backgroundColor: '#fff3cd' } : {}}>
                              <td>{index + 1}</td>
                              <td>{categoryName}</td>
                              <td>{record.description || ""}</td>
                              <td>{record.quantity || ""}</td>
                              <td>{record.costUnit || ""}</td>
                              <td>{record.amount || ""}</td>
                              <td>{glCodeFor(record.glDebitCode) || ""}</td>
                              <td>{glCodeFor(record.glCreditCode) || ""}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                {unsavedCount > 0 && (
                  <div style={{ 
                    textAlign: 'right', 
                    marginTop: '0.5rem',
                    fontSize: '0.85rem',
                    color: '#856404'
                  }}>
                    * Highlighted rows are unsaved
                  </div>
                )}
              </div>

              {/* Section Divider with Instruction */}
              <div style={{
                margin: '2rem 1.5rem 1rem',
                borderTop: '2px dashed #0867db',
                paddingTop: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <span style={{
                  backgroundColor: '#0867db',
                  color: 'white',
                  padding: '0.3rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>STEP 2</span>
                <span style={{ color: '#0867db', fontWeight: '500' }}>
                  Complete this form to save records to database
                </span>
              </div>

              {/* continuation of forms */}
              <h3 className="enter-h3">ENTERED BY</h3>

              <div className="goods-form-2">
                <div className="">
                  <form action="">
                    <label className="goods-label">name</label>
                    <input
                      type="text"
                      placeholder="enter your name"
                      className="goods-input"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </form>
                  <form action="">
                    <label className="goods-label">invoice amount</label>
                    <input
                      type="text"
                      placeholder="enter invoice amount"
                      className="goods-input"
                      name="invoiceAmount"
                      value={formData.invoiceAmount}
                      onChange={handleChange}
                    />
                  </form>
                  <form action="">
                    <label className="goods-label">gross amount (auto-calculated)</label>
                    <input
                      type="text"
                      placeholder="Auto: Invoice + VAT − Discount"
                      className="goods-input"
                      name="grossAmount"
                      value={formData.grossAmount}
                      readOnly
                      style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
                    />
                  </form>
                </div>
                <div className="">
                  <form action="">
                    <label className="goods-label">discount</label>
                    <input
                      type="text"
                      placeholder="enter discount given"
                      className="goods-input"
                      name="discount"
                      value={formData.discount}
                      onChange={handleChange}
                    />
                  </form>
                  <form action="">
                    <label className="goods-label">vat</label>
                    <input
                      type="text"
                      placeholder="enter vat"
                      className="goods-input"
                      name="vat"
                      value={formData.vat}
                      onChange={handleChange}
                    />
                  </form>
                </div>
              </div>
              <form action="" className="px-4">
                <label className="goods-label">customer message</label> <br />
                <textarea
                  name="customerMessage"
                  id="customer-msg"
                  cols="30"
                  rows="4"
                  placeholder="enter message here"
                  value={formData.customerMessage}
                  onChange={handleChange}
                ></textarea>
              </form>

              <h3 className="add-msg">ADD NEW MESSAGE</h3>

              <div className="goods-form-2">
                <div className="">
                  <form action="">
                    <label className="goods-label">bank name</label>
                    <input
                      name="bankName"
                      type="text"
                      placeholder="enter bank name"
                      className="goods-input"
                      value={formData.bankName}
                      onChange={handleChange}
                    />
                  </form>
                  <form action="" onSubmit={handleSubmit}>
                    <input 
                      type="submit" 
                      value={loading ? "SAVING..." : "SAVE TO DATABASE"} 
                      className="insert-btn"
                      disabled={loading}
                    />
                  </form>
                </div>
                <div className="">
                  <form action="">
                    <label className="goods-label">account number</label>
                    <input
                      name="accountNumber"
                      type="text"
                      placeholder="enter account number"
                      className="goods-input"
                      value={formData.accountNumber}
                      onChange={handleChange}
                    />
                  </form>
                </div>
              </div>

              {/* Reminder for unsaved records */}
              {unsavedCount > 0 && (
                <div style={{
                  textAlign: 'center',
                  marginTop: '1rem',
                  padding: '0.5rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  color: '#495057'
                }}>
                  ⚡ Don't forget to click <strong>SAVE TO DATABASE</strong> to persist your {unsavedCount} inserted record(s)
                </div>
              )}

              <br />
              <br />
              <br />
              <br />
              <br />
            </div>
          </div>
        </div>
      )}
      {/* Success  Modal - Only shows on SAVE */}

      {modalGoodSuccess && (
        <GoodsSuccess
          isOpen={modalGoodSuccess}
          toggleGoodSuccess={() => setModalGoodSuccess(false)}
        />
      )}

      {/*  */}
      {modalInsert && (
        <Inserted isOpen={modalInsert} toggleInserted={toggleInserted} />
      )}
    </>
  );
};

export default Goods;
