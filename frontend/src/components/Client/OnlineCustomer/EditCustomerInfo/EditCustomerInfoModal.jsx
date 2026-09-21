import React from "react";
import "./EditCustomerInfo.css";
import EditCustomerInfo from "./EditCustomerInfo";

const EditCustomerInfoModal = ({ isOpen, customerId, customerData, onClose, onUpdateSuccess }) => {
  const closeModal = () => {
    if (onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="client-navTab_modal">
      <div className="client-navTab_modal-overlay" onClick={closeModal}></div>
      <div className="edit-modal-content">
        <EditCustomerInfo 
          customerId={customerId}
          customerData={customerData}
          onClose={closeModal}
          onUpdateSuccess={onUpdateSuccess}
        />
      </div>
    </div>
  );
};

export default EditCustomerInfoModal;
