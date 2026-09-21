import React, { useState } from "react";
import { apiRequest } from "../../../../lib/config";
import { useLanguage } from "../../../../context/LanguageContext";
import * as XLSX from "xlsx";

const CustomerCreditReport = () => {
  const { t } = useLanguage();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showReport, setShowReport] = useState(false);

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      setError(t("Please select both start and end dates"));
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await apiRequest(
        `/admin/reports/customer-credit?startDate=${startDate}&endDate=${endDate}`,
        "GET"
      );
      const data = res?.response ?? res?.data ?? res ?? [];
      setReportData(Array.isArray(data) ? data : []);
      setShowReport(true);
    } catch (err) {
      setError(err?.message || t("Failed to load report"));
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (reportData.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Credit Report");
    XLSX.writeFile(wb, `Customer_Credit_Report_${startDate}_to_${endDate}.xlsx`);
  };

  const exportToCSV = () => {
    if (reportData.length === 0) return;
    const headers = Object.keys(reportData[0] || {});
    const rows = reportData.map(row =>
      headers.map(header => {
        const value = row[header];
        return typeof value === "string" && value.includes(",") ? `"${value}"` : value;
      })
    );
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Customer_Credit_Report_${startDate}_to_${endDate}.csv`;
    a.click();
  };

  return (
    <div className="p-3">
      <h5 className="fw-bold mb-3">{t("Customer Credit Report")}</h5>

      <div className="mb-3 p-3 bg-light rounded">
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label fw-semibold">{t("Start Date")}</label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label fw-semibold">{t("End Date")}</label>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="col-md-4 d-flex align-items-end">
            <button
              className="btn btn-primary w-100"
              onClick={handleGenerateReport}
              disabled={loading}
            >
              {loading ? t("Loading...") : t("Generate Report")}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {showReport && reportData.length > 0 && (
        <>
          <div className="mb-3 d-flex gap-2">
            <button className="btn btn-success btn-sm" onClick={exportToExcel}>
              {t("Export to Excel")}
            </button>
            <button className="btn btn-info btn-sm" onClick={exportToCSV}>
              {t("Export to CSV")}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
              {t("Print")}
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="table table-striped table-hover table-sm">
              <thead className="table-dark">
                <tr>
                  <th>{t("Customer Name")}</th>
                  <th>{t("Account No")}</th>
                  <th>{t("Credit Limit")}</th>
                  <th>{t("Used Credit")}</th>
                  <th>{t("Available Credit")}</th>
                  <th>{t("Status")}</th>
                  <th>{t("Date")}</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.customerName || "-"}</td>
                    <td>{row.accountNumber || "-"}</td>
                    <td>{row.creditLimit || "₦0.00"}</td>
                    <td>{row.usedCredit || "₦0.00"}</td>
                    <td>{row.availableCredit || "₦0.00"}</td>
                    <td>
                      <span
                        className={`badge ${
                          row.status === "Active" ? "bg-success" : "bg-danger"
                        }`}
                      >
                        {row.status || "-"}
                      </span>
                    </td>
                    <td>{row.date || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showReport && reportData.length === 0 && !loading && (
        <div className="alert alert-info">{t("No records found for the selected period")}</div>
      )}
    </div>
  );
};

export default CustomerCreditReport;
