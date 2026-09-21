import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../../lib/config";
import "./RecoveryNotification.css";
import logo from "../../../assets/images/PMlogo.png";

const TYPE_OPTIONS = [
  "all",
  "RECOVERY_ASSIGNED",
  "RECOVERY_IN_PROGRESS",
  "RECOVERY_SUCCESSFUL",
  "RECOVERY_FAILED",
  "FINAL_NOTICE",
  "LEGAL_ACTION_INITIATED",
  "ASSET_SEIZURE_NOTICE",
  "SETTLEMENT_OFFER",
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

const safeDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const money = (value) => {
  const numeric = Number(String(value ?? 0).replace(/,/g, ""));
  if (!Number.isFinite(numeric)) return "?0.00";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
};

const toStatus = (value) => String(value || "PENDING").toUpperCase();

const normalizeNotification = (item, index, page, size) => ({
  id: item?.id || item?.notificationId || item?.recoveryId || `recovery-${index}`,
  sn: (page - 1) * size + index + 1,
  customerName:
    item?.customerName ||
    item?.customer?.name ||
    item?.debtorName ||
    `${item?.firstName || ""} ${item?.surname || item?.lastName || ""}`.trim() ||
    "N/A",
  customerId: item?.customerId || item?.customer?.id || "-",
  loanId: item?.loanId || item?.referenceNumber || item?.salesRef || "-",
  productId: item?.productId || item?.itemId || item?.assetId || "-",
  productName: item?.productName || item?.itemName || item?.assetName || "Recovered Item",
  productCategory: item?.productCategory || item?.itemCategory || item?.assetCategory || "-",
  productDescription: item?.productDescription || item?.description || item?.itemDescription || "-",
  productImage:
    item?.productImage ||
    item?.recoveredItemImage ||
    item?.itemImage ||
    item?.assetImage ||
    item?.imageUrl ||
    item?.photo ||
    null,
  recoveredAmount: item?.recoveredAmount || item?.amountRecovered || item?.amount || 0,
  outstandingAmount: item?.outstandingAmount || item?.overdueAmount || item?.remainingBalance || 0,
  fieldDate: item?.recoveryDate || item?.fieldVisitDate || item?.updatedAt || item?.createdAt || "",
  officerName: item?.recoveryOfficerName || item?.officerName || item?.agentName || item?.assignee || "Not Assigned",
  officerId: item?.recoveryOfficerId || item?.officerId || item?.agentId || "-",
  location: item?.recoveryLocation || item?.location || item?.customerAddress || "-",
  type: String(item?.notificationType || item?.type || "RECOVERY_IN_PROGRESS").toUpperCase(),
  status: toStatus(item?.status || item?.recoveryStatus || item?.notificationStatus || "PENDING"),
  message: item?.message || item?.notes || item?.description || "No message provided.",
  raw: item,
});

const statusClass = (status) => {
  if (status.includes("SUCCESS") || status.includes("COMPLETED") || status.includes("RECOVERED")) return "success";
  if (status.includes("IN_PROGRESS") || status.includes("ACTIVE")) return "warning";
  if (status.includes("FAILED") || status.includes("REJECT") || status.includes("OVERDUE")) return "danger";
  return "neutral";
};

const RecoveryNotification = ({ toggleRecoveryNotificationModal }) => {
  const [rows, setRows] = useState([]);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filterType, setFilterType] = useState("all");
  const [selectedRefNo, setSelectedRefNo] = useState("all");

  const pageSize = 20;

  const fetchNotifications = async () => {
    setLoading(true);
    setError("");

    try {
      const queryParams = new URLSearchParams({
        page: String(currentPage),
        limit: String(pageSize),
      });

      const endpoint =
        filterType === "all"
          ? `/admin/recovery-notifications?${queryParams}`
          : `/admin/recovery-notifications/type/${filterType}?${queryParams}`;

      const response = await apiRequest(endpoint, "GET");
      const list = asArray(response);
      const normalized = list.map((item, index) => normalizeNotification(item, index, currentPage, pageSize));

      setRows(normalized);
      setTotalPages(response?.totalPages || response?.data?.totalPages || 1);
      setTotalItems(response?.totalElements || response?.data?.totalElements || list.length);
    } catch (err) {
      setError(err?.message || "Unable to load recovery notifications.");
      setRows([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [currentPage, filterType]);

  const referenceOptions = useMemo(() => {
    const values = rows
      .map((row) => String(row.loanId || "").trim())
      .filter((value) => value && value !== "-");
    return Array.from(new Set(values));
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (selectedRefNo === "all") return rows;
    return rows.filter((row) => String(row.loanId || "").trim() === selectedRefNo);
  }, [rows, selectedRefNo]);

  const summary = useMemo(() => {
    const recovered = rows.filter((row) => row.status.includes("RECOVER") || row.status.includes("COMPLETED")).length;
    const inField = rows.filter((row) => row.status.includes("IN_PROGRESS") || row.type.includes("IN_PROGRESS")).length;
    const escalated = rows.filter((row) => row.type.includes("FINAL_NOTICE") || row.type.includes("LEGAL")).length;
    return { recovered, inField, escalated };
  }, [rows]);

  const viewDetails = async (row) => {
    if (!row?.id) {
      setDetail(row);
      return;
    }

    try {
      setLoading(true);
      const response = await apiRequest(`/admin/recovery-notifications/${row.id}`, "GET");
      const raw = response?.data || response;
      setDetail(normalizeNotification(raw, 0, 1, 1));
    } catch {
      setDetail(row);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recovery-notify-shell">
      <div className="recovery-notify-header">
        <div className="recovery-notify-brand">
          <img src={logo} alt="Peace of Mind" />
          <div>
            <h1>Recovery Notification New</h1>
            <p>Field recovery alerts for Head of Department</p>
          </div>
        </div>

        <div className="recovery-notify-header-actions">
          <Link to="/adminDashboard">Dashboard</Link>
          <button type="button" onClick={toggleRecoveryNotificationModal}>Close</button>
        </div>
      </div>

      <div className="recovery-notify-toolbar">
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setCurrentPage(1);
            setSelectedRefNo("all");
          }}
        >
          {TYPE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "All Recovery Type" : option.replaceAll("_", " ")}
            </option>
          ))}
        </select>

        <select
          value={selectedRefNo}
          onChange={(e) => setSelectedRefNo(e.target.value)}
        >
          <option value="all">Ref No (All)</option>
          {referenceOptions.map((refNo) => (
            <option key={refNo} value={refNo}>
              {refNo}
            </option>
          ))}
        </select>

        <button type="button" onClick={fetchNotifications} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="recovery-notify-summary">
        <article>
          <h3>Total Alerts</h3>
          <p>{totalItems}</p>
        </article>
        <article>
          <h3>In Field</h3>
          <p>{summary.inField}</p>
        </article>
        <article>
          <h3>Recovered</h3>
          <p>{summary.recovered}</p>
        </article>
        <article>
          <h3>Escalated</h3>
          <p>{summary.escalated}</p>
        </article>
      </div>

      {error && <div className="recovery-notify-error">{error}</div>}

      <div className="recovery-notify-table-wrap">
        <table className="recovery-notify-table">
          <thead>
            <tr>
              <th>S/N</th>
              <th>Customer</th>
              <th>Product ID</th>
              <th>Recovered Item</th>
              <th>Recovery Officer</th>
              <th>Field Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && filteredRows.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty">Loading recovery notifications...</td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty">No field recovery notifications found.</td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.sn}</td>
                  <td>
                    <strong>{row.customerName}</strong>
                    <small>ID: {row.customerId || "-"}</small>
                  </td>
                  <td>{row.productId}</td>
                  <td>{row.productName}</td>
                  <td>{row.officerName}</td>
                  <td>{safeDate(row.fieldDate)}</td>
                  <td>
                    <span className={`status ${statusClass(row.status)}`}>
                      {row.status.replaceAll("_", " ")}
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

      <div className="recovery-notify-pagination">
        <button type="button" disabled={currentPage <= 1 || loading} onClick={() => setCurrentPage((prev) => prev - 1)}>
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button type="button" disabled={currentPage >= totalPages || loading} onClick={() => setCurrentPage((prev) => prev + 1)}>
          Next
        </button>
      </div>

      {detail && (
        <div className="recovery-notify-modal">
          <div className="recovery-notify-modal-card">
            <div className="recovery-notify-modal-header">
              <h2>Field Recovery Detail</h2>
              <button type="button" onClick={() => setDetail(null)}>X</button>
            </div>

            <div className="recovery-notify-modal-body">
              <div className="recovery-notify-image-box">
                {detail.productImage ? (
                  <img src={detail.productImage} alt="Recovered item" />
                ) : (
                  <div className="no-image">No recovered item image</div>
                )}
              </div>

              <div className="recovery-notify-info-grid">
                <p><span>Customer Name</span><strong>{detail.customerName}</strong></p>
                <p><span>Customer ID</span><strong>{detail.customerId || "-"}</strong></p>
                <p><span>Loan / Ref</span><strong>{detail.loanId || "-"}</strong></p>
                <p><span>Product ID</span><strong>{detail.productId || "-"}</strong></p>
                <p><span>Recovered Item</span><strong>{detail.productName || "-"}</strong></p>
                <p><span>Category</span><strong>{detail.productCategory || "-"}</strong></p>
                <p><span>Recovery Officer</span><strong>{detail.officerName || "-"}</strong></p>
                <p><span>Officer ID</span><strong>{detail.officerId || "-"}</strong></p>
                <p><span>Field Recovery Date</span><strong>{safeDate(detail.fieldDate)}</strong></p>
                <p><span>Recovered Amount</span><strong>{money(detail.recoveredAmount)}</strong></p>
                <p><span>Outstanding Amount</span><strong>{money(detail.outstandingAmount)}</strong></p>
                <p><span>Status</span><strong>{detail.status.replaceAll("_", " ")}</strong></p>
              </div>

              <div className="recovery-notify-note">
                <h3>Recovery Note To HOD</h3>
                <p>{detail.message || "No additional note available."}</p>
                <p className="location"><strong>Field Location:</strong> {detail.location || "-"}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecoveryNotification;
