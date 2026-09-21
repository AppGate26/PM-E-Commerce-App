// Pm\src\components\Client\WalkInCustomer\WalkSuspend\WalkInSupModal.jsx
import React, { useEffect } from "react";
import WalkInSupCus from "./WalkInSupCus";
import "./WalkInSupCus.css";

const WalkInSupModal = ({ isOpen, toggleWalkInSupModal }) => {
  const closeModal = () => {
    toggleWalkInSupModal();
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="walkin-sup-modal-wrapper">
      {/* Dark Overlay */}
      <div className="walkin-sup-modal-overlay" onClick={closeModal}></div>

      {/* Centered Modal Content */}
      <div className="walkin-sup-modal-content">
        <WalkInSupCus toggleWalkInSupModal={toggleWalkInSupModal} />
      </div>
    </div>
  );
};

export default WalkInSupModal;