import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { deliveryApi } from "../../../../lib/deliveryApi";
import "../../../../Styles/Delivery/Delivery.css";

const RpInfo = ({ toggleRpInfoModal }) => {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    fetchRiderInfoReport();
  }, []);

  const fetchRiderInfoReport = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("🔵 RpInfo: ========== FETCHING RIDER INFO REPORT ==========");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("RpInfo: API endpoint: /admin/reports/rider-info");
      console.log("RpInfo: Method: GET");
      console.log("RpInfo: Making API request...");

      const response = await deliveryApi.getRiderInfoReport();

      console.log("═══════════════════════════════════════════════════════════");
      console.log("✅ RpInfo: API RESPONSE RECEIVED");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("RpInfo: Raw API response:", response);
      console.log("RpInfo: Response type:", typeof response);
      console.log("RpInfo: Response keys:", Object.keys(response || {}));
      console.log("RpInfo: Response.data exists?", !!response?.data);

      let ridersList = [];
      
      // ✅ FIXED: Handle the nested data structure
      if (response?.data?.content && Array.isArray(response.data.content)) {
        ridersList = response.data.content;
        setTotalElements(response.data.totalElements || 0);
        setTotalPages(response.data.totalPages || 0);
        setCurrentPage(response.data.currentPage || 0);
        console.log("✅ RpInfo: Found riders in response.data.content");
        console.log("✅ RpInfo: Count:", ridersList.length);
        console.log("✅ RpInfo: Total elements:", response.data.totalElements);
      } 
      // Fallback for direct array
      else if (Array.isArray(response)) {
        ridersList = response;
        console.log("✅ RpInfo: Response is direct array");
        console.log("✅ RpInfo: Count:", ridersList.length);
      } 
      // Fallback for response.data as array
      else if (response?.data && Array.isArray(response.data)) {
        ridersList = response.data;
        console.log("✅ RpInfo: Found riders in response.data as array");
        console.log("✅ RpInfo: Count:", ridersList.length);
      }
      // Fallback for response.content as array
      else if (response?.content && Array.isArray(response.content)) {
        ridersList = response.content;
        console.log("✅ RpInfo: Found riders in response.content");
        console.log("✅ RpInfo: Count:", ridersList.length);
      } 
      else {
        console.warn("⚠️ RpInfo: Unexpected response format:", response);
        ridersList = [];
      }

      if (ridersList.length > 0) {
        console.log("RpInfo: First rider:", ridersList[0]);
        console.log("RpInfo: First rider keys:", Object.keys(ridersList[0]));
      }

      setRiders(ridersList);
      console.log("═══════════════════════════════════════════════════════════");
      console.log(`✅ RpInfo: SUCCESS - Loaded ${ridersList.length} riders`);
      console.log("═══════════════════════════════════════════════════════════");
    } catch (err) {
      console.error("═══════════════════════════════════════════════════════════");
      console.error("❌ RpInfo: ERROR FETCHING RIDER INFO REPORT");
      console.error("═══════════════════════════════════════════════════════════");
      console.error("RpInfo: Error message:", err?.message);
      console.error("RpInfo: Error stack:", err?.stack);
      setError(err?.message || "Failed to load rider info report.");
      setRiders([]);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    toggleRpInfoModal();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
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

          <h1 className="text-center">ALL RIDERS INFO REPORT</h1>
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

        {/* Summary Info */}
        {!loading && riders.length > 0 && (
          <div className="mx-3 mb-3" style={{ display: "flex", justifyContent: "flex-end", gap: "20px" }}>
            <span style={{ fontSize: "14px", color: "#666" }}>
              Total Riders: <strong>{totalElements || riders.length}</strong>
            </span>
            {totalPages > 0 && (
              <span style={{ fontSize: "14px", color: "#666" }}>
                Page: <strong>{currentPage + 1} of {totalPages}</strong>
              </span>
            )}
          </div>
        )}

        <div className="rider-box my-5">
          <div
            className="table-scroll-bar rider-box-transit"
            style={{ height: "400px", overflowX: "auto", overflowY: "auto" }}
          >
            {loading ? (
              <div className="text-center py-5">
                <p>Loading rider info report...</p>
              </div>
            ) : (
              <table className="mt-0 manage-riders-table" style={{ width: "100%", minWidth: "1000px" }}>
                <thead>
                  <tr>
                    <th>S/N</th>
                    <th>DATE REG</th>
                    <th>RIDER ID</th>
                    <th>RIDER'S NAME</th>
                    <th>ADDRESS</th>
                    <th>GENDER</th>
                    <th>PHONE NO</th>
                  </tr>
                </thead>
                <tbody>
                  {riders.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4">
                        {error ? "Error loading report" : "No riders found"}
                      </td>
                    </tr>
                  ) : (
                    riders.map((rider, index) => {
                      // Extract rider name from various possible fields
                      let riderName = rider.name || "-";
                      if (rider.firstName || rider.lastName) {
                        riderName = `${rider.firstName || ""} ${rider.lastName || ""}`.trim();
                      }
                      
                      return (
                        <tr key={rider.riderId || rider.id || index}>
                          <td>{index + 1}</td>
                          <td>
                            {formatDate(rider.registrationDate || rider.dateRegistered || rider.createdAt)}
                          </td>
                          <td>{rider.riderId || rider.id || "-"}</td>
                          <td>{riderName}</td>
                          <td>{rider.address || rider.contactAddress || rider.location || "-"}</td>
                          <td>{rider.gender ? rider.gender.charAt(0).toUpperCase() : "-"}</td>
                          <td>{rider.phoneNumber || rider.phone || rider.telephoneNo || "-"}</td>
                        </tr>
                      );
                    })
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

export default RpInfo;
