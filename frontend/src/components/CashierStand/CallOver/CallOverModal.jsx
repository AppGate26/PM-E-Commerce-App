import React from "react";
import CallOver from "./CallOver";

const CallOverModal = ({ isOpen, toggleCOModal }) => {
  const closeModal = () => {
    toggleCOModal();
  };

  if (!isOpen) return null;

  return (
    <div className="CO_modal">
      <div className="CO_modal-overlay " onClick={closeModal}></div>
      <div className="CO_modal-content">
        <CallOver toggleCOModal={toggleCOModal}/>
      </div>
    </div>
  );
};

export default CallOverModal;
