import React from "react";
import SuspendedRiders from "./SuspendedRiders";

const SuspendedRidersModal = ({ isOpen, toggleSuspendedRidersModal }) => {
  if (!isOpen) return null;

  return (
    <div className="Csh_modal">
      <div className="Csh_modal-overlay" onClick={toggleSuspendedRidersModal}></div>
      <div className="Csh_modal-content">
        <SuspendedRiders toggleSuspendedRidersModal={toggleSuspendedRidersModal} />
      </div>
    </div>
  );
};

export default SuspendedRidersModal;





















