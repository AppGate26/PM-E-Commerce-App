import React from "react";
import RecoveryNotification from "./RecoveryNotification";

const RecoveryNotificationModal = ({ isOpen, toggleRecoveryNotificationModal }) => {
  if (!isOpen) return null;

  return (
    <div className="Csh_modal" style={{ zIndex: 1200 }}>
      <div className="Csh_modal-overlay" onClick={toggleRecoveryNotificationModal}></div>
      <div
        className="Csh_modal-content recovery-notify-modal-host"
        style={{ maxWidth: "98vw", width: "1450px", maxHeight: "94vh", overflow: "auto", padding: 0 }}
      >
        <RecoveryNotification toggleRecoveryNotificationModal={toggleRecoveryNotificationModal} />
      </div>
    </div>
  );
};

export default RecoveryNotificationModal;
