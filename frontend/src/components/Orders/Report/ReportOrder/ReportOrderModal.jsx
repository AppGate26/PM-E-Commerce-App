import React from "react";
import ReportOrder from "./ReportOrder";

const ReportOrderModal = ({ isOpen, toggleReportOrModal }) => {
  const closeModal = () => {
    toggleReportOrModal();
  };

  if (!isOpen) return null;

  return (
    <div className="Csh_modal">
      <div className="Csh_modal-overlay" onClick={closeModal}></div>
      <div className="Csh_modal-content">
        <ReportOrder toggleReportOrModal={toggleReportOrModal} />
      </div>
    </div>
  );
};

export default ReportOrderModal;