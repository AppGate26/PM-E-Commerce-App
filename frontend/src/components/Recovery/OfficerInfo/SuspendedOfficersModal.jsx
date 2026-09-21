import React from "react";
import SuspendedOfficers from "./SuspendedOfficers";

const SuspendedOfficersModal = ({ isOpen, toggleSuspendedOfficersModal }) => {
  if (!isOpen) return null;

  return (
    <div className="Csh_modal" style={{ zIndex: 1050 }}>
      <div className="Csh_modal-overlay" onClick={toggleSuspendedOfficersModal}></div>
      <div className="Csh_modal-content suspended-recovery-modal-content">
        <SuspendedOfficers toggleSuspendedOfficersModal={toggleSuspendedOfficersModal} />
      </div>
    </div>
  );
};

export default SuspendedOfficersModal;




















