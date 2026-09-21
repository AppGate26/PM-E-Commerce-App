// MrkPaidModal.js
import React from "react";
import MrkPaid from "./MrkPaid";

const MrkPaidModal = ({ isOpen, toggleMrkPaidModal }) => {
  if (!isOpen) return null;

  return (
    <div className="mrk-paid-modal-wrapper">
      <div className="mrk-paid-modal-overlay" onClick={toggleMrkPaidModal}></div>
      <div className="mrk-paid-modal-container">
        <MrkPaid toggleMrkPaidModal={toggleMrkPaidModal} />
      </div>
    </div>
  );
};

export default MrkPaidModal;