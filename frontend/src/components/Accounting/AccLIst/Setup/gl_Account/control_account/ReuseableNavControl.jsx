import React from "react";
import logo from "../../../../../../assets/images/adminLogo.png";
import { Link } from "react-router-dom";
import { TfiMenu } from "react-icons/tfi";
import { IoIosCloseCircleOutline } from "react-icons/io";
const ReuseableNavControl = ({ title = "Title" }) => {
  return (
    <div>
      <nav className="bg-primary d-flex align-items-center justify-content-between px-5 py-3 sm-rm-px-nav-acc">
        <Link to="/adminDashboard">
          <img src={logo} alt="pm logo" className="logo-acc" />
        </Link>
        <h2 className="text-white text-uppercase fw-semibold text-nav-chart-h2 text-nav-chart-h2-sm ">
          Control Account
          <span
            className="mx-5"
            style={{ fontSize: "38px", fontWeight: "200" }}
          >
            |
          </span>
          {/* Display the tab name here */}
          {title}
        </h2>
        <Link to="/">
          <button
            className="Log_Out-btn cl-log-out rm-acc-logout"
            id="Log_Out-btn-sm"
          >
            Log Out
          </button>
        </Link>

        <button
          style={{ margin: "0px" }}
          className="btn btn-primary acc-menubar rm__acc-menubar "
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#offcanvasExample2"
          aria-controls="offcanvasExample2"
        >
          <TfiMenu size="28px" />
        </button>
      </nav>
      <div
        className="offcanvas offcanvas-end"
        tabIndex="-1"
        id="offcanvasExample2"
        aria-labelledby="offcanvasExampleLabel"
      >
        <div className="offcanvas-header d-flex justify-content-between bg-primary">
          <div className="">
            <IoIosCloseCircleOutline
              size="40px"
              color="#ffffffde"
              data-bs-dismiss="offcanvas"
              data-bs-target="#offcanvasResponsive"
              aria-label="Close"
            />
          </div>
          <Link to="/adminDashboard">
            <img
              src={logo}
              alt="logo"
              style={{ width: "40px", height: "40px" }}
            />
          </Link>
        </div>
        <div className="offcanvas-body">
          <ul className="accounting-ul-dashboard">
            <Link to="/Accounting" className="text-dark text-decoration-none">
              <li>DASHBOARD</li>
            </Link>

            <li className="">
              <div className="accordion" id="accordionExample">
                <div className="accordion-item">
                  <h2 className="accordion-header ">
                    <button
                      className="p-2 accordion-button accounting-setup-accordion"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapseOne"
                      aria-expanded="true"
                      aria-controls="collapseOne"
                    >
                      <Link
                        to="/Accounting/Setup"
                        className="text-dark text-decoration-none "
                        onClick={(e) => e.stopPropagation()}
                        data-bs-dismiss="offcanvas"
                      >
                        SET UP
                      </Link>
                    </button>
                  </h2>
                  <div
                    id="collapseOne"
                    className="accordion-collapse collapse show"
                    data-bs-parent="#accordionExample"
                  >
                    <div className="accordion-body p-0">
                      <div className="btn-group dropend">
                        <button
                          type="button"
                          className="btn fs-5 fw-semibold py-3 dropdown-toggle setup-split-dropdown"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                        >
                          GL ACCOUNT SETUP
                        </button>
                        <ul className="dropdown-menu gl-setup-acc-split-dd">
                          <li>
                            <Link
                              to="/AccountType"
                              className="text-decoration-none text-dark"
                            >
                              account type
                            </Link>
                          </li>
                          <li>control account</li>

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
                              account Details
                            </Link>
                          </li>
                        </ul>
                      </div>
                      <br />

                      <div className="btn-group dropend gl-setup-acc-split-dd">
                        <button
                          type="button"
                          className="btn fs-5 fw-semibold py-3 dropdown-toggle setup-split-dropdown"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                        >
                          PERCENTAGE SETUP
                        </button>
                        <ul className="dropdown-menu">
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
                    </div>
                  </div>
                </div>
              </div>
            </li>
            <li>TRANSACTION</li>
            <li>TRANSACTION-VIEWS</li>
            <li>REPORT</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReuseableNavControl;
