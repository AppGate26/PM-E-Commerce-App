import React from "react";
import OnlineOrder from "./OnlineOrder";

const OnlineOrderModal = ({ isOpen, toggleOnOrsModal }) => {
  const closeModal = () => {
    toggleOnOrsModal();
  };

  if (!isOpen) return null;

  return (
    <div className="Csh_modal">
      <div className="Csh_modal-overlay " onClick={closeModal}></div>
      <div className="Csh_modal-content">
        <OnlineOrder toggleOnOrsModal={toggleOnOrsModal}/>
      </div>
    </div>
  );
};

export default OnlineOrderModal;
