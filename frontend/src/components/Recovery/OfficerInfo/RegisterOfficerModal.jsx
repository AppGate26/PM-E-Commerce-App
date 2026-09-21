import React from "react";
import RegisterOfficer from "./RegisterOfficer";

const RegisterOfficerModal = ({ isOpen, toggleInfoModal }) => {
  if (!isOpen) return null;

  return (
    <div className="Csh_modal">
      <div className="Csh_modal-overlay" onClick={toggleInfoModal}></div>
      <div className="Csh_modal-content recovery-officer-modal-content">
        <RegisterOfficer toggleInfoModal={toggleInfoModal} />
      </div>
    </div>
  );
};

export default RegisterOfficerModal;
