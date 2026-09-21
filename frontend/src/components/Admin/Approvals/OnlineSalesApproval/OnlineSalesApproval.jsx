import React, { useState, useEffect } from "react";
import AdminNav from "../../Navigation/AdminNav";
import { apiRequest } from "../../../../lib/config";
import { useAuth } from "../../../../context/AuthContext";
import { normalizePendingResponse } from "../shared/approvalUtils";
import "./OnlineSalesApproval.css";

const OnlineSalesApproval = () => {
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
      // Fetch approved-but-not-delivered online orders
      const response = await apiRequest("/sales/reports/all/online?size=500&status=APPROVED", "GET");
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
      setPendingApprovals(
        ordersList.filter(
          (o) =>
            o.status === "APPROVED" &&
            !["DELIVERED", "CANCELLED", "REFUNDED", "FAILED"].includes(
              String(o.status || "").toUpperCase()
            )
        )
      );
    } catch (err) {
      setError(err?.message || "Unable to load pending online sales. Please try again later.");
      setPendingApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (orderId) => {
    if (!orderId) {
      setError("Please select an order to approve");
      return;
    }
    try {
      setActionLoading(`approve-${orderId}`);
      setError("");
      setSuccessMessage("");
      const approvedBy = user?.id || user?.userId || 0;
      await apiRequest(`/sales/orders/${orderId}/approve`, "PUT", {
        comment: `Approved by admin ${approvedBy}`,
      });
      setSuccessMessage("Online sale approved successfully!");
      setTimeout(() => {
        fetchPendingApprovals();
        setSuccessMessage("");
      }, 1500);
    } catch (err) {
      setError(err?.message || "Unable to approve online sale. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (orderId) => {
    if (!orderId) {
      setError("Please select an order to reject");
      return;
    }
    const rejectReason = window.prompt("Please provide a reason for rejecting this online sale:");
    if (!rejectReason || rejectReason.trim() === "") {
      setError("Reject reason is required");
      setTimeout(() => setError(""), 3000);
      return;
    }
    try {
      setActionLoading(`reject-${orderId}`);
      setError("");
      setSuccessMessage("");
      const approvedBy = user?.id || user?.userId || 0;
      await apiRequest(`/sales/orders/${orderId}/reject`, "PUT", {
        comment: rejectReason.trim(),
      });
      setSuccessMessage("Online sale rejected successfully!");
      setTimeout(() => {
        fetchPendingApprovals();
        setSuccessMessage("");
      }, 1500);
    } catch (err) {
      setError(err?.message || "Unable to reject online sale. Please try again.");
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
        <h3>Online Sales Approvals</h3>
        {loading ? (
          <p>Loading pending online sales...</p>
        ) : pendingApprovals.length === 0 ? (
          <p>No pending online sales to approve.</p>
        ) : (
          <table className="approval-table">
            <thead>
              <tr>
                <th>Reference No</th>
                <th>Customer Name</th>
                <th>Account Number</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingApprovals.map((order) => (
                <tr key={order.id}>
                  <td>{order.referenceNo || order.salesReference || "—"}</td>
                  <td>{order.customerName || "—"}</td>
                  <td>{order.accountNumber || "—"}</td>
                  <td>₦{Number(order.totalAmount || 0).toLocaleString()}</td>
                  <td>{order.status || "APPROVED"}</td>
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

export default OnlineSalesApproval;
