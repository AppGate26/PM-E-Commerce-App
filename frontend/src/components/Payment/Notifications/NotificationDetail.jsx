import React from "react";
import { Link, useParams } from "react-router-dom";
import { IoCloseCircle } from "react-icons/io5";
import logo from "../../../assets/images/adminLogo.png";
import "../../Accounting/Account.css";

const NotificationDetail = () => {
  const { id } = useParams();

  return (
    <div className="bg-white vh-100 d-flex flex-column">
      <div className="px-5 py-3 d-flex justify-content-between align-items-center mb-5">
         <Link to="/payment">
             <img src={logo} alt="pm logo" className="logo-acc" />
        </Link>
        <h2 className="text-primary fw-bold text-uppercase m-0">NOTIFICATIONS</h2>
        <Link to="/payment/notifications">
             <IoCloseCircle size={40} className="text-primary" />
        </Link>
      </div>

      <div className="container px-5">
          <div className="ps-0 ps-md-5">
              <h5 className="fw-bold text-primary mb-4">PAYSTACK</h5>
              
              <div className="text-secondary fw-light fs-5">
                  <p className="mb-4 text-dark">Subject: Payment issue RESOLVED</p>
                  <p className="mb-4">[Transaction #12345]</p>
                  <p className="mb-4">From: support@paystack.com</p>
                  <p className="mb-4">To: Peaceofmind@gmail.com</p>
                  
                  <div className="mt-5">
                      <p className="mb-4">Hi PM,</p>
                      <p className="mb-4">
                          We’re pleased to inform you that the dispute regarding transaction #12345 (amount ₦ 1,000,000) has been resolved.
                      </p>
                  </div>

                  <div className="mt-5">
                      <p className="mb-2">Details:</p>
                      <ul className="list-unstyled ps-3">
                          <li className="mb-1">· Transaction Reference: 12345</li>
                          <li className="mb-1">· Customer: John Doe</li>
                          <li className="mb-1">· Date: 2025-11-04</li>
                          <li className="mb-1">· Issue: Chargeback claim – “Value not received”</li>
                           <li className="mb-1">· Resolution: The bank has accepted the evidence you provided and the funds will be (or have been) returned to you / deducted from your account.</li>
                      </ul>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default NotificationDetail;
