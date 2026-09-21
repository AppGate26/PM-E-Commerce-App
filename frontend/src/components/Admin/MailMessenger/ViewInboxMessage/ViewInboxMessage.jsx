import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNav from "../../Navigation/AdminNav";
import "../MailMessenger.css";
import "./ViewInboxMessage.css";

const ViewInboxMessage = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("inbox"); // inbox, sent, compose
  const [selectedMail, setSelectedMail] = useState(null);

  const inboxMails = [
    { id: 1, sender: "ABIOLA", subject: "MORNING SIR, I'D LIKE TO SEEK YOUR APPROVAL.....", date: "13 MAY" },
    { id: 2, sender: "ABIOLA", subject: "MORNING SIR, I'D LIKE TO SEEK YOUR APPROVAL.....", date: "13 MAY" },
    { id: 3, sender: "ABIOLA", subject: "MORNING SIR, I'D LIKE TO SEEK YOUR APPROVAL.....", date: "13 MAY" },
    { id: 4, sender: "ABIOLA", subject: "MORNING SIR, I'D LIKE TO SEEK YOUR APPROVAL.....", date: "13 MAY" },
  ];

  const sentMails = [
    { id: 1, sender: "ABIOLA", subject: "I REGRET TO INFORM YOU THAT DUE", date: "13 MAY" },
    { id: 2, sender: "ABIOLA", subject: "I REGRET TO INFORM YOU THAT DUE", date: "13 MAY" },
    { id: 3, sender: "ABIOLA", subject: "I REGRET TO INFORM YOU THAT DUE", date: "13 MAY" },
    { id: 4, sender: "ABIOLA", subject: "I REGRET TO INFORM YOU THAT DUE", date: "13 MAY" },
  ];

  const handleMailClick = (mail) => {
    setSelectedMail(mail.id === selectedMail?.id ? null : mail);
  };

  const handleViewChange = (view) => {
    setActiveView(view);
    if (view === "compose") {
      navigate("/admin/mail-messenger/compose-mail");
    }
  };

  return (
    <div className="admin-container">
      <AdminNav />
      <div className="inbox-view-parent">
        {/* Sub-navigation Sidebar */}
        <div className="inbox-view-sidebar">
          <div
            className={`inbox-sidebar-item ${activeView === "inbox" ? "active" : ""}`}
            onClick={() => handleViewChange("inbox")}
          >
            INBOX
          </div>
          <div
            className={`inbox-sidebar-item ${activeView === "sent" ? "active" : ""}`}
            onClick={() => handleViewChange("sent")}
          >
            SENT MESSAGE
          </div>
          <div
            className={`inbox-sidebar-item ${activeView === "compose" ? "active" : ""}`}
            onClick={() => handleViewChange("compose")}
          >
            COMPOSE
          </div>
        </div>

        {/* Main Content Area */}
        <div className="inbox-view-content">
          <div className="inbox-mail-card-full">
            <div className="inbox-mail-header-blue">
              <span>{activeView === "inbox" ? "INBOX" : activeView === "sent" ? "SENT" : "COMPOSE"}</span>
            </div>

            {activeView === "inbox" && (
              <div className="inbox-mail-list">
                {inboxMails.map((mail) => (
                  <div
                    key={mail.id}
                    className={`inbox-mail-item ${selectedMail?.id === mail.id ? "selected" : ""}`}
                    onClick={() => handleMailClick(mail)}
                  >
                    <div className="inbox-mail-sender">{mail.sender}</div>
                    <div className="inbox-mail-subject">{mail.subject}</div>
                    <div className="inbox-mail-date">{mail.date}</div>
                  </div>
                ))}
              </div>
            )}

            {activeView === "sent" && (
              <div className="inbox-mail-list">
                {sentMails.map((mail) => (
                  <div
                    key={mail.id}
                    className={`inbox-mail-item ${selectedMail?.id === mail.id ? "selected" : ""}`}
                    onClick={() => handleMailClick(mail)}
                  >
                    <div className="inbox-mail-sender">{mail.sender}</div>
                    <div className="inbox-mail-subject">{mail.subject}</div>
                    <div className="inbox-mail-date">{mail.date}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewInboxMessage;
