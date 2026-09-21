import React from "react";
import CashSales from "./CashSales";

const CshModal = ({ isOpen, toggleCshModal }) => {
  const closeModal = () => {
    toggleCshModal();
  };

  if (!isOpen) return null;

  return (
    <div className="Csh_modal">
      <div className="Csh_modal-overlay " onClick={closeModal}></div>
      <div className="Csh_modal-content">
        <CashSales toggleCshModal={toggleCshModal}/>
      </div>
    </div>
  );
};

export default CshModal;
