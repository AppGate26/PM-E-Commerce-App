import React from "react";
import OfficerDetailView from "./OfficerDetailView";

const OfficerDetailModal = ({ isOpen, officerId, onClose }) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="Csh_modal" style={{ zIndex: 1060 }}>
      <div className="Csh_modal-overlay" onClick={handleOverlayClick}></div>
      <div className="Csh_modal-content" style={{ maxWidth: "95%", maxHeight: "95vh", overflow: "auto" }}>
        <OfficerDetailView officerId={officerId} onClose={onClose} />
      </div>
    </div>
  );
};

export default OfficerDetailModal;

