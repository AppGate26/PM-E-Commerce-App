import React from "react";
import "./OnSupCus.css";
import OnSupCus from "./OnSupCus";

const OnSupCusModal = ({ isOpen, toggleOscModal }) => {
  const closeModal = () => {
    toggleOscModal();
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
      <div className="customer-info-modal-content">
        <OnSupCus closeModal={closeModal} />
      </div>
    </div>
  );
};

export default OnSupCusModal;
