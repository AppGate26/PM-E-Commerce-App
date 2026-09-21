import React from "react";
import Refund from "./Refund";

const RefundModal = ({ isOpen, toggleRefundModal }) => {
  const closeModal = () => {
    toggleRefundModal();
  };

  if (!isOpen) return null;

  return (
    <div className="Csh_modal">
      <div
        className="Csh_modal-overlay "
        onClick={closeModal}
        style={{ background: "rgba(0, 0, 1, 0.38)" }}
      ></div>
      <div className="Csh_modal-content">
        <Refund toggleRefundModal={toggleRefundModal} />
      </div>
    </div>
  );
};

export default RefundModal;
