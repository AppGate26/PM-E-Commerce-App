import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../../../Styles/Delivery/Delivery.css";
import { apiRequest } from "../../../lib/config";

const OfficerDetailView = ({ officerId, onClose }) => {
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [officerData, setOfficerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [suspending, setSuspending] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");

  useEffect(() => {
    if (officerId) {
      fetchOfficerDetails();
    }
  }, [officerId]);

  const fetchOfficerDetails = async () => {
    setLoading(true);
    setError("");
    try {
      console.log("═══════════════════════════════════════════════════════════");
      console.log("OfficerDetailView: Fetching officer details...");
      console.log("OfficerDetailView: Officer ID:", officerId);
      
      const response = await apiRequest(`/admin/recovery-agents/${officerId}`, "GET");
      
      const data = response.data || response;
      
      // Format the data for display
      const formattedData = {
        id: data.id || data.recoveryAgentId,
        identifier: data.id || data.recoveryAgentId || `PM/RD/${officerId}/AUTOGEN`,
        surname: data.lastName || data.surname || "",
        otherNames: data.firstName || data.otherNames || "",
        contactAddress: data.contactAddress || "",
        officeAddress: data.officeAddress || "",
        nationality: data.nationality || "",
        nin: data.nin || "",
        bvn: data.bvn || "",
        nextOfKin: data.nextOfKin || "",
        nextOfKinAddress: data.nextOfKinAddress || "",
        gender: data.gender ? data.gender.toUpperCase() : "",
        dob: data.dob ? new Date(data.dob).toLocaleDateString('en-GB') : "",
        email: data.email || "",
        telephoneNo: data.phoneNumber || data.telephoneNo || "",
        passport: data.passport || data.passportUrl || null,
        license: data.license || data.licenseUrl || null,
        signature: data.signature || data.signatureUrl || null,
      };
      
      setOfficerData(formattedData);
      
      console.log("OfficerDetailView: ✅ Officer details loaded");
      console.log("═══════════════════════════════════════════════════════════");
    } catch (err) {
      console.error("═══════════════════════════════════════════════════════════");
      console.error("OfficerDetailView: ❌ Error fetching officer details");
      console.error("OfficerDetailView: Error message:", err.message);
      console.error("═══════════════════════════════════════════════════════════");
      setError("Failed to load officer details. Please try again.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!officerId) return;
    
    setSuspending(true);
    setError("");
    setSuccess(false);
    
    try {
      console.log("═══════════════════════════════════════════════════════════");
      console.log("OfficerDetailView: SUSPENDING RECOVERY AGENT");
      console.log("OfficerDetailView: Agent ID:", officerId);
      console.log("OfficerDetailView: Reason:", suspendReason);
      
      const requestBody = {
        reasonForSuspension: suspendReason || "Agent suspended by admin",
      };
      
      console.log("OfficerDetailView: Calling PUT /admin/recovery-agents/" + officerId + "/suspend");
      
      await apiRequest(`/admin/recovery-agents/${officerId}/suspend`, "PUT", requestBody);
      
      console.log("OfficerDetailView: ✅ SUCCESS - Agent suspended");
      console.log("═══════════════════════════════════════════════════════════");
      
      setSuccess(true);
      setShowSuspendConfirm(false);
      setSuspendReason("");
      
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error("═══════════════════════════════════════════════════════════");
      console.error("OfficerDetailView: ❌ ERROR SUSPENDING AGENT");
      console.error("OfficerDetailView: Error message:", err.message);
      console.error("═══════════════════════════════════════════════════════════");
      
      const userFriendlyError = err.message || "Failed to suspend recovery agent. Please try again.";
      setError(userFriendlyError);
      setShowSuspendConfirm(false);
      setTimeout(() => setError(""), 5000);
    } finally {
      setSuspending(false);
    }
  };

  return (
    <>
      <div>
        <div className="Csh-container pt-1">
          <div className="sticky-top header-form">
            <button
              className="btn btn-primary fw-bold"
              style={{ position: "absolute", left: "1em", top: "1em" }}
            >
              <Link to="/adminDashboard" className="text-white">
                Dashboard
              </Link>
            </button>
            <h1 className="text-center mt-2">RECOVERY OFFICER'S DETAILS</h1>
            <span className="adjust-cancel-btn" onClick={onClose}>
              X
            </span>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert" style={{ margin: "1rem 0" }}>
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success" role="alert" style={{ margin: "1rem 0" }}>
              Recovery agent suspended successfully!
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <div>Loading officer details...</div>
            </div>
          ) : officerData ? (
            <div className="product-box">
              <div className="rider-detail-header mb-3">
                <span className="rider-id-text">{officerData.identifier}</span>
                <button className="btn-link text-primary ms-3">Edit</button>
              </div>
              <div className="delivery-box_grid">
                <div className="">
                  <label className="fw-bold">SURNAME</label>
                  <br />
                  <input
                    type="text"
                    className="product-box-inputs"
                    value={officerData.surname}
                    readOnly
                  />
                  <label className="fw-bold">OTHER NAMES</label>
                  <br />
                  <input
                    type="text"
                    className="product-box-inputs"
                    value={officerData.otherNames}
                    readOnly
                  />
                  <label className="fw-bold">CONTACT ADDRESS</label>
                  <br />
                  <textarea
                    className="msg-delivery"
                    value={officerData.contactAddress}
                    readOnly
                  />
                  <label className="fw-bold">OFFICE ADDRESS</label>
                  <br />
                  <textarea
                    className="msg-delivery"
                    value={officerData.officeAddress}
                    readOnly
                  />
                  <label className="fw-bold">GENDER</label>
                  <br />
                  <input
                    type="text"
                    className="product-box-inputs"
                    value={officerData.gender}
                    readOnly
                  />
                  <label className="fw-bold">D.O.B</label>
                  <br />
                  <input
                    type="text"
                    className="product-box-inputs"
                    value={officerData.dob}
                    readOnly
                  />
                  <label className="fw-bold">E-MAIL</label>
                  <br />
                  <input
                    type="email"
                    className="product-box-inputs"
                    value={officerData.email}
                    readOnly
                  />
                  <label className="fw-bold">TELEPHONE NO</label>
                  <br />
                  <input
                    type="tel"
                    className="product-box-inputs"
                    value={officerData.telephoneNo}
                    readOnly
                  />
                </div>

                <div className="">
                  <label className="fw-bold">NATIONALITY</label>
                  <br />
                  <input
                    type="text"
                    className="product-box-inputs"
                    value={officerData.nationality}
                    readOnly
                  />
                  <label className="fw-bold">NIN</label>
                  <br />
                  <input
                    type="text"
                    className="product-box-inputs"
                    value={officerData.nin}
                    readOnly
                  />
                  <label className="fw-bold">BVN</label>
                  <br />
                  <input
                    type="text"
                    className="product-box-inputs"
                    value={officerData.bvn}
                    readOnly
                  />
                  <label className="fw-bold">NEXT OF KIN</label>
                  <br />
                  <input
                    type="text"
                    className="product-box-inputs"
                    value={officerData.nextOfKin}
                    readOnly
                  />
                  <label className="fw-bold">NEXT OF KIN ADDRESS</label>
                  <br />
                  <textarea
                    className="msg-delivery"
                    value={officerData.nextOfKinAddress}
                    readOnly
                  />
                  <label className="fw-bold">UPLOAD PASSPORT</label>
                  <br />
                  <div className="delivery-passport">
                    {officerData.passport ? (
                      <img
                        src={officerData.passport}
                        alt="Passport"
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    ) : (
                      <div className="text-center p-3" style={{ color: "#999" }}>
                        No passport uploaded
                      </div>
                    )}
                  </div>
                  <label className="fw-bold">UPLOAD LICENCES</label>
                  <br />
                  <div className="delivery-passport">
                    {officerData.license ? (
                      <img
                        src={officerData.license}
                        alt="License"
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    ) : (
                      <div className="text-center p-3" style={{ color: "#999" }}>
                        No license uploaded
                      </div>
                    )}
                  </div>
                  <label className="fw-bold">SCAN IN SIGNATURE</label>
                  <br />
                  <div className="delivery-passport">
                    {officerData.signature ? (
                      <img
                        src={officerData.signature}
                        alt="Signature"
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    ) : (
                      <div className="text-center p-3" style={{ color: "#999" }}>
                        No signature uploaded
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-5">
              <div>No officer data available</div>
            </div>
          )}
          {officerData && (
            <div className="text-center mt-4">
              <button
                className="btn btn-danger delivery-info-save"
                onClick={() => setShowSuspendConfirm(true)}
                disabled={suspending}
              >
                SUSPEND AGENT
              </button>
            </div>
          )}
        </div>
      </div>

      {showSuspendConfirm && (
        <div className="modal-overlay-custom" style={{position:'fixed', height:'100%'}} onClick={() => setShowSuspendConfirm(false)}>
          <div className="modal-content-custom" onClick={(e) => e.stopPropagation()}>
            <h5 className="mb-3" style={{ color: "#0867db", fontWeight: "700" }}>SUSPEND RECOVERY AGENT</h5>
            <p>Are you sure you want to suspend this recovery agent?</p>
            <div className="mb-3">
              <label className="fw-bold">Reason for Suspension (Required):</label>
              <textarea
                className="form-control mt-2"
                rows="3"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Enter reason for suspending this agent..."
                required
              />
            </div>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowSuspendConfirm(false);
                  setSuspendReason("");
                }}
                disabled={suspending}
              >
                CANCEL
              </button>
              <button
                className="btn btn-danger"
                onClick={handleSuspend}
                disabled={suspending || !suspendReason.trim()}
              >
                {suspending ? "SUSPENDING..." : "SUSPEND"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OfficerDetailView;
