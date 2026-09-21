import React from "react";
import "./EditProduct.css";

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="delete-confirm-modal">
      <div className="delete-confirm-overlay" onClick={onClose}></div>
      <div className="delete-confirm-content">
        <div className="delete-confirm-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="80"
            height="80"
            fill="#0867db"
            viewBox="0 0 24 24"
            className="cart-icon-large"
          >
            <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
          <div className="delete-x-mark">×</div>
        </div>
        <h2 className="delete-confirm-title">DELETE PRODUCT?</h2>
        <div className="delete-confirm-buttons">
          <button className="delete-confirm-yes" onClick={onConfirm}>
            YES
          </button>
          <button className="delete-confirm-no" onClick={onClose}>
            NO
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;

































