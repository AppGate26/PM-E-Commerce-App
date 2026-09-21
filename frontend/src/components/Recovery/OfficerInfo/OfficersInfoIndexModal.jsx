import React from "react";
import OfficersInfoIndex from "./OfficersInfoIndex";

const OfficersInfoIndexModal = ({
  isOpen,
  onClose,
  onRegister,
  onViewOfficer,
  onViewSuspended,
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="Csh_modal" style={{ zIndex: 1050 }}>
      <div className="Csh_modal-overlay" onClick={handleOverlayClick}></div>
      <div className="Csh_modal-content manage-recovery-modal-content">
        <OfficersInfoIndex
          onClose={onClose}
          onRegister={onRegister}
          onViewOfficer={onViewOfficer}
          onViewSuspended={onViewSuspended}
        />
      </div>
    </div>
  );
};

export default OfficersInfoIndexModal;
