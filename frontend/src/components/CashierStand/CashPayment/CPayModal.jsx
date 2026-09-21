import React from "react";
import CashPayment from "./CashPayment";

const CPayModal = ({ isOpen, toggleCPayModal, selectedReferenceNumber = "" }) => {
  const closeModal = () => {
    toggleCPayModal();
  };

  if (!isOpen) return null;

  return (
    <div className="CPay_modal">
      <div className="CPay_modal-overlay " onClick={closeModal}></div>
      <div className="CPay_modal-content cash-payment-content">
        <CashPayment
          toggleCPayModal={toggleCPayModal}
          selectedReferenceNumber={selectedReferenceNumber}
        />
      </div>
    </div>
  );
};

export default CPayModal;
