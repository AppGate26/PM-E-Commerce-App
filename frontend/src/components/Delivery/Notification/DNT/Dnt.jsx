import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import BranchBadge from "../../../shared/BranchBadge";
import { deliveryApi } from "../../../../lib/deliveryApi";
import "../../../../Styles/Delivery/Delivery.css";
import DeliveryNotificationDetail from "./DeliveryNotificationDetail";

const Dnt = ({ toggleDntModal }) => {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    filterNotifications();
  }, [searchQuery, notifications]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("🔵 DNT: ========== FETCHING DELIVERY NOTIFICATIONS ==========");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("Dnt: API endpoint: /admin/delivery-notifications");
      console.log("Dnt: Method: GET");
      console.log("Dnt: Making API request...");
      
      const response = await deliveryApi.getDeliveryNotifications();
      
      console.log("═══════════════════════════════════════════════════════════");
      console.log("✅ Dnt: API RESPONSE RECEIVED");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("Dnt: Raw API response:", response);
      console.log("Dnt: Response type:", typeof response);
      console.log("Dnt: Is array?", Array.isArray(response));
      console.log("Dnt: Response keys:", Object.keys(response || {}));
      console.log("Dnt: Response.data exists?", !!response?.data);
      console.log("Dnt: Response.data is array?", Array.isArray(response?.data));
      
      const notificationsList = Array.isArray(response) ? response : [];

      if (notificationsList.length > 0) {
        console.log("═══════════════════════════════════════════════════════════");
        console.log("📋 Dnt: FIRST NOTIFICATION SAMPLE");
        console.log("═══════════════════════════════════════════════════════════");
        console.log("Dnt: First notification:", notificationsList[0]);
        console.log("Dnt: First notification keys:", Object.keys(notificationsList[0]));
        console.log("Dnt: First notification ID:", notificationsList[0].id);
        console.log("Dnt: First notification orderId:", notificationsList[0].orderId);
        console.log("Dnt: First notification salesRef:", notificationsList[0].salesRef);
        console.log("Dnt: First notification productId:", notificationsList[0].productId);
        console.log("Dnt: First notification productName:", notificationsList[0].productName);
        console.log("Dnt: First notification riderName:", notificationsList[0].riderName);
        console.log("Dnt: First notification quantity:", notificationsList[0].quantityDelivered || notificationsList[0].quantity);
        
        if (notificationsList.length > 1) {
          console.log("Dnt: All notifications count:", notificationsList.length);
          console.log("Dnt: Last notification:", notificationsList[notificationsList.length - 1]);
        }
      } else {
        console.warn("⚠️ Dnt: No notifications found in response");
      }

      setNotifications(notificationsList);
      setFilteredNotifications(notificationsList);
      console.log("═══════════════════════════════════════════════════════════");
      console.log(`✅ Dnt: SUCCESS - Loaded ${notificationsList.length} notifications`);
      console.log("═══════════════════════════════════════════════════════════");
    } catch (err) {
      console.error("═══════════════════════════════════════════════════════════");
      console.error("❌ Dnt: ERROR FETCHING NOTIFICATIONS");
      console.error("═══════════════════════════════════════════════════════════");
      console.error("Dnt: Error message:", err?.message);
      console.error("Dnt: Error stack:", err?.stack);
      console.error("Dnt: Error name:", err?.name);
      console.error("Dnt: Full error object:", err);
      const errorMsg = err?.message || "Failed to load delivery notifications. Please refresh the page.";
      setError(errorMsg);
      setNotifications([]);
      setFilteredNotifications([]);
    } finally {
      setLoading(false);
      console.log("Dnt: Fetch completed. Loading state set to false.");
    }
  };

  const filterNotifications = () => {
    if (!searchQuery.trim()) {
      setFilteredNotifications(notifications);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = notifications.filter((notification) => {
      const salesRef = (notification.salesRef || notification.orderId || "").toLowerCase();
      const productId = (notification.productId || "").toLowerCase();
      const productName = (notification.productName || "").toLowerCase();
      const riderName = (notification.riderName || "").toLowerCase();
      return salesRef.includes(query) || productId.includes(query) || productName.includes(query) || riderName.includes(query);
    });
    setFilteredNotifications(filtered);
  };

  const handleView = (notification) => {
    console.log("═══════════════════════════════════════════════════════════");
    console.log("🔵 Dnt: ========== VIEW BUTTON CLICKED ==========");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("Dnt: Notification object:", notification);
    console.log("Dnt: Notification ID:", notification?.id || notification?.notificationId);
    console.log("Dnt: Notification keys:", Object.keys(notification || {}));
    console.log("Dnt: Sales Ref:", notification?.salesRef || notification?.orderId);
    console.log("Dnt: Product ID:", notification?.productId);
    console.log("Dnt: Product Name:", notification?.productName);
    console.log("Dnt: Rider Name:", notification?.riderName);
    console.log("Dnt: Opening detail modal...");
    setSelectedNotification(notification);
    setShowDetailModal(true);
    console.log("✅ Dnt: Detail modal state set to true");
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedNotification(null);
  };

  const closeModal = () => {
    toggleDntModal();
  };

  if (loading) {
    return (
      <div>
        <div className="Csh-container pt-2">
          <div className="sticky-top header-form">
            <button
              className="btn btn-primary fw-bold"
              style={{ position: "absolute", left: "1em", top: "1em" }}
            >
              <Link to="/adminDashboard" className="text-white">
                Dashboard
              </Link>
            </button>
            <h1 className="text-center manage-riders-title">DELIVERY NOTIFICATION</h1>
            <span className="adjust-cancel-btn" onClick={closeModal}>
              X
            </span>
          </div>
          <div className="text-center py-5">
            <p>Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="Csh-container pt-2">
          <div className="sticky-top header-form">
            <button
              className="btn btn-primary fw-bold"
              style={{ position: "absolute", left: "1em", top: "1em" }}
            >
              <Link to="/adminDashboard" className="text-white">
                Dashboard
              </Link>
            </button>
            <h1 className="text-center manage-riders-title">DELIVERY NOTIFICATION</h1>
            <div style={{ display: "flex", justifyContent: "center", margin: "0.4rem 0" }}>
              <BranchBadge />
            </div>
            <div className="manage-riders-search-container">
              <input
                type="text"
                className="manage-riders-search"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <span className="adjust-cancel-btn" onClick={closeModal}>
              X
            </span>
          </div>

          {error && (
            <div className="alert alert-danger mx-3 mt-3" role="alert">
              {error}
            </div>
          )}

          <div className="rider-box my-5">
            <div
              className="table-scroll-bar rider-box-transit"
              style={{ height: "400px", overflowX: "auto", overflowY: "auto" }}
            >
              <table className="mt-0 manage-riders-table" style={{ width: "100%", minWidth: "900px" }}>
                <thead>
                  <tr>
                    <th>SALES REF</th>
                    <th>PRODUCT ID</th>
                    <th>PRODUCT NAME</th>
                    <th>RIDER&apos;S NAME</th>
                    <th>QUANTITY DELIVERED</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNotifications.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        {error ? "Error loading notifications" : "No notifications found"}
                      </td>
                    </tr>
                  ) : (
                    filteredNotifications.map((notification, index) => (
                      <tr key={notification.id || notification.notificationId || index}>
                        <td>{notification.salesRef || notification.orderId || "-"}</td>
                        <td>{notification.productId || "-"}</td>
                        <td>{notification.productName || "-"}</td>
                        <td>{notification.riderName || "-"}</td>
                        <td>{notification.quantityDelivered || notification.quantity || "-"}</td>
                        <td>
                          <button
                            className="btn-link text-primary view-btn"
                            onClick={() => handleView(notification)}
                            style={{ 
                              textDecoration: "underline", 
                              cursor: "pointer",
                              backgroundColor: "#0867db",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              padding: "0.6rem 1.5rem"
                            }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showDetailModal && selectedNotification && (
        <DeliveryNotificationDetail
          notification={selectedNotification}
          onClose={handleCloseDetail}
        />
      )}
    </>
  );
};

export default Dnt;
