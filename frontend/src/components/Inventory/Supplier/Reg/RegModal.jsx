import React from "react";
import SupplierReg from "./SupplierReg.jsx";

const RegModal = ({ isOpen, toggleRegModal }) => {
  const closeModal = () => {
    toggleRegModal();
  };

  if (!isOpen) return null;

  return (
    <div className="reg_modal">
      <div className="reg_modal-overlay " onClick={closeModal}></div>
      <div className="reg_modal-content" >
        <SupplierReg  toggleGoods={toggleRegModal}/>
      </div>
    </div>
  );
};

export default RegModal;
