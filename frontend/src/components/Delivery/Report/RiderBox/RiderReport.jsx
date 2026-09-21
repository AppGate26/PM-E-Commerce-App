import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { deliveryApi } from "../../../../lib/deliveryApi";
import "../../../../Styles/Delivery/Delivery.css";

const RiderReport = ({ toggleRiderReportModal, selectedRiderId }) => {
  const [boxItems, setBoxItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [riderId, setRiderId] = useState(selectedRiderId || "");

  useEffect(() => {
    if (riderId) {
      fetchRiderBoxReport(riderId);
    }
  }, [riderId]);

  useEffect(() => {
    if (selectedRiderId) {
      setRiderId(selectedRiderId);
    }
  }, [selectedRiderId]);

  const fetchRiderBoxReport = async (id) => {
    if (!id) {
      console.warn("RiderReport: No rider ID provided");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("🔵 RiderReport: ========== FETCHING RIDER BOX REPORT ==========");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("RiderReport: Rider ID:", id);
      console.log("RiderReport: API endpoint: /admin/reports/rider-box/" + id);
      console.log("RiderReport: Method: GET");
      console.log("RiderReport: Making API request...");

      const response = await deliveryApi.getRiderBoxReport(id);

      console.log("═══════════════════════════════════════════════════════════");
      console.log("✅ RiderReport: API RESPONSE RECEIVED");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("RiderReport: Raw API response:", response);
      console.log("RiderReport: Response type:", typeof response);
      console.log("RiderReport: Is array?", Array.isArray(response));

      let boxList = [];
      if (Array.isArray(response)) {
        boxList = response;
        console.log("✅ RiderReport: Response is direct array");
        console.log("✅ RiderReport: Count:", boxList.length);
      } else if (response?.data && Array.isArray(response.data)) {
        boxList = response.data;
        console.log("✅ RiderReport: Found box items in response.data");
        console.log("✅ RiderReport: Count:", boxList.length);
      } else {
        console.warn("⚠️ RiderReport: Unexpected response format:", response);
        boxList = [];
      }

      if (boxList.length > 0) {
        console.log("RiderReport: First box item:", boxList[0]);
      }

      setBoxItems(boxList);
      console.log("═══════════════════════════════════════════════════════════");
      console.log(`✅ RiderReport: SUCCESS - Loaded ${boxList.length} box items`);
      console.log("═══════════════════════════════════════════════════════════");
    } catch (err) {
      console.error("═══════════════════════════════════════════════════════════");
      console.error("❌ RiderReport: ERROR FETCHING RIDER BOX REPORT");
      console.error("═══════════════════════════════════════════════════════════");
      console.error("RiderReport: Error message:", err?.message);
      console.error("RiderReport: Error stack:", err?.stack);
      setError(err?.message || "Failed to load rider box report.");
      setBoxItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFetch = () => {
    if (riderId) {
      fetchRiderBoxReport(riderId);
    } else {
      setError("Please enter a Rider ID");
    }
  };

  const calculateTotalBoxed = () => {
    return boxItems.reduce((total, item) => {
      const boxed = parseInt(item.boxed || item.totalBoxed || item.totalBox || 0);
      return total + (isNaN(boxed) ? 0 : boxed);
    }, 0);
  };

  const closeModal = () => {
    toggleRiderReportModal();
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
          <h1 className="text-center">RIDERS BOX REPORT</h1>
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

        <div className="text-end px-3">
          <div className="d-flex align-items-center justify-content-end gap-3 mb-3">
            <input
              type="text"
              placeholder="Enter Rider ID"
              value={riderId}
              onChange={(e) => setRiderId(e.target.value)}
              className="form-control"
              style={{ width: "200px" }}
            />
            <button className="btn btn-primary" onClick={handleFetch} disabled={loading}>
              {loading ? "Loading..." : "Fetch"}
            </button>
          </div>
          <h3 className="fw-bold">Rider&apos;s ID: {riderId || "Not Set"}</h3>
        </div>

        {error && (
          <div className="alert alert-danger mx-3 mt-3" role="alert">
            {error}
          </div>
        )}

        <div className="rider-box transit-my-table">
          <div
            className="table-scroll-bar rider-box-transit"
            style={{ height: "400px", overflowX: "auto", overflowY: "auto" }}
          >
            {loading ? (
              <div className="text-center py-5">
                <p>Loading rider box report...</p>
              </div>
            ) : (
              <table className="mt-0 manage-riders-table" style={{ width: "100%", minWidth: "1000px" }}>
                <thead>
                  <tr>
                    <th>S/N</th>
                    <th>DATE</th>
                    <th>PRODUCT ID</th>
                    <th>RIDER&apos;S NAME</th>
                    <th>PRODUCT NAME</th>
                    <th>DESCRIPTION</th>
                    <th>QUANTITY</th>
                    <th>BOXED</th>
                  </tr>
                </thead>
                <tbody>
                  {boxItems.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-4">
                        {error ? "Error loading report" : riderId ? "No box items found for this rider" : "Please enter a Rider ID and click Fetch"}
                      </td>
                    </tr>
                  ) : (
                    boxItems.map((item, index) => (
                      <tr key={item.id || index}>
                        <td>{index + 1}</td>
                        <td>
                          {item.date
                            ? new Date(item.date).toLocaleDateString()
                            : item.createdAt
                            ? new Date(item.createdAt).toLocaleDateString()
                            : "-"}
                        </td>
                        <td>{item.productId || item.product_id || "-"}</td>
                        <td>{item.riderName || item.rider_name || "-"}</td>
                        <td>{item.productName || item.product_name || "-"}</td>
                        <td>{item.description || item.productDescription || "-"}</td>
                        <td>{item.quantity || "-"}</td>
                        <td>{item.boxed || item.totalBoxed || item.totalBox || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div className="text-end px-3 mt-3">
          <h3 className="fw-bold">TOTAL BOXED: {calculateTotalBoxed()}</h3>
        </div>
      </div>
    </div>
  );
};

export default RiderReport;
