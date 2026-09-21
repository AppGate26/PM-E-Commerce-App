import React from "react";
import SalesReportDisplay from "./SalesReportDisplay";

const ReportsModal = ({ isOpen, toggleReportModal }) => {
  const closeModal = () => {
    toggleReportModal();
  };

  if (!isOpen) return null;

  return (
    <div className="Csh_modal">
      <div className="Csh_modal-overlay" onClick={closeModal}></div>
      <div className="Csh_modal-content">
        <SalesReportDisplay toggleReportModal={toggleReportModal} />
      </div>
    </div>
  );
};

export default ReportsModal;