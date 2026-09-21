// import React, { useState, useEffect } from "react";
// import "./SalesReport.css";
// import { apiRequest } from "../../../../lib/config"; // Adjust path as needed

// const SalesReportDisplay = ({ toggleReportModal }) => {
//   const [showResults, setShowResults] = useState(false);
//   const [showAllReport, setShowAllReport] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [fetching, setFetching] = useState(false);
//   const [error, setError] = useState("");
  
//   const [filters, setFilters] = useState({
//     startDate: "01/01/2024", // Changed to match your working Postman date
//     endDate: "28/01/2026",   // Changed to match your working Postman date
//     orderMethod: "",
//     displayOption: "WALK IN CREDIT SALES",
//     showAll: false,
//   });

//   const [activeTab, setActiveTab] = useState("online");
//   const [reportData, setReportData] = useState([]);
//   const [allReportData, setAllReportData] = useState({
//     online: [],
//     walkin: []
//   });
//   const [reportSummary, setReportSummary] = useState(null);

//   const closeModal = () => {
//     toggleReportModal();
//   };

//   // Convert date format from DD/MM/YYYY to YYYY-MM-DD for API
//   const formatDateForAPI = (dateString) => {
//     console.log(`🔧 Formatting date for API: ${dateString}`);
    
//     // Try DD/MM/YYYY format first
//     const parts = dateString.split('/');
//     if (parts.length === 3) {
//       const [day, month, year] = parts;
//       const formatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
//       console.log(`✅ Formatted from DD/MM/YYYY to: ${formatted}`);
//       return formatted;
//     }
    
//     // Try other formats
//     try {
//       const date = new Date(dateString);
//       if (!isNaN(date.getTime())) {
//         const formatted = date.toISOString().split('T')[0];
//         console.log(`✅ Formatted using Date object to: ${formatted}`);
//         return formatted;
//       }
//     } catch (error) {
//       console.error("❌ Error parsing date:", error);
//     }
    
//     console.warn(`⚠️ Could not parse date: ${dateString}, returning as-is`);
//     return dateString;
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFilters((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleRadioChange = (option) => {
//     setFilters((prev) => ({
//       ...prev,
//       displayOption: option,
//     }));
//   };

//   const handleCheckboxChange = () => {
//     const newValue = !filters.showAll;
//     setFilters((prev) => ({
//       ...prev,
//       showAll: newValue,
//     }));
//   };

//   const fetchSalesReport = async (endpoint, params = {}) => {
//     try {
//       console.log(`📊 Fetching sales report from: ${endpoint}`);
//       console.log(`📅 Params:`, params);
      
//       setFetching(true);
//       setError("");
      
//       const queryParams = new URLSearchParams();
//       Object.entries(params).forEach(([key, value]) => {
//         if (value) {
//           queryParams.append(key, value);
//         }
//       });
      
//       const url = queryParams.toString() ? `${endpoint}?${queryParams.toString()}` : endpoint;
//       console.log(`🔗 API Endpoint: ${url}`);
      
//       const response = await apiRequest(url, "GET");
//       console.log("✅ API Response received");
//       console.log("📦 Full response:", response);
//       console.log("🔍 Checking response structure...");
      
//       return response;
//     } catch (err) {
//       console.error("❌ Error fetching sales report:", err);
//       console.error("🔍 Error details:", err.message || err);
//       throw err;
//     } finally {
//       setFetching(false);
//     }
//   };

//   // Helper function to extract sales data from API response
//   const extractSalesData = (response) => {
//     console.log("🔍 Extracting sales data from response...");
//     console.log("📊 Response keys:", Object.keys(response || {}));
    
//     let salesData = [];
    
//     // Check multiple possible response formats
//     if (response?.response?.content && Array.isArray(response.response.content)) {
//       salesData = response.response.content;
//       console.log(`✅ Found ${salesData.length} records in response.response.content`);
//     } 
//     else if (response?.content && Array.isArray(response.content)) {
//       salesData = response.content;
//       console.log(`✅ Found ${salesData.length} records in response.content`);
//     }
//     else if (response?.data && Array.isArray(response.data)) {
//       salesData = response.data;
//       console.log(`✅ Found ${salesData.length} records in response.data`);
//     }
//     else if (response?.items && Array.isArray(response.items)) {
//       salesData = response.items;
//       console.log(`✅ Found ${salesData.length} records in response.items`);
//     }
//     else if (Array.isArray(response)) {
//       salesData = response;
//       console.log(`✅ Found ${salesData.length} records in response array`);
//     }
//     else {
//       console.warn("⚠️ Unexpected response format, trying to find any array...");
//       console.log("Response:", response);
      
//       // Try to find any array in the response
//       for (const key in response) {
//         if (response[key] && Array.isArray(response[key])) {
//           salesData = response[key];
//           console.log(`✅ Found ${salesData.length} records in response.${key}`);
//           break;
//         }
//       }
      
//       if (salesData.length === 0) {
//         console.log("📭 No array data found in response");
//       }
//     }
    
//     if (salesData.length > 0) {
//       console.log("📄 Sample record:", salesData[0]);
//     }
    
//     return salesData;
//   };

//   // Transform API data to table format
//   const transformToTableData = (salesData, typeOverride = "") => {
//     if (!salesData || !Array.isArray(salesData) || salesData.length === 0) {
//       return [];
//     }
    
//     return salesData.map((item, index) => ({
//       sn: index + 1,
//       date: item.createdAt ? item.createdAt.split('T')[0] : 
//             item.date ? item.date.split('T')[0] : 
//             item.orderDate ? item.orderDate.split('T')[0] : 'N/A',
//       referenceNo: item.referenceNo || item.referenceNumber || item.reference || 'N/A',
//       accountNo: item.accountNumber || item.accountNo || item.customerAccount || 'N/A',
//       product: item.productName || item.product || item.itemName || 'N/A',
//       description: item.description || item.productDescription || 'N/A',
//       category: item.category || item.productCategory || item.type || 'N/A',
//       subCategory: item.subCategory || item.subcategory || item.productSubCategory || 'N/A',
//       type: typeOverride || item.orderType || item.saleType || item.paymentType || 'N/A',
//       totalAmount: item.totalAmount || item.amount || item.price || item.total || 
//                   (item.unitPrice && item.quantity ? item.unitPrice * item.quantity : 0) || 0,
//       status: item.status || item.orderStatus || item.paymentStatus || 'N/A'
//     }));
//   };

//   const fetchWalkInCreditSales = async () => {
//     try {
//       console.log("=".repeat(60));
//       console.log("🚀 START: Fetching Walk-In Credit Sales report");
//       console.log("=".repeat(60));
      
//       const startDate = formatDateForAPI(filters.startDate);
//       const endDate = formatDateForAPI(filters.endDate);
      
//       console.log(`📅 Using dates: ${startDate} to ${endDate}`);
      
//       const response = await fetchSalesReport("/sales/reports/walk-in/credit", {
//         startDate: `${startDate}T00:00:00`,
//         endDate: `${endDate}T23:59:59`
//       });
      
//       const salesData = extractSalesData(response);
      
//       const transformedData = transformToTableData(salesData, "CREDIT");
      
//       setReportData(transformedData);
//       setReportSummary({
//         totalRecords: transformedData.length,
//         totalAmount: transformedData.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0)
//       });
      
//       console.log(`✅ Transformed ${transformedData.length} records for display`);
//       console.log("=".repeat(60));
      
//     } catch (err) {
//       console.error("❌ Failed to fetch walk-in credit sales:", err);
//       setError(`Walk-In Credit Sales: ${err.message || "No data available"}`);
//       setReportData([]);
//       setReportSummary(null);
//     }
//   };

//   const fetchWalkInCashSales = async () => {
//     try {
//       console.log("🚀 Fetching Walk-In Cash Sales report...");
      
//       const startDate = formatDateForAPI(filters.startDate);
//       const endDate = formatDateForAPI(filters.endDate);
      
//       const response = await fetchSalesReport("/sales/reports/walk-in/cash", {
//         startDate: `${startDate}T00:00:00`,
//         endDate: `${endDate}T23:59:59`
//       });
      
//       const salesData = extractSalesData(response);
      
//       const transformedData = transformToTableData(salesData, "CASH");
      
//       setReportData(transformedData);
//       setReportSummary({
//         totalRecords: transformedData.length,
//         totalAmount: transformedData.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0)
//       });
      
//     } catch (err) {
//       console.error("❌ Failed to fetch walk-in cash sales:", err);
//       setError(`Walk-In Cash Sales: ${err.message || "No data available"}`);
//       setReportData([]);
//       setReportSummary(null);
//     }
//   };

//   const fetchOnlineCreditSales = async () => {
//     try {
//       console.log("🚀 Fetching Online Credit Sales report...");
      
//       const startDate = formatDateForAPI(filters.startDate);
//       const endDate = formatDateForAPI(filters.endDate);
      
//       const response = await fetchSalesReport("/sales/reports/online/installment", {
//         startDate: `${startDate}T00:00:00`,
//         endDate: `${endDate}T23:59:59`
//       });
      
//       const salesData = extractSalesData(response);
      
//       const transformedData = transformToTableData(salesData, "CREDIT/INSTALLMENT");
      
//       setReportData(transformedData);
//       setReportSummary({
//         totalRecords: transformedData.length,
//         totalAmount: transformedData.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0)
//       });
      
//     } catch (err) {
//       console.error("❌ Failed to fetch online credit sales:", err);
//       setError(`Online Credit Sales: ${err.message || "No data available"}`);
//       setReportData([]);
//       setReportSummary(null);
//     }
//   };

//   const fetchOnlineOneOffSales = async () => {
//     try {
//       console.log("🚀 Fetching Online One-Off Sales report...");
      
//       const startDate = formatDateForAPI(filters.startDate);
//       const endDate = formatDateForAPI(filters.endDate);
      
//       const response = await fetchSalesReport("/sales/reports/online/one-off", {
//         startDate: `${startDate}T00:00:00`,
//         endDate: `${endDate}T23:59:59`
//       });
      
//       const salesData = extractSalesData(response);
      
//       const transformedData = transformToTableData(salesData, "ONE-OFF");
      
//       setReportData(transformedData);
//       setReportSummary({
//         totalRecords: transformedData.length,
//         totalAmount: transformedData.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0)
//       });
      
//     } catch (err) {
//       console.error("❌ Failed to fetch online one-off sales:", err);
//       setError(`Online One-Off Sales: ${err.message || "No data available"}`);
//       setReportData([]);
//       setReportSummary(null);
//     }
//   };

//   const fetchAllOnlineSales = async () => {
//     try {
//       console.log("🚀 Fetching All Online Sales report...");
      
//       const startDate = formatDateForAPI(filters.startDate);
//       const endDate = formatDateForAPI(filters.endDate);
      
//       const response = await fetchSalesReport("/sales/reports/all/online", {
//         startDate: `${startDate}T00:00:00`,
//         endDate: `${endDate}T23:59:59`
//       });
      
//       const salesData = extractSalesData(response);
      
//       const transformedData = transformToTableData(salesData);
      
//       setAllReportData(prev => ({
//         ...prev,
//         online: transformedData
//       }));
      
//       console.log(`📊 Updated online tab with ${transformedData.length} records`);
      
//     } catch (err) {
//       console.error("❌ Failed to fetch all online sales:", err);
//       setError(`All Online Sales: ${err.message || "No data available"}`);
//       setAllReportData(prev => ({
//         ...prev,
//         online: []
//       }));
//     }
//   };

//   const fetchAllWalkInSales = async () => {
//     try {
//       console.log("🚀 Fetching All Walk-In Sales report...");
      
//       const startDate = formatDateForAPI(filters.startDate);
//       const endDate = formatDateForAPI(filters.endDate);
      
//       const response = await fetchSalesReport("/sales/reports/all/walk-in", {
//         startDate: `${startDate}T00:00:00`,
//         endDate: `${endDate}T23:59:59`
//       });
      
//       const salesData = extractSalesData(response);
      
//       const transformedData = transformToTableData(salesData);
      
//       setAllReportData(prev => ({
//         ...prev,
//         walkin: transformedData
//       }));
      
//       console.log(`📊 Updated walkin tab with ${transformedData.length} records`);
      
//     } catch (err) {
//       console.error("❌ Failed to fetch all walk-in sales:", err);
//       setError(`All Walk-In Sales: ${err.message || "No data available"}`);
//       setAllReportData(prev => ({
//         ...prev,
//         walkin: []
//       }));
//     }
//   };

//   const handleDisplay = async () => {
//     console.log("=".repeat(60));
//     console.log("🚀 DISPLAY button clicked");
//     console.log("📋 Selected filters:", filters);
//     console.log("=".repeat(60));
    
//     setLoading(true);
//     setError("");
//     setReportData([]);
//     setReportSummary(null);
//     setAllReportData({ online: [], walkin: [] });
    
//     try {
//       if (filters.showAll) {
//         console.log("📊 Fetching ALL reports...");
//         setShowAllReport(true);
        
//         await Promise.all([
//           fetchAllOnlineSales(),
//           fetchAllWalkInSales()
//         ]);
        
//       } else {
//         console.log("📊 Fetching specific report...");
//         setShowAllReport(false);
        
//         switch (filters.displayOption) {
//           case "WALK IN CREDIT SALES":
//             await fetchWalkInCreditSales();
//             break;
//           case "WALK IN CASH SALES":
//             await fetchWalkInCashSales();
//             break;
//           case "ONLINE CREDIT":
//             await fetchOnlineCreditSales();
//             break;
//           case "ONLINE ONE OFF":
//             await fetchOnlineOneOffSales();
//             break;
//           default:
//             setError("Unknown report type selected");
//             return;
//         }
//       }
      
//       setShowResults(true);
//       console.log("✅ REPORT DISPLAY READY");
//       console.log("=".repeat(60));
      
//     } catch (err) {
//       console.error("❌ Error displaying report:", err);
//       setError(`Failed to load report: ${err.message || "Please check your filters and try again."}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleBack = () => {
//     setShowResults(false);
//     setShowAllReport(false);
//     setReportData([]);
//     setReportSummary(null);
//     setError("");
//   };

//   // Fetch data when tab changes in All Report view
//   useEffect(() => {
//     if (showAllReport && showResults) {
//       console.log(`🔄 Tab changed to: ${activeTab}`);
//       if (activeTab === "online" && allReportData.online.length === 0) {
//         fetchAllOnlineSales();
//       } else if (activeTab === "walkin" && allReportData.walkin.length === 0) {
//         fetchAllWalkInSales();
//       }
//     }
//   }, [activeTab, showAllReport, showResults]);

//   const getReportTitle = () => {
//     if (filters.showAll) {
//       return "ALL SALES REPORT";
//     }
    
//     switch (filters.displayOption) {
//       case "WALK IN CREDIT SALES":
//         return "WALK IN CUSTOMER CREDIT SALES REPORT";
//       case "WALK IN CASH SALES":
//         return "WALK IN CUSTOMER CASH SALES REPORT";
//       case "ONLINE CREDIT":
//         return "ONLINE CUSTOMER CREDIT SALES REPORT";
//       case "ONLINE ONE OFF":
//         return "ONLINE ONE OFF SALES REPORT";
//       default:
//         return "SALES REPORT";
//     }
//   };

//   const getAllReportTitle = () => {
//     return activeTab === "online" 
//       ? "ALL SALES FOR ONLINE(ONE-OFF/INSTALL) REPORT" 
//       : "ALL SALES FOR WALKIN REPORT";
//   };

//   const getTabData = () => {
//     return allReportData[activeTab] || [];
//   };

//   const formatCurrency = (amount) => {
//     if (!amount && amount !== 0) return "₦0.00";
//     const num = parseFloat(amount);
//     if (isNaN(num)) return "₦0.00";
//     return `₦${num.toLocaleString('en-NG', {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2
//     })}`;
//   };

//   const handlePrint = () => {
//     window.print();
//   };

//   // Render the "ALL" report with tabs
//   const renderAllReport = () => {
//     const tabData = getTabData();
//     const totalAmount = tabData.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0);
    
//     return (
//       <div className="sales-report-wrapper">
//         <div className="all-report-header">
//           <div className="app-brand"></div>
//           <div className="main-report-title">
//             <h2>SALES ORDER REPORT</h2>
//             <h3>ALL SALES {activeTab.toUpperCase()}</h3>
//           </div>
//           <div className="header-controls">
//             <button className="icon-btn grid-icon">⊞</button>
//             <button className="icon-btn close-icon" onClick={closeModal}>✕</button>
//           </div>
//         </div>

//         <div className="report-content">
//           <div className="company-info-section">
//             <h2>PM MARKET HUB</h2>
//             <p>64 OGUI ROAD, ENUGU STATE</p>
//             <p>TEL: 0900000XX</p>
//           </div>

//           <div className="all-report-subtitle">
//             <h3>{getAllReportTitle()}</h3>
//           </div>

//           {error && (
//             <div className="error-message">
//               ⚠️ {error}
//             </div>
//           )}

//           {fetching && (
//             <div className="loading-message">
//               Loading {activeTab} data...
//             </div>
//           )}

//           <div className="report-tabs-container">
//             <div className="report-tabs">
//               <button 
//                 className={`tab ${activeTab === "online" ? "active" : ""}`}
//                 onClick={() => setActiveTab("online")}
//                 disabled={fetching}
//               >
//                 ONLINE
//               </button>
//               <button 
//                 className={`tab ${activeTab === "walkin" ? "active" : ""}`}
//                 onClick={() => setActiveTab("walkin")}
//                 disabled={fetching}
//               >
//                 WALKIN
//               </button>
//             </div>
//           </div>

//           <div className="filter-info">
//             <div className="filter-info-item">
//               <span>Period:</span>
//               <strong>{filters.startDate} to {filters.endDate}</strong>
//             </div>
//             <div className="filter-info-item">
//               <span>Total Records:</span>
//               <strong>{tabData.length}</strong>
//             </div>
//             {tabData.length > 0 && (
//               <div className="filter-info-item">
//                 <span>Total Amount:</span>
//                 <strong>{formatCurrency(totalAmount)}</strong>
//               </div>
//             )}
//           </div>

//           <div className="table-wrapper">
//             <table className="results-table">
//               <thead>
//                 <tr>
//                   <th>S/N</th>
//                   <th>DATE</th>
//                   <th>REFERENCE NO</th>
//                   <th>ACCOUNT NO</th>
//                   <th>PRODUCT</th>
//                   <th>DESCRIPTION</th>
//                   <th>CATEGORY</th>
//                   <th>SUB-CATEGORY</th>
//                   <th>TYPE (ONE-OFF/INSTALL)</th>
//                   <th>AMOUNT</th>
//                   <th>STATUS</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {tabData.length > 0 ? (
//                   tabData.map((row) => (
//                     <tr key={row.sn}>
//                       <td>{row.sn}.</td>
//                       <td>{row.date}</td>
//                       <td>{row.referenceNo}</td>
//                       <td>{row.accountNo}</td>
//                       <td>{row.product}</td>
//                       <td>{row.description}</td>
//                       <td>{row.category}</td>
//                       <td>{row.subCategory}</td>
//                       <td>{row.type}</td>
//                       <td>{formatCurrency(row.totalAmount)}</td>
//                       <td>{row.status}</td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan="11" className="no-data">
//                       {fetching ? "Loading data..." : "No data available for the selected filters"}
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>

//           <div className="report-actions">
//             <button className="back-btn" onClick={handleBack} disabled={loading || fetching}>
//               ← BACK TO FILTERS
//             </button>
//             <button className="print-btn" onClick={handlePrint} disabled={tabData.length === 0}>
//               🖨 PRINT REPORT
//             </button>
//             <button className="print-btn" onClick={handleExportAllCSV} disabled={tabData.length === 0}>
//               EXPORT CSV
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Render the regular report
//   const renderRegularReport = () => {
//     const totalAmount = reportData.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0);
    
//     return (
//       <div className="sales-report-wrapper">
//         <div className="sales-report-header">
//           <h1>{getReportTitle()}</h1>
//           <div className="header-icons">
//             <button className="icon-btn grid-icon">
//               <span>⊞</span>
//             </button>
//             <button className="icon-btn close-icon" onClick={closeModal}>
//               ✕
//             </button>
//           </div>
//         </div>

//         <div className="results-section">
//           <div className="company-info">
//             <h2>PM MARKET HUB</h2>
//             <p>64 OGUI ROAD, ENUGU-STATE</p>
//             <p>TEL: 080XXXXX</p>
//           </div>

//           {error && (
//             <div className="error-message">
//               ⚠️ {error}
//             </div>
//           )}

//           {fetching && (
//             <div className="loading-message">
//               Loading report data...
//             </div>
//           )}

//           <div className="report-summary">
//             <div className="summary-item">
//               <span>Total Records:</span>
//               <strong>{reportData.length}</strong>
//             </div>
//             {reportData.length > 0 && (
//               <div className="summary-item">
//                 <span>Total Amount:</span>
//                 <strong>{formatCurrency(totalAmount)}</strong>
//               </div>
//             )}
//           </div>

//           <div className="results-actions">
//             <button className="back-btn" onClick={handleBack} disabled={loading || fetching}>
//               ← BACK TO FILTERS
//             </button>
//             <button className="print-btn" onClick={handlePrint} disabled={reportData.length === 0}>
//               🖨 PRINT REPORT
//             </button>
//             <button className="print-btn" onClick={handleExportRegularCSV} disabled={reportData.length === 0}>
//               EXPORT CSV
//             </button>
//           </div>

//           <div className="table-wrapper">
//             <table className="results-table">
//               <thead>
//                 <tr>
//                   <th>S/N</th>
//                   <th>DATE</th>
//                   <th>REFERENCE NO</th>
//                   <th>ACCOUNT NO</th>
//                   <th>PRODUCT</th>
//                   <th>DESCRIPTION</th>
//                   <th>CATEGORY</th>
//                   <th>SUB-CATEGORY</th>
//                   <th>TYPE</th>
//                   <th>AMOUNT</th>
//                   <th>STATUS</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {reportData.length > 0 ? (
//                   reportData.map((row) => (
//                     <tr key={row.sn}>
//                       <td>{row.sn}.</td>
//                       <td>{row.date}</td>
//                       <td>{row.referenceNo}</td>
//                       <td>{row.accountNo}</td>
//                       <td>{row.product}</td>
//                       <td>{row.description}</td>
//                       <td>{row.category}</td>
//                       <td>{row.subCategory}</td>
//                       <td>{row.type}</td>
//                       <td>{formatCurrency(row.totalAmount)}</td>
//                       <td>{row.status}</td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan="11" className="no-data">
//                       {fetching ? "Loading data..." : error || "No data available for the selected filters"}
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="sales-report-container">
//       {!showResults ? (
//         // FILTER SCREEN
//         <div className="sales-report-wrapper">
//           <div className="sales-report-header">
//             <h1>SALES REPORT DISPLAY SECTION</h1>
//             <div className="header-icons">
//               <button className="icon-btn grid-icon">
//                 <span>⊞</span>
//               </button>
//               <button className="icon-btn close-icon" onClick={closeModal}>
//                 ✕
//               </button>
//             </div>
//           </div>

//           {error && (
//             <div className="error-message">
//               ⚠️ {error}
//             </div>
//           )}

//           <div className="filter-section">
//             <div className="filter-row">
//               <div className="filter-group">
//                 <label>START DATE</label>
//                 <div className="date-input-wrapper">
//                   <span className="calendar-icon">📅</span>
//                   <input
//                     type="text"
//                     name="startDate"
//                     value={filters.startDate}
//                     onChange={handleInputChange}
//                     className="date-input"
//                     placeholder="DD/MM/YYYY"
//                   />
//                 </div>
//               </div>

//               <div className="filter-group">
//                 <label>END DATE</label>
//                 <div className="date-input-wrapper">
//                   <span className="calendar-icon">📅</span>
//                   <input
//                     type="text"
//                     name="endDate"
//                     value={filters.endDate}
//                     onChange={handleInputChange}
//                     className="date-input"
//                     placeholder="DD/MM/YYYY"
//                   />
//                 </div>
//               </div>

//               <div className="filter-group">
//                 <label>ORDER METHOD</label>
//                 <select
//                   name="orderMethod"
//                   value={filters.orderMethod}
//                   onChange={handleInputChange}
//                   className="select-input"
//                 >
//                   <option value="">SELECT</option>
//                   <option value="online">Online</option>
//                   <option value="walk-in">Walk In</option>
//                 </select>
//               </div>
//             </div>

//             <div className="all-checkbox">
//               <input
//                 type="checkbox"
//                 id="showAll"
//                 checked={filters.showAll}
//                 onChange={handleCheckboxChange}
//                 disabled={loading}
//               />
//               <label htmlFor="showAll">ALL</label>
//             </div>

//             <div className="display-options-section">
//               <h3 className="display-options-title">DISPLAY OPTIONS</h3>

//               <div className="radio-options">
//                 <label className="radio-label">
//                   <input
//                     type="radio"
//                     name="displayOption"
//                     checked={filters.displayOption === "WALK IN CREDIT SALES"}
//                     onChange={() => handleRadioChange("WALK IN CREDIT SALES")}
//                     disabled={loading || filters.showAll}
//                   />
//                   <span>WALK IN CREDIT SALES</span>
//                 </label>

//                 <label className="radio-label">
//                   <input
//                     type="radio"
//                     name="displayOption"
//                     checked={filters.displayOption === "WALK IN CASH SALES"}
//                     onChange={() => handleRadioChange("WALK IN CASH SALES")}
//                     disabled={loading || filters.showAll}
//                   />
//                   <span>WALK IN CASH SALES</span>
//                 </label>

//                 <label className="radio-label">
//                   <input
//                     type="radio"
//                     name="displayOption"
//                     checked={filters.displayOption === "ONLINE CREDIT"}
//                     onChange={() => handleRadioChange("ONLINE CREDIT")}
//                     disabled={loading || filters.showAll}
//                   />
//                   <span>ONLINE CREDIT</span>
//                 </label>

//                 <label className="radio-label">
//                   <input
//                     type="radio"
//                     name="displayOption"
//                     checked={filters.displayOption === "ONLINE ONE OFF"}
//                     onChange={() => handleRadioChange("ONLINE ONE OFF")}
//                     disabled={loading || filters.showAll}
//                   />
//                   <span>ONLINE ONE OFF</span>
//                 </label>
//               </div>

//               <button 
//                 className="display-btn" 
//                 onClick={handleDisplay}
//                 disabled={loading || fetching}
//               >
//                 {loading ? "LOADING..." : "DISPLAY"}
//               </button>
//             </div>
//           </div>
//         </div>
//       ) : showAllReport ? (
//         // ALL REPORT WITH TABS
//         renderAllReport()
//       ) : (
//         // REGULAR REPORT
//         renderRegularReport()
//       )}
//     </div>
//   );
// };

// export default SalesReportDisplay;


import React, { useState, useEffect } from "react";
import "./SalesReport.css";
import BranchBadge from "../../../shared/BranchBadge";
import { apiRequest } from "../../../../lib/config"; // Adjust path as needed
import { useBranchOptions } from "../../../../lib/useBranchOptions";
import * as XLSX from "xlsx";

const SalesReportDisplay = ({ toggleReportModal }) => {
  const [showResults, setShowResults] = useState(false);
  const [showAllReport, setShowAllReport] = useState(false);
  const [viewMode, setViewMode] = useState("generator");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [branchId, setBranchId] = useState("");
  const { options: branchOptions, loading: branchesLoading } = useBranchOptions();
  
  // Default the range dynamically so it never goes stale: from a few years back through
  // today. A hard-coded end date in the past silently hides newly-approved sales.
  const toDdMmYyyy = (date) => {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}/${date.getFullYear()}`;
  };
  const defaultStart = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 3);
    d.setMonth(0, 1);
    return toDdMmYyyy(d);
  };

  const [filters, setFilters] = useState({
    startDate: defaultStart(),
    endDate: toDdMmYyyy(new Date()),
    orderMethod: "",
    displayOption: "WALK IN CREDIT SALES",
    showAll: false,
  });

  const [activeTab, setActiveTab] = useState("online");
  const [reportData, setReportData] = useState([]);
  const [allReportData, setAllReportData] = useState({
    online: [],
    walkin: []
  });
  const [reportSummary, setReportSummary] = useState(null);

  const closeModal = () => {
    toggleReportModal();
  };

  // Convert date format from DD/MM/YYYY to YYYY-MM-DD for API
  const formatDateForAPI = (dateString) => {
    console.log(`🔧 Formatting date for API: ${dateString}`);
    
    // Try DD/MM/YYYY format first
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const formatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      console.log(`✅ Formatted from DD/MM/YYYY to: ${formatted}`);
      return formatted;
    }
    
    // Try other formats
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const formatted = date.toISOString().split('T')[0];
        console.log(`✅ Formatted using Date object to: ${formatted}`);
        return formatted;
      }
    } catch (error) {
      console.error("❌ Error parsing date:", error);
    }
    
    console.warn(`⚠️ Could not parse date: ${dateString}, returning as-is`);
    return dateString;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRadioChange = (option) => {
    setFilters((prev) => ({
      ...prev,
      displayOption: option,
    }));
  };

  const handleCheckboxChange = () => {
    const newValue = !filters.showAll;
    setFilters((prev) => ({
      ...prev,
      showAll: newValue,
    }));
  };

  const fetchSalesReport = async (endpoint, params = {}) => {
    try {
      console.log(`📊 Fetching sales report from: ${endpoint}`);
      console.log(`📅 Params:`, params);

      setFetching(true);
      setError("");

      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });

      if (branchId) {
        queryParams.append("branchId", branchId);
      }

      const url = queryParams.toString() ? `${endpoint}?${queryParams.toString()}` : endpoint;
      console.log(`🔗 API Endpoint: ${url}`);

      const response = await apiRequest(url, "GET");
      console.log("✅ API Response received");
      console.log("📦 Full response:", response);
      console.log("🔍 Checking response structure...");

      return response;
    } catch (err) {
      console.error("❌ Error fetching sales report:", err);
      console.error("🔍 Error details:", err.message || err);
      throw err;
    } finally {
      setFetching(false);
    }
  };

  // Helper function to extract sales data from API response
  const extractSalesData = (response) => {
    console.log("🔍 Extracting sales data from response...");
    console.log("📊 Response keys:", Object.keys(response || {}));
    
    let salesData = [];
    
    // Check multiple possible response formats
    if (response?.response?.content && Array.isArray(response.response.content)) {
      salesData = response.response.content;
      console.log(`✅ Found ${salesData.length} records in response.response.content`);
    } 
    else if (response?.content && Array.isArray(response.content)) {
      salesData = response.content;
      console.log(`✅ Found ${salesData.length} records in response.content`);
    }
    else if (response?.data && Array.isArray(response.data)) {
      salesData = response.data;
      console.log(`✅ Found ${salesData.length} records in response.data`);
    }
    else if (response?.items && Array.isArray(response.items)) {
      salesData = response.items;
      console.log(`✅ Found ${salesData.length} records in response.items`);
    }
    else if (Array.isArray(response)) {
      salesData = response;
      console.log(`✅ Found ${salesData.length} records in response array`);
    }
    else {
      console.warn("⚠️ Unexpected response format, trying to find any array...");
      console.log("Response:", response);
      
      // Try to find any array in the response
      for (const key in response) {
        if (response[key] && Array.isArray(response[key])) {
          salesData = response[key];
          console.log(`✅ Found ${salesData.length} records in response.${key}`);
          break;
        }
      }
      
      if (salesData.length === 0) {
        console.log("📭 No array data found in response");
      }
    }
    
    if (salesData.length > 0) {
      console.log("📄 Sample record:", salesData[0]);
    }
    
    return salesData;
  };

  // Transform API data to table format
  const transformToTableData = (salesData, typeOverride = "") => {
    if (!salesData || !Array.isArray(salesData) || salesData.length === 0) {
      return [];
    }
    
    return salesData.map((item, index) => ({
      sn: index + 1,
      date: item.createdAt ? item.createdAt.split('T')[0] : 
            item.date ? item.date.split('T')[0] : 
            item.orderDate ? item.orderDate.split('T')[0] : 'N/A',
      referenceNo: item.referenceNo || item.referenceNumber || item.reference || 'N/A',
      accountNo: item.accountNumber || item.accountNo || item.customerAccount || 'N/A',
      product: item.productName || item.product || item.itemName || 'N/A',
      description: item.description || item.productDescription || 'N/A',
      category: item.category || item.productCategory || item.type || 'N/A',
      subCategory: item.subCategory || item.subcategory || item.productSubCategory || 'N/A',
      type: typeOverride || item.orderType || item.saleType || item.paymentType || 'N/A',
      totalAmount: item.totalAmount || item.amount || item.price || item.total || 
                  (item.unitPrice && item.quantity ? item.unitPrice * item.quantity : 0) || 0,
      status: item.status || item.orderStatus || item.paymentStatus || 'N/A'
    }));
  };

  const fetchWalkInCreditSales = async () => {
    try {
      console.log("=".repeat(60));
      console.log("🚀 START: Fetching Walk-In Credit Sales report");
      console.log("=".repeat(60));
      
      const startDate = formatDateForAPI(filters.startDate);
      const endDate = formatDateForAPI(filters.endDate);
      
      console.log(`📅 Using dates: ${startDate} to ${endDate}`);
      
      const response = await fetchSalesReport("/sales/reports/walk-in/credit", {
        startDate: `${startDate}T00:00:00`,
        endDate: `${endDate}T23:59:59`
      });
      
      const salesData = extractSalesData(response);
      
      const transformedData = transformToTableData(salesData, "CREDIT");
      
      setReportData(transformedData);
      setReportSummary({
        totalRecords: transformedData.length,
        totalAmount: transformedData.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0)
      });
      
      console.log(`✅ Transformed ${transformedData.length} records for display`);
      console.log("=".repeat(60));
      
    } catch (err) {
      console.error("❌ Failed to fetch walk-in credit sales:", err);
      setError(`Walk-In Credit Sales: ${err.message || "No data available"}`);
      setReportData([]);
      setReportSummary(null);
    }
  };

  const fetchWalkInCashSales = async () => {
    try {
      console.log("🚀 Fetching Walk-In Cash Sales report...");
      
      const startDate = formatDateForAPI(filters.startDate);
      const endDate = formatDateForAPI(filters.endDate);
      
      const response = await fetchSalesReport("/sales/reports/walk-in/cash", {
        startDate: `${startDate}T00:00:00`,
        endDate: `${endDate}T23:59:59`
      });
      
      const salesData = extractSalesData(response);
      
      const transformedData = transformToTableData(salesData, "CASH");
      
      setReportData(transformedData);
      setReportSummary({
        totalRecords: transformedData.length,
        totalAmount: transformedData.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0)
      });
      
    } catch (err) {
      console.error("❌ Failed to fetch walk-in cash sales:", err);
      setError(`Walk-In Cash Sales: ${err.message || "No data available"}`);
      setReportData([]);
      setReportSummary(null);
    }
  };

  const fetchOnlineCreditSales = async () => {
    try {
      console.log("🚀 Fetching Online Credit Sales report...");
      
      const startDate = formatDateForAPI(filters.startDate);
      const endDate = formatDateForAPI(filters.endDate);
      
      const response = await fetchSalesReport("/sales/reports/online/installment", {
        startDate: `${startDate}T00:00:00`,
        endDate: `${endDate}T23:59:59`
      });
      
      const salesData = extractSalesData(response);
      
      const transformedData = transformToTableData(salesData, "CREDIT/INSTALLMENT");
      
      setReportData(transformedData);
      setReportSummary({
        totalRecords: transformedData.length,
        totalAmount: transformedData.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0)
      });
      
    } catch (err) {
      console.error("❌ Failed to fetch online credit sales:", err);
      setError(`Online Credit Sales: ${err.message || "No data available"}`);
      setReportData([]);
      setReportSummary(null);
    }
  };

  const fetchOnlineOneOffSales = async () => {
    try {
      console.log("🚀 Fetching Online One-Off Sales report...");
      
      const startDate = formatDateForAPI(filters.startDate);
      const endDate = formatDateForAPI(filters.endDate);
      
      const response = await fetchSalesReport("/sales/reports/online/one-off", {
        startDate: `${startDate}T00:00:00`,
        endDate: `${endDate}T23:59:59`
      });
      
      const salesData = extractSalesData(response);
      
      const transformedData = transformToTableData(salesData, "ONE-OFF");
      
      setReportData(transformedData);
      setReportSummary({
        totalRecords: transformedData.length,
        totalAmount: transformedData.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0)
      });
      
    } catch (err) {
      console.error("❌ Failed to fetch online one-off sales:", err);
      setError(`Online One-Off Sales: ${err.message || "No data available"}`);
      setReportData([]);
      setReportSummary(null);
    }
  };

  const fetchAllOnlineSales = async () => {
    try {
      console.log("🚀 Fetching All Online Sales report...");
      
      const startDate = formatDateForAPI(filters.startDate);
      const endDate = formatDateForAPI(filters.endDate);
      
      const response = await fetchSalesReport("/sales/reports/all/online", {
        startDate: `${startDate}T00:00:00`,
        endDate: `${endDate}T23:59:59`
      });
      
      const salesData = extractSalesData(response);
      
      const transformedData = transformToTableData(salesData);
      
      setAllReportData(prev => ({
        ...prev,
        online: transformedData
      }));
      
      console.log(`📊 Updated online tab with ${transformedData.length} records`);
      
    } catch (err) {
      console.error("❌ Failed to fetch all online sales:", err);
      setError(`All Online Sales: ${err.message || "No data available"}`);
      setAllReportData(prev => ({
        ...prev,
        online: []
      }));
    }
  };

  const fetchAllWalkInSales = async () => {
    try {
      console.log("🚀 Fetching All Walk-In Sales report...");
      
      const startDate = formatDateForAPI(filters.startDate);
      const endDate = formatDateForAPI(filters.endDate);
      
      const response = await fetchSalesReport("/sales/reports/all/walk-in", {
        startDate: `${startDate}T00:00:00`,
        endDate: `${endDate}T23:59:59`
      });
      
      const salesData = extractSalesData(response);
      
      const transformedData = transformToTableData(salesData);
      
      setAllReportData(prev => ({
        ...prev,
        walkin: transformedData
      }));
      
      console.log(`📊 Updated walkin tab with ${transformedData.length} records`);
      
    } catch (err) {
      console.error("❌ Failed to fetch all walk-in sales:", err);
      setError(`All Walk-In Sales: ${err.message || "No data available"}`);
      setAllReportData(prev => ({
        ...prev,
        walkin: []
      }));
    }
  };

  const handleDisplay = async () => {
    console.log("=".repeat(60));
    console.log("🚀 DISPLAY button clicked");
    console.log("📋 Selected filters:", filters);
    console.log("=".repeat(60));
    
    setLoading(true);
    setError("");
    setReportData([]);
    setReportSummary(null);
    setAllReportData({ online: [], walkin: [] });
    
    try {
      if (filters.showAll) {
        console.log("📊 Fetching ALL reports...");
        setShowAllReport(true);
        
        await Promise.all([
          fetchAllOnlineSales(),
          fetchAllWalkInSales()
        ]);
        
      } else {
        console.log("📊 Fetching specific report...");
        setShowAllReport(false);
        
        switch (filters.displayOption) {
          case "WALK IN CREDIT SALES":
            await fetchWalkInCreditSales();
            break;
          case "WALK IN CASH SALES":
            await fetchWalkInCashSales();
            break;
          case "ONLINE CREDIT":
            await fetchOnlineCreditSales();
            break;
          case "ONLINE ONE OFF":
            await fetchOnlineOneOffSales();
            break;
          default:
            setError("Unknown report type selected");
            return;
        }
      }
      
      setShowResults(true);
      setViewMode("report");
      console.log("✅ REPORT DISPLAY READY");
      console.log("=".repeat(60));
      
    } catch (err) {
      console.error("❌ Error displaying report:", err);
      setError(`Failed to load report: ${err.message || "Please check your filters and try again."}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setShowResults(false);
    setShowAllReport(false);
    setViewMode("generator");
    setReportData([]);
    setReportSummary(null);
    setError("");
  };

  // Fetch data when tab changes in All Report view
  useEffect(() => {
    if (showAllReport && showResults) {
      console.log(`🔄 Tab changed to: ${activeTab}`);
      if (activeTab === "online" && allReportData.online.length === 0) {
        fetchAllOnlineSales();
      } else if (activeTab === "walkin" && allReportData.walkin.length === 0) {
        fetchAllWalkInSales();
      }
    }
  }, [activeTab, showAllReport, showResults]);

  const getReportTitle = () => {
    if (filters.showAll) {
      return "ALL SALES REPORT";
    }
    
    switch (filters.displayOption) {
      case "WALK IN CREDIT SALES":
        return "WALK IN CUSTOMER CREDIT SALES REPORT";
      case "WALK IN CASH SALES":
        return "WALK IN CUSTOMER CASH SALES REPORT";
      case "ONLINE CREDIT":
        return "ONLINE CUSTOMER CREDIT SALES REPORT";
      case "ONLINE ONE OFF":
        return "ONLINE ONE OFF SALES REPORT";
      default:
        return "SALES REPORT";
    }
  };

  const getAllReportTitle = () => {
    return activeTab === "online" 
      ? "ALL SALES FOR ONLINE(ONE-OFF/INSTALL) REPORT" 
      : "ALL SALES FOR WALK-IN REPORT";
  };

  const getTabData = () => {
    return allReportData[activeTab] || [];
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "₦0.00";
    const num = parseFloat(amount);
    if (isNaN(num)) return "₦0.00";
    return `₦${num.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const csvEscape = (value) => {
    const text = value == null ? "" : String(value);
    if (text.includes(",") || text.includes('"') || text.includes("\n")) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const getExportRows = (rows = []) => {
    const headers = [
      "S/N",
      "DATE",
      "REFERENCE NO",
      "ACCOUNT NO",
      "PRODUCT",
      "DESCRIPTION",
      "CATEGORY",
      "SUB-CATEGORY",
      "TYPE",
      "AMOUNT",
      "STATUS",
    ];

    return {
      headers,
      rows: rows.map((row, idx) => [
        row.sn || idx + 1,
        row.date || "N/A",
        row.referenceNo || "N/A",
        row.accountNo || "N/A",
        row.product || "N/A",
        row.description || "N/A",
        row.category || "N/A",
        row.subCategory || "N/A",
        row.type || "N/A",
        formatCurrency(row.totalAmount),
        row.status || "N/A",
      ]),
    };
  };

  const downloadCSV = (filePrefix, rows) => {
    if (!rows?.length) return;
    const { headers, rows: csvRows } = getExportRows(rows);
    const csv = [headers, ...csvRows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadXLSX = (filePrefix, rows) => {
    if (!rows?.length) return;
    const { headers, rows: exportRows } = getExportRows(rows);
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...exportRows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");
    XLSX.writeFile(
      workbook,
      `${filePrefix}-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const handleExportRegularCSV = () => {
    downloadCSV(getReportTitle().toLowerCase().replace(/\s+/g, "-"), reportData);
  };

  const handleExportRegularXLSX = () => {
    downloadXLSX(getReportTitle().toLowerCase().replace(/\s+/g, "-"), reportData);
  };

  const handleExportAllCSV = () => {
    const rows = getTabData();
    const prefix = `all-sales-${activeTab}`;
    downloadCSV(prefix, rows);
  };

  const handleExportAllXLSX = () => {
    const rows = getTabData();
    const prefix = `all-sales-${activeTab}`;
    downloadXLSX(prefix, rows);
  };

  // Render the "ALL" report with tabs
  const renderAllReport = () => {
    const tabData = getTabData();
    const totalAmount = tabData.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0);
    
    return (
      <div className="sales-report-wrapper">
        <div className="all-report-header">
          <div className="app-brand"></div>
          <div className="main-report-title">
            <h2>SALES ORDER REPORT</h2>
            <h3>ALL SALES - {activeTab === "online" ? "ONLINE" : "WALK-IN"}</h3>
          </div>
          <div className="header-controls">
            <button className="icon-btn close-icon" onClick={closeModal}>X</button>
          </div>
        </div>

        <div className="report-content">
          <div className="company-info-section">
            <h2>PM MARKET HUB</h2>
            <p>64 OGUI ROAD, ENUGU STATE</p>
            <p>TEL: 0900000XX</p>
          </div>

          <div className="all-report-subtitle">
            <h3>{getAllReportTitle()}</h3>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {fetching && (
            <div className="loading-message">
              Loading {activeTab} data...
            </div>
          )}

          <div className="report-tabs-container">
            <div className="report-tabs">
              <button 
                className={`tab ${activeTab === "online" ? "active" : ""}`}
                onClick={() => setActiveTab("online")}
                disabled={fetching}
              >
                ONLINE
              </button>
              <button 
                className={`tab ${activeTab === "walkin" ? "active" : ""}`}
                onClick={() => setActiveTab("walkin")}
                disabled={fetching}
              >
                WALK-IN
              </button>
            </div>
          </div>

          <div className="filter-info">
            <div className="filter-info-item">
              <span>Period:</span>
              <strong>{filters.startDate} to {filters.endDate}</strong>
            </div>
            <div className="filter-info-item">
              <span>Total Records:</span>
              <strong>{tabData.length}</strong>
            </div>
            {tabData.length > 0 && (
              <div className="filter-info-item">
                <span>Total Amount:</span>
                <strong>{formatCurrency(totalAmount)}</strong>
              </div>
            )}
          </div>

          <div className="table-wrapper">
            <table className="results-table">
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>DATE</th>
                  <th>REFERENCE NO</th>
                  <th>ACCOUNT NO</th>
                  <th>PRODUCT</th>
                  <th>DESCRIPTION</th>
                  <th>CATEGORY</th>
                  <th>SUB-CATEGORY</th>
                  <th>TYPE (ONE-OFF/INSTALL)</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {tabData.length > 0 ? (
                  tabData.map((row) => (
                    <tr key={row.sn}>
                      <td>{row.sn}.</td>
                      <td>{row.date}</td>
                      <td>{row.referenceNo}</td>
                      <td>{row.accountNo}</td>
                      <td>{row.product}</td>
                      <td>{row.description}</td>
                      <td>{row.category}</td>
                      <td>{row.subCategory}</td>
                      <td>{row.type}</td>
                      <td>{formatCurrency(row.totalAmount)}</td>
                      <td>{row.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" className="no-data">
                      {fetching ? "Loading data..." : "No data available for the selected filters"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="report-actions">
            <button className="back-btn" onClick={handleBack} disabled={loading || fetching}>
              BACK TO FILTERS
            </button>
            <button className="print-btn" onClick={handlePrint} disabled={tabData.length === 0}>
              PRINT REPORT
            </button>
            <button className="print-btn" onClick={handleExportAllCSV} disabled={tabData.length === 0}>
              EXPORT CSV
            </button>
            <button className="print-btn" onClick={handleExportAllXLSX} disabled={tabData.length === 0}>
              EXPORT XLSX
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render the regular report
  const renderRegularReport = () => {
    const totalAmount = reportData.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0);
    
    return (
      <div className="sales-report-wrapper">
        <div className="sales-report-header">
          <h1>{getReportTitle()}</h1>
          <div className="header-icons">
            <button className="icon-btn close-icon" onClick={closeModal}>
              X
            </button>
          </div>
        </div>

        <div className="results-section">
          <div className="company-info">
            <h2>PM MARKET HUB</h2>
            <p>64 OGUI ROAD, ENUGU-STATE</p>
            <p>TEL: 080XXXXX</p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {fetching && (
            <div className="loading-message">
              Loading report data...
            </div>
          )}

          <div className="report-summary">
            <div className="summary-item">
              <span>Total Records:</span>
              <strong>{reportData.length}</strong>
            </div>
            {reportData.length > 0 && (
              <div className="summary-item">
                <span>Total Amount:</span>
                <strong>{formatCurrency(totalAmount)}</strong>
              </div>
            )}
          </div>

          <div className="results-actions">
            <button className="back-btn" onClick={handleBack} disabled={loading || fetching}>
              BACK TO FILTERS
            </button>
            <button className="print-btn" onClick={handlePrint} disabled={reportData.length === 0}>
              PRINT REPORT
            </button>
            <button className="print-btn" onClick={handleExportRegularCSV} disabled={reportData.length === 0}>
              EXPORT CSV
            </button>
            <button className="print-btn" onClick={handleExportRegularXLSX} disabled={reportData.length === 0}>
              EXPORT XLSX
            </button>
          </div>

          <div className="table-wrapper">
            <table className="results-table">
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>DATE</th>
                  <th>REFERENCE NO</th>
                  <th>ACCOUNT NO</th>
                  <th>PRODUCT</th>
                  <th>DESCRIPTION</th>
                  <th>CATEGORY</th>
                  <th>SUB-CATEGORY</th>
                  <th>TYPE</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {reportData.length > 0 ? (
                  reportData.map((row) => (
                    <tr key={row.sn}>
                      <td>{row.sn}.</td>
                      <td>{row.date}</td>
                      <td>{row.referenceNo}</td>
                      <td>{row.accountNo}</td>
                      <td>{row.product}</td>
                      <td>{row.description}</td>
                      <td>{row.category}</td>
                      <td>{row.subCategory}</td>
                      <td>{row.type}</td>
                      <td>{formatCurrency(row.totalAmount)}</td>
                      <td>{row.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" className="no-data">
                      {fetching ? "Loading data..." : error || "No data available for the selected filters"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="sales-report-container">
      {viewMode === "generator" ? (
        // FILTER SCREEN
        <div className="sales-report-wrapper">
          <div className="sales-report-header">
            <h1>SALES REPORT GENERATOR</h1>
            <div style={{ display: "flex", justifyContent: "center", margin: "0.4rem 0" }}>
              <BranchBadge />
            </div>
            <div className="header-icons">
              <button className="icon-btn close-icon" onClick={closeModal}>
                X
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="filter-section">
            <div className="filter-row">
              <div className="filter-group">
                <label>START DATE</label>
                <div className="date-input-wrapper">
                  <span className="calendar-icon">Cal</span>
                  <input
                    type="text"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleInputChange}
                    className="date-input"
                    placeholder="DD/MM/YYYY"
                  />
                </div>
              </div>

              <div className="filter-group">
                <label>END DATE</label>
                <div className="date-input-wrapper">
                  <span className="calendar-icon">Cal</span>
                  <input
                    type="text"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleInputChange}
                    className="date-input"
                    placeholder="DD/MM/YYYY"
                  />
                </div>
              </div>

              <div className="filter-group">
                <label>ORDER METHOD</label>
                <select
                  name="orderMethod"
                  value={filters.orderMethod}
                  onChange={handleInputChange}
                  className="select-input"
                >
                  <option value="">SELECT</option>
                  <option value="online">Online</option>
                  <option value="walk-in">Walk In</option>
                </select>
              </div>

              <div className="filter-group">
                <label>BRANCH</label>
                <select
                  name="branchId"
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  disabled={branchesLoading}
                  className="select-input"
                >
                  <option value="">All Branches</option>
                  {branchOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="all-checkbox">
              <input
                type="checkbox"
                id="showAll"
                checked={filters.showAll}
                onChange={handleCheckboxChange}
                disabled={loading}
              />
              <label htmlFor="showAll">ALL</label>
            </div>

            <div className="display-options-section">
              <h3 className="display-options-title">DISPLAY OPTIONS</h3>

              <div className="radio-options">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="displayOption"
                    checked={filters.displayOption === "WALK IN CREDIT SALES"}
                    onChange={() => handleRadioChange("WALK IN CREDIT SALES")}
                    disabled={loading || filters.showAll}
                  />
                  <span>WALK IN CREDIT SALES</span>
                </label>

                <label className="radio-label">
                  <input
                    type="radio"
                    name="displayOption"
                    checked={filters.displayOption === "WALK IN CASH SALES"}
                    onChange={() => handleRadioChange("WALK IN CASH SALES")}
                    disabled={loading || filters.showAll}
                  />
                  <span>WALK IN CASH SALES</span>
                </label>

                <label className="radio-label">
                  <input
                    type="radio"
                    name="displayOption"
                    checked={filters.displayOption === "ONLINE CREDIT"}
                    onChange={() => handleRadioChange("ONLINE CREDIT")}
                    disabled={loading || filters.showAll}
                  />
                  <span>ONLINE CREDIT</span>
                </label>

                <label className="radio-label">
                  <input
                    type="radio"
                    name="displayOption"
                    checked={filters.displayOption === "ONLINE ONE OFF"}
                    onChange={() => handleRadioChange("ONLINE ONE OFF")}
                    disabled={loading || filters.showAll}
                  />
                  <span>ONLINE ONE OFF</span>
                </label>
              </div>

              <button 
                className="display-btn" 
                onClick={handleDisplay}
                disabled={loading || fetching}
              >
                {loading ? "LOADING..." : "DISPLAY"}
              </button>
            </div>
          </div>
        </div>
      ) : showAllReport && showResults ? (
        // ALL REPORT WITH TABS
        renderAllReport()
      ) : (
        // REGULAR REPORT
        renderRegularReport()
      )}
    </div>
  );
};

export default SalesReportDisplay;




