import React from "react";
import { Link } from "react-router-dom";

const CashierBackButton = ({ to, onClick, label = "Back" }) => {
  if (to) {
    return (
      <Link to={to} className='cashier-back-btn'>
        <span className='cashier-back-icon' aria-hidden='true'>
          ←
        </span>
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <button type='button' className='cashier-back-btn' onClick={onClick}>
      <span className='cashier-back-icon' aria-hidden='true'>
        ←
      </span>
      <span>{label}</span>
    </button>
  );
};

export default CashierBackButton;

