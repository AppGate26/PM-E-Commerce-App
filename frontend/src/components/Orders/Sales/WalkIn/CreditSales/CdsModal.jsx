import React from "react";
import CreditSales from "./CreditSales";

const CdsModal = ({ isOpen, toggleCdsModal }) => {
  const closeModal = () => {
    toggleCdsModal();
  };

  if (!isOpen) return null;

  return (
    <div className="Csh_modal">
      <div className="Csh_modal-overlay " onClick={closeModal}></div>
      <div className="Csh_modal-content">
        <CreditSales toggleCdsModal={toggleCdsModal} />
      </div>
    </div>
  );
};

export default CdsModal;
