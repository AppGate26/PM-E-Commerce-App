import React from "react";
import { FiMenu } from "react-icons/fi";
import { IoClose } from "react-icons/io5";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { isFeatureDenied } from "../../lib/featureAccess";

const AccDashboard = () => {
  const { deniedFeatures } = useAuth();
  const denied = (featureKey) => isFeatureDenied(featureKey, deniedFeatures);

  return (
    <div>
      <button
        className="btn btn-primary acc-menubar"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#offcanvasExample"
        aria-controls="offcanvasExample"
      >
        <FiMenu size="34px" />
      </button>

      <div
        className="offcanvas offcanvas-start offcanvas-accounting"
        tabIndex="-1"
        id="offcanvasExample"
        aria-labelledby="offcanvasExampleLabel"
      >
        <div className="offcanvas-header bg-offcanvas-header text-white d-flex justify-content-between align-items-center">
          <h4 className="offcanvas-title" id="offcanvasExampleLabel">
            Accounting
          </h4>
          <div className="">
            <IoClose
              data-bs-dismiss="offcanvas"
              aria-label="Close"
              size="30px"
            />
          </div>
        </div>
        <div className="offcanvas-body bg-white">
          <ul className="accounting-ul-dashboard">
            <Link to="/Accounting" className="text-dark text-decoration-none">
              <li>DASHBOARD</li>
            </Link>
            {denied("accounting.setup") ? null : (
              <Link
                to="/Accounting/Setup"
                className="text-dark text-decoration-none"
              >
                <li>SET UP</li>
              </Link>
            )}
            {denied("accounting.transaction") ? null : (
              <Link
                to="/Accounting/Transaction"
                className="text-dark text-decoration-none"
              >
                <li>TRANSACTION</li>
              </Link>
            )}
            {denied("accounting.transactionview") ? null : (
              <Link
                to="/Accounting/TransactionView"
                className="text-dark text-decoration-none"
              >
                <li>TRANSACTION-VIEWS</li>
              </Link>
            )}
            {denied("accounting.reports") ? null : (
              <Link
                to="/Accounting/Reports"
                className="text-dark text-decoration-none"
              >
                <li>REPORT</li>
              </Link>
            )}
            {denied("accounting.staffpayroll") ? null : (
              <Link
                to="/Accounting/StaffPayroll"
                className="text-dark text-decoration-none"
              >
                <li>STAFF PAYROLL</li>
              </Link>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AccDashboard;
