import React, { useState, useEffect } from "react";
import BranchBadge from "../../../../shared/BranchBadge";
import { apiRequest } from "../../../../../lib/config";
import { APPROVAL_TYPES, createApprovalRequest } from "../../../../../lib/adminApi";
import { fetchSalesReference, printSalesReference } from "../../../../../lib/salesReference";
import { useAuth } from "../../../../../context/AuthContext";
import Dashboard from "../../../../ui/DashboardBtn";
import { FaTimes } from "react-icons/fa";
import { IoGridOutline } from "react-icons/io5";
import pmLogo from "../../../../../assets/images/PMlogo.png";

const Refund = ({ toggleRefundModal }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Order related states
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  
  // Refund related states
  const [refundAmount, setRefundAmount] = useState("");
  const [calculatedRefund, setCalculatedRefund] = useState(null);
  const [deductions, setDeductions] = useState({ percentage: 15, amount: 0 });
  const [salesReference, setSalesReference] = useState("");
  const [generatingRef, setGeneratingRef] = useState(false);

  const handleGenerateSalesReference = async () => {
    if (!selectedOrderId) {
      setError("Please select an order first");
      setTimeout(() => setError(""), 3000);
      return;
    }
    setGeneratingRef(true);
    try {
      const ref = await fetchSalesReference(selectedOrderId);
      setSalesReference(ref);
      printSalesReference(ref, {
        "Order Ref": selectedOrder?.referenceNo,
        Customer: selectedOrder?.customerName,
        Product: selectedOrder?.productName,
        "Refund Amount": calculatedRefund?.finalAmount,
      });
    } catch (err) {
      setError(err?.message || "Failed to generate sales reference.");
      setTimeout(() => setError(""), 4000);
    } finally {
      setGeneratingRef(false);
    }
  };

  // Fetch all orders on component mount
  useEffect(() => {
    fetchOrders();
  }, []);

  // Fetch order details when order is selected
  useEffect(() => {
    if (selectedOrderId) {
      fetchOrderDetails(selectedOrderId);
      fetchPaymentDetails(selectedOrderId);
    } else {
      setOrderDetails(null);
      setPaymentDetails(null);
      setSelectedOrder(null);
      setCalculatedRefund(null);
      setRefundAmount("");
    }
  }, [selectedOrderId]);

  // Calculate refund when order details are loaded
  useEffect(() => {
    if (orderDetails && orderDetails.totalAmount) {
      calculateRefundAmount();
    }
  }, [orderDetails]);

  // Fetch all orders that are eligible for refund
  const fetchOrders = async () => {
    try {
      setFetchLoading(true);
      setError("");
      
      console.log("═══════════════════════════════════════════════════════════");
      console.log("🔵 Refund: Fetching orders eligible for refund");
      console.log("═══════════════════════════════════════════════════════════");
      
      // Loan orders with an outstanding balance, eligible for refund. incomplete-payments
      // already excludes CANCELLED/REFUNDED and needs no date range (the walk-in/credit
      // report path was unreliable here) - and already carries totalPaid/paymentPercentage
      // per order, computed server-side (SalesService.resolvePaymentProgress) from the real
      // payment/installment records. Use that directly: a client-side sum over payment-details'
      // per-entry "amount" field double-counts still-pending installments (their "amount" is
      // the amount DUE, not paid), which would overstate how much the customer actually paid -
      // and this figure feeds straight into the 85%-of-amountPaid refund calculation below, so
      // getting it wrong risks approving a refund for money that was never collected.
      const response = await apiRequest(
        `/sales/orders/incomplete-payments?size=500`,
        "GET"
      );

      let ordersList = [];
      if (response?.response?.content && Array.isArray(response.response.content)) {
        ordersList = response.response.content;
      } else if (response?.data && Array.isArray(response.data)) {
        ordersList = response.data;
      } else if (Array.isArray(response)) {
        ordersList = response;
      }

      // Only include orders that have a real payment on record (not already refunded).
      const eligibleOrders = ordersList
        .filter((order) => order.id || order.orderId)
        .map((order) => {
          const orderId = order.id || order.orderId;
          return {
            ...order,
            id: orderId,
            amountPaid: order.totalPaid || 0,
            totalAmount: order.totalAmount || order.amount || 0,
            customerName: order.customerName || order.customer?.name || "Unknown",
            accountNumber: order.accountNumber || order.customer?.accountNumber || "N/A",
            referenceNo: order.referenceNo || order.orderNumber || orderId,
            productName: order.productName || "N/A",
            createdAt: order.createdAt || order.orderDate || new Date().toISOString()
          };
        })
        .filter((order) => order.amountPaid > 0);

      console.log(`✅ Found ${eligibleOrders.length} orders eligible for refund`);
      setOrders(eligibleOrders);
      
      if (eligibleOrders.length === 0) {
        setError("No orders eligible for refund found");
      }
      
    } catch (err) {
      console.error("❌ Error fetching orders:", err);
      setError("Failed to load orders. Please refresh the page.");
    } finally {
      setFetchLoading(false);
    }
  };

  // Fetch detailed order information
  const fetchOrderDetails = async (orderId) => {
    try {
      console.log(`Fetching details for order ID: ${orderId}`);
      
      const response = await apiRequest(`/sales/orders/${orderId}/details`, "GET");
      
      let details = null;
      if (response?.data) {
        details = response.data;
      } else if (response?.response) {
        details = response.response;
      } else {
        details = response;
      }
      
      console.log("Order details:", details);
      setOrderDetails(details);
      setSelectedOrder(orders.find(o => o.id === orderId));
      
    } catch (err) {
      console.error(`Error fetching order details:`, err);
    }
  };

  // Fetch payment details for an order
  const fetchPaymentDetails = async (orderId) => {
    try {
      console.log(`Fetching payment details for order ID: ${orderId}`);
      
      const response = await apiRequest(`/sales/orders/${orderId}/payment-details`, "GET");
      
      let paymentData = null;
      if (response?.data) {
        paymentData = response.data;
      } else if (response?.response) {
        paymentData = response.response;
      } else {
        paymentData = response;
      }
      
      console.log("Payment details:", paymentData);
      setPaymentDetails(paymentData);
      
    } catch (err) {
      console.error(`Error fetching payment details:`, err);
    }
  };

  // Calculate refund amount after the required 15% deduction.
  const calculateRefundAmount = () => {
    if (!orderDetails) return;
    
    const totalPaid = selectedOrder?.amountPaid || 0;
    
    // Calculate a flat 15% deduction before sending the refund for approval.
    const totalDeductions = totalPaid * 0.15;
    const finalRefundAmount = totalPaid - totalDeductions;
    
    setDeductions({
      percentage: 15,
      amount: totalDeductions
    });
    setCalculatedRefund({
      originalPaid: totalPaid,
      deductions: totalDeductions,
      finalAmount: finalRefundAmount > 0 ? finalRefundAmount : 0
    });
    setRefundAmount(finalRefundAmount > 0 ? finalRefundAmount.toFixed(2) : "0");
  };

  // Handle order selection from dropdown
  const handleOrderSelect = (e) => {
    const orderId = e.target.value;
    console.log(`Selected order ID: ${orderId}`);
    setSelectedOrderId(orderId);
  };

  // Handle refund submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedOrderId) {
      setError("Please select an order first");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    if (!calculatedRefund || calculatedRefund.finalAmount <= 0) {
      setError("No refund amount calculated. Please check the order details.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      console.log("═══════════════════════════════════════════════════════════");
      console.log("Refund: 🚀 STARTING REFUND PROCESS");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("Order ID:", selectedOrderId);
      console.log("Refund Amount:", calculatedRefund.finalAmount);
      
      const refundApprovalData = {
        totalAmount: calculatedRefund.finalAmount,
        customerName: selectedOrder?.customerName || "",
        accountNumber: selectedOrder?.accountNumber || "",
        referenceNo: selectedOrder?.referenceNo || "",
        productName: selectedOrder?.productName || "",
        createdAt: selectedOrder?.createdAt || new Date().toISOString()
      };
      
      console.log("Approval Data:", JSON.stringify(refundApprovalData, null, 2));
      
      await createApprovalRequest({
        approvalType: APPROVAL_TYPES.refund,
        entityId: selectedOrderId,
        requestedBy: user?.id || user?.userId || 0,
        requestData: {
          refundData: refundApprovalData,
        },
        comments: "Refund request",
      });
      
      console.log("✅ Refund processed successfully!");
      console.log("═══════════════════════════════════════════════════════════");
      
      setSuccess(`Refund of ₦${calculatedRefund.finalAmount.toLocaleString()} submitted for admin approval.`);
      
      // Reset form
      setTimeout(() => {
        setSelectedOrderId("");
        setSelectedOrder(null);
        setOrderDetails(null);
        setPaymentDetails(null);
        setCalculatedRefund(null);
        setRefundAmount("");
        setSuccess("");
      }, 3000);
      
    } catch (err) {
      console.error("═══════════════════════════════════════════════════════════");
      console.error("❌ Refund: ERROR PROCESSING REFUND");
      console.error("═══════════════════════════════════════════════════════════");
      console.error("Error:", err.message);
      
      let errorMessage = "Failed to process refund. ";
      if (err.message.includes("404")) {
        errorMessage = "Order not found. Please try again.";
      } else if (err.message.includes("400")) {
        errorMessage = "Invalid request. Please check the refund amount.";
      } else if (err.message.includes("already refunded")) {
        errorMessage = "This order has already been refunded.";
      } else {
        errorMessage += err.message || "Please try again.";
      }
      
      setError(errorMessage);
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('en-GB');
    } catch {
      return "N/A";
    }
  };

  // Styles
  const styles = {
    container: {
      maxWidth: "980px",
      margin: "0 auto",
      padding: "14px",
      fontFamily: "'Montserrat', sans-serif",
      background: "#f8fbff",
      border: "1px solid #c5d6ef",
      borderRadius: "18px",
      boxShadow: "0 20px 45px rgba(18, 57, 110, 0.12)"
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
      background: "linear-gradient(90deg, #103b7a 0%, #1b5cb8 100%)",
      border: "1px solid #114583",
      borderRadius: "12px",
      marginBottom: "14px",
      padding: "14px 16px"
    },
    headerLeft: {
      width: "44px",
      minWidth: "44px",
      flex: "0 0 44px",
      display: "flex",
      justifyContent: "flex-start"
    },
    logo: {
      width: "42px",
      height: "42px",
      display: "block",
      objectFit: "contain",
      borderRadius: "8px",
      background: "#ffffff",
      border: "1px solid #d7e6ff",
      padding: "4px"
    },
    title: {
      fontSize: "1.7rem",
      fontWeight: "700",
      color: "#eef5ff",
      textTransform: "uppercase",
      margin: "0",
      letterSpacing: "0.05em"
    },
    headerRight: {
      display: "flex",
      alignItems: "center",
      gap: "8px"
    },
    headerIcon: {
      color: "#e8f2ff",
      fontSize: "1.2rem"
    },
    closeBtn: {
      background: "transparent",
      color: "#e8f2ff",
      border: "none",
      fontSize: "1rem",
      cursor: "pointer",
      width: "30px",
      height: "30px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "8px",
      transition: "all 0.3s"
    },
    alert: {
      padding: "12px 20px",
      borderRadius: "8px",
      marginBottom: "12px",
      fontSize: "0.9rem",
      fontWeight: "500",
      textAlign: "center"
    },
    alertError: {
      backgroundColor: "#fff4e5",
      color: "#8a5b12",
      border: "1px solid #ffd9a8"
    },
    alertSuccess: {
      backgroundColor: "#d4edda",
      color: "#155724",
      border: "1px solid #c3e6cb"
    },
    formGroup: {
      marginBottom: "16px",
      background: "#ffffff",
      border: "1px solid #cdddf3",
      borderRadius: "12px",
      padding: "14px"
    },
    label: {
      display: "block",
      fontSize: "0.95rem",
      fontWeight: "700",
      color: "#5e7ca8",
      marginBottom: "8px",
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    },
    select: {
      width: "100%",
      padding: "12px 15px",
      border: "1px solid #c8daf1",
      borderRadius: "10px",
      fontSize: "1.05rem",
      backgroundColor: "white",
      cursor: "pointer",
      fontFamily: "inherit",
      transition: "border-color 0.3s",
      outline: "none"
    },
    infoCard: {
      backgroundColor: "white",
      border: "1px solid #cfdef2",
      borderRadius: "12px",
      padding: "20px",
      marginBottom: "16px",
      boxShadow: "0 4px 14px rgba(17, 69, 131, 0.08)"
    },
    sectionTitle: {
      margin: "0 0 15px 0",
      color: "#103b7a",
      fontSize: "1.2rem",
      fontWeight: "700",
      letterSpacing: "0.02em"
    },
    sectionTitleDanger: {
      margin: "0 0 15px 0",
      color: "#1b5cb8",
      fontSize: "1.2rem",
      fontWeight: "700",
      letterSpacing: "0.02em"
    },
    infoRow: {
      display: "flex",
      justifyContent: "space-between",
      padding: "12px 0",
      borderBottom: "1px solid #e9ecef"
    },
    infoLabel: {
      fontSize: "0.9rem",
      fontWeight: "600",
      color: "#6c757d"
    },
    infoValue: {
      fontSize: "1rem",
      fontWeight: "500",
      color: "#333"
    },
    deductionRow: {
      display: "flex",
      justifyContent: "space-between",
      padding: "10px 0",
      color: "#1f4f8f"
    },
    refundAmount: {
      backgroundColor: "#e7f3ff",
      padding: "15px",
      borderRadius: "8px",
      marginTop: "15px",
      textAlign: "center"
    },
    refundAmountValue: {
      fontSize: "1.8rem",
      fontWeight: "bold",
      color: "#28a745"
    },
    textarea: {
      width: "100%",
      padding: "12px 15px",
      border: "1px solid #c8daf1",
      borderRadius: "10px",
      fontSize: "1rem",
      fontFamily: "inherit",
      resize: "vertical",
      minHeight: "80px",
      outline: "none"
    },
    button: {
      padding: "14px",
      fontSize: "1rem",
      fontWeight: "700",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      transition: "all 0.2s ease",
      marginTop: "0"
    },
    buttonPrimary: {
      backgroundColor: "#1b5cb8",
      color: "white"
    },
    buttonDisabled: {
      backgroundColor: "#6c757d",
      color: "white",
      cursor: "not-allowed"
    },
    noteBox: {
      marginTop: "20px",
      padding: "15px",
      backgroundColor: "#eef5ff",
      borderRadius: "8px",
      border: "1px solid #c8daf1",
      textAlign: "center"
    },
    loadingSpinner: {
      textAlign: "center",
      padding: "40px",
      color: "#666"
    },
    actionRow: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "10px",
      marginTop: "12px"
    },
    spinner: {
      border: "3px solid #f3f3f3",
      borderTop: "3px solid #1b5cb8",
      borderRadius: "50%",
      width: "40px",
      height: "40px",
      animation: "spin 1s linear infinite",
      margin: "0 auto 15px"
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <img
            src={pmLogo}
            alt="PM Logo"
            style={styles.logo}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/pm-logo.png";
            }}
          />
        </div>
        <h1 style={styles.title}>REFUND ORDER</h1>
        <div style={{ display: "flex", justifyContent: "center", margin: "0.4rem 0" }}>
          <BranchBadge />
        </div>
        <div style={styles.headerRight}>
          <Dashboard />
          <IoGridOutline style={styles.headerIcon} />
          <button
            onClick={toggleRefundModal}
            style={styles.closeBtn}
            onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(255, 255, 255, 0.15)"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{ ...styles.alert, ...styles.alertError }}>
          ⚠️ {error}
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div style={{ ...styles.alert, ...styles.alertSuccess }}>
          ✅ {success}
        </div>
      )}

      {/* Loading State */}
      {fetchLoading && (
        <div style={styles.loadingSpinner}>
          <div style={styles.spinner}></div>
          <p>Loading orders...</p>
        </div>
      )}

      {!fetchLoading && (
        <form onSubmit={handleSubmit}>
          {/* Order Selection Dropdown */}
          <div style={styles.formGroup}>
            <label style={styles.label}>SELECT ORDER TO REFUND *</label>
            <select 
              value={selectedOrderId} 
              onChange={handleOrderSelect}
              style={styles.select}
              disabled={loading}
            >
              <option value="">-- Select an order --</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.customerName} - {formatCurrency(order.amountPaid)} paid - Order: {order.referenceNo}
                </option>
              ))}
            </select>
            <small style={{ display: "block", marginTop: "8px", color: "#1b5cb8", fontWeight: "700" }}>
              Showing orders eligible for refund. Total customers on list: {orders.length}
            </small>
          </div>

          {/* Order Details Card */}
          {selectedOrderId && orderDetails && (
            <div style={styles.infoCard}>
              <h3 style={styles.sectionTitle}>ORDER DETAILS</h3>
              
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>CUSTOMER NAME</span>
                <span style={styles.infoValue}>{selectedOrder?.customerName || "N/A"}</span>
              </div>
              
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>ACCOUNT NUMBER</span>
                <span style={styles.infoValue}>{selectedOrder?.accountNumber || "N/A"}</span>
              </div>
              
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>PRODUCT REFERENCE</span>
                <span style={styles.infoValue}>{selectedOrder?.referenceNo || "N/A"}</span>
              </div>
              
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>PRODUCT NAME</span>
                <span style={styles.infoValue}>{selectedOrder?.productName || "N/A"}</span>
              </div>
              
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>ORDER DATE</span>
                <span style={styles.infoValue}>{formatDate(selectedOrder?.createdAt)}</span>
              </div>
              
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>TOTAL AMOUNT</span>
                <span style={styles.infoValue}>{formatCurrency(selectedOrder?.totalAmount)}</span>
              </div>
              
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>AMOUNT PAID</span>
                <span style={styles.infoValue}>{formatCurrency(selectedOrder?.amountPaid)}</span>
              </div>
            </div>
          )}

          {/* Refund Calculation Card */}
          {calculatedRefund && (
            <div style={styles.infoCard}>
              <h3 style={styles.sectionTitleDanger}>REFUND CALCULATION</h3>
              
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Original Amount Paid</span>
                <span style={styles.infoValue}>{formatCurrency(calculatedRefund.originalPaid)}</span>
              </div>
              
              <div style={styles.deductionRow}>
                <span style={styles.infoLabel}>15% Deduction</span>
                <span style={styles.infoValue}>- {formatCurrency(deductions.amount)}</span>
              </div>
              
              <div style={styles.refundAmount}>
                <span style={{ fontSize: "0.9rem", color: "#666", display: "block", marginBottom: "5px" }}>
                  TOTAL AMOUNT AFTER 15% DEDUCTION
                </span>
                <span style={styles.refundAmountValue}>
                  {formatCurrency(calculatedRefund.finalAmount)}
                </span>
              </div>
            </div>
          )}

          {/* Note Section */}
          <div style={styles.noteBox}>
            <p style={{ margin: 0, color: "#1f4f8f", fontWeight: "500" }}>
              <strong>Note:</strong> Refund approval will use the total amount after 15% deduction, customer name, account number, reference number, product name, and created date.
            </p>
          </div>

          <div style={styles.actionRow}>
            {/* Generate Sales Reference */}
            <button
              type="button"
              onClick={handleGenerateSalesReference}
              disabled={!selectedOrderId || generatingRef}
              style={{
                ...styles.button,
                backgroundColor: selectedOrderId && !generatingRef ? "#10b981" : "#9ca3af",
                color: "white",
                cursor: selectedOrderId && !generatingRef ? "pointer" : "not-allowed",
              }}
            >
              {generatingRef ? "GENERATING..." : "GENERATE SALES REFERENCE"}
            </button>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !selectedOrderId || !calculatedRefund}
              style={{
                ...styles.button,
                ...(loading || !selectedOrderId || !calculatedRefund ? styles.buttonDisabled : styles.buttonPrimary)
              }}
              onMouseEnter={(e) => {
                if (!loading && selectedOrderId && calculatedRefund) {
                  e.target.style.backgroundColor = "#144a94";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && selectedOrderId && calculatedRefund) {
                  e.target.style.backgroundColor = "#1b5cb8";
                }
              }}
            >
              {loading ? "PROCESSING REFUND..." : "PROCESS REFUND"}
            </button>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={toggleRefundModal}
              style={{
                ...styles.button,
                backgroundColor: "#6c757d",
                color: "white"
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = "#5a6268"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "#6c757d"}
            >
              CLOSE
            </button>
          </div>

          {salesReference && (
            <div
              style={{
                marginTop: "14px",
                padding: "12px 16px",
                borderRadius: "10px",
                backgroundColor: "#ecfdf5",
                border: "1px solid #a7f3d0",
                color: "#065f46",
                fontWeight: 700,
                letterSpacing: "0.5px",
                textAlign: "center",
              }}
            >
              Sales Reference: {salesReference}
            </div>
          )}
        </form>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Refund;

