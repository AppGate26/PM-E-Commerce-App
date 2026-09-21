import React from "react";
import RestoreOrder from "./RestoreOrder";

const RestoreOrderModal = ({ isOpen, toggleRestoreOrderModal }) => {
  if (!isOpen) return null;

  return (
    <div className="Csh_modal">
      <div
        className="Csh_modal-overlay"
        onClick={toggleRestoreOrderModal}
        style={{ background: "rgba(0, 0, 1, 0.38)" }}
      ></div>
      <div className="Csh_modal-content restore-order-modal-host">
        <RestoreOrder toggleRestoreOrderModal={toggleRestoreOrderModal} />
      </div>
    </div>
  );
};

export default RestoreOrderModal;
