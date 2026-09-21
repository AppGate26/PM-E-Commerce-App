import React from "react";
import Proforma from "./Proforma.jsx";

const ProformaModal = ({ isOpen, toggleProforma }) => {
  const closeModal = () => {
    toggleProforma();
  };

  if (!isOpen) return null;

  return (
    <div className="proforma_modal">
      <div className="proforma_modal-overlay " onClick={closeModal}></div>
      <div className="proforma_modal-content">
        <Proforma />
      </div>
    </div>
  );
};

export default ProformaModal;
