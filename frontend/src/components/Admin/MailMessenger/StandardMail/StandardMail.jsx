import React, { useState } from "react";
import AdminNav from "../../Navigation/AdminNav";
import "../MailMessenger.css";
import "./StandardMail.css";

const StandardMail = () => {
  const [formData, setFormData] = useState({
    emailAddress: "",
    senderName: "",
    to: "",
    cc: "",
    subject: "",
    body: "",
  });
  const [attachedFiles, setAttachedFiles] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
    console.log("Send email", formData);
  };

  const isSendDisabled = !formData.to || !formData.subject || !formData.body;

  return (
    <div className="admin-container">
      <AdminNav />
      <div className="standard-mail-parent">
        <div className="standard-mail-card-full">
          <div className="standard-mail-header-blue">
            <span>STANDARD MAIL</span>
          </div>
          <div className="standard-mail-form">
            {/* Your Email Address */}
            <div className="standard-form-group">
              <label className="standard-label">YOUR EMAIL ADDRESS</label>
              <input
                type="email"
                className="standard-input"
                name="emailAddress"
                value={formData.emailAddress}
                onChange={handleInputChange}
                placeholder="Enter your email address"
              />
            </div>

            {/* Your Sender Name */}
            <div className="standard-form-group">
              <label className="standard-label">YOUR SENDER NAME</label>
              <input
                type="text"
                className="standard-input"
                name="senderName"
                value={formData.senderName}
                onChange={handleInputChange}
                placeholder="Enter sender name"
              />
            </div>

            {/* TO */}
            <div className="standard-form-group">
              <label className="standard-label">TO:</label>
              <input
                type="text"
                className="standard-input"
                name="to"
                value={formData.to}
                onChange={handleInputChange}
                placeholder="Enter recipient email"
              />
            </div>

            {/* CC */}
            <div className="standard-form-group">
              <label className="standard-label">CC:</label>
              <input
                type="text"
                className="standard-input"
                name="cc"
                value={formData.cc}
                onChange={handleInputChange}
                placeholder="Enter CC email (optional)"
              />
            </div>

            {/* SUBJECT */}
            <div className="standard-form-group">
              <label className="standard-label">SUBJECT:</label>
              <input
                type="text"
                className="standard-input"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Enter email subject"
              />
            </div>

            {/* Email Body */}
            <div className="standard-form-group">
              <label className="standard-label">EMAIL BODY</label>
              <textarea
                className="standard-textarea"
                name="body"
                value={formData.body}
                onChange={handleInputChange}
                placeholder="Enter your message"
                rows={8}
              />
            </div>

            {/* Attachment Section */}
            <div className="standard-attachment-section">
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
                    stroke="#999"
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
              </div>
            </div>

            {/* Send Email Button */}
            <div className="standard-actions">
              <button
                className="standard-send-btn"
                onClick={handleSendEmail}
                disabled={isSendDisabled}
              >
                SEND EMAIL
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StandardMail;
