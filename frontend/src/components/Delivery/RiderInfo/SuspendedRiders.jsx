import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { deliveryApi } from "../../../lib/deliveryApi";

// Unsuspend Modal Component
const UnsuspendModal = ({ isOpen, onClose, onConfirm, riderName }) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError("Please provide a reason for unsuspending");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      await onConfirm(reason);
      setReason("");
      onClose();
    } catch (err) {
      setError(err.message || "Failed to unsuspend rider");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2000,
    }} onClick={onClose}>
      <div style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "24px",
        maxWidth: "500px",
        width: "90%",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
      }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{
          fontSize: "1.5rem",
          fontWeight: 600,
          color: "#28a745",
          marginBottom: "16px",
        }}>
          Unsuspend Rider
        </h3>
        
        <p style={{
          fontSize: "1rem",
          color: "#666",
          marginBottom: "20px",
        }}>
          Are you sure you want to unsuspend <strong>{riderName}</strong>?
        </p>

        <div style={{ marginBottom: "20px" }}>
          <label style={{
            display: "block",
            fontSize: "0.9rem",
            fontWeight: 600,
            color: "#495057",
            marginBottom: "8px",
          }}>
            Reason for Unsuspending <span style={{ color: "#dc3545" }}>*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError("");
            }}
            placeholder="Enter reason for unsuspending..."
            rows="4"
            style={{
              width: "100%",
              padding: "12px",
              border: `1px solid ${error ? "#dc3545" : "#ced4da"}`,
              borderRadius: "6px",
              fontSize: "0.95rem",
              fontFamily: "inherit",
              resize: "vertical",
              outline: "none",
            }}
          />
          {error && (
            <p style={{
              color: "#dc3545",
              fontSize: "0.85rem",
              marginTop: "5px",
            }}>
              {error}
            </p>
          )}
        </div>

        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "12px",
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "0.95rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: "10px 20px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "0.95rem",
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Unsuspending..." : "Unsuspend Rider"}
          </button>
        </div>
      </div>
    </div>
  );
};

const SuspendedRiders = ({ toggleSuspendedRidersModal }) => {
  const [riders, setRiders] = useState([]);
  const [filteredRiders, setFilteredRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [unsuspendingId, setUnsuspendingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [unsuspendModalOpen, setUnsuspendModalOpen] = useState(false);
  const [selectedRider, setSelectedRider] = useState(null);

  useEffect(() => {
    fetchSuspendedRiders();
  }, []);

  useEffect(() => {
    filterRiders();
  }, [searchQuery, riders]);

  const fetchSuspendedRiders = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      console.log("📡 Fetching suspended riders...");
      const ridersList = await deliveryApi.getSuspendedRiders();

      console.log(`✅ Loaded ${ridersList.length} suspended riders`);
      setRiders(ridersList);
      setFilteredRiders(ridersList);
    } catch (err) {
      console.error("❌ Error fetching suspended riders:", err);
      const errorMsg = err?.message || "Failed to load suspended riders. Please refresh the page.";
      setError(errorMsg);
      setRiders([]);
      setFilteredRiders([]);
    } finally {
      setLoading(false);
    }
  };

  const filterRiders = () => {
    if (!searchQuery.trim()) {
      setFilteredRiders(riders);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = riders.filter((rider) => {
      const fullName = getRiderFullName(rider).toLowerCase();
      const email = (rider.email || "").toLowerCase();
      const phone = getPhoneNumber(rider).toLowerCase();
      return (
        fullName.includes(query) ||
        email.includes(query) ||
        phone.includes(query) ||
        (rider.id?.toString() || "").includes(query)
      );
    });
    setFilteredRiders(filtered);
  };

  const getRiderFullName = (rider) => {
    const surname = rider.surname || rider.surName || "";
    const otherNames = rider.otherNames || rider.otherName || "";
    return `${surname} ${otherNames}`.trim() || "-";
  };

  const getPhoneNumber = (rider) => {
    // Check all possible phone number field names
    return rider.phoneNumber || 
           rider.telephoneNo || 
           rider.telephone || 
           rider.phone || 
           rider.phone_number || 
           "-";
  };

  const handleUnsuspendClick = (rider) => {
    const riderId = rider.id || rider.riderId;
    if (!riderId) return;
    
    setSelectedRider({
      id: riderId,
      name: getRiderFullName(rider)
    });
    setUnsuspendModalOpen(true);
  };

  const handleUnsuspendConfirm = async (reason) => {
    if (!selectedRider) return;

    try {
      setError("");
      setSuccessMessage("");
      setUnsuspendingId(selectedRider.id);

      console.log(`📡 Unsuspending rider ${selectedRider.id} with reason:`, reason);
      
      // Send reason in request body
      const response = await deliveryApi.unblockRider(selectedRider.id, reason);
      
      console.log("✅ Rider unsuspended successfully:", response);
      setSuccessMessage("Rider unsuspended successfully!");
      
      await fetchSuspendedRiders();
      setUnsuspendingId(null);
      setSelectedRider(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("❌ Error unsuspending rider:", err);
      const errorMsg = err?.message || `Failed to unsuspend rider. Please try again.`;
      setError(errorMsg);
      setUnsuspendingId(null);
    }
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
            <h1 className="text-center manage-riders-title">SUSPENDED RIDERS</h1>
            <span
              className="adjust-cancel-btn"
              onClick={toggleSuspendedRidersModal}
            >
              X
            </span>
          </div>
          <div className="text-center my-5">
            <p>Loading suspended riders...</p>
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
          <h1 className="text-center manage-riders-title">SUSPENDED RIDERS</h1>
          <div className="manage-riders-search-container">
            <input
              type="text"
              className="manage-riders-search"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <span
            className="adjust-cancel-btn"
            onClick={toggleSuspendedRidersModal}
          >
            X
          </span>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="alert alert-success mx-3 mt-3" role="alert">
            <strong>✅ Success!</strong> {successMessage}
          </div>
        )}

        {/* Error Message */}
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
            <table className="mt-0 manage-riders-table" style={{ width: "100%", minWidth: "800px" }}>
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>Name</th>
                  <th>Phone number</th>
                  <th>Email</th>
                  <th>Gender</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRiders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      No suspended riders found
                    </td>
                  </tr>
                ) : (
                  filteredRiders.map((rider, index) => {
                    const riderId = rider.id || rider.riderId;
                    return (
                      <tr key={riderId || index}>
                        <td>{index + 1}</td>
                        <td>{getRiderFullName(rider)}</td>
                        <td>{getPhoneNumber(rider)}</td>
                        <td>{rider.email || "-"}</td>
                        <td>
                          {rider.gender 
                            ? rider.gender.charAt(0).toUpperCase() 
                            : "-"}
                        </td>
                        <td>
                          <button
                            className="btn-link text-primary unsuspend-btn"
                            onClick={() => handleUnsuspendClick(rider)}
                            disabled={unsuspendingId === riderId}
                            style={{
                              opacity: unsuspendingId === riderId ? 0.7 : 1,
                              cursor: unsuspendingId === riderId ? "not-allowed" : "pointer",
                              border: "none",
                              background: "none",
                              color: unsuspendingId === riderId ? "#999" : "#28a745",
                              textDecoration: "underline",
                              fontSize: "14px",
                            }}
                          >
                            {unsuspendingId === riderId ? "Unsuspending..." : "Unsuspend"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Unsuspend Modal */}
      <UnsuspendModal
        isOpen={unsuspendModalOpen}
        onClose={() => {
          setUnsuspendModalOpen(false);
          setSelectedRider(null);
        }}
        onConfirm={handleUnsuspendConfirm}
        riderName={selectedRider?.name || "this rider"}
      />
    </div>
  );
};

export default SuspendedRiders;
