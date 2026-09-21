import React from "react";
import RpDelivery from "./RpDelivery";

const RpDeliveryModal = ({ isOpen, toggleRpDeliveryModal }) => {
  const closeModal = () => {
    toggleRpDeliveryModal();
  };

  if (!isOpen) return null;

  return (
    <div className="Csh_modal">
      <div className="Csh_modal-overlay " onClick={closeModal}></div>
      <div className="Csh_modal-content">
        <RpDelivery toggleRpDeliveryModal={toggleRpDeliveryModal} />
      </div>
    </div>
  );
};

export default RpDeliveryModal;
