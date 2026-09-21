import React from "react";
import ManageOfficers from "./ManageOfficers";

const ManageOfficersModal = ({ isOpen, toggleManageOfficersModal, onViewOfficer }) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      toggleManageOfficersModal();
    }
  };

  return (
    <div className="Csh_modal" style={{ zIndex: 1050 }}>
      <div className="Csh_modal-overlay" onClick={handleOverlayClick}></div>
      <div className="Csh_modal-content manage-recovery-modal-content">
        <ManageOfficers toggleManageOfficersModal={toggleManageOfficersModal} onViewOfficer={onViewOfficer} />
      </div>
    </div>
  );
};

export default ManageOfficersModal;




















