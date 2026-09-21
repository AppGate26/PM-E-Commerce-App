import React from "react";
import List from "./List";

const OrdListModal = ({ isOpen, toggleOrdListModal }) => {
  const closeModal = () => {
    toggleOrdListModal();
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
        <List toggleOrdListModal={toggleOrdListModal} />
      </div>
    </div>
  );
};

export default OrdListModal;
