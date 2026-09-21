import React, { useState } from "react";
import "../ReportOrder/ReportOrder.css";
import RefundReturnReportDisplay from "./RefundReturnReportDisplay";
import { useBranchOptions } from "../../../../lib/useBranchOptions";

const RefundReturnReport = ({ toggleRefundReturnReportModal }) => {
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
      <RefundReturnReportDisplay
        filters={filters}
        onBack={() => setShowReport(false)}
        onClose={toggleRefundReturnReportModal}
      />
    );
  }

  return (
    <div className="order-report-container">
      <div className="order-report-header">
        <h1 className="company-name">REFUND & RETURN REPORT</h1>
        <button className="icon-btn close-icon" onClick={toggleRefundReturnReportModal}>X</button>
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
            id="rr-all"
            checked={filters.displayOptions.all}
            onChange={() => handleOptionChange("all")}
          />
          <label htmlFor="rr-all">ALL</label>
        </div>

        <div className="display-options-section">
          <div className="display-options-title">DISPLAY OPTIONS</div>
          <div className="radio-options">
            <div className="radio-label">
              <input
                type="radio"
                id="rr-byDate"
                name="rrOption"
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

export default RefundReturnReport;
