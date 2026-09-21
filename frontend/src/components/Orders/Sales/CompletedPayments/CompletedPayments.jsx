import React, { useState, useEffect } from "react";
import BranchBadge from "../../../shared/BranchBadge";
import { API_BASE_URL, apiRequest } from "../../../../lib/config";
import Dashboard from "../../../ui/DashboardBtn";
import { FaTimes } from "react-icons/fa";
import { IoGridOutline } from "react-icons/io5";
import pmLogo from "../../../../assets/images/PMlogo.png";
import "./CompletedPayments.css";

const extractOrdersList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.response?.content)) return payload.response.content;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.response)) return payload.response;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const getOrderId = (order = {}) => order.orderId || order.id;

// Statuses that mean this order has already moved past "just paid" - either it's
// already awaiting/through admin review (APPROVED onward) or it's dead (CANCELLED/
// REFUNDED) - so re-submitting for approval would be pointless or (per
// SalesService.submitOrderForApproval's guard) outright rejected by the backend.
const ALREADY_FORWARDED_STATUSES = [
  "APPROVED",
  "PROCESSING",
  "ASSIGNED_TO_RIDER",
  "SHIPPED",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

const getCustomerTypeLabel = (order = {}) => {
  const raw = (order.customerType || order.customer_type || "").toString().toUpperCase();
  if (raw === "ONLINE") return "ONLINE";
  if (raw === "WALKIN" || raw === "WALK_IN" || raw === "WALK-IN") return "WALK-IN";
  return "UNKNOWN";
};

const customerTypeBadgeClass = (order = {}) => {
  const label = getCustomerTypeLabel(order);
  if (label === "ONLINE") return "online";
  if (label === "WALK-IN") return "walkin";
  return "unknown";
};

const customerTypeBadgeText = (order = {}, compact = false) => {
  const label = getCustomerTypeLabel(order);
  if (label === "ONLINE") return compact ? "🌐 ONLINE" : "🌐 ONLINE CUSTOMER";
  if (label === "WALK-IN") return compact ? "🏬 WALK-IN" : "🏬 WALK-IN CUSTOMER";
  return compact ? "❓ UNKNOWN" : "❓ UNKNOWN CUSTOMER TYPE";
};

const shouldTryApiPrefixedEndpoint = () => API_BASE_URL !== "/api";

const apiRequestWithOptionalApiFallback = async (endpoint, method = "GET", body = null) => {
  try {
    return await apiRequest(endpoint, method, body);
  } catch (error) {
    if (!shouldTryApiPrefixedEndpoint() || endpoint.startsWith("/api/")) {
      throw error;
    }

    return apiRequest(`/api${endpoint}`, method, body);
  }
};

const CompletedPayments = ({ toggleCompletedPaymentsModal }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [completedOrders, setCompletedOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [customerTypeFilter, setCustomerTypeFilter] = useState("ALL");
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalMessage, setApprovalMessage] = useState(null); // { type: "success" | "error", text }

  useEffect(() => {
    fetchCompletedOrders();
  }, []);

  useEffect(() => {
    if (selectedOrderId) {
      fetchPaymentDetails(selectedOrderId);
    } else {
      setPaymentDetails(null);
      setShowPaymentDetails(false);
    }
  }, [selectedOrderId]);

  // Orders that already have a sales reference and have not yet been sent to the admin
  // approval queue - backed by GET /sales/orders/completed-payments
  // (SalesService.getCompletedPayments), which carries referenceNo, totals, totalPaid,
  // customerType and paidAt. Orders still awaiting a reference stay on "Order list as paid"
  // until it's generated; once handleSendForApproval forwards one it drops off this list on
  // the next fetch, which is why ALREADY_FORWARDED_STATUSES above now only has to cover the
  // current session's own optimistic update.
  const fetchCompletedOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const ordersResponse = await apiRequestWithOptionalApiFallback("/sales/orders/completed-payments?size=500", "GET");
      const ordersList = extractOrdersList(ordersResponse);

      // amountPaid is what the customer has actually paid and nothing else - no falling back
      // to totalAmount. The list is keyed on the sales reference existing, not on the order
      // being paid in full, so a row can legitimately be part-paid and showing the order's
      // full value as "paid" would misreport it.
      const orders = ordersList
        .filter((order) => getOrderId(order))
        .map((order) => ({
          ...order,
          amountPaid: order.totalPaid || 0,
        }));

      setCompletedOrders(orders);

      if (orders.length === 0) {
        setError("No completed payments found");
      }
    } catch (err) {
      console.error("CompletedPayments: Error fetching completed orders:", err);
      setError(err?.message || "Failed to load orders. Please refresh the page.");
      setCompletedOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentDetails = async (orderId) => {
    try {
      let response;
      try {
        response = await apiRequest(`/sales/orders/${orderId}/payment-details`, "GET");
      } catch (err) {
        response = await apiRequest(`/api/sales/orders/${orderId}/payment-details`, "GET");
      }

      let paymentData = null;
      if (response?.data) {
        paymentData = response.data;
      } else if (response?.response) {
        paymentData = response.response;
      } else {
        paymentData = response;
      }

      setPaymentDetails(paymentData);
    } catch (err) {
      console.error(`CompletedPayments: Error fetching payment details for ${orderId}:`, err);
    }
  };

  const handleOrderSelect = (e) => {
    const orderId = e.target.value;
    setSelectedOrderId(orderId);
    setApprovalMessage(null);

    const order = completedOrders.find((o) => getOrderId(o)?.toString() === orderId);
    setSelectedOrder(order || null);
  };

  // Forwards the selected fully-paid order to the admin approval queue (moves it to
  // OrderStatus.APPROVED via the same endpoint the online-sales flow uses - see
  // SalesService.submitOrderForApproval). The order was already created and paid when
  // the sale went through; this just asks an admin to sign off on it.
  const handleSendForApproval = async () => {
    if (!selectedOrder) return;
    const orderId = getOrderId(selectedOrder);
    if (!orderId) return;

    try {
      setApprovalLoading(true);
      setApprovalMessage(null);
      await apiRequestWithOptionalApiFallback(
        `/sales/orders/${orderId}/submit-for-approval`,
        "PUT",
        { comment: "Sent for admin approval from Completed Payments" }
      );

      setSelectedOrder((prev) => (prev ? { ...prev, deliveryStatus: "APPROVED" } : prev));
      setCompletedOrders((prev) =>
        prev.map((o) =>
          getOrderId(o)?.toString() === orderId?.toString()
            ? { ...o, deliveryStatus: "APPROVED" }
            : o
        )
      );
      setApprovalMessage({ type: "success", text: "Order sent for admin approval." });
    } catch (err) {
      setApprovalMessage({
        type: "error",
        text: err?.message || "Unable to send this order for approval. Please try again.",
      });
    } finally {
      setApprovalLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-GB");
    } catch {
      return "N/A";
    }
  };

  const getCustomerName = () => selectedOrder?.customerName || "N/A";
  const getProductReference = () => selectedOrder?.referenceNo || getOrderId(selectedOrder || {}) || "N/A";
  const getAccountNumber = () => selectedOrder?.accountNumber || "N/A";
  const getProductName = () => selectedOrder?.productName || "N/A";
  const getTotalAmount = () => selectedOrder?.totalAmount || 0;
  const getPaidAmount = () => selectedOrder?.amountPaid || 0;

  // Stored paymentProgress off the backing order (CompletedPaymentDto.paymentPercentage),
  // falling back to paid/total only if it was never written.
  const getPaymentPercentage = (order = {}) => {
    if (order.paymentPercentage != null) return Number(order.paymentPercentage);
    const total = Number(order.totalAmount) || 0;
    if (!total) return 0;
    return ((Number(order.amountPaid) || 0) / total) * 100;
  };

  const formatPercentage = (value) => `${Math.round(value)}%`;

  const isFullyPaid = (order = {}) => getPaymentPercentage(order) >= 100;

  const getOutstandingBalance = () => {
    const balance = getTotalAmount() - getPaidAmount();
    return balance > 0 ? balance : 0;
  };

  const filteredOrders = completedOrders.filter((order) => {
    if (customerTypeFilter === "ALL") return true;
    const label = getCustomerTypeLabel(order);
    return customerTypeFilter === "ONLINE" ? label === "ONLINE" : label === "WALK-IN";
  });

  return (
    <div className="cmp-pay-modal-content">
      {/* Header */}
      <div className="cmp-pay-header cmp-pay-header-standard">
        <div className="cmp-pay-header-left">
          <img
            src={pmLogo}
            alt="PM Logo"
            className="cmp-pay-logo"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/pm-logo.png";
            }}
          />
        </div>
        <h2>COMPLETED PAYMENTS</h2>
        <div style={{ display: "flex", justifyContent: "center", margin: "0.4rem 0" }}>
          <BranchBadge />
        </div>
        <div className="cmp-pay-header-right">
          <Dashboard />
          <IoGridOutline className="cmp-pay-header-icon" />
          <button className="close-btn" onClick={toggleCompletedPaymentsModal}>
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading completed payments...</p>
        </div>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {!loading && (
        <div className="cmp-pay-body">
          {/* Customer Type Filter */}
          <div className="form-group">
            <label>FILTER BY CUSTOMER TYPE:</label>
            <select
              value={customerTypeFilter}
              onChange={(e) => {
                setCustomerTypeFilter(e.target.value);
                setSelectedOrderId("");
                setSelectedOrder(null);
              }}
              className="order-select"
            >
              <option value="ALL">All Customers</option>
              <option value="ONLINE">Online Customers</option>
              <option value="WALKIN">Walk-in Customers</option>
            </select>
          </div>

          {/* Order Selection Dropdown */}
          <div className="form-group">
            <label>SELECT AN ORDER WITH A SALES REFERENCE:</label>
            <select
              value={selectedOrderId}
              onChange={handleOrderSelect}
              className="order-select"
            >
              <option value="">-- Select an order --</option>
              {filteredOrders.map((order) => {
                const orderId = getOrderId(order);
                const customerName = order.customerName || "Unknown";
                const paidAmount = order.amountPaid || 0;
                const customerTypeLabel = getCustomerTypeLabel(order);

                return (
                  <option key={orderId} value={orderId}>
                    [{customerTypeLabel}] {customerName} - {formatCurrency(paidAmount)} paid ({formatPercentage(getPaymentPercentage(order))}) - Order: {order.referenceNo || orderId}
                  </option>
                );
              })}
            </select>
            <small className="helper-text">
              Showing orders whose sales reference has been generated and that have not yet been
              sent for admin approval. Customers on list: {filteredOrders.length} of {completedOrders.length}
            </small>
          </div>

          {/* Order Details Card */}
          {selectedOrderId && selectedOrder && (
            <div className="order-details-card">
              <div className="order-details-header">
                <div className="order-details-heading">
                  <h3>ORDER DETAILS</h3>
                  <span className={`customer-type-badge ${customerTypeBadgeClass(selectedOrder)}`}>
                    {customerTypeBadgeText(selectedOrder)}
                  </span>
                </div>
                <p>
                  {isFullyPaid(selectedOrder)
                    ? "Payment for this order has been completed in full."
                    : `This order has a sales reference but is only ${formatPercentage(
                        getPaymentPercentage(selectedOrder)
                      )} paid.`}
                </p>
              </div>

              <div className="order-summary-row">
                <div className="order-summary-box">
                  <span className="summary-label">TOTAL</span>
                  <strong>{formatCurrency(getTotalAmount())}</strong>
                </div>
                <div className="order-summary-box order-summary-paid">
                  <span className="summary-label">PAID</span>
                  <strong>{formatCurrency(getPaidAmount())}</strong>
                </div>
                <div className="order-summary-box order-summary-remaining">
                  <span className="summary-label">BALANCE</span>
                  <strong>{formatCurrency(getOutstandingBalance())}</strong>
                </div>
              </div>

              <div className="details-grid">
                <div className="detail-item">
                  <label>CUSTOMER NAME:</label>
                  <p>{getCustomerName()}</p>
                </div>

                <div className="detail-item">
                  <label>CUSTOMER TYPE:</label>
                  <p>
                    <span className={`customer-type-badge small ${customerTypeBadgeClass(selectedOrder)}`}>
                      {customerTypeBadgeText(selectedOrder, true)}
                    </span>
                  </p>
                </div>

                <div className="detail-item">
                  <label>ACCOUNT NUMBER:</label>
                  <p>{getAccountNumber()}</p>
                </div>

                <div className="detail-item">
                  <label>PRODUCT REFERENCE:</label>
                  <p>{getProductReference()}</p>
                </div>

                <div className="detail-item">
                  <label>SALES REFERENCE:</label>
                  <p>{selectedOrder.salesReference || "N/A"}</p>
                </div>

                <div className="detail-item">
                  <label>PRODUCT NAME:</label>
                  <p>{getProductName()}</p>
                </div>

                <div className="detail-item">
                  <label>ORDER TYPE:</label>
                  <p>{selectedOrder.orderType || "N/A"}</p>
                </div>

                <div className="detail-item">
                  <label>DELIVERY STATUS:</label>
                  <p>{selectedOrder.deliveryStatus || "N/A"}</p>
                </div>

                <div className="detail-item">
                  <label>PAID ON:</label>
                  <p>{formatDate(selectedOrder.paidAt)}</p>
                </div>

                <div className="detail-item">
                  <label>TOTAL AMOUNT:</label>
                  <p className="amount">{formatCurrency(getTotalAmount())}</p>
                </div>

                <div className="detail-item">
                  <label>AMOUNT PAID:</label>
                  <p className="amount paid">{formatCurrency(getPaidAmount())}</p>
                </div>

                <div className="detail-item">
                  <label>PAYMENT STATUS:</label>
                  {isFullyPaid(selectedOrder) ? (
                    <p className="status completed">COMPLETED</p>
                  ) : (
                    <p className="status partial">
                      {formatPercentage(getPaymentPercentage(selectedOrder))} PAID
                    </p>
                  )}
                </div>
              </div>

              {/* View Details Button */}
              <button
                className="view-details-btn"
                onClick={() => setShowPaymentDetails(!showPaymentDetails)}
              >
                {showPaymentDetails ? "HIDE PAYMENT DETAILS" : "VIEW PAYMENT DETAILS"}
              </button>

              {/* Payment History */}
              {showPaymentDetails && paymentDetails && (
                <div className="payment-history">
                  <h4>PAYMENT HISTORY</h4>
                  {paymentDetails.payments && paymentDetails.payments.length > 0 ? (
                    <table className="payment-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Amount</th>
                          <th>Payment Method</th>
                          <th>Reference</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentDetails.payments.map((payment, index) => (
                          <tr key={index}>
                            <td>{new Date(payment.date).toLocaleDateString()}</td>
                            <td>{formatCurrency(payment.amount)}</td>
                            <td>{payment.method || "N/A"}</td>
                            <td>{payment.reference || "N/A"}</td>
                            <td>
                              <span className={`status-badge ${payment.status?.toLowerCase()}`}>
                                {payment.status || "COMPLETED"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="no-data">No payment history available</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* No Order Selected Message */}
          {!selectedOrderId && filteredOrders.length > 0 && (
            <div className="info-message">
              <p>Select a customer from the list to view full order payment details.</p>
            </div>
          )}

          {/* No Orders Message */}
          {filteredOrders.length === 0 && !loading && (
            <div className="info-message success">
              <p>
                {completedOrders.length === 0
                  ? "No completed payments found yet."
                  : "No completed payments found for the selected customer type."}
              </p>
            </div>
          )}

          {/* Send-for-approval feedback */}
          {selectedOrderId && approvalMessage && (
            <div className={`alert ${approvalMessage.type === "success" ? "alert-success" : "alert-error"}`}>
              {approvalMessage.text}
            </div>
          )}

          {/* Action Buttons */}
          {selectedOrderId && (
            <div className="action-buttons">
              {ALREADY_FORWARDED_STATUSES.includes(
                (selectedOrder?.deliveryStatus || "").toUpperCase()
              ) ? (
                <span className="approval-sent-badge">
                  {(selectedOrder?.deliveryStatus || "").toUpperCase() === "APPROVED"
                    ? "AWAITING ADMIN APPROVAL"
                    : `STATUS: ${selectedOrder?.deliveryStatus}`}
                </span>
              ) : (
                <button
                  className="btn-send-approval"
                  onClick={handleSendForApproval}
                  disabled={approvalLoading}
                >
                  {approvalLoading ? "SENDING..." : "SEND FOR APPROVAL"}
                </button>
              )}
              <button
                className="btn-mark-paid"
                onClick={toggleCompletedPaymentsModal}
              >
                EXIT
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompletedPayments;
