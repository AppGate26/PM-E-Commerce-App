import React from "react";
import RbDisplay from "./RbDisplay";

const RbDisplayModal = ({ isOpen, toggleRbdModal }) => {
  const closeModal = () => {
    toggleRbdModal();
  };

  if (!isOpen) return null;

  return (
    <div className="Rbd_modal" style={{zIndex:'1000'}}>
      <div className="Rbd_modal-overlay " onClick={closeModal}></div>
      <div className="Rbd_modal-content">
        <RbDisplay toggleRbdModal={toggleRbdModal}/>
      </div>
    </div>
  );
};

export default RbDisplayModal;
