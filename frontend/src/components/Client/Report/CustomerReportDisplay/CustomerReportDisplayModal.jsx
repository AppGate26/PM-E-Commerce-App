// Pm\src\components\Client\Report\CustomerReportDisplay\CustomerReportDisplayModal.jsx
import React from "react";
import "./CustomerReportDisplayModal.css";
import CustomerReportDisplay from "./CustomerReportDisplay";

const CustomerReportDisplayModal = ({ isOpen, toggleCrdModal }) => {
  const closeModal = () => {
    toggleCrdModal();
  };

  if (!isOpen) return null;

  return (
    <div className="customer-report-display-modal">
      {/* Full dark overlay */}
      <div
        className="customer-report-display-overlay"
        onClick={closeModal}
      ></div>

      {/* Centered modal content */}
      <div className="customer-report-display-content">
        <CustomerReportDisplay closeModal={closeModal} />
      </div>
    </div>
  );
};

export default CustomerReportDisplayModal;