// Pm\src\components\Client\Report\CustomerDetails\WalkInCus\WalkInCusModal.jsx
import React from "react";
import "./WalkInCus.css";
import WalkInCus from "./WalkInCus";

const WalkInCusModal = ({ isOpen, toggleWcdModal }) => {
  const closeModal = () => {
    toggleWcdModal();
  };

  if (!isOpen) return null;

  return (
    <div className="client-navTab_modal">
      {/* Full dark overlay */}
      <div
        className="client-navTab_modal-overlay"
        onClick={closeModal}
      ></div>

      {/* Centered modal content */}
      <div className="customer-info-modal-content walkin-report-modal-content">
        <WalkInCus closeModal={closeModal} />
      </div>
    </div>
  );
};

export default WalkInCusModal;
