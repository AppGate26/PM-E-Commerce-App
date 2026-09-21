import React from "react";
import SuspendCus from "./SuspendCus";

const SuspendCusModal = ({ isOpen, toggleSupCusModal }) => {
  const closeModal = () => {
    toggleSupCusModal();
  };

  if (!isOpen) return null;

  return (
    <div className="client-navTab_modal">
      <div className="client-navTab_modal-overlay " onClick={closeModal}></div>
      <div className="client-navTab_modal-content">
        <SuspendCus toggleSupCusModal={toggleSupCusModal}/>
      </div>
    </div>
  );
};

export default SuspendCusModal;
