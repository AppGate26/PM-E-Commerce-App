import React from "react";
import RefundNtf from "./RefundNtf";

const RefundNtfModal = ({ isOpen, toggleNtfRefundModal }) => {
  const closeModal = () => {
    toggleNtfRefundModal();
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
        <RefundNtf toggleNtfRefundModal={toggleNtfRefundModal} />
      </div>
    </div>
  );
};

export default RefundNtfModal;
