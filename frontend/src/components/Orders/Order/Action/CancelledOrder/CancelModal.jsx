import React from "react";
import CancelledOrder from "./CancelledOrder";

const CancelModal = ({ isOpen, toggleCancelModal, initialOrderId, initialOrder }) => {
  const closeModal = () => {
    toggleCancelModal();
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
        <CancelledOrder
          toggleCancelModal={toggleCancelModal}
          initialOrderId={initialOrderId}
          initialOrder={initialOrder}
        />
      </div>
    </div>
  );
};

export default CancelModal;
