import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../../lib/config";
import "./LoanNotification.css";
import logo from "../../../assets/images/PMlogo.png";

const TYPE_OPTIONS = [
  "all",
  "PAYMENT_DUE",
  "PAYMENT_OVERDUE",
  "FINAL_WARNING",
  "REPAYMENT_REMINDER",
  "DEFAULT_NOTICE",
  "LOAN_APPROVED",
  "LOAN_DISBURSED",
  "LOAN_REJECTED",
];

const asArray = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  if (Array.isArray(response?.result)) return response.result;
  if (Array.isArray(response?.result?.content)) return response.result.content;
  return [];
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const formatMoney = (value) => {
  const amount = Number(String(value ?? 0).replace(/,/g, ""));
  if (!Number.isFinite(amount)) return "?0.00";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const dueLabel = (dateValue) => {
  if (!dateValue) return "N/A";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "N/A";
  const today = new Date();
  const days = Math.ceil((date.getTime() - today.getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days > 0) return `in ${days} day${days > 1 ? "s" : ""}`;
  const overdue = Math.abs(days);
  return `${overdue} day${overdue > 1 ? "s" : ""} overdue`;
};

const normalize = (item, index, page, size) => ({
  id: item?.id || item?.notificationId || `loan-notification-${index}`,
  sn: (page - 1) * size + index + 1,
  customerName:
    item?.customerName ||
    item?.customer?.name ||
    `${item?.firstName || ""} ${item?.surname || item?.lastName || ""}`.trim() ||
    "N/A",
  customerId: item?.customerId || item?.customer?.id || "-",
  refNo: item?.referenceNumber || item?.loanId || item?.productId || item?.salesRef || "-",
  loanAmount: item?.loanAmount || item?.amount || item?.totalAmount || 0,
  duration: item?.durationOfRepayment || item?.term || item?.tenure || item?.duration || "-",
  nextRepayment: item?.nextRepayment || item?.nextDueDate || item?.dueDate || item?.scheduledDate || "",
  type: String(item?.notificationType || item?.type || "PAYMENT_DUE").toUpperCase(),
  status: String(item?.status || "ACTIVE").toUpperCase(),
  message: item?.message || item?.description || item?.notes || "No message available.",
  createdAt: item?.createdAt || item?.createdDate || "",
  raw: item,
});

const statusClass = (type) => {
  if (String(type).includes("OVERDUE") || String(type).includes("FINAL_WARNING")) return "danger";
  if (String(type).includes("DUE") || String(type).includes("REMINDER")) return "warning";
  if (String(type).includes("APPROVED") || String(type).includes("DISBURSED")) return "success";
  return "neutral";
};

const LoanNotification = ({ toggleLoanNotificationModal }) => {
  const [rows, setRows] = useState([]);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filterType, setFilterType] = useState("all");
  const [searchText, setSearchText] = useState("");
  const pageSize = 20;

  const fetchLoanNotifications = async () => {
    setLoading(true);
    setError("");

    try {
      const query = new URLSearchParams({ page: String(currentPage), limit: String(pageSize) });
      const endpoint =
        filterType === "all"
          ? `/admin/loan-notifications?${query}`
          : `/admin/loan-notifications/type/${filterType}?${query}`;

      const response = await apiRequest(endpoint, "GET");
      const list = asArray(response);
      setRows(list.map((item, index) => normalize(item, index, currentPage, pageSize)));
      setTotalPages(response?.totalPages || response?.data?.totalPages || 1);
      setTotalItems(response?.totalElements || response?.data?.totalElements || list.length);
    } catch (err) {
      setError(err?.message || "Unable to load loan notifications.");
      setRows([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoanNotifications();
  }, [currentPage, filterType]);

  const filteredRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      return (
        String(row.customerName || "").toLowerCase().includes(q) ||
        String(row.customerId || "").toLowerCase().includes(q) ||
        String(row.refNo || "").toLowerCase().includes(q)
      );
    });
  }, [rows, searchText]);

  const summary = useMemo(() => {
    const due = rows.filter((row) => row.type === "PAYMENT_DUE").length;
    const overdue = rows.filter((row) => row.type === "PAYMENT_OVERDUE").length;
    const warning = rows.filter((row) => row.type === "FINAL_WARNING").length;
    return { due, overdue, warning };
  }, [rows]);

  const viewDetails = async (row) => {
    if (!row?.id) {
      setDetail(row);
      return;
    }

    try {
      setLoading(true);
      const response = await apiRequest(`/admin/loan-notifications/${row.id}`, "GET");
      const raw = response?.data || response;
      setDetail(normalize(raw, 0, 1, 1));
    } catch {
      setDetail(row);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loan-notify-shell">
      <div className="loan-notify-header">
        <div className="loan-notify-brand">
          <img src={logo} alt="Peace of Mind" />
          <div>
            <h1>Loan Notification</h1>
            <p>Loan repayment alerts and statuses</p>
          </div>
        </div>
        <div className="loan-notify-header-actions">
          <Link to="/adminDashboard">Dashboard</Link>
          <button type="button" onClick={toggleLoanNotificationModal}>Close</button>
        </div>
      </div>

      <div className="loan-notify-toolbar">
        <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}>
          {TYPE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "All Loan Type" : option.replaceAll("_", " ")}
            </option>
          ))}
        </select>

        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search customer name, customer ID, ref no"
        />

        <button type="button" onClick={fetchLoanNotifications} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="loan-notify-summary">
        <article>
          <h3>Total Alerts</h3>
          <p>{totalItems}</p>
        </article>
        <article>
          <h3>Payment Due</h3>
          <p>{summary.due}</p>
        </article>
        <article>
          <h3>Payment Overdue</h3>
          <p>{summary.overdue}</p>
        </article>
        <article>
          <h3>Final Warning</h3>
          <p>{summary.warning}</p>
        </article>
      </div>

      {error && <div className="loan-notify-error">{error}</div>}

      <div className="loan-notify-table-wrap">
        <table className="loan-notify-table">
          <thead>
            <tr>
              <th>S/N</th>
              <th>Customer</th>
              <th>Ref No</th>
              <th>Loan Amount</th>
              <th>Next Repayment</th>
              <th>Due Day</th>
              <th>Type</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && filteredRows.length === 0 ? (
              <tr><td colSpan="8" className="empty">Loading loan notifications...</td></tr>
            ) : filteredRows.length === 0 ? (
              <tr><td colSpan="8" className="empty">No loan notifications found.</td></tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.sn}</td>
                  <td>
                    <strong>{row.customerName}</strong>
                    <small>ID: {row.customerId}</small>
                  </td>
                  <td>{row.refNo}</td>
                  <td>{formatMoney(row.loanAmount)}</td>
                  <td>{formatDate(row.nextRepayment)}</td>
                  <td>{dueLabel(row.nextRepayment)}</td>
                  <td>
                    <span className={`status ${statusClass(row.type)}`}>
                      {row.type.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td>
                    <button type="button" className="view-btn" onClick={() => viewDetails(row)}>
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="loan-notify-pagination">
        <button type="button" disabled={currentPage <= 1 || loading} onClick={() => setCurrentPage((p) => p - 1)}>Previous</button>
        <span>Page {currentPage} of {totalPages}</span>
        <button type="button" disabled={currentPage >= totalPages || loading} onClick={() => setCurrentPage((p) => p + 1)}>Next</button>
      </div>

      {detail && (
        <div className="loan-notify-modal">
          <div className="loan-notify-modal-card">
            <div className="loan-notify-modal-header">
              <h2>Loan Notification Detail</h2>
              <button type="button" onClick={() => setDetail(null)}>X</button>
            </div>
            <div className="loan-notify-modal-body">
              <div className="loan-notify-info-grid">
                <p><span>Customer Name</span><strong>{detail.customerName}</strong></p>
                <p><span>Customer ID</span><strong>{detail.customerId}</strong></p>
                <p><span>Reference No</span><strong>{detail.refNo}</strong></p>
                <p><span>Loan Amount</span><strong>{formatMoney(detail.loanAmount)}</strong></p>
                <p><span>Duration</span><strong>{detail.duration || "-"}</strong></p>
                <p><span>Next Repayment</span><strong>{formatDate(detail.nextRepayment)}</strong></p>
                <p><span>Due Day</span><strong>{dueLabel(detail.nextRepayment)}</strong></p>
                <p><span>Type</span><strong>{detail.type.replaceAll("_", " ")}</strong></p>
                <p><span>Status</span><strong>{detail.status.replaceAll("_", " ")}</strong></p>
                <p><span>Created Date</span><strong>{formatDate(detail.createdAt)}</strong></p>
              </div>
              <div className="loan-notify-note">
                <h3>Notification Message</h3>
                <p>{detail.message}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanNotification;
