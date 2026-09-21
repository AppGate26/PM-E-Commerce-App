import React from "react";
import SupplierLedger from "./SupplierLedger";

const SupplierLedgerModal = ({ isOpen, toggleSupplierLedger }) => {
  if (!isOpen) return null;
  return (
    <div className="Csh_modal">
      <div className="Csh_modal-overlay" onClick={toggleSupplierLedger}></div>
      <div className="Csh_modal-content">
        <SupplierLedger toggleSupplierLedger={toggleSupplierLedger} />
      </div>
    </div>
  );
};

export default SupplierLedgerModal;
