import React from "react";
import LoanReport from "./LoanReport";

const LoanReportModal = ({ isOpen, toggleLoanReportModal }) => {
  if (!isOpen) return null;

  return (
    <div className="Csh_modal">
      <div className="Csh_modal-overlay" onClick={toggleLoanReportModal}></div>
      <div
        className="Csh_modal-content loan-report-modal-host"
        style={{ maxWidth: "98vw", width: "1450px", maxHeight: "94vh", overflow: "auto", padding: 0 }}
      >
        <LoanReport toggleLoanReportModal={toggleLoanReportModal} />
      </div>
    </div>
  );
};

export default LoanReportModal;



















