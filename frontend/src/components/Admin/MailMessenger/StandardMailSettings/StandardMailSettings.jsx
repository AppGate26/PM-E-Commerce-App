import React, { useState } from "react";
import AdminNav from "../../Navigation/AdminNav";
import "../MailMessenger.css";
import "./StandardMailSettings.css";

const StandardMailSettings = () => {
  const [formData, setFormData] = useState({
    yourEmailAddress: "",
    yourSenderName: "",
    emailAddress: "",
    emailPassword: "",
    emailSenderName: "",
    userPassword: "",
  });
  const [attachedFiles, setAttachedFiles] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveInformation = () => {
    // TODO: Implement save functionality
    console.log("Saving information", formData);
  };

  const handleFileAttach = () => {
    // TODO: Implement file attachment
    console.log("Attach files");
  };

  const handleFileDelete = () => {
    setAttachedFiles([]);
  };

  const handleSendEmail = () => {
    // TODO: Implement send email
    console.log("Send email");
  };

  return (
    <div className="admin-container">
      <AdminNav />
      <div className="standard-settings-parent">
        <div className="standard-settings-card-full">
          <div className="standard-settings-header-blue">
            <span>STANDARD MAIL SETTING</span>
          </div>
          <div className="standard-settings-form">
            {/* Top Section */}
            <div className="standard-settings-top-section">
              <div className="standard-form-group">
                <label className="standard-label">YOUR EMAIL ADDRESS:</label>
                <input
                  type="email"
                  className="standard-input"
                  name="yourEmailAddress"
                  value={formData.yourEmailAddress}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                />
              </div>
              <div className="standard-form-group">
                <label className="standard-label">YOUR SENDER NAME:</label>
                <input
                  type="text"
                  className="standard-input"
                  name="yourSenderName"
                  value={formData.yourSenderName}
                  onChange={handleInputChange}
                  placeholder="Enter sender name"
                />
              </div>
            </div>

            {/* Middle Section - Personal Email Settings */}
            <div className="standard-settings-middle-section">
              <h2 className="standard-settings-section-title">
                PERSONAL EMAIL SETTING PAGE: EMAIL SETTINGS
              </h2>
              <div className="standard-settings-warning">
                INFOMATION SAVE ON THIS PAGE ARE KEPT CONFIDENTIAL AND PRIVATE
              </div>
              <div className="standard-settings-fields">
                <div className="standard-form-group">
                  <label className="standard-label">EMAIL ADDRESS:</label>
                  <input
                    type="email"
                    className="standard-input"
                    name="emailAddress"
                    value={formData.emailAddress}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="standard-form-group">
                  <label className="standard-label">EMAIL PASSWORD:</label>
                  <input
                    type="password"
                    className="standard-input"
                    name="emailPassword"
                    value={formData.emailPassword}
                    onChange={handleInputChange}
                    placeholder="Enter email password"
                  />
                </div>
                <div className="standard-form-group">
                  <label className="standard-label">EMAIL SENDER NAME:</label>
                  <input
                    type="text"
                    className="standard-input"
                    name="emailSenderName"
                    value={formData.emailSenderName}
                    onChange={handleInputChange}
                    placeholder="Enter email sender name"
                  />
                </div>
                <div className="standard-form-group">
                  <label className="standard-label">USER PASSWORD:</label>
                  <input
                    type="password"
                    className="standard-input"
                    name="userPassword"
                    value={formData.userPassword}
                    onChange={handleInputChange}
                    placeholder="Enter user password"
                  />
                </div>
              </div>
              <button className="standard-save-btn" onClick={handleSaveInformation}>
                SAVE INFORMATION
              </button>
            </div>

            {/* Bottom Section - Attachments and Send */}
            <div className="standard-settings-bottom-section">
              <div className="standard-attachment-info">
                <span className="standard-attachment-text">
                  ATTACHMENT: {attachedFiles.length} FILE(S) ATTACHED AT THIS TIME.
                </span>
              </div>
              <div className="standard-attachment-controls">
                <div className="standard-attachment-box">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#0867db"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </div>
                <div className="standard-attachment-buttons">
                  <button
                    className="standard-attach-btn"
                    onClick={handleFileAttach}
                  >
                    ATTACH FILES
                  </button>
                  <button
                    className="standard-delete-btn"
                    onClick={handleFileDelete}
                    disabled={attachedFiles.length === 0}
                  >
                    DELETE
                  </button>
                </div>
                <button
                  className="standard-send-email-btn"
                  onClick={handleSendEmail}
                >
                  SEND EMAIL
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StandardMailSettings;
