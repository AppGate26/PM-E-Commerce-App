import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../../../../lib/config";
import BranchBadge from "../../../../shared/BranchBadge";
import "./StockSetup.css";
import "./StockSetupQuery.css";
import "./OpeningStock.css";

const Setup = ({ toggleStockSetup }) => {
  const closeModal = () => {
    toggleStockSetup();
  };

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    supplierId: "",
    enteredBy: "",
  });

  const [stockRecords, setStockRecords] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [currentRecord, setCurrentRecord] = useState({
    productId: "",
    categoryId: "",
    subCategoryId: "",
    description: "",
    quantity: "",
    unitPrice: "",
    accountToCredit: "",
    accountToDebit: "",
  });
  const [showRecordModal, setShowRecordModal] = useState(false);

  useEffect(() => {
    fetchSuppliers();
    fetchUsers();
    fetchDropdownData();
    fetchExistingStocks();
  }, []);

  useEffect(() => {
    if (currentRecord.categoryId) {
      fetchSubCategories(currentRecord.categoryId);
    } else {
      setSubCategories([]);
    }
  }, [currentRecord.categoryId]);

  const fetchSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      console.log("🔵 Fetching suppliers from /users/suppliers");
      const response = await apiRequest("/users/suppliers", "GET");
      console.log("📦 Suppliers response:", response);
      
      let suppliersList = [];
      if (Array.isArray(response)) suppliersList = response;
      else if (response?.data && Array.isArray(response.data)) suppliersList = response.data;
      else if (response?.response?.data && Array.isArray(response.response.data)) suppliersList = response.response.data;
      else if (response?.response && Array.isArray(response.response)) suppliersList = response.response;
      
      console.log("✅ Loaded", suppliersList.length, "suppliers");
      setSuppliers(suppliersList);
    } catch (err) {
      console.error("❌ Error fetching suppliers:", err);
      setError("Failed to load suppliers");
      setSuppliers([]);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      console.log("🔵 Fetching users from /users");
      const response = await apiRequest("/users", "GET");
      console.log("👥 Users response:", response);
      
      let usersList = [];
      if (Array.isArray(response)) usersList = response;
      else if (response?.data && Array.isArray(response.data)) usersList = response.data;
      else if (response?.response?.data && Array.isArray(response.response.data)) usersList = response.response.data;
      else if (response?.response && Array.isArray(response.response)) usersList = response.response;
      else if (response?.users && Array.isArray(response.users)) usersList = response.users;
      
      console.log("✅ Loaded", usersList.length, "users");
      setUsers(usersList);
    } catch (err) {
      console.error("❌ Error fetching users:", err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchExistingStocks = async () => {
    try {
      setLoadingStocks(true);
      console.log("🔵 Fetching opening stock records...");
      let response;
      try {
        response = await apiRequest("/users/opening-stock", "GET");
      } catch (err) {
        response = await apiRequest("/admin/stocks", "GET");
      }
      
      let stocksList = [];
      if (Array.isArray(response)) stocksList = response;
      else if (response?.data && Array.isArray(response.data)) stocksList = response.data;
      else if (response?.stockRecords && Array.isArray(response.stockRecords)) stocksList = response.stockRecords;

      const transformedStocks = stocksList.map((stock, index) => ({
        id: stock.id,
        sn: index + 1,
        productId: stock.productId,
        categoryId: stock.categoryId,
        subCategoryId: stock.subCategoryId,
        productName: stock.productName || stock.product?.productName || "N/A",
        categoryName: stock.categoryName || stock.category?.categoryName || "N/A",
        subCategoryName: stock.subCategoryName || stock.subCategory?.subCategoryName || "N/A",
        description: stock.description || "N/A",
        quantity: stock.quantity || 0,
        unitPrice: stock.unitPrice || 0,
        totalBalance: (parseFloat(stock.quantity || 0) * parseFloat(stock.unitPrice || 0)).toFixed(2),
        accountToCredit: stock.accountToCredit || "N/A",
        accountToDebit: stock.accountToDebit || "N/A",
        saved: true,
      }));

      setStockRecords(transformedStocks);
    } catch (err) {
      console.error("❌ Error fetching stocks:", err);
      setStockRecords([]);
    } finally {
      setLoadingStocks(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        apiRequest("/products?size=500", "GET"),
        apiRequest("/admin/categories", "GET")
      ]);
      
      let productsList = [];
      if (Array.isArray(productsResponse)) productsList = productsResponse;
      else if (productsResponse?.data) productsList = productsResponse.data;
      else if (productsResponse?.content) productsList = productsResponse.content;

      let categoriesList = [];
      if (Array.isArray(categoriesResponse)) categoriesList = categoriesResponse;
      else if (categoriesResponse?.data) categoriesList = categoriesResponse.data;

      setProducts(productsList);
      setCategories(categoriesList);
    } catch (err) {
      console.error("❌ Error fetching dropdown data:", err);
    }
  };

  const fetchSubCategories = async (categoryId) => {
    try {
      const response = await apiRequest(`/categories/${categoryId}/sub-categories`, "GET");
      let subCategoriesList = [];
      if (Array.isArray(response)) subCategoriesList = response;
      else if (response?.data) subCategoriesList = response.data;
      setSubCategories(subCategoriesList);
    } catch (err) {
      console.error("❌ Error fetching subcategories:", err);
      setSubCategories([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRecordChange = (e) => {
    const { name, value } = e.target;
    setCurrentRecord({ ...currentRecord, [name]: value });
  };

  const handleInsertRecord = () => {
    setShowRecordModal(true);
    setError("");
  };

  const handleAddRecordToTable = () => {
    if (!currentRecord.productId || !currentRecord.categoryId || !currentRecord.subCategoryId || 
        !currentRecord.quantity || !currentRecord.unitPrice || !currentRecord.accountToCredit || 
        !currentRecord.accountToDebit) {
      setError("Please fill all required fields before adding record");
      return;
    }

    const product = products.find(p => String(p.id) === String(currentRecord.productId));
    const category = categories.find(c => String(c.id) === String(currentRecord.categoryId));
    const subCategory = subCategories.find(s => String(s.id) === String(currentRecord.subCategoryId));

    const newRecord = {
      ...currentRecord,
      id: Date.now(),
      sn: stockRecords.length + 1,
      productName: product?.productName || product?.name || "",
      categoryName: category?.categoryName || category?.name || "",
      subCategoryName: subCategory?.subCategoryName || subCategory?.name || "",
      totalBalance: (parseFloat(currentRecord.quantity || 0) * parseFloat(currentRecord.unitPrice || 0)).toFixed(2),
    };

    console.log("➕ Adding new record:", newRecord);
    setStockRecords([...stockRecords, newRecord]);
    setCurrentRecord({
      productId: "", categoryId: "", subCategoryId: "", description: "",
      quantity: "", unitPrice: "", accountToCredit: "", accountToDebit: "",
    });
    setError("");
    setSuccess("Record added to table");
    setShowRecordModal(false);
    setTimeout(() => setSuccess(""), 2000);
  };

  const handleSave = async () => {
    if (!formData.supplierId || !formData.enteredBy) {
      setError("Please select supplier and user");
      return;
    }
    if (stockRecords.length === 0) {
      setError("Please add at least one stock record");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const requestBody = {
        supplierId: parseInt(formData.supplierId),
        stockDate: formData.date,
        enteredBy: parseInt(formData.enteredBy),
        isOpeningStock: true,
        stockRecords: stockRecords.map(record => ({
          productId: parseInt(record.productId),
          categoryId: parseInt(record.categoryId),
          subCategoryId: parseInt(record.subCategoryId),
          description: record.description || "",
          quantity: parseInt(record.quantity),
          unitPrice: parseFloat(record.unitPrice),
          accountToCredit: record.accountToCredit,
          accountToDebit: record.accountToDebit,
          reorderLevel: 0,
        })),
      };

      console.log("💾 Saving opening stock:", JSON.stringify(requestBody, null, 2));
      await apiRequest("/users/opening-stock", "POST", requestBody);

      console.log("✅ Opening stock saved successfully");
      setSuccess("Opening stock saved successfully!");
      await fetchExistingStocks();
      setFormData({ date: new Date().toISOString().split('T')[0], supplierId: "", enteredBy: "" });
      setTimeout(() => { setSuccess(""); closeModal(); }, 2000);
    } catch (err) {
      console.error("❌ Error saving:", err);
      setError(err?.message || "Failed to save opening stock");
    } finally {
      setLoading(false);
    }
  };

  const handleImportExcel = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xlsx, .xls, .csv';
    fileInput.onchange = handleFileUpload;
    fileInput.click();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log("📁 Importing file:", file.name);
    
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiRequest("/users/opening-stock/import", "POST", formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response?.stockRecords && Array.isArray(response.stockRecords)) {
        const importedRecords = response.stockRecords.map((record, index) => ({
          id: Date.now() + index,
          sn: stockRecords.length + index + 1,
          productId: record.productId || "",
          categoryId: record.categoryId || "",
          subCategoryId: record.subCategoryId || "",
          productName: record.productName || "N/A",
          categoryName: record.categoryName || "N/A",
          subCategoryName: record.subCategoryName || "N/A",
          description: record.description || "",
          quantity: record.quantity || 0,
          unitPrice: record.unitPrice || 0,
          totalBalance: ((record.quantity || 0) * (record.unitPrice || 0)).toFixed(2),
          accountToCredit: record.accountToCredit || "",
          accountToDebit: record.accountToDebit || "",
          saved: false,
        }));
        setStockRecords([...stockRecords, ...importedRecords]);
        setSuccess(`Imported ${importedRecords.length} records`);
      } else {
        setSuccess("File imported successfully");
      }
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("❌ Import error:", err);
      if (file.name.endsWith('.csv')) {
        parseCSV(file);
      } else {
        setError("Failed to import file. Please check format.");
      }
    } finally {
      setLoading(false);
    }
  };

  const parseCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const importedRecords = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',');
        const record = {};
        headers.forEach((header, index) => { record[header] = values[index]?.trim() || ''; });
        
        importedRecords.push({
          id: Date.now() + i,
          sn: stockRecords.length + importedRecords.length + 1,
          productId: record.productid || "",
          categoryId: record.categoryid || "",
          subCategoryId: record.subcategoryid || "",
          productName: record.productname || "N/A",
          categoryName: record.categoryname || "N/A",
          subCategoryName: record.subcategoryname || "N/A",
          description: record.description || "",
          quantity: parseFloat(record.quantity) || 0,
          unitPrice: parseFloat(record.unitprice) || 0,
          totalBalance: ((parseFloat(record.quantity) || 0) * (parseFloat(record.unitprice) || 0)).toFixed(2),
          accountToCredit: record.accounttocredit || "",
          accountToDebit: record.accounttodebit || "",
          saved: false,
        });
      }
      setStockRecords([...stockRecords, ...importedRecords]);
      setSuccess(`Imported ${importedRecords.length} records from CSV`);
      setTimeout(() => setSuccess(""), 3000);
    };
    reader.readAsText(file);
  };

  const colors = {
    primary: "#0867db", primaryHover: "#0756b8", text: "#111",
    textMuted: "#868e96", border: "#c0c0c0", white: "#ffffff",
    danger: "#dc3545", success: "#28a745", bgLight: "#f8f9fa"
  };

  return (
     <div className="stock_setup-container opening-stock-container">
    <div className="opening-stock-shell" style={{ maxWidth: "1200px", width: "100%", position: "relative", boxSizing: "border-box" }}>
      <button className="btn fw-bold" style={{ position: "absolute", top: "1.5rem", left: "2rem", backgroundColor: colors.primary, color: colors.white, border: "none", borderRadius: "5px", padding: "0.5rem 1rem" }}>
        <Link to="/adminDashboard" style={{ color: colors.white, textDecoration: "none" }}>Dashboard</Link>
      </button>

      <div className="opening-stock-hero">
        <p className="opening-stock-eyebrow">Inventory Setup</p>
        <h1 style={{ fontSize: "2.5rem", textTransform: "uppercase", color: colors.primary, textAlign: "center", fontWeight: 700, margin: "0", letterSpacing: "0.5px" }}>
          OPENING STOCK
        </h1>
        <p className="opening-stock-subtitle">Capture supplier-linked opening balances, import bulk entries, and save clean stock records from one standard workspace.</p>
        {/* Which branch these opening balances will be posted to. A branch user sees
            their own branch; a head-office user sees the branch they selected. */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "0.75rem" }}>
          <BranchBadge />
        </div>
      </div>

      <span onClick={closeModal} style={{ position: "absolute", right: "2rem", top: "1.5rem", fontSize: "1.5rem", backgroundColor: colors.primary, color: colors.white, borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontWeight: 600, zIndex: 100 }}>
        ×
      </span>

      {error && <div className="alert alert-danger" role="alert" style={{ marginBottom: "1rem" }}>{error}</div>}
      {success && <div className="alert alert-success" role="alert" style={{ marginBottom: "1rem" }}>{success}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "4rem", marginBottom: "2rem", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontSize: "1rem", fontWeight: 600, color: colors.text, marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>DATE</label>
          <div style={{ position: "relative", width: "100%" }}>
            <input type="date" name="date" value={formData.date} onChange={handleChange} required style={{ width: "100%", padding: "1rem 1rem 1rem 3rem", border: `1px solid ${colors.border}`, borderRadius: "8px", fontSize: "1rem", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            <svg style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: colors.textMuted, pointerEvents: "none" }} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
          <button type="button" onClick={handleImportExcel} style={{ alignSelf: "flex-start", marginBottom: "1rem", padding: "0.5rem 1rem", fontSize: "0.85rem", textTransform: "uppercase", border: `1px solid ${colors.primary}`, color: colors.primary, background: colors.white, borderRadius: "6px", display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: 500 }} onMouseEnter={(e) => { e.target.style.background = colors.primary; e.target.style.color = colors.white; }} onMouseLeave={(e) => { e.target.style.background = colors.white; e.target.style.color = colors.primary; }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            Import from excel
          </button>

          <label style={{ fontSize: "1rem", fontWeight: 600, color: colors.text, marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>SUPPLIER ID</label>
          <div style={{ position: "relative", width: "100%" }}>
            <select name="supplierId" value={formData.supplierId} onChange={handleChange} disabled={loadingSuppliers} style={{ width: "100%", padding: "1rem 3rem 1rem 1rem", border: `1px solid ${colors.border}`, borderRadius: "8px", fontSize: "1rem", fontFamily: "inherit", outline: "none", cursor: loadingSuppliers ? "not-allowed" : "pointer", color: formData.supplierId ? colors.text : colors.textMuted, backgroundColor: colors.white, appearance: "none", boxSizing: "border-box" }}>
              <option value="" style={{ color: colors.textMuted }}>{loadingSuppliers ? "Loading suppliers..." : "Select supplier id"}</option>
              {suppliers.length === 0 && !loadingSuppliers ? (
                <option value="" disabled>No suppliers found</option>
              ) : (
                suppliers.map((supplier) => {
                  const supplierName = supplier.customerName || supplier.companyName || supplier.name || supplier.supplierName || "Unknown";
                  const supplierId = supplier.supplierId || supplier.id || supplier.userId;
                  return <option key={supplierId} value={String(supplierId)} style={{ color: colors.text }}>{supplierId} - {supplierName}</option>;
                })
              )}
            </select>
            <svg style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: colors.textMuted, pointerEvents: "none" }} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>

          {formData.supplierId && <small style={{ color: colors.success, display: "block", marginTop: "0.5rem" }}>Selected: {suppliers.find(s => String(s.id || s.supplierId || s.userId) === String(formData.supplierId))?.customerName || suppliers.find(s => String(s.id || s.supplierId || s.userId) === String(formData.supplierId))?.companyName || formData.supplierId}</small>}
          
          {suppliers.length === 0 && !loadingSuppliers && <small style={{ color: colors.danger, display: "block", marginTop: "0.5rem" }}>No suppliers available</small>}

          <button type="button" onClick={handleInsertRecord} style={{ width: "100%", padding: "1rem", marginTop: "1.5rem", textTransform: "uppercase", fontSize: "0.9rem", fontWeight: 600, backgroundColor: colors.primary, color: colors.white, border: "none", borderRadius: "6px", cursor: "pointer", letterSpacing: "0.5px" }} onMouseEnter={(e) => e.target.style.backgroundColor = colors.primaryHover} onMouseLeave={(e) => e.target.style.backgroundColor = colors.primary}>
            INSERT RECORD
          </button>
        </div>
      </div>

      <div style={{ margin: "2rem 0", overflowX: "auto", border: `1px solid ${colors.border}`, borderRadius: "8px", maxHeight: "400px", overflowY: "auto" }}>
        {loadingStocks ? <div style={{ textAlign: "center", padding: "2rem" }}>Loading stocks...</div> : (
          <table style={{ width: "100%", borderCollapse: "collapse", textTransform: "uppercase", fontSize: "0.85rem", tableLayout: "fixed", minWidth: "1000px" }}>
            <thead style={{ backgroundColor: colors.primary, color: colors.white, position: "sticky", top: 0, zIndex: 10 }}>
              <tr>
                <th style={{ padding: "0.8rem 0.5rem", textAlign: "left", fontWeight: 600, border: "1px solid rgba(255,255,255,0.2)",fontSize:'10px', width: "5%" }}>S/N</th>
                <th style={{ padding: "0.8rem 0.5rem", textAlign: "left", fontWeight: 600, border: "1px solid rgba(255,255,255,0.2)",fontSize:'10px', width: "12%" }}>PRODUCT</th>
                <th style={{ padding: "0.8rem 0.5rem", textAlign: "left", fontWeight: 600, border: "1px solid rgba(255,255,255,0.2)",fontSize:'10px', width: "10%" }}>CATEGORY</th>
                <th style={{ padding: "0.8rem 0.5rem", textAlign: "left", fontWeight: 600, border: "1px solid rgba(255,255,255,0.2)",fontSize:'10px', width: "12%" }}>SUB-CATEGORY</th>
                <th style={{ padding: "0.8rem 0.5rem", textAlign: "left", fontWeight: 600, border: "1px solid rgba(255,255,255,0.2)",fontSize:'10px', width: "15%" }}>DESCRIPTION</th>
                <th style={{ padding: "0.8rem 0.5rem", textAlign: "left", fontWeight: 600, border: "1px solid rgba(255,255,255,0.2)",fontSize:'10px', width: "8%" }}>QUANTITY</th>
                <th style={{ padding: "0.8rem 0.5rem", textAlign: "left", fontWeight: 600, border: "1px solid rgba(255,255,255,0.2)",fontSize:'10px', width: "10%" }}>UNIT PRICE</th>
                <th style={{ padding: "0.8rem 0.5rem", textAlign: "left", fontWeight: 600, border: "1px solid rgba(255,255,255,0.2)",fontSize:'10px', width: "10%" }}>TOTAL BALANCE</th>
                <th style={{ padding: "0.8rem 0.5rem", textAlign: "left", fontWeight: 600, border: "1px solid rgba(255,255,255,0.2)",fontSize:'10px', width: "9%" }}>A/C TO CREDIT</th>
                <th style={{ padding: "0.8rem 0.5rem", textAlign: "left", fontWeight: 600, border: "1px solid rgba(255,255,255,0.2)",fontSize:'10px', width: "9%" }}>A/C TO DEBIT</th>
              </tr>
            </thead>
            <tbody>
              {stockRecords.length === 0 ? (
                <tr><td colSpan="10" style={{ textAlign: "center", padding: "2rem", color: colors.textMuted }}>No stock records found. Click "INSERT RECORD" to add items.</td></tr>
              ) : (
                stockRecords.map((record, index) => (
                  <tr key={record.id || index} style={{ backgroundColor: index % 2 === 0 ? colors.white : colors.bgLight }}>
                    <td style={{ padding: "0.8rem 0.5rem", border: `1px solid ${colors.border}`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{record.sn || index + 1}</td>
                    <td style={{ padding: "0.8rem 0.5rem", border: `1px solid ${colors.border}`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{record.productName || "N/A"}</td>
                    <td style={{ padding: "0.8rem 0.5rem", border: `1px solid ${colors.border}`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{record.categoryName || "N/A"}</td>
                    <td style={{ padding: "0.8rem 0.5rem", border: `1px solid ${colors.border}`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{record.subCategoryName || "N/A"}</td>
                    <td style={{ padding: "0.8rem 0.5rem", border: `1px solid ${colors.border}`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{record.description || "N/A"}</td>
                    <td style={{ padding: "0.8rem 0.5rem", border: `1px solid ${colors.border}`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{record.quantity || 0}</td>
                    <td style={{ padding: "0.8rem 0.5rem", border: `1px solid ${colors.border}`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{record.unitPrice || "N/A"}</td>
                    <td style={{ padding: "0.8rem 0.5rem", border: `1px solid ${colors.border}`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{record.totalBalance || "0.00"}</td>
                    <td style={{ padding: "0.8rem 0.5rem", border: `1px solid ${colors.border}`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{record.accountToCredit || "N/A"}</td>
                    <td style={{ padding: "0.8rem 0.5rem", border: `1px solid ${colors.border}`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{record.accountToDebit || "N/A"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "2rem", paddingTop: "1.5rem", borderTop: `1px solid ${colors.border}` }}>
        <div style={{ flex: 1, maxWidth: "50%" }}>
          <label style={{ fontSize: "1rem", fontWeight: 600, color: colors.text, marginBottom: "0.5rem", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>ENTERED BY</label>
          <div style={{ position: "relative", width: "100%" }}>
            <select name="enteredBy" value={formData.enteredBy} onChange={handleChange} disabled={loadingUsers} style={{ width: "100%", padding: "1rem 3rem 1rem 1rem", border: `1px solid ${colors.border}`, borderRadius: "8px", fontSize: "1rem", fontFamily: "inherit", textTransform: "uppercase", appearance: "none", backgroundColor: colors.white, outline: "none", cursor: loadingUsers ? "not-allowed" : "pointer", color: formData.enteredBy ? colors.text : colors.textMuted, boxSizing: "border-box" }}>
              <option value="" style={{ color: colors.textMuted }}>{loadingUsers ? "Loading users..." : "Select User"}</option>
              {users.length === 0 && !loadingUsers ? <option value="" disabled>No users found</option> : users.map((user) => {
                const userName = user.username || user.name || user.fullName || user.email || `User ${user.id}`;
                return <option key={user.id} value={String(user.id)} style={{ color: colors.text }}>{userName}</option>;
              })}
            </select>
            <svg style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: colors.textMuted, pointerEvents: "none" }} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
          <button onClick={handleSave} disabled={loading} style={{ padding: "1rem 3rem", fontSize: "1.1rem", fontWeight: 600, textTransform: "uppercase", backgroundColor: colors.primary, color: colors.white, border: "none", borderRadius: "6px", cursor: loading ? "not-allowed" : "pointer", letterSpacing: "0.5px", opacity: loading ? 0.6 : 1 }} onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = colors.primaryHover)} onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = colors.primary)}>
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {showRecordModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }} onClick={() => setShowRecordModal(false)}>
          <div style={{ background: colors.white, borderRadius: "12px", width: "90%", maxWidth: "700px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.5rem", borderBottom: `1px solid ${colors.border}` }}>
              <h3 style={{ margin: 0, fontSize: "1.5rem", color: colors.primary, textTransform: "uppercase", fontWeight: 700 }}>Add Stock Record</h3>
              <button onClick={() => setShowRecordModal(false)} style={{ background: "none", border: "none", fontSize: "1.8rem", cursor: "pointer", color: "#666", padding: 0, width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>

            <div style={{ padding: "2rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div>
                  <label style={{ fontSize: "0.9rem", fontWeight: 600, color: colors.text, marginBottom: "0.5rem", display: "block", textTransform: "uppercase" }}>PRODUCT *</label>
                  <select name="productId" value={currentRecord.productId} onChange={handleRecordChange} required style={{ width: "100%", padding: "0.8rem", fontSize: "1rem", border: `1px solid ${colors.border}`, borderRadius: "6px", outline: "none", boxSizing: "border-box", backgroundColor: colors.white }}>
                    <option value="">Select Product</option>
                    {products.map((product) => <option key={product.id} value={String(product.id)}>{product.productName || product.name || `Product ${product.id}`}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.9rem", fontWeight: 600, color: colors.text, marginBottom: "0.5rem", display: "block", textTransform: "uppercase" }}>CATEGORY *</label>
                  <select name="categoryId" value={currentRecord.categoryId} onChange={handleRecordChange} required style={{ width: "100%", padding: "0.8rem", fontSize: "1rem", border: `1px solid ${colors.border}`, borderRadius: "6px", outline: "none", boxSizing: "border-box", backgroundColor: colors.white }}>
                    <option value="">Select Category</option>
                    {categories.map((category) => <option key={category.id} value={String(category.id)}>{category.categoryName || category.name || `Category ${category.id}`}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.9rem", fontWeight: 600, color: colors.text, marginBottom: "0.5rem", display: "block", textTransform: "uppercase" }}>SUB-CATEGORY *</label>
                  <select name="subCategoryId" value={currentRecord.subCategoryId} onChange={handleRecordChange} required disabled={!currentRecord.categoryId} style={{ width: "100%", padding: "0.8rem", fontSize: "1rem", border: `1px solid ${colors.border}`, borderRadius: "6px", outline: "none", boxSizing: "border-box", backgroundColor: colors.white, cursor: !currentRecord.categoryId ? "not-allowed" : "pointer", opacity: !currentRecord.categoryId ? 0.6 : 1 }}>
                    <option value="">Select Sub-Category</option>
                    {subCategories.map((subCategory) => <option key={subCategory.id} value={String(subCategory.id)}>{subCategory.subCategoryName || subCategory.name || `Sub-Category ${subCategory.id}`}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.9rem", fontWeight: 600, color: colors.text, marginBottom: "0.5rem", display: "block", textTransform: "uppercase" }}>QUANTITY *</label>
                  <input type="number" name="quantity" value={currentRecord.quantity} onChange={handleRecordChange} min="1" required style={{ width: "100%", padding: "0.8rem", fontSize: "1rem", border: `1px solid ${colors.border}`, borderRadius: "6px", outline: "none", boxSizing: "border-box" }} />
                </div>

                <div>
                  <label style={{ fontSize: "0.9rem", fontWeight: 600, color: colors.text, marginBottom: "0.5rem", display: "block", textTransform: "uppercase" }}>UNIT PRICE *</label>
                  <input type="number" name="unitPrice" value={currentRecord.unitPrice} onChange={handleRecordChange} step="0.01" min="0" required style={{ width: "100%", padding: "0.8rem", fontSize: "1rem", border: `1px solid ${colors.border}`, borderRadius: "6px", outline: "none", boxSizing: "border-box" }} />
                </div>

                <div>
                  <label style={{ fontSize: "0.9rem", fontWeight: 600, color: colors.text, marginBottom: "0.5rem", display: "block", textTransform: "uppercase" }}>ACCOUNT TO CREDIT *</label>
                  <select name="accountToCredit" value={currentRecord.accountToCredit} onChange={handleRecordChange} required style={{ width: "100%", padding: "0.8rem", fontSize: "1rem", border: `1px solid ${colors.border}`, borderRadius: "6px", outline: "none", boxSizing: "border-box", backgroundColor: colors.white }}>
                    <option value="">Select Account</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                    <option value="Accounts Payable">Accounts Payable</option>
                    <option value="Inventory">Inventory</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.9rem", fontWeight: 600, color: colors.text, marginBottom: "0.5rem", display: "block", textTransform: "uppercase" }}>ACCOUNT TO DEBIT *</label>
                  <select name="accountToDebit" value={currentRecord.accountToDebit} onChange={handleRecordChange} required style={{ width: "100%", padding: "0.8rem", fontSize: "1rem", border: `1px solid ${colors.border}`, borderRadius: "6px", outline: "none", boxSizing: "border-box", backgroundColor: colors.white }}>
                    <option value="">Select Account</option>
                    <option value="Inventory">Inventory</option>
                    <option value="Purchases">Purchases</option>
                    <option value="Cost of Goods Sold">Cost of Goods Sold</option>
                    <option value="Expenses">Expenses</option>
                  </select>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: "0.9rem", fontWeight: 600, color: colors.text, marginBottom: "0.5rem", display: "block", textTransform: "uppercase" }}>DESCRIPTION</label>
                  <textarea name="description" rows="3" value={currentRecord.description} onChange={handleRecordChange} style={{ width: "100%", padding: "0.8rem", fontSize: "1rem", border: `1px solid ${colors.border}`, borderRadius: "6px", outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }} />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", padding: "1.5rem", borderTop: `1px solid ${colors.border}` }}>
              <button onClick={() => setShowRecordModal(false)} style={{ padding: "0.8rem 2rem", fontSize: "1rem", fontWeight: 600, textTransform: "uppercase", border: "none", borderRadius: "6px", cursor: "pointer", background: "#6c757d", color: colors.white }}>Cancel</button>
              <button onClick={handleAddRecordToTable} style={{ padding: "0.8rem 2rem", fontSize: "1rem", fontWeight: 600, textTransform: "uppercase", border: "none", borderRadius: "6px", cursor: "pointer", background: colors.primary, color: colors.white }}>Add to Table</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default Setup;
