import React from "react";
import InstallOrder from "./InstallOrder";

const InstallOrdModal = ({ isOpen, toggleInstallOrdModal }) => {
  const closeModal = () => {
    toggleInstallOrdModal();
  };

  if (!isOpen) return null;

  return (
    <div className="Csh_modal">
      <div
        className="Csh_modal-overlay "
        onClick={closeModal}
        style={{ background: "rgba(0, 0, 1, 0.38)" }}
      ></div>
      <div className="Csh_modal-content">
        <InstallOrder toggleInstallOrdModal={toggleInstallOrdModal} />
      </div>
    </div>
  );
};

export default InstallOrdModal;
