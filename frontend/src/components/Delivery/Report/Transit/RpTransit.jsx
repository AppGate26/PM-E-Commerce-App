import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { deliveryApi } from "../../../../lib/deliveryApi";
import "../../../../Styles/Delivery/Delivery.css";

const RpTransit = ({ toggleRpTransitModal }) => {
  const [transitItems, setTransitItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTransitReport();
  }, []);

  const fetchTransitReport = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("🔵 RpTransit: ========== FETCHING TRANSIT REPORT ==========");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("RpTransit: API endpoint: /admin/reports/transit");
      console.log("RpTransit: Method: GET");
      console.log("RpTransit: Making API request...");

      const response = await deliveryApi.getTransitReport();

      console.log("═══════════════════════════════════════════════════════════");
      console.log("✅ RpTransit: API RESPONSE RECEIVED");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("RpTransit: Raw API response:", response);
      console.log("RpTransit: Response type:", typeof response);
      console.log("RpTransit: Is array?", Array.isArray(response));
      console.log("RpTransit: Response keys:", Object.keys(response || {}));

      let transitList = [];
      if (Array.isArray(response)) {
        transitList = response;
        console.log("✅ RpTransit: Response is direct array");
        console.log("✅ RpTransit: Count:", transitList.length);
      } else if (response?.data && Array.isArray(response.data)) {
        transitList = response.data;
        console.log("✅ RpTransit: Found transit items in response.data");
        console.log("✅ RpTransit: Count:", transitList.length);
      } else if (response?.content && Array.isArray(response.content)) {
        transitList = response.content;
        console.log("✅ RpTransit: Found transit items in response.content (paged)");
        console.log("✅ RpTransit: Count:", transitList.length);
      } else {
        console.warn("⚠️ RpTransit: Unexpected response format:", response);
        transitList = [];
      }

      if (transitList.length > 0) {
        console.log("RpTransit: First transit item:", transitList[0]);
        console.log("RpTransit: First transit item keys:", Object.keys(transitList[0]));
      }

      setTransitItems(transitList);
      console.log("═══════════════════════════════════════════════════════════");
      console.log(`✅ RpTransit: SUCCESS - Loaded ${transitList.length} transit items`);
      console.log("═══════════════════════════════════════════════════════════");
    } catch (err) {
      console.error("═══════════════════════════════════════════════════════════");
      console.error("❌ RpTransit: ERROR FETCHING TRANSIT REPORT");
      console.error("═══════════════════════════════════════════════════════════");
      console.error("RpTransit: Error message:", err?.message);
      console.error("RpTransit: Error stack:", err?.stack);
      setError(err?.message || "Failed to load transit report.");
      setTransitItems([]);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    toggleRpTransitModal();
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
          <h1 className="text-center">ALL TRANSIT PRODUCT REPORT</h1>
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
                <p>Loading transit report...</p>
              </div>
            ) : (
              <table className="mt-0 manage-riders-table" style={{ width: "100%", minWidth: "1200px" }}>
                <thead>
                  <tr>
                    <th>S/N</th>
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
                  {transitItems.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-4">
                        {error ? "Error loading report" : "No transit products found"}
                      </td>
                    </tr>
                  ) : (
                    transitItems.map((item, index) => (
                      <tr key={item.id || item.orderId || index}>
                        <td>{index + 1}</td>
                        <td>{item.referenceNo || item.reference || item.orderId || "-"}</td>
                        <td>{item.customerName || item.customer_name || "-"}</td>
                        <td>{item.productName || item.product_name || item.product || "-"}</td>
                        <td>{item.description || item.productDescription || item.product_description || "-"}</td>
                        <td>{item.customerAddress || item.address || item.deliveryAddress || "-"}</td>
                        <td>{item.deliveredBy || item.riderName || item.rider_name || "-"}</td>
                        <td>{item.comment || item.status || "TRANSIT"}</td>
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

export default RpTransit;
