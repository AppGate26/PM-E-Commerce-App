// Pm\src\components\Client\WalkInCustomer\EditWalkInCustomerInfo\EditWalkInCustomerInfoModal.jsx
import React from "react";
import "./EditWalkInCustomerInfo.css";
import EditWalkInCustomerInfo from "./EditWalkInCustomerInfo";

const EditWalkInCustomerInfoModal = ({ isOpen, customerId, customerData, onClose, onUpdateSuccess }) => {
  if (!isOpen) return null;

  return (
    <div className="client-navTab_modal">
      <div className="client-navTab_modal-overlay" onClick={onClose}></div>
      <div className="edit-modal-content">
        <EditWalkInCustomerInfo
          customerId={customerId}
          customerData={customerData}
          onClose={onClose}
          onUpdateSuccess={onUpdateSuccess}
        />
      </div>
    </div>
  );
};

export default EditWalkInCustomerInfoModal;
