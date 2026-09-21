// import React, { useState, useEffect } from "react";
// import "./OrderReportDisplay.css";
// import { apiRequest } from "../../../../lib/config";

// const OrderReportDisplay = ({ reportType, filters, onBack, onClose }) => {
//   const [reportData, setReportData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState("installment");
//   const [showTabs, setShowTabs] = useState(false);

//   const safeFilters = filters || {
//     startDate: "24/6/2024",
//     endDate: "24/6/2024",
//     orderMethod: "",
//   };

//   // Determine if we should show tabs (only for ALL ORDERS report)
//   useEffect(() => {
//     if (reportType === "ALL ORDERS") {
//       setShowTabs(true);
//       setActiveTab("installment"); // Default to installment tab
//     } else {
//       setShowTabs(false);
//     }
//   }, [reportType]);

//   // Function to get table headers based on report type and active tab
//   const getTableHeaders = () => {
//     if (reportType === "ALL ORDERS") {
//       return activeTab === "installment"
//         ? [
//             "S/N",
//             "DATE",
//             "REFERENCE ID",
//             "ACCOUNT ID",
//             "PRODUCT",
//             "DESCRIPTION",
//             "CATEGORY",
//             "SUB-CATEGORY",
//             "PROGRESS",
//           ]
//         : [
//             "S/N",
//             "DATE",
//             "REFERENCE ID",
//             "ACCOUNT ID",
//             "PRODUCT",
//             "DESCRIPTION",
//             "CATEGORY",
//             "SUB-CATEGORY",
//           ];
//     } else if (reportType === "ORDERS BY DATE") {
//       return ["S/N", "DATE", "TOTAL ORDERS", "COMPLETED", "PENDING", "AMOUNT"];
//     } else if (reportType === "ORDERS BY REFERENCE ID") {
//       return [
//         "S/N",
//         "REFERENCE ID",
//         "CUSTOMER",
//         "PRODUCT",
//         "AMOUNT",
//         "STATUS",
//         "DATE",
//       ];
//     } else if (reportType === "ORDERS BY ACCOUNT ID") {
//       return [
//         "S/N",
//         "ACCOUNT ID",
//         "CUSTOMER",
//         "TOTAL ORDERS",
//         "AMOUNT DUE",
//         "LAST ORDER",
//         "STATUS",
//       ];
//     }

//     // Default headers
//     return [
//       "S/N",
//       "DATE",
//       "REFERENCE ID",
//       "ACCOUNT ID",
//       "PRODUCT",
//       "DESCRIPTION",
//       "CATEGORY",
//       "SUB-CATEGORY",
//     ];
//   };

//   // Function to get report title based on report type and active tab
//   const getReportTitle = () => {
//     if (reportType === "ALL ORDERS") {
//       return activeTab === "installment"
//         ? "ALL ORDERS INSTALLMENT"
//         : "ALL ORDERS ONEOFF";
//     }
//     return reportType || "ORDER REPORT";
//   };

//   // Function to get subtitle for the report
//   const getReportSubtitle = () => {
//     if (reportType === "ALL ORDERS") {
//       return activeTab === "installment"
//         ? "ONLINE CUSTOMER INSTALLMENT-ORDERS REPORT"
//         : "ONLINE CUSTOMER ONE-OFF-ORDERS REPORT";
//     } else if (reportType === "ORDERS BY DATE") {
//       return "ORDERS BY DATE REPORT";
//     } else if (reportType === "ORDERS BY REFERENCE ID") {
//       return "ORDERS BY REFERENCE ID REPORT";
//     } else if (reportType === "ORDERS BY ACCOUNT ID") {
//       return "ORDERS BY ACCOUNT ID REPORT";
//     }
//     return "ORDER REPORT";
//   };

//   useEffect(() => {
//     const fetchReportData = async () => {
//       try {
//         setLoading(true);

//         // Simulate API call delay
//         setTimeout(() => {
//           // For demonstration, return mock data
//           const mockData = getMockData();
//           setReportData(mockData);
//           setLoading(false);
//         }, 500);
//       } catch (error) {
//         console.error("Error fetching order report data:", error);
//         setReportData([]);
//         setLoading(false);
//       }
//     };

//     fetchReportData();
//   }, [reportType, safeFilters, activeTab]);

//   // Mock data based on report type and tab
//   const getMockData = () => {
//     // For "ALL ORDERS" with installment tab
//     if (reportType === "ALL ORDERS" && activeTab === "installment") {
//       return [
//         {
//           id: 1,
//           date: "15-03-2024",
//           referenceId: "INST001",
//           accountId: "",
//           product: "Samsung TV",
//           description: "55 inch 4K Smart TV",
//           category: "Electronics",
//           subCategory: "Television",
//           progress: "75%",
//         },
//         {
//           id: 2,
//           date: "18-03-2024",
//           referenceId: "INST002",
//           accountId: "",
//           product: "iPhone 15",
//           description: "256GB, Blue",
//           category: "Mobile",
//           subCategory: "Smartphone",
//           progress: "50%",
//         },
//       ];
//     }

//     // For "ALL ORDERS" with oneoff tab
//     if (reportType === "ALL ORDERS" && activeTab === "oneoff") {
//       return [
//         {
//           id: 1,
//           date: "12-03-2024",
//           referenceId: "ONEOFF001",
//           accountId: "",
//           product: "HUAWEI Watch",
//           description: "Silver color, GPS",
//           category: "Wearables",
//           subCategory: "Smart Watch",
//         },
//       ];
//     }

//     // For "ORDERS BY DATE" report
//     if (reportType === "ORDERS BY DATE") {
//       return [
//         {
//           id: 1,
//           date: "24/6/2024",
//           totalOrders: "15",
//           completed: "10",
//           pending: "5",
//           amount: "₦1,250,000",
//         },
//       ];
//     }

//     // For other report types, return empty array to show "No data found"
//     return [];
//   };

//   const handlePrint = () => {
//     window.print();
//   };

//   return (
//     <div className="order-report-display">
//       {/* Header */}
//       <div className="report-display-header">
//         <div className="header-main">
//           <div className="report-titles">
//             <div className="company-header">
//               <h2>PM MARKET HUB</h2>
//               <p>64- OGUI ROAD, ENUGU STATE</p>
//               <p>TEL: 0900000XX</p>
//             </div>
//           </div>
//           <div className="header-controls">
//             <button className="icon-btn">⊞</button>
//             <button className="icon-btn close-btn" onClick={onClose}>
//               ✕
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="report-content-wrapper">
//         {/* Tabs for ALL ORDERS report only */}
//         {showTabs && (
//           <div className="report-tabs">
//             <button
//               className={`tab ${activeTab === "installment" ? "active" : ""}`}
//               onClick={() => setActiveTab("installment")}
//             >
//               ONLINE CUSTOMER INSTALLMENT-ORDERS REPORT
//             </button>
//             <button
//               className={`tab ${activeTab === "oneoff" ? "active" : ""}`}
//               onClick={() => setActiveTab("oneoff")}
//             >
//               ONLINE CUSTOMER ONE-OFF ORDERS
//             </button>
//           </div>
//         )}

//         {/* Report Table */}
//         {loading ? (
//           <div className="loading-container">
//             <div className="loader"></div>
//             <p>Loading report data...</p>
//           </div>
//         ) : (
//           <div className="report-table-container">
//             <table className="report-table">
//               <thead>
//                 <tr>
//                   {getTableHeaders().map((header, index) => (
//                     <th key={index}>{header}</th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {reportData.length > 0 ? (
//                   reportData.map((item, index) => (
//                     <tr key={item.id || index}>
//                       <td>{index + 1}</td>

//                       {/* Render columns based on report type */}
//                       {reportType === "ALL ORDERS" ? (
//                         <>
//                           <td>{item.date || "N/A"}</td>
//                           <td>{item.referenceId || "N/A"}</td>
//                           <td>{item.accountId || "N/A"}</td>
//                           <td>{item.product || "N/A"}</td>
//                           <td>{item.description || "N/A"}</td>
//                           <td>{item.category || "N/A"}</td>
//                           <td>{item.subCategory || "N/A"}</td>
//                           {activeTab === "installment" && (
//                             <td>
//                               <div className="progress-bar">
//                                 <div
//                                   className="progress-fill"
//                                   style={{ width: item.progress || "0%" }}
//                                 >
//                                   {item.progress || "0%"}
//                                 </div>
//                               </div>
//                             </td>
//                           )}
//                         </>
//                       ) : reportType === "ORDERS BY DATE" ? (
//                         <>
//                           <td>{item.date || "N/A"}</td>
//                           <td>{item.totalOrders || "0"}</td>
//                           <td>{item.completed || "0"}</td>
//                           <td>{item.pending || "0"}</td>
//                           <td>{item.amount || "₦0.00"}</td>
//                         </>
//                       ) : (
//                         // Default columns for other report types
//                         <>
//                           <td>{item.date || "N/A"}</td>
//                           <td>
//                             {item.referenceId || item.referenceNo || "N/A"}
//                           </td>
//                           <td>
//                             {item.accountId || item.accountNumber || "N/A"}
//                           </td>
//                           <td>{item.product || item.productName || "N/A"}</td>
//                           <td>{item.description || "N/A"}</td>
//                           <td>{item.category || "N/A"}</td>
//                           <td>{item.subCategory || "N/A"}</td>
//                         </>
//                       )}
//                     </tr>
//                   ))
//                 ) : (
//                   <tr className="no-data-row">
//                     <td colSpan={getTableHeaders().length}>
//                       <div className="no-data-message">
//                         No data found for the selected criteria
//                       </div>
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>

//             {reportData.length > 0 && (
//               <div className="report-summary">
//                 <div className="summary-item">
//                   <span>Total Records:</span>
//                   <strong>{reportData.length}</strong>
//                 </div>
//                 {reportType === "ORDERS BY DATE" && reportData[0]?.amount && (
//                   <div className="summary-item">
//                     <span>Total Amount:</span>
//                     <strong>{reportData[0].amount}</strong>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         )}

//         {/* Action Buttons */}
//         <div className="action-buttons">
//           <button className="print-button" onClick={handlePrint}>
//             PRINT REPORT
//           </button>
//           <button
//             className="print-button"
//             onClick={handleExportCSV}
//             disabled={!reportData.length}
//           >
//             EXPORT CSV
//           </button>
//           <button
//             className="print-button"
//             onClick={handleExportXLSX}
//             disabled={!reportData.length}
//           >
//             EXPORT XLSX
//           </button>
//           <button className="back-button" onClick={onBack}>
//             ← BACK TO FILTERS
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default OrderReportDisplay;


import React, { useState, useEffect } from "react";
import "./OrderReportDisplay.css";
import { apiRequest } from "../../../../lib/config";
import * as XLSX from "xlsx";

const OrderReportDisplay = ({ reportType, filters, onBack, onClose }) => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("installment");
  const [showTabs, setShowTabs] = useState(false);

  const safeFilters = filters || {
    startDate: "24/6/2024",
    endDate: "24/6/2024",
    orderMethod: "",
  };

  // === FIX: Convert DD/MM/YYYY → YYYY-MM-DDTHH:mm:ss (required by backend) ===
  const formatDateForAPI = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00`;
    }
    return dateStr;
  };

  const formatEndDateForAPI = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T23:59:59`;
    }
    return dateStr;
  };

  // Show tabs only for ALL ORDERS
  useEffect(() => {
    if (reportType === "ALL ORDERS") {
      setShowTabs(true);
      setActiveTab("installment");
    } else {
      setShowTabs(false);
    }
  }, [reportType]);

  // === REAL API FETCH ===
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError("");

        let endpoint = "";
        const params = new URLSearchParams();

        if (reportType === "ALL ORDERS") {
          endpoint = activeTab === "installment"
            ? "/sales/reports/online/installment"
            : "/sales/reports/online/one-off";
        } else if (reportType === "ORDERS BY DATE") {
          endpoint = "/sales/reports/orders/actions";
          params.append("action", "date");
        } else {
          endpoint = "/sales/reports/orders";
        }

        if (safeFilters.startDate && safeFilters.endDate) {
          params.append("startDate", formatDateForAPI(safeFilters.startDate));
          params.append("endDate", formatEndDateForAPI(safeFilters.endDate));
        }

        const fullUrl = params.toString() ? `${endpoint}?${params.toString()}` : endpoint;

        const response = await apiRequest(
          fullUrl,
          "GET",
          null,
          true,
          safeFilters.branchId || undefined
        );

        let data = [];
        if (Array.isArray(response)) data = response;
        else if (response?.content) data = response.content;
        else if (response?.data) data = response.data;
        else if (response?.response?.content) data = response.response.content;

        // Transform to match your table
        const transformed = data.map(item => ({
          date: item.createdAt?.split('T')[0] || item.orderDate || "N/A",
          referenceId: item.referenceNo || item.referenceNumber || "N/A",
          accountId: item.accountNumber || item.accountNo || "N/A",
          product: item.productName || "N/A",
          description: item.description || item.productDescription || "N/A",
          category: item.category || "N/A",
          subCategory: item.subCategory || item.subcategory || "N/A",
          progress: item.paymentProgress ? `${item.paymentProgress}%` : null,
          totalOrders: item.totalOrders || "0",
          completed: item.completed || "0",
          pending: item.pending || "0",
          amount: item.totalAmount ? `₦${item.totalAmount.toLocaleString()}` : "₦0.00",
        }));

        setReportData(transformed);
      } catch (error) {
        console.error("API Error:", error);
        setReportData([]);
        setError(error?.message || "Failed to load order report data.");
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [reportType, safeFilters, activeTab]);

  // === YOUR ORIGINAL getTableHeaders (fixed scope) ===
  const getTableHeaders = () => {
    if (reportType === "ALL ORDERS") {
      return activeTab === "installment"
        ? [
            "S/N",
            "DATE",
            "REFERENCE ID",
            "ACCOUNT ID",
            "PRODUCT",
            "DESCRIPTION",
            "CATEGORY",
            "SUB-CATEGORY",
            "PROGRESS",
          ]
        : [
            "S/N",
            "DATE",
            "REFERENCE ID",
            "ACCOUNT ID",
            "PRODUCT",
            "DESCRIPTION",
            "CATEGORY",
            "SUB-CATEGORY",
          ];
    } else if (reportType === "ORDERS BY DATE") {
      return ["S/N", "DATE", "TOTAL ORDERS", "COMPLETED", "PENDING", "AMOUNT"];
    } else if (reportType === "ORDERS BY REFERENCE ID") {
      return [
        "S/N",
        "REFERENCE ID",
        "CUSTOMER",
        "PRODUCT",
        "AMOUNT",
        "STATUS",
        "DATE",
      ];
    } else if (reportType === "ORDERS BY ACCOUNT ID") {
      return [
        "S/N",
        "ACCOUNT ID",
        "CUSTOMER",
        "TOTAL ORDERS",
        "AMOUNT DUE",
        "LAST ORDER",
        "STATUS",
      ];
    }

    return [
      "S/N",
      "DATE",
      "REFERENCE ID",
      "ACCOUNT ID",
      "PRODUCT",
      "DESCRIPTION",
      "CATEGORY",
      "SUB-CATEGORY",
    ];
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

  const buildExportRows = () => {
    const headers = getTableHeaders();
    const rows = reportData.map((item, index) => {
      if (reportType === "ALL ORDERS") {
        const base = [
          index + 1,
          item.date || "N/A",
          item.referenceId || "N/A",
          item.accountId || "N/A",
          item.product || "N/A",
          item.description || "N/A",
          item.category || "N/A",
          item.subCategory || "N/A",
        ];
        if (activeTab === "installment") {
          return [...base, item.progress || "0%"];
        }
        return base;
      }

      if (reportType === "ORDERS BY DATE") {
        return [
          index + 1,
          item.date || "N/A",
          item.totalOrders || "0",
          item.completed || "0",
          item.pending || "0",
          item.amount || "N/A",
        ];
      }

      return [
        index + 1,
        item.referenceId || item.referenceNo || "N/A",
        item.accountId || item.accountNumber || "N/A",
        item.product || item.productName || "N/A",
        item.description || "N/A",
        item.category || "N/A",
        item.subCategory || "N/A",
      ];
    });

    return { headers, rows };
  };

  const handleExportCSV = () => {
    if (!reportData.length) return;

    const { headers, rows } = buildExportRows();
    const csv = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const reportName = (reportType || "order-report").toLowerCase().replace(/\s+/g, "-");
    const tabName = showTabs ? `-${activeTab}` : "";
    link.href = url;
    link.download = `${reportName}${tabName}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportXLSX = () => {
    if (!reportData.length) return;
    const { headers, rows } = buildExportRows();
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Order Report");
    const reportName = (reportType || "order-report").toLowerCase().replace(/\s+/g, "-");
    const tabName = showTabs ? `-${activeTab}` : "";
    XLSX.writeFile(
      workbook,
      `${reportName}${tabName}-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  return (
    <div className="order-report-display">
      {/* YOUR ORIGINAL HEADER */}
      <div className="report-display-header">
        <div className="header-main">
          <div className="report-titles">
            <div className="company-header">
              <h2>PM MARKET HUB</h2>
              <p>64- OGUI ROAD, ENUGU STATE</p>
              <p>TEL: 0900000XX</p>
            </div>
          </div>
          <div className="header-controls">
            <button className="icon-btn">⊞</button>
            <button className="icon-btn close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>
      </div>

      <div className="report-content-wrapper">
        {error && (
          <div className="error-message" style={{ marginBottom: "12px" }}>
            {error}
          </div>
        )}
        {/* YOUR ORIGINAL TABS */}
        {showTabs && (
          <div className="report-tabs">
            <button
              className={`tab ${activeTab === "installment" ? "active" : ""}`}
              onClick={() => setActiveTab("installment")}
            >
              ONLINE CUSTOMER INSTALLMENT-ORDERS REPORT
            </button>
            <button
              className={`tab ${activeTab === "oneoff" ? "active" : ""}`}
              onClick={() => setActiveTab("oneoff")}
            >
              ONLINE CUSTOMER ONE-OFF ORDERS
            </button>
          </div>
        )}

        {/* YOUR ORIGINAL TABLE */}
        {loading ? (
          <div className="loading-container">
            <div className="loader"></div>
            <p>Loading report data...</p>
          </div>
        ) : (
          <div className="report-table-container">
            <table className="report-table">
              <thead>
                <tr>
                  {getTableHeaders().map((header, index) => (
                    <th key={index}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.length > 0 ? (
                  reportData.map((item, index) => (
                    <tr key={item.id || index}>
                      <td>{index + 1}</td>

                      {reportType === "ALL ORDERS" ? (
                        <>
                          <td>{item.date || "N/A"}</td>
                          <td>{item.referenceId || "N/A"}</td>
                          <td>{item.accountId || "N/A"}</td>
                          <td>{item.product || "N/A"}</td>
                          <td>{item.description || "N/A"}</td>
                          <td>{item.category || "N/A"}</td>
                          <td>{item.subCategory || "N/A"}</td>
                          {activeTab === "installment" && (
                            <td>
                              <div className="progress-bar">
                                <div
                                  className="progress-fill"
                                  style={{ width: item.progress || "0%" }}
                                >
                                  {item.progress || "0%"}
                                </div>
                              </div>
                            </td>
                          )}
                        </>
                      ) : reportType === "ORDERS BY DATE" ? (
                        <>
                          <td>{item.date || "N/A"}</td>
                          <td>{item.totalOrders || "0"}</td>
                          <td>{item.completed || "0"}</td>
                          <td>{item.pending || "0"}</td>
                          <td>{item.amount || "₦0.00"}</td>
                        </>
                      ) : (
                        <>
                          <td>{item.date || "N/A"}</td>
                          <td>{item.referenceId || item.referenceNo || "N/A"}</td>
                          <td>{item.accountId || item.accountNumber || "N/A"}</td>
                          <td>{item.product || item.productName || "N/A"}</td>
                          <td>{item.description || "N/A"}</td>
                          <td>{item.category || "N/A"}</td>
                          <td>{item.subCategory || "N/A"}</td>
                        </>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr className="no-data-row">
                    <td colSpan={getTableHeaders().length}>
                      <div className="no-data-message">
                        No data found for the selected criteria
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {reportData.length > 0 && (
              <div className="report-summary">
                <div className="summary-item">
                  <span>Total Records:</span>
                  <strong>{reportData.length}</strong>
                </div>
                {reportType === "ORDERS BY DATE" && reportData[0]?.amount && (
                  <div className="summary-item">
                    <span>Total Amount:</span>
                    <strong>{reportData[0].amount}</strong>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* YOUR ORIGINAL BUTTONS */}
        <div className="action-buttons">
          <button className="print-button" onClick={handlePrint}>
            PRINT REPORT
          </button>
          <button
            className="print-button"
            onClick={handleExportCSV}
            disabled={!reportData.length}
          >
            EXPORT CSV
          </button>
          <button
            className="print-button"
            onClick={handleExportXLSX}
            disabled={!reportData.length}
          >
            EXPORT XLSX
          </button>
          <button className="back-button" onClick={onBack}>
            ← BACK TO FILTERS
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderReportDisplay;



