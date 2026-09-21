import React, { useState } from "react";
import { apiRequest } from "../../../../lib/config";
import { useLanguage } from "../../../../context/LanguageContext";
import * as XLSX from "xlsx";

const OneOffReport = () => {
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
        `/admin/reports/one-off?startDate=${startDate}&endDate=${endDate}`,
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
    XLSX.utils.book_append_sheet(wb, ws, "One-Off Report");
    XLSX.writeFile(wb, `One_Off_Report_${startDate}_to_${endDate}.xlsx`);
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
    a.download = `One_Off_Report_${startDate}_to_${endDate}.csv`;
    a.click();
  };

  const totals = reportData.reduce((acc, row) => ({
    amount: (acc.amount || 0) + (Number(row.amount) || 0),
    count: acc.count + 1,
  }), { amount: 0, count: 0 });

  return (
    <div className="p-3">
      <h5 className="fw-bold mb-3">{t("One-Off Report")}</h5>
      <p className="text-muted small mb-3">{t("One-off transactions and special payments")}</p>

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

          <div className="mb-3 p-2 bg-info bg-opacity-10 rounded">
            <small className="text-dark">
              <strong>{t("Total Transactions")}:</strong> {totals.count} | <strong>{t("Total Amount")}:</strong> ₦{(totals.amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </small>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="table table-striped table-hover table-sm">
              <thead className="table-dark">
                <tr>
                  <th>{t("Reference No")}</th>
                  <th>{t("Customer Name")}</th>
                  <th>{t("Account No")}</th>
                  <th>{t("Transaction Type")}</th>
                  <th className="text-end">{t("Amount")}</th>
                  <th>{t("Description")}</th>
                  <th>{t("Date")}</th>
                  <th>{t("Status")}</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.referenceNo || "-"}</td>
                    <td>{row.customerName || "-"}</td>
                    <td>{row.accountNumber || "-"}</td>
                    <td>{row.transactionType || "-"}</td>
                    <td className="text-end fw-bold">{row.amount ? `₦${Number(row.amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}` : "₦0.00"}</td>
                    <td>{row.description || "-"}</td>
                    <td>{row.date || "-"}</td>
                    <td>
                      <span className={`badge ${row.status === "Completed" ? "bg-success" : row.status === "Pending" ? "bg-warning" : "bg-danger"}`}>
                        {row.status || "-"}
                      </span>
                    </td>
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

export default OneOffReport;
