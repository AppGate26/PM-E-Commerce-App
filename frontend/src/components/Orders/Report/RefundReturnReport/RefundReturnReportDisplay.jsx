import React, { useState, useEffect } from "react";
import "../ReportOrder/OrderReportDisplay.css";
import BranchBadge from "../../../shared/BranchBadge";
import { apiRequest } from "../../../../lib/config";
import * as XLSX from "xlsx";

const RefundReturnReportDisplay = ({ filters, onBack, onClose }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const formatDate = (dateStr, time = "00:00:00") => {
    if (!dateStr) return "";
    return `${dateStr}T${time}`;
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError("");
        const params = new URLSearchParams();
        if (filters.startDate) params.append("startDate", formatDate(filters.startDate));
        if (filters.endDate) params.append("endDate", formatDate(filters.endDate, "23:59:59"));

        const url = `/sales/reports/refund-return${params.toString() ? "?" + params : ""}`;
        const res = await apiRequest(url, "GET", null, true, filters.branchId || undefined);

        let rows = [];
        if (Array.isArray(res)) rows = res;
        else if (res?.content) rows = res.content;
        else if (res?.data?.content) rows = res.data.content;
        else if (res?.response?.content) rows = res.response.content;

        setData(rows.map((o) => ({
          date: o.refundedAt?.split("T")[0] || o.createdAt?.split("T")[0] || "N/A",
          referenceNo: o.referenceNo || "N/A",
          customerName: o.customerName || "N/A",
          accountNumber: o.accountNumber || "N/A",
          productName: o.productName || "N/A",
          refundAmount: o.refundAmount != null ? `₦${Number(o.refundAmount).toLocaleString()}` : "N/A",
          refundReason: o.refundReason || "N/A",
          status: o.status || "N/A",
        })));
      } catch (e) {
        setError(e?.message || "Failed to load report");
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [filters]);

  const headers = ["S/N", "DATE", "REFERENCE NO", "CUSTOMER", "ACCOUNT NO", "PRODUCT", "REFUND AMOUNT", "REASON", "STATUS"];

  const buildRows = () =>
    data.map((item, i) => [
      i + 1, item.date, item.referenceNo, item.customerName,
      item.accountNumber, item.productName, item.refundAmount, item.refundReason, item.status,
    ]);

  const handleExportCSV = () => {
    if (!data.length) return;
    const rows = buildRows();
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `refund-return-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportXLSX = () => {
    if (!data.length) return;
    const ws = XLSX.utils.aoa_to_sheet([headers, ...buildRows()]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Refund Return Report");
    XLSX.writeFile(wb, `refund-return-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="order-report-display">
      <div className="report-display-header">
        <div className="header-main">
          <div className="report-titles">
            <div className="company-header">
              <h2>PM MARKET HUB</h2>
              <p>REFUND & RETURN REPORT</p>
              <div style={{ display: "flex", marginTop: "0.4rem" }}>
                <BranchBadge />
              </div>
            </div>
          </div>
          <div className="header-controls">
            <button className="icon-btn close-btn" onClick={onClose}>✕</button>
          </div>
        </div>
      </div>

      <div className="report-content-wrapper">
        {error && <div className="error-message">{error}</div>}
        {loading ? (
          <div className="loading-container">
            <div className="loader"></div>
            <p>Loading report data...</p>
          </div>
        ) : (
          <div className="report-table-container">
            <table className="report-table">
              <thead>
                <tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {data.length > 0 ? data.map((item, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{item.date}</td>
                    <td>{item.referenceNo}</td>
                    <td>{item.customerName}</td>
                    <td>{item.accountNumber}</td>
                    <td>{item.productName}</td>
                    <td>{item.refundAmount}</td>
                    <td>{item.refundReason}</td>
                    <td>{item.status}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={headers.length}>
                      <div className="no-data-message">No refund/return records found</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {data.length > 0 && (
              <div className="report-summary">
                <div className="summary-item">
                  <span>Total Records:</span>
                  <strong>{data.length}</strong>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="action-buttons">
          <button className="print-button" onClick={() => window.print()}>PRINT REPORT</button>
          <button className="print-button" onClick={handleExportCSV} disabled={!data.length}>EXPORT CSV</button>
          <button className="print-button" onClick={handleExportXLSX} disabled={!data.length}>EXPORT XLSX</button>
          <button className="back-button" onClick={onBack}>← BACK TO FILTERS</button>
        </div>
      </div>
    </div>
  );
};

export default RefundReturnReportDisplay;
