import React, { useEffect, useState } from "react";
import { apiRequest } from "../../../../../lib/config";
import { useAuth } from "../../../../../context/AuthContext";

// Online Customers tab of the "Cancel Order" screen: lists orders an online customer has
// actually asked to cancel from the mobile app (status CANCELLATION_REQUESTED). Sales can
// only forward these to admin or reject them - never cancel outright.
const OnlineCancellationPanel = ({ toggleCancelModal, initialOrderId, initialOrder, isPreselectedFlow }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setFetchLoading(true);
      setError("");
      const response = await apiRequest("/sales/orders/cancellation-requests?size=500", "GET");

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

      setOrders(
        isPreselectedFlow
          ? ordersList.filter((o) => String(o.id) === String(initialOrderId))
          : ordersList
      );
    } catch (err) {
      setError(err?.message || "Unable to load cancellation requests. Please try again later.");
      setOrders([]);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleForward = async (orderId) => {
    setActionLoading(`forward-${orderId}`);
    setError("");
    setSuccess("");
    try {
      const forwardedBy = user?.id || user?.userId || 0;
      await apiRequest(`/sales/orders/${orderId}/cancellation/forward`, "PUT", {
        comment: `Forwarded to admin by sales user ${forwardedBy}`,
      });
      setSuccess("Cancellation request forwarded to admin for approval.");
      setTimeout(() => {
        setSuccess("");
        fetchOrders();
      }, 1500);
    } catch (err) {
      setError(err?.message || "Unable to forward this cancellation request. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (orderId) => {
    const reason = window.prompt("Please provide a reason for rejecting this cancellation request:");
    if (!reason || reason.trim() === "") {
      setError("A reason is required to reject a cancellation request");
      setTimeout(() => setError(""), 3000);
      return;
    }
    setActionLoading(`reject-${orderId}`);
    setError("");
    setSuccess("");
    try {
      await apiRequest(`/sales/orders/${orderId}/cancellation/reject`, "PUT", {
        comment: reason.trim(),
      });
      setSuccess("Cancellation request rejected. The order has been restored.");
      setTimeout(() => {
        setSuccess("");
        fetchOrders();
      }, 1500);
    } catch (err) {
      setError(err?.message || "Unable to reject this cancellation request. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);

  return (
    <div>
      {error && <div className="cancel-panel-alert cancel-panel-alert-error">{error}</div>}
      {success && <div className="cancel-panel-alert cancel-panel-alert-success">{success}</div>}

      {fetchLoading ? (
        <p>Loading cancellation requests...</p>
      ) : orders.length === 0 ? (
        <p>
          {isPreselectedFlow
            ? "This order has no pending cancellation request from the customer."
            : "No online customers have requested a cancellation."}
        </p>
      ) : (
        <table className="approval-table">
          <thead>
            <tr>
              <th>Reference No</th>
              <th>Customer Name</th>
              <th>Account Number</th>
              <th>Total Amount</th>
              <th>Reason</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.referenceNo || "—"}</td>
                <td>{order.customerName || "—"}</td>
                <td>{order.accountNumber || "—"}</td>
                <td>{formatCurrency(order.totalAmount)}</td>
                <td>{order.cancellationReason || "—"}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => handleReject(order.id)}
                    disabled={Boolean(actionLoading)}
                    className="cancel-panel-btn cancel-panel-btn-danger"
                  >
                    {actionLoading === `reject-${order.id}` ? "Rejecting..." : "Reject"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleForward(order.id)}
                    disabled={Boolean(actionLoading)}
                    className="cancel-panel-btn cancel-panel-btn-success"
                  >
                    {actionLoading === `forward-${order.id}` ? "Forwarding..." : "Forward to Admin"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default OnlineCancellationPanel;
