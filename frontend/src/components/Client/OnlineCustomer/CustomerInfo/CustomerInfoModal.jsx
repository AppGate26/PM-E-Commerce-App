// Pm\src\components\Client\OnlineCustomer\CustomerInfo\CustomerInfoModal.jsx
import React from "react";
import CustomerInfo from "./CustomerInfo";

const CustomerInfoModal = ({ isOpen, toggleCustomerInfoModal }) => {
  const closeModal = () => {
    toggleCustomerInfoModal();
  };

  if (!isOpen) return null;

  return (
    <div className="client-navTab_modal">
      {/* Full dark overlay */}
      <div
        className="client-navTab_modal-overlay"
        onClick={closeModal}
      ></div>

      {/* Centered modal content - exact size and positioning as Figma */}
      <div className="customer-info-modal-content">
        <CustomerInfo />
      </div>
    </div>
  );
};

export default CustomerInfoModal;