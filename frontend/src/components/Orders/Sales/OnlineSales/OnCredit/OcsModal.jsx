import React from "react";
import OnCreditSales from "./OnCreditSales";

const OcsModal = ({ isOpen, toggleOcsModal }) => {
  const closeModal = () => {
    toggleOcsModal();
  };

  if (!isOpen) return null;

  return (
    <div className="Csh_modal">
      <div className="Csh_modal-overlay " onClick={closeModal}></div>
      <div className="Csh_modal-content">
        <OnCreditSales toggleOcsModal={toggleOcsModal} />
      </div>
    </div>
  );
};

export default OcsModal;
