import React, { useState, useEffect } from "react";
import AdminNav from "../../Navigation/AdminNav";
import { apiRequest } from "../../../../lib/config";
import { useAuth } from "../../../../context/AuthContext";
import "./CancellationApproval.css";

const CancellationApproval = () => {
  const { user } = useAuth();
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");
      const response = await apiRequest("/sales/orders/pending-cancellation-approvals?size=500", "GET");
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
      setPendingApprovals(ordersList);
    } catch (err) {
      setError(err?.message || "Unable to load pending cancellation requests. Please try again later.");
      setPendingApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (orderId) => {
    if (!orderId) return;
    try {
      setActionLoading(`approve-${orderId}`);
      setError("");
      setSuccessMessage("");
      const approvedBy = user?.id || user?.userId || 0;
      await apiRequest(`/sales/orders/${orderId}/cancellation/approve`, "PUT", {
        comment: `Cancellation approved by admin ${approvedBy}`,
      });
      setSuccessMessage("Cancellation approved. The customer's wallet has been refunded where applicable.");
      setTimeout(() => {
        fetchPendingApprovals();
        setSuccessMessage("");
      }, 1500);
    } catch (err) {
      setError(err?.message || "Unable to approve this cancellation. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (orderId) => {
    if (!orderId) return;
    const rejectReason = window.prompt("Please provide a reason for rejecting this cancellation request:");
    if (!rejectReason || rejectReason.trim() === "") {
      setError("A reason is required to reject a cancellation request");
      setTimeout(() => setError(""), 3000);
      return;
    }
    try {
      setActionLoading(`reject-${orderId}`);
      setError("");
      setSuccessMessage("");
      await apiRequest(`/sales/orders/${orderId}/cancellation/reject`, "PUT", {
        comment: rejectReason.trim(),
      });
      setSuccessMessage("Cancellation rejected. The order has been restored.");
      setTimeout(() => {
        fetchPendingApprovals();
        setSuccessMessage("");
      }, 1500);
    } catch (err) {
      setError(err?.message || "Unable to reject this cancellation. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="admin-container">
      <AdminNav />
      <div className="tb-cont">
        {error && (
          <div
            style={{
              padding: "15px 20px",
              marginBottom: "20px",
              backgroundColor: "#fee",
              color: "#c33",
              borderRadius: "5px",
              border: "1px solid #fcc",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}
        {successMessage && (
          <div
            style={{
              padding: "15px 20px",
              marginBottom: "20px",
              backgroundColor: "#efe",
              color: "#3c3",
              borderRadius: "5px",
              border: "1px solid #cfc",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            <strong>Success:</strong> {successMessage}
          </div>
        )}
        <h3>Order Cancellation Approvals</h3>
        <p style={{ color: "#6c757d", marginTop: "-10px" }}>
          Cancellation requests sales has forwarded for a final decision. Approving refunds the
          customer's wallet with whatever they have already paid.
        </p>
        {loading ? (
          <p>Loading pending cancellation requests...</p>
        ) : pendingApprovals.length === 0 ? (
          <p>No cancellation requests awaiting admin approval.</p>
        ) : (
          <table className="approval-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Reference No</th>
                <th>Customer Name</th>
                <th>Account Number</th>
                <th>Total Amount</th>
                <th>Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingApprovals.map((order) => (
                <tr key={order.id}>
                  <td>{order.customerType || "—"}</td>
                  <td>{order.referenceNo || order.salesReference || "—"}</td>
                  <td>{order.customerName || "—"}</td>
                  <td>{order.accountNumber || "—"}</td>
                  <td>₦{Number(order.totalAmount || 0).toLocaleString()}</td>
                  <td>{order.cancellationReason || "—"}</td>
                  <td>
                    <button
                      onClick={() => handleApprove(order.id)}
                      disabled={actionLoading === `approve-${order.id}` || actionLoading}
                      style={{
                        padding: "6px 12px",
                        marginRight: "8px",
                        backgroundColor: "#4CAF50",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        opacity: actionLoading === `approve-${order.id}` ? 0.6 : 1,
                      }}
                    >
                      {actionLoading === `approve-${order.id}` ? "Approving..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleReject(order.id)}
                      disabled={actionLoading === `reject-${order.id}` || actionLoading}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#f44336",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        opacity: actionLoading === `reject-${order.id}` ? 0.6 : 1,
                      }}
                    >
                      {actionLoading === `reject-${order.id}` ? "Rejecting..." : "Reject"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CancellationApproval;
