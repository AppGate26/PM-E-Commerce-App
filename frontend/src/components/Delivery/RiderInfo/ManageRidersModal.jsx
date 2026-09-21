import React from "react";
import ManageRiders from "./ManageRiders";

const ManageRidersModal = ({ isOpen, toggleManageRidersModal, onViewRider }) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      toggleManageRidersModal();
    }
  };

  return (
    <div className="Csh_modal manage-riders-modal" style={{ zIndex: 1050 }}>
      <div className="Csh_modal-overlay" onClick={handleOverlayClick}></div>
      <div className="Csh_modal-content manage-riders-modal-content">
        <ManageRiders toggleManageRidersModal={toggleManageRidersModal} onViewRider={onViewRider} />
      </div>
    </div>
  );
};

export default ManageRidersModal;
