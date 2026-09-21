import React from "react";
import "../../Account.css";
import logo from "../../../../assets/images/adminLogo.png";
import { Link } from "react-router-dom";
import fig from "../../../../assets/images/setup.png";
import AccDashboard from "../../AccDashboard";
const AccSetup = () => {
  return (
    <div>
      <nav className="bg-primary d-flex align-items-center justify-content-between  px-5">
        <Link to="/adminDashboard">
          <img src={logo} alt="pm logo" className="logo-acc" />
        </Link>

        <div className="d-flex">
          <div className="dropdown-center acc-dropdown-link ">
            <button
              className="btn text-white dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              GL ACCOUNT SETUP
            </button>
            <ul className="dropdown-menu ">
              <li>
                <Link
                  to="/AccountType"
                  className="text-decoration-none text-dark"
                >
                  account type
                </Link>
              </li>
              <li>
                <Link
                  to="/Control_Account"
                  className="text-decoration-none text-dark"
                >
                  control account
                </Link>
              </li>
              <li>
                <Link
                  to="/chartAccount"
                  className="text-decoration-none text-dark"
                >
                  chart of account
                </Link>
              </li>
              <li>
                <Link
                  to="/account-details"
                  className="text-decoration-none text-dark"
                >
                  account details
                </Link>
              </li>
            </ul>
          </div>
          <div className="dropdown-center acc-dropdown-link">
            <button
              className="btn text-white dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              PERCENTAGE SETUP
            </button>
            <ul className="dropdown-menu ">
              <li>
                <Link
                  to="/LoanPercentage-setup"
                  className="text-decoration-none text-dark"
                >
                  loan % set up
                </Link>
              </li>
              <li>
                <Link
                  to="/discount-setup"
                  className="text-decoration-none text-dark"
                >
                  discount set-up
                </Link>
              </li>
              <li>
                <Link
                  to="/delivery-setup"
                  className="text-decoration-none text-dark"
                >
                  delivery set-up
                </Link>
              </li>
            </ul>
          </div>
          <div className="acc-dropdown-link">
            <Link
              to="/Accounting/StaffPayroll"
              className="btn text-white text-decoration-none"
            >
              STAFF PAYROLL
            </Link>
          </div>
        </div>

        <Link to="/">
          <button className="Log_Out-btn cl-log-out" id="Log_Out-btn-sm">
            Log Out
          </button>
        </Link>
      </nav>

      <div className=" acc-setup-box">
        <div className="  pt-5">
          <AccDashboard />
        </div>
        <div className="acc-setup-box-grid">
          <div className="acc-setup-box-grid-col-1">
            <h2>ACCOUNT</h2>
            <h1>SETUP</h1>
          </div>
          <img src={fig} alt="image stock description" className="" />
        </div>
      </div>
    </div>
  );
};

export default AccSetup;
