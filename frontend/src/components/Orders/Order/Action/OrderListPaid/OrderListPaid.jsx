import React, { useState, useEffect } from "react";
import { apiRequest } from "../../../../../lib/config";
import { fetchSalesReference, printSalesReference } from "../../../../../lib/salesReference";
import { payNextInstallmentViaPaystackPopup } from "../../../../../lib/paystackInstallmentPopup";
import Dashboard from "../../../../ui/DashboardBtn";
import { FaTimes } from "react-icons/fa";
import { IoGridOutline } from "react-icons/io5";
import pmLogo from "../../../../../assets/images/PMlogo.png";

const getCustomerTypeLabel = (order = {}) => {
  const raw = (order.customerType || order.customer_type || "").toString().toUpperCase();
  if (raw === "ONLINE") return "ONLINE";
  if (raw === "WALKIN" || raw === "WALK_IN" || raw === "WALK-IN") return "WALK-IN";
  return "UNKNOWN";
};

const OrderListPaid = ({ toggleOlpModal }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [qualifiedOrders, setQualifiedOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [customerTypeFilter, setCustomerTypeFilter] = useState("ALL");
  const [orderDetails, setOrderDetails] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [salesReference, setSalesReference] = useState("");
  const [generatingRef, setGeneratingRef] = useState(false);
  const [showPayInstallment, setShowPayInstallment] = useState(false);
  const [payingInstallment, setPayingInstallment] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);

  // Fetch orders with >= 50% payment on component mount
  useEffect(() => {
    fetchQualifiedOrders();
  }, []);

  // Fetch order details when an order is selected
  useEffect(() => {
    if (selectedOrderId) {
      fetchOrderDetails(selectedOrderId);
      fetchPaymentDetails(selectedOrderId);
    } else {
      setOrderDetails(null);
      setPaymentDetails(null);
      setShowPaymentDetails(false);
    }
    setShowPayInstallment(false);
  }, [selectedOrderId]);

  // Fetch orders that have paid 50% or more
  const fetchQualifiedOrders = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("═══════════════════════════════════════════════════════════");
      console.log("🔵 OrderListPaid: Fetching orders with >= 50% payment and no sales reference yet");
      console.log("═══════════════════════════════════════════════════════════");

      // Orders that have crossed the >50%-paid mark and haven't had a sales reference
      // generated yet - see OneOfOrder.jsx/OnOneSales.jsx for the "Generate Sales
      // Reference" step that sets it. awaiting-sales-reference filters directly on
      // SalesOrder's own stored salesReference/paymentProgress columns
      // (SalesService.getOrdersAwaitingSalesReference), independent of
      // incomplete-payments' isPaid/status rules - those were silently excluding
      // orders that had genuinely crossed 50%.
      const reportResponse = await apiRequest(
        `/sales/orders/awaiting-sales-reference?size=500`,
        "GET"
      );

      let ordersList = [];
      if (reportResponse?.response?.content && Array.isArray(reportResponse.response.content)) {
        ordersList = reportResponse.response.content;
      } else if (reportResponse?.data && Array.isArray(reportResponse.data)) {
        ordersList = reportResponse.data;
      } else if (Array.isArray(reportResponse)) {
        ordersList = reportResponse;
      }

      console.log(`Found ${ordersList.length} total orders`);

      const ordersWithPayment = ordersList
        .filter((order) => order.id || order.orderId)
        .map((order) => ({
          ...order,
          amountPaid: order.totalPaid || 0,
          paymentPercentage: order.paymentPercentage || 0,
        }));

      ordersWithPayment.forEach((order) => {
        const orderId = order.id || order.orderId;
        console.log(`✅ Added order ${orderId} to qualified list (${order.paymentPercentage.toFixed(2)}%)`);
      });

      console.log(`✅ Found ${ordersWithPayment.length} orders with >= 50% payment`);
      setQualifiedOrders(ordersWithPayment);
      
      if (ordersWithPayment.length === 0) {
        setError("No orders with 50% or more payment found");
      }
      
    } catch (err) {
      console.error("❌ Error fetching orders:", err);
      setError("Failed to load orders. Please refresh the page.");
      setQualifiedOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch detailed order information
  const fetchOrderDetails = async (orderId) => {
    try {
      console.log(`Fetching details for order ID: ${orderId}`);
      
      let response;
      try {
        response = await apiRequest(`/sales/orders/${orderId}/details`, "GET");
      } catch (err) {
        response = await apiRequest(`/api/sales/orders/${orderId}/details`, "GET");
      }

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
    } catch (err) {
      console.error(`Error fetching order details:`, err);
    }
  };

  // Fetch payment details for an order
  const fetchPaymentDetails = async (orderId) => {
    try {
      console.log(`Fetching payment details for order ID: ${orderId}`);
      
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

      console.log("Payment details:", paymentData);
      setPaymentDetails(paymentData);
    } catch (err) {
      console.error(`Error fetching payment details:`, err);
    }
  };

  // Handle order selection from dropdown
  const handleOrderSelect = (e) => {
    const orderId = e.target.value;
    console.log(`Selected order ID: ${orderId}`);
    setSelectedOrderId(orderId);
    
    const order = qualifiedOrders.find(o => {
      const id = o.id?.toString() || o.orderId?.toString();
      return id === orderId;
    });
    setSelectedOrder(order);
  };

  const filteredOrders = qualifiedOrders.filter((order) => {
    if (customerTypeFilter === "ALL") return true;
    const label = getCustomerTypeLabel(order);
    return customerTypeFilter === "ONLINE" ? label === "ONLINE" : label === "WALK-IN";
  });

  // Generate (backend-persisted) + print a sales reference for the selected order (QA #3a).
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
        "Order Ref": getProductReference(),
        Customer: getCustomerName(),
        Product: getProductName(),
        "Total Amount": formatCurrency(getTotalAmount()),
        "Amount Paid": formatCurrency(getPaidAmount()),
      });
    } catch (err) {
      setError(err?.message || "Failed to generate sales reference.");
      setTimeout(() => setError(""), 4000);
    } finally {
      setGeneratingRef(false);
    }
  };

  // Opens Paystack (in a popup) to collect the order's next due installment. The order
  // modal stays open underneath; when the popup closes we just re-fetch this order's
  // payment details so the progress bar/history reflect the new payment in place.
  const handlePayInstallment = async () => {
    if (!selectedOrderId) return;

    setPayingInstallment(true);
    setError("");
    setSuccess("");

    try {
      const outcome = await payNextInstallmentViaPaystackPopup({
        orderId: selectedOrderId,
        email: orderDetails?.email || selectedOrder?.email || "",
      });

      await fetchPaymentDetails(selectedOrderId);
      await fetchOrderDetails(selectedOrderId);

      // Report what the server says happened, not merely that the popup closed - an
      // abandoned checkout used to read as a successful payment.
      if (outcome?.settled) {
        setSuccess("Payment confirmed. Order payment details have been refreshed.");
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(outcome?.settlementMessage || "Payment was not confirmed.");
        setTimeout(() => setError(""), 5000);
      }
    } catch (err) {
      setError(err?.message || "Failed to start installment payment. Please try again.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setPayingInstallment(false);
    }
  };

  // Actually settles the order (isPaid=true, gated at >=50% paid server-side) so it
  // moves out of this list and into Completed Payments - "Generate Sales Reference"
  // above only mints a printable receipt number, it never touched isPaid, which left
  // orders paid 50-99% (e.g. a walk-in credit sale on a 2-installment plan) stuck here
  // forever with no way to finish them from the admin side (ORDERING & SALES #8).
  const handleMarkAsPaid = async () => {
    if (!selectedOrderId) {
      setError("Please select an order first");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setMarkingPaid(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest(`/sales/orders/${selectedOrderId}/mark-paid`, "PUT", {});

      // Reload rather than drop the row locally: an order that is not yet 100% paid stays
      // on this list until the customer clears the balance.
      setSuccess("Order marked as paid. It stays on this list until it is 100% paid.");
      setSelectedOrderId("");
      setSelectedOrder(null);
      await fetchQualifiedOrders();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err?.message || "Failed to mark order as paid. Please try again.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setMarkingPaid(false);
    }
  };

  // Show the selected order's existing reference, if any - part-paid orders stay on this
  // list after their reference is minted.
  useEffect(() => {
    setSalesReference(selectedOrder?.salesReference || "");
  }, [selectedOrderId]);

  // Calculate payment percentage (from selected order's data)
  const calculatePaymentPercentage = () => {
    if (!selectedOrder) return 0;
    const totalAmount = selectedOrder.totalAmount || selectedOrder.amount || 0;
    const paidAmount = selectedOrder.amountPaid || 0;
    if (totalAmount === 0) return 0;
    return Math.round((paidAmount / totalAmount) * 100);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
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

  // Get customer name
  const getCustomerName = () => {
    if (!orderDetails) return selectedOrder?.customerName || "N/A";
    return orderDetails.customerName || 
           orderDetails.customer?.name ||
           selectedOrder?.customerName ||
           "N/A";
  };

  // Get account number
  const getAccountNumber = () => {
    if (!orderDetails) return selectedOrder?.accountNumber || "N/A";
    return orderDetails.accountNumber || 
           orderDetails.accountNo ||
           selectedOrder?.accountNumber ||
           "N/A";
  };

  // Get product reference
  const getProductReference = () => {
    if (!orderDetails) return selectedOrder?.referenceNo || "N/A";
    return orderDetails.referenceNo || 
           orderDetails.orderNumber ||
           selectedOrder?.referenceNo ||
           "N/A";
  };

  // Get product name
  const getProductName = () => {
    if (!orderDetails) return selectedOrder?.productName || "N/A";
    return orderDetails.productName || 
           orderDetails.product?.name ||
           selectedOrder?.productName ||
           "N/A";
  };

  // Get total amount
  const getTotalAmount = () => {
    if (!orderDetails) return selectedOrder?.totalAmount || 0;
    return orderDetails.totalAmount || orderDetails.amount || selectedOrder?.totalAmount || 0;
  };

  // Get paid amount
  const getPaidAmount = () => {
    if (selectedOrder?.amountPaid) return selectedOrder.amountPaid;
    if (!orderDetails) return 0;
    return orderDetails.amountPaid || orderDetails.paidAmount || 0;
  };

  // Get remaining balance
  const getRemainingBalance = () => {
    const total = getTotalAmount();
    const paid = getPaidAmount();
    return total - paid;
  };

  // Styles
  const styles = {
    container: {
      maxWidth: "1000px",
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
      border: "none",
      fontSize: "1rem",
      cursor: "pointer",
      color: "#e8f2ff",
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
      marginBottom: "20px",
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
      backgroundColor: "#e7f3ff",
      color: "#1b5cb8",
      border: "1px solid #c9dcf8"
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
    infoBox: {
      backgroundColor: "white",
      border: "1px solid #cfdef2",
      borderRadius: "12px",
      padding: "25px",
      marginBottom: "16px",
      boxShadow: "0 4px 14px rgba(17, 69, 131, 0.08)"
    },
    infoRow: {
      padding: "15px 0",
      borderBottom: "1px solid #e9ecef"
    },
    infoLabel: {
      fontSize: "0.8rem",
      fontWeight: "700",
      color: "#6c757d",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      marginBottom: "5px",
      display: "block"
    },
    infoValue: {
      fontSize: "1.1rem",
      fontWeight: "500",
      color: "#333",
      margin: "0"
    },
    progressSection: {
      marginTop: "20px",
      paddingTop: "20px",
      borderTop: "2px solid #e9ecef"
    },
    progressHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "15px",
      flexWrap: "wrap",
      gap: "15px"
    },
    buttonGroup: {
      display: "flex",
      gap: "12px"
    },
    btn: {
      padding: "10px 24px",
      fontSize: "0.9rem",
      fontWeight: "700",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      transition: "all 0.2s ease"
    },
    btnView: {
      backgroundColor: "#1b5cb8",
      color: "white"
    },
    referenceLink: {
      color: "#1b5cb8",
      textDecoration: "underline",
      cursor: "pointer"
    },
    btnPayInstallment: {
      marginTop: "10px",
      backgroundColor: "#10b981",
      color: "white",
      padding: "10px 22px",
      fontSize: "0.85rem"
    },
    progressBarWrapper: {
      width: "100%",
      height: "30px",
      backgroundColor: "#e9ecef",
      borderRadius: "8px",
      overflow: "hidden"
    },
    progressBarFill: {
      height: "100%",
      backgroundColor: "#0867db",
      transition: "width 0.4s ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      paddingRight: "10px",
      color: "white",
      fontSize: "0.8rem",
      fontWeight: "600"
    },
    paymentTable: {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: "20px"
    },
    tableHeader: {
      backgroundColor: "#f8f9fa",
      padding: "12px",
      textAlign: "left",
      borderBottom: "2px solid #dee2e6",
      fontWeight: "600"
    },
    tableCell: {
      padding: "10px",
      textAlign: "left",
      borderBottom: "1px solid #e9ecef"
    },
    loadingState: {
      textAlign: "center",
      padding: "50px",
      color: "#666"
    },
    spinner: {
      border: "3px solid #f3f3f3",
      borderTop: "3px solid #0867db",
      borderRadius: "50%",
      width: "40px",
      height: "40px",
      animation: "spin 1s linear infinite",
      margin: "0 auto 15px"
    },
    statusBadge: {
      display: "inline-block",
      padding: "4px 10px",
      borderRadius: "20px",
      fontSize: "0.7rem",
      fontWeight: "600"
    },
    actionButtons: {
      display: "flex",
      justifyContent: "center",
      gap: "15px",
      marginTop: "20px"
    },
    infoCardTitle: {
      margin: "0 0 14px 0",
      color: "#103b7a",
      fontSize: "1.2rem",
      fontWeight: "700",
      letterSpacing: "0.02em"
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
        <h1 style={styles.title}>ORDERLIST AS PAID</h1>
        <div style={styles.headerRight}>
          <Dashboard />
          <IoGridOutline style={styles.headerIcon} />
          <button 
            onClick={toggleOlpModal} 
            style={styles.closeBtn}
            onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(255, 255, 255, 0.15)"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && !loading && (
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
      {loading && (
        <div style={styles.loadingState}>
          <div style={styles.spinner}></div>
          <p>Loading orders with 50%+ payment...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Customer Type Filter */}
          <div style={styles.formGroup}>
            <label style={styles.label}>FILTER BY CUSTOMER TYPE:</label>
            <select
              value={customerTypeFilter}
              onChange={(e) => {
                setCustomerTypeFilter(e.target.value);
                setSelectedOrderId("");
                setSelectedOrder(null);
              }}
              style={styles.select}
            >
              <option value="ALL">All Customers</option>
              <option value="ONLINE">Online Customers</option>
              <option value="WALKIN">Walk-in Customers</option>
            </select>
          </div>

          {/* Order Selection Dropdown */}
          <div style={styles.formGroup}>
            <label style={styles.label}>SELECT CUSTOMER (50%+ PAID):</label>
            <select
              value={selectedOrderId}
              onChange={handleOrderSelect}
              style={styles.select}
            >
              <option value="">-- Select an order --</option>
              {filteredOrders.map((order) => {
                const totalAmount = order.totalAmount || order.amount || 0;
                const paidAmount = order.amountPaid || 0;
                const percentage = order.paymentPercentage || (totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0);
                const customerName = order.customerName || "Unknown";
                const orderDisplayId = order.referenceNo || order.id || order.orderId;
                const customerTypeLabel = getCustomerTypeLabel(order);

                return (
                  <option key={order.id || order.orderId} value={order.id || order.orderId}>
                    [{customerTypeLabel}] {customerName} - {formatCurrency(paidAmount)} paid ({Math.round(percentage)}%) - Order: {orderDisplayId}
                  </option>
                );
              })}
            </select>
            <small style={{ display: "block", marginTop: "6px", fontSize: "0.83rem", fontWeight: "700", color: "#1b5cb8" }}>
              Showing orders with 50% or more payment completion. Customers on list: {filteredOrders.length} of {qualifiedOrders.length}
            </small>
          </div>

          {/* Info Message */}
          <div style={styles.infoBox}>
            <p style={{ margin: 0, fontSize: "1rem", fontWeight: "500", color: "#5e7ca8", textAlign: "center" }}>
              Orders with 50% or more payment are shown here. Select a customer to view details and move to cashier.
            </p>
          </div>

          {/* Order Details Card */}
          {selectedOrderId && (
            <div style={styles.infoBox}>
              <h3 style={styles.infoCardTitle}>ORDER DETAILS</h3>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>CUSTOMER NAME</div>
                <p style={styles.infoValue}>{getCustomerName()}</p>
              </div>

              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>CUSTOMER ACCOUNT NO</div>
                <p style={styles.infoValue}>{getAccountNumber()}</p>
              </div>

              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>PRODUCT REFERENCE</div>
                {getCustomerTypeLabel(selectedOrder || {}) === "WALK-IN" ? (
                  <>
                    <p
                      style={{ ...styles.infoValue, ...styles.referenceLink }}
                      onClick={() => setShowPayInstallment((prev) => !prev)}
                      title="Click to pay the next installment on this order"
                    >
                      {getProductReference()}
                    </p>
                    {showPayInstallment && (
                      <button
                        type="button"
                        style={{ ...styles.btn, ...styles.btnPayInstallment }}
                        onClick={handlePayInstallment}
                        disabled={payingInstallment}
                      >
                        {payingInstallment ? "OPENING PAYSTACK..." : "PAY INSTALLMENT"}
                      </button>
                    )}
                  </>
                ) : (
                  <p style={styles.infoValue}>{getProductReference()}</p>
                )}
              </div>

              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>PRODUCT NAME</div>
                <p style={styles.infoValue}>{getProductName()}</p>
              </div>

              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>ORDER DATE</div>
                <p style={styles.infoValue}>{formatDate(selectedOrder?.createdAt || selectedOrder?.orderDate)}</p>
              </div>

              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>TOTAL AMOUNT</div>
                <p style={{ ...styles.infoValue, color: "#1b5cb8", fontWeight: "bold" }}>{formatCurrency(getTotalAmount())}</p>
              </div>

              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>AMOUNT PAID</div>
                <p style={{ ...styles.infoValue, color: "#1b5cb8", fontWeight: "bold" }}>{formatCurrency(getPaidAmount())}</p>
              </div>

              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>REMAINING BALANCE</div>
                <p style={{ ...styles.infoValue, color: "#25599f", fontWeight: "bold" }}>{formatCurrency(getRemainingBalance())}</p>
              </div>

              {/* Payment Progress Bar */}
              <div style={styles.progressSection}>
                <div style={styles.progressHeader}>
                  <span style={styles.infoLabel}>PAYMENT PROGRESS</span>
                  <div style={styles.buttonGroup}>
                    <button
                      style={styles.btnView}
                      onClick={() => setShowPaymentDetails(!showPaymentDetails)}
                      onMouseEnter={(e) => e.target.style.backgroundColor = "#144a94"}
                      onMouseLeave={(e) => e.target.style.backgroundColor = "#1b5cb8"}
                    >
                      {showPaymentDetails ? "HIDE DETAILS" : "VIEW DETAILS"}
                    </button>
                  </div>
                </div>
                
                <div style={styles.progressBarWrapper}>
                  <div style={{ ...styles.progressBarFill, width: `${calculatePaymentPercentage()}%` }}>
                    {calculatePaymentPercentage()}%
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "0.8rem", color: "#666" }}>
                  <span>Paid: {formatCurrency(getPaidAmount())}</span>
                  <span>Total: {formatCurrency(getTotalAmount())}</span>
                </div>
              </div>

              {/* Payment History */}
              {showPaymentDetails && paymentDetails && (
                <div style={{ marginTop: "20px" }}>
                  <h4 style={{ margin: "0 0 15px 0", color: "#333", fontSize: "1rem" }}>PAYMENT HISTORY</h4>
                  {paymentDetails.payments && paymentDetails.payments.length > 0 ? (
                    <table style={styles.paymentTable}>
                      <thead>
                        <tr>
                          <th style={styles.tableHeader}>DATE</th>
                          <th style={styles.tableHeader}>AMOUNT</th>
                          <th style={styles.tableHeader}>METHOD</th>
                          <th style={styles.tableHeader}>REFERENCE</th>
                          <th style={styles.tableHeader}>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentDetails.payments.map((payment, index) => (
                          <tr key={index}>
                            <td style={styles.tableCell}>{formatDate(payment.date)}</td>
                            <td style={styles.tableCell}>{formatCurrency(payment.amount)}</td>
                            <td style={styles.tableCell}>{payment.method || "N/A"}</td>
                            <td style={styles.tableCell}>{payment.reference || "N/A"}</td>
                            <td style={styles.tableCell}>
                              <span style={{ ...styles.statusBadge, backgroundColor: "#e7f3ff", color: "#1b5cb8" }}>
                                {payment.status || "COMPLETED"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ textAlign: "center", color: "#666", padding: "20px" }}>No payment history available</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* No Order Selected Message */}
          {!selectedOrderId && filteredOrders.length > 0 && (
            <div style={styles.infoBox}>
              <p style={{ textAlign: "center", margin: 0, color: "#1b5cb8", fontWeight: "500" }}>
                Please select a customer from the dropdown to view order details
              </p>
            </div>
          )}

          {/* No Orders Message */}
          {filteredOrders.length === 0 && !loading && (
            <div style={{ ...styles.infoBox, border: "1px solid #cfe0f7", backgroundColor: "#eef5ff" }}>
              <p style={{ textAlign: "center", margin: 0, color: "#1b5cb8", fontWeight: "500", fontSize: "1rem" }}>
                {qualifiedOrders.length === 0
                  ? "No pending orders with 50%+ payment."
                  : "No pending orders with 50%+ payment for the selected customer type."}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {selectedOrderId && (
            <>
              <div style={styles.actionButtons}>
                <button
                  onClick={handleMarkAsPaid}
                  disabled={markingPaid}
                  style={{
                    ...styles.btn,
                    backgroundColor: markingPaid ? "#9ca3af" : "#1b5cb8",
                    color: "white",
                    fontSize: "1rem",
                    padding: "12px 32px",
                    cursor: markingPaid ? "not-allowed" : "pointer",
                  }}
                >
                  {markingPaid ? "PROCESSING..." : "MARK AS PAID"}
                </button>
                <button
                  onClick={handleGenerateSalesReference}
                  disabled={generatingRef}
                  style={{
                    ...styles.btn,
                    backgroundColor: generatingRef ? "#9ca3af" : "#10b981",
                    color: "white",
                    fontSize: "1rem",
                    padding: "12px 32px",
                    cursor: generatingRef ? "not-allowed" : "pointer",
                  }}
                >
                  {generatingRef ? "GENERATING..." : "GENERATE SALES REFERENCE"}
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
            </>
          )}
        </>
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

export default OrderListPaid;


