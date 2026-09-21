import React from "react";
import CashReport from "./CashReport";

const CrModal = ({ isOpen, toggleCrModal }) => {
  const closeModal = () => {
    toggleCrModal();
  };

  if (!isOpen) return null;

  return (
    <div className="cashier-report_modal">
      <div className="cashier-report_modal-overlay " onClick={closeModal}></div>
      <div className="cashier-report_modal-content">
        <CashReport toggleCrModal={toggleCrModal} />
      </div>
    </div>
  );
};

export default CrModal;
