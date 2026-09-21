import React, { useEffect } from "react";
import RegCustomer from "./RegCustomer";
import "./RegCustomer.css";

const RegCusModal = ({ isOpen, toggleRegCusModal }) => {
  const closeModal = () => {
    toggleRegCusModal();
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
    <div className="reg-cus-modal">
      <div className="reg-cus-modal-overlay" onClick={closeModal}></div>
      <div className="reg-cus-modal-content">
        <RegCustomer toggleRegCusModal={toggleRegCusModal}/>
      </div>
    </div>
  );
};

export default RegCusModal;