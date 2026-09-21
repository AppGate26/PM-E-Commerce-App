// Pm\src\components\Client\Report\CustomerDetails\OnlineCus\OnlineCusModal.jsx
import React from "react";
import "./OnlineCusModal.css";
import OnlineCus from "./OnlineCus";

const OnlineCusModal = ({ isOpen, toggleOcdModal }) => {
  const closeModal = () => {
    toggleOcdModal();
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
      <div className="customer-info-modal-content">
        <OnlineCus closeModal={closeModal} />
      </div>
    </div>
  );
};

export default OnlineCusModal;