import React from "react";
import { Link } from "react-router-dom";
import { IoCloseCircle } from "react-icons/io5";
import logo from "../../../assets/images/adminLogo.png";
import "../../Accounting/Account.css";

const Notifications = () => {
    // Mock data
  const notifications = [1, 2, 3, 4]; 

  return (
    <div className="bg-white vh-100 d-flex flex-column">
      <div className="px-5 py-3 d-flex justify-content-between align-items-center mb-5">
         <Link to="/payment">
             <img src={logo} alt="pm logo" className="logo-acc" />
        </Link>
        <h2 className="text-primary fw-bold text-uppercase m-0">NOTIFICATIONS</h2>
        <Link to="/payment">
             <IoCloseCircle size={40} className="text-primary" />
        </Link>
      </div>

      <div className="container px-5">
          <div className="d-flex flex-column gap-3">
              {notifications.map((n) => (
                   <Link to={`/payment/notifications/${n}`} key={n} className="text-decoration-none">
                        <div className="bg-primary-subtle bg-opacity-10 p-4 rounded-0 d-flex justify-content-between align-items-end">
                            <div>
                                <h5 className="fw-bold text-primary mb-3">PAYSTACK</h5>
                                <p className="text-secondary m-0 fw-light">Subject: Payment issue RESOLVED</p>
                            </div>
                            <span className="text-secondary fw-light">more...</span>
                        </div>
                   </Link>
              ))}
          </div>
      </div>
    </div>
  );
};

export default Notifications;
