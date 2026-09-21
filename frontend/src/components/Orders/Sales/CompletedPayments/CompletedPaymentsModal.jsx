// CompletedPaymentsModal.jsx
import React from "react";
import CompletedPayments from "./CompletedPayments";
import "./CompletedPayments.css";

const CompletedPaymentsModal = ({ isOpen, toggleCompletedPaymentsModal }) => {
  if (!isOpen) return null;

  return (
    <div className="cmp-pay-modal-wrapper">
      <div className="cmp-pay-modal-overlay" onClick={toggleCompletedPaymentsModal}></div>
      <div className="cmp-pay-modal-container">
        <CompletedPayments toggleCompletedPaymentsModal={toggleCompletedPaymentsModal} />
      </div>
    </div>
  );
};

export default CompletedPaymentsModal;
