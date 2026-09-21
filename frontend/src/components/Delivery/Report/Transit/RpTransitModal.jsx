import React from "react";
import RpTransit from "./RpTransit";

const RpTransitModal = ({ isOpen, toggleRpTransitModal }) => {
  const closeModal = () => {
    toggleRpTransitModal();
  };

  if (!isOpen) return null;

  return (
    <div className="Csh_modal">
      <div className="Csh_modal-overlay " onClick={closeModal}></div>
      <div className="Csh_modal-content">
        <RpTransit toggleRpTransitModal={toggleRpTransitModal}/>
      </div>
    </div>
  );
};

export default RpTransitModal;
