import React from "react";
import Cancelled from "./Cancelled";

const CancelledModal = ({ isOpen, toggleNotCancelModal }) => {
  const closeModal = () => {
    toggleNotCancelModal();
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
        <Cancelled toggleNotCancelModal={toggleNotCancelModal} />
      </div>
    </div>
  );
};

export default CancelledModal;
