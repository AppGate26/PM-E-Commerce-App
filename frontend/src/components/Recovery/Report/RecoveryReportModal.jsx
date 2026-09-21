import React from "react";
import RecoveryReport from "./RecoveryReport";

const RecoveryReportModal = ({ isOpen, toggleRecoveryReportModal }) => {
  if (!isOpen) return null;

  return (
    <div className="Csh_modal">
      <div className="Csh_modal-overlay" onClick={toggleRecoveryReportModal}></div>
      <div className="Csh_modal-content" style={{ maxWidth: "1400px", width: "95%" }}>
        <RecoveryReport toggleRecoveryReportModal={toggleRecoveryReportModal} />
      </div>
    </div>
  );
};

export default RecoveryReportModal;




















