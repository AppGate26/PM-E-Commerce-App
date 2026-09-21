import React from "react";
import OrderListPaid from "./OrderListPaid";

const OrdListPaidModal = ({ isOpen, toggleOlpModal }) => {
  const closeModal = () => {
    toggleOlpModal();
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
        <OrderListPaid toggleOlpModal={toggleOlpModal} />
      </div>
    </div>
  );
};

export default OrdListPaidModal;
