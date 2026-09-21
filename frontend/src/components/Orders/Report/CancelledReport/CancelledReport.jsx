import React, { useState } from "react";
import "../ReportOrder/ReportOrder.css";
import CancelledReportDisplay from "./CancelledReportDisplay";
import { useBranchOptions } from "../../../../lib/useBranchOptions";

const CancelledReport = ({ toggleCancelledReportModal }) => {
  const { options: branchOptions, loading: branchesLoading } = useBranchOptions();
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    branchId: "",
    displayOptions: { all: false, byDate: false },
    page: 0,
    size: 20,
  });
  const [showReport, setShowReport] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleOptionChange = (option) => {
    setFilters((prev) => ({
      ...prev,
      displayOptions: { all: false, byDate: false, [option]: true },
    }));
  };

  const handleDisplay = () => {
    const selected = Object.values(filters.displayOptions).some(Boolean);
    if (!selected) {
      setError("Please select a display option");
      setTimeout(() => setError(""), 3000);
      return;
    }
    if (filters.displayOptions.byDate && (!filters.startDate || !filters.endDate)) {
      setError("Please select start and end date");
      setTimeout(() => setError(""), 3000);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowReport(true);
    }, 400);
  };

  if (showReport) {
    return (
      <CancelledReportDisplay
        filters={filters}
        onBack={() => setShowReport(false)}
        onClose={toggleCancelledReportModal}
      />
    );
  }

  return (
    <div className="order-report-container">
      <div className="order-report-header">
        <h1 className="company-name">CANCELLED ORDERS REPORT</h1>
        <button className="icon-btn close-icon" onClick={toggleCancelledReportModal}>X</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="filter-section">
        <div className="filter-row">
          <div className="filter-group">
            <label>START DATE</label>
            <input
              type="date"
              className="date-input"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-group">
            <label>END DATE</label>
            <input
              type="date"
              className="date-input"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
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
            id="cr-all"
            checked={filters.displayOptions.all}
            onChange={() => handleOptionChange("all")}
          />
          <label htmlFor="cr-all">ALL</label>
        </div>

        <div className="display-options-section">
          <div className="display-options-title">DISPLAY OPTIONS</div>
          <div className="radio-options">
            <div className="radio-label">
              <input
                type="radio"
                id="cr-byDate"
                name="crOption"
                checked={filters.displayOptions.byDate}
                onChange={() => handleOptionChange("byDate")}
              />
              <span>BY DATE</span>
            </div>
          </div>
          <button className="display-btn" onClick={handleDisplay} disabled={loading}>
            {loading ? "LOADING..." : "DISPLAY"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelledReport;
