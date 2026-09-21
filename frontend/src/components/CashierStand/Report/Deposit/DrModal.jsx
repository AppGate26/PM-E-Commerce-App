import React from "react";
import DepositReport from "./DepositReport";

const DrModal = ({ isOpen, toggleDrModal }) => {
  const closeModal = () => {
    toggleDrModal();
  };

  if (!isOpen) return null;

  return (
    <div className="cashier-report_modal">
      <div className="cashier-report_modal-overlay " onClick={closeModal}></div>
      <div className="cashier-report_modal-content">
        <DepositReport toggleDrModal={toggleDrModal} />
      </div>
    </div>
  );
};

export default DrModal;
