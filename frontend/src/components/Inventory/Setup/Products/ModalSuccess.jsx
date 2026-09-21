import React from "react";
import logo from "../../../../assets/images/adminLogo.png";

const ModalSuccess = ({ isOpen, toggleModalSuccess }) => {
  if (!isOpen) return null;

  return (
    <div className="success_modal " id="sm-success-modal">
      <div
        className="success_modal-overlay "
        onClick={toggleModalSuccess}
      ></div>
      <div className="success_modal-content " id="sm-success-modal-content">
        <div className="modal-success-txt" id="sm-modal-txt">
          <img
            src={logo}
            alt="logo"
            className="success-logo"
            id="sm-success-logo"
          />
          <div className="">
            <p className="text-success " id="sm-text-success">
              PRODUCT ADDED
            </p>
            <h1 className="msg-success" id="msg-succ">
              SUCCESSFULLY
            </h1>
          </div>
          <div className="icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="26"
              height="26"
              fill="#fff"
              className="bi bi-check-lg checked-icon"
              viewBox="0 0 16 16"
            >
              <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}; 
 
export default ModalSuccess;  
 