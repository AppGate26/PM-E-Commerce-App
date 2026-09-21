// import React, { useState } from "react";
// import "./ReportOrder.css";
// import OrderReportDisplay from "./OrderReportDisplay";

// const ReportOrder = ({ toggleReportOrModal }) => {
//   const closeModal = () => {
//     toggleReportOrModal();
//   };

//   const [filters, setFilters] = useState({
//     startDate: "24/6/2024",
//     endDate: "24/6/2024",
//     orderMethod: "",
//     displayOptions: {
//       all: false,
//       byDate: false,
//       byReferenceId: false,
//       byAccountId: false,
//     },
//   });

//   const [showReportPage, setShowReportPage] = useState(false);
//   const [selectedReportType, setSelectedReportType] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const handleFilterChange = (e) => {
//     const { name, value } = e.target;
//     setFilters((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleDisplayOptionChange = (option) => {
//     // Reset all checkboxes first
//     const newDisplayOptions = {
//       all: false,
//       byDate: false,
//       byReferenceId: false,
//       byAccountId: false,
//     };
    
//     // Set only the selected one to true
//     newDisplayOptions[option] = true;
    
//     setFilters((prev) => ({
//       ...prev,
//       displayOptions: newDisplayOptions,
//     }));
//   };

//   const handleAllCheckbox = () => {
//     // Toggle the ALL checkbox
//     const newAllValue = !filters.displayOptions.all;
    
//     setFilters((prev) => ({
//       ...prev,
//       displayOptions: {
//         all: newAllValue,
//         byDate: false,
//         byReferenceId: false,
//         byAccountId: false,
//       },
//     }));
//   };

//   const handleDisplayReport = () => {
//     // Validate that a display option is selected
//     const selectedOptions = Object.entries(filters.displayOptions)
//       .filter(([key, value]) => value)
//       .map(([key]) => key);

//     if (selectedOptions.length === 0) {
//       setError("Please select a display option");
//       setTimeout(() => setError(""), 3000);
//       return;
//     }

//     if (!filters.startDate || !filters.endDate) {
//       setError("Please select start date and end date");
//       setTimeout(() => setError(""), 3000);
//       return;
//     }

//     setLoading(true);
    
//     // Determine which report type was selected
//     let reportType = "";
//     if (filters.displayOptions.all) reportType = "ALL ORDERS";
//     if (filters.displayOptions.byDate) reportType = "ORDERS BY DATE";
//     if (filters.displayOptions.byReferenceId) reportType = "ORDERS BY REFERENCE ID";
//     if (filters.displayOptions.byAccountId) reportType = "ORDERS BY ACCOUNT ID";

//     setSelectedReportType(reportType);
    
//     // Simulate loading before showing report
//     setTimeout(() => {
//       setLoading(false);
//       setShowReportPage(true);
//     }, 1000);
//   };

//   const handleBackToFilter = () => {
//     setShowReportPage(false);
//   };

//   // If showReportPage is true, show the OrderReportDisplay
//   if (showReportPage) {
//     return (
//       <OrderReportDisplay
//         reportType={selectedReportType}
//         filters={filters}
//         onBack={handleBackToFilter}
//         onClose={closeModal}
//       />
//     );
//   }

//   return (
//     <div className="order-report-container">
//       {/* Updated Header to match screenshot */}
//       <div className="order-report-header">
//         <div className="company-logo-section">
//           <h1 className="company-name">ORDER REPORT DISPLAY SECTION</h1>
//         </div>
//         <div className="header-icons">
//           <button className="icon-btn grid-icon">
//             <span>⊞</span>
//           </button>
//           <button className="icon-btn close-icon" onClick={closeModal}>
//             ✕
//           </button>
//         </div>
//       </div>

//       {error && (
//         <div className="alert alert-danger" role="alert">
//           {error}
//         </div>
//       )}

//       <div className="filter-section">
//         <div className="filter-row">
//           <div className="filter-group">
//             <label>START DATE</label>
//             <div className="date-input-wrapper">
//               <i className="fas fa-calendar-alt calendar-icon"></i>
//               <input
//                 type="text"
//                 className="date-input"
//                 name="startDate"
//                 value={filters.startDate}
//                 onChange={handleFilterChange}
//                 placeholder="DD/MM/YYYY"
//               />
//             </div>
//           </div>

//           <div className="filter-group">
//             <label>END DATE</label>
//             <div className="date-input-wrapper">
//               <i className="fas fa-calendar-alt calendar-icon"></i>
//               <input
//                 type="text"
//                 className="date-input"
//                 name="endDate"
//                 value={filters.endDate}
//                 onChange={handleFilterChange}
//                 placeholder="DD/MM/YYYY"
//               />
//             </div>
//           </div>

//           <div className="filter-group">
//             <label>ORDER METHOD</label>
//             <select
//               name="orderMethod"
//               className="select-input"
//               value={filters.orderMethod}
//               onChange={handleFilterChange}
//             >
//               <option value="">SELECT</option>
//               <option value="one-off">ONE-OFF</option>
//               <option value="installment">INSTALLMENT</option>
//             </select>
//           </div>
//         </div>

//         <div className="all-checkbox">
//           <input
//             type="checkbox"
//             id="all-checkbox-order"
//             onChange={handleAllCheckbox}
//             checked={filters.displayOptions.all}
//           />
//           <label htmlFor="all-checkbox-order">ALL</label>
//         </div>

//         <div className="display-options-section">
//           <div className="display-options-title">DISPLAY OPTIONS</div>
//           <div className="radio-options">
//             <div className="radio-label">
//               <input
//                 type="radio"
//                 id="byDate"
//                 name="displayOption"
//                 checked={filters.displayOptions.byDate}
//                 onChange={() => handleDisplayOptionChange("byDate")}
//               />
//               <span htmlFor="byDate">BY DATE</span>
//             </div>

//             <div className="radio-label">
//               <input
//                 type="radio"
//                 id="byReferenceId"
//                 name="displayOption"
//                 checked={filters.displayOptions.byReferenceId}
//                 onChange={() => handleDisplayOptionChange("byReferenceId")}
//               />
//               <span htmlFor="byReferenceId">BY REFERENCE ID</span>
//             </div>

//             <div className="radio-label">
//               <input
//                 type="radio"
//                 id="byAccountId"
//                 name="displayOption"
//                 checked={filters.displayOptions.byAccountId}
//                 onChange={() => handleDisplayOptionChange("byAccountId")}
//               />
//               <span htmlFor="byAccountId">BY ACCOUNT ID</span>
//             </div>
//           </div>

//           <button
//             className="display-btn"
//             onClick={handleDisplayReport}
//             disabled={loading}
//           >
//             {loading ? "LOADING..." : "DISPLAY"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ReportOrder;


import React, { useState } from "react";
import "./ReportOrder.css";
import OrderReportDisplay from "./OrderReportDisplay";
import { useBranchOptions } from "../../../../lib/useBranchOptions";

const ReportOrder = ({ toggleReportOrModal }) => {
  const closeModal = () => {
    toggleReportOrModal();
  };

  const { options: branchOptions, loading: branchesLoading } = useBranchOptions();

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    orderMethod: "",
    branchId: "",
    displayOptions: {
      all: false,
      byDate: false,
      byReferenceId: false,
      byAccountId: false,
    },
    page: 0,
    size: 20,
  });

  const [showReportPage, setShowReportPage] = useState(false);
  const [viewMode, setViewMode] = useState("generator");
  const [selectedReportType, setSelectedReportType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDisplayOptionChange = (option) => {
    // Reset all checkboxes first
    const newDisplayOptions = {
      all: false,
      byDate: false,
      byReferenceId: false,
      byAccountId: false,
    };
    
    // Set only the selected one to true
    newDisplayOptions[option] = true;
    
    setFilters((prev) => ({
      ...prev,
      displayOptions: newDisplayOptions,
    }));
  };

  const handleAllCheckbox = () => {
    // Toggle the ALL checkbox
    const newAllValue = !filters.displayOptions.all;
    
    setFilters((prev) => ({
      ...prev,
      displayOptions: {
        all: newAllValue,
        byDate: false,
        byReferenceId: false,
        byAccountId: false,
      },
    }));
  };

  const handleDisplayReport = async () => {
    // Validate that a display option is selected
    const selectedOptions = Object.entries(filters.displayOptions)
      .filter(([key, value]) => value)
      .map(([key]) => key);

    if (selectedOptions.length === 0) {
      setError("Please select a display option");
      setTimeout(() => setError(""), 3000);
      return;
    }

    // Validate dates if byDate is selected
    if (filters.displayOptions.byDate || filters.displayOptions.all) {
      if (!filters.startDate || !filters.endDate) {
        setError("Please select start date and end date");
        setTimeout(() => setError(""), 3000);
        return;
      }
      
      // Validate date format (accepts both DD/MM/YYYY and YYYY-MM-DD)
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
      
      if (!dateRegex.test(filters.startDate) && !isoDateRegex.test(filters.startDate)) {
        setError("Start date must be in DD/MM/YYYY format");
        setTimeout(() => setError(""), 3000);
        return;
      }
      
      if (!dateRegex.test(filters.endDate) && !isoDateRegex.test(filters.endDate)) {
        setError("End date must be in DD/MM/YYYY format");
        setTimeout(() => setError(""), 3000);
        return;
      }
    }

    setLoading(true);
    
    // Determine which report type was selected
    let reportType = "";
    if (filters.displayOptions.all) reportType = "ALL ORDERS";
    if (filters.displayOptions.byDate) reportType = "ORDERS BY DATE";
    if (filters.displayOptions.byReferenceId) reportType = "ORDERS BY REFERENCE ID";
    if (filters.displayOptions.byAccountId) reportType = "ORDERS BY ACCOUNT ID";

    console.log("═══════════════════════════════════════════════════════════");
    console.log("📊 REPORT: Preparing to fetch order data");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("Report Type:", reportType);
    console.log("Filters:", filters);
    
    setSelectedReportType(reportType);
    
    // Show report page with the selected type
    setTimeout(() => {
      setLoading(false);
      setShowReportPage(true);
      setViewMode("report");
    }, 500);
  };

  const handleBackToFilter = () => {
    setShowReportPage(false);
    setViewMode("generator");
  };

  // If showReportPage is true, show the OrderReportDisplay
  if (showReportPage && viewMode === "report") {
    return (
      <OrderReportDisplay
        reportType={selectedReportType}
        filters={filters}
        onBack={handleBackToFilter}
        onClose={closeModal}
      />
    );
  }

  return (
    <div className="order-report-container">
      {/* Updated Header to match screenshot */}
      <div className="order-report-header">
        <h1 className="company-name">ORDER REPORT GENERATOR</h1>
        <div className="header-icons">
          <button className="icon-btn close-icon" onClick={closeModal}>
            X
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="filter-section">
        <div className="filter-row">
          <div className="filter-group">
            <label>START DATE</label>
            <div className="date-input-wrapper">
              <i className="fas fa-calendar-alt calendar-icon"></i>
              <input
                type="text"
                className="date-input"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                placeholder="DD/MM/YYYY"
              />
            </div>
          </div>

          <div className="filter-group">
            <label>END DATE</label>
            <div className="date-input-wrapper">
              <i className="fas fa-calendar-alt calendar-icon"></i>
              <input
                type="text"
                className="date-input"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                placeholder="DD/MM/YYYY"
              />
            </div>
          </div>

          <div className="filter-group">
            <label>ORDER METHOD</label>
            <select
              name="orderMethod"
              className="select-input"
              value={filters.orderMethod}
              onChange={handleFilterChange}
            >
              <option value="">SELECT</option>
              <option value="one-off">ONE-OFF</option>
              <option value="installment">INSTALLMENT</option>
            </select>
          </div>

          <div className="filter-group">
            <label>BRANCH</label>
            <select
              name="branchId"
              className="select-input"
              value={filters.branchId}
              onChange={handleFilterChange}
              disabled={branchesLoading}
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
            id="all-checkbox-order"
            onChange={handleAllCheckbox}
            checked={filters.displayOptions.all}
          />
          <label htmlFor="all-checkbox-order">ALL</label>
        </div>

        <div className="display-options-section">
          <div className="display-options-title">DISPLAY OPTIONS</div>
          <div className="radio-options">
            <div className="radio-label">
              <input
                type="radio"
                id="byDate"
                name="displayOption"
                checked={filters.displayOptions.byDate}
                onChange={() => handleDisplayOptionChange("byDate")}
              />
              <span htmlFor="byDate">BY DATE</span>
            </div>

            <div className="radio-label">
              <input
                type="radio"
                id="byReferenceId"
                name="displayOption"
                checked={filters.displayOptions.byReferenceId}
                onChange={() => handleDisplayOptionChange("byReferenceId")}
              />
              <span htmlFor="byReferenceId">BY REFERENCE ID</span>
            </div>

            <div className="radio-label">
              <input
                type="radio"
                id="byAccountId"
                name="displayOption"
                checked={filters.displayOptions.byAccountId}
                onChange={() => handleDisplayOptionChange("byAccountId")}
              />
              <span htmlFor="byAccountId">BY ACCOUNT ID</span>
            </div>
          </div>

          <button
            className="display-btn"
            onClick={handleDisplayReport}
            disabled={loading}
          >
            {loading ? "LOADING..." : "DISPLAY"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportOrder;

