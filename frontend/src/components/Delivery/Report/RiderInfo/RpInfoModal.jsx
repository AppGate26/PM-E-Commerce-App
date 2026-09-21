import React from "react";
import RpInfo from "./RpInfo";

const RpInfoModal = ({ isOpen, toggleRpInfoModal }) => {
  const closeModal = () => {
    toggleRpInfoModal();
  };

  if (!isOpen) return null;

  return (
    <div className="Csh_modal">
      <div className="Csh_modal-overlay " onClick={closeModal}></div>
      <div className="Csh_modal-content">
        <RpInfo toggleRpInfoModal={toggleRpInfoModal}/>
      </div>
    </div>
  );
};

export default RpInfoModal;
