import React from "react";
import OnOneSales from "./OnOneSales";

const OnOnesModal = ({ isOpen, toggleOosModal }) => {
  const closeModal = () => {
    toggleOosModal();
  };

  if (!isOpen) return null;

  return (
    <div className="Csh_modal">
      <div className="Csh_modal-overlay " onClick={closeModal}></div>
      <div className="Csh_modal-content">
        <OnOneSales toggleOosModal={toggleOosModal}/>
      </div>
    </div>
  );
};

export default OnOnesModal;
