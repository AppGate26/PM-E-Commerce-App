import React from "react";
import RiderBox from "./RiderBox";

const RiderBoxModal = ({ isOpen, toggleBoxModal, selectedRiderId }) => {
  const closeModal = () => {
    toggleBoxModal();
  };

  if (!isOpen) return null;

  return (
    <div className="Csh_modal riderbox-standard-modal">
      <div className="Csh_modal-overlay " onClick={closeModal}></div>
      <div className="Csh_modal-content riderbox-standard-modal-content">
        <RiderBox toggleBoxModal={toggleBoxModal} selectedRiderId={selectedRiderId} />
      </div>
    </div>
  );
};

export default RiderBoxModal;
