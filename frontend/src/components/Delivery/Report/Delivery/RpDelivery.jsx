import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { deliveryApi } from "../../../../lib/deliveryApi";
import "../../../../Styles/Delivery/Delivery.css";

const RpDelivery = ({ toggleRpDeliveryModal }) => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDeliveryReport();
  }, []);

  const fetchDeliveryReport = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("🔵 RpDelivery: ========== FETCHING DELIVERY REPORT ==========");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("RpDelivery: API endpoint: /admin/reports/deliveries");
      console.log("RpDelivery: Method: GET");
      console.log("RpDelivery: Making API request...");

      const response = await deliveryApi.getDeliveryReport();

      console.log("═══════════════════════════════════════════════════════════");
      console.log("✅ RpDelivery: API RESPONSE RECEIVED");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("RpDelivery: Raw API response:", response);
      console.log("RpDelivery: Response type:", typeof response);
      console.log("RpDelivery: Is array?", Array.isArray(response));
      console.log("RpDelivery: Response keys:", Object.keys(response || {}));

      let deliveriesList = [];
      if (Array.isArray(response)) {
        deliveriesList = response;
        console.log("✅ RpDelivery: Response is direct array");
        console.log("✅ RpDelivery: Count:", deliveriesList.length);
      } else if (response?.data && Array.isArray(response.data)) {
        deliveriesList = response.data;
        console.log("✅ RpDelivery: Found deliveries in response.data");
        console.log("✅ RpDelivery: Count:", deliveriesList.length);
      } else if (response?.content && Array.isArray(response.content)) {
        deliveriesList = response.content;
        console.log("✅ RpDelivery: Found deliveries in response.content (paged)");
        console.log("✅ RpDelivery: Count:", deliveriesList.length);
      } else {
        console.warn("⚠️ RpDelivery: Unexpected response format:", response);
        deliveriesList = [];
      }

      if (deliveriesList.length > 0) {
        console.log("RpDelivery: First delivery:", deliveriesList[0]);
        console.log("RpDelivery: First delivery keys:", Object.keys(deliveriesList[0]));
      }

      setDeliveries(deliveriesList);
      console.log("═══════════════════════════════════════════════════════════");
      console.log(`✅ RpDelivery: SUCCESS - Loaded ${deliveriesList.length} deliveries`);
      console.log("═══════════════════════════════════════════════════════════");
    } catch (err) {
      console.error("═══════════════════════════════════════════════════════════");
      console.error("❌ RpDelivery: ERROR FETCHING DELIVERY REPORT");
      console.error("═══════════════════════════════════════════════════════════");
      console.error("RpDelivery: Error message:", err?.message);
      console.error("RpDelivery: Error stack:", err?.stack);
      setError(err?.message || "Failed to load delivery report.");
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    toggleRpDeliveryModal();
  };

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

          <h1 className="text-center">ALL DELIVERED PRODUCT REPORT</h1>
          <div className="text-center">
            <h3>PM MARKET HUB</h3>
            <h4>64 OGUI ROAD, ENUGU-STATE</h4>
            <h5>TEL: 080XXXXX</h5>
          </div>

          <span
            className="adjust-cancel-btn"
            style={{ left: "80em", top: "-8em" }}
            onClick={closeModal}
          >
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
            {loading ? (
              <div className="text-center py-5">
                <p>Loading delivery report...</p>
              </div>
            ) : (
              <table className="mt-0 manage-riders-table" style={{ width: "100%", minWidth: "1200px" }}>
                <thead>
                  <tr>
                    <th>S/N</th>
                    <th>DATE</th>
                    <th>REFERENCE NO</th>
                    <th>CUSTOMER NAME</th>
                    <th>PRODUCT</th>
                    <th>DESCRIPTION</th>
                    <th>CUSTOMER ADDRESS</th>
                    <th>DELIVERED BY</th>
                    <th>COMMENT</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-4">
                        {error ? "Error loading report" : "No delivered products found"}
                      </td>
                    </tr>
                  ) : (
                    deliveries.map((delivery, index) => (
                      <tr key={delivery.id || delivery.orderId || index}>
                        <td>{index + 1}</td>
                        <td>
                          {delivery.deliveryDate
                            ? new Date(delivery.deliveryDate).toLocaleDateString()
                            : delivery.date
                            ? new Date(delivery.date).toLocaleDateString()
                            : "-"}
                        </td>
                        <td>{delivery.referenceNo || delivery.reference || delivery.orderId || "-"}</td>
                        <td>{delivery.customerName || delivery.customer_name || "-"}</td>
                        <td>{delivery.productName || delivery.product_name || delivery.product || "-"}</td>
                        <td>{delivery.description || delivery.productDescription || delivery.product_description || "-"}</td>
                        <td>{delivery.customerAddress || delivery.address || delivery.deliveryAddress || "-"}</td>
                        <td>{delivery.deliveredBy || delivery.riderName || delivery.rider_name || "-"}</td>
                        <td>{delivery.comment || delivery.status || "DELIVERED"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RpDelivery;
