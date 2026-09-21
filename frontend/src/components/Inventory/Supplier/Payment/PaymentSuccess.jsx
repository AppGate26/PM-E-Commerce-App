import React from "react";
import "./PaymentSuccess.css";
import PMlogo from "../../../../assets/images/PMlogo.png";

const PaymentSuccess = ({ isOpen, togglePaymentSuccess }) => {
  if (!isOpen) return null;
 
  return (
    <div className="payment-success-overlay">
      <div className="payment-success-card">
        {/* Logo */}
        <img src={PMlogo} alt="Logo" className="payment-success-logo" />
        
        {/* Text Content */}
        <div className="payment-success-text">
          <p className="payment-success-saved">SAVED</p>
          <p className="payment-success-successfully">SUCCESSFULLY</p>
        </div>
        
        {/* Checkmark Icon */}
        <div className="payment-success-checkmark">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="8 12 11 15 16 9"></polyline>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;