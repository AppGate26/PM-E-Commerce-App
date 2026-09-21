import React from "react";
import PaySupplier from "./PaySupplier";

const PaySupplierModal = ({ isOpen, togglePaySupplier }) => {
  if (!isOpen) return null;
  return (
    <div className="Csh_modal">
      <div className="Csh_modal-overlay" onClick={togglePaySupplier}></div>
      <div className="Csh_modal-content">
        <PaySupplier togglePaySupplier={togglePaySupplier} />
      </div>
    </div>
  );
};

export default PaySupplierModal;
