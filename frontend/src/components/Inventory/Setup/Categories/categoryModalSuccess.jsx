import React from "react";

const CategoryModalSuccess = ({ isOpen, setModalSuccess }) => {
  if (!isOpen) return null;

  console.log("CategoryModalSuccess: Modal is open, displaying success message");

  return (
    <div className="cat-success_modal">
      <div
        className="cat-success_modal-overlay"
        onClick={() => {
          console.log("CategoryModalSuccess: Overlay clicked, closing modal");
          setModalSuccess(false);
        }}
      ></div>
      <div className="cat-success_modal-content">
        <div className="cat-modal-success-txt">
          <div className="cat-success-left">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="80"
              height="80"
              fill="#0867db"
              viewBox="0 0 24 24"
              className="cart-icon-success"
            >
              <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
            <div className="delete-x-mark-small">×</div>
          </div>
          <div className="cat-success-text">
            <p className="cat-text-success">CATEGORY ADDED</p>
            <h1 className="cat-msg-success">SUCCESSFULLY</h1>
          </div>
          <div className="cat-success-check">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              fill="white"
              viewBox="0 0 16 16"
            >
              <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryModalSuccess;
