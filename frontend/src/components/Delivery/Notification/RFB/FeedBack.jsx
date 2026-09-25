import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { deliveryApi } from "../../../../lib/deliveryApi";
import "../../../../Styles/Delivery/Delivery.css";

const STATUS_LABELS = {
  DELIVERED: "Delivered",
  WRONG_PRODUCT: "Wrong product",
  OWNER_NOT_AVAILABLE: "Owner not available",
  WRONG_ADDRESS: "Wrong address",
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

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

  // Reads what riders submit from the delivery app's feedback screen. This page used to read
  // /admin/rider-feedback, a separate table the app never writes to, so it was always empty.
  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await deliveryApi.getDeliveryFeedback();
      const feedbacksList = Array.isArray(response) ? response : [];
      setFeedbacks(feedbacksList);
      setFilteredFeedbacks(feedbacksList);
    } catch (err) {
      console.error("FeedBack: failed to load delivery feedback", err);
      setError(err?.message || "Failed to load rider feedback. Please refresh the page.");
      setFeedbacks([]);
      setFilteredFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  const filterFeedbacks = () => {
    if (!searchQuery.trim()) {
      setFilteredFeedbacks(feedbacks);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = feedbacks.filter((feedback) =>
      [
        feedback.productId,
        feedback.productName,
        feedback.riderName,
        feedback.customerName,
        feedback.salesReference,
        STATUS_LABELS[feedback.status] || feedback.status,
      ].some((value) => String(value ?? "").toLowerCase().includes(query))
    );
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
            <table className="mt-0 manage-riders-table" style={{ width: "100%", minWidth: "1000px" }}>
              <thead>
                <tr>
                  <th>PRODUCT ID</th>
                  <th>PRODUCT NAME</th>
                  <th>RIDER&apos;S NAME</th>
                  <th>CUSTOMER&apos;S NAME</th>
                  <th>QUANTITY DELIVERED</th>
                  <th>STATUS</th>
                  <th>DATE</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedbacks.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      {error ? "Error loading feedbacks" : "No feedback notifications found"}
                    </td>
                  </tr>
                ) : (
                  filteredFeedbacks.map((feedback, index) => (
                    <tr key={feedback.id || index}>
                      <td>{feedback.productId ?? "-"}</td>
                      <td>{feedback.productName || "-"}</td>
                      <td>{feedback.riderName || "-"}</td>
                      <td>{feedback.customerName || "-"}</td>
                      <td>{feedback.quantityDelivered ?? "-"}</td>
                      <td>{STATUS_LABELS[feedback.status] || feedback.status || "-"}</td>
                      <td>{formatDate(feedback.createdAt)}</td>
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
