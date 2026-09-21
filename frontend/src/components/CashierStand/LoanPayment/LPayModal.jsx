import React from "react";
import LoanPayment from "./LoanPayment";

const LPayModal = ({
  isOpen,
  toggleLPayModal,
  openBalanceFromLoan,
  selectedAccountNumber = "",
}) => {
  const closeModal = () => {
    toggleLPayModal();
  };

  if (!isOpen) return null;

  return (
    <div className="CPay_modal">
      <div className="CPay_modal-overlay " onClick={closeModal}></div>
      <div className="CPay_modal-content loan-payment-content">
        <LoanPayment
          toggleLPayModal={toggleLPayModal}
          openBalanceFromLoan={openBalanceFromLoan}
          selectedAccountNumber={selectedAccountNumber}
        />
      </div>
    </div>
  );
};

export default LPayModal;
