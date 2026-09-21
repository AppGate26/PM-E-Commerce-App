import React from "react";
import RiderDetailView from "./RiderDetailView";

const RiderDetailModal = ({ isOpen, riderId, onClose, onEdit }) => {
  console.log("RiderDetailModal: Render - isOpen:", isOpen, "riderId:", riderId);
  
  if (!isOpen) {
    console.log("RiderDetailModal: Modal is closed, returning null");
    return null;
  }

  console.log("RiderDetailModal: Modal is open, rendering with riderId:", riderId);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="Csh_modal" style={{ zIndex: 1060 }}>
      <div className="Csh_modal-overlay" onClick={handleOverlayClick}></div>
      <div className="Csh_modal-content" style={{ maxWidth: "95%", maxHeight: "95vh", overflow: "auto" }}>
        <RiderDetailView riderId={riderId} onClose={onClose} onEdit={onEdit} />
      </div>
    </div>
  );
};

export default RiderDetailModal;

