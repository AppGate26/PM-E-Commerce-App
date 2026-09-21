import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AdminNav from "../../Navigation/AdminNav";
import "../../Admin.css";
import "./ChangeUserPassword.css";
import logo from "../../../../assets/images/PMlogo.png";
import { useAuth } from "../../../../context/AuthContext";
import { apiRequest } from "../../../../lib/config";

const getUserDisplayName = (user = {}) => {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return fullName || user.fullName || user.username || user.email || "Current user";
};

const getUserId = (user = {}) =>
  user.id ||
  user.userId ||
  user.user_id ||
  user.userCode ||
  user.code ||
  "";

const ChangeUserPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();
  // Only the Security Setup submenu route is reached from inside the admin nav;
  // the dashboard "CHANGE PASSWORD" tile links to /change-password and should stand alone.
  const showAdminNav = isAdmin && location.pathname.includes("/security-setup/change-user-password");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [verifyNewPassword, setVerifyNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const currentUser = useMemo(
    () => ({
      id: getUserId(user),
      email: user?.email || "",
      name: getUserDisplayName(user),
      userCode: user?.userCode || user?.code || "",
    }),
    [user]
  );

  const clearPasswords = () => {
    setCurrentPassword("");
    setNewPassword("");
    setVerifyNewPassword("");
  };

  const handleClose = () => {
    clearPasswords();
    setError("");
    setSuccess("");
    navigate(-1);
  };

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  const handleChangePassword = async () => {
    if (!currentUser.email && !currentUser.id) {
      setError("Your login session does not include a user account.");
      return;
    }

    if (!currentPassword) {
      setError("Current password is required.");
      return;
    }

    if (!newPassword) {
      setError("New password is required.");
      return;
    }

    if (newPassword !== verifyNewPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword === currentPassword) {
      setError("New password must be different from current password.");
      return;
    }

    // Self-service change-password: the backend identifies the user from the JWT, so this works for
    // any signed-in role (cashier, etc.) and is NOT tied to the admin security endpoint.
    const requestBody = {
      currentPassword,
      newPassword,
      confirmPassword: verifyNewPassword,
    };

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      await apiRequest("/users/change-password", "POST", requestBody);
      setSuccess("Password changed successfully.");
      clearPasswords();
    } catch (err) {
      if (err?.status === 401 || String(err?.message || "").includes("Unauthorized")) {
        setError("Current password is incorrect.");
      } else if (err?.status === 403) {
        setError("You do not have permission to change this password.");
      } else {
        setError(err?.message || "Failed to change password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordToggle = (isVisible, onClick) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: "absolute",
        right: "10px",
        top: "50%",
        transform: "translateY(-50%)",
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: "13px",
        color: "#6c757d",
      }}
      aria-label={isVisible ? "Hide password" : "Show password"}
    >
      {isVisible ? "Hide" : "Show"}
    </button>
  );

  return (
    <div className={showAdminNav ? "admin-container" : "admin-container change-user-shell"}>
      {showAdminNav ? (
        <AdminNav />
      ) : (
        <header className="admin-sidebar-header">
          <div className="admin-header-bar">
            <Link to="/adminDashboard" className="admin-brand-block text-decoration-none">
              <img src={logo} alt="Peace of Mind logo" className="admin-logo" />
              <div className="admin-brand-copy">
                <span className="admin-brand-label">Peace of Mind</span>
                <span className="admin-header-title">Change Password</span>
              </div>
            </Link>
            <div className="admin-header-actions">
              <button className="back-icon" onClick={() => navigate(-1)} type="button" aria-label="Go back">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="logout-btn-header" onClick={handleLogout} type="button">
                Log out
              </button>
            </div>
          </div>
        </header>
      )}

      <div className="change-main">
        <div className="change-page-title">
          <h1 className="change-heading">Change Your Password</h1>
          <p>Update the password for your signed-in account.</p>
        </div>

        {error && (
          <div className="alert alert-danger mx-auto text-center" style={{ maxWidth: "600px" }}>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success mx-auto text-center" style={{ maxWidth: "600px" }}>
            {success}
          </div>
        )}

        <section className="change-box" aria-labelledby="change-password-title">
          <div className="change-card-header">
            <div>
              <h2 id="change-password-title">Password Settings</h2>
              <p>Use a new password that is different from your current one.</p>
            </div>
          </div>

          <div className="change-form-column">
            <div className="input-cont">
              <label htmlFor="email">EMAIL</label>
              <input
                type="email"
                name="email"
                id="email"
                className="input-field"
                value={currentUser.email}
                disabled
                readOnly
              />
              <small style={{ fontSize: "11px", color: "#28a745", marginTop: "4px", display: "block" }}>
                Signed in as {currentUser.name}
              </small>
            </div>

            <div className="input-cont">
              <label htmlFor="currentPassword">CURRENT PASSWORD:</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  name="currentPassword"
                  id="currentPassword"
                  className="input-field"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  style={{ paddingRight: "56px" }}
                />
                {renderPasswordToggle(showCurrentPassword, () => setShowCurrentPassword((value) => !value))}
              </div>
            </div>

            <div className="input-cont">
              <label htmlFor="newPassword">NEW PASSWORD:</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  id="newPassword"
                  className="input-field"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                  style={{ paddingRight: "56px" }}
                />
                {renderPasswordToggle(showNewPassword, () => setShowNewPassword((value) => !value))}
              </div>
              <small style={{ fontSize: "11px", color: "#6c757d", marginTop: "4px", display: "block" }}>
                Minimum 6 characters
              </small>
            </div>

            <div className="input-cont">
              <label htmlFor="verifyNewPassword">VERIFY NEW PASSWORD:</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showVerifyPassword ? "text" : "password"}
                  name="verifyNewPassword"
                  id="verifyNewPassword"
                  className="input-field"
                  value={verifyNewPassword}
                  onChange={(event) => setVerifyNewPassword(event.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                  style={{ paddingRight: "56px" }}
                />
                {renderPasswordToggle(showVerifyPassword, () => setShowVerifyPassword((value) => !value))}
              </div>
            </div>
          </div>

          <div className="change-action-row">
            <button className="change-secondary-btn" onClick={handleClose} disabled={loading} type="button">
              Cancel
            </button>
            <button
              className="change-primary-btn"
              onClick={handleChangePassword}
              disabled={loading}
              type="button"
            >
              {loading ? "Saving..." : "Save Password"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ChangeUserPassword;
