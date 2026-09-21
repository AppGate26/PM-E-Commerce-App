import React from "react";
import ReturnOrder from "./ReturnOrder";

const ReturnOrderModal = ({ isOpen, toggleReturnOrderModal }) => {
  if (!isOpen) return null;

  return (
    <div className="Csh_modal">
      <div
        className="Csh_modal-overlay"
        onClick={toggleReturnOrderModal}
        style={{ background: "rgba(0, 0, 1, 0.38)" }}
      ></div>
      <div className="Csh_modal-content return-order-modal-host">
        <ReturnOrder toggleReturnOrderModal={toggleReturnOrderModal} />
      </div>
    </div>
  );
};

export default ReturnOrderModal;
