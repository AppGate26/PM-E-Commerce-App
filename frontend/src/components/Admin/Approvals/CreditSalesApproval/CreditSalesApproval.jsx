import React, { useState, useEffect } from "react";
import AdminNav from "../../Navigation/AdminNav";
import { apiRequest } from "../../../../lib/config";
import { useAuth } from "../../../../context/AuthContext";
import { normalizePendingResponse } from "../shared/approvalUtils";
import "./CreditSalesApproval.css";

const CreditSalesApproval = () => {
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
      const response = await apiRequest("/admin/approvals/credit-sales/pending", "GET");
      let approvalsList = [];
      if (Array.isArray(response)) {
        approvalsList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        approvalsList = response.data;
      } else if (response?.response?.data && Array.isArray(response.response.data)) {
        approvalsList = response.response.data;
      } else if (response?.response && Array.isArray(response.response)) {
        approvalsList = response.response;
      }
      setPendingApprovals(normalizePendingResponse(approvalsList));
    } catch (err) {
      setError(err?.message || "Unable to load pending credit sales. Please try again later.");
      setPendingApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalId) => {
    if (!approvalId) {
      setError("Please select a credit sale to approve");
      return;
    }
    try {
      setActionLoading(`approve-${approvalId}`);
      setError("");
      setSuccessMessage("");
      const approvedBy = user?.id || user?.userId || 0;
      await apiRequest(`/admin/approvals/${approvalId}/approve`, "PATCH", {
        comments: "",
        declineReason: "",
        approvedBy,
      });
      setSuccessMessage("Credit sale approved successfully!");
      setTimeout(() => {
        fetchPendingApprovals();
        setSuccessMessage("");
      }, 1500);
    } catch (err) {
      setError(err?.message || "Unable to approve credit sale. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (approvalId) => {
    if (!approvalId) {
      setError("Please select a credit sale to decline");
      return;
    }
    const declineReason = window.prompt("Please provide a reason for declining this credit sale:");
    if (!declineReason || declineReason.trim() === "") {
      setError("Decline reason is required");
      setTimeout(() => setError(""), 3000);
      return;
    }
    try {
      setActionLoading(`decline-${approvalId}`);
      setError("");
      setSuccessMessage("");
      const approvedBy = user?.id || user?.userId || 0;
      await apiRequest(`/admin/approvals/${approvalId}/decline`, "PATCH", {
        comments: "",
        declineReason: declineReason.trim(),
        approvedBy,
      });
      setSuccessMessage("Credit sale declined successfully!");
      setTimeout(() => {
        fetchPendingApprovals();
        setSuccessMessage("");
      }, 1500);
    } catch (err) {
      setError(err?.message || "Unable to decline credit sale. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="admin-container">
      <AdminNav />
      <div className="tb-cont">
        {error && (
          <div style={{
            padding: "15px 20px",
            marginBottom: "20px",
            backgroundColor: "#fee",
            color: "#c33",
            borderRadius: "5px",
            border: "1px solid #fcc",
            fontSize: "14px",
            fontWeight: "500"
          }}>
            <strong>Error:</strong> {error}
            <button
              onClick={() => setError("")}
              style={{
                float: "right",
                background: "none",
                border: "none",
                color: "#c33",
                cursor: "pointer",
                fontSize: "18px",
                fontWeight: "bold",
                padding: "0 5px"
              }}
            >
              ×
            </button>
          </div>
        )}

        {successMessage && (
          <div style={{
            padding: "15px 20px",
            marginBottom: "20px",
            backgroundColor: "#efe",
            color: "#3c3",
            borderRadius: "5px",
            border: "1px solid #cfc",
            fontSize: "14px",
            fontWeight: "500"
          }}>
            <strong>Success:</strong> {successMessage}
          </div>
        )}

        {loading && (
          <div style={{ padding: "20px", textAlign: "center", color: "#666", fontSize: "14px" }}>
            Loading pending credit sales...
          </div>
        )}

        <table className="tb">
          <tr className="tr-head" style={{ gap: "10px", fontSize: "0.8rem" }}>
            <th>S/N</th>
            <th>CUSTOMER NAME</th>
            <th>PRODUCT</th>
            <th>AMOUNT</th>
            <th>REF NO</th>
            <th>LOAN TYPE</th>
            <th>DURATION</th>
            <th>RATE (%)</th>
            <th>ACCOUNT NO</th>
            <th>DATE</th>
            <th>APPROVE</th>
            <th>DECLINE</th>
          </tr>

          {pendingApprovals.length === 0 ? (
            <>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className={i % 2 === 0 ? "tr-body" : "tr-body1"}>
                  {Array(12).fill(null).map((_, j) => <td key={j}></td>)}
                </tr>
              ))}
            </>
          ) : (
            pendingApprovals.map((approval, index) => {
              const rd = approval?.requestDataParsed || approval?.data || {};
              const customer = rd?.customerInfo || rd?.customer || {};
              const product = rd?.productInfo || rd?.product || {};
              const loan = rd?.loanInfo || rd?.loan || {};
              const approvalId = approval?.id || approval?.approvalId;

              const customerName =
                customer?.customerName ||
                `${customer?.firstName || ""} ${customer?.surname || ""}`.trim() ||
                rd?.customerName || "";
              const productName = product?.productName || rd?.productName || "";
              const amount =
                loan?.productAmount || product?.unitPrice || rd?.totalAmount || rd?.amount || "";
              const refNo = product?.referenceNo || rd?.referenceNo || rd?.refNo || "";
              const loanType = loan?.loanType || rd?.loanType || "";
              const duration = loan?.duration || rd?.duration || "";
              const rate = loan?.rate || rd?.rate || "";
              const accountNo =
                customer?.accountNumber || customer?.customerBankAccount || rd?.accountNumber || "";
              const txDate =
                loan?.startDate || rd?.transactionDate || rd?.createdAt || approval?.createdAt || "";

              return (
                <tr
                  key={approvalId || index}
                  className={index % 2 === 0 ? "tr-body" : "tr-body1"}
                >
                  <td>{index + 1}</td>
                  <td>{customerName}</td>
                  <td>{productName}</td>
                  <td>{amount}</td>
                  <td>{refNo}</td>
                  <td>{loanType}</td>
                  <td>{duration}</td>
                  <td>{rate}</td>
                  <td>{accountNo}</td>
                  <td>{txDate}</td>
                  <td>
                    <button
                      type="button"
                      className="btn1"
                      onClick={(e) => { e.stopPropagation(); handleApprove(approvalId); }}
                      disabled={!!actionLoading}
                      style={{ padding: "6px 12px", opacity: actionLoading ? 0.6 : 1 }}
                    >
                      {actionLoading === `approve-${approvalId}` ? "..." : "APPROVE"}
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn2"
                      onClick={(e) => { e.stopPropagation(); handleDecline(approvalId); }}
                      disabled={!!actionLoading}
                      style={{ padding: "6px 12px", opacity: actionLoading ? 0.6 : 1 }}
                    >
                      {actionLoading === `decline-${approvalId}` ? "..." : "DECLINE"}
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </table>
      </div>
    </div>
  );
};

export default CreditSalesApproval;
