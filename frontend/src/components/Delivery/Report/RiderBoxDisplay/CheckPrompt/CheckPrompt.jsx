import React from "react";
import { Link } from "react-router-dom";

const CheckPrompt = ({
  isOpen,
  checkToggleModal,
  reportData = [],
  reportType = "all",
  startDate = "",
  endDate = "",
  riderId = "",
  riders = [],
}) => {
  if (!isOpen) return null;

  const closeModal = () => {
    checkToggleModal();
  };

  const getRiderName = () => {
    const rider = riders.find((r) => (r.id || r.riderId) === riderId);
    if (rider) {
      return rider.firstName && rider.lastName
        ? `${rider.firstName} ${rider.lastName}`
        : rider.fullName || rider.name || "Unknown";
    }
    return "Unknown";
  };

  const getReportTitle = () => {
    switch (reportType) {
      case "byDate":
        return "RIDER BOX DISPLAY - BY DATE";
      case "salesRef":
        return "RIDER BOX DISPLAY - BY SALES REFERENCE";
      case "boxed":
        return "RIDER BOX DISPLAY - BY BOXED ITEMS";
      default:
        return "RIDER BOX DISPLAY - ALL REPORTS";
    }
  };

  // Inline styles
  const styles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      zIndex: 2000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
    },
    modal: {
      backgroundColor: "#ffffff",
      borderRadius: "8px",
      width: "95%",
      maxWidth: "1400px",
      maxHeight: "90vh",
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      overflow: "hidden",
    },
    header: {
      backgroundColor: "#f8f9fa",
      padding: "20px 30px",
      borderBottom: "2px solid #dee2e6",
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    dashboardBtn: {
      position: "absolute",
      left: "30px",
      top: "50%",
      transform: "translateY(-50%)",
      backgroundColor: "#0066cc",
      color: "#ffffff",
      border: "none",
      borderRadius: "6px",
      padding: "8px 20px",
      fontSize: "14px",
      fontWeight: "600",
      textDecoration: "none",
      cursor: "pointer",
    },
    headerTitle: {
      margin: 0,
      textAlign: "center",
      color: "#0066cc",
      fontSize: "20px",
      fontWeight: "700",
      textTransform: "uppercase",
    },
    closeBtn: {
      position: "absolute",
      right: "30px",
      top: "50%",
      transform: "translateY(-50%)",
      background: "transparent",
      border: "none",
      fontSize: "24px",
      cursor: "pointer",
      color: "#0066cc",
      fontWeight: "bold",
      width: "35px",
      height: "35px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "50%",
      transition: "background-color 0.2s",
    },
    companyInfo: {
      backgroundColor: "#ffffff",
      padding: "20px 30px",
      borderBottom: "1px solid #dee2e6",
      textAlign: "center",
    },
    companyName: {
      margin: "0 0 5px 0",
      fontSize: "18px",
      fontWeight: "700",
      color: "#333333",
      textTransform: "uppercase",
      letterSpacing: "1px",
    },
    companyAddress: {
      margin: "0",
      fontSize: "14px",
      color: "#666666",
    },
    companyPhone: {
      margin: "5px 0 0 0",
      fontSize: "14px",
      color: "#666666",
    },
    reportInfo: {
      display: "flex",
      justifyContent: "space-between",
      padding: "15px 30px",
      backgroundColor: "#f8f9fa",
      borderBottom: "1px solid #dee2e6",
      fontSize: "14px",
      color: "#333333",
    },
    tableContainer: {
      flex: 1,
      overflow: "auto",
      padding: "20px 30px",
    },
    emptyState: {
      textAlign: "center",
      padding: "60px 20px",
      color: "#999999",
    },
    emptyIcon: {
      fontSize: "48px",
      marginBottom: "15px",
    },
    table: {
      width: "100%",
      minWidth: "1000px",
      borderCollapse: "collapse",
      fontSize: "14px",
    },
    th: {
      padding: "14px 12px",
      textAlign: "left",
      fontWeight: "600",
      fontSize: "13px",
      backgroundColor: "#0066cc",
      color: "#ffffff",
      borderBottom: "2px solid #ffffff",
      textTransform: "uppercase",
    },
    td: {
      padding: "12px",
      borderBottom: "1px solid #dee2e6",
      color: "#333333",
    },
    trEven: {
      backgroundColor: "#ffffff",
    },
    trOdd: {
      backgroundColor: "#f8f9fa",
    },
    footer: {
      borderTop: "1px solid #dee2e6",
      padding: "15px 30px",
      backgroundColor: "#f8f9fa",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    recordCount: {
      color: "#666666",
      fontSize: "14px",
      fontWeight: "500",
    },
    closeFooterBtn: {
      padding: "8px 24px",
      fontSize: "14px",
      fontWeight: "600",
      backgroundColor: "#6c757d",
      color: "#ffffff",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      transition: "background-color 0.2s",
    },
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <Link to="/adminDashboard" style={styles.dashboardBtn}>
            Dashboard
          </Link>

          <h3 style={styles.headerTitle}>{getReportTitle()}</h3>

          <button
            style={styles.closeBtn}
            onClick={closeModal}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#e9ecef")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            ✕
          </button>
        </div>

        {/* Company Info */}
        <div style={styles.companyInfo}>
          <h4 style={styles.companyName}>PM MARKET HUB</h4>
          <p style={styles.companyAddress}>64 OGUI ROAD, ENUGU-STATE</p>
          <p style={styles.companyPhone}>TEL: 080XXXXX</p>
        </div>

        {/* Report Info */}
        <div style={styles.reportInfo}>
          <div>
            <strong>Rider:</strong> {getRiderName()} ({riderId})
          </div>
          <div>
            <strong>Period:</strong>{" "}
            {startDate
              ? new Date(startDate).toLocaleDateString()
              : "Not specified"}{" "}
            -{" "}
            {endDate
              ? new Date(endDate).toLocaleDateString()
              : "Not specified"}
          </div>
        </div>

        {/* Table Container */}
        <div style={styles.tableContainer}>
          {reportData.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📋</div>
              <p style={{ fontSize: "16px", margin: 0 }}>
                No data available for this report
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>S/N</th>
                    <th style={styles.th}>DATE</th>
                    <th style={styles.th}>PRODUCT ID</th>
                    <th style={styles.th}>RIDER&apos;S NAME</th>
                    <th style={styles.th}>PRODUCT NAME</th>
                    <th style={styles.th}>DESCRIPTION</th>
                    <th style={styles.th}>QUANTITY</th>
                    {(reportType === "boxed" || reportType === "all") && (
                      <th style={styles.th}>BOXED</th>
                    )}
                    {(reportType === "salesRef" || reportType === "all") && (
                      <th style={styles.th}>SALES REF</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((item, index) => (
                    <tr
                      key={item.id || index}
                      style={index % 2 === 0 ? styles.trEven : styles.trOdd}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.backgroundColor = "#e9ecef")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          index % 2 === 0 ? "#ffffff" : "#f8f9fa")
                      }
                    >
                      <td style={styles.td}>{index + 1}</td>
                      <td style={styles.td}>
                        {item.date
                          ? new Date(item.date).toLocaleDateString()
                          : item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString()
                          : "-"}
                      </td>
                      <td style={styles.td}>
                        {item.productId || item.product_id || "-"}
                      </td>
                      <td style={styles.td}>
                        {item.riderName || item.rider_name || getRiderName()}
                      </td>
                      <td style={styles.td}>
                        {item.productName || item.product_name || "-"}
                      </td>
                      <td style={styles.td}>
                        {item.description || item.productDescription || "-"}
                      </td>
                      <td style={styles.td}>{item.quantity || "-"}</td>
                      {(reportType === "boxed" || reportType === "all") && (
                        <td style={styles.td}>
                          {item.boxed || item.totalBoxed || item.totalBox || "-"}
                        </td>
                      )}
                      {(reportType === "salesRef" || reportType === "all") && (
                        <td style={styles.td}>
                          {item.salesRef ||
                            item.salesReference ||
                            item.reference ||
                            "-"}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.recordCount}>
            Total Records:{" "}
            <strong style={{ color: "#333333" }}>{reportData.length}</strong>
          </span>
          <button
            style={styles.closeFooterBtn}
            onClick={closeModal}
            onMouseOver={(e) =>
              (e.target.style.backgroundColor = "#5a6268")
            }
            onMouseOut={(e) =>
              (e.target.style.backgroundColor = "#6c757d")
            }
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckPrompt;