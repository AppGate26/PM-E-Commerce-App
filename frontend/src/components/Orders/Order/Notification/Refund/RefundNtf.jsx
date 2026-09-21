import React, { useState, useEffect } from "react";
import Dashboard from "../../../../ui/DashboardBtn";
import { apiRequest } from "../../../../../lib/config";
import { FaTimes } from "react-icons/fa";
import { IoGridOutline } from "react-icons/io5";
import pmLogo from "../../../../../assets/images/PMlogo.png";

const RefundNtf = ({ toggleNtfRefundModal }) => {
  const closeModal = () => {
    toggleNtfRefundModal();
  };

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [refundDetails, setRefundDetails] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");
      
      console.log("═══════════════════════════════════════════════════════════");
      console.log("RefundNtf: FETCHING REFUND NOTIFICATIONS");
      console.log("═══════════════════════════════════════════════════════════");

      const response = await apiRequest("/sales/notifications/refund", "GET");

      let notificationsList = [];
      if (Array.isArray(response)) {
        notificationsList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        notificationsList = response.data;
      } else if (response?.response && Array.isArray(response.response)) {
        notificationsList = response.response;
      }

      console.log(`Loaded ${notificationsList.length} refund notifications`);
      setNotifications(notificationsList);
      
    } catch (err) {
      console.error("Error fetching refund notifications:", err);
      setError(err.message || "Failed to load refund notifications.");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (notification) => {
    setSelectedNotification(notification);
    setShowDetailModal(true);
    setLoadingDetails(true);
    
    try {
      // Store refund details from notification
      setRefundDetails({
        amount: notification.amountToRefund || notification.amount || 0,
        reason: notification.reason || notification.message || "Refund processed",
        refundDate: notification.refundDate || notification.createdAt,
        refundReference: notification.refundReference || notification.id
      });
      
      // Try to fetch order details if order ID is available
      const orderId = notification.orderId || notification.id;
      if (orderId) {
        const response = await apiRequest(`/sales/orders/${orderId}/details`, "GET");
        
        let details = null;
        if (response?.data) {
          details = response.data;
        } else if (response?.response) {
          details = response.response;
        } else {
          details = response;
        }
        
        setOrderDetails(details);
        console.log("Order details fetched:", details);
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedNotification(null);
    setOrderDetails(null);
    setRefundDetails(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "N/A";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Styles with Blue theme
  const styles = {
    container: {
      maxWidth: "1080px",
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
      fontSize: "1.6rem",
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
    tableContainer: {
      overflowX: "auto",
      borderRadius: "12px",
      border: "1px solid #cfdef2",
      backgroundColor: "#fff"
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "0.875rem"
    },
    th: {
      padding: "14px 16px",
      textAlign: "left",
      backgroundColor: "#eef5ff",
      fontWeight: "700",
      color: "#2c4d7e",
      borderBottom: "1px solid #e5e7eb",
      fontSize: "0.86rem",
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    },
    td: {
      padding: "12px 16px",
      borderBottom: "1px solid #f3f4f6",
      color: "#1f2937"
    },
    viewBtn: {
      padding: "8px 16px",
      backgroundColor: "#1b5cb8",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "0.8rem",
      fontWeight: "700",
      cursor: "pointer",
      transition: "all 0.2s ease"
    },
    emptyState: {
      textAlign: "center",
      padding: "48px",
      color: "#6b7280"
    },
    loadingSpinner: {
      textAlign: "center",
      padding: "48px",
      color: "#6b7280"
    },
    spinner: {
      border: "3px solid #f3f4f6",
      borderTop: "3px solid #1b5cb8",
      borderRadius: "50%",
      width: "32px",
      height: "32px",
      animation: "spin 1s linear infinite",
      margin: "0 auto 12px"
    },
    alert: {
      padding: "12px 20px",
      borderRadius: "8px",
      marginBottom: "12px",
      fontSize: "0.9rem",
      fontWeight: "500",
      textAlign: "center",
      backgroundColor: "#fff4e5",
      color: "#8a5b12",
      border: "1px solid #ffd9a8"
    }
  };

  // Detail Modal Styles with Blue theme
  const modalStyles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      height: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10000,
      animation: "fadeIn 0.2s ease",
    },
    modal: {
      backgroundColor: "white",
      borderRadius: "18px",
      width: "90%",
      maxWidth: "720px",
      maxHeight: "90vh",
      overflowY: "auto",
      border: "1px solid #d2e1f6",
      boxShadow: "0 24px 48px rgba(16, 43, 84, 0.28)",
      animation: "slideUp 0.3s ease"
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 20px",
      borderBottom: "1px solid #d7e6fb",
      background: "linear-gradient(90deg, #103b7a 0%, #1b5cb8 100%)",
      borderRadius: "18px 18px 0 0"
    },
    title: {
      margin: 0,
      fontSize: "1.15rem",
      fontWeight: "700",
      color: "#eff6ff",
      letterSpacing: "0.02em",
      textTransform: "uppercase"
    },
    closeModalBtn: {
      background: "transparent",
      border: "none",
      fontSize: "1rem",
      cursor: "pointer",
      color: "#eff6ff",
      width: "32px",
      height: "32px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "8px",
      transition: "all 0.2s ease"
    },
    content: {
      padding: "20px"
    },
    section: {
      marginBottom: "16px"
    },
    sectionTitle: {
      fontSize: "0.82rem",
      fontWeight: "700",
      color: "#375b8f",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      marginBottom: "12px",
      borderLeft: "3px solid #1b5cb8",
      paddingLeft: "12px"
    },
    infoGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "10px",
      backgroundColor: "#f7faff",
      padding: "14px",
      borderRadius: "12px",
      border: "1px solid #dbe7f8"
    },
    infoItem: {
      display: "flex",
      flexDirection: "column",
      gap: "4px"
    },
    infoLabel: {
      fontSize: "0.68rem",
      fontWeight: "600",
      color: "#6b7280",
      textTransform: "uppercase"
    },
    infoValue: {
      fontSize: "0.94rem",
      fontWeight: "600",
      color: "#152b4c"
    },
    amountValue: {
      fontSize: "0.98rem",
      fontWeight: "700",
      color: "#1b5cb8"
    },
    paidValue: {
      fontSize: "0.98rem",
      fontWeight: "700",
      color: "#0f7a45"
    },
    messageBox: {
      backgroundColor: "#eef6ff",
      padding: "12px 14px",
      borderRadius: "10px",
      border: "1px solid #d6e6fb",
      borderLeft: "4px solid #1b5cb8"
    },
    messageText: {
      margin: 0,
      fontSize: "0.9rem",
      color: "#1b5cb8",
      lineHeight: "1.55"
    },
    statusBadge: {
      display: "inline-block",
      padding: "5px 12px",
      borderRadius: "20px",
      fontSize: "0.75rem",
      fontWeight: "700",
      backgroundColor: "#dcfce7",
      color: "#166534",
      border: "1px solid #bbf7d0"
    },
    loadingDetails: {
      textAlign: "center",
      padding: "40px",
      color: "#6b7280"
    },
    footerAction: {
      marginTop: "8px",
      display: "flex",
      justifyContent: "flex-end"
    },
    closeActionBtn: {
      padding: "10px 20px",
      backgroundColor: "#1b5cb8",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "0.86rem",
      fontWeight: "700",
      cursor: "pointer",
      transition: "all 0.2s ease"
    }
  };

  return (
    <>
      <div style={styles.container}>
                {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <img
              src={pmLogo}
              alt='PM Logo'
              style={styles.logo}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/pm-logo.png";
              }}
            />
          </div>
          <h1 style={styles.title}>REFUND NOTIFICATIONS</h1>
          <div style={styles.headerRight}>
            <Dashboard />
            <IoGridOutline style={styles.headerIcon} />
            <button
              onClick={closeModal}
              style={styles.closeBtn}
              onMouseEnter={(e) =>
                (e.target.style.backgroundColor = "rgba(255, 255, 255, 0.15)")
              }
              onMouseLeave={(e) =>
                (e.target.style.backgroundColor = "transparent")
              }
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={styles.alert}>Alert: {error}</div>
        )}

        {/* Loading State */}
        {loading ? (
          <div style={styles.loadingSpinner}>
            <div style={styles.spinner}></div>
            <p>Loading refund notifications...</p>
          </div>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Customer Name</th>
                  <th style={styles.th}>Notification</th>
                  <th style={styles.th}>Refund Date</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {notifications.length > 0 ? (
                  notifications.map((notification, index) => (
                    <tr key={notification.id || index}>
                      <td style={styles.td}>{index + 1}</td>
                      <td style={styles.td}>
                        <strong>{notification.customerName || notification.name || notification.customer?.customerName || "N/A"}</strong>
                      </td>
                      <td style={styles.td}>
                        {notification.message || notification.notification || `Refund: ${formatCurrency(notification.amountToRefund || notification.amount || 0)}`}
                      </td>
                      <td style={styles.td}>
                        {formatDate(notification.refundDate || notification.createdAt)}
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={() => handleViewDetails(notification)}
                          style={styles.viewBtn}
                          onMouseEnter={(e) => e.target.style.backgroundColor = "#144a94"}
                          onMouseLeave={(e) => e.target.style.backgroundColor = "#1b5cb8"}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ ...styles.td, textAlign: "center" }}>
                      <div style={styles.emptyState}>
                        No refund notifications found
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && (
        <div style={modalStyles.overlay} onClick={closeDetailModal}>
          <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={modalStyles.header}>
              <h3 style={modalStyles.title}>Refund Order Details</h3>
              <button
                onClick={closeDetailModal}
                style={modalStyles.closeModalBtn}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "rgba(255,255,255,0.16)")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "transparent")
                }
              >
                <FaTimes />
              </button>
            </div>
            
            <div style={modalStyles.content}>
              {loadingDetails ? (
                <div style={modalStyles.loadingDetails}>
                  <div style={styles.spinner}></div>
                  <p>Loading refund details...</p>
                </div>
              ) : (
                <>
                  {/* Customer Information */}
                  <div style={modalStyles.section}>
                    <h4 style={modalStyles.sectionTitle}>Customer Information</h4>
                    <div style={modalStyles.infoGrid}>
                      <div style={modalStyles.infoItem}>
                        <span style={modalStyles.infoLabel}>Customer Name</span>
                        <span style={modalStyles.infoValue}>
                          {selectedNotification?.customerName || 
                           selectedNotification?.name || 
                           orderDetails?.customerName || 
                           "N/A"}
                        </span>
                      </div>
                      <div style={modalStyles.infoItem}>
                        <span style={modalStyles.infoLabel}>Account Number</span>
                        <span style={modalStyles.infoValue}>
                          {orderDetails?.accountNumber || 
                           selectedNotification?.accountNumber || 
                           "N/A"}
                        </span>
                      </div>
                      <div style={modalStyles.infoItem}>
                        <span style={modalStyles.infoLabel}>Phone Number</span>
                        <span style={modalStyles.infoValue}>
                          {orderDetails?.phoneNumber || 
                           selectedNotification?.phoneNumber || 
                           "N/A"}
                        </span>
                      </div>
                      <div style={modalStyles.infoItem}>
                        <span style={modalStyles.infoLabel}>Email</span>
                        <span style={modalStyles.infoValue}>
                          {orderDetails?.email || 
                           selectedNotification?.email || 
                           "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Refund Information */}
                  <div style={modalStyles.section}>
                    <h4 style={modalStyles.sectionTitle}>Refund Information</h4>
                    <div style={modalStyles.infoGrid}>
                      <div style={modalStyles.infoItem}>
                        <span style={modalStyles.infoLabel}>Refund Reference</span>
                        <span style={modalStyles.infoValue}>
                          {refundDetails?.refundReference || selectedNotification?.refundReference || selectedNotification?.id || "N/A"}
                        </span>
                      </div>
                      <div style={modalStyles.infoItem}>
                        <span style={modalStyles.infoLabel}>Refund Amount</span>
                        <span style={modalStyles.amountValue}>
                          {formatCurrency(refundDetails?.amount || selectedNotification?.amountToRefund || selectedNotification?.amount || 0)}
                        </span>
                      </div>
                      <div style={modalStyles.infoItem}>
                        <span style={modalStyles.infoLabel}>Refund Date</span>
                        <span style={modalStyles.infoValue}>
                          {formatDate(refundDetails?.refundDate || selectedNotification?.refundDate || selectedNotification?.createdAt)}
                        </span>
                      </div>
                      <div style={modalStyles.infoItem}>
                        <span style={modalStyles.infoLabel}>Status</span>
                        <span>
                          <span style={modalStyles.statusBadge}>REFUNDED</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Information */}
                  <div style={modalStyles.section}>
                    <h4 style={modalStyles.sectionTitle}>Order Information</h4>
                    <div style={modalStyles.infoGrid}>
                      <div style={modalStyles.infoItem}>
                        <span style={modalStyles.infoLabel}>Order ID</span>
                        <span style={modalStyles.infoValue}>
                          {selectedNotification?.orderId || 
                           selectedNotification?.id || 
                           orderDetails?.id || 
                           "N/A"}
                        </span>
                      </div>
                      <div style={modalStyles.infoItem}>
                        <span style={modalStyles.infoLabel}>Product Reference</span>
                        <span style={modalStyles.infoValue}>
                          {orderDetails?.referenceNo || 
                           selectedNotification?.referenceNo || 
                           "N/A"}
                        </span>
                      </div>
                      <div style={modalStyles.infoItem}>
                        <span style={modalStyles.infoLabel}>Product Name</span>
                        <span style={modalStyles.infoValue}>
                          {orderDetails?.productName || 
                           selectedNotification?.productName || 
                           "N/A"}
                        </span>
                      </div>
                      <div style={modalStyles.infoItem}>
                        <span style={modalStyles.infoLabel}>Order Date</span>
                        <span style={modalStyles.infoValue}>
                          {formatDate(orderDetails?.createdAt || selectedNotification?.createdAt)}
                        </span>
                      </div>
                      <div style={modalStyles.infoItem}>
                        <span style={modalStyles.infoLabel}>Original Amount</span>
                        <span style={modalStyles.amountValue}>{formatCurrency(orderDetails?.totalAmount || orderDetails?.amount || 0)}
                        </span>
                      </div>
                      <div style={modalStyles.infoItem}>
                        <span style={modalStyles.infoLabel}>Amount Paid</span>
                        <span style={modalStyles.paidValue}>{formatCurrency(orderDetails?.amountPaid || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Refund Reason */}
                  <div style={modalStyles.section}>
                    <h4 style={modalStyles.sectionTitle}>Refund Reason</h4>
                    <div style={modalStyles.messageBox}>
                      <p style={modalStyles.messageText}>
                        {refundDetails?.reason || 
                         selectedNotification?.reason || 
                         selectedNotification?.message || 
                         selectedNotification?.notification || 
                         "Refund processed successfully"}
                      </p>
                    </div>
                  </div>

                  {/* Close Button */}
                  <div style={modalStyles.footerAction}>
                    <button
                      onClick={closeDetailModal}
                      style={modalStyles.closeActionBtn}
                      onMouseEnter={(e) =>
                        (e.target.style.backgroundColor = "#144a94")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.backgroundColor = "#1b5cb8")
                      }
                    >
                      CLOSE DETAILS
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default RefundNtf;


