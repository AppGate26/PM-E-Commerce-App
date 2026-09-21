import React from "react";
import Payment from "./Payment.jsx";

const PaymentModal = ({ isOpen, togglePayment }) => {
  const closeModal = () => {
    togglePayment();
  };

  if (!isOpen) return null;

  return (
    <div className="payment_modal">
      <div className="payment_modal-overlay " onClick={closeModal}></div>
      <div className="payment_modal-content">
        <Payment togglePayment={togglePayment} />
      </div>
    </div>
  );
};

export default PaymentModal;
