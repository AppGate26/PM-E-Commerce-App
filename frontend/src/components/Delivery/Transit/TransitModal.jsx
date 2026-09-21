import React from "react";
import Transit from "./Transit";

const TransitModal = ({ isOpen, toggleTransitModal }) => {
  const closeModal = () => {
    toggleTransitModal();
  };

  if (!isOpen) return null;

  return (
    <div className="Csh_modal">
      <div className="Csh_modal-overlay " onClick={closeModal}></div>
      <div className="Csh_modal-content">
        <Transit toggleTransitModal={toggleTransitModal}/>
      </div>
    </div>
  );
};

export default TransitModal;
