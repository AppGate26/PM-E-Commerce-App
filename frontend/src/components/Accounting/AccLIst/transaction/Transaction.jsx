import React from "react";
import "../../Account.css";
import logo from "../../../../assets/images/adminLogo.png";
import { Link } from "react-router-dom";
import fig from "../../../../assets/images/online-transactions.png";
import AccDashboard from "../../AccDashboard";

const Transaction = () => {
  return (
    <div>
      <nav className="bg-primary d-flex align-items-center justify-content-between  px-5">
        <Link to="/adminDashboard">
          <img src={logo} alt="pm logo" className="logo-acc" />
        </Link>

        <div className="d-flex">
          <div className="dropdown-center acc-dropdown-link">
            <button
              className="btn text-white dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              JOURNAL
            </button>
            <ul className="dropdown-menu">
              <li>
                <Link
                  to="/Accounting/JournalEntry"
                  className="text-decoration-none text-dark"
                >
                  Journal Entry
                </Link>
              </li>
              <li>
                <Link
                  to="/Accounting/JournalEdit"
                  className="text-decoration-none text-dark"
                >
                  Journal Edit
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
              TRANSFERS
            </button>
            <ul className="dropdown-menu">
              <li>
                <Link
                  to="/Accounting/FundTransfers"
                  className="text-decoration-none text-dark"
                >
                  Fund transfers
                </Link>
              </li>
              <li>
                <Link
                  to="/Accounting/TransactionView"
                  className="text-decoration-none text-dark"
                >
                  Transaction View
                </Link>
              </li>
              <li>
                <Link
                  to="/Accounting/TransactionByAccount"
                  className="text-decoration-none text-dark"
                >
                  Transaction by Account
                </Link>
              </li>
            </ul>
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
            <h1>TRANSACTIONS</h1>
          </div>
          <img src={fig} alt="online transactions" className="" />
        </div>
      </div>
    </div>
  );
};

export default Transaction;
