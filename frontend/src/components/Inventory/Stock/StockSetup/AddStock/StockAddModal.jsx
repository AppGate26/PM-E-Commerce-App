import React from "react";
import StockAdd from "./StockAdd";

const StockAddModal = ({ isOpen, toggleStockAdd }) => {
  const closeModal = () => {
    toggleStockAdd();
  };

  if (!isOpen) return null;

  return (
    <div className="stock_add_modal">
      <div className="stock_add_modal-overlay " onClick={closeModal}></div>
      <div className="stock_add_modal-content">
        <StockAdd toggleStockAdd={toggleStockAdd} />
      </div>
    </div>
  );
};

export default StockAddModal;
