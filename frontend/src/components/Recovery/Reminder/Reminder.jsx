import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BranchBadge from "../../shared/BranchBadge";
import "./Reminder.css";
import { apiRequest } from "../../../lib/config";
import headerLogo from "../../../assets/images/PMlogo.png";
import fallbackLogo from "../../../assets/images/Flogo.png";

const REMINDER_TYPES = [
  "PAYMENT_DUE",
  "PAYMENT_OVERDUE",
  "FINAL_WARNING",
  "DEFAULT_NOTICE",
  "REPAYMENT_REMINDER",
];

const asArray = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  if (Array.isArray(response?.data?.rows)) return response.data.rows;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.response)) return response.response;
  if (Array.isArray(response?.response?.data)) return response.response.data;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.response?.content)) return response.response.content;
  if (Array.isArray(response?.payload)) return response.payload;
  if (Array.isArray(response?.result)) return response.result;
  if (Array.isArray(response?.result?.content)) return response.result.content;
  return [];
};

const normalizeReminder = (item) => ({
  id: item?.id || item?.reminderId || item?.notificationId || `${Date.now()}-${Math.random()}`,
  recipientId: item?.recipientId || item?.customerId || item?.customer?.id || "",
  recipientName: item?.recipientName || item?.customerName || item?.customer?.name || "N/A",
  recipientEmail: item?.recipientEmail || item?.customerEmail || item?.email || "N/A",
  recipientPhone: item?.recipientPhone || item?.phoneNumber || "",
  reminderType: item?.reminderType || item?.notificationType || item?.type || "PAYMENT_DUE",
  message: item?.message || item?.notes || "",
  notes: item?.notes || "",
  scheduledDate: item?.scheduledDate || item?.dueDate || item?.nextRepayment || "",
  sentDate: item?.sentDate || item?.updatedAt || "",
  raw: item,
});

const normalizeDueNotification = (item, index) => ({
  id: item?.id || item?.notificationId || item?.loanNotificationId || `due-${index}`,
  recipientId: item?.customerId || item?.recipientId || item?.customer?.id || "",
  recipientName:
    item?.customerName ||
    item?.recipientName ||
    item?.customer?.name ||
    `${item?.firstName || ""} ${item?.surname || item?.lastName || ""}`.trim() ||
    "N/A",
  recipientEmail: item?.recipientEmail || item?.customerEmail || item?.email || "N/A",
  recipientPhone: item?.recipientPhone || item?.phoneNumber || item?.phone || "",
  reminderType: item?.notificationType || item?.reminderType || item?.type || "PAYMENT_DUE",
  message: item?.message || item?.notes || item?.title || "",
  notes: item?.notes || "",
  scheduledDate: item?.dueDate || item?.scheduledDate || item?.nextRepaymentDate || item?.repaymentDate || "",
  sentDate: item?.sentDate || item?.updatedAt || item?.createdAt || "",
  raw: item,
});

const isDueType = (type) => {
  const value = String(type || "").toUpperCase();
  return value === "PAYMENT_DUE" || value === "REPAYMENT_REMINDER" || value === "PAYMENT_OVERDUE";
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-GB");
};

const daysToDue = (dateValue) => {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDue = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((startOfDue.getTime() - startOfNow.getTime()) / 86400000);
};

const timelineLabel = (days) => {
  const value = Number(days);
  if (value === 7) return "one week";
  if (value === 3) return "three days";
  if (value === 2) return "two days";
  if (value === 1) return "one day";
  return `${value} days`;
};

const buildAutoMessage = (form) => {
  const dueText = timelineLabel(form.days);
  const typeText = String(form.reminderType || "PAYMENT_DUE").replaceAll("_", " ").toLowerCase();
  return `Dear customer, this is a ${typeText} reminder. Your repayment is due in ${dueText}. Please make your payment on time to avoid penalties. Thank you.`;
};

const normalizeCustomer = (item, index) => ({
  id: item?.id || item?.customerId || item?.customerID || `customer-${index}`,
  name:
    item?.name ||
    item?.fullName ||
    `${item?.firstName || ""} ${item?.surname || item?.lastName || ""}`.trim() ||
    "Unknown Customer",
  email: item?.email || item?.customerEmail || "",
  phoneNumber: item?.phoneNumber || item?.phone || item?.mobileNumber || "",
  accountNumber: item?.accountNumber || item?.accountNo || "",
});

const Reminder = () => {
  const navigate = useNavigate();
  const [logoSrc, setLogoSrc] = useState(headerLogo);

  const [activeTab, setActiveTab] = useState("REPORT");
  const [sentReminders, setSentReminders] = useState([]);
  const [pendingReminders, setPendingReminders] = useState([]);
  const [dueReminders, setDueReminders] = useState([]);
  const [owingCustomers, setOwingCustomers] = useState([]);
  const [reportFilter, setReportFilter] = useState("OWING");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [singleForm, setSingleForm] = useState({
    sendMailTo: "",
    phoneNumber: "",
    subject: "INSTALLMENT REMINDER",
    compose: "",
    days: "7",
    reminderType: "PAYMENT_DUE",
    autoMessage: false,
  });

  const [multipleForm, setMultipleForm] = useState({
    multipleMailTo: "",
    multipleSubject: "INSTALLMENT REMINDER",
    multipleCompose: "",
    days: "7",
    multipleReminderType: "PAYMENT_DUE",
  });
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [selectedCustomerInfo, setSelectedCustomerInfo] = useState(null);

  const fetchSentReminders = async () => {
    const response = await apiRequest("/admin/reminders/sent", "GET");
    setSentReminders(asArray(response).map(normalizeReminder));
  };

  const fetchPendingReminders = async () => {
    const response = await apiRequest("/admin/reminders/pending", "GET");
    setPendingReminders(asArray(response).map(normalizeReminder));
  };

  const fetchDueReminders = async () => {
    const callEndpoint = async (endpoint) => {
      try {
        return await apiRequest(endpoint, "GET");
      } catch {
        return null;
      }
    };

    const [dueRemindersResponse, paymentDueResponse, repaymentReminderResponse, paymentOverdueResponse, allNotificationsResponse] = await Promise.all([
      callEndpoint("/admin/reminders/due"),
      callEndpoint("/admin/loan-notifications/type/PAYMENT_DUE?limit=500"),
      callEndpoint("/admin/loan-notifications/type/REPAYMENT_REMINDER?limit=500"),
      callEndpoint("/admin/loan-notifications/type/PAYMENT_OVERDUE?limit=500"),
      callEndpoint("/admin/loan-notifications?page=1&limit=500"),
    ]);

    const reminderRows = asArray(dueRemindersResponse).map(normalizeReminder);

    const paymentDueRows = asArray(paymentDueResponse).map(normalizeDueNotification);

    const repaymentReminderRows = asArray(repaymentReminderResponse).map(normalizeDueNotification);
    const paymentOverdueRows = asArray(paymentOverdueResponse).map(normalizeDueNotification);
    const allNotificationDueRows = asArray(allNotificationsResponse)
      .filter((item) => isDueType(item?.notificationType || item?.type))
      .map(normalizeDueNotification);

    const merged = [
      ...reminderRows,
      ...paymentDueRows,
      ...repaymentReminderRows,
      ...paymentOverdueRows,
      ...allNotificationDueRows,
    ];
    const deduped = Array.from(
      new Map(
        merged.map((row) => {
          const key = `${row.id}-${row.recipientEmail}-${row.scheduledDate}`;
          return [key, row];
        })
      ).values()
    );

    setDueReminders(deduped);
  };

  const fetchOwingCustomers = async () => {
    let records = [];
    try {
      const overdue = await apiRequest("/admin/loan-notifications/type/PAYMENT_OVERDUE?limit=500", "GET");
      records = asArray(overdue);
    } catch {
      records = [];
    }

    if (!records.length) {
      try {
        const fallback = await apiRequest("/admin/loan-notifications/type/DEFAULT_NOTICE?limit=500", "GET");
        records = asArray(fallback);
      } catch {
        records = [];
      }
    }

    setOwingCustomers(
      records.map((item, index) => ({
        id: item?.customerId || item?.recipientId || `owing-${index}`,
        name: item?.customerName || item?.recipientName || item?.customer?.name || "N/A",
        email: item?.recipientEmail || item?.customerEmail || item?.email || "",
        productNumber: item?.productId || item?.loanId || item?.referenceNumber || "-",
      }))
    );
  };

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    const results = await Promise.allSettled([
      fetchSentReminders(),
      fetchPendingReminders(),
      fetchDueReminders(),
      fetchOwingCustomers(),
    ]);

    const failed = results.filter((result) => result.status === "rejected");
    if (failed.length > 0) {
      const firstError = failed[0]?.reason;
      const code = firstError?.code || firstError?.status || "";
      if (code === 403) {
        setError("Some reminder endpoints are not permitted (403). Showing available data.");
      } else {
        setError(firstError?.message || "Failed to load some reminder data.");
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (activeTab !== "COMPOSE") return undefined;

    const query = singleForm.sendMailTo.trim();
    if (!query) {
      setCustomerSuggestions([]);
      return undefined;
    }

    const timer = setTimeout(async () => {
      setSearchingCustomers(true);
      try {
        const response = await apiRequest(`/admin/customers/search?query=${encodeURIComponent(query)}`, "GET");
        const list = asArray(response).map(normalizeCustomer).filter((customer) => customer.email);
        const deduped = Array.from(new Map(list.map((customer) => [customer.email.toLowerCase(), customer])).values());
        setCustomerSuggestions(deduped.slice(0, 8));
      } catch {
        setCustomerSuggestions([]);
      } finally {
        setSearchingCustomers(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [singleForm.sendMailTo, activeTab]);

  const owingEmailSet = useMemo(
    () => new Set(owingCustomers.map((item) => String(item.email || "").toLowerCase()).filter(Boolean)),
    [owingCustomers]
  );

  const reportRows = useMemo(() => {
    const byDueDays = {
      ONE_WEEK: dueReminders.filter((item) => daysToDue(item.scheduledDate) === 7),
      THREE_DAYS: dueReminders.filter((item) => daysToDue(item.scheduledDate) === 3),
      TWO_DAYS: dueReminders.filter((item) => daysToDue(item.scheduledDate) === 2),
      ONE_DAY: dueReminders.filter((item) => daysToDue(item.scheduledDate) === 1),
    };

    const sentToOwing = sentReminders.filter((item) => {
      const email = String(item.recipientEmail || "").toLowerCase();
      return (
        item.reminderType === "PAYMENT_OVERDUE" ||
        item.reminderType === "DEFAULT_NOTICE" ||
        owingEmailSet.has(email)
      );
    });

    return [
      { key: "OWING", label: "Sent Mail To Owing Customers", count: sentToOwing.length, data: sentToOwing },
      { key: "ONE_WEEK", label: "Reminder: One Week To Due", count: byDueDays.ONE_WEEK.length, data: byDueDays.ONE_WEEK },
      { key: "THREE_DAYS", label: "Reminder: Three Days To Due", count: byDueDays.THREE_DAYS.length, data: byDueDays.THREE_DAYS },
      { key: "TWO_DAYS", label: "Reminder: Two Days To Due", count: byDueDays.TWO_DAYS.length, data: byDueDays.TWO_DAYS },
      { key: "ONE_DAY", label: "Reminder: A Day To Due", count: byDueDays.ONE_DAY.length, data: byDueDays.ONE_DAY },
    ];
  }, [dueReminders, sentReminders, owingEmailSet]);

  const selectedReportData = useMemo(
    () => reportRows.find((row) => row.key === reportFilter)?.data || [],
    [reportRows, reportFilter]
  );

  const clearAlerts = () => {
    setTimeout(() => {
      setError("");
      setSuccess("");
    }, 2500);
  };

  const createReminder = async (payload) => {
    await apiRequest("/admin/reminders", "POST", payload);
  };

  const handleSendSingle = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!singleForm.sendMailTo.trim()) {
        throw new Error("Recipient email is required.");
      }

      const days = Number(singleForm.days || 0);
      const scheduledDate = new Date(Date.now() + Math.max(days, 0) * 86400000).toISOString();
      const finalMessage = singleForm.autoMessage
        ? buildAutoMessage(singleForm)
        : (singleForm.compose || singleForm.subject);
      const pickedCustomer = selectedCustomerInfo
        && selectedCustomerInfo.email.toLowerCase() === singleForm.sendMailTo.trim().toLowerCase()
        ? selectedCustomerInfo
        : null;

      await createReminder({
        message: finalMessage,
        recipientType: "CUSTOMER",
        scheduledDate,
        recipientName: pickedCustomer?.name || singleForm.sendMailTo.split("@")[0] || "Customer",
        recipientEmail: singleForm.sendMailTo,
        recipientId: pickedCustomer?.id || 0,
        recipientPhone: singleForm.phoneNumber || pickedCustomer?.phoneNumber || "",
        notes: finalMessage,
        reminderType: singleForm.reminderType,
      });

      setSuccess("Reminder mail sent successfully.");
      setSingleForm((prev) => ({
        ...prev,
        sendMailTo: "",
        phoneNumber: "",
        compose: "",
        autoMessage: false,
      }));
      setSelectedCustomerInfo(null);
      setCustomerSuggestions([]);
      await fetchAll();
      clearAlerts();
    } catch (err) {
      setError(err?.message || "Failed to send reminder mail.");
      clearAlerts();
    } finally {
      setLoading(false);
    }
  };

  const handleSendMultiple = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const emails = multipleForm.multipleMailTo
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      if (!emails.length) {
        throw new Error("Enter at least one email for multiple reminder.");
      }

      const days = Number(multipleForm.days || 0);
      const scheduledDate = new Date(Date.now() + Math.max(days, 0) * 86400000).toISOString();

      await Promise.all(
        emails.map((email) =>
          createReminder({
            message: multipleForm.multipleCompose || multipleForm.multipleSubject,
            recipientType: "CUSTOMER",
            scheduledDate,
            recipientName: email.split("@")[0] || "Customer",
            recipientEmail: email,
            recipientId: 0,
            recipientPhone: "",
            notes: multipleForm.multipleCompose,
            reminderType: multipleForm.multipleReminderType,
          })
        )
      );

      setSuccess(`Reminder sent to ${emails.length} customers.`);
      setMultipleForm((prev) => ({ ...prev, multipleMailTo: "", multipleCompose: "" }));
      await fetchAll();
      clearAlerts();
    } catch (err) {
      setError(err?.message || "Failed to send multiple reminders.");
      clearAlerts();
    } finally {
      setLoading(false);
    }
  };

  const markAsSent = async (id) => {
    setLoading(true);
    setError("");
    try {
      await apiRequest(`/admin/reminders/${id}/mark-sent`, "PUT");
      setSuccess("Reminder marked as sent.");
      await fetchAll();
      clearAlerts();
    } catch (err) {
      setError(err?.message || "Failed to mark reminder as sent.");
      clearAlerts();
    } finally {
      setLoading(false);
    }
  };

  const deleteReminder = async (id) => {
    if (!window.confirm("Delete this reminder?")) return;
    setLoading(true);
    setError("");
    try {
      await apiRequest(`/admin/reminders/${id}`, "DELETE");
      setSuccess("Reminder deleted.");
      await fetchAll();
      clearAlerts();
    } catch (err) {
      setError(err?.message || "Failed to delete reminder.");
      clearAlerts();
    } finally {
      setLoading(false);
    }
  };

  const renderReminderTable = (rows, mode) => (
    <div className="reminder-standard-table-wrap">
      <table className="reminder-standard-table">
        <thead>
          <tr>
            <th>S/N</th>
            <th>Recipient</th>
            <th>Email</th>
            <th>Type</th>
            <th>Scheduled</th>
            <th>Sent</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan="7" className="reminder-standard-empty">No records found.</td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={row.id}>
                <td>{index + 1}</td>
                <td>{row.recipientName}</td>
                <td>{row.recipientEmail}</td>
                <td>{row.reminderType}</td>
                <td>{formatDateTime(row.scheduledDate)}</td>
                <td>{formatDateTime(row.sentDate)}</td>
                <td>
                  <div className="reminder-standard-actions">
                    {mode === "PENDING" && (
                      <button type="button" onClick={() => markAsSent(row.id)} disabled={loading}>
                        Mark Sent
                      </button>
                    )}
                    <button type="button" onClick={() => deleteReminder(row.id)} disabled={loading}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="reminder-standard-shell">
      <div className="reminder-standard-header">
        <div className="reminder-standard-logo">
          <img
            src={logoSrc}
            alt="Peace of Mind logo"
            onError={() => setLogoSrc(fallbackLogo)}
          />
        </div>
        <h1>Reminder</h1>
        <div style={{ display: "flex", justifyContent: "center", margin: "0.4rem 0" }}>
          <BranchBadge />
        </div>
        <div className="reminder-standard-header-actions">
          <button type="button" onClick={() => navigate("/recovery")}>Back</button>
          <Link to="/adminDashboard">Dashboard</Link>
        </div>
      </div>

      <div className="reminder-standard-main">
        <aside className="reminder-standard-sidebar">
          {["REPORT", "SENT MESSAGE", "PENDING", "DUE", "COMPOSE", "MULTIPLE MAIL"].map((tab) => (
            <button
              key={tab}
              type="button"
              className={activeTab === tab ? "active" : ""}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </aside>

        <section className="reminder-standard-card">
          <div className="reminder-standard-card-header">
            <h2>{activeTab}</h2>
            <button type="button" onClick={fetchAll} disabled={loading}>Refresh</button>
          </div>

          {error && <div className="reminder-standard-alert reminder-standard-alert-error">{error}</div>}
          {success && <div className="reminder-standard-alert reminder-standard-alert-success">{success}</div>}

          {activeTab === "REPORT" && (
            <>
              <div className="reminder-standard-report-grid">
                {reportRows.map((row) => (
                  <div key={row.key} className="reminder-standard-report-card">
                    <h3>{row.label}</h3>
                    <p>{row.count}</p>
                    <button type="button" onClick={() => setReportFilter(row.key)}>View Report</button>
                  </div>
                ))}
              </div>

              <h3 className="reminder-standard-subtitle">
                Report Detail: {reportRows.find((row) => row.key === reportFilter)?.label}
              </h3>
              {renderReminderTable(selectedReportData, "REPORT")}
            </>
          )}

          {activeTab === "SENT MESSAGE" && renderReminderTable(sentReminders, "SENT")}
          {activeTab === "PENDING" && renderReminderTable(pendingReminders, "PENDING")}
          {activeTab === "DUE" && renderReminderTable(dueReminders, "DUE")}

          {activeTab === "COMPOSE" && (
            <form onSubmit={handleSendSingle} className="reminder-standard-form">
              <label>
                <span>Send Mail To</span>
                <div className="reminder-standard-picker">
                  <input
                    type="email"
                    value={singleForm.sendMailTo}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      setSingleForm((prev) => ({ ...prev, sendMailTo: nextValue }));
                      if (
                        selectedCustomerInfo
                        && selectedCustomerInfo.email.toLowerCase() !== nextValue.trim().toLowerCase()
                      ) {
                        setSelectedCustomerInfo(null);
                      }
                    }}
                    required
                  />
                  {searchingCustomers && (
                    <small className="reminder-standard-picker-hint">Searching customer info...</small>
                  )}
                  {customerSuggestions.length > 0 && (
                    <div className="reminder-standard-suggestions">
                      {customerSuggestions.map((customer) => (
                        <button
                          key={`${customer.id}-${customer.email}`}
                          type="button"
                          onClick={() => {
                            setSingleForm((prev) => ({
                              ...prev,
                              sendMailTo: customer.email,
                              phoneNumber: customer.phoneNumber || prev.phoneNumber,
                            }));
                            setSelectedCustomerInfo(customer);
                            setCustomerSuggestions([]);
                          }}
                        >
                          <strong>{customer.name}</strong>
                          <span>{customer.email}</span>
                          <small>{customer.accountNumber ? `A/C: ${customer.accountNumber}` : "Customer info"}</small>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </label>

              <label>
                <span>Phone Number</span>
                <input
                  type="text"
                  value={singleForm.phoneNumber}
                  onChange={(e) => setSingleForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                />
              </label>

              <label>
                <span>Reminder Timeline</span>
                <select
                  value={singleForm.days}
                  onChange={(e) =>
                    setSingleForm((prev) => {
                      const next = { ...prev, days: e.target.value };
                      if (next.autoMessage) next.compose = buildAutoMessage(next);
                      return next;
                    })
                  }
                >
                  <option value="7">One Week To Due</option>
                  <option value="3">Three Days To Due</option>
                  <option value="2">Two Days To Due</option>
                  <option value="1">A Day To Due</option>
                </select>
              </label>

              <label>
                <span>Reminder Type</span>
                <select
                  value={singleForm.reminderType}
                  onChange={(e) =>
                    setSingleForm((prev) => {
                      const next = { ...prev, reminderType: e.target.value };
                      if (next.autoMessage) next.compose = buildAutoMessage(next);
                      return next;
                    })
                  }
                >
                  {REMINDER_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Subject</span>
                <input
                  type="text"
                  value={singleForm.subject}
                  onChange={(e) => setSingleForm((prev) => ({ ...prev, subject: e.target.value }))}
                />
              </label>

              <label className="full">
                <span>Auto Message</span>
                <div className="reminder-standard-switch-row">
                  <label className="reminder-standard-switch">
                    <input
                      type="checkbox"
                      checked={singleForm.autoMessage}
                      onChange={(e) =>
                        setSingleForm((prev) => ({
                          ...prev,
                          autoMessage: e.target.checked,
                          compose: e.target.checked ? buildAutoMessage(prev) : prev.compose,
                        }))
                      }
                    />
                    <span className="reminder-standard-slider" />
                  </label>
                  <strong>{singleForm.autoMessage ? "Auto message ON" : "Auto message OFF"}</strong>
                </div>
              </label>

              <label className="full">
                <span>Compose</span>
                <textarea
                  rows="5"
                  value={singleForm.compose}
                  placeholder="Type custom reminder message"
                  disabled={singleForm.autoMessage}
                  onChange={(e) => setSingleForm((prev) => ({ ...prev, compose: e.target.value }))}
                />
              </label>

              <button type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send Reminder"}
              </button>
            </form>
          )}

          {activeTab === "MULTIPLE MAIL" && (
            <form onSubmit={handleSendMultiple} className="reminder-standard-form">
              <label className="full">
                <span>Send Mail To (comma separated)</span>
                <textarea
                  rows="3"
                  value={multipleForm.multipleMailTo}
                  onChange={(e) => setMultipleForm((prev) => ({ ...prev, multipleMailTo: e.target.value }))}
                  required
                />
              </label>

              <label>
                <span>Reminder Timeline</span>
                <select
                  value={multipleForm.days}
                  onChange={(e) => setMultipleForm((prev) => ({ ...prev, days: e.target.value }))}
                >
                  <option value="7">One Week To Due</option>
                  <option value="3">Three Days To Due</option>
                  <option value="2">Two Days To Due</option>
                  <option value="1">A Day To Due</option>
                </select>
              </label>

              <label>
                <span>Reminder Type</span>
                <select
                  value={multipleForm.multipleReminderType}
                  onChange={(e) => setMultipleForm((prev) => ({ ...prev, multipleReminderType: e.target.value }))}
                >
                  {REMINDER_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Subject</span>
                <input
                  type="text"
                  value={multipleForm.multipleSubject}
                  onChange={(e) => setMultipleForm((prev) => ({ ...prev, multipleSubject: e.target.value }))}
                />
              </label>

              <label className="full">
                <span>Compose</span>
                <textarea
                  rows="5"
                  value={multipleForm.multipleCompose}
                  onChange={(e) => setMultipleForm((prev) => ({ ...prev, multipleCompose: e.target.value }))}
                />
              </label>

              <button type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send To All"}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
};

export default Reminder;


