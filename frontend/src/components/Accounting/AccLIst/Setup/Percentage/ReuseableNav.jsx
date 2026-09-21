import React from "react";
import "../../../Account.css";
import logo from "../../../../../assets/images/adminLogo.png";
import { Link } from "react-router-dom";

const ReuseableNav = ({ title = "Title" }) => {
  return (
    <div>
      <nav className="bg-primary d-flex align-items-center justify-content-between px-5 py-3">
        <Link to="/adminDashboard">
          <img src={logo} alt="pm logo" className="logo-acc" />
        </Link>
        <h2 className="text-white text-uppercase fw-semibold">{title}</h2>
        <Link to="/">
          <button className="Log_Out-btn cl-log-out" id="Log_Out-btn-sm">
            Log Out
          </button>
        </Link>
      </nav>
    </div>
  );
};

export default ReuseableNav;
