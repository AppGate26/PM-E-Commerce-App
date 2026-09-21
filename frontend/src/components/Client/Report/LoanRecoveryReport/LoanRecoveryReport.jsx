import React, { useState } from "react";
import { apiRequest } from "../../../../lib/config";
import { useLanguage } from "../../../../context/LanguageContext";
import * as XLSX from "xlsx";

const LoanRecoveryReport = () => {
  const { t } = useLanguage();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      setError(t("Please select both start and end dates"));
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await apiRequest(
        `/admin/reports/loan-recovery?startDate=${startDate}&endDate=${endDate}`,
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
    if (filteredData.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Recovery Report");
    XLSX.writeFile(wb, `Loan_Recovery_Report_${startDate}_to_${endDate}.xlsx`);
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) return;
    const headers = Object.keys(filteredData[0] || {});
    const rows = filteredData.map(row =>
      headers.map(header => {
        const value = row[header];
        return typeof value === "string" && value.includes(",") ? `"${value}"` : value;
      })
    );
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Loan_Recovery_Report_${startDate}_to_${endDate}.csv`;
    a.click();
  };

  const filteredData = filterStatus === "all"
    ? reportData
    : reportData.filter(row => (row.recoveryStatus || "").toLowerCase() === filterStatus.toLowerCase());

  const totals = filteredData.reduce((acc, row) => ({
    totalLoan: (acc.totalLoan || 0) + (Number(row.loanAmount) || 0),
    recovered: (acc.recovered || 0) + (Number(row.recoveredAmount) || 0),
    outstanding: (acc.outstanding || 0) + (Number(row.outstandingAmount) || 0),
    count: acc.count + 1,
  }), { totalLoan: 0, recovered: 0, outstanding: 0, count: 0 });

  return (
    <div className="p-3">
      <h5 className="fw-bold mb-3">{t("Loan Recovery Report")}</h5>
      <p className="text-muted small mb-3">{t("Track loan disbursements and recoveries")}</p>

      <div className="mb-3 p-3 bg-light rounded">
        <div className="row g-3">
          <div className="col-md-3">
            <label className="form-label fw-semibold">{t("Start Date")}</label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label fw-semibold">{t("End Date")}</label>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="col-md-3 d-flex align-items-end">
            <button
              className="btn btn-primary w-100"
              onClick={handleGenerateReport}
              disabled={loading}
            >
              {loading ? t("Loading...") : t("Generate Report")}
            </button>
          </div>
          <div className="col-md-3">
            <label className="form-label fw-semibold">{t("Recovery Status")}</label>
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">{t("All")}</option>
              <option value="recovered">{t("Recovered")}</option>
              <option value="partial">{t("Partial")}</option>
              <option value="outstanding">{t("Outstanding")}</option>
              <option value="defaulted">{t("Defaulted")}</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {showReport && filteredData.length > 0 && (
        <>
          <div className="mb-3 d-flex gap-2 flex-wrap">
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

          <div className="row mb-3 g-2">
            <div className="col-md-6 col-lg-3">
              <div className="card">
                <div className="card-body">
                  <small className="text-muted">{t("Total Loan Amount")}</small>
                  <h6 className="mb-0 text-primary">
                    ₦{(totals.totalLoan).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                  </h6>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="card">
                <div className="card-body">
                  <small className="text-muted">{t("Recovered Amount")}</small>
                  <h6 className="mb-0 text-success">
                    ₦{(totals.recovered).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                  </h6>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="card">
                <div className="card-body">
                  <small className="text-muted">{t("Outstanding Amount")}</small>
                  <h6 className="mb-0 text-warning">
                    ₦{(totals.outstanding).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                  </h6>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="card">
                <div className="card-body">
                  <small className="text-muted">{t("Total Loans")}</small>
                  <h6 className="mb-0 text-secondary">
                    {totals.count}
                  </h6>
                </div>
              </div>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="table table-striped table-hover table-sm">
              <thead className="table-dark">
                <tr>
                  <th>{t("Customer Name")}</th>
                  <th>{t("Account No")}</th>
                  <th className="text-end">{t("Loan Amount")}</th>
                  <th className="text-end">{t("Recovered")}</th>
                  <th className="text-end">{t("Outstanding")}</th>
                  <th>{t("Loan Date")}</th>
                  <th>{t("Due Date")}</th>
                  <th>{t("Status")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.customerName || "-"}</td>
                    <td>{row.accountNumber || "-"}</td>
                    <td className="text-end fw-bold">₦{row.loanAmount ? Number(row.loanAmount).toLocaleString("en-NG", { minimumFractionDigits: 2 }) : "0.00"}</td>
                    <td className="text-end text-success fw-bold">₦{row.recoveredAmount ? Number(row.recoveredAmount).toLocaleString("en-NG", { minimumFractionDigits: 2 }) : "0.00"}</td>
                    <td className="text-end text-warning fw-bold">₦{row.outstandingAmount ? Number(row.outstandingAmount).toLocaleString("en-NG", { minimumFractionDigits: 2 }) : "0.00"}</td>
                    <td>{row.loanDate || "-"}</td>
                    <td>{row.dueDate || "-"}</td>
                    <td>
                      <span className={`badge ${
                        row.recoveryStatus === "Recovered" ? "bg-success" :
                        row.recoveryStatus === "Partial" ? "bg-warning" :
                        row.recoveryStatus === "Outstanding" ? "bg-info" :
                        "bg-danger"
                      }`}>
                        {row.recoveryStatus || "-"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showReport && filteredData.length === 0 && !loading && (
        <div className="alert alert-info">{t("No records found for the selected period")}</div>
      )}
    </div>
  );
};

export default LoanRecoveryReport;
