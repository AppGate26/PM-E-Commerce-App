import React from "react";
import OneOfOrder from "./OneOfOrder";

const OneOfOrdModal = ({ isOpen, toggleOneOfOrdModal }) => {
  const closeModal = () => {
    toggleOneOfOrdModal();
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
        <OneOfOrder toggleOneOfOrdModal={toggleOneOfOrdModal} />
      </div>
    </div>
  );
};

export default OneOfOrdModal;
