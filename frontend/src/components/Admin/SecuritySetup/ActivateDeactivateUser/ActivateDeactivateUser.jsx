import React, { useState, useEffect } from "react";
import AdminNav from "../../Navigation/AdminNav";
import { apiRequest } from "../../../../lib/config";
import "../../Admin.css";
import "./ActivateDeactivateUser.css";

const ActivateDeactivateUser = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [email, setEmail] = useState("");
  const [userStatus, setUserStatus] = useState("");
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Fetch all users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("Fetching users...");
      
      const response = await apiRequest("/admin/security/users", "GET");
      console.log("Users response:", response);
      
      let usersList = [];
      if (Array.isArray(response)) {
        usersList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        usersList = response.data;
      } else if (response?.response?.data && Array.isArray(response.response.data)) {
        usersList = response.response.data;
      }
      
      setUsers(usersList);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  // Handle email input change - search for user
  const handleEmailChange = async (e) => {
    const emailValue = e.target.value;
    setEmail(emailValue);
    
    if (emailValue && users.length > 0) {
      const user = users.find(u => u.email?.toLowerCase() === emailValue.toLowerCase());
      if (user) {
        setSelectedUser(user);
        setUserStatus(user.status || user.isActive ? "ACTIVE" : "INACTIVE");
      } else {
        setSelectedUser(null);
        setUserStatus("");
      }
    } else {
      setSelectedUser(null);
      setUserStatus("");
    }
  };

  // Update user status (Activate/Deactivate)
  const handleUpdateStatus = async () => {
    if (!email) {
      setError("Please enter an email address");
      return;
    }

    if (!userStatus) {
      setError("Please select a status");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      
      console.log("Updating user status...");
      const payload = {
        email: email,
        status: userStatus.toUpperCase()
      };
      
      const response = await apiRequest("/admin/security/users/status", "PUT", payload);
      console.log("Status update response:", response);
      
      setSuccess(`User status updated to ${userStatus} successfully!`);
      
      // Refresh users list
      setTimeout(() => {
        fetchUsers();
        setEmail("");
        setUserStatus("");
        setSelectedUser(null);
      }, 1500);
      
    } catch (err) {
      console.error("Error updating user status:", err);
      setError(err?.message || "Failed to update user status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Send warning to user
  const handleSendWarning = async () => {
    if (!email) {
      setError("Please enter an email address");
      return;
    }

    if (!warning) {
      setError("Please enter a warning message");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      
      console.log("Sending warning...");
      const payload = {
        email: email,
        warningMessage: warning
      };
      
      const response = await apiRequest("/admin/security/users/warning", "POST", payload);
      console.log("Warning response:", response);
      
      setSuccess("Warning sent successfully!");
      setWarning("");
      
      setTimeout(() => {
        setSuccess("");
      }, 3000);
      
    } catch (err) {
      console.error("Error sending warning:", err);
      setError(err?.message || "Failed to send warning. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Change user password
  const handleChangePassword = async () => {
    if (!email) {
      setError("Please enter an email address");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError("Please enter both password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      
      console.log("Changing password...");
      const payload = {
        email: email,
        newPassword: newPassword
      };
      
      const response = await apiRequest("/admin/security/users/change-password", "PUT", payload);
      console.log("Password change response:", response);
      
      setSuccess("Password changed successfully!");
      setShowPasswordModal(false);
      setNewPassword("");
      setConfirmPassword("");
      
      setTimeout(() => {
        setSuccess("");
      }, 3000);
      
    } catch (err) {
      console.error("Error changing password:", err);
      setError(err?.message || "Failed to change password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Clear form
  const handleClear = () => {
    setEmail("");
    setUserStatus("");
    setWarning("");
    setSelectedUser(null);
    setError("");
    setSuccess("");
  };

  return (
    <div className="admin-container">
      <AdminNav />
      <div className="activate-main">
        <h1 className="activate-heading">ACTIVATE OR DE-ACTIVATE USERS</h1>

        {error && (
          <div className="alert alert-danger" style={{ 
            margin: "20px auto", 
            maxWidth: "600px", 
            padding: "10px", 
            borderRadius: "4px", 
            backgroundColor: "#f8d7da", 
            color: "#721c24", 
            border: "1px solid #f5c6cb",
            textAlign: "center"
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ 
            margin: "20px auto", 
            maxWidth: "600px", 
            padding: "10px", 
            borderRadius: "4px", 
            backgroundColor: "#d4edda", 
            color: "#155724", 
            border: "1px solid #c3e6cb",
            textAlign: "center"
          }}>
            <strong>Success!</strong> {success}
          </div>
        )}

        <div className="activate-box">
          <div className="activate-form-column">
            {/* Email Input */}
            <div className="input-cont">
              <label htmlFor="email">EMAIL:</label>
              <input
                type="email"
                name="email"
                id="email"
                className="input-field"
                value={email}
                onChange={handleEmailChange}
                placeholder="Enter user email"
                disabled={loading}
              />
              {selectedUser && (
                <small style={{ color: "#28a745", marginTop: "5px", display: "block" }}>
                  ✓ User found: {selectedUser.fullName || selectedUser.username}
                </small>
              )}
            </div>

            {/* User Status Dropdown */}
            <div className="input-cont">
              <label htmlFor="userStatus">USER'S STATUS:</label>
              <select
                id="userStatus"
                className="input-field"
                value={userStatus}
                onChange={(e) => setUserStatus(e.target.value)}
                disabled={loading}
                style={{ cursor: loading ? "not-allowed" : "pointer" }}
              >
                <option value="">Select Status</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="LOCKED">LOCKED</option>
              </select>
            </div>

            {/* Warning Message */}
            <div className="input-cont">
              <label htmlFor="warning">WARNING:</label>
              <textarea
                name="warning"
                id="warning"
                className="input-field"
                value={warning}
                onChange={(e) => setWarning(e.target.value)}
                placeholder="Enter warning message to send to user"
                rows="3"
                disabled={loading}
                style={{ resize: "vertical" }}
              />
            </div>
          </div>

          {/* Mid-section Action Buttons */}
          <div className="btn-cont btn-cont-mid">
            <button 
              className="btn-update" 
              onClick={handleUpdateStatus}
              disabled={loading || !email || !userStatus}
              style={{ 
                opacity: (loading || !email || !userStatus) ? 0.6 : 1,
                cursor: (loading || !email || !userStatus) ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "UPDATING..." : "UPDATE USER STATUS"}
            </button>
            <button 
              className="btn-warning" 
              onClick={handleSendWarning}
              disabled={loading || !email || !warning}
              style={{ 
                opacity: (loading || !email || !warning) ? 0.6 : 1,
                cursor: (loading || !email || !warning) ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "SENDING..." : "SEND WARNING"}
            </button>
          </div>

          {/* Bottom Action Buttons */}
          <div className="btn-cont">
            <button 
              className="btn-change" 
              onClick={() => {
                if (!email) {
                  setError("Please enter an email address first");
                  return;
                }
                setShowPasswordModal(true);
              }}
              disabled={loading || !email}
              style={{ 
                opacity: (loading || !email) ? 0.6 : 1,
                cursor: (loading || !email) ? "not-allowed" : "pointer"
              }}
            >
              CHANGE PASSWORD
            </button>
            <button 
              className="btn-close" 
              onClick={handleClear}
              disabled={loading}
            >
              CLEAR
            </button>
          </div>
        </div>

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="modal-overlay" style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000
          }}>
            <div className="modal-content" style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
            }}>
              <h3 style={{ marginBottom: "20px", color: "#333" }}>Change Password</h3>
              <p style={{ marginBottom: "15px", color: "#666" }}>
                Changing password for: <strong>{email}</strong>
              </p>
              
              <div className="input-cont" style={{ marginBottom: "15px" }}>
                <label htmlFor="newPassword">NEW PASSWORD:</label>
                <input
                  type="password"
                  id="newPassword"
                  className="input-field"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  disabled={loading}
                />
              </div>
              
              <div className="input-cont" style={{ marginBottom: "20px" }}>
                <label htmlFor="confirmPassword">CONFIRM PASSWORD:</label>
                <input
                  type="password"
                  id="confirmPassword"
                  className="input-field"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={loading}
                />
              </div>
              
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setNewPassword("");
                    setConfirmPassword("");
                    setError("");
                  }}
                  style={{
                    padding: "8px 20px",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  style={{
                    padding: "8px 20px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1
                  }}
                  disabled={loading}
                >
                  {loading ? "CHANGING..." : "CHANGE PASSWORD"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivateDeactivateUser;