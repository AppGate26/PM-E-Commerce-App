import React from "react";
import Balance from "./Balance";

const BalanceModal = ({ isOpen, toggleBalanceModal }) => {
  const closeModal = () => {
    toggleBalanceModal();
  };

  if (!isOpen) return null;

  return (
    <div className="CO_modal">
      <div className="CO_modal-overlay " onClick={closeModal}></div>
      <div className="CO_modal-content be-modal-content">
        <Balance toggleBalanceModal={toggleBalanceModal}/>
      </div>
    </div>
  );
};

export default BalanceModal;
