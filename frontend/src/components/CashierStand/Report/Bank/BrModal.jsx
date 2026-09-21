import React from "react";
import BankReport from "./BankReport";

const BrModal = ({ isOpen, toggleBrModal }) => {
  const closeModal = () => {
    toggleBrModal();
  };

  if (!isOpen) return null;

  return (
    <div className="cashier-report_modal">
      <div className="cashier-report_modal-overlay " onClick={closeModal}></div>
      <div className="cashier-report_modal-content">
        <BankReport toggleBrModal={toggleBrModal} />
      </div>
    </div>
  );
};

export default BrModal;
