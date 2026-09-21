import React, { useEffect, useMemo, useState } from "react";
import { FaTimes } from "react-icons/fa";
import BranchBadge from "../../../../shared/BranchBadge";
import { IoGridOutline } from "react-icons/io5";
import Dashboard from "../../../../ui/DashboardBtn";
import pmLogo from "../../../../../assets/images/PMlogo.png";
import { apiRequest } from "../../../../../lib/config";
import { APPROVAL_TYPES, createApprovalRequest } from "../../../../../lib/adminApi";
import {
  createReturnRequest,
  fetchReturns,
  toBackendRefundMethod,
  toBackendReturnMethod,
  updateReturnStatus,
} from "../../../../../lib/returnsApi";
import { useAuth } from "../../../../../context/AuthContext";
import "./ReturnOrder.css";

const RETURN_DAYS = 30;

const REASONS = [
  "Damaged item",
  "Wrong product",
  "Size issue",
  "Product defective",
  "Changed mind"
];

const RETURN_METHODS = [
  "Pickup from customer",
  "Drop-off location",
  "Self shipping"
];

const REFUND_METHODS = [
  "Original payment method",
  "Wallet/store credit",
  "Exchange/replacement"
];

const REQUEST_TYPES = [
  { value: "online", label: "Online Return Request" },
  { value: "walkin", label: "Walk-in Return Request" }
];

const STATUS_FLOW = ["Pending", "Approved", "Rejected", "Picked up", "Refunded", "Completed"];

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.response?.content)) return payload.response.content;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;
  if (Array.isArray(payload?.response)) return payload.response;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
};

const firstValue = (item, keys, fallback = "") => {
  for (const key of keys) {
    const value = key.split(".").reduce((acc, part) => acc?.[part], item);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
};

const normalizeOrder = (order, knownType) => {
  const product = Array.isArray(order?.products) ? order.products[0] : order?.product || {};
  const orderId = firstValue(order, ["id", "orderId", "salesOrderId"]);
  const referenceNo = firstValue(order, [
    "referenceNo",
    "referenceNumber",
    "orderNumber",
    "productInfo.referenceNo",
    "paymentReference"
  ], orderId);
  let requestType = knownType;
  if (!requestType) {
    const typeText = String(
      firstValue(order, [
        "requestType",
        "saleType",
        "salesType",
        "orderType",
        "channel",
        "customerType",
        "source"
      ], "")
    ).toLowerCase();
    const isOnline = typeText.includes("online") || Boolean(firstValue(order, ["userId", "customer.userId", "email"]));
    requestType = isOnline ? "online" : "walkin";
  }

  return {
    raw: order,
    id: orderId,
    requestType,
    referenceNo,
    customerName: firstValue(order, ["customerName", "customer.name", "customerInfo.customerName"], "Customer"),
    accountNumber: firstValue(order, ["accountNumber", "customer.accountNumber", "customerInfo.accountNumber"], "N/A"),
    productId: firstValue(order, ["productId", "productInfo.productId", "product.id", "products.0.productId", "items.0.productId"], product?.productId || product?.id || "N/A"),
    productName: firstValue(order, ["productName", "productInfo.productName", "product.name", "products.0.productName", "items.0.productName"], product?.productName || product?.name || "N/A"),
    productCategory: firstValue(order, ["category", "productCategory", "productInfo.category", "product.category", "products.0.category", "items.0.category"], product?.category || "N/A"),
    totalAmount: Number(firstValue(order, ["totalAmount", "amount", "grandTotal", "productInfo.price", "products.0.totalAmount", "items.0.totalAmount"], product?.total || 0)) || 0,
    status: firstValue(order, ["status", "orderStatus", "deliveryStatus"], "PENDING"),
    returnable: firstValue(order, ["returnable", "isReturnable", "product.returnable"], true),
    createdAt: firstValue(order, ["deliveredAt", "deliveryDate", "updatedAt", "createdAt", "orderDate"], ""),
    deliveryAddress: firstValue(order, ["deliveryAddress", "address", "customer.address", "customerInfo.address"], "N/A")
  };
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(amount || 0));

const ReturnOrder = ({ toggleReturnOrderModal }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [adminSelectedId, setAdminSelectedId] = useState("");
  const [adminComment, setAdminComment] = useState("");
  const [referenceDropdownOpen, setReferenceDropdownOpen] = useState(false);

  const [form, setForm] = useState({
    requestType: "online",
    productId: "",
    reason: "",
    description: "",
    returnMethod: RETURN_METHODS[0],
    refundMethod: REFUND_METHODS[0],
    proofName: "",
    proofPreview: "",
    notifyEmail: true,
    notifySms: true,
    notifyInApp: true
  });

  const loadReturns = async () => {
    try {
      setRequests(await fetchReturns());
    } catch {
      setRequests([]);
    }
  };

  useEffect(() => {
    fetchOrders();
    loadReturns();
  }, []);

  useEffect(() => {
    if (!selectedOrderId) {
      setSelectedOrder(null);
      return;
    }
    setSelectedOrder(orders.find((order) => String(order.id) === String(selectedOrderId)) || null);
  }, [orders, selectedOrderId]);

  useEffect(() => {
    setSelectedOrderId("");
    setSelectedOrder(null);
    setReferenceDropdownOpen(false);
    setForm((prev) => ({ ...prev, productId: "" }));
  }, [form.requestType]);

  useEffect(() => {
    if (!selectedOrder?.productId || selectedOrder.productId === "N/A") return;
    setForm((prev) => ({ ...prev, productId: String(selectedOrder.productId) }));
  }, [selectedOrder]);

  const selectedRequest = useMemo(
    () => requests.find((request) => request.id === adminSelectedId) || requests[0] || null,
    [adminSelectedId, requests]
  );

  const activeOrderRequest = useMemo(
    () =>
      requests.find(
        (request) =>
          String(request.orderId) === String(selectedOrderId) &&
          !["Rejected"].includes(request.status)
      ),
    [requests, selectedOrderId]
  );

  const eligibility = useMemo(() => {
    if (!selectedOrder) {
      return { ok: false, checks: [] };
    }

    const status = String(selectedOrder.status || "").toUpperCase();
    const delivered = ["DELIVERED", "COMPLETED"].includes(status);
    const returned = status === "REFUNDED" || Boolean(activeOrderRequest);
    const isReturnable = selectedOrder.returnable !== false && selectedOrder.returnable !== "false";
    const baseDate = selectedOrder.createdAt ? new Date(selectedOrder.createdAt) : new Date();
    const ageDays = Number.isNaN(baseDate.getTime())
      ? 0
      : Math.floor((Date.now() - baseDate.getTime()) / 86400000);
    const inReturnPeriod = ageDays <= RETURN_DAYS;

    const checks = [
      { label: `${RETURN_DAYS}-day return period`, passed: inReturnPeriod },
      { label: "Order status delivered or completed", passed: delivered },
      { label: "Product is returnable", passed: isReturnable },
      { label: "Not already returned/refunded", passed: !returned }
    ];

    return {
      ok: checks.every((check) => check.passed),
      checks,
      ageDays
    };
  }, [activeOrderRequest, selectedOrder]);

  const addNotification = (title, channels = form) => {
    const selectedChannels = [
      channels.notifyEmail ? "Email" : "",
      channels.notifySms ? "SMS" : "",
      channels.notifyInApp ? "In-app" : ""
    ].filter(Boolean);
    setNotifications((prev) => [
      {
        id: `${Date.now()}-${prev.length}`,
        title,
        channels: selectedChannels.join(", ") || "In-app",
        time: new Date().toLocaleString()
      },
      ...prev
    ].slice(0, 6));
  };

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      setError("");
      // There is no GET /sales/orders list endpoint (that path 404s). Returns apply
      // to delivered orders, so pull both online and walk-in sales (dates optional on
      // these report endpoints) and combine them for the two request-type dropdowns.
      const [onlinePayload, walkInPayload] = await Promise.all([
        apiRequest("/sales/reports/all/online?size=500", "GET").catch(() => null),
        apiRequest("/sales/reports/all/walk-in?size=500", "GET").catch(() => null),
      ]);
      const combined = [
        ...toArray(onlinePayload).map((order) => normalizeOrder(order, "online")),
        ...toArray(walkInPayload).map((order) => normalizeOrder(order, "walkin")),
      ];
      // De-duplicate by order id in case an order appears in both lists.
      const seen = new Set();
      const merged = combined
        .filter((order) => {
          if (!order.id) return false;
          const key = String(order.id);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      setOrders(merged);
    } catch (err) {
      setError(err?.message || "Failed to load orders for return.");
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const visibleOrders = useMemo(
    () => orders.filter((order) => order.requestType === form.requestType),
    [form.requestType, orders]
  );

  useEffect(() => {
    if (!loadingOrders && !selectedOrderId && visibleOrders.length > 0) {
      setReferenceDropdownOpen(true);
    }
  }, [loadingOrders, selectedOrderId, visibleOrders.length]);

  const handleOrderSelect = (orderId) => {
    const nextOrder = orders.find((order) => String(order.id) === String(orderId)) || null;

    setSelectedOrderId(orderId);
    setSelectedOrder(nextOrder);
    setReferenceDropdownOpen(false);
    setForm((prev) => ({
      ...prev,
      productId: nextOrder?.productId && nextOrder.productId !== "N/A" ? String(nextOrder.productId) : "",
    }));
  };

  const handleProofUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        proofName: file.name,
        proofPreview: String(reader.result || "")
      }));
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setSelectedOrderId("");
    setForm({
      requestType: form.requestType,
      productId: "",
      reason: "",
      description: "",
      returnMethod: RETURN_METHODS[0],
      refundMethod: REFUND_METHODS[0],
      proofName: "",
      proofPreview: "",
      notifyEmail: true,
      notifySms: true,
      notifyInApp: true
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!selectedOrder) {
      setError("Please select an order first.");
      return;
    }
    if (!form.productId.trim()) {
      setError("Please enter the product ID.");
      return;
    }
    if (!eligibility.ok) {
      setError("This order is not eligible for return.");
      return;
    }
    if (!form.reason || !form.description.trim()) {
      setError("Please select a reason and describe the issue.");
      return;
    }

    setSaving(true);
    const request = {
      id: `RET-${Date.now()}`,
      requestType: form.requestType,
      orderId: selectedOrder.id,
      referenceNo: selectedOrder.referenceNo,
      customerName: selectedOrder.customerName,
      accountNumber: selectedOrder.accountNumber,
      productId: form.productId.trim(),
      productName: selectedOrder.productName,
      productCategory: selectedOrder.productCategory,
      amount: selectedOrder.totalAmount,
      deliveryAddress: selectedOrder.deliveryAddress,
      reason: form.reason,
      description: form.description.trim(),
      proofName: form.proofName,
      proofPreview: form.proofPreview,
      returnMethod: form.returnMethod,
      refundMethod: form.refundMethod,
      status: "Pending",
      adminComment: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notifications: {
        email: form.notifyEmail,
        sms: form.notifySms,
        inApp: form.notifyInApp
      }
    };

    try {
      await createApprovalRequest({
        approvalType: APPROVAL_TYPES.return,
        entityId: selectedOrder.id,
        requestedBy: user?.id || user?.userId || 0,
        requestData: {
          returnData: request,
        },
        comments: form.description.trim(),
      });

      // Persist the return record itself (system of record), alongside the approval request.
      const isExchange = toBackendRefundMethod(form.refundMethod) === "RECEIVE_OTHER_PRODUCT";
      const created = await createReturnRequest({
        salesOrderId: Number(selectedOrder.id),
        reason: [form.reason, form.description.trim()].filter(Boolean).join(" - "),
        returnMethod: toBackendReturnMethod(form.returnMethod),
        refundMethod: toBackendRefundMethod(form.refundMethod),
        replacementProductId: isExchange && form.productId ? Number(form.productId) : null,
        replacementProductName: isExchange ? selectedOrder.productName : null,
      });

      await loadReturns();
      if (created?.id) setAdminSelectedId(created.id);
      addNotification("Return request received", form);
      setMessage("Return request submitted for admin approval.");
      resetForm();
    } catch (submitError) {
      setError(submitError?.message || "Unable to submit return for admin approval.");
    } finally {
      setSaving(false);
    }
  };

  const updateRequestStatus = async (status) => {
    if (!selectedRequest) return;

    const notificationTitle =
      status === "Approved"
        ? "Return request approved"
        : status === "Refunded"
          ? "Refund sent"
          : `Return status updated to ${status}`;

    try {
      await updateReturnStatus(selectedRequest.id, {
        status,
        adminNotes: adminComment.trim() || selectedRequest.adminComment,
        reviewedBy: user?.id || user?.userId,
      });
      await loadReturns();
      addNotification(notificationTitle, selectedRequest.notifications || {});
      setMessage(`${selectedRequest.referenceNo} updated to ${status}.`);
    } catch (statusError) {
      setError(statusError?.message || "Unable to update return status.");
    }
  };

  const statusClass = (status) => `return-status return-status-${String(status || "Pending").toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="return-order">
      <header className="return-order-header">
        <div className="return-order-logo-wrap">
          <img src={pmLogo} alt="PM Logo" className="return-order-logo" />
        </div>
        <div>
          <h1>Return Item</h1>
          <div style={{ display: "flex", justifyContent: "center", margin: "0.4rem 0" }}>
            <BranchBadge />
          </div>
          <p>Request, approve, track, and complete order returns.</p>
        </div>
        <div className="return-order-header-actions">
          <Dashboard />
          <IoGridOutline className="return-order-grid-icon" />
          <button type="button" className="return-order-close" onClick={toggleReturnOrderModal} aria-label="Close">
            <FaTimes />
          </button>
        </div>
      </header>

      {error && <div className="return-alert return-alert-error">{error}</div>}
      {message && <div className="return-alert return-alert-success">{message}</div>}

      <div className="return-order-layout">
        <form className="return-panel" onSubmit={handleSubmit}>
          <div className="return-panel-heading">
            <h2>{form.requestType === "online" ? "Online Return Request" : "Walk-in Return Request"}</h2>
            <span>Customer dashboard / order details</span>
          </div>

          <div className="return-type-switch" role="group" aria-label="Return request type">
            {REQUEST_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                className={form.requestType === type.value ? "active" : ""}
                onClick={() => handleFieldChange("requestType", type.value)}
                disabled={saving}
              >
                {type.label}
              </button>
            ))}
          </div>

          <label className="return-field">
            <span>{form.requestType === "online" ? "Select Returned Reference" : "Order Reference"}</span>
            <div className="return-reference-dropdown">
              <button
                type="button"
                className="return-reference-trigger"
                onClick={() => {
                  if (!loadingOrders && !saving) {
                    setReferenceDropdownOpen((prev) => !prev);
                  }
                }}
                disabled={loadingOrders || saving}
              >
                <span>
                  {selectedOrder
                    ? `${selectedOrder.referenceNo} - ${selectedOrder.customerName}`
                    : loadingOrders
                      ? "Loading references..."
                      : form.requestType === "online" ? "Select returned reference" : "Select order reference"}
                </span>
                <strong>{referenceDropdownOpen ? "▲" : "▼"}</strong>
              </button>
              {referenceDropdownOpen ? (
                <div className="return-reference-menu">
                  {visibleOrders.length === 0 ? (
                    <div className="return-reference-empty">No returnable references found</div>
                  ) : (
                    visibleOrders.map((order) => (
                      <button
                        type="button"
                        key={order.id}
                        className={String(selectedOrderId) === String(order.id) ? "active" : ""}
                        onClick={() => handleOrderSelect(order.id)}
                      >
                        <strong>{order.referenceNo}</strong>
                        <span>{order.customerName}</span>
                        <small>{order.productName}</small>
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          </label>

          <label className="return-field">
            <span>Product ID</span>
            <input
              type="text"
              value={form.productId}
              placeholder="Select a reference to auto-fill product ID"
              readOnly
              className="return-readonly-input"
            />
          </label>

          {loadingOrders && <div className="return-loading">Loading orders...</div>}

          {selectedOrder && (
            <div className="return-order-summary">
              <div>
                <span>Product ID</span>
                <strong>{form.productId || selectedOrder.productId}</strong>
              </div>
              <div>
                <span>Product Name</span>
                <strong>{selectedOrder.productName}</strong>
              </div>
              <div>
                <span>Category</span>
                <strong>{selectedOrder.productCategory}</strong>
              </div>
              <div>
                <span>Amount</span>
                <strong>{formatCurrency(selectedOrder.totalAmount)}</strong>
              </div>
              <div className="return-summary-wide">
                <span>Delivery Address</span>
                <strong>{selectedOrder.deliveryAddress}</strong>
              </div>
            </div>
          )}

          {selectedOrder && (
            <section className="return-eligibility">
              <h3>Eligibility Check</h3>
              <div className="return-check-grid">
                {eligibility.checks.map((check) => (
                  <div key={check.label} className={check.passed ? "return-check-pass" : "return-check-fail"}>
                    <span>{check.passed ? "Pass" : "Fail"}</span>
                    <p>{check.label}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="return-form-grid">
            <label className="return-field">
              <span>Return Reason</span>
              <select value={form.reason} onChange={(event) => handleFieldChange("reason", event.target.value)} disabled={!selectedOrder || saving}>
                <option value="">Select reason</option>
                {REASONS.map((reason) => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            </label>

            <label className="return-field">
              <span>Return Method</span>
              <select value={form.returnMethod} onChange={(event) => handleFieldChange("returnMethod", event.target.value)} disabled={!selectedOrder || saving}>
                {RETURN_METHODS.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </label>

            <label className="return-field">
              <span>Refund Method</span>
              <select value={form.refundMethod} onChange={(event) => handleFieldChange("refundMethod", event.target.value)} disabled={!selectedOrder || saving}>
                {REFUND_METHODS.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </label>

            <label className="return-field return-file-field">
              <span>Image Upload</span>
              <input type="file" accept="image/*" onChange={handleProofUpload} disabled={!selectedOrder || saving} />
            </label>
          </div>

          {form.proofPreview && (
            <div className="return-proof-preview">
              <img src={form.proofPreview} alt={form.proofName || "Return proof"} />
              <span>{form.proofName}</span>
            </div>
          )}

          <label className="return-field">
            <span>Description</span>
            <textarea
              value={form.description}
              onChange={(event) => handleFieldChange("description", event.target.value)}
              placeholder="Explain the issue with the order."
              disabled={!selectedOrder || saving}
            />
          </label>

          <div className="return-notification-options">
            <label>
              <input type="checkbox" checked={form.notifyEmail} onChange={(event) => handleFieldChange("notifyEmail", event.target.checked)} />
              Email
            </label>
            <label>
              <input type="checkbox" checked={form.notifySms} onChange={(event) => handleFieldChange("notifySms", event.target.checked)} />
              SMS
            </label>
            <label>
              <input type="checkbox" checked={form.notifyInApp} onChange={(event) => handleFieldChange("notifyInApp", event.target.checked)} />
              In-app
            </label>
          </div>

          <div className="return-actions">
            <button type="button" className="return-secondary-btn" onClick={toggleReturnOrderModal}>Close</button>
            <button type="submit" className="return-primary-btn" disabled={saving || !eligibility.ok || !form.productId.trim() || !form.reason || !form.description.trim()}>
              {saving ? "Saving..." : "Return Item"}
            </button>
          </div>
        </form>

        <aside className="return-side">
          <section className="return-panel return-tracking">
            <div className="return-panel-heading">
              <h2>Return Status Tracking</h2>
              <span>{requests.length} request{requests.length === 1 ? "" : "s"}</span>
            </div>
            <div className="return-request-list">
              {requests.length === 0 ? (
                <div className="return-empty">No return requests yet.</div>
              ) : (
                requests.map((request) => (
                  <button
                    type="button"
                    key={request.id}
                    className={selectedRequest?.id === request.id ? "return-request-row active" : "return-request-row"}
                    onClick={() => {
                      setAdminSelectedId(request.id);
                      setAdminComment(request.adminComment || "");
                    }}
                  >
                    <span>
                      <strong>{request.referenceNo}</strong>
                      <small>{request.customerName} - {request.productName}</small>
                    </span>
                    <em className={statusClass(request.status)}>{request.status}</em>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="return-panel return-admin">
            <div className="return-panel-heading">
              <h2>Admin Approval</h2>
              <span>Approve, reject, pickup, refund</span>
            </div>

            {selectedRequest ? (
              <>
                <div className="return-admin-detail">
                  <div>
                    <span>Request Type</span>
                    <strong>{selectedRequest.requestType === "walkin" ? "Walk-in Return Request" : "Online Return Request"}</strong>
                  </div>
                  <div>
                    <span>Product ID</span>
                    <strong>{selectedRequest.productId}</strong>
                  </div>
                  <div>
                    <span>Reference No</span>
                    <strong>{selectedRequest.referenceNo}</strong>
                  </div>
                  <div>
                    <span>Reason</span>
                    <strong>{selectedRequest.reason}</strong>
                  </div>
                  <div>
                    <span>Return Method</span>
                    <strong>{selectedRequest.returnMethod}</strong>
                  </div>
                  <div>
                    <span>Refund Method</span>
                    <strong>{selectedRequest.refundMethod}</strong>
                  </div>
                </div>

                {selectedRequest.proofPreview && (
                  <a className="return-proof-link" href={selectedRequest.proofPreview} target="_blank" rel="noreferrer">
                    View uploaded image
                  </a>
                )}

                <label className="return-field">
                  <span>Admin Comment</span>
                  <textarea value={adminComment} onChange={(event) => setAdminComment(event.target.value)} placeholder="Add approval or rejection comment." />
                </label>

                <div className="return-status-buttons">
                  {STATUS_FLOW.map((status) => (
                    <button key={status} type="button" onClick={() => updateRequestStatus(status)}>
                      {status === "Refunded" ? "Process Refund" : status}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="return-empty">Select a return request to review.</div>
            )}
          </section>

          <section className="return-panel return-notifications">
            <div className="return-panel-heading">
              <h2>Notifications</h2>
              <span>Email / SMS / in-app</span>
            </div>
            {notifications.length === 0 ? (
              <div className="return-empty">No notification activity yet.</div>
            ) : (
              notifications.map((notice) => (
                <div className="return-notice" key={notice.id}>
                  <strong>{notice.title}</strong>
                  <span>{notice.channels}</span>
                  <small>{notice.time}</small>
                </div>
              ))
            )}
          </section>
        </aside>
      </div>
    </div>
  );
};

export default ReturnOrder;
