import React from "react";
import LoanRecoveryReport from "./LoanRecoveryReport";
import "../../CustomerLedger/CustomerLedgerModal.css";

const LoanRecoveryReportModal = ({ isOpen, toggleModal }) => {
  if (!isOpen) return null;

  return (
    <div className="Csh_modal">
      <div className="Csh_modal_overlay" onClick={toggleModal} />
      <div
        className="Csh_modal_content"
        style={{
          maxWidth: "min(1200px, 96vw)",
          width: "100%",
          maxHeight: "92vh",
          overflowY: "auto",
          borderRadius: "12px",
        }}
      >
        <div style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0 }}>Loan Recovery Report</h3>
            <button
              type="button"
              className="btn-close"
              onClick={toggleModal}
              aria-label="Close"
            />
          </div>
          <LoanRecoveryReport />
        </div>
      </div>
    </div>
  );
};

export default LoanRecoveryReportModal;
