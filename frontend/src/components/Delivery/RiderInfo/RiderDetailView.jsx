import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { deliveryApi } from "../../../lib/deliveryApi";
import "../../../Styles/Delivery/Delivery.css";

// Suspend Modal Component
const SuspendModal = ({ isOpen, onClose, onConfirm, riderName }) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError("Please provide a reason for suspension");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      await onConfirm(reason);
      setReason("");
      onClose();
    } catch (err) {
      setError(err.message || "Failed to suspend rider");
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
          color: "#dc3545",
          marginBottom: "16px",
        }}>
          Suspend Rider
        </h3>
        
        <p style={{
          fontSize: "1rem",
          color: "#666",
          marginBottom: "20px",
        }}>
          Are you sure you want to suspend <strong>{riderName}</strong>?
        </p>

        <div style={{ marginBottom: "20px" }}>
          <label style={{
            display: "block",
            fontSize: "0.9rem",
            fontWeight: 600,
            color: "#495057",
            marginBottom: "8px",
          }}>
            Reason for Suspension <span style={{ color: "#dc3545" }}>*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError("");
            }}
            placeholder="Enter reason for suspension..."
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
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "0.95rem",
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Suspending..." : "Suspend Rider"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Header shared by every render branch below - a plain flex row so the close
// button always sits inline and visible, instead of relying on the old
// .adjust-cancel-btn's hardcoded offsets (left: 75em; top: -5rem) which were
// tuned for a different, wider modal and pushed the "X" off-screen here.
const RiderViewHeader = ({ onClose }) => (
  <div className="riderbox-standard-header">
    <div>
      <h1 className="riderbox-standard-title">Rider Details</h1>
      <p className="riderbox-standard-subtitle">Read-only view of the rider's registered information.</p>
    </div>
    <div className="riderbox-standard-header-actions">
      <Link to="/adminDashboard" className="manage-riders-btn manage-riders-btn-primary">
        Dashboard
      </Link>
      <button type="button" className="manage-riders-btn-icon" onClick={onClose} aria-label="Close">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  </div>
);

// Static label + value display for a read-only field - deliberately not an
// <input>, so the view screen can't be mistaken for the editable rider form.
const ViewField = ({ label, value, multiline }) => (
  <div className="rider-view-field">
    <label>{label}</label>
    <div className={multiline ? "rider-view-value rider-view-value-multiline" : "rider-view-value"}>
      {value || <span className="rider-view-empty">Not provided</span>}
    </div>
  </div>
);

const RiderDetailView = ({ riderId, onClose, onEdit }) => {
  const [rider, setRider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendLoading, setSuspendLoading] = useState(false);
  const [suspendSuccess, setSuspendSuccess] = useState(false);

  useEffect(() => {
    console.log("RiderDetailView: Component mounted/updated");
    console.log("RiderDetailView: riderId prop:", riderId);
    console.log("RiderDetailView: riderId type:", typeof riderId);
    console.log("RiderDetailView: riderId is truthy?", !!riderId);
    console.log("RiderDetailView: riderId === 0?", riderId === 0);
    
    if (riderId !== null && riderId !== undefined && riderId !== "") {
      console.log("RiderDetailView: riderId is valid, fetching details...");
      fetchRiderDetails();
    } else {
      console.warn("RiderDetailView: riderId is missing or invalid!");
      setError("Rider ID is missing. Cannot load rider details.");
      setLoading(false);
    }
  }, [riderId]);

  const fetchRiderDetails = async () => {
    try {
      console.log("RiderDetailView: ========== STARTING FETCH ==========");
      console.log("RiderDetailView: Fetching rider details for ID:", riderId);
      setLoading(true);
      setError("");
      setRider(null);

      const endpoint = `/users/rider/${riderId}`;
      console.log("RiderDetailView: API endpoint:", endpoint);
      console.log("RiderDetailView: Making API request...");

      const response = await deliveryApi.getRiderById(riderId);
      
      console.log("RiderDetailView: ========== API RESPONSE RECEIVED ==========");
      console.log("RiderDetailView: Raw API response:", response);
      console.log("RiderDetailView: Response type:", typeof response);
      console.log("RiderDetailView: Response is null?", response === null);
      console.log("RiderDetailView: Response is undefined?", response === undefined);
      console.log("RiderDetailView: Response keys:", Object.keys(response || {}));

      const riderData = response;

      console.log("RiderDetailView: Final rider data:", riderData);
      console.log("RiderDetailView: Rider data type:", typeof riderData);
      console.log("RiderDetailView: Rider data is null?", riderData === null);
      console.log("RiderDetailView: Rider data keys:", Object.keys(riderData || {}));
      
      if (riderData) {
        console.log("RiderDetailView: Surname:", riderData.surname);
        console.log("RiderDetailView: Other Names:", riderData.otherNames);
        console.log("RiderDetailView: Email:", riderData.email);
        console.log("RiderDetailView: Phone:", riderData.telephoneNo || riderData.phone);
        setRider(riderData);
        console.log("RiderDetailView: ✅ Rider data set successfully");
      } else {
        console.error("RiderDetailView: ❌ Rider data is null or undefined after extraction");
        setError("Rider data not found in response.");
      }
    } catch (err) {
      console.error("RiderDetailView: ========== ERROR OCCURRED ==========");
      console.error("RiderDetailView: Error type:", typeof err);
      console.error("RiderDetailView: Error object:", err);
      console.error("RiderDetailView: Error message:", err?.message);
      console.error("RiderDetailView: Error stack:", err?.stack);
      console.error("RiderDetailView: Error status:", err?.status);
      console.error("RiderDetailView: Error data:", err?.data);
      
      const errorMsg = err?.message || err?.data?.message || "Failed to load rider details. Please try again.";
      console.error("RiderDetailView: Setting error message:", errorMsg);
      setError(errorMsg);
    } finally {
      console.log("RiderDetailView: ========== FETCH COMPLETED ==========");
      console.log("RiderDetailView: Setting loading to false");
      setLoading(false);
    }
  };

  const handleSuspend = async (reason) => {
    try {
      setSuspendLoading(true);
      console.log(`📡 Suspending rider ${riderId} with reason:`, reason);

      const response = await deliveryApi.suspendRider(riderId, reason);

      console.log("✅ Rider suspended successfully:", response);
      
      // Refresh rider details to show updated status
      await fetchRiderDetails();
      
      setSuspendSuccess(true);
      setTimeout(() => setSuspendSuccess(false), 3000);
      
    } catch (err) {
      console.error("❌ Error suspending rider:", err);
      throw new Error(err?.message || err?.data?.message || "Failed to suspend rider");
    } finally {
      setSuspendLoading(false);
    }
  };

  const getRiderFullName = () => {
    if (!rider) return "";
    const surname = rider.surname || rider.surName || "";
    const otherNames = rider.otherNames || rider.othernames || rider.other_names || "";
    return `${surname} ${otherNames}`.trim() || "Rider";
  };

  const titleCase = (value) => {
    if (!value) return "";
    return String(value)
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    } catch {
      return dateString;
    }
  };

  console.log("RiderDetailView: Render - loading:", loading, "error:", error, "rider:", rider ? "exists" : "null");

  if (loading) {
    return (
      <div className="riderbox-standard-card">
        <RiderViewHeader onClose={onClose} />
        <div className="text-center my-5">
          <p>Loading rider details...</p>
          <p style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>
            Rider ID: {riderId || "Not provided"}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="riderbox-standard-card">
        <RiderViewHeader onClose={onClose} />
        <div className="manage-riders-alert">
          <strong>Error loading rider details:</strong> {error}
          <br />
          <small>Rider ID: {riderId || "Not provided"}</small>
        </div>
      </div>
    );
  }

  if (!rider) {
    return (
      <div className="riderbox-standard-card">
        <RiderViewHeader onClose={onClose} />
        <div className="manage-riders-alert">
          No rider data available.
          <br />
          <small>Rider ID: {riderId || "Not provided"}</small>
        </div>
      </div>
    );
  }

  const riderName = getRiderFullName();

  return (
    <div className="riderbox-standard-card">
      <RiderViewHeader onClose={onClose} />

      {suspendSuccess && (
        <div className="riderbox-success-alert">
          <strong>✅ Success!</strong> Rider has been suspended successfully.
        </div>
      )}

      <div className="rider-detail-header mb-3">
        <span className="rider-id-text">PM/RD/{riderId || "ID"}/AUTOGEN</span>
        <div style={{ display: "flex", gap: "10px" }}>
          {onEdit && (
            <button
              className="manage-riders-btn manage-riders-btn-small manage-riders-btn-primary"
              onClick={() => onEdit(rider)}
            >
              Edit
            </button>
          )}
          <button
            className="manage-riders-btn manage-riders-btn-small manage-riders-btn-danger"
            onClick={() => setSuspendModalOpen(true)}
          >
            Suspend
          </button>
        </div>
      </div>

      {/* Suspended Status Badge (if rider is suspended) */}
      {rider.suspended && (
        <div style={{
          backgroundColor: "#f8d7da",
          color: "#721c24",
          padding: "8px 15px",
          borderRadius: "4px",
          margin: "0 0 15px 0",
          border: "1px solid #f5c6cb",
          fontSize: "14px",
        }}>
          <strong>⛔ This rider is currently suspended.</strong>
          {rider.reasonForSuspension && (
            <div style={{ marginTop: "5px", fontSize: "13px" }}>
              Reason: {rider.reasonForSuspension}
            </div>
          )}
        </div>
      )}

      <div className="rider-view-grid">
        <div>
          <ViewField label="Surname" value={rider.surname || rider.surName} />
          <ViewField label="Other Names" value={rider.otherNames || rider.othernames || rider.other_names} />
          <ViewField
            label="Contact Address"
            value={rider.contactAddress || rider.contact_address}
            multiline
          />
          <ViewField label="Gender" value={titleCase(rider.gender)} />
          <ViewField label="Mode of Transport" value={titleCase(rider.modeOfTransport || rider.mode_of_transport)} />
          <ViewField label="D.O.B" value={formatDate(rider.dateOfBirth || rider.dob || rider.date_of_birth)} />
          <ViewField label="E-mail" value={rider.email} />
          <ViewField
            label="Telephone No"
            value={rider.telephoneNo || rider.telephone || rider.phone || rider.phoneNumber || rider.phone_number}
          />
        </div>

        <div>
          <ViewField label="Nationality" value={rider.nationality} />
          <ViewField label="NIN" value={rider.nin || rider.ninNumber} />
          <ViewField label="BVN" value={rider.bvn || rider.bvnNumber} />
          <ViewField label="Next of Kin" value={rider.nextOfKin || rider.next_of_kin} />

          <div className="rider-view-field">
            <label>Passport</label>
            <div className="rider-view-photo">
              {rider.passportImage || rider.passport_image ? (
                <img src={rider.passportImage || rider.passport_image} alt="Passport" />
              ) : (
                <span className="rider-view-empty">No passport uploaded</span>
              )}
            </div>
          </div>

          <div className="rider-view-field">
            <label>Licence</label>
            <div className="rider-view-photo">
              {rider.licenseImage || rider.license_image || rider.licenceImage ? (
                <img src={rider.licenseImage || rider.license_image || rider.licenceImage} alt="License" />
              ) : (
                <span className="rider-view-empty">No license uploaded</span>
              )}
            </div>
          </div>

          <div className="rider-view-field">
            <label>Signature</label>
            <div className="rider-view-photo">
              {rider.signatureImage || rider.signature_image ? (
                <img src={rider.signatureImage || rider.signature_image} alt="Signature" />
              ) : (
                <span className="rider-view-empty">No signature uploaded</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Suspend Confirmation Modal */}
      <SuspendModal
        isOpen={suspendModalOpen}
        onClose={() => setSuspendModalOpen(false)}
        onConfirm={handleSuspend}
        riderName={riderName}
      />
    </div>
  );
};

export default RiderDetailView;
