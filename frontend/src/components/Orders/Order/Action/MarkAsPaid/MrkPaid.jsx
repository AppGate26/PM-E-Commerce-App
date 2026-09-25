import React, { useState, useEffect } from "react";
import BranchBadge from "../../../../shared/BranchBadge";
import { API_BASE_URL, apiRequest } from "../../../../../lib/config";
import Dashboard from "../../../../ui/DashboardBtn";
import { FaTimes } from "react-icons/fa";
import { IoGridOutline } from "react-icons/io5";
import pmLogo from "../../../../../assets/images/PMlogo.png";
import CancelModal from "../CancelledOrder/CancelModal";
import { payNextInstallmentViaPaystackPopup } from "../../../../../lib/paystackInstallmentPopup";
import "./MrkPaid.css";

const extractOrdersList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.response?.content)) return payload.response.content;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.response)) return payload.response;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const getOrderId = (order = {}) => order.id || order.orderId;

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

const MrkPaid = ({ toggleMrkPaidModal, onOrderUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [incompleteOrders, setIncompleteOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [orderDetails, setOrderDetails] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [markingAsPaid, setMarkingAsPaid] = useState(false);
  const [showCancelPopup, setShowCancelPopup] = useState(false);
  const [customerTypeFilter, setCustomerTypeFilter] = useState("ALL");
  const [showPayInstallment, setShowPayInstallment] = useState(false);
  const [payingInstallment, setPayingInstallment] = useState(false);

  // Fetch incomplete orders on component mount
  useEffect(() => {
    console.log("MrkPaid: Component mounted");
    fetchIncompleteOrders();
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

  // Fetch orders with incomplete payments (< 50% paid)
  const fetchIncompleteOrders = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("═══════════════════════════════════════════════════════════");
      console.log("🔵 MrkPaid: Fetching orders with < 50% payment");
      console.log("═══════════════════════════════════════════════════════════");

      // Orders whose stored paymentProgress is still under 50% - queried directly off
      // SalesOrder's own paymentProgress column (SalesService.getOrdersBelowHalfPaid),
      // independent of incomplete-payments' isPaid/status/recomputed-percentage rules,
      // which were silently excluding orders that belonged in this list.
      const ordersResponse = await apiRequestWithOptionalApiFallback("/sales/orders/below-half-paid?size=500", "GET");
      const ordersList = extractOrdersList(ordersResponse);

      console.log(`Found ${ordersList.length} total orders`);

      const ordersWithPayment = ordersList
        .filter((order) => getOrderId(order))
        .map((order) => ({
          ...order,
          amountPaid: order.totalPaid || 0,
          paymentPercentage: order.paymentPercentage || 0,
        }));

      ordersWithPayment.forEach((order) => {
        console.log(`✅ Added order ${getOrderId(order)} to incomplete list (${order.paymentPercentage.toFixed(2)}%)`);
      });

      console.log(`✅ Found ${ordersWithPayment.length} orders with < 50% payment`);
      setIncompleteOrders(ordersWithPayment);
      
      if (ordersWithPayment.length === 0) {
        setError("No orders with incomplete payments (<50%) found");
      }
      
    } catch (err) {
      console.error("❌ Error fetching incomplete orders:", err);
      setError(err?.message || "Failed to load orders. Please refresh the page.");
      setIncompleteOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch detailed order information
  const fetchOrderDetails = async (orderId) => {
    try {
      console.log(`MrkPaid: Fetching details for order ID: ${orderId}`);
      
      let response;
      try {
        response = await apiRequest(`/sales/orders/${orderId}/details`, "GET");
        console.log(`MrkPaid: Order details response:`, response);
      } catch (err) {
        console.log(`MrkPaid: Trying alternative endpoint /api/sales/orders/${orderId}/details`);
        response = await apiRequest(`/api/sales/orders/${orderId}/details`, "GET");
        console.log(`MrkPaid: Order details response:`, response);
      }

      let details = null;
      if (response?.data) {
        details = response.data;
      } else if (response?.response) {
        details = response.response;
      } else {
        details = response;
      }

      console.log("MrkPaid: Processed order details:", details);
      setOrderDetails(details);
      
    } catch (err) {
      console.error(`MrkPaid: Error fetching order details for ${orderId}:`, err);
    }
  };

  // Fetch payment details for an order
  const fetchPaymentDetails = async (orderId) => {
    try {
      console.log(`MrkPaid: Fetching payment details for order ID: ${orderId}`);
      
      let response;
      try {
        response = await apiRequest(`/sales/orders/${orderId}/payment-details`, "GET");
        console.log(`MrkPaid: Payment details response:`, response);
      } catch (err) {
        console.log(`MrkPaid: Trying alternative endpoint /api/sales/orders/${orderId}/payment-details`);
        response = await apiRequest(`/api/sales/orders/${orderId}/payment-details`, "GET");
        console.log(`MrkPaid: Payment details response:`, response);
      }

      let paymentData = null;
      if (response?.data) {
        paymentData = response.data;
      } else if (response?.response) {
        paymentData = response.response;
      } else {
        paymentData = response;
      }

      console.log("MrkPaid: Processed payment details:", paymentData);
      setPaymentDetails(paymentData);
      
    } catch (err) {
      console.error(`MrkPaid: Error fetching payment details for ${orderId}:`, err);
    }
  };

  // Handle order selection from dropdown
  const handleOrderSelect = (e) => {
    const orderId = e.target.value;
    console.log(`MrkPaid: Selected order ID: ${orderId}`);
    setSelectedOrderId(orderId);
    
    const order = incompleteOrders.find(o => {
      const id = o.id?.toString() || o.orderId?.toString();
      return id === orderId;
    });
    setSelectedOrder(order);
  };

  // Handle marking order as paid (adding payment)
  const handleMarkAsPaid = async () => {
    if (!selectedOrderId) {
      setError("Please select an order first");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setMarkingAsPaid(true);
    setError("");
    setSuccess("");

    try {
      console.log(`MrkPaid: Marking order ${selectedOrderId} as paid`);
      
      const response = await apiRequest(
        `/sales/orders/${selectedOrderId}/mark-paid`,
        "PUT",
        {}
      );

      console.log("MrkPaid: Mark as paid response:", response);

      const isSuccessful = 
        response?.status === 200 ||
        response?.status === 201 ||
        response?.message === "success" ||
        response?.data?.status === "success";

      if (isSuccessful) {
        setSuccess("✅ Order marked as paid successfully!");
        
        // Remove the order from the list
        setIncompleteOrders(prev => prev.filter(o => {
          const id = o.id?.toString() || o.orderId?.toString();
          return id !== selectedOrderId;
        }));
        
        setSelectedOrderId("");
        setSelectedOrder(null);
        setOrderDetails(null);
        setPaymentDetails(null);
        
        // Notify parent to refresh if needed
        if (onOrderUpdated) onOrderUpdated();
        
        setTimeout(() => {
          setSuccess("");
          if (toggleMrkPaidModal) toggleMrkPaidModal();
        }, 2000);
      } else {
        throw new Error("Failed to mark order as paid");
      }
      
    } catch (err) {
      console.error("MrkPaid: Error marking as paid:", err);
      setError(err?.message || "Failed to mark order as paid. Please try again.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setMarkingAsPaid(false);
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

  // Get customer name
  const getCustomerName = () => {
    if (!selectedOrder) return "N/A";
    return selectedOrder.customerName || 
           selectedOrder.customer?.name ||
           selectedOrder.buyerName ||
           "N/A";
  };

  // Get product reference
  const getProductReference = () => {
    if (!selectedOrder) return "N/A";
    return selectedOrder.referenceNo || 
           selectedOrder.orderNumber ||
           selectedOrder.id ||
           "N/A";
  };

  // Get account number
  const getAccountNumber = () => {
    if (!selectedOrder) return "N/A";
    return selectedOrder.accountNumber || 
           selectedOrder.accountNo ||
           selectedOrder.customer?.accountNumber ||
           "N/A";
  };

  // Get total amount
  const getTotalAmount = () => {
    if (!selectedOrder) return 0;
    return selectedOrder.totalAmount || selectedOrder.amount || 0;
  };

  // Get paid amount
  const getPaidAmount = () => {
    if (!selectedOrder) return 0;
    return selectedOrder.amountPaid || 0;
  };

  // Get remaining balance
  const getRemainingBalance = () => {
    const total = getTotalAmount();
    const paid = getPaidAmount();
    return total - paid;
  };

  // Get payment status
  const getPaymentStatus = () => {
    const percentage = calculatePaymentPercentage();
    if (percentage === 100) return "COMPLETED";
    if (percentage >= 50) return "MORE THAN 50%";
    if (percentage > 0) return "LESS THAN 50%";
    return "NO PAYMENT";
  };

  const filteredOrders = incompleteOrders.filter((order) => {
    if (customerTypeFilter === "ALL") return true;
    const label = getCustomerTypeLabel(order);
    return customerTypeFilter === "ONLINE" ? label === "ONLINE" : label === "WALK-IN";
  });

  const openCancelPopup = () => {
    setShowCancelPopup(true);
  };

  const closeCancelPopup = () => {
    setShowCancelPopup(false);
  };

  return (
    <div className="mrk-paid-modal-content">
      {/* Header */}
      <div className="mrk-paid-header mrk-paid-header-standard">
        <div className="mrk-paid-header-left">
          <img
            src={pmLogo}
            alt="PM Logo"
            className="mrk-paid-logo"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/pm-logo.png";
            }}
          />
        </div>
        <h2>MARKING AS PAID</h2>
        <div style={{ display: "flex", justifyContent: "center", margin: "0.4rem 0" }}>
          <BranchBadge />
        </div>
        <div className="mrk-paid-header-right">
          <Dashboard />
          <IoGridOutline className="mrk-paid-header-icon" />
          <button className="close-btn" onClick={toggleMrkPaidModal}>
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading order list with incomplete payment...</p>
        </div>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="alert alert-success">
          <strong>Success!</strong> {success}
        </div>
      )}

      {!loading && (
        <div className="mrk-paid-body">
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
              disabled={markingAsPaid}
            >
              <option value="ALL">All Customers</option>
              <option value="ONLINE">Online Customers</option>
              <option value="WALKIN">Walk-in Customers</option>
            </select>
          </div>

          {/* Order Selection Dropdown */}
          <div className="form-group">
            <label>SELECT ORDER WITH INCOMPLETE PAYMENT (&lt; 50%):</label>
            <select
              value={selectedOrderId}
              onChange={handleOrderSelect}
              className="order-select"
              disabled={markingAsPaid}
            >
              <option value="">-- Select an order --</option>
              {filteredOrders.map((order) => {
                  const orderId = order.id || order.orderId;
                  const customerName = order.customerName || "Unknown";
                  const totalAmount = getTotalAmountForOrder(order);
                  const paidAmount = order.amountPaid || 0;
                  const percentage = order.paymentPercentage || (totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0);
                  const customerTypeLabel = getCustomerTypeLabel(order);

                  return (
                    <option key={orderId} value={orderId}>
                      [{customerTypeLabel}] {customerName} - {formatCurrency(paidAmount)} paid ({Math.round(percentage)}%) - Order: {order.referenceNo || orderId}
                    </option>
                  );
                })}
            </select>
            <small className="helper-text">
              Showing only customers whose payment progress is below 50%. Customers on list: {filteredOrders.length} of {incompleteOrders.length}
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
                <p>Review payment status before continuing or cancelling this order.</p>
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
                  <strong>{formatCurrency(getRemainingBalance())}</strong>
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
                  {getCustomerTypeLabel(selectedOrder) === "WALK-IN" ? (
                    <>
                      <p
                        className="reference-link"
                        onClick={() => setShowPayInstallment((prev) => !prev)}
                        title="Click to pay the next installment on this order"
                      >
                        {getProductReference()}
                      </p>
                      {showPayInstallment && (
                        <button
                          type="button"
                          className="pay-installment-btn"
                          onClick={handlePayInstallment}
                          disabled={payingInstallment}
                        >
                          {payingInstallment ? "OPENING PAYSTACK..." : "PAY INSTALLMENT"}
                        </button>
                      )}
                    </>
                  ) : (
                    <p>{getProductReference()}</p>
                  )}
                </div>

                <div className="detail-item">
                  <label>ORDER DATE:</label>
                  <p>{selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString() : "N/A"}</p>
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
                  <label>REMAINING BALANCE:</label>
                  <p className="amount remaining">{formatCurrency(getRemainingBalance())}</p>
                </div>
                
                <div className="detail-item">
                  <label>PAYMENT STATUS:</label>
                  <p className={`status ${getPaymentStatus().toLowerCase().replace(/\s+/g, '-')}`}>
                    {getPaymentStatus()}
                  </p>
                </div>
              </div>

              {/* Payment Progress Bar */}
              <div className="payment-progress">
                <div className="progress-label">
                  <span>PAYMENT PROGRESS</span>
                  <span className="percentage">{calculatePaymentPercentage()}%</span>
                </div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${calculatePaymentPercentage()}%` }}
                  ></div>
                </div>
                <div className="progress-stats">
                  <span>Paid: {formatCurrency(getPaidAmount())}</span>
                  <span>Total: {formatCurrency(getTotalAmount())}</span>
                </div>
              </div>

              {/* View Details Button */}
              <button 
                className="view-details-btn"
                onClick={() => setShowPaymentDetails(!showPaymentDetails)}
                disabled={markingAsPaid}
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
                {incompleteOrders.length === 0
                  ? "No incomplete payments found in the current order list."
                  : "No incomplete payments found for the selected customer type."}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {selectedOrderId && (
            <div className="action-buttons">
              <button
                className="btn-cancel"
                onClick={openCancelPopup}
                disabled={markingAsPaid}
              >
                CANCEL ORDER
              </button>
            </div>
          )}
        </div>
      )}
      <CancelModal
        isOpen={showCancelPopup}
        toggleCancelModal={closeCancelPopup}
        initialOrderId={selectedOrderId}
        initialOrder={selectedOrder}
      />
    </div>
  );
};

// Helper function to get total amount for an order
const getTotalAmountForOrder = (order) => {
  return order.totalAmount || order.amount || 0;
};

export default MrkPaid;


// import React, { useState, useEffect } from "react";
// import { apiRequest } from "../../../../../lib/config";

// const MrkPaid = ({ toggleMrkPaidModal, onOrderUpdated }) => {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [incompleteOrders, setIncompleteOrders] = useState([]);
//   const [selectedOrder, setSelectedOrder] = useState(null);
//   const [selectedOrderId, setSelectedOrderId] = useState("");
//   const [orderDetails, setOrderDetails] = useState(null);
//   const [paymentDetails, setPaymentDetails] = useState(null);
//   const [showPaymentDetails, setShowPaymentDetails] = useState(false);
//   const [markingAsPaid, setMarkingAsPaid] = useState(false);
//   const [paymentAmount, setPaymentAmount] = useState("");
//   const [showPaymentModal, setShowPaymentModal] = useState(false);

//   // Fetch incomplete orders on component mount
//   useEffect(() => {
//     fetchIncompleteOrders();
//   }, []);

//   // Fetch order details when an order is selected
//   useEffect(() => {
//     if (selectedOrderId) {
//       fetchOrderDetails(selectedOrderId);
//       fetchPaymentDetails(selectedOrderId);
//     } else {
//       setOrderDetails(null);
//       setPaymentDetails(null);
//       setShowPaymentDetails(false);
//     }
//   }, [selectedOrderId]);

//   // Fetch all orders with incomplete payments (< 50% paid)
//   const fetchIncompleteOrders = async () => {
//     try {
//       setLoading(true);
//       setError("");
      
//       console.log("═══════════════════════════════════════════════════════════");
//       console.log("🔵 MrkPaid: Fetching incomplete payment orders (< 50%)");
//       console.log("═══════════════════════════════════════════════════════════");
      
//       // Fetch all orders and filter for < 50% payment
//       const response = await apiRequest("/sales/orders?size=500", "GET");
      
//       let ordersList = [];
//       if (response?.response?.content && Array.isArray(response.response.content)) {
//         ordersList = response.response.content;
//       } else if (Array.isArray(response)) {
//         ordersList = response;
//       } else if (response?.data && Array.isArray(response.data)) {
//         ordersList = response.data;
//       }
      
//       // Filter orders with payment progress < 50% and not paid
//       const filteredOrders = ordersList.filter(order => {
//         const totalAmount = order.totalAmount || 0;
//         const paidAmount = order.amountPaid || 0;
//         const paymentProgress = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
//         return paymentProgress < 50 && paymentProgress >= 0 && order.status !== "PAID";
//       });
      
//       console.log(`✅ Found ${filteredOrders.length} orders with < 50% payment`);
//       setIncompleteOrders(filteredOrders);
      
//       if (filteredOrders.length === 0) {
//         setError("No orders with incomplete payments found");
//       }
      
//     } catch (err) {
//       console.error("❌ Error fetching incomplete orders:", err);
//       setError("Failed to load orders. Please refresh the page.");
//       setIncompleteOrders([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fetch detailed order information
//   const fetchOrderDetails = async (orderId) => {
//     try {
//       console.log(`Fetching details for order ID: ${orderId}`);
      
//       const response = await apiRequest(`/sales/orders/${orderId}/details`, "GET");

//       let details = null;
//       if (response?.data) {
//         details = response.data;
//       } else if (response?.response) {
//         details = response.response;
//       } else {
//         details = response;
//       }

//       setOrderDetails(details);
//     } catch (err) {
//       console.error(`Error fetching order details:`, err);
//     }
//   };

//   // Fetch payment details for an order
//   const fetchPaymentDetails = async (orderId) => {
//     try {
//       console.log(`Fetching payment details for order ID: ${orderId}`);
      
//       const response = await apiRequest(`/sales/orders/${orderId}/payment-details`, "GET");

//       let paymentData = null;
//       if (response?.data) {
//         paymentData = response.data;
//       } else if (response?.response) {
//         paymentData = response.response;
//       } else {
//         paymentData = response;
//       }

//       setPaymentDetails(paymentData);
//     } catch (err) {
//       console.error(`Error fetching payment details:`, err);
//     }
//   };

//   // Handle order selection from dropdown
//   const handleOrderSelect = (e) => {
//     const orderId = e.target.value;
//     console.log(`Selected order ID: ${orderId}`);
//     setSelectedOrderId(orderId);
    
//     const order = incompleteOrders.find(o => o.id?.toString() === orderId);
//     setSelectedOrder(order);
//   };

//   // Handle marking order as paid (adding payment)
//   const handleMarkAsPaid = async () => {
//     if (!selectedOrderId) {
//       setError("Please select an order first");
//       setTimeout(() => setError(""), 3000);
//       return;
//     }

//     setMarkingAsPaid(true);
//     setError("");
//     setSuccess("");

//     try {
//       console.log(`Marking order ${selectedOrderId} as paid`);
      
//       // Call mark-paid endpoint
//       const response = await apiRequest(
//         `/sales/orders/${selectedOrderId}/mark-paid`,
//         "PUT",
//         {}
//       );

//       console.log("Mark as paid response:", response);

//       if (response?.status === 200 || response?.status === 201 || response?.success === true) {
//         setSuccess("✅ Payment recorded successfully!");
        
//         // Remove from current list
//         setIncompleteOrders(prev => prev.filter(o => o.id?.toString() !== selectedOrderId));
        
//         setSelectedOrderId("");
//         setSelectedOrder(null);
//         setOrderDetails(null);
//         setPaymentDetails(null);
        
//         // Notify parent to refresh
//         if (onOrderUpdated) onOrderUpdated();
        
//         setTimeout(() => {
//           setSuccess("");
//           // Optionally close modal
//           // toggleMrkPaidModal();
//         }, 2000);
//       } else {
//         throw new Error("Failed to record payment");
//       }
      
//     } catch (err) {
//       console.error("Error marking as paid:", err);
//       setError(err?.message || "Failed to record payment. Please try again.");
//       setTimeout(() => setError(""), 5000);
//     } finally {
//       setMarkingAsPaid(false);
//     }
//   };

//   // Calculate payment percentage
//   const calculatePaymentPercentage = () => {
//     if (!orderDetails) return 0;
//     const totalAmount = orderDetails.totalAmount || 0;
//     const paidAmount = orderDetails.amountPaid || 0;
//     if (totalAmount === 0) return 0;
//     return Math.round((paidAmount / totalAmount) * 100);
//   };

//   // Format currency
//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('en-NG', {
//       style: 'currency',
//       currency: 'NGN',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0
//     }).format(amount || 0);
//   };

//   // Format date
//   const formatDate = (dateString) => {
//     if (!dateString) return "N/A";
//     try {
//       return new Date(dateString).toLocaleDateString('en-GB');
//     } catch {
//       return "N/A";
//     }
//   };

//   // Get customer name
//   const getCustomerName = () => {
//     if (!orderDetails) return "N/A";
//     return orderDetails.customerName || 
//            orderDetails.customer?.name ||
//            orderDetails.buyerName ||
//            "N/A";
//   };

//   // Get product reference
//   const getProductReference = () => {
//     if (!orderDetails) return "N/A";
//     return orderDetails.referenceNo || 
//            orderDetails.orderNumber ||
//            orderDetails.id ||
//            "N/A";
//   };

//   // Get account number
//   const getAccountNumber = () => {
//     if (!orderDetails) return "N/A";
//     return orderDetails.accountNumber || 
//            orderDetails.accountNo ||
//            orderDetails.customer?.accountNumber ||
//            "N/A";
//   };

//   // Get remaining balance
//   const getRemainingBalance = () => {
//     if (!orderDetails) return 0;
//     const total = orderDetails.totalAmount || 0;
//     const paid = orderDetails.amountPaid || 0;
//     return total - paid;
//   };

//   // Get payment status
//   const getPaymentStatus = () => {
//     const percentage = calculatePaymentPercentage();
//     if (percentage === 100) return "COMPLETED";
//     if (percentage >= 50) return "MORE THAN 50%";
//     if (percentage > 0) return "LESS THAN 50%";
//     return "NO PAYMENT";
//   };

//   // Styles
//   const styles = {
//     modalContent: {
//       maxWidth: "900px",
//       margin: "0 auto",
//       backgroundColor: "white",
//       borderRadius: "12px",
//       overflow: "hidden"
//     },
//     header: {
//       display: "flex",
//       justifyContent: "space-between",
//       alignItems: "center",
//       padding: "20px 25px",
//       borderBottom: "2px solid #e8e8e8",
//       backgroundColor: "#f8f9fa"
//     },
//     title: {
//       margin: 0,
//       color: "#0867db",
//       fontSize: "1.5rem",
//       fontWeight: "700",
//       textTransform: "uppercase",
//       letterSpacing: "1px"
//     },
//     closeBtn: {
//       background: "none",
//       border: "none",
//       fontSize: "1.8rem",
//       cursor: "pointer",
//       color: "#666",
//       width: "36px",
//       height: "36px",
//       display: "flex",
//       alignItems: "center",
//       justifyContent: "center",
//       borderRadius: "50%",
//       transition: "all 0.3s"
//     },
//     alert: {
//       padding: "12px 20px",
//       margin: "15px 25px",
//       borderRadius: "8px",
//       fontSize: "0.9rem",
//       fontWeight: "500"
//     },
//     alertError: {
//       backgroundColor: "#f8d7da",
//       color: "#721c24",
//       border: "1px solid #f5c6cb"
//     },
//     alertSuccess: {
//       backgroundColor: "#d4edda",
//       color: "#155724",
//       border: "1px solid #c3e6cb"
//     },
//     formGroup: {
//       padding: "20px 25px"
//     },
//     label: {
//       display: "block",
//       fontSize: "0.85rem",
//       fontWeight: "700",
//       color: "#6c757d",
//       marginBottom: "8px",
//       textTransform: "uppercase",
//       letterSpacing: "0.5px"
//     },
//     select: {
//       width: "100%",
//       padding: "12px 15px",
//       border: "2px solid #e0e0e0",
//       borderRadius: "8px",
//       fontSize: "1rem",
//       backgroundColor: "white",
//       cursor: "pointer",
//       fontFamily: "inherit"
//     },
//     helperText: {
//       display: "block",
//       marginTop: "6px",
//       fontSize: "0.75rem",
//       color: "#666"
//     },
//     card: {
//       margin: "0 25px 25px",
//       padding: "20px",
//       border: "2px solid #0867db",
//       borderRadius: "12px",
//       backgroundColor: "#fff"
//     },
//     cardTitle: {
//       margin: "0 0 20px 0",
//       color: "#0867db",
//       fontSize: "1.2rem",
//       fontWeight: "700",
//       textTransform: "uppercase",
//       borderBottom: "2px solid #0867db",
//       display: "inline-block",
//       paddingBottom: "5px"
//     },
//     detailsGrid: {
//       display: "grid",
//       gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
//       gap: "15px",
//       marginBottom: "20px"
//     },
//     detailItem: {
//       padding: "8px"
//     },
//     detailLabel: {
//       display: "block",
//       fontSize: "0.7rem",
//       fontWeight: "600",
//       color: "#666",
//       textTransform: "uppercase",
//       marginBottom: "5px"
//     },
//     detailValue: {
//       margin: 0,
//       fontSize: "1rem",
//       fontWeight: "500",
//       color: "#333"
//     },
//     amount: {
//       fontWeight: "bold"
//     },
//     amountPaid: {
//       color: "#0867db"
//     },
//     amountRemaining: {
//       color: "#dc3545"
//     },
//     progressSection: {
//       margin: "20px 0",
//       padding: "15px",
//       backgroundColor: "#f8f9fa",
//       borderRadius: "8px"
//     },
//     progressLabel: {
//       display: "flex",
//       justifyContent: "space-between",
//       marginBottom: "8px",
//       fontSize: "0.85rem",
//       fontWeight: "600",
//       color: "#666"
//     },
//     progressBarWrapper: {
//       width: "100%",
//       height: "30px",
//       backgroundColor: "#e0e0e0",
//       borderRadius: "15px",
//       overflow: "hidden"
//     },
//     progressBarFill: {
//       height: "100%",
//       background: "linear-gradient(90deg, #0867db, #0a7bff)",
//       transition: "width 0.5s ease",
//       display: "flex",
//       alignItems: "center",
//       justifyContent: "flex-end",
//       paddingRight: "10px",
//       color: "white",
//       fontSize: "0.8rem",
//       fontWeight: "600"
//     },
//     progressStats: {
//       display: "flex",
//       justifyContent: "space-between",
//       marginTop: "8px",
//       fontSize: "0.8rem",
//       color: "#666"
//     },
//     viewDetailsBtn: {
//       width: "100%",
//       padding: "10px",
//       backgroundColor: "#f8f9fa",
//       border: "1px solid #dee2e6",
//       borderRadius: "8px",
//       fontSize: "0.9rem",
//       fontWeight: "600",
//       cursor: "pointer",
//       marginTop: "10px"
//     },
//     paymentTable: {
//       width: "100%",
//       borderCollapse: "collapse",
//       marginTop: "15px"
//     },
//     tableHeader: {
//       backgroundColor: "#f8f9fa",
//       padding: "10px",
//       textAlign: "left",
//       borderBottom: "2px solid #dee2e6",
//       fontWeight: "600"
//     },
//     tableCell: {
//       padding: "8px",
//       textAlign: "left",
//       borderBottom: "1px solid #e9ecef"
//     },
//     actionButtons: {
//       display: "flex",
//       gap: "15px",
//       padding: "20px 25px",
//       borderTop: "1px solid #e8e8e8",
//       justifyContent: "flex-end"
//     },
//     btnCancel: {
//       padding: "10px 25px",
//       backgroundColor: "#6c757d",
//       color: "white",
//       border: "none",
//       borderRadius: "6px",
//       fontSize: "0.9rem",
//       fontWeight: "600",
//       cursor: "pointer",
//       textTransform: "uppercase"
//     },
//     btnMarkPaid: {
//       padding: "10px 25px",
//       backgroundColor: "#28a745",
//       color: "white",
//       border: "none",
//       borderRadius: "6px",
//       fontSize: "0.9rem",
//       fontWeight: "600",
//       cursor: "pointer",
//       textTransform: "uppercase"
//     },
//     infoMessage: {
//       margin: "0 25px 25px",
//       padding: "15px",
//       textAlign: "center",
//       backgroundColor: "#e7f3ff",
//       borderRadius: "8px",
//       color: "#0867db"
//     },
//     loadingState: {
//       textAlign: "center",
//       padding: "50px",
//       color: "#666"
//     },
//     spinner: {
//       border: "3px solid #f3f3f3",
//       borderTop: "3px solid #0867db",
//       borderRadius: "50%",
//       width: "40px",
//       height: "40px",
//       animation: "spin 1s linear infinite",
//       margin: "0 auto 15px"
//     },
//     statusBadge: {
//       display: "inline-block",
//       padding: "4px 10px",
//       borderRadius: "20px",
//       fontSize: "0.7rem",
//       fontWeight: "600"
//     }
//   };

//   return (
//     <div style={styles.modalContent}>
//       {/* Header */}
//       <div style={styles.header}>
//         <h2 style={styles.title}>MARK ORDER AS PAID</h2>
//         <button onClick={toggleMrkPaidModal} style={styles.closeBtn}>×</button>
//       </div>

//       {/* Loading State */}
//       {loading && (
//         <div style={styles.loadingState}>
//           <div style={styles.spinner}></div>
//           <p>Loading orders...</p>
//         </div>
//       )}

//       {/* Error Message */}
//       {error && !loading && (
//         <div style={{ ...styles.alert, ...styles.alertError }}>
//           ⚠️ {error}
//         </div>
//       )}

//       {/* Success Message */}
//       {success && (
//         <div style={{ ...styles.alert, ...styles.alertSuccess }}>
//           ✅ {success}
//         </div>
//       )}

//       {!loading && (
//         <>
//           {/* Order Selection Dropdown */}
//           <div style={styles.formGroup}>
//             <label style={styles.label}>SELECT CUSTOMER WITH INCOMPLETE PAYMENT (&lt; 50%):</label>
//             <select 
//               value={selectedOrderId} 
//               onChange={handleOrderSelect}
//               style={styles.select}
//               disabled={markingAsPaid}
//             >
//               <option value="">-- Select an order --</option>
//               {incompleteOrders.map((order) => {
//                 const totalAmount = order.totalAmount || 0;
//                 const paidAmount = order.amountPaid || 0;
//                 const percentage = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;
//                 const customerName = order.customerName || "Unknown";
                
//                 return (
//                   <option key={order.id} value={order.id}>
//                     {customerName} - {formatCurrency(paidAmount)} paid ({percentage}%) - Order: {order.referenceNo || order.id}
//                   </option>
//                 );
//               })}
//             </select>
//             <small style={styles.helperText}>
//               Showing orders with less than 50% payment completion
//             </small>
//           </div>

//           {/* Order Details Card */}
//           {selectedOrderId && orderDetails && (
//             <div style={styles.card}>
//               <h3 style={styles.cardTitle}>ORDER DETAILS</h3>
              
//               <div style={styles.detailsGrid}>
//                 <div style={styles.detailItem}>
//                   <div style={styles.detailLabel}>CUSTOMER NAME:</div>
//                   <p style={styles.detailValue}>{getCustomerName()}</p>
//                 </div>
                
//                 <div style={styles.detailItem}>
//                   <div style={styles.detailLabel}>ACCOUNT NUMBER:</div>
//                   <p style={styles.detailValue}>{getAccountNumber()}</p>
//                 </div>
                
//                 <div style={styles.detailItem}>
//                   <div style={styles.detailLabel}>PRODUCT REFERENCE:</div>
//                   <p style={styles.detailValue}>{getProductReference()}</p>
//                 </div>
                
//                 <div style={styles.detailItem}>
//                   <div style={styles.detailLabel}>ORDER DATE:</div>
//                   <p style={styles.detailValue}>{formatDate(orderDetails.createdAt || orderDetails.orderDate)}</p>
//                 </div>
                
//                 <div style={styles.detailItem}>
//                   <div style={styles.detailLabel}>TOTAL AMOUNT:</div>
//                   <p style={{ ...styles.detailValue, ...styles.amount, color: "#2e7d32" }}>{formatCurrency(orderDetails.totalAmount)}</p>
//                 </div>
                
//                 <div style={styles.detailItem}>
//                   <div style={styles.detailLabel}>AMOUNT PAID:</div>
//                   <p style={{ ...styles.detailValue, ...styles.amountPaid }}>{formatCurrency(orderDetails.amountPaid)}</p>
//                 </div>
                
//                 <div style={styles.detailItem}>
//                   <div style={styles.detailLabel}>REMAINING BALANCE:</div>
//                   <p style={{ ...styles.detailValue, ...styles.amountRemaining }}>{formatCurrency(getRemainingBalance())}</p>
//                 </div>
                
//                 <div style={styles.detailItem}>
//                   <div style={styles.detailLabel}>PAYMENT STATUS:</div>
//                   <p style={styles.detailValue}>{getPaymentStatus()}</p>
//                 </div>
//               </div>

//               {/* Payment Progress Bar */}
//               <div style={styles.progressSection}>
//                 <div style={styles.progressLabel}>
//                   <span>PAYMENT PROGRESS</span>
//                   <span>{calculatePaymentPercentage()}%</span>
//                 </div>
//                 <div style={styles.progressBarWrapper}>
//                   <div style={{ ...styles.progressBarFill, width: `${calculatePaymentPercentage()}%` }}>
//                     {calculatePaymentPercentage()}%
//                   </div>
//                 </div>
//                 <div style={styles.progressStats}>
//                   <span>Paid: {formatCurrency(orderDetails.amountPaid)}</span>
//                   <span>Total: {formatCurrency(orderDetails.totalAmount)}</span>
//                 </div>
//               </div>

//               {/* View Details Button */}
//               <button 
//                 style={styles.viewDetailsBtn}
//                 onClick={() => setShowPaymentDetails(!showPaymentDetails)}
//                 onMouseEnter={(e) => e.target.style.backgroundColor = "#e9ecef"}
//                 onMouseLeave={(e) => e.target.style.backgroundColor = "#f8f9fa"}
//               >
//                 {showPaymentDetails ? "HIDE PAYMENT DETAILS" : "VIEW PAYMENT DETAILS"}
//               </button>

//               {/* Payment History */}
//               {showPaymentDetails && paymentDetails && (
//                 <div>
//                   <h4 style={{ margin: "15px 0 10px", fontSize: "1rem" }}>PAYMENT HISTORY</h4>
//                   {paymentDetails.payments && paymentDetails.payments.length > 0 ? (
//                     <table style={styles.paymentTable}>
//                       <thead>
//                         <tr>
//                           <th style={styles.tableHeader}>DATE</th>
//                           <th style={styles.tableHeader}>AMOUNT</th>
//                           <th style={styles.tableHeader}>METHOD</th>
//                           <th style={styles.tableHeader}>REFERENCE</th>
//                           <th style={styles.tableHeader}>STATUS</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {paymentDetails.payments.map((payment, index) => (
//                           <tr key={index}>
//                             <td style={styles.tableCell}>{formatDate(payment.date)}</td>
//                             <td style={styles.tableCell}>{formatCurrency(payment.amount)}</td>
//                             <td style={styles.tableCell}>{payment.method || "N/A"}</td>
//                             <td style={styles.tableCell}>{payment.reference || "N/A"}</td>
//                             <td style={styles.tableCell}>
//                               <span style={{ ...styles.statusBadge, backgroundColor: "#d4edda", color: "#155724" }}>
//                                 {payment.status || "COMPLETED"}
//                               </span>
//                             </td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   ) : (
//                     <p style={{ textAlign: "center", color: "#666", padding: "15px" }}>No payment history available</p>
//                   )}
//                 </div>
//               )}
//             </div>
//           )}

//           {/* No Order Selected Message */}
//           {!selectedOrderId && incompleteOrders.length > 0 && (
//             <div style={styles.infoMessage}>
//               <p>👈 Please select a customer from the dropdown to view order details</p>
//             </div>
//           )}

//           {/* No Orders Message */}
//           {incompleteOrders.length === 0 && !loading && (
//             <div style={{ ...styles.infoMessage, backgroundColor: "#d4edda", color: "#155724" }}>
//               <p>✅ All orders have been paid! No incomplete payments found.</p>
//             </div>
//           )}

//           {/* Action Buttons */}
//           {selectedOrderId && (
//             <div style={styles.actionButtons}>
//               <button 
//                 style={styles.btnCancel}
//                 onClick={toggleMrkPaidModal}
//                 disabled={markingAsPaid}
//                 onMouseEnter={(e) => e.target.style.backgroundColor = "#5a6268"}
//                 onMouseLeave={(e) => e.target.style.backgroundColor = "#6c757d"}
//               >
//                 CANCEL
//               </button>
//               <button 
//                 style={styles.btnMarkPaid}
//                 onClick={handleMarkAsPaid}
//                 disabled={markingAsPaid}
//                 onMouseEnter={(e) => e.target.style.backgroundColor = "#218838"}
//                 onMouseLeave={(e) => e.target.style.backgroundColor = "#28a745"}
//               >
//                 {markingAsPaid ? "PROCESSING..." : "MARK AS PAID"}
//               </button>
//             </div>
//           )}
//         </>
//       )}

//       <style>{`
//         @keyframes spin {
//           0% { transform: rotate(0deg); }
//           100% { transform: rotate(360deg); }
//         }
//       `}</style>
//     </div>
//   );
// };

// export default MrkPaid;

