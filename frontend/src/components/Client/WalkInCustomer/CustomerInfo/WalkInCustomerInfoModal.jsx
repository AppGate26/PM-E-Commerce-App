import React, { useEffect } from "react";
import WalkInCustomerInfo from "./WalkInCustomerInfo";
import "./WalkInCustomerInfo.css";

const WalkInCustomerInfoModal = ({ isOpen, toggleWalkInCustomerInfoModal }) => {
  const closeModal = () => {
    toggleWalkInCustomerInfoModal();
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="client-navTab_modal">
      <div
        className="client-navTab_modal-overlay"
        onClick={closeModal}
      ></div>

      <div className="customer-info-modal-content walkin-info-modal-content">
        <WalkInCustomerInfo onClose={closeModal} />
      </div>
    </div>
  );
};

export default WalkInCustomerInfoModal;
