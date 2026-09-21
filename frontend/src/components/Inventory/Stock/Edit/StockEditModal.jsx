import React from "react";
import StockEdit from "./StockEdit";

const StockEditModal = ({ isOpen, toggleStockEdit }) => {
  const closeModal = () => {
    toggleStockEdit();
  };

  if (!isOpen) return null;

  return (
    <div className="stock_setup_modal">
      <div className="stock_setup_modal-overlay " onClick={closeModal}></div>
      <div className="stock_setup_modal-content" id="stock_setup-content">
        <StockEdit toggleStockEdit={toggleStockEdit} />
      </div>
    </div>
  );
};

export default StockEditModal;
