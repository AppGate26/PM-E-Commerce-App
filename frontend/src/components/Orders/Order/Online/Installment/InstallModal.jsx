import React from "react";
import Install from "./Install";

const InstallModal = ({ isOpen, toggleInstallModal }) => {
  const closeModal = () => {
    toggleInstallModal();
  };

  if (!isOpen) return null;

  return (
    <div className="Csh_modal">
      <div className="Csh_modal-overlay " onClick={closeModal}></div>
      <div className="Csh_modal-content">
        <Install toggleInstallModal={toggleInstallModal}/>
      </div>
    </div>
  );
};

export default InstallModal;
