import React from "react";
import RiderReport from "./RiderReport";

const RiderReportModal = ({ isOpen, toggleRiderReportModal }) => {
  const closeModal = () => {
    toggleRiderReportModal();
  };

  if (!isOpen) return null;

  return (
    <div className="Csh_modal">
      <div className="Csh_modal-overlay " onClick={closeModal}></div>
      <div className="Csh_modal-content">
        <RiderReport toggleRiderReportModal={toggleRiderReportModal}/>
      </div>
    </div>
  );
};

export default RiderReportModal;
