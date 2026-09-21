import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { deliveryApi } from "../../../../lib/deliveryApi";
import "../../../../Styles/Delivery/Delivery.css";

const FeedBack = ({ toggleFeedBackModal }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    filterFeedbacks();
  }, [searchQuery, feedbacks]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("🔵 FeedBack: ========== FETCHING RIDER FEEDBACK ==========");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("FeedBack: API endpoint: /admin/rider-feedback");
      console.log("FeedBack: Method: GET");
      console.log("FeedBack: Making API request...");
      
      const response = await deliveryApi.getRiderFeedback();
      
      console.log("═══════════════════════════════════════════════════════════");
      console.log("✅ FeedBack: API RESPONSE RECEIVED");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("FeedBack: Raw API response:", response);
      console.log("FeedBack: Response type:", typeof response);
      console.log("FeedBack: Is array?", Array.isArray(response));
      console.log("FeedBack: Response keys:", Object.keys(response || {}));
      console.log("FeedBack: Response.data exists?", !!response?.data);
      console.log("FeedBack: Response.data is array?", Array.isArray(response?.data));
      
      const feedbacksList = Array.isArray(response) ? response : [];

      if (feedbacksList.length > 0) {
        console.log("═══════════════════════════════════════════════════════════");
        console.log("📋 FeedBack: FIRST FEEDBACK SAMPLE");
        console.log("═══════════════════════════════════════════════════════════");
        console.log("FeedBack: First feedback:", feedbacksList[0]);
        console.log("FeedBack: First feedback keys:", Object.keys(feedbacksList[0]));
        console.log("FeedBack: First feedback ID:", feedbacksList[0].id);
        console.log("FeedBack: First feedback orderId:", feedbacksList[0].orderId);
        console.log("FeedBack: First feedback productId:", feedbacksList[0].productId);
        console.log("FeedBack: First feedback productName:", feedbacksList[0].productName);
        console.log("FeedBack: First feedback riderName:", feedbacksList[0].riderName);
        console.log("FeedBack: First feedback customerName:", feedbacksList[0].customerName);
        console.log("FeedBack: First feedback quantityDelivered:", feedbacksList[0].quantityDelivered);
        
        if (feedbacksList.length > 1) {
          console.log("FeedBack: All feedbacks count:", feedbacksList.length);
        }
      } else {
        console.warn("⚠️ FeedBack: No feedbacks found in response");
      }

      setFeedbacks(feedbacksList);
      setFilteredFeedbacks(feedbacksList);
      console.log("═══════════════════════════════════════════════════════════");
      console.log(`✅ FeedBack: SUCCESS - Loaded ${feedbacksList.length} feedbacks`);
      console.log("═══════════════════════════════════════════════════════════");
    } catch (err) {
      console.error("═══════════════════════════════════════════════════════════");
      console.error("❌ FeedBack: ERROR FETCHING FEEDBACKS");
      console.error("═══════════════════════════════════════════════════════════");
      console.error("FeedBack: Error message:", err?.message);
      console.error("FeedBack: Error stack:", err?.stack);
      console.error("FeedBack: Error name:", err?.name);
      console.error("FeedBack: Full error object:", err);
      const errorMsg = err?.message || "Failed to load rider feedback. Please refresh the page.";
      setError(errorMsg);
      setFeedbacks([]);
      setFilteredFeedbacks([]);
    } finally {
      setLoading(false);
      console.log("FeedBack: Fetch completed. Loading state set to false.");
    }
  };

  const filterFeedbacks = () => {
    if (!searchQuery.trim()) {
      setFilteredFeedbacks(feedbacks);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = feedbacks.filter((feedback) => {
      const productId = (feedback.productId || "").toLowerCase();
      const productName = (feedback.productName || "").toLowerCase();
      const riderName = (feedback.riderName || "").toLowerCase();
      const customerName = (feedback.customerName || "").toLowerCase();
      return productId.includes(query) || productName.includes(query) || riderName.includes(query) || customerName.includes(query);
    });
    setFilteredFeedbacks(filtered);
  };

  const closeModal = () => {
    toggleFeedBackModal();
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
            <h1 className="text-center manage-riders-title">FEEDBACK NOTIFICATION</h1>
            <span className="adjust-cancel-btn" onClick={closeModal}>
              X
            </span>
          </div>
          <div className="text-center py-5">
            <p>Loading feedback notifications...</p>
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
          <h1 className="text-center manage-riders-title">FEEDBACK NOTIFICATION</h1>
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
                  <th>PRODUCT ID</th>
                  <th>PRODUCT NAME</th>
                  <th>RIDER&apos;S NAME</th>
                  <th>CUSTOMER&apos;S NAME</th>
                  <th>QUANTITY DELIVERED</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedbacks.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      {error ? "Error loading feedbacks" : "No feedback notifications found"}
                    </td>
                  </tr>
                ) : (
                  filteredFeedbacks.map((feedback, index) => (
                    <tr key={feedback.id || feedback.feedbackId || index}>
                      <td>{feedback.productId || "-"}</td>
                      <td>{feedback.productName || "-"}</td>
                      <td>{feedback.riderName || "-"}</td>
                      <td>{feedback.customerName || "-"}</td>
                      <td>{feedback.quantityDelivered || feedback.quantity || "-"}</td>
                      <td>
                        <button
                          className="btn-link text-primary view-btn"
                          onClick={() => {
                            console.log("FeedBack: View clicked for feedback:", feedback);
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
    </div>
  );
};

export default FeedBack;
