import React from "react";
import Dnt from "./Dnt";

const DntModal = ({ isOpen, toggleDntModal }) => {
  const closeModal = () => {
    toggleDntModal();
  };

  if (!isOpen) return null;

  return (
    <div className="Csh_modal">
      <div className="Csh_modal-overlay " onClick={closeModal}></div>
      <div className="Csh_modal-content">
        <Dnt  toggleDntModal={toggleDntModal}/>
      </div>
    </div>
  );
};

export default DntModal;
