import React from "react";
import CancelledReport from "./CancelledReport";

const CancelledReportModal = ({ isOpen, toggleCancelledReportModal }) => {
  if (!isOpen) return null;
  return (
    <div className="Csh_modal">
      <div className="Csh_modal-overlay" onClick={toggleCancelledReportModal}></div>
      <div className="Csh_modal-content">
        <CancelledReport toggleCancelledReportModal={toggleCancelledReportModal} />
      </div>
    </div>
  );
};

export default CancelledReportModal;
