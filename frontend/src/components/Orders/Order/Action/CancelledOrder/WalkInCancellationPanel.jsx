import React, { useEffect, useState } from "react";
import { apiRequest } from "../../../../../lib/config";

// Walk-in Customers tab of the "Cancel Order" screen: walk-in customers have no mobile app to
// request a cancellation through themselves, so sales picks an eligible order directly and
// raises the request. It still goes to admin for approval/rejection - it does not cancel the
// order outright.
const WalkInCancellationPanel = ({ toggleCancelModal, initialOrderId, initialOrder }) => {
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(initialOrderId ? String(initialOrderId) : "");
  const [selectedOrder, setSelectedOrder] = useState(initialOrder);
  const [reason, setReason] = useState("");
  const isPreselectedFlow = Boolean(initialOrderId);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setFetchLoading(true);
      setError("");
      const response = await apiRequest("/sales/orders/walk-in-cancellable?size=500", "GET");

      let ordersList = [];
      if (response?.response?.content && Array.isArray(response.response.content)) {
        ordersList = response.response.content;
      } else if (Array.isArray(response)) {
        ordersList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        ordersList = response.data;
      } else if (response?.response && Array.isArray(response.response)) {
        ordersList = response.response;
      }

      setOrders(ordersList);

      if (isPreselectedFlow) {
        const found = ordersList.find((o) => String(o.id) === String(initialOrderId));
        if (found) setSelectedOrder(found);
      } else if (ordersList.length === 0) {
        setError("No walk-in orders eligible for cancellation found");
      }
    } catch (err) {
      setError("Failed to load orders. Please refresh the page.");
    } finally {
      setFetchLoading(false);
    }
  };

  const handleOrderSelect = (e) => {
    const orderId = e.target.value;
    setSelectedOrderId(orderId);
    setSelectedOrder(orders.find((o) => String(o.id) === String(orderId)) || null);
    setReason("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedOrderId) {
      setError("Please select an order first");
      setTimeout(() => setError(""), 3000);
      return;
    }
    if (!reason.trim()) {
      setError("Please enter a reason for cancellation");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest(`/sales/orders/${selectedOrderId}/cancellation/walk-in`, "POST", {
        reason: reason.trim(),
      });

      setSuccess(`Cancellation request for order #${selectedOrderId} sent to admin for approval.`);
      setOrders((prev) => prev.filter((o) => String(o.id) !== String(selectedOrderId)));

      setTimeout(() => {
        setSelectedOrderId(isPreselectedFlow ? selectedOrderId : "");
        setSelectedOrder(null);
        setReason("");
        setSuccess("");
      }, 1800);
    } catch (err) {
      let errorMessage = "Failed to request cancellation. ";
      if (err.message?.includes("404")) {
        errorMessage = "Order not found. Please try again.";
      } else if (err.message?.includes("400")) {
        errorMessage = "Invalid request. Please check the cancellation reason.";
      } else {
        errorMessage += err.message || "Please try again.";
      }
      setError(errorMessage);
      setTimeout(() => setError(""), 4000);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-GB");
    } catch {
      return "N/A";
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="cancel-panel-alert cancel-panel-alert-error">{error}</div>}
      {success && <div className="cancel-panel-alert cancel-panel-alert-success">{success}</div>}

      <div className="cancel-panel-field">
        <label className="cancel-panel-label">
          {isPreselectedFlow ? "Selected Order" : "Select Walk-in Order to Cancel"}
        </label>
        {isPreselectedFlow ? (
          <div className="cancel-panel-readonly">
            {(selectedOrder?.customerName || initialOrder?.customerName || "Customer")} -{" "}
            {(selectedOrder?.referenceNo || initialOrder?.referenceNo || selectedOrderId || "N/A")}
          </div>
        ) : (
          <select
            value={selectedOrderId}
            onChange={handleOrderSelect}
            className="cancel-panel-select"
            disabled={loading || fetchLoading}
          >
            <option value="">-- Choose a walk-in order --</option>
            {orders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.customerName} - {formatCurrency(order.totalAmount)} - {order.referenceNo}
              </option>
            ))}
          </select>
        )}
        <small className="cancel-panel-hint">
          {isPreselectedFlow
            ? "Selected from payment screen."
            : `Showing walk-in orders eligible for cancellation. Total: ${orders.length}`}
        </small>
      </div>

      {selectedOrderId && selectedOrder && (
        <div className="cancel-panel-card">
          <h3 className="cancel-panel-card-title">ORDER DETAILS</h3>
          <div className="cancel-panel-grid">
            <div className="cancel-panel-item">
              <span className="cancel-panel-item-label">Customer Name</span>
              <span className="cancel-panel-item-value">{selectedOrder.customerName || "-"}</span>
            </div>
            <div className="cancel-panel-item">
              <span className="cancel-panel-item-label">Account Number</span>
              <span className="cancel-panel-item-value">{selectedOrder.accountNumber || "-"}</span>
            </div>
            <div className="cancel-panel-item">
              <span className="cancel-panel-item-label">Product Reference</span>
              <span className="cancel-panel-item-value">{selectedOrder.referenceNo || "-"}</span>
            </div>
            <div className="cancel-panel-item">
              <span className="cancel-panel-item-label">Product Name</span>
              <span className="cancel-panel-item-value">{selectedOrder.productName || "-"}</span>
            </div>
            <div className="cancel-panel-item">
              <span className="cancel-panel-item-label">Order Date</span>
              <span className="cancel-panel-item-value">{formatDate(selectedOrder.createdAt)}</span>
            </div>
            <div className="cancel-panel-item">
              <span className="cancel-panel-item-label">Total Amount</span>
              <span className="cancel-panel-item-value">{formatCurrency(selectedOrder.totalAmount)}</span>
            </div>
            <div className="cancel-panel-item">
              <span className="cancel-panel-item-label">Payment Progress</span>
              <span className="cancel-panel-item-value">
                {selectedOrder.paymentProgress != null ? `${selectedOrder.paymentProgress}%` : "0%"}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="cancel-panel-field">
        <label className="cancel-panel-label">Cancellation Reason</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="cancel-panel-textarea"
          placeholder="Please provide a reason for cancelling this order..."
          disabled={loading || !selectedOrderId}
          required
        />
      </div>

      <div className="cancel-panel-note">
        This will be sent to admin for approval - it does not cancel the order immediately. Any
        amount already paid is only refunded to the customer's wallet once admin approves.
      </div>

      <div className="cancel-panel-actions">
        <button type="button" onClick={toggleCancelModal} className="cancel-panel-btn cancel-panel-btn-secondary">
          Close
        </button>
        <button
          type="submit"
          disabled={loading || !selectedOrderId || !reason.trim()}
          className="cancel-panel-btn cancel-panel-btn-primary"
        >
          {loading ? "Submitting..." : "Send for Admin Approval"}
        </button>
      </div>
    </form>
  );
};

export default WalkInCancellationPanel;
