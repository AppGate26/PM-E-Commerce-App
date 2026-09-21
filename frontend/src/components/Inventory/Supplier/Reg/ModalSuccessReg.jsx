import React from "react";
import logo from "../../../../assets/images/adminLogo.png";
import { Link } from "react-router-dom";

const ModalSuccessReg = ({ isOpen, toggleModalSuccessReg, setModalSuccess }) => {
  if (!isOpen) return null;

  return (
    <div className="success_modal">
      <div
        className="success_modal-overlay "
        onClick={toggleModalSuccessReg || setModalSuccess}
      ></div>
      <div className="success_modal-content ">
        <div className="modal-success-txt">
          <img src={logo} alt="logo" className="success-logo" />
          <div className="">
            <p className="text-success">SUPPLIER SENT</p>
            <h1 className="msg-success">FOR APPROVAL</h1>
          </div>
          <div className="icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="23"
              height="23"
              fill="#fff"
              className="bi bi-check-lg check-reg-icon"
              viewBox="0 0 16 16"
            >
              <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z" />
            </svg>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: "2rem", padding: "0 2rem" }}>
          <p style={{ fontSize: "1.1rem", color: "#666", marginBottom: "1.5rem" }}>
            The supplier registration is waiting for admin approval:
            <br />
            <strong style={{ color: "#0867db" }}>
              Admin - Approvals - Supplier Reg Approval
            </strong>
          </p>
          <Link
            to="/admin/approvals/supplier-reg"
            className="btn btn-primary"
            onClick={() => {
              if (toggleModalSuccessReg) toggleModalSuccessReg();
              if (setModalSuccess) setModalSuccess(false);
            }}
            style={{
              textDecoration: "none",
              padding: "0.8rem 2rem",
              fontSize: "1.1rem",
              fontWeight: "600",
              textTransform: "uppercase",
            }}
          >
            View Approval
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ModalSuccessReg;
