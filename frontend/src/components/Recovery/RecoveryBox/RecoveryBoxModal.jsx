import React from "react";
import RecoveryBox from "./RecoveryBox";

const RecoveryBoxModal = ({ isOpen, toggleRecoveryBoxModal }) => {
  if (!isOpen) return null;

  return (
    <div className="Csh_modal" style={{ zIndex: 1050 }}>
      <div className="Csh_modal-overlay" onClick={toggleRecoveryBoxModal}></div>
      <div className="Csh_modal-content" style={{ maxWidth: "96%", width: "1400px", maxHeight: "92vh", overflow: "auto" }}>
        <RecoveryBox toggleRecoveryBoxModal={toggleRecoveryBoxModal} />
      </div>
    </div>
  );
};

export default RecoveryBoxModal;












