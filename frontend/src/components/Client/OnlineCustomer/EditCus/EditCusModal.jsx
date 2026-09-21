import React from "react";
import EditCus from "./EditCus";

const EditCusModal = ({ isOpen, toggleEditCus }) => {
  const closeModal = () => {
    toggleEditCus();
  };

  if (!isOpen) return null;

  return (
    <div className="client_modal">
      <div className="client_modal-overlay " onClick={closeModal}></div>
      <div className="client_modal-content">
        <EditCus toggleEditCus={toggleEditCus}/>
      </div>
    </div>
  );
};

export default EditCusModal;
