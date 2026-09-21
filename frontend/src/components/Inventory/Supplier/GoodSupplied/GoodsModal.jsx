import React from "react";
import Goods from "./Goods";

const GoodsModal = ({ isOpen, toggleGoods }) => {
  const closeModal = () => {
    toggleGoods();
  };

  if (!isOpen) return null;

  return (
    <div className="goods_modal">
      <div className="goods_modal-overlay " onClick={closeModal}></div>
      <div className="goods_modal-content">
        <Goods toggleGoods={toggleGoods} />
      </div>
    </div>
  );
};

export default GoodsModal;
