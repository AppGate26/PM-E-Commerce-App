import React from "react";
import CompletedOrders from "./CompletedOrders";
import "../CompletedPayments/CompletedPayments.css";

const CompletedOrdersModal = ({ isOpen, toggleCompletedOrdersModal }) => {
  if (!isOpen) return null;

  return (
    <div className="cmp-pay-modal-wrapper">
      <div className="cmp-pay-modal-overlay" onClick={toggleCompletedOrdersModal}></div>
      <div className="cmp-pay-modal-container">
        <CompletedOrders toggleCompletedOrdersModal={toggleCompletedOrdersModal} />
      </div>
    </div>
  );
};

export default CompletedOrdersModal;
