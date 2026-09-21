import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../../lib/config";
import logo from "../../../assets/images/PMlogo.png";
import "./LoanReport.css";

const asArray = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  if (Array.isArray(response?.result)) return response.result;
  if (Array.isArray(response?.result?.content)) return response.result.content;
  return [];
};

const fmtCurrency = (value) => {
  const amount = Number(String(value ?? 0).replace(/,/g, ""));
  if (!Number.isFinite(amount)) return "?0.00";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const fmtDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtDuration = (value) => {
  if (!value) return "-";
  if (typeof value === "number") return `${value} month${value > 1 ? "s" : ""}`;
  return String(value);
};

const isExpired = (value) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < Date.now();
};

const isDefaulted = (row) => {
  const type = String(row?.notificationType || "").toUpperCase();
  const status = String(row?.status || "").toUpperCase();
  return (
    type.includes("PAYMENT_OVERDUE") ||
    type.includes("FINAL_WARNING") ||
    type.includes("DEFAULT") ||
    status.includes("DEFAULT") ||
    status.includes("OVERDUE")
  );
};

const loanCategory = (row) => {
  if (isDefaulted(row)) return "DEFAULTED";
  if (isExpired(row.expiryDate)) return "EXPIRED";
  return "ONGOING";
};

const normalizeRow = (item, index, page, size) => ({
  id: item?.id || item?.loanId || item?.notificationId || `loan-report-${index}`,
  sn: (page - 1) * size + index + 1,
  customerName:
    item?.customerName ||
    item?.customer?.name ||
    item?.recipientName ||
    `${item?.firstName || ""} ${item?.surname || item?.lastName || ""}`.trim() ||
    "N/A",
  refNo: item?.referenceNumber || item?.loanNumber || item?.productId || item?.loanId || "-",
  loanAmount: item?.loanAmount || item?.amount || item?.totalAmount || 0,
  duration: item?.durationOfRepayment || item?.term || item?.tenure || item?.duration || "-",
  nextRepayment: item?.nextRepayment || item?.nextDueDate || item?.dueDate || item?.scheduledDate || "",
  expiryDate: item?.expiryDate || item?.endDate || item?.maturityDate || "",
  notificationType: String(item?.notificationType || item?.reminderType || "N/A").toUpperCase(),
  status: String(item?.status || "ACTIVE").toUpperCase(),
  source:
    item?.loanSource ||
    item?.source ||
    item?.channel ||
    item?.customerType ||
    (item?.isWalkIn === true ? "WALK_IN" : item?.isOnline === true ? "ONLINE" : "UNKNOWN"),
});

const LoanReport = ({ toggleLoanReportModal }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [loanTypeFilter, setLoanTypeFilter] = useState("ALL");
  const [loanSourceFilter, setLoanSourceFilter] = useState("ALL");

  const [summary, setSummary] = useState({
    totalLoanAmount: 0,
    totalAmountDue: 0,
    defaulted: 0,
    paymentDue: 0,
    paymentOverdue: 0,
    totalNotifications: 0,
    sentNotifications: 0,
    unsentNotifications: 0,
    finalWarning: 0,
  });

  const pageSize = 20;

  const fetchLoanReport = async () => {
    setLoading(true);
    setError("");

    try {
      const query = new URLSearchParams({ page: String(currentPage), limit: String(pageSize) });
      const response = await apiRequest(`/admin/reports/loan?${query}`, "GET");

      let reportList = [];
      if (Array.isArray(response?.data?.allNotifications)) {
        reportList = response.data.allNotifications;
        setSummary({
          totalLoanAmount: response.data.totalLoanAmount || 0,
          totalAmountDue: response.data.totalAmountDue || 0,
          defaulted: response.data.defaulted || 0,
          paymentDue: response.data.paymentDue || 0,
          paymentOverdue: response.data.paymentOverdue || 0,
          totalNotifications: response.data.totalNotifications || 0,
          sentNotifications: response.data.sentNotifications || 0,
          unsentNotifications: response.data.unsentNotifications || 0,
          finalWarning: response.data.finalWarning || 0,
        });
      } else {
        reportList = asArray(response);
      }

      setRows(reportList.map((item, index) => normalizeRow(item, index, currentPage, pageSize)));
      setTotalPages(response?.totalPages || response?.data?.totalPages || 1);
      setTotalItems(response?.totalElements || response?.data?.totalElements || reportList.length);
    } catch (err) {
      setError(err?.message || "Failed to load loan report.");
      setRows([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoanReport();
  }, [currentPage]);

  const filteredRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch =
        !q ||
        String(row.customerName || "").toLowerCase().includes(q) ||
        String(row.refNo || "").toLowerCase().includes(q);
      const matchesType = loanTypeFilter === "ALL" || loanCategory(row) === loanTypeFilter;
      const normalizedSource = String(row.source || "").toUpperCase();
      const sourceBucket = normalizedSource.includes("WALK") ? "WALK_IN" : normalizedSource.includes("ONLINE") ? "ONLINE" : "UNKNOWN";
      const matchesSource = loanSourceFilter === "ALL" || sourceBucket === loanSourceFilter;
      return matchesSearch && matchesType && matchesSource;
    });
  }, [rows, searchText, loanTypeFilter, loanSourceFilter]);

  const categoryStats = useMemo(() => {
    const expired = rows.filter((row) => isExpired(row.expiryDate)).length;
    const defaulted = rows.filter((row) => isDefaulted(row)).length;
    const ongoing = rows.filter((row) => !isExpired(row.expiryDate) && !isDefaulted(row)).length;
    return { ongoing, defaulted, expired };
  }, [rows]);

  return (
    <div className="loan-report-shell">
      <div className="loan-report-header">
        <div className="loan-report-brand">
          <img src={logo} alt="Peace of Mind" />
          <div>
            <h1>Loan Report</h1>
            <p>Loan portfolio and repayment notification report</p>
          </div>
        </div>

        <div className="loan-report-header-actions">
          <button type="button" onClick={fetchLoanReport} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
          <button type="button" onClick={toggleLoanReportModal}>Close</button>
        </div>
      </div>

      <div className="loan-report-toolbar">
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search by customer name or ref no"
        />
        <select value={loanTypeFilter} onChange={(e) => setLoanTypeFilter(e.target.value)}>
          <option value="ALL">All Loan Type</option>
          <option value="ONGOING">Ongoing Loan</option>
          <option value="DEFAULTED">Payment Defaulted Loan</option>
          <option value="EXPIRED">Expired Loan</option>
        </select>
        <select value={loanSourceFilter} onChange={(e) => setLoanSourceFilter(e.target.value)}>
          <option value="ALL">Both Online & Walk-in</option>
          <option value="ONLINE">Online Loan</option>
          <option value="WALK_IN">Walk-in Loan</option>
        </select>
      </div>

      <div className="loan-report-summary">
        <article>
          <h3>Ongoing Loan</h3>
          <p>{categoryStats.ongoing}</p>
        </article>
        <article>
          <h3>Payment Defaulted Loan</h3>
          <p>{categoryStats.defaulted || summary.defaulted}</p>
        </article>
        <article>
          <h3>Expired Loan</h3>
          <p>{categoryStats.expired}</p>
        </article>
        <article>
          <h3>Total Loan Amount</h3>
          <p>{fmtCurrency(summary.totalLoanAmount)}</p>
        </article>
        <article>
          <h3>Total Amount Due</h3>
          <p>{fmtCurrency(summary.totalAmountDue)}</p>
        </article>
        <article>
          <h3>Total Notifications</h3>
          <p>{summary.totalNotifications || totalItems}</p>
        </article>
      </div>

      {error && <div className="loan-report-error">{error}</div>}

      <div className="loan-report-table-wrap">
        <table className="loan-report-table">
          <thead>
            <tr>
              <th>S/N</th>
              <th>Customer Name</th>
              <th>Ref No</th>
              <th>Loan Amount</th>
              <th>Duration</th>
              <th>Loan Source</th>
              <th>Next Repayment</th>
              <th>Expiry Date</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && filteredRows.length === 0 ? (
              <tr><td className="empty" colSpan="10">Loading loan report...</td></tr>
            ) : filteredRows.length === 0 ? (
              <tr><td className="empty" colSpan="10">No loan report data found.</td></tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.sn}</td>
                  <td>{row.customerName}</td>
                  <td>{row.refNo}</td>
                  <td>{fmtCurrency(row.loanAmount)}</td>
                  <td>{fmtDuration(row.duration)}</td>
                  <td>{String(row.source || "-").replaceAll("_", " ")}</td>
                  <td>{fmtDate(row.nextRepayment)}</td>
                  <td>{fmtDate(row.expiryDate)}</td>
                  <td>{row.notificationType.replaceAll("_", " ")}</td>
                  <td>{row.status.replaceAll("_", " ")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="loan-report-pagination">
        <button type="button" disabled={currentPage <= 1 || loading} onClick={() => setCurrentPage((p) => p - 1)}>
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button type="button" disabled={currentPage >= totalPages || loading} onClick={() => setCurrentPage((p) => p + 1)}>
          Next
        </button>
      </div>
    </div>
  );
};

export default LoanReport;
