import React, { useState, useEffect } from "react";
import { deliveryApi } from "../../../../lib/deliveryApi";
import { IoArrowBack } from "react-icons/io5";
import PMlogo from "../../../../assets/images/PMlogo.png";
import "../../../../Styles/Delivery/Delivery.css";

const DeliveryNotificationDetail = ({ notification, onClose }) => {
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("═══════════════════════════════════════════════════════════");
    console.log("🔵 DeliveryNotificationDetail: COMPONENT MOUNTED/UPDATED");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("DeliveryNotificationDetail: Notification prop:", notification);
    console.log("DeliveryNotificationDetail: Notification ID:", notification?.id || notification?.notificationId);
    console.log("DeliveryNotificationDetail: Notification keys:", Object.keys(notification || {}));
    
    if (notification?.id || notification?.notificationId) {
      const notificationId = notification.id || notification.notificationId;
      console.log("DeliveryNotificationDetail: ✅ Notification ID found:", notificationId);
      console.log("DeliveryNotificationDetail: Fetching detailed notification data...");
      fetchNotificationDetail();
    } else {
      console.log("DeliveryNotificationDetail: ⚠️ No notification ID, using provided data directly");
      console.log("DeliveryNotificationDetail: Using notification data:", notification);
      setDetailData(notification);
      setLoading(false);
    }
  }, [notification]);

  const fetchNotificationDetail = async () => {
    try {
      setLoading(true);
      setError("");
      const notificationId = notification.id || notification.notificationId;
      
      console.log("═══════════════════════════════════════════════════════════");
      console.log("🔵 DeliveryNotificationDetail: FETCHING DETAIL");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("DeliveryNotificationDetail: Notification ID:", notificationId);
      console.log("DeliveryNotificationDetail: API endpoint: /admin/delivery-notifications/" + notificationId);
      console.log("DeliveryNotificationDetail: Method: GET");
      console.log("DeliveryNotificationDetail: Making API request...");
      
      const response = await deliveryApi.getDeliveryNotificationById(notificationId);
      
      console.log("═══════════════════════════════════════════════════════════");
      console.log("✅ DeliveryNotificationDetail: API RESPONSE RECEIVED");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("DeliveryNotificationDetail: Raw API response:", response);
      console.log("DeliveryNotificationDetail: Response type:", typeof response);
      console.log("DeliveryNotificationDetail: Response keys:", Object.keys(response || {}));
      console.log("DeliveryNotificationDetail: Response.data exists?", !!response?.data);
      
      const notificationData = response;
      
      console.log("DeliveryNotificationDetail: Final notification data:", notificationData);
      console.log("DeliveryNotificationDetail: Sales Ref:", notificationData?.salesRef || notificationData?.orderId);
      console.log("DeliveryNotificationDetail: Product ID:", notificationData?.productId);
      console.log("DeliveryNotificationDetail: Product Name:", notificationData?.productName);
      console.log("DeliveryNotificationDetail: Rider Name:", notificationData?.riderName);
      console.log("DeliveryNotificationDetail: Delivery Address:", notificationData?.deliveryAddress);
      
      setDetailData(notificationData || notification);
      console.log("✅ DeliveryNotificationDetail: Detail data set successfully");
    } catch (err) {
      console.error("═══════════════════════════════════════════════════════════");
      console.error("❌ DeliveryNotificationDetail: ERROR FETCHING DETAIL");
      console.error("═══════════════════════════════════════════════════════════");
      console.error("DeliveryNotificationDetail: Error message:", err?.message);
      console.error("DeliveryNotificationDetail: Error stack:", err?.stack);
      console.error("DeliveryNotificationDetail: Full error:", err);
      console.log("⚠️ DeliveryNotificationDetail: Using provided notification as fallback");
      setError(err?.message || "Failed to load notification details. Using available data.");
      // Use provided notification data as fallback
      setDetailData(notification);
    } finally {
      setLoading(false);
      console.log("DeliveryNotificationDetail: Loading completed");
    }
  };

  if (loading) {
    return (
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1060]"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-lg p-10"
        >
          <p>Loading notification details...</p>
        </div>
      </div>
    );
  }

  if (error && !detailData) {
    return (
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1060]"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-lg p-10"
        >
          <p className="text-red-600">{error}</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-primary text-white rounded">
            Close
          </button>
        </div>
      </div>
    );
  }

  // Extract data with fallbacks
  const salesRef = detailData?.salesRef || detailData?.orderId || "-";
  const productId = detailData?.productId || "-";
  const productName = detailData?.productName || "-";
  const productDescription = detailData?.productDescription || detailData?.description || "-";
  const customerAddress = detailData?.deliveryAddress || detailData?.customerAddress || detailData?.address || "-";
  const riderId = detailData?.riderId || "-";
  const riderName = detailData?.riderName || "-";
  const riderPhone = detailData?.riderPhone || detailData?.riderPhoneNo || detailData?.phone || "-";
  const deliveryDate = detailData?.deliveryDate || detailData?.notificationDate || detailData?.date || "-";

  // Format date if it's a date string
  const formatDate = (dateString) => {
    if (!dateString || dateString === "-") return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1060] overflow-hidden"
      style={{ fontFamily: "Montserrat, sans-serif" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg border border-blue-100 max-w-[1200px] w-[95%] max-h-[90vh] p-10 shadow-lg overflow-hidden relative"
        style={{ fontFamily: "Montserrat, sans-serif" }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2.5rem" }}>
          <img
            src={PMlogo}
            alt="PM Logo"
            style={{ width: "55px", height: "55px", objectFit: "contain" }}
          />
          <h1 style={{
            fontFamily: "Montserrat, sans-serif",
            fontSize: "3rem",
            fontWeight: "700",
            color: "#0867db",
            textTransform: "uppercase",
            margin: 0
          }}>
            VIEW DETAILS
          </h1>
          <IoArrowBack
            style={{ fontSize: "2.4rem", color: "#0867db", cursor: "pointer" }}
            onClick={onClose}
          />
        </div>

        {/* Sales Ref */}
        <div style={{ marginBottom: "2.2rem" }}>
          <h2 style={{
            fontSize: "2.1rem",
            fontFamily: "Montserrat, sans-serif",
            fontWeight: "700",
            color: "#0867db",
            margin: 0
          }}>
            {salesRef}
          </h2>
        </div>

        {/* Main 3-column layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.1fr 0.9fr", gap: "2.5rem" }}>
          {/* LEFT: Product / Customer */}
          <div>
            <div style={{ marginBottom: "1.8rem" }}>
              <label style={{
                fontFamily: "Montserrat, sans-serif",
                fontSize: "1.4rem",
                fontWeight: "600",
                color: "#343a40",
                marginBottom: "0.8rem",
                display: "block"
              }}>
                Product ID:
              </label>
              <input
                type="text"
                value={productId}
                readOnly
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "1.3rem",
                  padding: "1rem 0",
                  width: "100%",
                  border: "none",
                  borderBottom: "1px solid #e0e0e0",
                  backgroundColor: "transparent",
                  outline: "none"
                }}
              />
            </div>

            <div style={{ marginBottom: "1.8rem" }}>
              <label style={{
                fontFamily: "Montserrat, sans-serif",
                fontSize: "1.4rem",
                fontWeight: "600",
                color: "#343a40",
                marginBottom: "0.8rem",
                display: "block"
              }}>
                Product Name:
              </label>
              <input
                type="text"
                value={productName}
                readOnly
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "1.3rem",
                  padding: "1rem 0",
                  width: "100%",
                  border: "none",
                  borderBottom: "1px solid #e0e0e0",
                  backgroundColor: "transparent",
                  outline: "none"
                }}
              />
            </div>

            <div style={{ marginBottom: "1.8rem" }}>
              <label style={{
                fontFamily: "Montserrat, sans-serif",
                fontSize: "1.4rem",
                fontWeight: "600",
                color: "#343a40",
                marginBottom: "0.8rem",
                display: "block"
              }}>
                Product Description
              </label>
              <textarea
                value={productDescription}
                readOnly
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "1.3rem",
                  padding: "1rem 0",
                  width: "100%",
                  border: "none",
                  borderBottom: "1px solid #e0e0e0",
                  minHeight: "70px",
                  resize: "none",
                  backgroundColor: "transparent",
                  outline: "none"
                }}
              />
            </div>

            <div>
              <label style={{
                fontFamily: "Montserrat, sans-serif",
                fontSize: "1.4rem",
                fontWeight: "600",
                color: "#343a40",
                marginBottom: "0.8rem",
                display: "block"
              }}>
                Customer Address
              </label>
              <textarea
                value={customerAddress}
                readOnly
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "1.3rem",
                  padding: "1rem 0",
                  width: "100%",
                  border: "none",
                  borderBottom: "1px solid #e0e0e0",
                  minHeight: "80px",
                  resize: "none",
                  backgroundColor: "transparent",
                  outline: "none"
                }}
              />
            </div>
          </div>

          {/* MIDDLE: Rider / Delivery */}
          <div>
            <div style={{ marginBottom: "1.8rem" }}>
              <label style={{
                fontFamily: "Montserrat, sans-serif",
                fontSize: "1.4rem",
                fontWeight: "600",
                color: "#343a40",
                marginBottom: "0.8rem",
                display: "block"
              }}>
                Rider&apos;s ID:
              </label>
              <input
                type="text"
                value={riderId}
                readOnly
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "1.3rem",
                  padding: "1rem 0",
                  width: "100%",
                  border: "none",
                  borderBottom: "1px solid #e0e0e0",
                  backgroundColor: "transparent",
                  outline: "none"
                }}
              />
            </div>

            <div style={{ marginBottom: "1.8rem" }}>
              <label style={{
                fontFamily: "Montserrat, sans-serif",
                fontSize: "1.4rem",
                fontWeight: "600",
                color: "#343a40",
                marginBottom: "0.8rem",
                display: "block"
              }}>
                Rider&apos;s name
              </label>
              <input
                type="text"
                value={riderName}
                readOnly
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "1.3rem",
                  padding: "1rem 0",
                  width: "100%",
                  border: "none",
                  borderBottom: "1px solid #e0e0e0",
                  backgroundColor: "transparent",
                  outline: "none"
                }}
              />
            </div>

            <div style={{ marginBottom: "1.8rem" }}>
              <label style={{
                fontFamily: "Montserrat, sans-serif",
                fontSize: "1.4rem",
                fontWeight: "600",
                color: "#343a40",
                marginBottom: "0.8rem",
                display: "block"
              }}>
                Rider&apos;s phone No
              </label>
              <input
                type="text"
                value={riderPhone}
                readOnly
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "1.3rem",
                  padding: "1rem 0",
                  width: "100%",
                  border: "none",
                  borderBottom: "1px solid #e0e0e0",
                  backgroundColor: "transparent",
                  outline: "none"
                }}
              />
            </div>

            <div>
              <label style={{
                fontFamily: "Montserrat, sans-serif",
                fontSize: "1.4rem",
                fontWeight: "600",
                color: "#343a40",
                marginBottom: "0.8rem",
                display: "block"
              }}>
                Delivery Date:
              </label>
              <input
                type="text"
                value={formatDate(deliveryDate)}
                readOnly
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "1.3rem",
                  padding: "1rem 0",
                  width: "100%",
                  border: "none",
                  borderBottom: "1px solid #e0e0e0",
                  backgroundColor: "transparent",
                  outline: "none"
                }}
              />
            </div>
          </div>

          {/* RIGHT: Images stacked */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <label style={{
                fontFamily: "Montserrat, sans-serif",
                fontSize: "1.4rem",
                fontWeight: "600",
                color: "#343a40",
                marginBottom: "0.8rem",
                display: "block"
              }}>
                Rider&apos;s Image
              </label>
              <div style={{
                height: "180px",
                border: "2px dashed #bdbdbd",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f5f5f5",
                marginBottom: "0.8rem"
              }}>
                <div style={{
                  color: "#999",
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "1.2rem"
                }}>
                  Image Placeholder
                </div>
              </div>
              <button style={{
                fontFamily: "Montserrat, sans-serif",
                fontSize: "1.2rem",
                color: "#0867db",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline"
              }}>
                View Bigger
              </button>
            </div>

            <div style={{ textAlign: "center" }}>
              <label style={{
                fontFamily: "Montserrat, sans-serif",
                fontSize: "1.4rem",
                fontWeight: "600",
                color: "#343a40",
                marginBottom: "0.8rem",
                display: "block"
              }}>
                Product Image
              </label>
              <div style={{
                height: "180px",
                border: "2px dashed #bdbdbd",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f5f5f5",
                marginBottom: "0.8rem"
              }}>
                <div style={{
                  color: "#999",
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "1.2rem"
                }}>
                  Image Placeholder
                </div>
              </div>
              <button style={{
                fontFamily: "Montserrat, sans-serif",
                fontSize: "1.2rem",
                color: "#0867db",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline"
              }}>
                View Bigger
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryNotificationDetail;
