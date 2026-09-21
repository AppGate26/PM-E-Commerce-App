import React from "react";
import LoanNotification from "./LoanNotification";

const LoanNotificationModal = ({ isOpen, toggleLoanNotificationModal }) => {
  if (!isOpen) return null;

  return (
    <div className="Csh_modal" style={{ zIndex: 1050 }}>
      <div className="Csh_modal-overlay" onClick={toggleLoanNotificationModal}></div>
      <div
        className="Csh_modal-content loan-notify-modal-host"
        style={{ maxWidth: "98vw", width: "1450px", maxHeight: "94vh", overflow: "auto", padding: 0 }}
      >
        <LoanNotification toggleLoanNotificationModal={toggleLoanNotificationModal} />
      </div>
    </div>
  );
};

export default LoanNotificationModal;




















