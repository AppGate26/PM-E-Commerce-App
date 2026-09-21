import React from "react";
import Setup from "./Setup";

const ModalStockSetup = ({ isOpen, toggleStockSetup }) => {
  const closeModal = () => {
    toggleStockSetup();
  };

  if (!isOpen) return null;

  return (
    <div className="stock_setup_modal">
      <div className="stock_setup_modal-overlay " onClick={closeModal}></div>
      <div className="stock_setup_modal-content">
        <Setup toggleStockSetup={toggleStockSetup} />
      </div>
    </div>
  );
};

export default ModalStockSetup;
