import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import BranchBadge from "../../shared/BranchBadge";
import { deliveryApi } from "../../../lib/deliveryApi";
import "../../../Styles/Delivery/Delivery.css";
import TransitDeliveryDetail from "./TransitDeliveryDetail";

const Transit = ({ toggleTransitModal }) => {
  const [deliveries, setDeliveries] = useState([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchTransitDeliveries();
  }, []);

  useEffect(() => {
    filterDeliveries();
  }, [searchQuery, deliveries]);

  const fetchTransitDeliveries = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("🔵 Transit: ========== FETCHING TRANSIT DELIVERIES ==========");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("Transit: API endpoint: /admin/transit-deliveries");
      console.log("Transit: Method: GET");
      console.log("Transit: Making API request...");
      
      const response = await deliveryApi.getTransitDeliveries();
      
      console.log("═══════════════════════════════════════════════════════════");
      console.log("✅ Transit: API RESPONSE RECEIVED");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("Transit: Raw API response:", response);
      console.log("Transit: Response type:", typeof response);
      console.log("Transit: Is array?", Array.isArray(response));
      console.log("Transit: Response keys:", Object.keys(response || {}));
      console.log("Transit: Response.data exists?", !!response?.data);
      console.log("Transit: Response.data is array?", Array.isArray(response?.data));
      
      const deliveriesList = Array.isArray(response) ? response : [];

      if (deliveriesList.length > 0) {
        console.log("═══════════════════════════════════════════════════════════");
        console.log("📋 Transit: FIRST DELIVERY SAMPLE");
        console.log("═══════════════════════════════════════════════════════════");
        console.log("Transit: First delivery:", deliveriesList[0]);
        console.log("Transit: First delivery keys:", Object.keys(deliveriesList[0]));
        console.log("Transit: First delivery orderId:", deliveriesList[0].orderId);
        console.log("Transit: First delivery productId:", deliveriesList[0].productId);
        console.log("Transit: First delivery productName:", deliveriesList[0].productName);
        console.log("Transit: First delivery productDescription:", deliveriesList[0].productDescription);
        console.log("Transit: First delivery customerName:", deliveriesList[0].customerName);
        
        if (deliveriesList.length > 1) {
          console.log("Transit: All deliveries count:", deliveriesList.length);
        }
      } else {
        console.warn("⚠️ Transit: No transit deliveries found in response");
      }

      setDeliveries(deliveriesList);
      setFilteredDeliveries(deliveriesList);
      console.log("═══════════════════════════════════════════════════════════");
      console.log(`✅ Transit: SUCCESS - Loaded ${deliveriesList.length} transit deliveries`);
      console.log("═══════════════════════════════════════════════════════════");
    } catch (err) {
      console.error("═══════════════════════════════════════════════════════════");
      console.error("❌ Transit: ERROR FETCHING TRANSIT DELIVERIES");
      console.error("═══════════════════════════════════════════════════════════");
      console.error("Transit: Error message:", err?.message);
      console.error("Transit: Error stack:", err?.stack);
      console.error("Transit: Error name:", err?.name);
      console.error("Transit: Full error object:", err);
      const errorMsg = err?.message || "Failed to load transit deliveries. Please refresh the page.";
      setError(errorMsg);
      setDeliveries([]);
      setFilteredDeliveries([]);
    } finally {
      setLoading(false);
      console.log("Transit: Fetch completed. Loading state set to false.");
    }
  };

  const filterDeliveries = () => {
    if (!searchQuery.trim()) {
      setFilteredDeliveries(deliveries);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = deliveries.filter((delivery) =>
      [
        delivery.orderId,
        delivery.salesReference,
        delivery.productId,
        delivery.productName,
        delivery.customerName,
        delivery.riderName,
        delivery.productDescription,
      ].some((value) => String(value ?? "").toLowerCase().includes(query))
    );
    setFilteredDeliveries(filtered);
  };

  const closeModal = () => {
    toggleTransitModal();
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
            <h1 className="text-center manage-riders-title">TRANSIT DELIVERIES</h1>
            <span className="adjust-cancel-btn" onClick={closeModal}>
              X
            </span>
          </div>
          <div className="text-center py-5">
            <p>Loading transit deliveries...</p>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-center manage-riders-title">TRANSIT DELIVERIES</h1>
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
            <table className="mt-0 manage-riders-table" style={{ width: "100%", minWidth: "1000px" }}>
              <thead>
                <tr>
                  <th>ORDER ID</th>
                  <th>PRODUCT ID</th>
                  <th>PRODUCT NAME</th>
                  <th>PRODUCT DESCRIPTION</th>
                  <th>CUSTOMER NAME</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeliveries.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      {error ? "Error loading transit deliveries" : "No transit deliveries found"}
                    </td>
                  </tr>
                ) : (
                  filteredDeliveries.map((delivery, index) => (
                    <tr key={delivery.id || delivery.orderId || index}>
                      <td>{delivery.salesReference || delivery.orderId || "-"}</td>
                      <td>{delivery.productId || delivery.product_id || "-"}</td>
                      <td>{delivery.productName || delivery.product_name || "-"}</td>
                      <td>{delivery.productDescription || delivery.description || delivery.product_description || "-"}</td>
                      <td>{delivery.customerName || delivery.customer_name || "-"}</td>
                      <td>
                        <button
                          className="btn-link text-primary view-btn"
                          onClick={() => {
                            console.log("═══════════════════════════════════════════════════════════");
                            console.log("🔵 Transit: ========== VIEW BUTTON CLICKED ==========");
                            console.log("═══════════════════════════════════════════════════════════");
                            console.log("Transit: Delivery object:", delivery);
                            console.log("Transit: Delivery orderId:", delivery?.orderId || delivery?.order_id);
                            console.log("Transit: Delivery productId:", delivery?.productId || delivery?.product_id);
                            console.log("Transit: Opening detail modal...");
                            setSelectedDelivery(delivery);
                            setShowDetailModal(true);
                            console.log("✅ Transit: Detail modal state set to true");
                          }}
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

      {showDetailModal && selectedDelivery && (
        <TransitDeliveryDetail
          delivery={selectedDelivery}
          onClose={() => {
            console.log("Transit: Closing detail modal");
            setShowDetailModal(false);
            setSelectedDelivery(null);
          }}
          onDelivered={fetchTransitDeliveries}
        />
      )}
    </div>
  );
};

export default Transit;
