import React from "react";
import "./WalkInSupCus.css";
import WalkInSupCus from "./WalkInSupCus";

const WalkInSupCusModal = ({ isOpen, toggleWscModal }) => {
  const closeModal = () => {
    toggleWscModal();
  };

  if (!isOpen) return null;

  return (
    <div className="client-navTab_modal">
      {/* Full dark overlay */}
      <div
        className="client-navTab_modal-overlay"
        onClick={closeModal}
      ></div>

      {/* Centered modal content - exact size and positioning */}
      <div className="customer-info-modal-content walkin-suspended-report-modal-content">
        <WalkInSupCus closeModal={closeModal} />
      </div>
    </div>
  );
};

export default WalkInSupCusModal;
