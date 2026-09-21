import React, { useState } from "react";
import AdminNav from "../../Navigation/AdminNav";
import "../MailMessenger.css";
import "./SentMail.css";

const SentMail = () => {
  const [selectedMail, setSelectedMail] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // "list" or "detail"

  const sentMails = [
    {
      id: 1,
      sender: "ABIOLA",
      recipient: "ADEBISI ADEWALE",
      subject: "NOTICE FOR SALARY DELAYED",
      message: "I REGRET TO INFORM YOU THAT DUE TO FINANCIAL CONSTRAINTS, THE COMPANY WILL BE UNABLE TO PROCESS YOUR SALARY PAYMENT FOR THIS PERIOD. I UNDERSTAND THE INCONVENIENCE THIS MAY CAUSE, AND I ASSURE YOU THAT WE ARE ACTIVELY WORKING TOWARDS RESOLVING THIS SITUATION AS SOON AS POSSIBLE.",
      date: "13 MAY",
    },
    {
      id: 2,
      sender: "ABIOLA",
      recipient: "ADEBISI ADEWALE",
      subject: "I REGRET TO INFORM YOU THAT DUE",
      message: "I REGRET TO INFORM YOU THAT DUE TO FINANCIAL CONSTRAINTS, THE COMPANY WILL BE UNABLE TO PROCESS YOUR SALARY PAYMENT FOR THIS PERIOD.",
      date: "13 MAY",
    },
    {
      id: 3,
      sender: "ABIOLA",
      recipient: "ADEBISI ADEWALE",
      subject: "I REGRET TO INFORM YOU THAT DUE",
      message: "I REGRET TO INFORM YOU THAT DUE TO FINANCIAL CONSTRAINTS, THE COMPANY WILL BE UNABLE TO PROCESS YOUR SALARY PAYMENT FOR THIS PERIOD.",
      date: "13 MAY",
    },
    {
      id: 4,
      sender: "ABIOLA",
      recipient: "ADEBISI ADEWALE",
      subject: "I REGRET TO INFORM YOU THAT DUE",
      message: "I REGRET TO INFORM YOU THAT DUE TO FINANCIAL CONSTRAINTS, THE COMPANY WILL BE UNABLE TO PROCESS YOUR SALARY PAYMENT FOR THIS PERIOD.",
      date: "13 MAY",
    },
  ];

  const handleMailClick = (mail) => {
    setSelectedMail(mail);
    setViewMode("detail");
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedMail(null);
  };

  return (
    <div className="admin-container">
      <AdminNav />
      <div className="sent-mail-parent">
        <div className="sent-mail-card-full">
          <div className="sent-mail-header-blue">
            <span>{viewMode === "detail" ? "SENT MESSAGE" : "SENT"}</span>
          </div>

          {viewMode === "list" ? (
            <div className="sent-mail-list">
              {sentMails.map((mail) => (
                <div
                  key={mail.id}
                  className={`sent-mail-item ${selectedMail?.id === mail.id ? "selected" : ""}`}
                  onClick={() => handleMailClick(mail)}
                >
                  <div className="sent-mail-sender">{mail.sender}</div>
                  <div className="sent-mail-subject">{mail.subject}</div>
                  <div className="sent-mail-date">{mail.date}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="sent-mail-detail">
              {selectedMail && (
                <>
                  <div className="sent-detail-row">
                    <div className="sent-detail-label">MESSAGE TO:</div>
                    <div className="sent-detail-value">{selectedMail.recipient}</div>
                  </div>
                  <div className="sent-detail-row">
                    <div className="sent-detail-label">SUBJET:</div>
                    <div className="sent-detail-value">{selectedMail.subject}</div>
                  </div>
                  <div className="sent-detail-row">
                    <div className="sent-detail-label">MESSAGE:</div>
                    <div className="sent-detail-message-box">
                      {selectedMail.message}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SentMail;
